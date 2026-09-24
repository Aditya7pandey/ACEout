/**
 * The three stations of the bench, and every word the instruction box says.
 *
 * Copy lives here as data rather than inside the flow's JSX, the same way
 * `incline/steps.js` holds the incline procedure. Each station has four beats:
 *
 *   brief    the box that appears when the camera arrives
 *   prompt   the one line left on screen while the slider is live
 *   record   the box that comes back once they let go of the slider
 *   reveal   what the correction is doing, after the reading is banked
 *
 * None of these strings may contain the answer. `direction` says which way the
 * object has to travel to find the limit, and it is the only steer given.
 */

import { color } from '../../theme';

/** Where the object carriage sits when a station opens, in centimetres. */
export const BENCH_MIN_CM = 12;
export const BENCH_MAX_CM = 100;

export const STATIONS = [
  {
    key: 'normal',
    eyeKey: 'normal',
    ordinal: 'Station one',
    name: 'The healthy eye',
    clinical: 'Emmetropia (normal)',
    tone: color.green,
    limit: 'near',
    direction: 'in',
    homeCm: 100,
    readingLabel: 'Near point',
    brief:
      'Nothing wrong with this eye. Distance is already sharp — so find the other end. Watch the lens fatten as you come in.',
    prompt: 'Slide the arrow towards the eye. Stop the moment the retina loses the point.',
    record:
      'The near point of a healthy eye. Bank it — the next two stations are measured against it.',
    revealTitle: 'A baseline, not a defect',
    reveal:
      'Nothing to correct. Relaxed it reaches infinity, straining it reaches your reading — that gap is its accommodation. The next two eyes each fail one end of it.',
  },
  {
    key: 'myopia',
    eyeKey: 'myopia',
    ordinal: 'Station two',
    name: 'Short sight — myopia',
    clinical: 'Myopia (short sight)',
    tone: color.physics,
    limit: 'far',
    direction: 'out',
    homeCm: 20,
    readingLabel: 'Far point',
    brief:
      'This eyeball is too long. Up close it copes — send the arrow away and the image lands short, in front of the retina. Find the furthest point it still holds.',
    prompt: 'Slide the arrow away from the eye. Stop where the point first breaks up.',
    record:
      'That is the far point, and that is the whole diagnosis. A healthy eye has none — it reaches infinity.',
    revealTitle: 'Short sight — corrected',
    reveal:
      'A concave lens spreads the light first, so distant rays arrive looking as though they came from your far point — a distance this eye can already handle. Watch the cone land back on the retina.',
  },
  {
    key: 'hypermetropia',
    eyeKey: 'hypermetropia',
    ordinal: 'Station three',
    name: 'Long sight — hypermetropia',
    clinical: 'Hypermetropia (long sight)',
    tone: color.biology,
    limit: 'near',
    direction: 'in',
    homeCm: 100,
    readingLabel: 'Near point',
    brief:
      'This eyeball is too short. Distance is fine, but the lens runs out of accommodation before the arrow gets close — the image tries to form behind the retina. Find where it gives up.',
    prompt: 'Slide the arrow towards the eye. Stop the moment the retina loses the point.',
    record:
      'Compare that against station one. This eye needs the page much further out — the complaint that sends someone to an optician.',
    revealTitle: 'Long sight — corrected',
    reveal:
      'A convex lens converges the light first, so a page at reading distance arrives looking as though it sits out at your near point. The cone reaches the retina again.',
  },
];

/**
 * The beats a station moves through. `adjust` is the only one where the slider
 * is live, and it is the only one where the instruction box is allowed to get
 * out of the way.
 */
export const BEATS = ['arriving', 'brief', 'adjust', 'record', 'reveal', 'done'];
