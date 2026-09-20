/**
 * Guided steps for Determination of pH of Different Solutions.
 * NCERT Class 11 Practical Aligned.
 */

export const STEPS = [
  {
    id: 'intro',
    kind: 'intro',
    title: 'The pH Scale & Measurement Techniques',
    instruction:
      'The pH scale measures the hydrogen ion activity in aqueous solution: pH = -log₁₀[H⁺]. You will measure 5 solutions first using Universal pH Paper (L.C. 1 pH) and then using a Digital pH Meter (L.C. 0.01 pH).',
    note:
      'pH paper provides rapid integer estimates by color-matching. A digital glass electrode provides 2 decimal places of accuracy.',
  },
  {
    id: 'paper-measure',
    kind: 'paper-measure',
    title: 'Part 1: Measure pH using Universal Indicator Paper',
    instruction:
      'Dip a test strip into each solution. Match the developed color against the 0–14 reference scale and record the whole number pH.',
    note: 'Universal paper strips resolve to 1 pH unit. Decimal readings are not justified.',
  },
  {
    id: 'meter-calibrate',
    kind: 'meter-calibrate',
    title: 'Part 2: Calibrate the Digital pH Meter',
    instruction:
      'Before testing unknown solutions, immerse the glass electrode probe in standard pH 7.00 buffer and press Calibrate to eliminate zero errors.',
    note: 'Calibrating standardizes the electrode response against the Nernst potential.',
  },
  {
    id: 'meter-measure',
    kind: 'meter-measure',
    title: 'Part 3: High-Precision Digital pH Measurement',
    instruction:
      'Immerse the calibrated electrode into each of the 5 solutions. Allow the reading to stabilize and record the digital pH to 2 decimal places.',
    note: 'The digital meter resolves 0.01 pH units.',
  },
  {
    id: 'calc-ions',
    kind: 'calc-ions',
    title: 'Part 4: Calculate [H⁺] & [OH⁻] Concentrations',
    instruction:
      'Compute [H⁺] = 10^(-pH) and [OH⁻] = 10^(-(14 - pH)) for your solutions. Observe the inverse relationship enforced by Kw = 1.0 × 10⁻¹⁴.',
    note: 'In pure water [H⁺] = [OH⁻] = 1.0 × 10⁻⁷ M.',
  },
  {
    id: 'report',
    kind: 'report',
    title: 'pH Measurement Audit & Report',
    instruction: '',
    note: '',
  },
];

export function stepById(id) {
  return STEPS.find((s) => s.id === id);
}
