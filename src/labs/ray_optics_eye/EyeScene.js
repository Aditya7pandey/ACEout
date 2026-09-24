import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  Rect,
  Ellipse,
  Circle,
  Path,
  Line,
  G,
  Polyline,
  Text as SvgText,
  ClipPath,
} from 'react-native-svg';
import { BENCH_MAX_CM } from './steps';

/**
 * One station of the bench, drawn side-on: an eye in section, the object on its
 * carriage, and the light actually going between them.
 *
 * Three things about the geometry are worth stating plainly.
 *
 * The viewBox is **sized to the frame it is given**, so the scene always fills
 * the stage exactly rather than letterboxing inside it. The eye is anchored a
 * fixed distance from the right edge and the bench is stretched to fill
 * whatever is left, which is why every coordinate here comes out of `geometry()`
 * instead of being a constant.
 *
 * The drawing uses **two scales**. A metre of bench and two and a half
 * centimetres of eyeball cannot share one ruler and still show anything, so the
 * inside of the eye is drawn far larger, relative to the bench, than it really
 * is. Every textbook diagram of the eye does the same. The rays are
 * geometrically honest within each space and are joined at the lens.
 *
 * And the focus error is **deliberately exaggerated** by `MISS_GAIN`. A real eye
 * a few centimetres past its near point misses the retina by well under a
 * millimetre, which at any drawable scale is invisible. The blur the student
 * sees is the real blur, magnified — the sign, the direction and the moment it
 * appears are all true, and the amount tracks the same sharpness figure the
 * meter reports.
 *
 * No SVG filters are used anywhere here; they are unreliable across the RN SVG
 * backends. Blur is drawn as an overlapping stack of translucent shapes.
 */

const VB_H = 470; // the viewBox is always this tall; its width follows the frame
/**
 * How much the drawing leans on a difference in eyeball length.
 *
 * The whole of myopia is about a millimetre and a half of extra eyeball — four
 * per cent of the thing, which at any honest scale is a drawing nobody can tell
 * apart from a normal eye. The departure from round is exaggerated by this
 * factor so that a long eye reads as long, the same way `MISS_GAIN` below
 * exaggerates the focus error it causes.
 */
const AXIAL_GAIN = 2;

/**
 * The longest eyeball either bench will ask for, as a multiple of a normal
 * one's half-length, after `AXIAL_GAIN`.
 *
 * Room for it is reserved on the right whatever eye is actually being drawn, so
 * that the cornea, the rule and the object all stay exactly where they are when
 * the eyeball length changes and only the back wall moves. Without the reserve
 * the eye would shuffle along the bench as it grew and the student would be
 * watching the wrong thing move.
 */
const MAX_STRETCH = 1.25;
const AXIS_Y = 240;
const BENCH_Y = 392;
const OBJ_H = 62;
const PUPIL_HALF = 26;
const IMG_H = 26;
const EYE_RY = 100;
const EYE_RX = 104; // half-length of a *normal* eyeball, before any stretch
const FRONT_GAP = 48; // lens back to the front of the cornea — fixed anatomy

/**
 * The blur circle, in viewBox units, when the image is as far gone as the meter
 * can report. See the note above — this is a magnification, not a measurement:
 * a real eye a few centimetres past its near point misses the retina by a small
 * fraction of a millimetre and would draw as a point at any honest scale.
 */
const MISS_GAIN = 46;

export const RAY = '#E8A33D';
export const STAGE_BG = '#151C27';

/**
 * Every coordinate in the scene, for a frame of the given shape.
 * The eye sits at the right; the bench fills everything to the left of it.
 *
 * An eyeball that is too long or too short grows **backwards**: the cornea and
 * the lens stay put relative to the bench and the back wall moves, which is
 * what axial myopia and axial hypermetropia actually are. So `retinaX` is not
 * a constant — it is wherever the back of this particular eyeball has ended up,
 * and the rays land on it rather than on a plane assumed to be in the right
 * place. That is the whole content of the eyeball-length control.
 */
function geometry(width, height, stretch = 1) {
  const vbW = Math.max(720, Math.round(VB_H * (width / Math.max(1, height))));
  const rx = EYE_RX * stretch;
  // Room to the right for the longest eyeball allowed plus its optic nerve —
  // reserved whatever this eye's length is, so the lens never moves.
  const lensX = vbW - (2 * EYE_RX * MAX_STRETCH + 14);
  const eyeCx = lensX + rx - FRONT_GAP;
  return {
    vbW,
    lensX,
    rx,
    eyeCx,
    // Just inside the lining, on the axis, where the macula is.
    retinaX: eyeCx + rx - 14,
    specX: lensX - 190,
    // The bench is stretched to use the whole width left of the eye.
    pxPerCm: (lensX - 78) / BENCH_MAX_CM,
  };
}

/**
 * @param station  { key, tone } — the gradient id namespace and the accent
 * @param eye      { irisColor, axialStretch } — the eyeball being drawn
 * @param focus    the result of one `resolveFocus` call; the only opinion about
 *                 blur anywhere in the scene
 * @param lens     null, or { kind: 'concave' | 'convex', mix } for the
 *                 spectacle lens and how far it has slid into place
 */
export default function EyeScene({
  station,
  eye,
  objectCm,
  focus,
  lens = null,
  width,
  height,
}) {
  const stretch = 1 + ((eye.axialStretch || 1) - 1) * AXIAL_GAIN;
  const g = useMemo(() => geometry(width, height, stretch), [width, height, stretch]);

  const kind = lens ? lens.kind : null;
  const rays = useMemo(() => buildRays(g, objectCm, focus, kind), [g, objectCm, focus, kind]);

  // Gradient ids share one document on web: all three stations are mounted.
  const uid = station.key;

  const retinaYs = rays.map((r) => r.retY);
  const patchSpread = Math.max(...retinaYs) - Math.min(...retinaYs);
  const patchMid = (Math.max(...retinaYs) + Math.min(...retinaYs)) / 2;
  const sharpness = focus.sharpness;
  const ox = g.lensX - objectCm * g.pxPerCm;

  return (
    <View style={[styles.stage, { width, height }]}>
      <Svg width={width} height={height} viewBox={`0 0 ${g.vbW} ${VB_H}`}>
        <Defs>
          <LinearGradient id={`bg-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#111823" />
            <Stop offset="0.55" stopColor="#1B222E" />
            <Stop offset="1" stopColor="#0E141C" />
          </LinearGradient>
          <RadialGradient id={`glow-${uid}`} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={station.tone} stopOpacity="0.24" />
            <Stop offset="1" stopColor={station.tone} stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id={`sclera-${uid}`} cx="38%" cy="32%" r="78%">
            <Stop offset="0" stopColor="#FFFFFF" />
            <Stop offset="0.6" stopColor="#F3EDE4" />
            <Stop offset="1" stopColor="#CBBFAF" />
          </RadialGradient>
          <RadialGradient id={`vitreous-${uid}`} cx="45%" cy="40%" r="70%">
            <Stop offset="0" stopColor="#FBF6EC" stopOpacity="0.9" />
            <Stop offset="1" stopColor="#E4D9C6" stopOpacity="0.85" />
          </RadialGradient>
          <LinearGradient id={`iris-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={eye.irisColor[0]} />
            <Stop offset="1" stopColor={eye.irisColor[1]} />
          </LinearGradient>
          <LinearGradient id={`cornea-${uid}`} x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#D7EDF8" stopOpacity="0.72" />
            <Stop offset="1" stopColor="#8FB9CE" stopOpacity="0.1" />
          </LinearGradient>
          <LinearGradient id={`crystal-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.96" />
            <Stop offset="0.5" stopColor="#D8ECF6" stopOpacity="0.85" />
            <Stop offset="1" stopColor="#9EC4D8" stopOpacity="0.78" />
          </LinearGradient>
          <LinearGradient id={`retina-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#C4574A" />
            <Stop offset="0.5" stopColor="#8F332A" />
            <Stop offset="1" stopColor="#C4574A" />
          </LinearGradient>
          <LinearGradient id={`spec-${uid}`} x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#EAF6FB" stopOpacity="0.92" />
            <Stop offset="0.45" stopColor="#B6D8E8" stopOpacity="0.5" />
            <Stop offset="1" stopColor="#7FA9BF" stopOpacity="0.8" />
          </LinearGradient>
          <ClipPath id={`eyeclip-${uid}`}>
            <Ellipse cx={g.eyeCx} cy={AXIS_Y} rx={g.rx - 3} ry={EYE_RY - 3} />
          </ClipPath>
        </Defs>

        <Rect x="0" y="0" width={g.vbW} height={VB_H} fill={`url(#bg-${uid})`} />
        <Ellipse cx={g.eyeCx} cy={AXIS_Y} rx={340} ry={236} fill={`url(#glow-${uid})`} />

        <OpticalAxis g={g} ox={ox} />
        <Bench g={g} objectCm={objectCm} />

        {/* The light outside the eye, before the sclera is painted over it. */}
        <Rays rays={rays} leg="before" corrected={!!lens} sharpness={sharpness} />

        <Eyeball uid={uid} g={g} />
        <G clipPath={`url(#eyeclip-${uid})`}>
          <Retina uid={uid} g={g} />
          <Vitreous uid={uid} g={g} />
          {/* and the cone inside it, over the jelly but under the optics that
              bent it — which is the order the light meets them in. */}
          <Rays rays={rays} leg="after" corrected={!!lens} sharpness={sharpness} />
          <RetinalImage g={g} spread={patchSpread} mid={patchMid} sharpness={sharpness} />
          <Iris uid={uid} g={g} />
          <CrystallineLens uid={uid} g={g} focus={focus} />
          <Cornea uid={uid} g={g} />
        </G>

        {lens && lens.mix > 0 ? (
          <SpectacleLens uid={uid} g={g} kind={lens.kind} mix={lens.mix} tone={station.tone} />
        ) : null}

        <ObjectArrow ox={ox} />
      </Svg>
    </View>
  );
}

// --- light ---------------------------------------------------------------

/**
 * Three rays from the tip of the arrow: one through each edge of the pupil and
 * one through its centre.
 *
 * Each ray runs to the eye's lens, then on towards the point where the image
 * forms, and carries on to the retina plane. Where it crosses the retina is not
 * decided by any blur model — it falls out of the geometry. When the image
 * forms exactly on the retina all three arrive at the same place and the
 * student sees a point; anywhere else they arrive spread out, and that spread
 * is the blur circle.
 */
function buildRays(g, objectCm, focus, kind) {
  const ox = g.lensX - objectCm * g.pxPerCm;
  const tipY = AXIS_Y - OBJ_H;

  // How far along the lens-to-image line the retina sits. t = 1 puts the
  // retina exactly at the image and all three rays land on one point; t < 1
  // catches them still converging, t > 1 catches them already spreading again.
  //
  // The size of that miss is taken from the eye's own loss of sharpness rather
  // than from the millimetres — see MISS_GAIN. It is the same number the meter
  // reports, so the picture and the readout can never disagree.
  const loss = 1 - focus.sharpness;
  const behindRetina = focus.missCm >= 0;
  const t = 1 + (behindRetina ? -1 : 1) * ((loss * MISS_GAIN) / (2 * PUPIL_HALF));

  // A spectacle lens changes how far off-axis the light is by the time it
  // reaches the eye: a concave one spreads it, a convex one gathers it in.
  const spread = kind ? (kind === 'concave' ? 1.34 : 0.7) : 1;
  // The kink is only drawn when the object is genuinely outside the glass. The
  // spectacle plane is drawn much further from the cornea than the centimetre
  // it really sits at — the eye is on its own scale — so an object brought very
  // close ends up nominally inside it. The light still arrives spread by the
  // lens and still lands where `focus` says; only the visible bend is dropped.
  const bendable = !!kind && ox < g.specX - 24;

  const imgY = AXIS_Y + IMG_H;

  return [-PUPIL_HALF, 0, PUPIL_HALF].map((k) => {
    const aimY = AXIS_Y + k; // where it was heading with no spectacles
    const entryY = AXIS_Y + k * spread; // where it actually meets the eye lens
    const retY = entryY + (imgY - entryY) * t;

    const before = bendable
      ? [
          [ox, tipY],
          [g.specX, tipY + ((aimY - tipY) * (g.specX - ox)) / (g.lensX - ox)],
          [g.lensX, entryY],
        ]
      : [
          [ox, tipY],
          [g.lensX, entryY],
        ];

    return {
      before,
      after: [
        [g.lensX, entryY],
        [g.retinaX, retY],
      ],
      retY,
    };
  });
}

/**
 * The rays, in two legs. `before` is the light on its way in and is drawn
 * against the dark bench; `after` is the cone inside the eye and has to be
 * drawn over the vitreous, which is why the two are separate calls.
 */
function Rays({ rays, leg, corrected, sharpness }) {
  const tone = corrected ? '#3FA877' : leg === 'after' ? '#D07C1E' : RAY;
  return (
    <G>
      {rays.map((r, i) => (
        <Polyline
          key={i}
          points={r[leg].map((p) => p.join(',')).join(' ')}
          fill="none"
          stroke={tone}
          strokeWidth={i === 1 ? 2.4 : 1.9}
          strokeOpacity={leg === 'after' ? 0.55 + sharpness * 0.4 : 0.92}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </G>
  );
}

/**
 * What the retina actually receives. A point when the focus is right, and a
 * smear of overlapping translucent lozenges when it is not — the blur circle,
 * seen edge-on because the eye is drawn in section.
 */
function RetinalImage({ g, spread, mid, sharpness }) {
  const crisp = spread < 3;
  const x = g.retinaX - 2;
  return (
    <G>
      {/* the image of the arrow, inverted, fading as it goes soft */}
      <Line
        x1={x}
        y1={AXIS_Y}
        x2={x}
        y2={mid}
        stroke="#FFE6B0"
        strokeWidth={2.6}
        strokeOpacity={(0.18 + sharpness * 0.72) * 0.8}
        strokeLinecap="round"
      />
      {crisp ? (
        <>
          <Circle cx={x} cy={mid} r={7} fill="#FFF2CE" fillOpacity={0.28} />
          <Circle cx={x} cy={mid} r={3.4} fill="#FFF6DC" />
        </>
      ) : (
        [1, 0.68, 0.4].map((f, i) => (
          <Ellipse
            key={i}
            cx={x}
            cy={mid}
            rx={4.5}
            ry={Math.max(3, (spread / 2) * f)}
            fill="#FFE6B0"
            fillOpacity={0.16 + i * 0.1}
          />
        ))
      )}
    </G>
  );
}

// --- anatomy -------------------------------------------------------------

function Eyeball({ uid, g }) {
  return (
    <G>
      {/* optic nerve, leaving low and behind */}
      <Path
        d={`M ${g.eyeCx + g.rx - 18} ${AXIS_Y + 36} q 48 18 82 48`}
        stroke="#D3B39C"
        strokeWidth={26}
        strokeLinecap="round"
        fill="none"
        opacity={0.9}
      />
      <Ellipse cx={g.eyeCx} cy={AXIS_Y} rx={g.rx} ry={EYE_RY} fill={`url(#sclera-${uid})`} />
      <Ellipse
        cx={g.eyeCx}
        cy={AXIS_Y}
        rx={g.rx}
        ry={EYE_RY}
        fill="none"
        stroke="rgba(120,96,74,0.5)"
        strokeWidth={2}
      />
    </G>
  );
}

function Vitreous({ uid, g }) {
  return (
    <Ellipse
      cx={g.eyeCx + 10}
      cy={AXIS_Y}
      rx={g.rx - 18}
      ry={EYE_RY - 16}
      fill={`url(#vitreous-${uid})`}
      fillOpacity={0.45}
    />
  );
}

/** The light-sensitive lining, drawn along the inside of the back wall. */
function Retina({ uid, g }) {
  const r = g.rx - 8;
  const ry = EYE_RY - 8;
  return (
    <G>
      <Path
        d={`M ${g.eyeCx} ${AXIS_Y - ry} A ${r} ${ry} 0 0 1 ${g.eyeCx} ${AXIS_Y + ry}`}
        fill="none"
        stroke={`url(#retina-${uid})`}
        strokeWidth={11}
        strokeLinecap="round"
      />
      {/* macula — the patch of sharpest vision, right on the axis */}
      <Circle cx={g.retinaX + 3} cy={AXIS_Y + IMG_H} r={14} fill="#7E2C24" opacity={0.45} />
    </G>
  );
}

/**
 * The iris, drawn as the two halves of a diaphragm with the pupil between them.
 * Both halves are clipped to the eyeball by the group above, so the ends never
 * escape the sclera however the eyeball is stretched.
 */
function Iris({ uid, g }) {
  const x = g.lensX - 28;
  const outer = 76; // runs out past the sclera; the group's clip trims it
  return (
    <G>
      {[-1, 1].map((s) => (
        <G key={s}>
          <Path
            d={`M ${x} ${AXIS_Y + s * PUPIL_HALF}
                Q ${x - 3} ${AXIS_Y + s * (outer * 0.6)} ${x} ${AXIS_Y + s * outer}
                L ${x + 19} ${AXIS_Y + s * outer}
                Q ${x + 21} ${AXIS_Y + s * (outer * 0.55)} ${x + 18} ${AXIS_Y + s * (PUPIL_HALF + 2)} Z`}
            fill={`url(#iris-${uid})`}
          />
          {/* the pupil margin, the darkest ring of the iris */}
          <Line
            x1={x}
            y1={AXIS_Y + s * PUPIL_HALF}
            x2={x + 18}
            y2={AXIS_Y + s * (PUPIL_HALF + 2)}
            stroke="rgba(10,14,20,0.55)"
            strokeWidth={3}
            strokeLinecap="round"
          />
          {/* radial striations — the texture that makes an iris read as an iris */}
          {Array.from({ length: 5 }).map((_, i) => {
            const y = AXIS_Y + s * (PUPIL_HALF + 7 + i * 8);
            return (
              <Line
                key={i}
                x1={x + 2}
                y1={y}
                x2={x + 17}
                y2={y - s * 2}
                stroke="rgba(255,255,255,0.26)"
                strokeWidth={1.1}
              />
            );
          })}
        </G>
      ))}
    </G>
  );
}

/**
 * The crystalline lens. It is the only part of the eye that moves: it fattens
 * to focus on something close and relaxes flat for the distance, and running
 * out of that movement is exactly what the near point is.
 */
function CrystallineLens({ uid, g, focus }) {
  const half = 30;
  const bulge = 11 + focus.effort * 15;
  const x = g.lensX;
  const d =
    `M ${x} ${AXIS_Y - half} ` +
    `Q ${x + bulge} ${AXIS_Y} ${x} ${AXIS_Y + half} ` +
    `Q ${x - bulge} ${AXIS_Y} ${x} ${AXIS_Y - half} Z`;
  return (
    <G>
      <Path d={d} fill={`url(#crystal-${uid})`} stroke="rgba(120,170,200,0.9)" strokeWidth={1.6} />
      {/* ciliary muscle, tightening as the lens works */}
      {[-1, 1].map((s) => (
        <Path
          key={s}
          d={`M ${x - 4} ${AXIS_Y + s * (half + 2)} q 10 ${s * 13} 24 ${s * 17}`}
          stroke={`rgba(198,132,96,${0.35 + focus.effort * 0.5})`}
          strokeWidth={4 + focus.effort * 3}
          fill="none"
          strokeLinecap="round"
        />
      ))}
    </G>
  );
}

/**
 * The transparent dome at the front — a thin cap bulging slightly proud of the
 * sclera, not a second lens. Two thirds of the eye's converging power is
 * actually here rather than in the crystalline lens; the lens only does the
 * adjusting.
 */
function Cornea({ uid, g }) {
  const front = g.eyeCx - g.rx;
  const x = front + 26;
  const h = 50;
  return (
    <Path
      d={`M ${x} ${AXIS_Y - h}
          Q ${front - 13} ${AXIS_Y} ${x} ${AXIS_Y + h}
          Q ${front + 16} ${AXIS_Y} ${x} ${AXIS_Y - h} Z`}
      fill={`url(#cornea-${uid})`}
      stroke="rgba(206,235,248,0.75)"
      strokeWidth={1.6}
    />
  );
}

/** A real spectacle lens, ground thin in the middle or thick, as required. */
function SpectacleLens({ uid, g, kind, mix, tone }) {
  const half = 74;
  const w = 15;
  const x = g.specX;
  const concave = kind === 'concave';
  // It slides down into place. The offset goes into the coordinates rather than
  // a transform, which keeps the two SVG backends out of it entirely.
  const cy = AXIS_Y + (1 - mix) * -130;

  const d = concave
    ? `M ${x - w} ${cy - half} L ${x + w} ${cy - half}
       Q ${x + 1} ${cy} ${x + w} ${cy + half}
       L ${x - w} ${cy + half}
       Q ${x - 1} ${cy} ${x - w} ${cy - half} Z`
    : `M ${x} ${cy - half}
       Q ${x + w + 7} ${cy} ${x} ${cy + half}
       Q ${x - w - 7} ${cy} ${x} ${cy - half} Z`;

  return (
    <G opacity={mix}>
      <Path d={d} fill={`url(#spec-${uid})`} stroke="rgba(214,240,250,0.9)" strokeWidth={2} />
      {/* the glint that says glass */}
      <Line
        x1={x - 4}
        y1={cy - half + 16}
        x2={x - 4}
        y2={cy - 14}
        stroke="rgba(255,255,255,0.7)"
        strokeWidth={2.4}
        strokeLinecap="round"
      />
      <SvgText
        x={x}
        y={cy - half - 18}
        fill={tone}
        fontSize="17"
        fontWeight="bold"
        textAnchor="middle"
      >
        {concave ? 'CONCAVE' : 'CONVEX'}
      </SvgText>
    </G>
  );
}

// --- bench ---------------------------------------------------------------

function OpticalAxis({ g, ox }) {
  return (
    <G>
      <Line
        x1={30}
        y1={AXIS_Y}
        x2={g.retinaX}
        y2={AXIS_Y}
        stroke="rgba(255,255,255,0.2)"
        strokeWidth={1.2}
        strokeDasharray="7 8"
      />
      <Line
        x1={ox}
        y1={AXIS_Y}
        x2={ox}
        y2={BENCH_Y - 8}
        stroke="rgba(255,255,255,0.18)"
        strokeWidth={1}
        strokeDasharray="4 6"
      />
    </G>
  );
}

/** The graduated rule the carriage runs on. Zero is at the eye's own lens. */
function Bench({ g, objectCm }) {
  const x = (cm) => g.lensX - cm * g.pxPerCm;
  const ticks = [];
  for (let cm = 0; cm <= BENCH_MAX_CM; cm += 5) {
    const major = cm % 20 === 0;
    ticks.push(
      <G key={cm}>
        <Line
          x1={x(cm)}
          y1={BENCH_Y}
          x2={x(cm)}
          y2={BENCH_Y + (major ? 15 : 8)}
          stroke="rgba(255,255,255,0.45)"
          strokeWidth={major ? 1.8 : 1}
        />
        {major ? (
          <SvgText
            x={x(cm)}
            y={BENCH_Y + 35}
            fill="rgba(255,255,255,0.62)"
            fontSize="18"
            textAnchor="middle"
          >
            {cm}
          </SvgText>
        ) : null}
      </G>
    );
  }

  const ox = x(objectCm);
  return (
    <G>
      <Rect
        x={x(BENCH_MAX_CM)}
        y={BENCH_Y - 5}
        width={BENCH_MAX_CM * g.pxPerCm}
        height={5}
        fill="rgba(255,255,255,0.09)"
      />
      <Line
        x1={x(BENCH_MAX_CM)}
        y1={BENCH_Y}
        x2={x(0)}
        y2={BENCH_Y}
        stroke="rgba(255,255,255,0.55)"
        strokeWidth={2}
      />
      {ticks}
      <SvgText
        x={x(BENCH_MAX_CM)}
        y={BENCH_Y + 60}
        fill="rgba(255,255,255,0.42)"
        fontSize="15"
        letterSpacing="2"
      >
        DISTANCE FROM EYE (cm)
      </SvgText>
      {/* the carriage itself */}
      <Path
        d={`M ${ox - 15} ${BENCH_Y - 6} L ${ox + 15} ${BENCH_Y - 6} L ${ox + 10} ${BENCH_Y + 9} L ${ox - 10} ${BENCH_Y + 9} Z`}
        fill={RAY}
        fillOpacity={0.85}
      />
    </G>
  );
}

/** The object: a lit arrow standing on the carriage. */
function ObjectArrow({ ox }) {
  const tipY = AXIS_Y - OBJ_H;
  return (
    <G>
      <Line
        x1={ox}
        y1={BENCH_Y - 6}
        x2={ox}
        y2={AXIS_Y}
        stroke="rgba(255,255,255,0.26)"
        strokeWidth={4}
      />
      <Line x1={ox} y1={AXIS_Y} x2={ox} y2={tipY + 8} stroke={RAY} strokeWidth={5} strokeLinecap="round" />
      <Path d={`M ${ox} ${tipY - 4} L ${ox - 11} ${tipY + 16} L ${ox + 11} ${tipY + 16} Z`} fill={RAY} />
      <Circle cx={ox} cy={tipY + 2} r={13} fill={RAY} fillOpacity={0.18} />
      <Circle cx={ox} cy={tipY + 2} r={5} fill="#FFF3D8" />
    </G>
  );
}

const styles = StyleSheet.create({
  stage: { overflow: 'hidden', backgroundColor: STAGE_BG },
});
