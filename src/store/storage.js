import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Everything LabVR knows about a student lives on the device. There are no
 * network calls anywhere in the app — the labs are meant to run in a classroom
 * with no connection — so AsyncStorage is the whole backend.
 *
 * Reads never throw: a corrupt or missing record falls back to the default so
 * a bad write can't lock a student out of their own app.
 */

export const KEYS = {
  user: 'aceout.user.v1',
  progress: 'aceout.progress.v2',
  legacyProgress: 'aceout.progress.v1',
  game: 'aceout.game.v1',
  lang: 'aceout.lang.v1',
};

export async function readJSON(key, fallback) {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export async function writeJSON(key, value) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export async function removeKey(key) {
  try {
    await AsyncStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}
