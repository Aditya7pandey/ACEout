import React, { useMemo, useRef, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import Svg, { Line, Rect, Path, G, Text as SvgText } from 'react-native-svg';
import { color, font, radius } from '../theme';
import { Eyebrow } from '../components/ui';
import Slider from '../components/Slider';
import { apparentScaleReading } from '../labs/incline/errors';

const PX_PER_CM = 34; // 3.4 px per millimetre — fine enough to read, coarse enough to argue about
const SCALE_LENGTH_CM = 100;
const HEIGHT = 128;
const RULE_TOP = 46;
const RULE_H = 54;

// The full metre is 3440 px wide. Android caps a hardware layer at 2048 px on
// plenty of devices, so the ruler is drawn as a row of narrower tiles instead
// of one oversized canvas. 20 cm per tile keeps every surface under 700 px.
const TILE_CM = 20;
const TILE_W = TILE_CM * PX_PER_CM;
const TILE_COUNT = SCALE_LENGTH_CM / TILE_CM;
// Each pointer gets its own narrow canvas centred on the mark.
const POINTER_W = 120;

/**
 * A metre scale you have to actually read.
 *
 * There is no numeric readout of the pointer position anywhere on this
 * component — the graduations are the only source of truth. Two systematic
 * errors can be layered on:
 *
 *  • zero error — the printed graduations sit offset from the true zero, so
 *    every single-ended reading is wrong by a constant. Reading *both* ends
 *    and subtracting cancels it, which is the lesson.
 *  • parallax — the scale stands proud of the surface, so an off-axis eye
 *    displaces the mark. The sight pin lets you find the square-on position:
 *    when the pin's head sits over its base, your eye is aligned.
 */
export default function MetreScale({
  pointers = [],
  profile,
  errorConfig,
  eyeOffset,
  onEyeOffset,
  label = 'Metre scale',
  caption,
}) {
  const scrollRef = useRef(null);
  const parallaxOn = !!errorConfig?.parallax;

  // A thousand graduations would be a thousand SVG nodes, so each tile draws
  // its ticks as three paths (millimetre, half-centimetre, centimetre) plus
  // the numerals. Coordinates are tile-local.
  const tiles = useMemo(() => {
    const seg = (x, h) => `M ${x} ${RULE_TOP + 1} L ${x} ${RULE_TOP + 1 + h}`;
    return Array.from({ length: TILE_COUNT }, (_, t) => {
      const startMm = t * TILE_CM * 10;
      const mm = [];
      const half = [];
      const cm = [];
      const nums = [];
      // <= so the tile boundary tick is drawn on both sides and the rule reads
      // continuously across the seam.
      for (let i = 0; i <= TILE_CM * 10; i += 1) {
        const abs = startMm + i;
        const x = (i / 10) * PX_PER_CM;
        if (abs % 10 === 0) {
          cm.push(seg(x, 22));
          nums.push({ x, cm: abs / 10 });
        } else if (abs % 5 === 0) {
          half.push(seg(x, 14));
        } else {
          mm.push(seg(x, 8));
        }
      }
      return {
        key: t,
        offsetCm: t * TILE_CM,
        mmPath: mm.join(' '),
        halfPath: half.join(' '),
        cmPath: cm.join(' '),
        numerals: nums,
      };
    });
  }, []);

  // Scroll so the first pointer is comfortably in view.
  useEffect(() => {
    const first = pointers[0];
    if (!first || !scrollRef.current) return;
    const apparent = apparentScaleReading(
      first.trueCm,
      profile,
      errorConfig || {},
      eyeOffset || 0
    );
    const t = setTimeout(() => {
      scrollRef.current?.scrollTo({ x: Math.max(0, apparent * PX_PER_CM - 130), animated: true });
    }, 250);
    return () => clearTimeout(t);
    // deliberately only on mount / pointer identity change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pointers.map((p) => p.id).join('|')]);

  const totalWidth = SCALE_LENGTH_CM * PX_PER_CM + 40;
  const aligned = Math.abs(eyeOffset || 0) < 0.04;

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Eyebrow>{label}</Eyebrow>
        <Text style={styles.lc}>L.C. 0.1 cm</Text>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.viewport}
        contentContainerStyle={{ width: totalWidth }}
      >
        {/* the boxwood rule, drawn one tile at a time */}
        {tiles.map((t) => (
          <View key={t.key} style={{ position: 'absolute', left: t.offsetCm * PX_PER_CM }}>
            <Svg width={TILE_W} height={HEIGHT}>
              <Rect
                x={0}
                y={RULE_TOP}
                width={TILE_W}
                height={RULE_H}
                fill="#F7EEDC"
                stroke="none"
              />
              <Rect x={0} y={RULE_TOP} width={TILE_W} height={3} fill="rgba(28,24,21,0.06)" />
              <Path d={t.mmPath} stroke="rgba(28,24,21,0.6)" strokeWidth={0.8} />
              <Path d={t.halfPath} stroke="rgba(28,24,21,0.72)" strokeWidth={0.9} />
              <Path d={t.cmPath} stroke="rgba(28,24,21,0.8)" strokeWidth={1.4} />
              {t.numerals.map((n) => (
                <SvgText
                  key={n.cm}
                  x={n.x + 2.5}
                  y={RULE_TOP + 40}
                  fontSize={10}
                  fill="rgba(28,24,21,0.7)"
                  fontFamily={font.semibold}
                >
                  {n.cm}
                </SvgText>
              ))}
            </Svg>
          </View>
        ))}

        {/* top and bottom edges of the rule, as plain views so they span the
            whole metre without needing another wide canvas */}
        <View style={[styles.ruleEdge, { top: RULE_TOP, width: totalWidth }]} />
        <View style={[styles.ruleEdge, { top: RULE_TOP + RULE_H, width: totalWidth }]} />

        {/* pointers live in their own small canvases, positioned absolutely */}
        {pointers.map((p) => {
            const apparent = apparentScaleReading(
              p.trueCm,
              profile,
              errorConfig || {},
              eyeOffset || 0
            );
            // Draw into a narrow canvas centred on the pointer, so this stays
            // small no matter where along the metre the mark sits.
            const absX = apparent * PX_PER_CM;
            const left = absX - POINTER_W / 2;
            const x = POINTER_W / 2;
            const tone = p.tone || color.brass;
            // The sight pin: head is drawn where a misaligned eye sees it,
            // base is drawn where it truly sits on the scale.
            const pinShift = parallaxOn ? (eyeOffset || 0) * profile.parallaxGainCm * PX_PER_CM : 0;
            return (
              <View
                key={p.id}
                style={{ position: 'absolute', left }}
                pointerEvents="none"
              >
                <Svg width={POINTER_W} height={HEIGHT}>
                {/* the physical edge being measured */}
                <Line
                  x1={x}
                  y1={RULE_TOP - 26}
                  x2={x}
                  y2={RULE_TOP + RULE_H}
                  stroke={tone}
                  strokeWidth={1.6}
                />
                <Path
                  d={`M ${x - 6} ${RULE_TOP - 34} L ${x + 6} ${RULE_TOP - 34} L ${x} ${RULE_TOP - 24} Z`}
                  fill={tone}
                />
                <SvgText
                  x={x}
                  y={RULE_TOP - 40}
                  fontSize={9}
                  fill={tone}
                  textAnchor="middle"
                  fontFamily={font.bold}
                >
                  {p.label?.toUpperCase()}
                </SvgText>
                {/* sight pin head + base */}
                {parallaxOn ? (
                  <G>
                    <Line
                      x1={x - pinShift}
                      y1={RULE_TOP + RULE_H + 6}
                      x2={x - pinShift}
                      y2={RULE_TOP + RULE_H + 16}
                      stroke="rgba(28,24,21,0.45)"
                      strokeWidth={1}
                    />
                    <Rect
                      x={x - pinShift - 3}
                      y={RULE_TOP + RULE_H + 14}
                      width={6}
                      height={6}
                      rx={3}
                      fill={aligned ? color.green : 'rgba(28,24,21,0.45)'}
                    />
                  </G>
                ) : null}
                </Svg>
              </View>
            );
          })}
      </ScrollView>

      {parallaxOn ? (
        <View style={styles.parallax}>
          <Slider
            value={eyeOffset || 0}
            min={-1}
            max={1}
            step={0.02}
            onChange={onEyeOffset}
            label="Eye position"
            display={aligned ? 'Square on' : eyeOffset < 0 ? 'From the left' : 'From the right'}
            tone={aligned ? color.green : color.red}
            marks={[{ value: 0, color: color.green }]}
          />
          <Text style={styles.hint}>
            {aligned
              ? 'Pin head over its base — your line of sight is normal to the scale. Read it now.'
              : 'The pin head has drifted off its base. Move your eye until the dot turns green, or every reading carries a parallax error.'}
          </Text>
        </View>
      ) : null}

      {caption ? <Text style={styles.caption}>{caption}</Text> : null}
    </View>
  );
}

export { PX_PER_CM };

const styles = StyleSheet.create({
  wrap: {
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: color.hairline,
    borderRadius: radius.tile,
    backgroundColor: color.paper,
    padding: 14,
    gap: 12,
    overflow: 'hidden',
  },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  lc: {
    fontFamily: font.bold,
    fontSize: 9,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: color.inkMuted,
  },
  ruleEdge: {
    position: 'absolute',
    height: StyleSheet.hairlineWidth * 2,
    backgroundColor: 'rgba(28,24,21,0.18)',
  },
  viewport: {
    height: HEIGHT,
    borderRadius: 10,
    backgroundColor: 'rgba(28,24,21,0.025)',
  },
  parallax: { gap: 8 },
  hint: {
    fontFamily: font.regular,
    fontSize: 11.5,
    lineHeight: 17,
    color: color.inkMuted,
  },
  caption: {
    fontFamily: font.regular,
    fontSize: 11.5,
    lineHeight: 17,
    color: color.inkMuted,
  },
});
