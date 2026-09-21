/**
 * Horizontal launch of a rover off a deck — Space Exploration, surface gravity.
 *
 * A car is driven off the lip of a launch deck at a fixed horizontal speed u
 * from a height h. From the moment it leaves the lip nothing pushes it
 * sideways, so the horizontal motion is uniform and the vertical motion is a
 * free fall under whatever gravity the world has:
 *
 *     t_fall = √(2h/g)        R = u · t_fall = u √(2h/g)
 *
 * Square the range and the relationship straightens out:
 *
 *     R² = (2u²h) · (1/g)
 *
 * so a plot of R² against 1/g is a straight line through the origin whose
 * gradient is 2u²h. That single gradient carries the launch speed — a speed
 * the student never times directly — and, run backwards, the surface gravity
 * of a world they are told nothing about.
 *
 * Axis convention: x horizontal, positive in the direction of travel, origin
 * at the deck lip. y vertical, positive up, origin at the floor. SI throughout
 * (kg, m, s); the UI converts to the units printed on each instrument.
 *
 * No atmosphere. Every world here is treated as a vacuum, which is honest for
 * the Moon and close enough for Mars at these speeds. The free-play bench says
 * so out loud.
 */

// The least-squares fits live in the incline lab and are shared by GraphPlot
// itself; re-exported here so this lab's analysis does not reach across labs
// in more than one place.
export { leastSquares, leastSquaresThroughOrigin } from '../incline/physics';
import { leastSquares, leastSquaresThroughOrigin } from '../incline/physics';

export const G_EARTH = 9.81;

/**
 * Surface gravities, NASA planetary fact sheet values.
 *
 * `frame` is how wide the bench has to be in metres to contain the flight on
 * that world at the standard launcher setting — used to keep the camera honest
 * rather than silently rescaling the parabola.
 */
export const WORLDS = {
  pluto: { key: 'pluto', label: 'Pluto', g: 0.62, body: 'dwarf planet', tint: '#CFC4B4' },
  titan: { key: 'titan', label: 'Titan', g: 1.35, body: 'moon of Saturn', tint: '#D8A867' },
  moon: { key: 'moon', label: 'Moon', g: 1.62, body: 'moon of Earth', tint: '#CBC7C0' },
  mercury: { key: 'mercury', label: 'Mercury', g: 3.7, body: 'planet', tint: '#B8B0A6' },
  mars: { key: 'mars', label: 'Mars', g: 3.71, body: 'planet', tint: '#C2724A' },
  uranus: { key: 'uranus', label: 'Uranus', g: 8.87, body: 'ice giant', tint: '#9CC6CC' },
  venus: { key: 'venus', label: 'Venus', g: 8.87, body: 'planet', tint: '#D6B472' },
  earth: { key: 'earth', label: 'Earth', g: 9.81, body: 'planet', tint: '#6E93C4' },
  saturn: { key: 'saturn', label: 'Saturn', g: 10.44, body: 'gas giant', tint: '#D2BC86' },
  neptune: { key: 'neptune', label: 'Neptune', g: 11.15, body: 'ice giant', tint: '#5A76C0' },
  jupiter: { key: 'jupiter', label: 'Jupiter', g: 24.79, body: 'gas giant', tint: '#C69A72' },
};

/** The five worlds the guided procedure runs, chosen to spread 1/g widely. */
export const TRIAL_WORLDS = ['jupiter', 'earth', 'mars', 'moon', 'pluto'];

/** Candidates for the sealed world in the last step — all land on the tape. */
export const MYSTERY_WORLDS = ['venus', 'saturn', 'titan', 'mercury', 'neptune'];

export const DEFAULT_PARAMS = {
  massKg: 0.2,
  // deck height above the floor, metres
  heightM: 0.4,
  // horizontal speed at the lip, metres per second. The launcher's spring is
  // fixed, so this is the same on every world — that is the whole premise.
  speedMS: 0.64,
  g: G_EARTH,
  world: 'earth',
  // where the launch point sits on the floor's measuring tape, in metres from
  // the tape's zero. The student reads this, they are not told it.
  originM: 0.06,
  // how far back along the deck the rover starts its run
  deckRunM: 0.42,
};

/** Length of the floor tape, matching the metre scale instrument. */
export const TAPE_LENGTH_M = 1.0;

export function worldOf(params) {
  return WORLDS[params.world] || WORLDS.earth;
}

/** Time from leaving the lip to touching the floor. */
export function flightTime(heightM, g) {
  if (!(g > 0) || !(heightM > 0)) return Infinity;
  return Math.sqrt((2 * heightM) / g);
}

/** Horizontal distance from the lip to the landing point. */
export function rangeOf({ speedMS, heightM, g }) {
  const t = flightTime(heightM, g);
  return Number.isFinite(t) ? speedMS * t : Infinity;
}

/** Everything the bench knows about one launch. Truth, not the student's data. */
export function idealLaunch(params) {
  const t = flightTime(params.heightM, params.g);
  const vy = params.g * t;
  const speed = Math.hypot(params.speedMS, vy);
  return {
    t,
    range: params.speedMS * t,
    vx: params.speedMS,
    vy,
    impactSpeed: speed,
    // angle below the horizontal at touchdown
    impactAngleDeg: (Math.atan2(vy, params.speedMS) * 180) / Math.PI,
    // kinetic energy on arrival — the rover's problem, not the launcher's
    impactKE: 0.5 * params.massKg * speed * speed,
  };
}

// --- live simulation -------------------------------------------------------

export function initialState() {
  return {
    phase: 'deck', // deck → flight → landed
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    t: 0,
    deckX: 0, // distance travelled along the deck, 0 → deckRunM
    trail: [],
    landedT: null,
    landedX: null,
  };
}

/**
 * One fixed integration step. dt should be <= 1/120 s.
 *
 * The deck phase is uniform motion — the spring has already done its work, so
 * the rover coasts to the lip at u whatever the gravity is. The flight phase
 * is semi-implicit Euler on ẍ = 0, ÿ = −g, which for a constant acceleration
 * is not an approximation at all in x and is stable in y.
 */
export function step(state, params, dt) {
  const s = { ...state, trail: state.trail };

  if (s.phase === 'deck') {
    s.deckX += params.speedMS * dt;
    s.t += dt;
    if (s.deckX >= params.deckRunM) {
      s.phase = 'flight';
      s.deckX = params.deckRunM;
      s.x = 0;
      s.y = params.heightM;
      s.vx = params.speedMS;
      s.vy = 0;
      s.t = 0; // the flight clock starts at the lip
      s.trail = [[0, params.heightM]];
    }
    return s;
  }

  if (s.phase !== 'flight') return s;

  // Constant acceleration, so the trapezoidal update is not an approximation
  // at all: y advances by v dt − ½g dt² exactly. Plain Euler would land the
  // rover a millimetre or two short on every world — a systematic bias the
  // student would be entitled to blame on their own reading.
  const nx = s.x + s.vx * dt;
  const ny = s.y + s.vy * dt - 0.5 * params.g * dt * dt;
  s.vy -= params.g * dt;
  s.t += dt;

  if (ny <= 0) {
    // Land on the floor exactly, not a frame late: interpolate the crossing.
    const frac = s.y / Math.max(1e-9, s.y - ny);
    s.x += (nx - s.x) * frac;
    s.y = 0;
    s.t -= dt * (1 - frac);
    s.phase = 'landed';
    s.landedT = s.t;
    s.landedX = s.x;
    s.trail = [...s.trail, [s.x, 0]];
    return s;
  }

  s.x = nx;
  s.y = ny;
  // A point every couple of centimetres keeps the trail cheap and smooth.
  const last = s.trail[s.trail.length - 1];
  if (!last || Math.hypot(nx - last[0], ny - last[1]) > 0.012) {
    s.trail = [...s.trail, [nx, ny]];
  }
  return s;
}

// --- the student's own numbers --------------------------------------------

/**
 * Work out every derived quantity from the student's readings rather than the
 * simulator's, which is what the analysis screen grades.
 *
 * @param rows       [{ worldKey, g, rCm }] one row per world run
 * @param heightCm   the deck height the student measured
 */
export function analyseStudentData(rows, { heightCm }) {
  const h = heightCm / 100;

  const points = rows
    .filter((r) => Number.isFinite(r.rCm) && r.rCm > 0 && r.g > 0)
    .map((r) => {
      const R = r.rCm / 100;
      return {
        worldKey: r.worldKey,
        g: r.g,
        rCm: r.rCm,
        rM: R,
        invG: 1 / r.g,
        rSq: R * R,
        // the fall time their own range implies, for the timing cross-check
        tImplied: Math.sqrt((2 * h) / r.g),
      };
    });

  // R² = (2u²h)(1/g): a line through the origin, because a world with
  // infinite gravity gives zero range. The free fit is kept alongside —
  // how far its intercept misses zero is a diagnostic in itself.
  const pairs = points.map((p) => [p.invG, p.rSq]);
  const fit = leastSquaresThroughOrigin(pairs);
  const freeFit = leastSquares(pairs);

  // gradient k = 2u²h  ->  u = √(k / 2h)
  const k = fit ? fit.slope : NaN;
  const uMeasured = Number.isFinite(k) && h > 0 ? Math.sqrt(Math.max(0, k) / (2 * h)) : NaN;

  return { h, points, fit, freeFit, gradient: k, uMeasured };
}

/**
 * Surface gravity of a world from a single range on it, using the gradient the
 * student already fitted. R² = k/g, so g = k/R². The launch speed and the deck
 * height are both already inside k — nothing else is needed.
 */
export function gravityFromRange(gradient, rCm) {
  const R = rCm / 100;
  if (!(R > 0) || !Number.isFinite(gradient)) return NaN;
  return gradient / (R * R);
}

/** Closest catalogued world to a measured g, for naming the sealed world. */
export function nearestWorld(g) {
  let best = null;
  Object.values(WORLDS).forEach((w) => {
    const err = Math.abs(w.g - g) / w.g;
    if (!best || err < best.err) best = { world: w, err };
  });
  return best;
}
