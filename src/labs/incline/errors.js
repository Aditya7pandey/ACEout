/**
 * Systematic and random error injection.
 *
 * These are the errors school practicals actually assess. Each one is a real
 * physical effect applied to what the student *sees*, never announced in a
 * readout — the student has to notice it, and in guided mode, correct for it.
 */

export const ERROR_KINDS = {
  zeroError: {
    key: 'zeroError',
    label: 'Zero error',
    blurb:
      'The metre scale’s end is worn and the balance does not rest at zero. Every reading carries a constant offset until you check and subtract it.',
  },
  parallax: {
    key: 'parallax',
    label: 'Parallax',
    blurb:
      'The scale sits a few millimetres above the block. Read it from the side and the mark shifts. Line your eye up square to the graduation.',
  },
  timingLag: {
    key: 'timingLag',
    label: 'Stopwatch lag',
    blurb:
      'A tired stopwatch: it does not return to zero, and the start button sticks for a moment before the count begins. Both faults bias every time in the same direction, so averaging will not save you. Press start and stop together to find them.',
  },
};

export function defaultErrorConfig() {
  return { zeroError: false, parallax: false, timingLag: false };
}

/**
 * Deterministic per-session error magnitudes, so a student who re-reads the
 * same scale gets the same wrong answer — the way a real faulty scale behaves.
 */
export function makeErrorProfile(seed = Math.random()) {
  const rand = mulberry32(Math.floor(seed * 4294967296));
  const sign = () => (rand() < 0.5 ? -1 : 1);
  return {
    seed,
    // metre scale zero mark is inset/worn by up to 3 mm
    scaleZeroCm: round(sign() * (0.1 + rand() * 0.2), 1),
    // balance reads a few grams with nothing on the pan
    balanceZeroG: Math.round(sign() * (2 + rand() * 6)),
    // stopwatch does not return exactly to zero
    stopwatchZeroS: round(0.03 + rand() * 0.05, 2),
    // the start button sticks before the count begins
    startStickS: round(0.1 + rand() * 0.12, 2),
    // how strongly a misaligned eye displaces the apparent mark, cm per unit of
    // eye offset (the scale stands ~6 mm proud of the block face)
    parallaxGainCm: 0.32 + rand() * 0.12,
    rand,
  };
}

/**
 * What the scale *appears* to read, given the true position and how the
 * student is holding their eye.
 *
 * @param trueCm      true distance from the true zero of the ramp
 * @param eyeOffset   -1 (viewing from far left) .. 0 (square on) .. +1
 */
export function apparentScaleReading(trueCm, profile, config, eyeOffset = 0) {
  let reading = trueCm;
  if (config.zeroError) {
    // A worn zero means the printed graduations are shifted relative to truth,
    // so the number the student reads off is displaced by the same amount.
    reading += profile.scaleZeroCm;
  }
  if (config.parallax) {
    reading += eyeOffset * profile.parallaxGainCm;
  }
  return reading;
}

/** Mass the balance displays for a true mass, in grams. */
export function apparentMassG(trueG, profile, config) {
  return config.zeroError ? trueG + profile.balanceZeroG : trueG;
}

/**
 * The stopwatch's own faults.
 *
 * The student's reaction time is already real — they are tapping a real
 * button against a block that is really moving, so nothing needs to be
 * simulated there. What this injects is the *instrument* fault: a watch that
 * does not rest at zero and whose start button sticks. Both bias every
 * reading the same way, which is exactly why averaging cannot remove them.
 */
export function stopwatchFaults(profile, config) {
  if (!config.timingLag) return { zeroOffsetS: 0, startDelayS: 0 };
  return {
    zeroOffsetS: profile.stopwatchZeroS,
    startDelayS: profile.startStickS,
  };
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


function round(x, dp) {
  const f = Math.pow(10, dp);
  return Math.round(x * f) / f;
}
