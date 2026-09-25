import React, { useMemo } from 'react';
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Rect,
  Line,
  Path,
  G,
  Circle,
  Text as SvgText,
} from 'react-native-svg';
import { color } from '../../theme';
import { RAMP_LENGTH_M } from './steps';

/**
 * The bench, drawn flat.
 *
 * This replaced a three.js stage. Nothing here needs a camera: a block on a
 * slope is a right triangle and a square, and in two dimensions the angle the
 * student set is the angle they can see — which it never quite was in
 * perspective.
 *
 * Two things about the geometry are worth stating plainly.
 *
 * The viewBox is **sized to the frame it is given** — `vbH` follows the stage's
 * aspect rather than being a constant — so the drawing fills the stage exactly
 * instead of letterboxing into a band with dead space above and below it. Every
 * coordinate therefore comes out of `geometry()` rather than being a literal.
 *
 * And the scale is **fixed from the worst case**, not from the current angle.
 * A shallow slope is wide and a steep one is tall; if the drawing were scaled
 * to fit whatever is on screen right now, the ramp would swell and shrink under
 * the student's thumb as they dragged the angle. Pinning the scale to the
 * widest and tallest the ramp can ever be means dragging the angle moves the
 * slope and nothing else.
 */

const DEG = Math.PI / 180;

/** Room reserved around the ramp, in viewBox units. */
const PAD_X = 84;
const PAD_TOP = 78;
const PAD_BOTTOM = 96;

/** The block, in metres, so it scales with the ramp. */
const BLOCK_M = 0.1;

/** How far below the apex the release mark sits, in metres along the slope. */
export const RELEASE_OFFSET_M = 0.06;

const ANGLE_MIN_FOR_SCALE = 20;
const ANGLE_MAX_FOR_SCALE = 40;

function geometry(width, height) {
  // Match the stage's aspect so the SVG fills it rather than letterboxing.
  const vbW = 1000;
  const vbH = Math.max(560, Math.round((vbW * height) / Math.max(1, width)));

  // The widest the ramp ever gets is at the shallowest angle; the tallest, at
  // the steepest. Scale for both and the ramp never rescales mid-drag.
  const widestM = RAMP_LENGTH_M * Math.cos(ANGLE_MIN_FOR_SCALE * DEG);
  const tallestM = RAMP_LENGTH_M * Math.sin(ANGLE_MAX_FOR_SCALE * DEG);
  const ppm = Math.min(
    (vbW - 2 * PAD_X) / widestM,
    (vbH - PAD_TOP - PAD_BOTTOM) / tallestM
  );

  const rampPx = RAMP_LENGTH_M * ppm;
  // The pivot — where the slope meets the ground — is the fixed point of the
  // whole drawing. The apex swings around it as the angle changes.
  const groundY = Math.round((vbH + PAD_TOP - PAD_BOTTOM + tallestM * ppm) / 2);
  const pivotX = Math.round((vbW + widestM * ppm) / 2);

  return { vbW, vbH, ppm, rampPx, groundY, pivotX };
}

/**
 * A point on the slope, `dM` metres down-slope from the apex.
 * Down-slope is right and *down* the screen, so the unit vector is
 * (cos θ, +sin θ) — y grows downwards in SVG.
 */
function onSlope(g, thetaDeg, dM) {
  const th = thetaDeg * DEG;
  const apexX = g.pivotX - g.rampPx * Math.cos(th);
  const apexY = g.groundY - g.rampPx * Math.sin(th);
  return {
    x: apexX + dM * g.ppm * Math.cos(th),
    y: apexY + dM * g.ppm * Math.sin(th),
    apexX,
    apexY,
  };
}

export default function InclineScene2D({
  thetaDeg,
  massKg,
  trackCm,
  surface,
  /** Metres travelled down-slope from the release mark. */
  travelM = 0,
  tripped = false,
  width,
  height,
}) {
  const g = useMemo(() => geometry(width, height), [width, height]);
  const th = thetaDeg * DEG;

  const apex = onSlope(g, thetaDeg, 0);
  const release = onSlope(g, thetaDeg, RELEASE_OFFSET_M);
  const gate = onSlope(g, thetaDeg, RELEASE_OFFSET_M + trackCm / 100);
  const block = onSlope(g, thetaDeg, RELEASE_OFFSET_M + travelM);

  // Outward normal: perpendicular to the slope, pointing away from the wedge.
  const nx = Math.sin(th);
  const ny = -Math.cos(th);

  // The block is drawn a touch heavier as the mass goes up — the only cue on
  // the bench that mass changed at all, and a quiet setup for the report's
  // point that it makes no difference to the timing.
  const blockPx = BLOCK_M * g.ppm;
  const blockH = blockPx * (0.78 + 0.34 * ((massKg - 0.2) / 0.8));

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${g.vbW} ${g.vbH}`}>
      <Defs>
        <LinearGradient id="inc-sky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#F7F4EE" />
          <Stop offset="1" stopColor="#EEE8DC" />
        </LinearGradient>
        <LinearGradient id="inc-wedge" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#D9CDB6" />
          <Stop offset="1" stopColor="#BFB094" />
        </LinearGradient>
        <LinearGradient id="inc-block" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#5E86EA" />
          <Stop offset="1" stopColor="#3257B0" />
        </LinearGradient>
      </Defs>

      <Rect x="0" y="0" width={g.vbW} height={g.vbH} fill="url(#inc-sky)" />

      {/* ---- the wedge ---- */}
      <Path
        d={`M ${apex.apexX} ${apex.apexY} L ${g.pivotX} ${g.groundY} L ${apex.apexX} ${g.groundY} Z`}
        fill="url(#inc-wedge)"
        stroke="#A8997C"
        strokeWidth={3}
        strokeLinejoin="round"
      />

      {/* The running surface itself, laid along the hypotenuse. This is the one
          thing that changes between the two runs, so it is drawn as a distinct
          strip rather than being left as the wedge's own edge. */}
      <Line
        x1={apex.apexX}
        y1={apex.apexY}
        x2={g.pivotX}
        y2={g.groundY}
        stroke={surface === 'glass' ? '#9FC6D4' : '#8C7350'}
        strokeWidth={10}
        strokeLinecap="round"
      />

      {/* ---- the ground ---- */}
      <Line
        x1={40}
        y1={g.groundY}
        x2={g.vbW - 40}
        y2={g.groundY}
        stroke="#A8997C"
        strokeWidth={4}
        strokeLinecap="round"
      />
      <G opacity={0.5}>
        {Array.from({ length: 22 }).map((_, i) => {
          const x = 44 + i * ((g.vbW - 88) / 22);
          return (
            <Line
              key={i}
              x1={x}
              y1={g.groundY + 4}
              x2={x - 16}
              y2={g.groundY + 22}
              stroke="#BFB094"
              strokeWidth={3}
              strokeLinecap="round"
            />
          );
        })}
      </G>

      {/* ---- the angle, marked at the pivot ---- */}
      <AngleArc g={g} thetaDeg={thetaDeg} />

      {/* ---- release mark ---- */}
      <G>
        <Line
          x1={release.x}
          y1={release.y}
          x2={release.x + nx * 34}
          y2={release.y + ny * 34}
          stroke={color.inkMuted}
          strokeWidth={3}
          strokeDasharray="7 5"
        />
        <Circle cx={release.x} cy={release.y} r={5} fill={color.inkMuted} />
      </G>

      {/* ---- the gate ---- */}
      <G>
        <Line
          x1={gate.x}
          y1={gate.y}
          x2={gate.x + nx * 62}
          y2={gate.y + ny * 62}
          stroke={tripped ? color.green : color.red}
          strokeWidth={6}
          strokeLinecap="round"
        />
        <Circle
          cx={gate.x + nx * 62}
          cy={gate.y + ny * 62}
          r={tripped ? 12 : 8}
          fill={tripped ? color.green : color.red}
        />
        <SvgText
          x={gate.x + nx * 84}
          y={gate.y + ny * 84 + 6}
          fill={color.inkMuted}
          fontSize="26"
          textAnchor="middle"
        >
          GATE
        </SvgText>
      </G>

      {/* ---- the block ---- */}
      <G
        transform={`translate(${block.x + nx * (blockH / 2)}, ${
          block.y + ny * (blockH / 2)
        }) rotate(${thetaDeg})`}
      >
        <Rect
          x={-blockPx / 2}
          y={-blockH / 2}
          width={blockPx}
          height={blockH}
          rx={7}
          fill="url(#inc-block)"
          stroke="#284490"
          strokeWidth={3}
        />
      </G>
    </Svg>
  );
}

/** The slope angle, drawn where it actually is: between ground and hypotenuse. */
function AngleArc({ g, thetaDeg }) {
  const th = thetaDeg * DEG;
  const r = Math.min(120, g.rampPx * 0.32);
  const startX = g.pivotX - r;
  const startY = g.groundY;
  const endX = g.pivotX - r * Math.cos(th);
  const endY = g.groundY - r * Math.sin(th);

  return (
    <G>
      <Path
        d={`M ${startX} ${startY} A ${r} ${r} 0 0 1 ${endX} ${endY}`}
        fill="none"
        stroke={color.physics}
        strokeWidth={4}
      />
      <SvgText
        x={g.pivotX - r * 0.62 * Math.cos(th / 2) - 16}
        y={g.groundY - r * 0.52 * Math.sin(th / 2) - 10}
        fill={color.physics}
        fontSize="30"
        fontWeight="bold"
        textAnchor="middle"
      >
        {`${thetaDeg}°`}
      </SvgText>
    </G>
  );
}
