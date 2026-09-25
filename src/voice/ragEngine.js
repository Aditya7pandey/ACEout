import { LAB_KNOWLEDGE } from './labKnowledge';
import { API_BASE } from './deepgramService';

/**
 * RAG: retrieve the lab's knowledge, hand it to an LLM, answer in its words.
 *
 * There are two routes through here. With `EXPO_PUBLIC_API_BASE_URL` set, the
 * app sends only `{ labId, question }` and the proxy in `server/` owns the
 * prompt, the knowledge and the Gemini key. Without it, the app talks to
 * Gemini directly using a key inlined into the bundle — usable while
 * developing, not safe to ship.
 */

/**
 * Get the Gemini API key safely. Only used on the direct (no-proxy) path.
 */
function getApiKey() {
  const key = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!key) {
    console.warn('Missing EXPO_PUBLIC_GEMINI_API_KEY in .env file');
  }
  return key;
}

/**
 * Ask the assistant about a lab.
 *
 * @param {string} labId - 'incline-work-energy' or 'eye-defects'
 * @param {string} question - The user's question text
 * @returns {Promise<{ answer: string, sources: Array<{id: string, title: string}>, confidence: number }>}
 */
export async function answerQuestion(labId, question) {
  if (API_BASE) return askViaProxy(labId, question);
  return askGeminiDirect(labId, question);
}

async function askViaProxy(labId, question) {
  try {
    const response = await fetch(`${API_BASE}/api/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ labId, question }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error('Proxy /api/ask failed:', response.status, data);
      return {
        answer: data.error || "I'm having trouble reaching the lab assistant right now.",
        sources: [],
        confidence: 0,
      };
    }

    return {
      answer: data.answer,
      sources: data.sources || [],
      confidence: data.confidence ?? 1,
    };
  } catch (error) {
    console.error('Proxy request error:', error);
    return {
      answer: "I can't reach the lab assistant. Please check your internet connection.",
      sources: [],
      confidence: 0,
    };
  }
}

// ---------------------------------------------------------------------------
// Direct-to-Gemini fallback, for running the app without the proxy.
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are a helpful, conversational AI lab assistant for a high school physics virtual lab.
Your job is to answer the student's questions accurately based ONLY on the provided LAB KNOWLEDGE.

Guidelines:
1. Be concise. Keep answers under 3-4 sentences.
2. Be conversational. Your answer will be read aloud via Text-to-Speech, so avoid complex formatting or markdown.
3. If the user asks something outside the scope of the LAB KNOWLEDGE, politely redirect them back to the experiment.
4. Be encouraging and educational.`;

/**
 * Discovered once per session rather than on every question.
 *
 * `ListModels` returns names `generateContent` will refuse — retired ones, plus
 * image/TTS/research models that need a different request shape — so the list
 * is filtered and ranked rather than taken at its word. `-latest` aliases come
 * first because they track Google's current pick and do not go stale.
 *
 * The server does this properly, walking the ranking when a model is retired
 * or overloaded (see server/index.js). This is the shorter version, for
 * running the app without the proxy.
 */
let cachedModel = null;

const NOT_A_CHAT_MODEL =
  /(-tts|-image|transcribe|embedding|customtools|computer-use|robotics|gemma|lyria|nano-banana|antigravity|deep-research|omni)/;

function rankModel(name) {
  if (name === 'models/gemini-flash-latest') return 1e9;
  if (name === 'models/gemini-pro-latest') return 1e8;

  const version = name.match(/gemini-(\d+)(?:\.(\d+))?/);
  if (!version) return 0;

  const score = Number(version[1]) * 1000 + Number(version[2] || 0);
  const flash = name.includes('flash') ? 1e6 : 0;
  const penalty = (name.includes('lite') ? 5e5 : 0) + (name.includes('preview') ? 6e5 : 0);
  return flash + score - penalty;
}

async function askGeminiDirect(labId, question) {
  const apiKey = getApiKey();

  if (!apiKey) {
    return {
      answer: "My AI brain isn't connected yet! Set EXPO_PUBLIC_API_BASE_URL to the proxy, or add a Gemini key to .env.",
      sources: [],
      confidence: 0,
    };
  }

  // Every lab has around ten chunks, so the whole base fits in the context
  // window — retrieval scoring would only risk dropping the relevant one.
  const chunks = LAB_KNOWLEDGE[labId] || [];
  const sources = chunks.map((c) => ({ id: c.id, title: c.title }));
  const context = chunks.map((c) => `### ${c.title}\n${c.content}`).join('\n\n');

  const prompt = `${SYSTEM_PROMPT}

=== LAB KNOWLEDGE ===
${context}
=====================

User Question: ${question}`;

  try {
    if (!cachedModel) {
      const modelsRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
      );
      const modelsData = await modelsRes.json();
      if (!modelsRes.ok) throw new Error(modelsData.error?.message || 'Failed to list models');

      const usable = (modelsData.models || [])
        .filter((m) => m.supportedGenerationMethods?.includes('generateContent'))
        .map((m) => m.name)
        .filter((name) => name.startsWith('models/gemini') && !NOT_A_CHAT_MODEL.test(name))
        .sort((a, b) => rankModel(b) - rankModel(a));

      if (!usable.length) {
        return {
          answer: 'No compatible Gemini model is available for this API key.',
          sources: [],
          confidence: 0,
        };
      }
      cachedModel = usable[0];
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${cachedModel}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // On Gemini 2.5 and later the model's internal reasoning is billed
        // against `maxOutputTokens` too. At the 150 this used to be, thinking
        // ate the whole budget and the student got half a sentence. Switching
        // thinking off also takes the answer from ~10s to ~2s, which for a
        // spoken reply is the difference between a conversation and a wait.
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 800,
            thinkingConfig: { thinkingBudget: 0 },
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok || data.error) {
      console.error('Gemini API error:', JSON.stringify(data, null, 2));
      // A model that worked yesterday may have been retired; re-discover next time.
      cachedModel = null;
      return {
        answer: `Gemini error: ${data.error?.message || `HTTP ${response.status}`}`,
        sources: [],
        confidence: 0,
      };
    }

    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!answer) {
      return { answer: 'Gemini returned an empty response.', sources: [], confidence: 0 };
    }

    return { answer, sources, confidence: 1 };
  } catch (error) {
    console.error('LLM generation error:', error);
    return {
      answer: "I'm having trouble connecting right now. Please check your internet connection.",
      sources: [],
      confidence: 0,
    };
  }
}
