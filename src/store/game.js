import { KEYS, readJSON, writeJSON } from './storage';
import { color } from '../theme';

/**
 * The score layer: XP, levels, stars, daily quests and badges.
 *
 * The rule the design sets, and the one worth keeping: every point is earned
 * for *measurement*, never for being handed an answer. So a run's stars come
 * from how much of the bench the student actually worked — how many readings
 * they logged and whether those readings carried through to an analysed
 * result — not from tapping "finish". Nothing here is a leaderboard; it all
 * stays on the device next to the lab record.
 */

export const EMPTY_GAME = {
  version: 1,
  xp: 0,
  stars: {}, // labId -> 0..3, best run kept
  quests: { day: null, xp: 0, readings: 0, threeStar: 0 },
  claimed: {}, // questId -> true, for today only
};

const LEVEL_STEP = 250;

export const RANKS = [
  'Bench Rookie',
  'Bench Technician',
  'Lab Assistant',
  'Lab Demonstrator',
  'Bench Master',
];

export const QUESTS = [
  { id: 'xp', label: 'Earn 100 XP', target: 100, reward: 20, tone: color.gold, key: 'xp' },
  { id: 'readings', label: 'Log 10 readings', target: 10, reward: 20, tone: color.blue, key: 'readings' },
  { id: 'threeStar', label: 'Clear a bench 3★', target: 1, reward: 30, tone: color.green, key: 'threeStar' },
];

export const BADGES = [
  { id: 'first', glyph: '1', label: 'First bench', tone: color.blue },
  { id: 'stars10', glyph: '★', label: 'Ten stars', tone: color.gold },
  { id: 'perfect', glyph: '3★', label: 'Three perfect', tone: color.green },
  { id: 'week', glyph: '7d', label: 'Week streak', tone: color.red },
  { id: 'worlds', glyph: '4', label: 'Every world', tone: color.purple },
  { id: 'xp1k', glyph: '1k', label: '1,000 XP', tone: color.biology },
];

export async function loadGame() {
  const stored = await readJSON(KEYS.game, null);
  if (!stored) return { ...EMPTY_GAME };
  return {
    ...EMPTY_GAME,
    ...stored,
    stars: stored.stars || {},
    quests: { ...EMPTY_GAME.quests, ...stored.quests },
    claimed: stored.claimed || {},
  };
}

export async function resetGame() {
  const fresh = { ...EMPTY_GAME };
  await writeJSON(KEYS.game, fresh);
  return fresh;
}

/**
 * Score one finished run. Labs hand back `{ data, analysis, sf }` and the
 * shape of `data` varies by bench, so this counts readings defensively and
 * never punishes a lab for describing itself differently.
 */
export function scoreRun(result) {
  const trials = countReadings(result);
  const analysed = hasAnalysis(result);

  let stars = 1;
  if (trials >= 5) stars = 2;
  if (trials >= 5 && analysed) stars = 3;

  const xp = 60 + Math.min(trials, 10) * 6 + (stars === 3 ? 40 : 0);
  return { stars, xp, trials, analysed };
}

/** Bank a scored run. Returns `{ game, award }` — `award` drives the result screen. */
export async function recordRun(labId, result, at = Date.now()) {
  const current = await loadGame();
  const rolled = rollQuests(current, at);
  const run = scoreRun(result);

  const best = rolled.stars[labId] || 0;
  const next = {
    ...rolled,
    xp: rolled.xp + run.xp,
    stars: { ...rolled.stars, [labId]: Math.max(best, run.stars) },
    quests: {
      ...rolled.quests,
      xp: rolled.quests.xp + run.xp,
      readings: rolled.quests.readings + run.trials,
      threeStar: rolled.quests.threeStar + (run.stars === 3 ? 1 : 0),
    },
  };

  await writeJSON(KEYS.game, next);
  return {
    game: next,
    award: {
      ...run,
      labId,
      levelBefore: levelOf(rolled.xp).level,
      levelAfter: levelOf(next.xp).level,
      starsBefore: best,
    },
  };
}

export async function claimQuest(game, questId) {
  const quest = QUESTS.find((q) => q.id === questId);
  if (!quest || game.claimed[questId]) return game;
  if (progressOf(game, quest) < quest.target) return game;

  const next = {
    ...game,
    xp: game.xp + quest.reward,
    claimed: { ...game.claimed, [questId]: true },
  };
  await writeJSON(KEYS.game, next);
  return next;
}

// --- derived ---------------------------------------------------------------

export function levelOf(xp = 0) {
  const level = Math.floor(xp / LEVEL_STEP) + 1;
  const into = xp % LEVEL_STEP;
  return {
    level,
    rank: RANKS[Math.min(RANKS.length - 1, Math.floor((level - 1) / 2))],
    into,
    need: LEVEL_STEP,
    toNext: LEVEL_STEP - into,
    fraction: into / LEVEL_STEP,
  };
}

export function progressOf(game, quest) {
  return game?.quests?.[quest.key] || 0;
}

export function starsFor(game, labId) {
  return game?.stars?.[labId] || 0;
}

export function totalStars(game) {
  return Object.values(game?.stars || {}).reduce((a, b) => a + b, 0);
}

/** Badges are derived, never stored — they can't drift out of date. */
export function earnedBadges(game, stats) {
  const stars = totalStars(game);
  const perfect = Object.values(game?.stars || {}).filter((s) => s === 3).length;
  const worlds = Object.keys(stats?.bySubject || {}).length;
  return {
    first: (stats?.labsDone || 0) >= 1,
    stars10: stars >= 10,
    perfect: perfect >= 3,
    week: (stats?.streak || 0) >= 7,
    worlds: worlds >= 4,
    xp1k: (game?.xp || 0) >= 1000,
  };
}

/** Quests reset at midnight; the counters and claims go with them. */
function rollQuests(game, at) {
  const today = dayKey(at);
  if (game.quests?.day === today) return game;
  return {
    ...game,
    quests: { day: today, xp: 0, readings: 0, threeStar: 0 },
    claimed: {},
  };
}

export async function refreshQuests(game, at = Date.now()) {
  const rolled = rollQuests(game, at);
  if (rolled !== game) await writeJSON(KEYS.game, rolled);
  return rolled;
}

function dayKey(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function countReadings(result) {
  const data = result?.data;
  if (Array.isArray(data?.trials)) return data.trials.length;
  if (Array.isArray(data?.rows)) return data.rows.length;
  if (Array.isArray(data)) return data.length;
  return 0;
}

function hasAnalysis(result) {
  const a = result?.analysis;
  if (!a || typeof a !== 'object') return false;
  return Object.values(a).some((v) => Number.isFinite(v));
}
