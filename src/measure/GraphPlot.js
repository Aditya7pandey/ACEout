import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Svg, { Line, Circle, Rect, Text as SvgText, G, Path } from 'react-native-svg';
import { color, font, radius } from '../theme';
import { Eyebrow } from '../components/ui';
import { leastSquares, leastSquaresThroughOrigin } from '../labs/incline/physics';
import { formatSigFigs } from './leastCount';

/**
 * Scatter of the student's own points with a least-squares line of best fit.
 *
 * The fit can be forced through the origin, because for v² against s the
 * physics says the intercept is zero — and comparing the free fit's intercept
 * with zero is itself a check on the experiment.
 */
export default function GraphPlot({
  points,
  xLabel,
  yLabel,
  xUnit = '',
  yUnit = '',
  height = 250,
  width = 320,
  slopeLabel,
  slopeFormat,
  allowOriginToggle = true,
  defaultThroughOrigin = false,
  accent = color.physics,
}) {
  const [throughOrigin, setThroughOrigin] = useState(defaultThroughOrigin);

  const pad = { l: 46, r: 14, t: 16, b: 38 };
  const plotW = width - pad.l - pad.r;
  const plotH = height - pad.t - pad.b;

  const { xMax, yMax, fit, ticks } = useMemo(() => {
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    const xm = niceMax(Math.max(0.0001, ...xs));
    const ym = niceMax(Math.max(0.0001, ...ys));
    const pairs = points.map((p) => [p.x, p.y]);
    const f =
      points.length < 2
        ? null
        : throughOrigin
        ? leastSquaresThroughOrigin(pairs)
        : leastSquares(pairs);
    return {
      xMax: xm,
      yMax: ym,
      fit: f,
      ticks: { x: tickValues(xm), y: tickValues(ym) },
    };
  }, [points, throughOrigin]);

  const sx = (v) => pad.l + (v / xMax) * plotW;
  const sy = (v) => pad.t + plotH - (v / yMax) * plotH;

  // clip the fit line to the plot box
  const fitPath = useMemo(() => {
    if (!fit) return null;
    const y0 = fit.intercept;
    const y1 = fit.intercept + fit.slope * xMax;
    const clamp = (y) => Math.min(yMax, Math.max(0, y));
    // find x where line enters/leaves the visible band
    const xAt = (y) => (fit.slope === 0 ? 0 : (y - fit.intercept) / fit.slope);
    let ax = 0, ay = y0, bx = xMax, by = y1;
    if (ay < 0 || ay > yMax) { ax = Math.min(xMax, Math.max(0, xAt(clamp(ay)))); ay = clamp(ay); }
    if (by < 0 || by > yMax) { bx = Math.min(xMax, Math.max(0, xAt(clamp(by)))); by = clamp(by); }
    return `M ${sx(ax)} ${sy(ay)} L ${sx(bx)} ${sy(by)}`;
  }, [fit, xMax, yMax]);

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Eyebrow>{`${yLabel} against ${xLabel}`}</Eyebrow>
        {allowOriginToggle ? (
          <Pressable onPress={() => setThroughOrigin((v) => !v)} style={styles.toggle}>
            <View style={[styles.dot, throughOrigin && { backgroundColor: accent }]} />
            <Text style={styles.toggleLabel}>Through origin</Text>
          </Pressable>
        ) : null}
      </View>

      <Svg width={width} height={height}>
        <Rect
          x={pad.l}
          y={pad.t}
          width={plotW}
          height={plotH}
          fill="rgba(28,24,21,0.018)"
          stroke="none"
        />

        {ticks.y.map((t) => (
          <G key={`y${t}`}>
            <Line
              x1={pad.l}
              y1={sy(t)}
              x2={pad.l + plotW}
              y2={sy(t)}
              stroke="rgba(28,24,21,0.09)"
              strokeWidth={1}
            />
            <SvgText
              x={pad.l - 6}
              y={sy(t) + 3.5}
              fontSize={9}
              textAnchor="end"
              fill={color.inkMuted}
              fontFamily={font.semibold}
            >
              {trimNum(t)}
            </SvgText>
          </G>
        ))}
        {ticks.x.map((t) => (
          <G key={`x${t}`}>
            <Line
              x1={sx(t)}
              y1={pad.t}
              x2={sx(t)}
              y2={pad.t + plotH}
              stroke="rgba(28,24,21,0.06)"
              strokeWidth={1}
            />
            <SvgText
              x={sx(t)}
              y={pad.t + plotH + 14}
              fontSize={9}
              textAnchor="middle"
              fill={color.inkMuted}
              fontFamily={font.semibold}
            >
              {trimNum(t)}
            </SvgText>
          </G>
        ))}

        {/* axes */}
        <Line x1={pad.l} y1={pad.t} x2={pad.l} y2={pad.t + plotH} stroke={color.inkBody} strokeWidth={1.2} />
        <Line
          x1={pad.l}
          y1={pad.t + plotH}
          x2={pad.l + plotW}
          y2={pad.t + plotH}
          stroke={color.inkBody}
          strokeWidth={1.2}
        />

        {fitPath ? <Path d={fitPath} stroke={accent} strokeWidth={1.6} fill="none" /> : null}

        {points.map((p, i) => (
          <G key={i}>
            <Circle cx={sx(p.x)} cy={sy(p.y)} r={4.5} fill={color.paper} stroke={color.gold} strokeWidth={1.8} />
            {p.label ? (
              <SvgText
                x={sx(p.x) + 8}
                y={sy(p.y) - 6}
                fontSize={8.5}
                fill={color.inkMuted}
                fontFamily={font.semibold}
              >
                {p.label}
              </SvgText>
            ) : null}
          </G>
        ))}

        <SvgText
          x={pad.l + plotW / 2}
          y={height - 6}
          fontSize={9.5}
          textAnchor="middle"
          fill={color.inkBody}
          fontFamily={font.bold}
        >
          {`${xLabel}${xUnit ? ` / ${xUnit}` : ''}`}
        </SvgText>
        <SvgText
          x={11}
          y={pad.t + plotH / 2}
          fontSize={9.5}
          textAnchor="middle"
          fill={color.inkBody}
          fontFamily={font.bold}
          transform={`rotate(-90 11 ${pad.t + plotH / 2})`}
        >
          {`${yLabel}${yUnit ? ` / ${yUnit}` : ''}`}
        </SvgText>
      </Svg>

      {fit ? (
        <View style={styles.stats}>
          <Stat
            label={slopeLabel || 'Slope'}
            value={slopeFormat ? slopeFormat(fit.slope) : formatSigFigs(fit.slope, 3)}
            tone={accent}
          />
          <Stat label="Intercept" value={formatSigFigs(fit.intercept, 3)} />
          <Stat
            label="r²"
            value={fit.r2 === undefined ? '—' : fit.r2.toFixed(4)}
            tone={fit.r2 !== undefined && fit.r2 > 0.98 ? color.green : color.amber}
          />
        </View>
      ) : (
        <Text style={styles.empty}>
          Two points make a line and prove nothing. Take at least four readings before you draw a
          best fit.
        </Text>
      )}
    </View>
  );
}

function Stat({ label, value, tone = color.inkStrong }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color: tone }]}>{value}</Text>
    </View>
  );
}

function niceMax(v) {
  const exp = Math.floor(Math.log10(v));
  const base = Math.pow(10, exp);
  const n = v / base;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * base * 1.1 >= v ? step * base * 1.1 : step * base * 2;
}

function tickValues(max) {
  const out = [];
  const n = 5;
  for (let i = 0; i <= n; i += 1) out.push((max / n) * i);
  return out;
}

function trimNum(v) {
  if (v === 0) return '0';
  if (Math.abs(v) >= 100) return v.toFixed(0);
  if (Math.abs(v) >= 10) return v.toFixed(1);
  if (Math.abs(v) >= 1) return v.toFixed(2);
  return v.toFixed(3);
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: color.hairline,
    borderRadius: radius.tile,
    backgroundColor: color.paper,
    padding: 14,
    gap: 12,
  },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: {
    width: 11,
    height: 11,
    borderRadius: 3,
    borderWidth: 1.4,
    borderColor: color.edge,
  },
  toggleLabel: {
    fontFamily: font.bold,
    fontSize: 9,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    color: color.inkMuted,
  },
  stats: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth * 2,
    borderTopColor: color.hairline,
    paddingTop: 12,
    gap: 10,
  },
  stat: { flex: 1, gap: 4 },
  statLabel: {
    fontFamily: font.bold,
    fontSize: 8.5,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: color.inkMuted,
  },
  statValue: {
    fontFamily: font.bold,
    fontSize: 15,
    letterSpacing: -0.3,
    fontVariant: ['tabular-nums'],
  },
  empty: {
    fontFamily: font.regular,
    fontSize: 11.5,
    lineHeight: 17,
    color: color.inkMuted,
  },
});
