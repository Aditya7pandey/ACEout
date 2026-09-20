import { KEYS, readJSON, writeJSON, removeKey } from './storage';

/**
 * A student's lab history, stored on the device.
 *
 * One entry per lab — re-running a lab updates that entry and bumps its `runs`
 * counter rather than filling the list with duplicates, because the Profile
 * screen is a record of *which* experiments you have done, not a log file.
 */

const MAX_ENTRIES = 80;

export const EMPTY_PROGRESS = {
  version: 2,
  completions: [],
  runs: 0,
  lastActiveAt: null,
  streak: { count: 0, lastDay: null },
};

export async function loadProgress() {
  const stored = await readJSON(KEYS.progress, null);
  if (stored && Array.isArray(stored.completions)) {
    return { ...EMPTY_PROGRESS, ...stored, streak: { ...EMPTY_PROGRESS.streak, ...stored.streak } };
  }
  return migrateLegacy();
}

/** v1 stored nothing but `{ completions: [...] }` with no lab metadata. */
async function migrateLegacy() {
  const old = await readJSON(KEYS.legacyProgress, null);
  if (!old || !Array.isArray(old.completions) || old.completions.length === 0) {
    return { ...EMPTY_PROGRESS };
  }
  const completions = old.completions.map((c) => ({
    labId: c.labId,
    title: null,
    cls: null,
    subject: 'physics',
    chapterNo: null,
    at: c.at || Date.now(),
    runs: 1,
    trials: c.trials ?? 0,
    a: c.a ?? null,
    mu: c.mu ?? null,
    sigFigs: c.sigFigs ?? null,
  }));
  const migrated = {
    ...EMPTY_PROGRESS,
    completions,
    runs: completions.length,
    lastActiveAt: completions[0].at,
    streak: { count: 1, lastDay: dayKey(completions[0].at) },
  };
  await writeJSON(KEYS.progress, migrated);
  await removeKey(KEYS.legacyProgress);
  return migrated;
}

/**
 * Record a finished lab. `meta` carries the catalogue context (title, class,
 * subject, chapter) so the Profile screen can describe the run without having
 * to look the lab up in a registry that may not contain it yet.
 */
export async function recordCompletion(labId, result, meta = {}) {
  const current = await loadProgress();
  const previous = current.completions.find((c) => c.labId === labId);
  const at = Date.now();

  const entry = {
    labId,
    title: meta.title ?? previous?.title ?? null,
    cls: meta.cls ?? previous?.cls ?? null,
    subject: meta.subject ?? previous?.subject ?? null,
    chapterNo: meta.chapterNo ?? previous?.chapterNo ?? null,
    at,
    runs: (previous?.runs ?? 0) + 1,
    trials: result?.data?.trials?.length ?? 0,
    a: numberOrNull(result?.analysis?.aMeasured),
    mu: numberOrNull(result?.analysis?.muMeasured),
    sigFigs: result?.sf ?? null,
  };

  const next = {
    ...current,
    version: 2,
    completions: [entry, ...current.completions.filter((c) => c.labId !== labId)].slice(
      0,
      MAX_ENTRIES
    ),
    runs: (current.runs || 0) + 1,
    lastActiveAt: at,
    streak: bumpStreak(current.streak, at),
  };

  await writeJSON(KEYS.progress, next);
  return next;
}

export async function resetProgress() {
  const fresh = { ...EMPTY_PROGRESS };
  await writeJSON(KEYS.progress, fresh);
  return fresh;
}

/** Counts the Profile screen needs, derived rather than stored. */
export function summarise(progress) {
  const completions = progress?.completions || [];
  const bySubject = {};
  for (const c of completions) {
    const key = c.subject || 'physics';
    bySubject[key] = (bySubject[key] || 0) + 1;
  }
  return {
    bySubject,
    labsDone: completions.length,
    totalRuns: progress?.runs || 0,
    streak: progress?.streak?.count || 0,
    lastActiveAt: progress?.lastActiveAt || null,
  };
}

export function hasCompleted(progress, labId) {
  return Boolean((progress?.completions || []).some((c) => c.labId === labId));
}

export function completionFor(progress, labId) {
  return (progress?.completions || []).find((c) => c.labId === labId) || null;
}

// --- helpers ---------------------------------------------------------------

function numberOrNull(v) {
  return Number.isFinite(v) ? v : null;
}

function dayKey(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

/** Same day → unchanged. Next day → +1. Any longer gap → back to 1. */
function bumpStreak(streak, at) {
  const today = dayKey(at);
  const last = streak?.lastDay;
  if (last === today) return { count: Math.max(streak?.count || 0, 1), lastDay: today };
  const yesterday = dayKey(at - 24 * 3600 * 1000);
  const count = last === yesterday ? (streak?.count || 0) + 1 : 1;
  return { count, lastDay: today };
}

export function describeWhen(ts) {
  if (!ts) return '';
  const diff = Date.now() - ts;
  const day = 24 * 3600 * 1000;
  if (diff < day) return 'Today';
  if (diff < 2 * day) return 'Yesterday';
  if (diff < 7 * day) return `${Math.floor(diff / day)} days ago`;
  if (diff < 30 * day) return `${Math.floor(diff / (7 * day))} weeks ago`;
  return new Date(ts).toLocaleDateString();
}
