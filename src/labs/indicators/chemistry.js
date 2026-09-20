/**
 * Acid-Base Indicators Chemistry Engine (NCERT Class 11 Aligned).
 *
 * Equilibrium:
 *   HIn (acid form, color 1) ⇌ H+ + In- (base form, color 2)
 *   pH = pK_In + log([In-] / [HIn])
 */

export const INDICATORS = {
  phenolphthalein: {
    id: 'phenolphthalein',
    name: 'Phenolphthalein',
    short: 'HPh',
    pKIn: 9.3,
    rangeLow: 8.3,
    rangeHigh: 10.0,
    acidColor: '#FCFBF9', // Colorless / clear
    baseColor: '#E61875', // Vibrant Magenta Pink
    midColor: '#F5A3C7',
    acidDesc: 'Colorless',
    baseDesc: 'Vivid Pink',
    transitionDesc: 'Colorless → Pink (pH 8.3 – 10.0)',
  },
  methylOrange: {
    id: 'methylOrange',
    name: 'Methyl Orange',
    short: 'MO',
    pKIn: 3.7,
    rangeLow: 3.1,
    rangeHigh: 4.4,
    acidColor: '#E6261F', // Red
    baseColor: '#FFDC00', // Yellow
    midColor: '#F78018', // Orange
    acidDesc: 'Red',
    baseDesc: 'Yellow',
    transitionDesc: 'Red → Orange → Yellow (pH 3.1 – 4.4)',
  },
  litmus: {
    id: 'litmus',
    name: 'Litmus Solution',
    short: 'Lit',
    pKIn: 6.5,
    rangeLow: 5.0,
    rangeHigh: 8.0,
    acidColor: '#D92027', // Red
    baseColor: '#1D50A2', // Blue
    midColor: '#7E3F8F', // Purple
    acidDesc: 'Red',
    baseDesc: 'Blue',
    transitionDesc: 'Red → Purple → Blue (pH 5.0 – 8.0)',
  },
  bromothymol: {
    id: 'bromothymol',
    name: 'Bromothymol Blue',
    short: 'BTB',
    pKIn: 7.1,
    rangeLow: 6.0,
    rangeHigh: 7.6,
    acidColor: '#F7D02C', // Yellow
    baseColor: '#1E64C8', // Blue
    midColor: '#2F8E6C', // Green
    acidDesc: 'Yellow',
    baseDesc: 'Blue',
    transitionDesc: 'Yellow → Green → Blue (pH 6.0 – 7.6)',
  },
};

export const STANDARD_SOLUTIONS = [
  { id: 'hcl', name: '0.1 M HCl', ph: 1.0, type: 'Strong Acid' },
  { id: 'acetic', name: '0.1 M CH₃COOH', ph: 2.9, type: 'Weak Acid' },
  { id: 'water', name: 'Distilled Water', ph: 7.0, type: 'Neutral' },
  { id: 'baking_soda', name: '0.1 M NaHCO₃', ph: 8.4, type: 'Weak Base' },
  { id: 'naoh', name: '0.1 M NaOH', ph: 13.0, type: 'Strong Base' },
];

/**
 * Calculate the fraction of indicator in ionized form In- (0 to 1).
 */
export function getIonizedFraction(ph, pKIn) {
  const diff = ph - pKIn;
  const ratio = Math.pow(10, Math.min(6, Math.max(-6, diff)));
  return ratio / (1 + ratio);
}

/**
 * Get dynamic RGB color for indicator at a specific pH.
 */
export function getIndicatorColor(indicatorKey, ph, drops = 3) {
  const ind = INDICATORS[indicatorKey] || INDICATORS.phenolphthalein;
  if (drops <= 0) return 'rgba(235, 245, 250, 0.4)'; // water clear

  const frac = getIonizedFraction(ph, ind.pKIn);

  if (indicatorKey === 'phenolphthalein') {
    // Colorless -> Pink
    // When frac=0: transparent/white, frac=1: #E61875 (230, 24, 117)
    const r = Math.round(250 - frac * 20);
    const g = Math.round(250 - frac * 226);
    const b = Math.round(250 - frac * 133);
    const alpha = 0.3 + frac * 0.65;
    return `rgba(${r},${g},${b},${alpha.toFixed(2)})`;
  }

  if (indicatorKey === 'methylOrange') {
    // Red (230, 38, 31) -> Orange -> Yellow (255, 220, 0)
    const r = Math.round(230 + frac * 25);
    const g = Math.round(38 + frac * 182);
    const b = Math.round(31 - frac * 31);
    return `rgba(${r},${g},${b},0.88)`;
  }

  if (indicatorKey === 'litmus') {
    // Red (217, 32, 39) -> Purple -> Blue (29, 80, 162)
    const r = Math.round(217 - frac * 188);
    const g = Math.round(32 + frac * 48);
    const b = Math.round(39 + frac * 123);
    return `rgba(${r},${g},${b},0.88)`;
  }

  if (indicatorKey === 'bromothymol') {
    // Yellow (247, 208, 44) -> Green (47, 142, 108) -> Blue (30, 100, 200)
    const r = Math.round(247 - frac * 217);
    const g = Math.round(208 - frac * 108);
    const b = Math.round(44 + frac * 156);
    return `rgba(${r},${g},${b},0.88)`;
  }

  return 'rgba(235, 245, 250, 0.6)';
}
