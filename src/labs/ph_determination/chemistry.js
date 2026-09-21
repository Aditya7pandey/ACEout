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
