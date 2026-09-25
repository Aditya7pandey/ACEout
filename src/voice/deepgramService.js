import { Platform } from 'react-native';

// Handle Expo SDK 54+ file system changes and support Web vs Native
let FileSystem;
if (Platform.OS !== 'web') {
  try {
    FileSystem = require('expo-file-system/legacy');
  } catch (e) {
    FileSystem = require('expo-file-system');
  }
}

const DEEPGRAM_API_URL = 'https://api.deepgram.com/v1';

/**
 * The voice proxy in `server/`, if one is configured.
 *
 * When it is, the app never sees an API key: it posts audio to `/api/stt` and
 * text to `/api/tts` and the proxy holds the credentials. When it is not, the
 * calls go straight to Deepgram with `EXPO_PUBLIC_DEEPGRAM_API_KEY` — which is
 * fine on a laptop and wrong in a shipped APK, because `EXPO_PUBLIC_*` values
 * are inlined into the bundle and can be read out of it.
 */
export const API_BASE = (process.env.EXPO_PUBLIC_API_BASE_URL || '').replace(/\/$/, '');

let warnedAboutDirect = false;

function usingProxy() {
  if (!API_BASE && !warnedAboutDirect) {
    warnedAboutDirect = true;
    console.warn(
      '[voice] EXPO_PUBLIC_API_BASE_URL is not set — calling Deepgram directly with a bundled key. ' +
      'Do not ship a build like this; start the proxy in server/ and point the app at it.'
    );
  }
  return Boolean(API_BASE);
}

/**
 * Get the API key safely. Only used on the direct (no-proxy) path.
 */
function getApiKey() {
  const key = process.env.EXPO_PUBLIC_DEEPGRAM_API_KEY;
  if (!key) {
    console.warn('Missing EXPO_PUBLIC_DEEPGRAM_API_KEY in .env file');
  }
  return key;
}

/**
 * Deepgram sniffs the container, but it rejects a Content-Type it does not
 * recognise — and `audio/m4a` is not one of them. expo-av's HIGH_QUALITY preset
 * writes an MPEG-4 container on both platforms, so the extension is the honest
 * signal here.
 */
function audioTypeForUri(uri) {
  const ext = (uri.split('?')[0].split('.').pop() || '').toLowerCase();
  switch (ext) {
    case 'm4a':
    case 'mp4':
      return 'audio/mp4';
    case 'caf':
      return 'audio/x-caf';
    case '3gp':
      return 'audio/3gpp';
    case 'amr':
      return 'audio/amr';
    case 'wav':
      return 'audio/wav';
    case 'webm':
      return 'audio/webm';
    case 'ogg':
      return 'audio/ogg';
    default:
      return 'audio/mp4';
  }
}

/**
 * Read a fetched Blob back as base64.
 *
 * React Native has no `Buffer` and its `Response.arrayBuffer()` is unreliable
 * across engines, but `FileReader.readAsDataURL` is implemented natively on
 * both platforms — so this is the portable way to get binary response bytes
 * onto disk.
 */
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error || new Error('Could not read the audio response.'));
    reader.onloadend = () => {
      const result = String(reader.result || '');
      const comma = result.indexOf(',');
      // readAsDataURL yields `data:audio/mpeg;base64,<payload>`
      resolve(comma === -1 ? result : result.slice(comma + 1));
    };
    reader.readAsDataURL(blob);
  });
}

/** Pull a useful message out of the proxy's JSON error shape. */
async function describeFailure(response) {
  const body = await response.text().catch(() => '');
  try {
    return JSON.parse(body).error || body;
  } catch {
    return body;
  }
}

/**
 * Check if the device has internet connectivity.
 *
 * This gates the "Ask AI" button, so a false negative hides the feature
 * entirely — hence the generous timeout. With a proxy configured the question
 * that actually matters is whether the proxy is reachable, not whether the
 * wider internet is, so that is what gets checked.
 */
export async function checkOnline() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    if (API_BASE) {
      const res = await fetch(`${API_BASE}/health`, { signal: controller.signal });
      clearTimeout(timeoutId);
      return res.ok;
    }

    // `mode` is a fetch-spec concept the native networking stack ignores.
    const options = { method: 'HEAD', signal: controller.signal };
    if (Platform.OS === 'web') options.mode = 'no-cors';

    await fetch('https://1.1.1.1', options);
    clearTimeout(timeoutId);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Convert speech audio to text.
 * @param {string} audioUri - URI to the audio file (from expo-av recording)
 * @param {object} options - { language: 'en', model: 'nova-2' }
 * @returns {Promise<{text: string, confidence: number}>}
 */
export async function speechToText(audioUri, options = {}) {
  try {
    const { language = 'en', model = 'nova-2' } = options;
    const proxied = usingProxy();

    const headers = {};
    let url;

    if (proxied) {
      url = `${API_BASE}/api/stt?model=${model}&language=${language}`;
    } else {
      const apiKey = getApiKey();
      if (!apiKey) throw new Error('Deepgram API key is not configured.');
      url = `${DEEPGRAM_API_URL}/listen?model=${model}&language=${language}`;
      headers.Authorization = `Token ${apiKey}`;
    }

    let responseBody;

    if (Platform.OS === 'web') {
      // On Web, audioUri is a blob: URL. We must fetch it into a Blob to POST it.
      const blobRes = await fetch(audioUri);
      const audioBlob = await blobRes.blob();

      const uploadRes = await fetch(url, {
        method: 'POST',
        headers: {
          ...headers,
          // MediaRecorder picks the container: WebM on Chrome/Firefox, MP4 on Safari.
          'Content-Type': audioBlob.type || 'audio/webm',
        },
        body: audioBlob,
      });

      if (!uploadRes.ok) {
        throw new Error(`Upload failed: ${uploadRes.status} ${await describeFailure(uploadRes)}`);
      }
      responseBody = await uploadRes.text();
    } else {
      // On Native, FileSystem streams the file as a raw binary body — plain
      // fetch cannot send a file path as one.
      const uploadResult = await FileSystem.uploadAsync(url, audioUri, {
        httpMethod: 'POST',
        uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
        headers: {
          ...headers,
          'Content-Type': audioTypeForUri(audioUri),
        },
      });

      if (uploadResult.status < 200 || uploadResult.status >= 300) {
        throw new Error(`Upload failed: ${uploadResult.status} ${uploadResult.body}`);
      }
      responseBody = uploadResult.body;
    }

    const data = JSON.parse(responseBody);

    // The proxy already flattens Deepgram's envelope; a direct call has not.
    if (typeof data.text === 'string') {
      return { text: data.text, confidence: data.confidence || 0 };
    }

    const best = data.results?.channels?.[0]?.alternatives?.[0];
    return { text: best?.transcript || '', confidence: best?.confidence || 0 };
  } catch (error) {
    console.error('speechToText error:', error);
    throw new Error(`Failed to convert speech to text: ${error.message}`);
  }
}

/**
 * Convert text to speech. Returns a local file URI (native) or a blob URI
 * (web) that expo-av can play.
 *
 * Note for the native path: `FileSystem.downloadAsync` cannot fetch this. Its
 * `DownloadOptions` carry only `headers`, `md5`, `cache` and `sessionType` —
 * the native module builds an OkHttp `Request` from the URL and headers alone,
 * so an `httpMethod`/`body` passed to it is silently dropped and the endpoint
 * is hit with a bodyless GET. Hence: POST with `fetch`, then write the bytes
 * down ourselves.
 *
 * @param {string} text - The text to speak
 * @param {object} options - { model: 'aura-asteria-en' }
 * @returns {Promise<string>} URI of the generated mp3
 */
export async function textToSpeech(text, options = {}) {
  try {
    const { model = 'aura-asteria-en' } = options;
    const proxied = usingProxy();

    let url;
    let headers = { 'Content-Type': 'application/json' };
    let body;

    if (proxied) {
      url = `${API_BASE}/api/tts`;
      body = JSON.stringify({ text, model });
    } else {
      const apiKey = getApiKey();
      if (!apiKey) throw new Error('Deepgram API key is not configured.');
      url = `${DEEPGRAM_API_URL}/speak?model=${model}&encoding=mp3`;
      headers.Authorization = `Token ${apiKey}`;
      body = JSON.stringify({ text });
    }

    const response = await fetch(url, { method: 'POST', headers, body });

    if (!response.ok) {
      throw new Error(`TTS failed: ${response.status} ${await describeFailure(response)}`);
    }

    const blob = await response.blob();

    if (Platform.OS === 'web') {
      return URL.createObjectURL(blob);
    }

    // expo-av will not play a blob on native, so the mp3 has to land in the cache.
    const base64 = await blobToBase64(blob);
    const fileUri = `${FileSystem.cacheDirectory}tts_${Date.now()}.mp3`;
    await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: 'base64' });
    return fileUri;
  } catch (error) {
    console.error('textToSpeech error:', error);
    throw new Error(`Failed to convert text to speech: ${error.message}`);
  }
}
