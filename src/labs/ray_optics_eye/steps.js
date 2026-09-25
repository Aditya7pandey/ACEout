/**
 * The three stations of the bench.
 *
 * This file holds what a station *is*; every word it says lives in the string
 * catalogue at `src/i18n/strings.js`, keyed `eye.<station.key>.<beat>`, because
 * this bench is bilingual and copy in two languages does not belong in a data
 * table. Each station still has four beats:
 *
 *   brief    the box that appears when the camera arrives
 *   prompt   the one line left on screen while the slider is live
 *   record   the box that comes back once they let go of the slider
 *   reveal   what the correction is doing, after the reading is banked
 *
 * None of those strings may contain the answer, in either language.
 * `direction` says which way the object has to travel to find the limit, and
 * it is the only steer given.
 *
 * `readingLabel` is the English name of the limit and is deliberately *not*
 * translated: it is written into the student's saved lab record, which has to
 * stay comparable whatever language the bench was run in. The label shown on
 * screen comes from the catalogue instead.
 */

import { color } from '../../theme';

/** Where the object carriage sits when a station opens, in centimetres. */
export const BENCH_MIN_CM = 12;
export const BENCH_MAX_CM = 100;

export const STATIONS = [
  {
    key: 'normal',
    eyeKey: 'normal',
    tone: color.green,
    limit: 'near',
    direction: 'in',
    homeCm: 100,
    readingLabel: 'Near point',
    hasReveal: true,
  },
  {
    key: 'myopia',
    eyeKey: 'myopia',
    tone: color.physics,
    limit: 'far',
    direction: 'out',
    homeCm: 20,
    readingLabel: 'Far point',
    hasReveal: true,
  },
  {
    key: 'hypermetropia',
    eyeKey: 'hypermetropia',
    tone: color.biology,
    limit: 'near',
    direction: 'in',
    homeCm: 100,
    readingLabel: 'Near point',
    hasReveal: true,
  },
];

/**
 * The beats a station moves through. `adjust` is the only one where the slider
 * is live, and it is the only one where the instruction box is allowed to get
 * out of the way.
 */
export const BEATS = ['arriving', 'brief', 'adjust', 'record', 'reveal', 'done'];
