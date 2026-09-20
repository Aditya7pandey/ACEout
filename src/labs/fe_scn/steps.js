/**
 * Guided procedure for Fe3+ + SCN- ⇌ [Fe(SCN)]2+ equilibrium.
 * NCERT Class 11 Practical Aligned.
 */

export const STEPS = [
  {
    id: 'prep',
    kind: 'prep',
    title: 'Prepare the Master Equilibrium Solution',
    instruction:
      'Measure 5.0 mL of 0.002 M FeCl₃ and 5.0 mL of 0.002 M KSCN, then dilute with distilled water to 50.0 mL in a volumetric flask. Note the orange-red equilibrium mixture.',
    note:
      'Fe³⁺ (light yellow) reacts with SCN⁻ (colorless) to produce [Fe(SCN)]²⁺ complex, giving a distinct reddish-amber tint.',
  },
  {
    id: 'blank',
    kind: 'blank',
    title: 'Calibrate the Colorimeter Blank',
    instruction:
      'Fill a reference cuvette with distilled water (Blank) and insert it into the colorimeter. Confirm the baseline reads 0.00 A.',
    note: 'The blank subtracts background solvent absorption and cuvette reflection.',
  },
  {
    id: 'tube-control',
    kind: 'tube-control',
    title: 'Tube 1 (Control): Baseline Absorbance',
    instruction:
      'Transfer 10.0 mL of the master equilibrium mixture into Test Tube 1 (Control). Place the sample in the colorimeter and read the absorbance (A).',
    note: 'This reading serves as your unperturbed equilibrium reference.',
  },
  {
    id: 'tube-fe',
    kind: 'tube-fe',
    title: 'Tube 2: Increase [Fe³⁺] with FeCl₃',
    instruction:
      'Take 10.0 mL of master solution in Tube 2 and add 4 drops of 0.1 M FeCl₃. Notice the deep blood-red color intensification. Read the new absorbance.',
    note:
      'According to Le Chatelier’s principle, increasing [Fe³⁺] stresses the system, causing the equilibrium to shift forward (→) to consume the added Fe³⁺.',
  },
  {
    id: 'tube-scn',
    kind: 'tube-scn',
    title: 'Tube 3: Increase [SCN⁻] with KSCN',
    instruction:
      'Take 10.0 mL of master solution in Tube 3 and add 4 drops of 0.1 M KSCN. Observe the color darkening and read the absorbance.',
    note:
      'Adding SCN⁻ likewise shifts the equilibrium forward (→), forming additional [Fe(SCN)]²⁺ complex.',
  },
  {
    id: 'tube-oxalic',
    kind: 'tube-oxalic',
    title: 'Tube 4: Remove Fe³⁺ with Oxalic Acid (H₂C₂O₄)',
    instruction:
      'Take 10.0 mL of master solution in Tube 4 and add 4 drops of 0.1 M Oxalic Acid. Observe the red color fading back towards light yellow. Read the absorbance.',
    note:
      'Oxalic acid forms a stable, colorless/pale complex with Fe³⁺ ([Fe(C₂O₄)₃]³⁻), removing free Fe³⁺ ions. The equilibrium shifts in reverse (←) to replenish Fe³⁺.',
  },
  {
    id: 'graph',
    kind: 'graph',
    title: 'Plot Absorbance vs [Fe(SCN)²⁺]',
    instruction:
      'Plot your measured absorbance (A) against the calculated equilibrium concentration of [Fe(SCN)]²⁺. Verify the linear Beer-Lambert relationship A = ε · b · c.',
    note:
      'The slope of this line corresponds to the molar absorptivity coefficient ε · b.',
  },
  {
    id: 'report',
    kind: 'report',
    title: 'Equilibrium Audit & Summary',
    instruction: '',
    note: '',
  },
];

export function stepById(id) {
  return STEPS.find((s) => s.id === id);
}
