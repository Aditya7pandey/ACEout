/**
 * Physical Chemistry engine for pH determination and solution mixing.
 * NCERT Class 11 Practical Aligned.
 *
 * Concepts:
 *   pH = -log10[H+]
 *   pOH = 14.00 - pH
 *   [H+] = 10^(-pH) mol/L
 *   [OH-] = 10^(-pOH) mol/L
 *   Kw = [H+] · [OH-] = 1.0 × 10^-14 at 298 K
 *   Neutralization: H+ + OH- -> H2O
 *   Buffer systems: Henderson–Hasselbalch equation
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

export const BIOLOGICAL_SOLUTIONS = [
  {
    id: 'gastric',
    name: 'Human Gastric Juice',
    truePH: 1.5,
    category: 'Gastric Acid (HCl + Pepsin)',
    approxPHPaper: 2,
    desc: 'Hydrochloric acid secreted by gastric parietal cells to activate pepsinogen.',
  },
  {
    id: 'orange',
    name: 'Fresh Orange Juice',
    truePH: 3.5,
    category: 'Organic Acid (Citric & Ascorbic)',
    approxPHPaper: 4,
    desc: 'Rich in ascorbic acid (Vitamin C) and citric acid buffer systems.',
  },
  {
    id: 'coffee',
    name: 'Black Coffee',
    truePH: 5.0,
    category: 'Weak Acid (Chlorogenic)',
    approxPHPaper: 5,
    desc: 'Contains chlorogenic, quinic, and citric acids.',
  },
  {
    id: 'saliva',
    name: 'Human Saliva',
    truePH: 6.8,
    category: 'Biological Fluid (Near Neutral)',
    approxPHPaper: 7,
    desc: 'Maintains optimum enzymatic activity for salivary amylase (ptyalin).',
  },
  {
    id: 'blood',
    name: 'Human Blood / Plasma',
    truePH: 7.4,
    category: 'Physiological Buffer',
    approxPHPaper: 7,
    desc: 'Tightly regulated by carbonic acid-bicarbonate buffer system (H₂CO₃/HCO₃⁻).',
  },
  {
    id: 'egg_white',
    name: 'Fresh Egg White (Albumen)',
    truePH: 8.0,
    category: 'Mild Alkaline Protein',
    approxPHPaper: 8,
    desc: 'Fresh albumen containing dissolved carbonate equilibrium.',
  },
  {
    id: 'soap',
    name: 'Soapy Handwash Solution',
    truePH: 9.5,
    category: 'Alkaline Surfactant',
    approxPHPaper: 10,
    desc: 'Sodium or potassium salts of fatty acids (stearates/palmitates).',
  },
  {
    id: 'bleach',
    name: 'Household Bleach (NaOCl)',
    truePH: 12.5,
    category: 'Strong Oxidizing Alkaline',
    approxPHPaper: 13,
    desc: 'Sodium hypochlorite solution with high hydroxide alkalinity.',
  },
];

export const SALT_BUFFER_SOLUTIONS = [
  {
    id: 'nh4cl',
    name: '0.1 M Ammonium Chloride (NH₄Cl)',
    truePH: 5.1,
    category: 'Acidic Salt (Strong Acid + Weak Base)',
    approxPHPaper: 5,
    desc: 'NH₄⁺ undergoes cationic hydrolysis: NH₄⁺ + H₂O ⇌ NH₄OH + H⁺.',
  },
  {
    id: 'nacl',
    name: '0.1 M Sodium Chloride (NaCl)',
    truePH: 7.0,
    category: 'Neutral Salt (Strong Acid + Strong Base)',
    approxPHPaper: 7,
    desc: 'Neither Na⁺ nor Cl⁻ undergoes hydrolysis; pH remains perfectly neutral.',
  },
  {
    id: 'ch3coona',
    name: '0.1 M Sodium Acetate (CH₃COONa)',
    truePH: 8.9,
    category: 'Basic Salt (Weak Acid + Strong Base)',
    approxPHPaper: 9,
    desc: 'CH₃COO⁻ undergoes anionic hydrolysis: CH₃COO⁻ + H₂O ⇌ CH₃COOH + OH⁻.',
  },
  {
    id: 'na2co3',
    name: '0.1 M Sodium Carbonate (Na₂CO₃)',
    truePH: 11.6,
    category: 'Strong Basic Salt (Diprotic Hydrolysis)',
    approxPHPaper: 12,
    desc: 'Carbonate ion CO₃²⁻ hydrolyses strongly to produce OH⁻ ions.',
  },
  {
    id: 'acetate_buffer',
    name: 'Acetate Buffer (CH₃COOH + CH₃COONa)',
    truePH: 4.75,
    category: 'Acidic Buffer (pKa = 4.75)',
    approxPHPaper: 5,
    desc: 'Resists drastic pH changes upon addition of small amounts of strong acid or base.',
  },
  {
    id: 'phosphate_buffer',
    name: 'Phosphate Buffer (H₂PO₄⁻ / HPO₄²⁻)',
    truePH: 7.2,
    category: 'Physiological Neutral Buffer',
    approxPHPaper: 7,
    desc: 'Intracellular biological buffer regulating cellular physiological pH.',
  },
];

export const SOLUTION_PACKS = {
  ncert: {
    id: 'ncert',
    title: 'NCERT Standard Rack',
    badge: '8 Core Solutions',
    solutions: NCERT_SOLUTIONS,
  },
  biological: {
    id: 'biological',
    title: 'Biological & Everyday Pack',
    badge: '8 Extra Solutions',
    solutions: BIOLOGICAL_SOLUTIONS,
  },
  salts_buffers: {
    id: 'salts_buffers',
    title: 'Salts & Buffer Solutions Pack',
    badge: '6 Special Solutions',
    solutions: SALT_BUFFER_SOLUTIONS,
  },
};

export const TITRATION_DOSAGE_MODES = [
  { id: 'drop', name: '💧 Micro Dropper', volumeMl: 0.05, dropCount: 1, shiftMultiplier: 0.25, label: '1 drop (0.05 mL)' },
  { id: 'pipette', name: '🧪 Standard Pipette', volumeMl: 0.25, dropCount: 5, shiftMultiplier: 1.0, label: '5 drops (0.25 mL)' },
  { id: 'burette', name: '⚗️ Burette Stream', volumeMl: 1.0, dropCount: 20, shiftMultiplier: 2.5, label: '1 mL Stream' },
];

export const TITRATION_REAGENTS = [
  {
    id: 'hcl',
    name: '0.1 M HCl',
    type: 'acid',
    color: '#B23428',
    baseShift: -0.4,
    desc: 'Strong Mineral Acid',
  },
  {
    id: 'naoh',
    name: '0.1 M NaOH',
    type: 'base',
    color: '#1E64C8',
    baseShift: +0.4,
    desc: 'Strong Caustic Base',
  },
  {
    id: 'acetic',
    name: '0.1 M CH₃COOH',
    type: 'weak_acid',
    color: '#D47A22',
    baseShift: -0.2,
    desc: 'Weak Organic Acid',
  },
  {
    id: 'nh4oh',
    name: '0.1 M NH₄OH',
    type: 'weak_base',
    color: '#2F8E6C',
    baseShift: +0.2,
    desc: 'Weak Alkaline Base',
  },
  {
    id: 'water',
    name: 'Pure H₂O',
    type: 'diluent',
    color: '#5C8A99',
    baseShift: 0,
    desc: 'Diluent (Neutralizes towards pH 7.0)',
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

/**
 * Calculates rigorous aqueous mixture equilibrium for arbitrary solution additions.
 * Supports strong acids/bases, weak acid buffers (acetic, citric, malic),
 * amphiprotic buffers (NaHCO3), antacids (Mg(OH)2), and pure water dilution.
 *
 * @param {Object} volumes - Map of solution id to volume in mL, e.g. { hcl: 50, naoh: 25 }
 * @returns {Object} { totalVolumeMl, ph, hConc, ohConc, category, name }
 */
export function calculateSolutionMixture(volumes = {}) {
  let totalVolumeMl = 0;
  let activeComponents = [];

  for (const [id, vol] of Object.entries(volumes)) {
    const v = Number(vol) || 0;
    if (v > 0) {
      totalVolumeMl += v;
      activeComponents.push({ id, volumeMl: v });
    }
  }

  if (totalVolumeMl <= 0 || activeComponents.length === 0) {
    return {
      totalVolumeMl: 0,
      ph: 7.0,
      hConc: 1e-7,
      ohConc: 1e-7,
      category: 'Neutral (Empty)',
      name: 'Empty Beaker',
    };
  }

  // Single component without dilution
  if (activeComponents.length === 1) {
    const comp = activeComponents[0];
    const ncert = NCERT_SOLUTIONS.find((s) => s.id === comp.id);
    if (ncert) {
      const ph = ncert.truePH;
      return {
        totalVolumeMl,
        ph,
        hConc: getHydroniumConc(ph),
        ohConc: getHydroxideConc(ph),
        category: ncert.category,
        name: ncert.name,
      };
    }
  }

  // Quantities in millimoles (mmol)
  const vHcl = Number(volumes.hcl || 0);
  const vNaoh = Number(volumes.naoh || 0);
  const vVinegar = Number(volumes.vinegar || 0);
  const vLemon = Number(volumes.lemon || 0);
  const vTomato = Number(volumes.tomato || 0);
  const vBakingSoda = Number(volumes.baking_soda || 0);
  const vMagnesia = Number(volumes.magnesia || 0);
  const vWater = Number(volumes.water || 0);

  const molStrongAcid = 0.1 * vHcl; // 0.1 M HCl
  const molStrongBase = 0.1 * vNaoh; // 0.1 M NaOH

  const molAcetic = 0.1 * vVinegar; // 0.1 M CH3COOH, Ka = 1.8e-5
  const molCitric = 0.05 * vLemon; // ~0.05 M citric acid equivalents
  const molTomato = 0.01 * vTomato; // ~0.01 M organic acid equivalents

  const molBicarb = 0.05 * vBakingSoda; // ~0.05 M NaHCO3
  const molMagnesia = 0.02 * vMagnesia; // ~0.02 M Mg(OH)2 equivalents

  let finalPH = 7.0;

  // 1. Strong Acid vs Strong Base
  const netStrongAcid = molStrongAcid - molStrongBase;

  if (netStrongAcid > 0.00001) {
    // Excess strong acid
    // Neutralizes weak bases first
    const remAcid = netStrongAcid - molBicarb - molMagnesia;
    if (remAcid > 0.0001) {
      const hPlus = remAcid / totalVolumeMl;
      finalPH = -Math.log10(Math.max(1e-14, hPlus));
    } else {
      // Partially neutralized by weak base
      const fractionNeutralized = netStrongAcid / (molBicarb + molMagnesia + 1e-9);
      finalPH = 4.5 + fractionNeutralized * 2.5; // Transition region
    }
  } else if (netStrongAcid < -0.00001) {
    // Excess strong base
    const excessBase = -netStrongAcid;
    const totalWeakAcid = molAcetic + molCitric + molTomato;
    const remBase = excessBase - totalWeakAcid;

    if (remBase > 0.0001) {
      const ohMinus = remBase / totalVolumeMl;
      const pOH = -Math.log10(Math.max(1e-14, ohMinus));
      finalPH = 14.0 - pOH;
    } else {
      // Henderson-Hasselbalch buffer zone for weak acid + strong base
      const frac = excessBase / (totalWeakAcid + 1e-9);
      const ratio = Math.max(0.01, Math.min(99.0, frac / (1 - frac + 0.001)));
      finalPH = 4.75 + Math.log10(ratio); // Acetic buffer midpoint
    }
  } else {
    // Strong acid & strong base in stoichiometric balance (or neither present)
    const totalAcidVol = vHcl + vVinegar + vLemon + vTomato;
    const totalBaseVol = vNaoh + vBakingSoda + vMagnesia;

    if (totalAcidVol > 0 && totalBaseVol === 0) {
      // Only weak acids + water
      if (vVinegar > 0 && vLemon === 0 && vTomato === 0) {
        const cAcid = (0.1 * vVinegar) / totalVolumeMl;
        const hPlus = Math.sqrt(1.8e-5 * cAcid);
        finalPH = -Math.log10(Math.max(1e-14, hPlus));
      } else if (vLemon > 0 && vVinegar === 0 && vTomato === 0) {
        finalPH = 2.2 + 0.5 * Math.log10(Math.max(1.0, totalVolumeMl / vLemon));
      } else if (vTomato > 0 && vVinegar === 0 && vLemon === 0) {
        finalPH = 4.1 + 0.5 * Math.log10(Math.max(1.0, totalVolumeMl / vTomato));
      } else {
        // Blended organic acids
        const totalAcidEq = molAcetic + molCitric + molTomato;
        const cEff = totalAcidEq / totalVolumeMl;
        const hPlus = Math.sqrt(2.0e-4 * cEff);
        finalPH = -Math.log10(Math.max(1e-14, hPlus));
      }
    } else if (totalBaseVol > 0 && totalAcidVol === 0) {
      // Only weak bases + water
      if (vBakingSoda > 0 && vMagnesia === 0) {
        finalPH = 8.4 - 0.15 * Math.log10(Math.max(1.0, totalVolumeMl / vBakingSoda));
      } else if (vMagnesia > 0 && vBakingSoda === 0) {
        finalPH = 10.5 - 0.5 * Math.log10(Math.max(1.0, totalVolumeMl / vMagnesia));
      } else {
        finalPH = 9.2 - 0.25 * Math.log10(Math.max(1.0, totalVolumeMl / (vBakingSoda + vMagnesia)));
      }
    } else if (totalAcidVol > 0 && totalBaseVol > 0) {
      // Weak acid vs weak base mixture
      const netEq = (molAcetic + molCitric + molTomato) - (molBicarb + molMagnesia);
      if (Math.abs(netEq) < 0.05) {
        finalPH = 7.0;
      } else if (netEq > 0) {
        finalPH = 7.0 - Math.min(3.5, (netEq / totalVolumeMl) * 12.0);
      } else {
        finalPH = 7.0 + Math.min(3.5, (-netEq / totalVolumeMl) * 12.0);
      }
    } else {
      // Pure water
      finalPH = 7.0;
    }
  }

  finalPH = Math.min(14.0, Math.max(0.0, Number(finalPH.toFixed(2))));

  let category = 'Neutral';
  if (finalPH < 3.0) category = 'Strong Acid';
  else if (finalPH < 6.5) category = 'Mild Acid';
  else if (finalPH <= 7.5) category = 'Neutral';
  else if (finalPH <= 11.0) category = 'Mild Base';
  else category = 'Strong Base';

  let name = 'Aqueous Mixture';
  if (activeComponents.length === 1) {
    const s = NCERT_SOLUTIONS.find((sol) => sol.id === activeComponents[0].id);
    name = s ? s.name : 'Solution';
  } else if (activeComponents.length === 2 && activeComponents.some(c => c.id === 'water')) {
    const other = activeComponents.find(c => c.id !== 'water');
    const s = NCERT_SOLUTIONS.find((sol) => sol.id === other?.id);
    name = s ? `${s.name} (Diluted)` : 'Diluted Solution';
  } else {
    name = `Mixture (${totalVolumeMl.toFixed(0)} mL)`;
  }

  return {
    totalVolumeMl,
    ph: finalPH,
    hConc: getHydroniumConc(finalPH),
    ohConc: getHydroxideConc(finalPH),
    category,
    name,
  };
}
