/**
 * Voice AI Module — barrel export.
 *
 * This module provides a voice-based AI lab assistant that uses:
 *   - RAG (Retrieval Augmented Generation) for grounded, accurate answers
 *   - Deepgram for speech-to-text and text-to-speech
 *   - A local knowledge base covering two labs (incline plane & ray optics eye)
 *
 * The voice assistant is online-only: the Deepgram APIs require network
 * connectivity, so the feature is gated behind a connectivity check and the
 * button only appears when the device is online.
 */

export { default as VoiceAssistantScreen } from './VoiceAssistantScreen';
export { answerQuestion } from './ragEngine';
export { checkOnline, speechToText, textToSpeech } from './deepgramService';
export { retrieveChunks, LAB_KNOWLEDGE } from './labKnowledge';

/** The two labs that currently have voice AI support. */
export const VOICE_ENABLED_LABS = ['incline-work-energy', 'eye-defects'];

/** Check whether a given lab id has voice AI support. */
export function isVoiceEnabled(labId) {
  return VOICE_ENABLED_LABS.includes(labId);
}
