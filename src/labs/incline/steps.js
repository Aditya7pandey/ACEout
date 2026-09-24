/**
 * The guided procedure.
 *
 * Every step validates the *action* — that the student read the instrument
 * correctly — and never the truth. If a worn scale is lying to them, a
 * correctly-read wrong number is accepted, carried into the table, and shows
 * up later as a discrepancy they have to explain. That is how a practical works.
 */

export const TRIAL_TARGETS_CM = [25, 35, 45, 55, 65];
export const REPEATS_PER_TRIAL = 2;

export const STEPS = [
  {
    id: 'mass',
    kind: 'mass',
    title: 'Find the mass of the block',
    instruction:
      'Place the block on the pan and read the display. Copy it exactly as it reads — sign and all.',
    note: 'Least count 1 g, so quote the mass as a whole number of grams.',
  },
  {
    id: 'geometry',
    kind: 'geometry',
    title: 'Measure the slope — do not ask it for its angle',
    instruction:
      'A protractor against a wooden wedge is a poor measurement. Instead measure the vertical rise of the top corner and the horizontal run of the base with your metre scale, and let trigonometry give you θ.',
    note:
      'sin θ = rise ÷ √(rise² + run²). Measuring two lengths well beats reading one angle badly.',
  },
  {
    id: 'trials',
    kind: 'trials',
    title: 'Run the block and time it yourself',
    instruction:
      'Slide the finish gate to roughly the distance asked for — the carriage has no scale on it, so measure where it actually ends up. Then release the block and time it from the release mark to the gate. Two runs at each distance.',
    note:
      'You are the timing instrument here. Watch the block, not the watch. Start as it breaks away, stop as its leading face reaches the gate.',
  },
  {
    id: 'graph',
    kind: 'graph',
    title: 'Plot your own points',
    instruction:
      'For a release from rest with uniform acceleration, s = ½at², so v = 2s/t and v² = 2as. Plot v² against s. If your readings are sound the points will lie on a straight line through the origin, and its gradient is 2a.',
    note:
      'Four points can be fitted by almost anything. Five points that fall on a line are an argument.',
  },
  {
    id: 'accel',
    kind: 'accel',
    title: 'Read the acceleration off the gradient',
    instruction:
      'Take the gradient of your best-fit line and halve it to get the acceleration. Then work backwards: a = g(sin θ − μ cos θ) gives you the coefficient of kinetic friction of the surface you just ran on.',
    note:
      'Quote both answers to the number of significant figures your weakest reading justifies — no more.',
  },
  {
    id: 'work',
    kind: 'work',
    title: 'Audit the energy for your longest run',
    instruction:
      'Now test the work–energy theorem on a single trial. Work out the work gravity did, the work friction took away, and the kinetic energy the block finished with. The theorem says the first two must add up to the third.',
    note:
      'W_gravity = mgs sin θ.  W_friction = −μmgs cos θ.  K = ½mv², with v = 2s/t.',
  },
  {
    id: 'report',
    kind: 'report',
    title: 'What your data actually showed',
    instruction: '',
    note: '',
  },
];

export function stepById(id) {
  return STEPS.find((s) => s.id === id);
}
