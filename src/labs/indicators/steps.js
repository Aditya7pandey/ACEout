/**
 * Guided procedure for Study of Acid-Base Indicators (NCERT Practical Aligned).
 */

export const STEPS = [
  {
    id: 'intro',
    kind: 'intro',
    title: 'Indicators & pH Response Matrix',
    instruction:
      'Acid-base indicators are weak organic acids or bases whose conjugate acid and base forms exhibit distinct colors. You will test Phenolphthalein, Methyl Orange, and Litmus in acidic, neutral, and basic media.',
    note:
      'The transition pH interval is given by pH = pK_In ± 1.',
  },
  {
    id: 'phenolphthalein',
    kind: 'phenolphthalein',
    title: 'Test 1: Phenolphthalein Indicator (pH 8.3 – 10.0)',
    instruction:
      'Dispense 3 drops of Phenolphthalein into 0.1 M HCl (Acid), Distilled Water (Neutral), and 0.1 M NaOH (Base). Record the observed color in each solution.',
    note:
      'Phenolphthalein remains colorless in acidic and neutral media (pH < 8.3) and turns vivid pink in basic media (pH > 10.0).',
  },
  {
    id: 'methylOrange',
    kind: 'methylOrange',
    title: 'Test 2: Methyl Orange Indicator (pH 3.1 – 4.4)',
    instruction:
      'Dispense 3 drops of Methyl Orange into Acid (0.1 M HCl), Neutral (Water), and Base (0.1 M NaOH). Note the sharp red-to-yellow color transformation.',
    note:
      'Methyl Orange is red in strongly acidic solutions (pH < 3.1) and yellow in neutral and basic solutions (pH > 4.4).',
  },
  {
    id: 'litmus',
    kind: 'litmus',
    title: 'Test 3: Litmus Indicator (pH 5.0 – 8.0)',
    instruction:
      'Add 3 drops of Litmus solution to Acid, Neutral, and Base. Record the characteristic Red, Purple, and Blue states.',
    note: 'Litmus turns red in acid (pH < 5.0), purple in neutral, and blue in base (pH > 8.0).',
  },
  {
    id: 'unknown',
    kind: 'unknown',
    title: 'Test 4: Identify Mystery Solution X',
    instruction:
      'Test Mystery Solution X with all three indicators. Use your recorded indicator matrix to deduce whether Solution X is Acidic, Neutral, or Basic.',
    note:
      'Compare the combination of color reactions against your standard table.',
  },
  {
    id: 'report',
    kind: 'report',
    title: 'Indicator Transition Range Analysis',
    instruction: '',
    note: '',
  },
];

export function stepById(id) {
  return STEPS.find((s) => s.id === id);
}
