/**
 * Error injection for Acid-Base Indicators Lab.
 */

export const ERROR_KINDS = {
  aging: {
    key: 'aging',
    label: 'Degraded / Aged indicator solution',
    blurb:
      'Atmospheric CO₂ absorption shifts the indicator baseline slightly towards acidic by ~0.3 pH units.',
  },
  glare: {
    key: 'glare',
    label: 'Ambient yellow lighting glare',
    blurb:
      'Incandescent ambient lighting makes pale yellow colors appear deeper orange, requiring closer inspection.',
  },
};

export function defaultErrorConfig() {
  return {
    aging: false,
    glare: false,
  };
}

export function makeErrorProfile(seed) {
  let s = Math.sin(seed * 8888) * 10000;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };

  const phOffset = -0.25 - rand() * 0.2; // -0.25 to -0.45 pH shift
  return {
    rand,
    phOffset,
  };
}

export function apparentPH(truePH, profile, config = {}) {
  let ph = truePH;
  if (config.aging) {
    ph += profile.phOffset;
  }
  return Math.min(14.0, Math.max(0.0, Math.round(ph * 100) / 100));
}
