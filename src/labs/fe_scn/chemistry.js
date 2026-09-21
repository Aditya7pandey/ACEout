/**
 * Physical Chemistry engine for the Fe3+ + SCN- ⇌ [Fe(SCN)]2+ equilibrium.
 *
 * Reaction:
 *   Fe3+ (pale yellow/orange) + SCN- (colorless) ⇌ [Fe(SCN)]2+ (blood-red)
 *
 * Equilibrium Constant:
 *   Kc = [[Fe(SCN)]2+] / ([Fe3+] · [SCN-]) ≈ 138 L mol⁻¹ at 298 K
 *
 * Beer-Lambert Law:
 *   Absorbance A = ε · b · c
 *   where ε · b ≈ 4500 L mol⁻¹ at λ = 480 nm
 */

export const KC_TRUE = 138.0; // L/mol (NCERT standard benchmark)
export const EPSILON_B = 4500.0; // Molar absorptivity * path length

export const DEFAULT_FE_PARAMS = {
  vTotalMl: 20.0,
  initialFeMoles: 0.0001, // 1.0 mL of 0.1 M FeCl3 = 1e-4 mol -> 0.005 M in 20 mL
  initialScnMoles: 0.0001, // 1.0 mL of 0.1 M KSCN = 1e-4 mol -> 0.005 M in 20 mL
  addedFeCl3Drops: 0,
  addedKscnDrops: 0,
  addedOxalicDrops: 0,
  addedWaterMl: 0,
};

/**
 * Solve quadratic equilibrium:
 * [Fe3+]_eq · [SCN-]_eq · Kc = [Fe(SCN)2+]_eq
 *
 * Let initial concentrations be Fe0, Scn0.
 * Let x = [[Fe(SCN)]2+]_eq
 * (Fe0 - x)(Scn0 - x) = x / Kc
 * x^2 - (Fe0 + Scn0 + 1/Kc)x + Fe0·Scn0 = 0
 */
export function calculateEquilibrium({
  feMoles,
  scnMoles,
  oxalicMoles = 0,
  volumeL,
  Kc = KC_TRUE,
}) {
  const vol = Math.max(0.001, volumeL);

  // Oxalic acid (H2C2O4) binds Fe3+ into [Fe(C2O4)3]3-, removing free Fe3+
  // 1 mol oxalic acid binds approx 0.33 mol Fe3+
  const boundFeMoles = Math.min(feMoles, oxalicMoles * 0.333);
  const effectiveFeMoles = Math.max(0, feMoles - boundFeMoles);

  const fe0 = effectiveFeMoles / vol;
  const scn0 = Math.max(0, scnMoles) / vol;

  if (fe0 <= 0 || scn0 <= 0) {
    return {
      fe0,
      scn0,
      complexConc: 0,
      freeFeConc: fe0,
      freeScnConc: scn0,
      absorbance: 0,
      Qc: 0,
      shiftDirection: 'EQUILIBRIUM',
    };
  }

  const b = -(fe0 + scn0 + 1 / Kc);
  const c = fe0 * scn0;
  const discriminant = b * b - 4 * c;
  const x = (-b - Math.sqrt(Math.max(0, discriminant))) / 2; // smaller physical root

  const complexConc = Math.max(0, Math.min(Math.min(fe0, scn0), x));
  const freeFeConc = Math.max(0, fe0 - complexConc);
  const freeScnConc = Math.max(0, scn0 - complexConc);

  // Beer-Lambert law
  const absorbance = complexConc * EPSILON_B;

  // Reaction quotient
  const denom = freeFeConc * freeScnConc;
  const Qc = denom > 1e-12 ? complexConc / denom : 0;

  return {
    fe0,
    scn0,
    complexConc,
    freeFeConc,
    freeScnConc,
    absorbance,
    Qc,
    shiftDirection: 'EQUILIBRIUM',
  };
}

/**
 * Interpolate solution color based on equilibrium concentration.
 * Color shifts from pale yellow-straw (#F5D98B) -> rich amber-orange (#D97724) -> blood-red (#7A0B0B).
 */
export function getSolutionColor(complexConc) {
  // complexConc typically ranges 0 to 0.0006 M in these concentrations
  const t = Math.min(1.0, Math.max(0.0, complexConc / 0.00045));

  // RGB color stops
  // t=0: Pale yellow [245, 217, 139]
  // t=0.4: Amber orange [217, 119, 36]
  // t=1.0: Deep blood red [122, 11, 11]
  let r, g, b;
  if (t < 0.4) {
    const s = t / 0.4;
    r = Math.round(245 + s * (217 - 245));
    g = Math.round(217 + s * (119 - 217));
    b = Math.round(139 + s * (36 - 139));
  } else {
    const s = (t - 0.4) / 0.6;
    r = Math.round(217 + s * (122 - 217));
    g = Math.round(119 + s * (11 - 119));
    b = Math.round(36 + s * (11 - 36));
  }

  return `rgb(${r},${g},${b})`;
}
