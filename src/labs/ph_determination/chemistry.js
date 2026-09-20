/**
 * Physical Chemistry engine for pH determination of solutions.
 * NCERT Class 11 Practical Aligned.
 *
 * Concepts:
 *   pH = -log10[H+]
 *   pOH = 14.00 - pH
 *   [H+] = 10^(-pH) mol/L
 *   [OH-] = 10^(-pOH) mol/L
 *   Kw = [H+] · [OH-] = 1.0 × 10^-14 at 298 K
 */

export const NCERT_SOLUTIONS = [
  {
    id: 'hcl',
    name: '0.1 M HCl',
    truePH: 1.0,
    category: 'Strong Acid',
    approxPHPaper: 1,
    desc: 'Hydrochloric acid completely dissociates into H+ and Cl-.',
  },
  {
    id: 'lemon',
    name: 'Lemon Juice',
    truePH: 2.2,
    category: 'Natural Acid (Citric)',
    approxPHPaper: 2,
    desc: 'Contains citric acid (H₃C₆H₅O₇) with sharp acidic characteristics.',
  },
  {
    id: 'vinegar',
    name: 'Vinegar (Dilute CH₃COOH)',
    truePH: 2.85,
    category: 'Weak Acid',
    approxPHPaper: 3,
    desc: 'Ethanoic / acetic acid weakly dissociates in aqueous solution.',
  },
  {
    id: 'tomato',
    name: 'Tomato Juice',
    truePH: 4.1,
    category: 'Mild Acid',
    approxPHPaper: 4,
    desc: 'Natural fruit juice rich in malic and citric acids.',
  },
  {
    id: 'water',
    name: 'Distilled Pure Water',
    truePH: 7.0,
    category: 'Neutral',
    approxPHPaper: 7,
    desc: 'Auto-ionization of water produces [H+] = [OH-] = 1.0 × 10⁻⁷ M.',
  },
  {
    id: 'baking_soda',
    name: 'Baking Soda Solution (NaHCO₃)',
    truePH: 8.4,
    category: 'Weak Base (Salt Hydrolysis)',
    approxPHPaper: 8,
    desc: 'HCO₃⁻ hydrolyses in water generating a weakly alkaline solution.',
  },
  {
    id: 'magnesia',
    name: 'Milk of Magnesia (Mg(OH)₂)',
    truePH: 10.5,
    category: 'Mild Base (Antacid)',
    approxPHPaper: 11,
    desc: 'Magnesium hydroxide suspension used as an antacid.',
  },
  {
    id: 'naoh',
    name: '0.1 M NaOH',
    truePH: 13.0,
    category: 'Strong Base',
    approxPHPaper: 13,
    desc: 'Sodium hydroxide fully dissociates into Na+ and OH-.',
  },
];

export function getHydroniumConc(ph) {
  return Math.pow(10, -ph);
}

export function getHydroxideConc(ph) {
  const pOH = Math.max(0, 14.0 - ph);
  return Math.pow(10, -pOH);
}

export function formatScientific(num, decimals = 2) {
  if (!Number.isFinite(num) || num <= 0) return '0.00';
  const s = num.toExponential(decimals);
  const [mantissa, exp] = s.split('e');
  return `${mantissa} × 10${formatSuperscript(parseInt(exp, 10))}`;
}

function formatSuperscript(num) {
  const digits = String(num);
  const map = {
    '-': '⁻',
    '0': '⁰',
    '1': '¹',
    '2': '²',
    '3': '³',
    '4': '⁴',
    '5': '⁵',
    '6': '⁶',
    '7': '⁷',
    '8': '⁸',
    '9': '⁹',
  };
  return digits.split('').map((d) => map[d] || d).join('');
}
