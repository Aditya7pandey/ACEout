import { KEYS, readJSON, writeJSON, removeKey } from './storage';

/**
 * The student's identity card. Captured once during onboarding, editable
 * afterwards from the You tab. `name` is the only required field — everything
 * else has a sane default so onboarding can never dead-end.
 */

export const BOARDS = ['CBSE', 'ICSE', 'State board'];
export const CLASS_OPTIONS = ['8', '9', '10', '11', '12'];

export const EMPTY_USER = {
  name: '',
  cls: '11',
  board: 'CBSE',
  createdAt: null,
  updatedAt: null,
};

export async function loadUser() {
  const stored = await readJSON(KEYS.user, null);
  if (!stored || typeof stored.name !== 'string' || !stored.name.trim()) return null;
  return { ...EMPTY_USER, ...stored };
}

/** Merge a patch into the stored user and return the full record. */
export async function saveUser(patch) {
  const current = (await readJSON(KEYS.user, null)) || EMPTY_USER;
  const next = {
    ...EMPTY_USER,
    ...current,
    ...patch,
    createdAt: current.createdAt || Date.now(),
    updatedAt: Date.now(),
  };
  next.name = cleanName(next.name);
  await writeJSON(KEYS.user, next);
  return next;
}

export async function clearUser() {
  await removeKey(KEYS.user);
}

/** Collapse whitespace and cap the length so headers can't be blown apart. */
export function cleanName(raw) {
  return String(raw || '').replace(/\s+/g, ' ').trim().slice(0, 40);
}

export function isValidName(raw) {
  return cleanName(raw).length >= 2;
}

/** "Ananya Nair" → "AN", "Ravi" → "RA". Used by both avatars. */
export function initialsOf(name) {
  const parts = cleanName(name).split(' ').filter(Boolean);
  if (parts.length === 0) return '··';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function firstNameOf(name) {
  return cleanName(name).split(' ')[0] || '';
}
