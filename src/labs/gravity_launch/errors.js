/**
 * Systematic and random error injection for the launch deck.
 *
 * The three standard faults behave exactly as they do on the incline bench —
 * the field names are deliberately identical so the shared MetreScale and
 * Balance instruments can read this profile without translation.
 *
 * The fourth is this lab's own: a spring launcher that does not deliver quite
 * the same push twice. It is the one fault here that is *random* rather than
 * systematic, and the contrast is the point — repeating a launch and averaging
 * will bury launcher scatter, and will do absolutely nothing about a worn
 * scale.
 */

export const ERROR_KINDS = {
  zeroError: {
    key: 'zeroError',
    label: 'Zero error',
    blurb:
      'The floor tape’s zero is scuffed away and the balance does not rest at zero. Every single-ended reading carries the same offset until you find it and subtract it.',
  },
  parallax: {
    key: 'parallax',
    label: 'Parallax',
    blurb:
      'The tape lies a few millimetres below the rover’s wheels. Sight the landing point from the side and the mark shifts. Line your eye up square to the graduation.',
  },
  timingLag: {
    key: 'timingLag',
    label: 'Stopwatch lag',
    blurb:
      'A tired stopwatch: it does not return to zero, and the start button sticks for a moment before the count begins. Both faults bias every flight time the same way, so averaging will not save you.',
  },
  launcherScatter: {
    key: 'launcherScatter',
    label: 'Launcher scatter',
    blurb:
      'The spring does not push the rover equally hard every time, so two launches on the same world land a little apart. This one is random, not systematic — and it is the only fault today that repeating the launch can actually beat.',
  },
};

export function defaultErrorConfig() {
  return { zeroError: false, parallax: false, timingLag: false, launcherScatter: false };
}

/**
 * Deterministic per-session error magnitudes, so a student who re-reads the
 * same tape gets the same wrong answer — the way a real worn tape behaves.
 */
export function makeErrorProfile(seed = Math.random()) {
  const rand = mulberry32(Math.floor(seed * 4294967296));
  const sign = () => (rand() < 0.5 ? -1 : 1);
  return {
    seed,
    // the tape's printed zero is scuffed/inset by up to 3 mm
    scaleZeroCm: round(sign() * (0.1 + rand() * 0.2), 1),
    // the balance reads a few grams with nothing on the pan
    balanceZeroG: Math.round(sign() * (2 + rand() * 6)),
    // the watch does not return exactly to zero
    stopwatchZeroS: round(0.03 + rand() * 0.05, 2),
    // the start button sticks before the count begins
    startStickS: round(0.1 + rand() * 0.12, 2),
    // cm of apparent displacement per unit of eye offset
    parallaxGainCm: 0.32 + rand() * 0.12,
    // fractional spread on the launch speed, 1σ
    launcherSigma: 0.016 + rand() * 0.014,
    rand,
  };
}

/**
 * The speed the launcher actually delivers on a given shot.
 *
 * Seeded on the shot number so a replayed run reproduces, but varying shot to
 * shot — which is exactly what makes it random error rather than a bias.
 */
export function apparentLaunchSpeed(trueU, profile, config, shotIndex = 0) {
  if (!config.launcherScatter) return trueU;
  // A cheap deterministic normal-ish deviate from two hashed uniforms.
  const a = hash01(profile.seed, shotIndex * 2 + 1);
  const b = hash01(profile.seed, shotIndex * 2 + 2);
  const z = Math.sqrt(-2 * Math.log(a + 1e-9)) * Math.cos(2 * Math.PI * b);
  // Clipped at 2σ: a real spring scatters, it does not occasionally throw the
  // rover clean off the end of a one-metre tape.
  const clipped = Math.max(-2, Math.min(2, z));
  return trueU * (1 + profile.launcherSigma * clipped);
}

/** The stopwatch's own faults — instrument bias, not the student's reflexes. */
export function stopwatchFaults(profile, config) {
  if (!config.timingLag) return { zeroOffsetS: 0, startDelayS: 0 };
  return { zeroOffsetS: profile.stopwatchZeroS, startDelayS: profile.startStickS };
}

/** A short human-readable list of what is currently wrong with the apparatus. */
export function activeErrorSummary(config) {
  return Object.keys(ERROR_KINDS)
    .filter((k) => config[k])
    .map((k) => ERROR_KINDS[k].label);
}

// --- helpers ---------------------------------------------------------------

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash01(seed, n) {
  let h = Math.imul(Math.floor(seed * 4294967296) ^ Math.imul(n + 1, 0x9e3779b9), 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return ((h >>> 0) % 1000000) / 1000000;
}

function round(x, dp) {
  const f = Math.pow(10, dp);
  return Math.round(x * f) / f;
}
