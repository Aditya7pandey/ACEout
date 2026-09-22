// Physics, mathematical models, kinetics, and anatomical parameters for
// Class 11 NCERT Plant Physiology Virtual Laboratory:
// 1. Plasmolysis in Epidermal Peel (Rhoeo / Onion)
// 2. Stomatal Distribution (Dicot vs Monocot)
// 3. Transpiration Rate Comparison (Cobalt Chloride Method)

export const PLANT_SPECIES = {
  rhoeo: {
    id: 'rhoeo',
    name: 'Rhoeo discolor (Tradescantia spathacea)',
    commonName: 'Boat Lily / Oyster Plant',
    leafType: 'Dorsiventral',
    pigment: 'Anthocyanin (Purple/Magenta vacuolar sap)',
    hypertonicThresholdM: 0.25, // Molar concentration where incipient plasmolysis begins
  },
  hibiscus: {
    id: 'hibiscus',
    name: 'Hibiscus rosa-sinensis',
    commonName: 'China Rose',
    type: 'Dicotyledon (Dorsiventral)',
    guardCellShape: 'Kidney-shaped (Reniform)',
    upperStomataDensityMm2: 28,
    lowerStomataDensityMm2: 195,
    upperEpidermalDensityMm2: 920,
    lowerEpidermalDensityMm2: 1150,
  },
  grass: {
    id: 'grass',
    name: 'Zea mays (Maize / Grass)',
    commonName: 'Maize Leaf',
    type: 'Monocotyledon (Isobilateral)',
    guardCellShape: 'Dumbbell-shaped',
    upperStomataDensityMm2: 120,
    lowerStomataDensityMm2: 135,
    upperEpidermalDensityMm2: 840,
    lowerEpidermalDensityMm2: 890,
  },
};

// Chemical Solutions
export const SOLUTIONS = {
  hypertonic_salt: {
    id: 'hypertonic_salt',
    name: '10% Sodium Chloride (Hypertonic)',
    concPercent: 10,
    molarity: 1.71,
    osmoticPotentialBar: -78.4,
    action: 'plasmolysis',
    desc: 'Hypertonic solution: Water potential is much lower than cell sap (Ψs < Ψcell), inducing exosmosis.',
  },
  hypertonic_sugar: {
    id: 'hypertonic_sugar',
    name: '20% Sucrose Solution (Hypertonic)',
    concPercent: 20,
    molarity: 0.58,
    osmoticPotentialBar: -24.5,
    action: 'plasmolysis',
    desc: 'Hypertonic sugar solution causing water to diffuse out of vacuole through semi-permeable tonoplast.',
  },
  hypotonic_water: {
    id: 'hypotonic_water',
    name: 'Distilled Water (Hypotonic)',
    concPercent: 0,
    molarity: 0.0,
    osmoticPotentialBar: 0.0,
    action: 'deplasmolysis',
    desc: 'Hypotonic medium: Pure water potential (Ψw = 0) causes rapid endosmosis and restores full cell turgor.',
  },
  safranin_stain: {
    id: 'safranin_stain',
    name: '1% Safranin Stain',
    action: 'stain',
    desc: 'Nuclear and cell wall stain highlighting guard cell borders, nuclei, and stomatal pore apertures.',
  },
};

// Plasmolysis Kinetics Model
// Calculates vacuole volume ratio (1.0 = fully turgid, 0.35 = full plasmolysis)
export function calculateVacuoleRatio(solutionId, elapsedSeconds) {
  if (!solutionId) return 1.0;
  if (solutionId === 'hypotonic_water') {
    // Deplasmolysis: expands back to 1.0 in ~6 seconds
    const progress = Math.min(1.0, elapsedSeconds / 6.0);
    return 0.38 + progress * (1.0 - 0.38);
  }
  if (solutionId.startsWith('hypertonic')) {
    // Plasmolysis: shrinks from 1.0 to ~0.36 in ~8 seconds
    const progress = Math.min(1.0, elapsedSeconds / 8.0);
    return 1.0 - progress * (1.0 - 0.36);
  }
  return 1.0;
}

export function getPlasmolysisStage(vacuoleRatio) {
  if (vacuoleRatio > 0.88) {
    return {
      stage: 'Turgid',
      badgeColor: '#2F8E6C',
      description: 'Vacuole fully expanded, pressing protoplast firmly against the rigid cellulosic cell wall (Turgor Pressure > 0).',
    };
  } else if (vacuoleRatio > 0.65) {
    return {
      stage: 'Incipient Plasmolysis',
      badgeColor: '#B8862F',
      description: 'Protoplast just begins to withdraw from the corners of the cell wall; turgor pressure drops to zero (Ψp = 0).',
    };
  } else if (vacuoleRatio > 0.45) {
    return {
      stage: 'Concave Plasmolysis',
      badgeColor: '#A9701F',
      description: 'Plasma membrane detaches significantly, forming concave inward curves while adhering at plasmodesmata.',
    };
  }
  return {
    stage: 'Convex / Full Plasmolysis',
    badgeColor: '#B23428',
    description: 'Protoplast becomes completely spherical and isolated in the cell center. Space between wall and membrane is filled with hypertonic solution.',
  };
}

// Stomatal Index Calculation
// Stomatal Index (I) = [S / (S + E)] * 100
export function calculateStomatalIndex(stomataCount, epidermalCount) {
  const S = Number(stomataCount) || 0;
  const E = Number(epidermalCount) || 0;
  if (S + E === 0) return 0;
  const index = (S / (S + E)) * 100;
  return Math.round(index * 10) / 10;
}

// Transpiration Reaction & Color Transition Kinetics
// Cobalt Chloride paper turns from Blue (anhydrous CoCl2) to Pink (hexahydrate CoCl2.6H2O)
export function calculateCobaltPaperHydration(surfaceType, elapsedSeconds, speedMultiplier = 1) {
  const totalEffectiveTime = elapsedSeconds * speedMultiplier;
  // Lower abaxial surface in dorsiventral leaf transpires ~4.5x faster due to stomatal abundance
  const rateConstant = surfaceType === 'lower' ? 0.052 : 0.012;
  const hydration = 1.0 - Math.exp(-rateConstant * totalEffectiveTime);
  return Math.min(1.0, Math.max(0.0, hydration));
}

// Interpolate color from dry blue (#2B6CB0) to mauve (#8A5F9E) to hydrated pink (#E57399)
export function getCobaltPaperColor(hydrationRatio) {
  const h = Math.min(1.0, Math.max(0.0, hydrationRatio));
  // Anhydrous Blue: (43, 108, 176)
  // Half Hydrated Mauve: (138, 95, 158)
  // Fully Hydrated Pink: (229, 115, 153)
  let r, g, b;
  if (h < 0.5) {
    const t = h / 0.5;
    r = Math.round(43 + t * (138 - 43));
    g = Math.round(108 + t * (95 - 108));
    b = Math.round(176 + t * (158 - 176));
  } else {
    const t = (h - 0.5) / 0.5;
    r = Math.round(138 + t * (229 - 138));
    g = Math.round(95 + t * (115 - 95));
    b = Math.round(158 + t * (153 - 158));
  }
  return `rgb(${r}, ${g}, ${b})`;
}

export function getCobaltPaperHexColor(hydrationRatio) {
  const h = Math.min(1.0, Math.max(0.0, hydrationRatio));
  let r, g, b;
  if (h < 0.5) {
    const t = h / 0.5;
    r = Math.round(43 + t * (138 - 43));
    g = Math.round(108 + t * (95 - 108));
    b = Math.round(176 + t * (158 - 176));
  } else {
    const t = (h - 0.5) / 0.5;
    r = Math.round(138 + t * (229 - 138));
    g = Math.round(95 + t * (115 - 95));
    b = Math.round(158 + t * (153 - 158));
  }
  const toHex = (c) => c.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

