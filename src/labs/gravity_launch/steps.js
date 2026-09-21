/**
 * The guided procedure.
 *
 * Every step validates the *action* — that the student read the instrument
 * correctly — and never the truth. If a scuffed tape is lying to them, a
 * correctly-read wrong number is accepted, carried into the table, and shows
 * up later as a discrepancy they have to explain. That is how a practical works.
 */

export const REPEATS_TIMED = 3;

export const STEPS = [
  {
    id: 'zero-check',
    kind: 'zero',
    title: 'Check your instruments before you trust them',
    instruction:
      'Two instruments are going to carry this whole experiment. Empty the balance pan and read it. Start and stop the watch in the same motion and read that too. Write down what you find — you will subtract it later.',
    note:
      'An instrument that does not read zero when it is measuring nothing will be wrong by the same amount every single time. No amount of repeating will average it away.',
  },
  {
    id: 'mass',
    kind: 'mass',
    title: 'Weigh the rover',
    instruction:
      'Put the rover on the pan and read the display, then correct it for the zero error you just found.',
    note:
      'Keep this number. At the end of the lab, go back and look for it in a single one of your formulae. You will not find it — and that absence is a result, not an oversight.',
  },
  {
    id: 'geometry',
    kind: 'geometry',
    title: 'Measure the deck, and find your origin',
    instruction:
      'Stand the metre scale against the pillar and read the height of the deck lip above the floor. Then lay the tape along the floor and read the mark directly beneath the lip — that is the zero of every range you are about to measure.',
    note:
      'You are reading one end of the scale for the height and both ends for the ranges. Only one of those two is safe from a worn zero, and by the end of the lab you should be able to say which.',
  },
  {
    id: 'trials',
    kind: 'trials',
    title: 'Drive the rover off the deck on five worlds',
    instruction:
      'Set the gravity from the tab, launch the rover, and read the tape where it lands. The launcher is not touched between worlds — same spring, same push, same speed at the lip every time. Only the pull downwards changes.',
    note:
      'The rover leaves the lip horizontally, so nothing pushes it sideways in flight. Whatever difference you see in the ranges was done entirely by gravity, in the vertical direction.',
  },
  {
    id: 'timing',
    kind: 'timing',
    title: 'Time the longest fall',
    instruction:
      'Go back to the slowest world and time the flight itself — from the instant the rover leaves the lip to the instant it touches down. Three runs. On the fast worlds this is hopeless, and finding out why is part of the exercise.',
    note:
      't = √(2h/g). Your reaction time is somewhere around 0.2 s, so ask yourself what fraction of a Jovian flight that is before you trust a single hand-timed number from it.',
  },
  {
    id: 'graph',
    kind: 'graph',
    title: 'Straighten the relationship out',
    instruction:
      'R = u√(2h/g) is a curve, and a curve is hard to argue with. Square it: R² = (2u²h)(1/g). Plot R² against 1/g and the five worlds should fall on a straight line through the origin.',
    note:
      'Why through the origin? 1/g = 0 means infinite gravity. The rover would be snatched off the lip and land at its own wheels, so R must be zero there. A fit that misses the origin badly is telling you something is systematically wrong.',
  },
  {
    id: 'speed',
    kind: 'speed',
    title: 'Get the launch speed you never measured',
    instruction:
      'The gradient of that line is 2u²h. You measured h. So the speed at which the rover leaves the lip drops out of a graph of landing positions — without a stopwatch ever touching the launch.',
    note:
      'Quote it to the number of significant figures your weakest reading justifies, and no more. The gradient does not become more precise than the tape you read it from.',
  },
  {
    id: 'mystery',
    kind: 'mystery',
    title: 'Weigh a world you were told nothing about',
    instruction:
      'The deck has been moved to a sealed world. You are given no gravity, no name. Launch the rover once, read the tape, and work out the surface gravity from the gradient you already have: R² = k/g, so g = k/R².',
    note:
      'This is, in miniature, how the surface gravity of a body is actually found before anyone stands on it: watch something fall, and time or measure the fall.',
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
