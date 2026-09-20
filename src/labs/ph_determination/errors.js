/**
 * Error injection for pH determination lab.
 */

export const ERROR_KINDS = {
  uncalibrated: {
    key: 'uncalibrated',
    label: 'Electrode zero offset (Uncalibrated)',
    blurb:
      'The glass electrode has an asymmetric potential adding +0.28 pH across all readings until calibrated with pH 7.00 buffer.',
  },
  glare: {
    key: 'glare',
    label: 'Ambient lighting on pH paper',
    blurb:
      'Warm ambient lighting can cause adjacent pH swatches (e.g. pH 2 vs 3) to look identical without close comparison.',
  },
};

export function defaultErrorConfig() {
  return {
    uncalibrated: false,
    glare: false,
  };
}

export function makeErrorProfile(seed) {
  let s = Math.sin(seed * 7777) * 10000;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };

  const zeroOffset = 0.25 + rand() * 0.15; // +0.25 to +0.40 pH
  return {
    rand,
    zeroOffset,
  };
}

export function apparentMeterPH(truePH, profile, config = {}, isCalibrated = false) {
  let ph = truePH;
  if (config.uncalibrated && !isCalibrated) {
    ph += profile.zeroOffset;
  }
  return Math.min(14.0, Math.max(0.0, Math.round(ph * 100) / 100));
}
