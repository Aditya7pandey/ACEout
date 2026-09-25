/**
 * The eye as a thin lens with a fixed image distance.
 *
 * The retina cannot move, so the eye focuses by changing the power of its own
 * crystalline lens — accommodation. Every eye here is described by the two
 * distances a practical actually measures:
 *
 *   far point   the furthest point it can hold in focus, lens fully relaxed
 *   near point  the closest point it can hold in focus, lens working hardest
 *
 * Everything else — the power band, where the image lands, how badly it blurs —
 * falls out of those two numbers and the lens-to-retina distance.
 *
 * Distances are in centimetres unless a name says otherwise. Powers are in
 * dioptres, which are per *metre*, so every conversion in here is a factor 100.
 */

/** Lens-to-retina distance of a *normal* relaxed adult eye. */
export const RETINA_CM = 2.5;

/**
 * The two numbers that describe the eye's own optics, as opposed to the
 * eyeball they sit in.
 *
 * `RELAXED_D` is what the cornea and the slack lens come to between them: 40 D
 * throws infinity onto a retina 2.5 cm behind them, which is what a normal eye
 * does at rest. `ACCOMMODATION_D` is how much more the lens can summon by
 * fattening, and running out of it is exactly what the near point is — 44 D
 * brings that same eye in to 25 cm.
 *
 * Both are held fixed across every eye on this bench, and the *eyeball* is what
 * varies. That is the axial account of the two defects and it is the one the
 * NCERT chapter gives: a myopic eye is not a weak eye, it is a long one.
 */
export const RELAXED_D = 100 / RETINA_CM; // 40 D
export const ACCOMMODATION_D = 4;

/** Power needed to throw an object at `uCm` onto a retina `vCm` away. */
export function powerNeeded(uCm, vCm = RETINA_CM) {
  return 100 / vCm + (Number.isFinite(uCm) ? 100 / uCm : 0);
}

/**
 * The far and near points of an eyeball of the given length, wearing `specD`
 * dioptres of spectacle lens, from nothing but the power band above.
 *
 *   far   the furthest it holds with the lens slack     1/u = P − 1/v
 *   near  the closest it holds with the lens working    1/u = (P + A) − 1/v
 *
 * A non-positive result means that end of the range runs off to infinity: a
 * normal or long-sighted eye has no far point, and an eyeball short enough
 * cannot reach anything at all even straining.
 */
export function limitsFor(retinaCm, specD = 0) {
  const pRetina = 100 / retinaCm;
  const far = RELAXED_D + specD - pRetina;
  const near = RELAXED_D + specD + ACCOMMODATION_D - pRetina;
  return {
    farCm: far > 1e-9 ? 100 / far : Infinity,
    nearCm: near > 1e-9 ? 100 / near : Infinity,
  };
}

/**
 * The spectacle power that would make an eyeball of this length behave like a
 * normal one — the prescription, in the dioptres written on a real one.
 *
 * It is the mismatch between what the eye's optics supply and what its own
 * depth asks for, which is why a long eyeball needs a negative lens and a short
 * one a positive lens.
 */
export function idealSpecD(retinaCm) {
  return 100 / retinaCm - RELAXED_D;
}

/**
 * How long the eyeball has to be to put its near point at `nearCm`. The three
 * stations are specified by the distance the student will actually measure, so
 * this is what turns that back into an eyeball.
 */
function axialLengthForNear(nearCm) {
  return 100 / (RELAXED_D + ACCOMMODATION_D - 100 / nearCm);
}

/**
 * The three eyes on the bench, each one nothing but an eyeball length.
 *
 * `farCm: Infinity` means the relaxed eye is focused on infinity, which is what
 * "normal distance vision" means. A myopic eye is too long for its own optics,
 * so its far point falls back to a finite distance — that finite number is the
 * whole diagnosis, and it is what the student will measure at station two.
 */
export const EYES = {
  normal: makeEye({
    key: 'normal',
    name: 'Normal eye',
    nearCm: 25, // → 25.00 mm, far point at infinity
    irisColor: ['#9CBFD4', '#3C617A'],
  }),
  myopia: makeEye({
    key: 'myopia',
    name: 'Short-sighted eye',
    // A shade over a millimetre too long, which is all it takes: the far point
    // falls back from infinity to 40 cm and the near point comes in to 15.4.
    nearCm: 100 / (100 / 40 + 4), // → 26.67 mm
    irisColor: ['#A8B894', '#4C5E3C'],
  }),
  hypermetropia: makeEye({
    key: 'hypermetropia',
    name: 'Long-sighted eye',
    nearCm: 60, // → 23.62 mm
    irisColor: ['#C6A378', '#6E5133'],
  }),
};

function makeEye({ nearCm, ...rest }) {
  const retinaCm = axialLengthForNear(nearCm);
  return {
    ...rest,
    retinaCm,
    ...limitsFor(retinaCm),
    // The eyeball is drawn at its true relative length. A millimetre of it is
    // the entire difference between these three eyes, so the drawing leans on
    // it a little: see `AXIAL_GAIN` in EyeScene.
    axialStretch: retinaCm / RETINA_CM,
  };
}


/**
 * The eye's own limit of resolution, as a blur-circle diameter on the retina.
 * Below this the image still reads as a point.
 *
 * Four microns is about the width of a cone, and it is the number that makes
 * the boundary land where it should: with it, a point stops being a point at
 * 24.8 cm on the normal eye, 40.6 cm on the myopic one and 58.6 cm on the
 * long-sighted one — within a centimetre and a half of the true limit in every
 * case, which is what `TOLERANCE_CM` then has to cover. A looser figure pushes
 * the visible boundary several centimetres past the real one and the student
 * ends up measuring the threshold of the meter rather than the eye.
 */
const RESOLUTION_CM = 0.0004;

/** Blur diameter at which the image is unreadable — the far end of the meter. */
const BLUR_FULL_CM = 0.012;

/** Pupil diameter in room light. Sets how fast a focus error turns into blur. */
const PUPIL_CM = 0.4;

/**
 * Where the image of an object at `uCm` actually lands, and how badly.
 *
 * The eye supplies whatever power it can inside its band. If the object needs
 * more than it has, the image falls behind the retina; less, and it falls in
 * front. Either way the cone of light is caught mid-flight and paints a disc
 * instead of a point.
 *
 * `retinaCm` is how deep the eyeball is and `specD` is the spectacle lens in
 * front of it, taken as thin and in contact with the eye — the treatment the
 * chapter uses, and near enough for glasses a centimetre off the cornea. A
 * spectacle lens shifts the whole accommodation band rather than replacing it,
 * because the eye goes on accommodating through it.
 *
 * This is the only place in the lab where focus is decided. The meter, the
 * acuity card and the rays in the diagram all read their blur out of one call
 * to it, so they cannot drift apart.
 */
export function resolveFocus({ retinaCm = RETINA_CM, specD = 0 }, uCm) {
  const pMin = RELAXED_D + specD;
  const pMax = pMin + ACCOMMODATION_D;
  const needed = powerNeeded(uCm, retinaCm);
  const used = Math.min(pMax, Math.max(pMin, needed));

  // 1/v = P − 1/u, in metres, then back to centimetres.
  const invV = used - (Number.isFinite(uCm) ? 100 / uCm : 0);
  const imageCm = invV > 0 ? 100 / invV : Infinity;
  const missCm = imageCm - retinaCm; // + behind the retina, − in front

  // Light still diverging when it reaches the back wall never forms an image
  // at all; the pupil's own width is as wide as the patch can get.
  const blurCm = Number.isFinite(imageCm)
    ? Math.min(PUPIL_CM, (PUPIL_CM * Math.abs(missCm)) / imageCm)
    : PUPIL_CM;

  const sharpness = clamp01(
    1 - (blurCm - RESOLUTION_CM) / (BLUR_FULL_CM - RESOLUTION_CM)
  );

  return {
    needed,
    used,
    imageCm,
    missCm,
    blurCm,
    sharpness,
    sharp: blurCm <= RESOLUTION_CM,
    // How hard the lens is working, 0 relaxed → 1 straining. Drives the bulge.
    effort: clamp01((used - pMin) / ACCOMMODATION_D),
    straining: used >= pMax - 1e-9 && needed > pMax - 1e-9,
  };
}

/** The same thing for one of the three named eyes, wearing nothing. */
export function focusFor(eye, uCm) {
  return resolveFocus({ retinaCm: eye.retinaCm }, uCm);
}

/**
 * What is wrong with an eyeball of this length, in the chapter's language.
 *
 * The verdict comes off the far and near points rather than off the millimetres
 * directly, because those are the things a practical can actually measure —
 * and they are what makes a defect a defect.
 */
export function diagnose(retinaCm) {
  const { farCm, nearCm } = limitsFor(retinaCm);
  // `key` only — the name the panel prints comes from the catalogue, keyed
  // `eye.diagnosis.<key>`.
  if (Number.isFinite(farCm)) return { key: 'myopia', farCm, nearCm };
  if (nearCm > NORMAL_NEAR_CM + 0.5) return { key: 'hypermetropia', farCm, nearCm };
  return { key: 'normal', farCm, nearCm };
}

/**
 * The limit this station is hunting: the distance at which the image *just*
 * stops being sharp. This is the answer, and nothing in the UI may print it.
 */
export function trueLimitCm(station) {
  const eye = EYES[station.eyeKey];
  return station.limit === 'far' ? eye.farCm : eye.nearCm;
}

/** How close a recorded reading has to be before the station accepts it. */
export const TOLERANCE_CM = 1.5;

/**
 * Validate the *action*, not the truth: did they actually stop at the boundary?
 *
 * A miss comes back with the direction to go, never the number. Sliding past
 * the limit and sliding not far enough are different mistakes and are told
 * apart, because that is the feedback a demonstrator would give.
 */
export function checkReading(station, readingCm) {
  const limit = trueLimitCm(station);
  const delta = readingCm - limit;

  if (Math.abs(delta) <= TOLERANCE_CM) {
    return { ok: true };
  }

  // For a near point the image goes soft as the object comes closer; for a far
  // point it goes soft as the object goes away. "Too far out" means opposite
  // things at the two kinds of station.
  const tooSharp = station.limit === 'near' ? delta > 0 : delta < 0;

  // The hint comes back as catalogue keys rather than a sentence: the bench is
  // bilingual and this module has no business knowing which language is on.
  return {
    ok: false,
    tooSharp,
    hintKey: tooSharp ? 'eye.nudge.short' : 'eye.nudge.past',
    dirKey: tooSharp
      ? station.direction === 'in'
        ? 'eye.dir.closer'
        : 'eye.dir.further'
      : station.direction === 'in'
      ? 'eye.dir.out'
      : 'eye.dir.in',
  };
}

/**
 * The spectacle lens this eye needs, worked out from the student's own reading.
 *
 *   myopia          the lens must throw infinity onto the far point they found,
 *                   so f = −(far point) and the power comes out negative.
 *   hypermetropia   the lens must throw the 25 cm a normal eye manages onto the
 *                   near point they found: 1/f = 1/25 − 1/(near point).
 *
 * `powerD` is in dioptres — the number written on a real prescription.
 */
export const NORMAL_NEAR_CM = 25;

export function correctionFor(station, readingCm) {
  if (station.eyeKey === 'myopia') {
    const fCm = -readingCm;
    return { kind: 'concave', lensKey: 'eye.lens.concave', fCm, powerD: 100 / fCm };
  }

  if (station.eyeKey === 'hypermetropia') {
    const invF = 1 / NORMAL_NEAR_CM - 1 / readingCm;
    const fCm = 1 / invF;
    return { kind: 'convex', lensKey: 'eye.lens.convex', fCm, powerD: 100 / fCm };
  }

  return { kind: 'none', lensKey: 'eye.lens.none', fCm: Infinity, powerD: 0 };
}

// --- little helpers -------------------------------------------------------

function clamp01(x) {
  return Math.min(1, Math.max(0, x));
}

export function fmt(x, dp = 1) {
  if (!Number.isFinite(x)) return '∞';
  return x.toFixed(dp);
}

export function fmtSigned(x, dp = 2) {
  if (!Number.isFinite(x)) return '∞';
  return `${x >= 0 ? '+' : '−'}${Math.abs(x).toFixed(dp)}`;
}
