import React from 'react';
import Svg, { Rect, G, Text as SvgText } from 'react-native-svg';
import { color, font } from '../../theme';

/**
 * The bench seen from behind the retina: an acuity card as this eye is
 * currently resolving it.
 *
 * The side-on scene next door shows the blur circle edge-on, as a smear of
 * light on the back wall of the eye. That is the honest picture of the optics
 * but it is not what losing focus *feels* like, and a student who has never
 * had their eyes tested has no reason to connect a fattening lozenge with the
 * moment a letter stops being a letter. This panel closes that gap: same
 * eye, same instant, turned through ninety degrees.
 *
 * Two things about it are worth stating plainly.
 *
 * The card is drawn at a **fixed angular size**, the way a Snellen chart is
 * specified at its test distance — it does not swell as the arrow comes in.
 * What changes is only the blur, so the panel isolates the one variable the
 * station is actually about.
 *
 * And the blur is driven by `sharpness` — the same single number the meter's
 * bar reports and the same one that sets the spread of the rays on the retina
 * in `EyeScene`. Nothing here has its own opinion about focus, so the picture,
 * the bar and the diagram cannot drift apart.
 *
 * Rows go illegible in order, smallest first, because the blur circle is one
 * fixed size on the retina however large the letter it lands on is. That
 * ordering is the whole idea behind an eye chart, and it falls out of the
 * geometry rather than being staged.
 *
 * No SVG filters: they are unreliable across the react-native-svg backends.
 * The blur is a stack of offset copies, the same trick `EyeScene` uses.
 */

const VB_W = 208;
const VB_H = 120;
const CX = VB_W / 2;

/** The card. Baselines are chosen so a full-strength smear stays on the paper. */
const ROWS = [
  { key: 'r1', text: 'E', size: 34, y: 42 },
  { key: 'r2', text: 'F  P', size: 23, y: 68 },
  { key: 'r3', text: 'T  O  Z', size: 16, y: 88 },
  { key: 'r4', text: 'L  P  E  D', size: 11, y: 104 },
];

/**
 * Widest smear, in viewBox units. Set so that the top letter — whose strokes
 * are about a fifth of its height — is finally swallowed at the far end of the
 * meter, and not before.
 */
const R_MAX = 13;

// Two rings of six, the inner one rotated thirty degrees so the copies fall
// between the outer ones rather than behind them.
const OUTER = ring(6, 0);
const INNER = ring(6, Math.PI / 6);

export default function RetinalView({ sharpness = 1, width, height }) {
  const s = clamp01(sharpness);
  const r = R_MAX * (1 - s);

  // The crisp copy hands over to the smeared stack rather than being swapped
  // for it, so the first millimetre past the limit softens instead of popping.
  const t = clamp01((r - 0.35) / 1.5);

  // A real blur spreads a stroke's ink over more paper, so the stroke also
  // gets lighter. Without this the letters would stay black and merely double.
  const ink = 1 / (1 + r / 9);

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${VB_W} ${VB_H}`}>
      <Rect x="0" y="0" width={VB_W} height={VB_H} rx="6" fill="#FBF7EF" />
      {ROWS.map((row) => (
        <G key={row.key}>
          {t > 0 ? <Smear row={row} r={r} alpha={t * ink} /> : null}
          {t < 1 ? <Glyph row={row} dx={0} dy={0} opacity={1 - t} /> : null}
        </G>
      ))}
      {/* the card's own edge, over the smear, so letters run off it cleanly */}
      <Rect
        x="0.6"
        y="0.6"
        width={VB_W - 1.2}
        height={VB_H - 1.2}
        rx="6"
        fill="none"
        stroke="rgba(28,24,21,0.16)"
        strokeWidth="1.2"
      />
    </Svg>
  );
}

/** One row's blur circle, drawn as overlapping copies of the row. */
function Smear({ row, r, alpha }) {
  return (
    <G>
      {OUTER.map(([ux, uy], i) => (
        <Glyph key={`o${i}`} row={row} dx={ux * r} dy={uy * r} opacity={0.13 * alpha} />
      ))}
      {INNER.map(([ux, uy], i) => (
        <Glyph
          key={`i${i}`}
          row={row}
          dx={ux * r * 0.52}
          dy={uy * r * 0.52}
          opacity={0.2 * alpha}
        />
      ))}
      <Glyph row={row} dx={0} dy={0} opacity={0.3 * alpha} />
    </G>
  );
}

function Glyph({ row, dx, dy, opacity }) {
  return (
    <SvgText
      x={CX + dx}
      y={row.y + dy}
      fontSize={row.size}
      fontFamily={font.bold}
      fontWeight="bold"
      fill={color.ink}
      fillOpacity={opacity}
      textAnchor="middle"
    >
      {row.text}
    </SvgText>
  );
}

/**
 * What to call the state of the card, in the only terms the eye itself reports
 * it: a point, or not a point. Never a distance — at the guided stations that
 * is the thing being measured.
 *
 * The top label flips on the eye's own resolution limit rather than on a round
 * number off the bar, so the moment it stops saying "Sharp point" is the moment
 * the image genuinely stops being one. That flip is the boundary the student is
 * hunting, and both benches read it from here so they cannot word it
 * differently.
 */
export function verdictFor(sharpness, sharp, corrected) {
  if (sharp) {
    return {
      label: corrected ? 'Sharp — corrected' : 'Sharp point',
      tone: corrected ? '#7FD6A8' : color.green,
    };
  }
  if (sharpness > 0.45) return { label: 'Softening', tone: color.amber };
  if (sharpness > 0.12) return { label: 'Blurred', tone: color.red };
  return { label: 'Unreadable', tone: color.red };
}

function ring(n, phase) {
  return Array.from({ length: n }, (_, i) => {
    const a = phase + (i * 2 * Math.PI) / n;
    return [Math.cos(a), Math.sin(a)];
  });
}

function clamp01(x) {
  return Math.min(1, Math.max(0, x));
}
