/**
 * Error injection profile for Fe3+ + SCN- equilibrium lab.
 */

export const ERROR_KINDS = {
  smudge: {
    key: 'smudge',
    label: 'Cuvette optical smudge',
    blurb:
      'A fingerprint on the optical cuvette scatters light, adding a constant +0.06 A baseline offset until wiped clean.',
  },
  parallax: {
    key: 'parallax',
    label: 'Comparator scale parallax',
    blurb:
      'Viewing the analog absorbance needle off-angle shifts the reading by ±0.03 A depending on viewing position.',
  },
};

export function defaultErrorConfig() {
  return {
    smudge: false,
    parallax: false,
  };
}

export function makeErrorProfile(seed) {
  let s = Math.sin(seed * 9999) * 10000;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };

  const smudgeOffset = 0.05 + rand() * 0.04; // +0.05 to +0.09 A
  const parallaxShift = (rand() - 0.5) * 0.06; // -0.03 to +0.03 A

  return {
    rand,
    smudgeOffset,
    parallaxShift,
  };
}

export function apparentAbsorbance(trueAbs, profile, config = {}) {
  let val = trueAbs;
  if (config.smudge) {
    val += profile.smudgeOffset;
  }
  if (config.parallax) {
    val += profile.parallaxShift;
  }
  return Math.max(0.0, Math.round(val * 100) / 100);
}
