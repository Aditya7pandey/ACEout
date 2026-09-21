import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Svg, { Line, Rect, Circle, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';
import { color, font, radius } from '../theme';
import { Eyebrow } from '../components/ui';

/**
 * Optical Colorimeter / Comparator, least count 0.01 A.
 *
 * Compares the optical absorbance of the test tube against a reference blank.
 * The student reads the scale indicator / needle to determine absorbance (0.00 to 2.50 A).
 */
export default function ColorComparator({
  sampleColor = '#E69530',
  referenceColor = '#FDF0CD',
  apparentAbsorbance = 0.45,
  label = 'Photoelectric Colorimeter (λ = 480 nm)',
  wavelength = '480 nm',
}) {
  const [cuvetteInserted, setCuvetteInserted] = useState(true);
  const displayedAbs = cuvetteInserted ? apparentAbsorbance : 0.0;

  // Scale dimensions
  const width = 310;
  const height = 80;
  const paddingH = 20;
  const maxAbs = 2.0; // scale from 0 to 2.00 A
  const needleX = paddingH + Math.min(1, Math.max(0, displayedAbs / maxAbs)) * (width - 2 * paddingH);

  // Tick marks
  const ticks = [];
  for (let a = 0; a <= maxAbs + 0.001; a += 0.1) {
    const isMajor = Math.abs(a % 0.5) < 0.01 || Math.abs(a - maxAbs) < 0.01 || a === 0;
    const isMid = Math.abs(a % 0.2) < 0.01;
    const x = paddingH + (a / maxAbs) * (width - 2 * paddingH);
    ticks.push({
      x,
      val: a.toFixed(1),
      isMajor,
      isMid,
    });
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <View style={{ flex: 1 }}>
          <Eyebrow>{label}</Eyebrow>
          <Text style={styles.filterMeta}>Filter: Blue-Green ({wavelength})</Text>
        </View>
        <Text style={styles.lc}>L.C. 0.01 A</Text>
      </View>

      {/* Optical Split-view chamber */}
      <View style={styles.chamberRow}>
        <View style={styles.chamberCol}>
          <Text style={styles.chamberLabel}>Reference (Blank)</Text>
          <View style={[styles.cuvetteBox, { backgroundColor: referenceColor }]}>
            <View style={styles.meniscusLine} />
          </View>
        </View>

        <View style={styles.opticDivider}>
          <Text style={styles.opticIcon}>⇄</Text>
          <Text style={styles.opticText}>Optical Match</Text>
        </View>

        <View style={styles.chamberCol}>
          <Text style={styles.chamberLabel}>Sample Cuvette</Text>
          <View
            style={[
              styles.cuvetteBox,
              cuvetteInserted
                ? { backgroundColor: sampleColor }
                : { backgroundColor: 'transparent', borderColor: 'dashed' },
            ]}
          >
            {cuvetteInserted ? (
              <View style={styles.meniscusLine} />
            ) : (
              <Text style={styles.emptyText}>Empty</Text>
            )}
          </View>
        </View>
      </View>

      {/* Analog Optical Absorbance Dial / Scale */}
      <View style={styles.dialCard}>
        <View style={styles.dialHead}>
          <Text style={styles.dialTitle}>Absorbance Scale (A)</Text>
          <Text style={styles.dialSub}>Read needle alignment</Text>
        </View>

        <Svg width={width} height={height} style={styles.svg}>
          <Defs>
            <LinearGradient id="scaleBg" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0%" stopColor="#2A241E" />
              <Stop offset="100%" stopColor="#1B1713" />
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width={width} height={height} rx={8} fill="url(#scaleBg)" />

          {/* Major and minor ticks */}
          {ticks.map((t, idx) => (
            <React.Fragment key={idx}>
              <Line
                x1={t.x}
                y1={t.isMajor ? 12 : t.isMid ? 18 : 24}
                x2={t.x}
                y2={36}
                stroke={t.isMajor ? '#E2AF5B' : 'rgba(255,255,255,0.45)'}
                strokeWidth={t.isMajor ? 1.5 : 1}
              />
              {t.isMajor && (
                <SvgText
                  x={t.x}
                  y={52}
                  fontSize={9.5}
                  textAnchor="middle"
                  fill="#E2AF5B"
                  fontFamily={font.bold}
                >
                  {t.val}
                </SvgText>
              )}
            </React.Fragment>
          ))}

          {/* Needle Indicator */}
          <Line
            x1={needleX}
            y1={6}
            x2={needleX}
            y2={60}
            stroke="#FF4B4B"
            strokeWidth={2.2}
            strokeLinecap="round"
          />
          <Circle cx={needleX} cy={60} r={3.5} fill="#FF4B4B" />
        </Svg>
      </View>

      <View style={styles.buttonRow}>
        <Pressable
          onPress={() => setCuvetteInserted((v) => !v)}
          style={({ pressed }) => [
            styles.toggleBtn,
            cuvetteInserted && styles.toggleBtnActive,
            pressed && { opacity: 0.8 },
          ]}
        >
          <Text style={[styles.toggleBtnLabel, cuvetteInserted && { color: color.onGold }]}>
            {cuvetteInserted ? 'Remove Cuvette' : 'Insert Cuvette'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: color.hairline,
    borderRadius: radius.tile,
    backgroundColor: color.paper,
    padding: 15,
    gap: 12,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  filterMeta: {
    fontFamily: font.medium,
    fontSize: 10,
    color: color.inkMuted,
    marginTop: 2,
  },
  lc: {
    fontFamily: font.bold,
    fontSize: 9,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: color.inkMuted,
  },
  chamberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(28,24,21,0.03)',
    borderRadius: radius.chip,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: color.hairline,
  },
  chamberCol: {
    alignItems: 'center',
    gap: 6,
  },
  chamberLabel: {
    fontFamily: font.bold,
    fontSize: 9.5,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: color.inkMuted,
  },
  cuvetteBox: {
    width: 64,
    height: 72,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(28,24,21,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  meniscusLine: {
    position: 'absolute',
    top: 10,
    left: 4,
    right: 4,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  emptyText: {
    fontFamily: font.medium,
    fontSize: 10,
    color: color.inkMuted,
  },
  opticDivider: {
    alignItems: 'center',
    gap: 2,
  },
  opticIcon: {
    fontSize: 18,
    color: color.brass,
  },
  opticText: {
    fontFamily: font.bold,
    fontSize: 8.5,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: color.inkMuted,
  },
  dialCard: {
    alignItems: 'center',
    backgroundColor: '#1E1914',
    borderRadius: radius.chip,
    padding: 10,
    gap: 6,
  },
  dialHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 8,
  },
  dialTitle: {
    fontFamily: font.bold,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: '#E2AF5B',
  },
  dialSub: {
    fontFamily: font.medium,
    fontSize: 9.5,
    color: 'rgba(255,255,255,0.5)',
  },
  svg: {
    alignSelf: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: 'rgba(28,24,21,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleBtnActive: {
    backgroundColor: color.goldTop,
    borderColor: color.goldBottom,
  },
  toggleBtnLabel: {
    fontFamily: font.bold,
    fontSize: 10.5,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: color.inkSoft,
  },
});
