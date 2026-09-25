/**
 * The two runs of the bench, and every word the instruction box says.
 *
 * This bench is English-only, so unlike `ray_optics_eye/steps.js` its copy
 * lives here rather than in the string catalogue. If it is ever translated,
 * move these strings to `src/i18n/strings.js` under `incline.<key>.<beat>` and
 * leave this file holding only what a run *is* — that is the pattern the eye
 * bench follows and the one `src/labs/CLAUDE.md` asks for.
 *
 * Each run plays the same four beats:
 *
 *   brief    the box that opens the run; it goes the moment they touch anything
 *   setup    the sliders are live and the block is waiting at the mark
 *   running  the block is on its way down and the gate clock is counting
 *   record   the gate has caught it; the time is on screen, waiting to be banked
 *
 * None of these strings may contain the answer. The student sets the slope,
 * the mass and the gate, and the only number they take away is a time.
 */

import { color } from '../../theme';

/** The ramp itself, in metres. Fixed — the slope angle is what varies. */
export const RAMP_LENGTH_M = 1.0;

/**
 * The slider ranges.
 *
 * The angle floor is 20°, not lower, and that is a deliberate piece of kindness:
 * varnished wood holds until tan θ passes its coefficient of static friction
 * (0.32, so 17.7°). Starting the slider above that means neither surface can
 * ever be set to an angle where the block simply refuses to move and the run
 * dead-ends. Free play has no such floor — going and finding the angle where it
 * sticks is exactly what that mode is for.
 */
export const ANGLE = { min: 20, max: 40, step: 1 };
export const MASS = { min: 0.2, max: 1.0, step: 0.05 };
export const TRACK_CM = { min: 20, max: 70, step: 1 };

/**
 * The bench runs in slow motion so a half-second slide is watchable. The clock
 * counts *simulated* seconds — the number the student records is the real time
 * the run would take, not the time they sat watching it.
 */
export const SLOW_MO = 3;

export const STATIONS = [
  {
    key: 'wood',
    surface: 'wood',
    ordinal: 'Run one',
    name: 'Varnished wood',
    tone: color.physics,
    home: { thetaDeg: 28, massKg: 0.5, trackCm: 50 },
    brief:
      'A block, a slope, and a gate part-way down. You choose how steep the slope is, how heavy the block is and how far it has to travel — then let go and time it to the gate.',
    prompt: 'Drag the three sliders below, then release the block.',
    record:
      'That time is the whole measurement. It tells you the acceleration, and the acceleration tells you how much friction this surface has.',
  },
  {
    key: 'glass',
    surface: 'glass',
    ordinal: 'Run two',
    name: 'Glass sheet',
    tone: color.green,
    home: { thetaDeg: 28, massKg: 0.5, trackCm: 50 },
    brief:
      'Same block, same gate, different running surface — the wood is swapped for glass. Set it up again and see what the change of surface does to the clock.',
    prompt: 'Set it up again and release.',
    record:
      'Two surfaces, two times. Bank this one and the bench will turn both into a coefficient of friction.',
  },
];

/** The opening dialog, shown once, over the first run. */
export const INTRO = {
  title: 'Block on a slope',
  body:
    'Everything on this bench is yours to set: the angle of the incline, the mass of the block and how far the gate sits down the track. Release the block, read the gate clock, and do it twice — once on wood, once on glass.',
  hint: 'Tap anywhere to begin',
};

export const BEATS = ['brief', 'setup', 'running', 'record', 'done'];
