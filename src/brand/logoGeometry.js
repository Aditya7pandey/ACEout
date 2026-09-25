/**
 * The LabVR mark, as geometry rather than as a picture.
 *
 * The mark is a vortex: a ring of tapered blades, each one bent along a
 * circular arc, each rotated a little further round and drawn a little smaller
 * than the last so the ring reads as a spiral rather than a pinwheel.
 *
 * It lives here as maths, not as an SVG file or a PNG, because two very
 * different things need it and they must not drift apart:
 *
 *   - `LogoMark.js` renders it with react-native-svg, in the app
 *   - `scripts/make-brand-assets.js` rasterises it to the PNGs Expo needs for
 *     the launcher icon, the splash and the favicon
 *
 * Both call `bladePaths()`. Change a number here and the app and every icon
 * change together on the next `npm run brand`.
 *
 * Coordinates are in a 0..VIEW box with the vortex centred; the caller scales.
 */

export const VIEW = 512;
export const CENTRE = VIEW / 2;

/** The teal the wordmark is set in. */
export const BRAND = '#1B6B85';

const TAU = Math.PI * 2;

export const DEFAULTS = {
  /** How many blades go round the vortex. */
  blades: 9,
  /** Where a blade starts, at the rim of the mark. */
  outerRadius: 228,
  /** Where it ends, curling in towards the middle. */
  innerRadius: 62,
  /** How far round a blade travels as it spirals in, in radians. */
  sweep: 2.95,
  /** Half-thickness of a blade at its fattest. */
  weight: 22,
  /** Samples per edge. 64 is smooth at 1024px and cheap at nine blades. */
  steps: 64,
};

/**
 * Half-thickness at position `u` (0..1) along a blade.
 *
 * A blade is a crescent: a point at the rim, swelling through the body, and a
 * point again at the inner tip. `sin(πu)` gives that; the exponent below 1
 * fattens the middle so the blade reads as a stroke rather than as a needle,
 * and the linear term thins the inner half so the tip tapers to nothing as it
 * reaches the eye of the vortex.
 */
function thickness(u) {
  // u**0.78 inside the sine moves the fat part out towards the rim; the linear
  // term then thins the whole inner half so the tips do not crowd the eye.
  return Math.sin(Math.PI * u ** 0.78) ** 0.7 * (1 - 0.46 * u);
}

/**
 * One blade's outline, as a closed ring of points.
 *
 * The spine is a **logarithmic spiral** — r decays geometrically as the angle
 * advances — which is what makes the mark a whirlpool rather than a pinwheel.
 * A circular arc gives blades that sit in a ring at one radius; a spiral gives
 * blades that visibly travel inward, and the nine of them together read as one
 * turning motion.
 *
 * Walk the outer edge from rim to eye, then the inner edge back, and close.
 * Both edges come off the same spine, so the two ends meet at a point with no
 * cap — that is what gives a blade its cusps.
 */
function blade(index, opts) {
  const { outerRadius, innerRadius, sweep, weight, blades, steps } = opts;

  const spin = (index / blades) * TAU;
  // r(u) = outer · (inner/outer)^u — the spiral, in the form that pins both ends.
  const ratio = innerRadius / outerRadius;

  const outer = [];
  const inner = [];
  for (let i = 0; i <= steps; i++) {
    const u = i / steps;
    const a = spin + u * sweep;
    const r = outerRadius * ratio ** u;
    const half = weight * thickness(u);
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    outer.push([CENTRE + (r + half) * ca, CENTRE + (r + half) * sa]);
    inner.push([CENTRE + (r - half) * ca, CENTRE + (r - half) * sa]);
  }
  inner.reverse();
  return outer.concat(inner);
}

/** Every blade, outermost first. */
export function blades(options = {}) {
  const opts = { ...DEFAULTS, ...options };
  return Array.from({ length: opts.blades }, (_, i) => blade(i, opts));
}

/** The same blades as SVG path data. */
export function bladePaths(options = {}) {
  return blades(options).map((points) => {
    const d = points
      .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`)
      .join('');
    return `${d}Z`;
  });
}

/**
 * Is (x, y) inside this outline? Standard crossing-number test.
 *
 * Only the rasteriser needs this — react-native-svg fills the path itself —
 * but it belongs next to the geometry that produced the outline.
 */
export function contains(points, x, y) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}
