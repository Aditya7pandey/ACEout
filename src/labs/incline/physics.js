/**
 * Block on an inclined plane — Class 11, Work, Energy and Power.
 *
 * Axis convention: x runs along the incline surface, positive DOWN-slope,
 * origin at the release mark. Everything is SI internally (kg, m, s);
 * the UI converts to the units printed on each instrument.
 */

export const G_EARTH = 9.8;

export const PRESETS = {
  earth: { label: 'Earth', g: 9.8 },
  moon: { label: 'Moon', g: 1.62 },
  mars: { label: 'Mars', g: 3.71 },
};

export const SURFACES = {
  wood: { label: 'Varnished wood', muS: 0.32, muK: 0.26 },
  glass: { label: 'Glass sheet', muS: 0.18, muK: 0.14 },
  felt: { label: 'Felt pad', muS: 0.52, muK: 0.45 },
  ice: { label: 'Ice film', muS: 0.06, muK: 0.04 },
  frictionless: { label: 'Ideal (μ = 0)', muS: 0, muK: 0 },
};

export const DEFAULT_PARAMS = {
  massKg: 0.5,
  thetaDeg: 25,
  surface: 'wood',
  g: G_EARTH,
  // 0.9 m keeps the ramp's base within the 100 cm of a metre scale at every
  // angle the lab allows, so the student can always measure the rise and run.
  rampLengthM: 0.9,
  trackM: 0.6, // distance between the release mark and the finish gate
};

/** Where the release mark sits along the metre scale laid on the slope. */
export const RELEASE_MARK_CM = 5;
export const MAX_TRACK_M = 0.7;

const DEG = Math.PI / 180;

export function surfaceOf(params) {
  return SURFACES[params.surface] || SURFACES.wood;
}

/** Does the block break away from rest at this angle? */
export function willSlide(params) {
  const { muS } = surfaceOf(params);
  return Math.tan(params.thetaDeg * DEG) > muS + 1e-12;
}

/** Steady-state acceleration once moving down-slope (m/s², positive = down). */
export function accelerationDown(params) {
  const { muK } = surfaceOf(params);
  const th = params.thetaDeg * DEG;
  return params.g * (Math.sin(th) - muK * Math.cos(th));
}

/**
 * What the guided bench actually needs, which is much less than the free-play
 * integrator below.
 *
 * A block released from rest on a uniform slope has a *constant* acceleration,
 * so there is nothing to integrate: x = ½at² is exact. The run is drawn from
 * the closed form and the time at the gate is solved for directly, which means
 * the number the clock stops on is the true one rather than the accumulation of
 * a few hundred Euler steps.
 */
export function runToGate({ thetaDeg, surface, g = G_EARTH, sM }) {
  const s = SURFACES[surface] || SURFACES.wood;
  const th = thetaDeg * DEG;
  const slides = Math.tan(th) > s.muS + 1e-12;
  const a = g * (Math.sin(th) - s.muK * Math.cos(th));
  if (!slides || a <= 0) return { slides: false, a: 0, t: Infinity };
  return { slides: true, a, t: Math.sqrt((2 * sM) / a) };
}

/** Where the block has got to, t simulated seconds after release. */
export function positionAt(a, tSec) {
  return 0.5 * a * tSec * tSec;
}

/**
 * The two numbers the student's own timing buys them.
 *
 * From rest over a measured distance, a = 2s/t². Put that into
 * a = g(sin θ − μ cos θ) and rearrange, and the coefficient of kinetic friction
 * drops out — with no mass in it, which is the point the report makes.
 */
export function analyseRun({ thetaDeg, sM, tS, g = G_EARTH }) {
  const th = thetaDeg * DEG;
  const a = (2 * sM) / (tS * tS);
  const mu = (g * Math.sin(th) - a) / (g * Math.cos(th));
  return { a, mu };
}

/**
 * Acceleration for the current state, handling both directions of travel and
 * the stuck-at-rest case. This is what the live simulation integrates.
 */
export function accelerationAt(v, params) {
  const { muK, muS } = surfaceOf(params);
  const th = params.thetaDeg * DEG;
  const gSin = params.g * Math.sin(th);
  const gMuCos = muK * params.g * Math.cos(th);

  if (Math.abs(v) < 1e-4) {
    // At rest: static friction holds unless gravity along the slope beats it.
    const gMuSCos = muS * params.g * Math.cos(th);
    if (gSin <= gMuSCos) return 0;
    return gSin - gMuCos;
  }
  // Kinetic friction always opposes motion.
  return gSin - Math.sign(v) * gMuCos;
}

/** One semi-implicit Euler step. dt should be <= 1/120 s for stability. */
export function step(state, params, dt) {
  const a = accelerationAt(state.v, params);
  let v = state.v + a * dt;
  let x = state.x + v * dt;

  const stuck = a === 0 && Math.abs(state.v) < 1e-4;
  if (stuck) {
    v = 0;
    x = state.x;
  }

  // Friction cannot reverse the block — clamp the zero crossing when
  // it is decelerating to a halt going up-slope.
  if (state.v < 0 && v > 0 && accelerationAt(0, params) === 0) {
    v = 0;
    x = state.x;
  }

  const dx = x - state.x;
  const { muK } = surfaceOf(params);
  const frictionForce = muK * params.massKg * params.g * Math.cos(params.thetaDeg * DEG);
  const heat = state.heat + frictionForce * Math.abs(dx);

  const maxX = params.rampLengthM;
  if (x > maxX) {
    return { x: maxX, v: 0, heat, t: state.t + dt, done: true };
  }
  if (x < -0.15) {
    return { x: -0.15, v: 0, heat, t: state.t + dt, done: true };
  }

  return { x, v, heat, t: state.t + dt, done: false };
}

export function initialState(v0 = 0) {
  return { x: 0, v: v0, heat: 0, t: 0, done: false };
}

/**
 * Closed-form truth for a release from rest over a track of length s.
 * Used as the "what actually happened" reference the student is measured against.
 */
export function idealRun(params, sMetres = params.trackM) {
  const th = params.thetaDeg * DEG;
  const { muK } = surfaceOf(params);
  const slides = willSlide(params);
  const a = accelerationDown(params);

  if (!slides || a <= 0) {
    return {
      slides: false,
      a: 0,
      t: Infinity,
      v: 0,
      s: sMetres,
      dropM: sMetres * Math.sin(th),
      wGravity: 0,
      wFriction: 0,
      wNet: 0,
      ke: 0,
      pAvg: 0,
      pFinal: 0,
    };
  }

  const t = Math.sqrt((2 * sMetres) / a);
  const v = a * t;
  const m = params.massKg;
  const dropM = sMetres * Math.sin(th);
  const wGravity = m * params.g * dropM;
  const wFriction = -muK * m * params.g * Math.cos(th) * sMetres;
  const wNet = wGravity + wFriction;
  const ke = 0.5 * m * v * v;

  return {
    slides: true,
    a,
    t,
    v,
    s: sMetres,
    dropM,
    wGravity,
    wFriction,
    wNet,
    ke,
    pAvg: wNet / t,
    pFinal: (m * a) * v,
  };
}

/**
 * Work out every quantity the student is supposed to derive, but from THEIR
 * numbers rather than the simulator's. This is what the analysis screen grades.
 *
 * @param rows  [{ sCm, tS }]  measured track length and time, per trial
 * @param massG measured mass in grams
 * @param heightCm, baseCm  measured rise and run used to get the angle
 */
export function analyseStudentData(rows, { massG, heightCm, baseCm, g = G_EARTH }) {
  const m = massG / 1000;
  const lengthCm = Math.sqrt(heightCm * heightCm + baseCm * baseCm);
  const sinTheta = heightCm / lengthCm;
  const thetaDeg = Math.asin(Math.min(1, Math.max(-1, sinTheta))) / DEG;

  const points = rows
    .filter((r) => Number.isFinite(r.sCm) && Number.isFinite(r.tS) && r.tS > 0)
    .map((r) => {
      const s = r.sCm / 100;
      const t = r.tS;
      // From rest with uniform acceleration: s = ½at²  ->  v = 2s/t
      const v = (2 * s) / t;
      return {
        sCm: r.sCm,
        tS: t,
        sM: s,
        v,
        vSq: v * v,
        ke: 0.5 * m * v * v,
        dropM: s * sinTheta,
        wGravity: m * g * s * sinTheta,
      };
    });

  // v² = 2as, so the line must pass through the origin — a block released from
  // rest has no speed at zero distance. The free fit is kept alongside because
  // how far its intercept misses zero is itself a diagnostic.
  const pairs = points.map((p) => [p.sM, p.vSq]);
  const fit = leastSquaresThroughOrigin(pairs);
  const freeFit = leastSquares(pairs);
  const aMeasured = fit ? fit.slope / 2 : NaN;

  // a = g(sinθ − μ cosθ)  ->  μ = (g sinθ − a) / (g cosθ)
  const cosTheta = baseCm / lengthCm;
  const muMeasured = (g * sinTheta - aMeasured) / (g * cosTheta);

  return {
    m,
    thetaDeg,
    sinTheta,
    cosTheta,
    lengthCm,
    points,
    fit,
    freeFit,
    aMeasured,
    muMeasured,
    // per-trial energy audit
    audit: points.map((p) => ({
      ...p,
      wFriction: -muMeasured * m * g * cosTheta * p.sM,
      wNet: m * g * p.sM * sinTheta - muMeasured * m * g * cosTheta * p.sM,
      power: (0.5 * m * p.vSq) / p.tS,
    })),
  };
}

/** Ordinary least squares through (x, y). Returns slope, intercept, r². */
export function leastSquares(pairs) {
  const n = pairs.length;
  if (n < 2) return null;
  let sx = 0, sy = 0, sxx = 0, sxy = 0, syy = 0;
  for (const [x, y] of pairs) {
    sx += x; sy += y; sxx += x * x; sxy += x * y; syy += y * y;
  }
  const denom = n * sxx - sx * sx;
  if (Math.abs(denom) < 1e-12) return null;
  const slope = (n * sxy - sx * sy) / denom;
  const intercept = (sy - slope * sx) / n;
  const num = n * sxy - sx * sy;
  const den = Math.sqrt((n * sxx - sx * sx) * (n * syy - sy * sy));
  const r = den === 0 ? 0 : num / den;
  return { slope, intercept, r2: r * r, n };
}

/** Best-fit line forced through the origin — the physically correct fit for v² vs s. */
export function leastSquaresThroughOrigin(pairs) {
  let sxy = 0, sxx = 0;
  for (const [x, y] of pairs) { sxy += x * y; sxx += x * x; }
  if (sxx < 1e-12) return null;
  return { slope: sxy / sxx, intercept: 0, n: pairs.length };
}
