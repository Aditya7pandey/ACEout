import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Svg, { Rect, Circle, Line, Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { color, font, radius } from '../../theme';
import { Eyebrow } from '../../components/ui';
import { getUniversalColor } from '../../instruments/PHColorScale';
import { getHydroniumConc, getHydroxideConc, formatScientific } from './chemistry';

export default function PhCanvas({
  solutionName = '0.1 M HCl',
  solutionCategory = 'Strong Acid',
  ph = 1.0,
  paperDipped = false,
  probeImmersed = true,
  onDipPaper,
  onToggleProbe,
  height = 235,
}) {
  const paperColor = paperDipped ? getUniversalColor(ph) : '#EFE8D3'; // Dry pale straw paper
  const hConc = getHydroniumConc(ph);
  const ohConc = getHydroxideConc(ph);

  return (
    <View style={[styles.wrap, { height }]}>
      {/* Header Info */}
      <View style={styles.head}>
        <View>
          <Text style={styles.solTitle}>{solutionName}</Text>
          <Text style={styles.solCategory}>{solutionCategory}</Text>
        </View>
        <View style={styles.naturePill}>
          <Text
            style={[
              styles.natureText,
              ph < 6.5 && { color: '#B23428' },
              ph >= 6.5 && ph <= 7.5 && { color: '#2F8E6C' },
              ph > 7.5 && { color: '#4668AE' },
            ]}
          >
            {ph < 6.5 ? 'Acidic' : ph <= 7.5 ? 'Neutral' : 'Basic'}
          </Text>
        </View>
      </View>

      {/* Interactive Beaker & Apparatus Bench */}
      <View style={styles.benchRow}>
        {/* Paper Strip Area */}
        <Pressable
          onPress={onDipPaper}
          style={({ pressed }) => [styles.stripCol, pressed && { opacity: 0.8 }]}
        >
          <View style={styles.stripHolder}>
            {/* Paper Strip */}
            <View style={styles.stripDryTop} />
            <View style={[styles.stripDippedTip, { backgroundColor: paperColor }]} />
          </View>
          <Text style={styles.stripLabel}>
            {paperDipped ? 'Dipped Strip' : 'Tap to Dip Strip'}
          </Text>
        </Pressable>

        {/* Central Beaker */}
        <View style={styles.beakerCol}>
          <View style={styles.beakerGlass}>
            <View style={styles.beakerLip} />
            <View style={styles.glassBody}>
              {/* Probe immersion graphic inside beaker */}
              {probeImmersed && (
                <View style={styles.probeInBeaker}>
                  <View style={styles.probeShaftInner} />
                  <View style={styles.probeBulbInner} />
                </View>
              )}

              {/* Paper strip immersion graphic inside beaker */}
              {paperDipped && (
                <View style={[styles.paperInBeaker, { backgroundColor: paperColor }]} />
              )}

              {/* Solution Liquid */}
              <View
                style={[
                  styles.solutionLiquid,
                  { backgroundColor: 'rgba(230, 245, 252, 0.65)' },
                ]}
              >
                <View style={styles.liquidMeniscus} />
              </View>
            </View>
          </View>
          <Text style={styles.beakerLabel}>250 mL Beaker</Text>
        </View>

        {/* Probe Toggle Area */}
        <Pressable
          onPress={onToggleProbe}
          style={({ pressed }) => [styles.probeCol, pressed && { opacity: 0.8 }]}
        >
          <View style={styles.probeStand}>
            <View style={styles.probeCable} />
            <View style={styles.probeBody}>
              <View style={styles.probeShaft} />
              <View
                style={[
                  styles.probeBulb,
                  probeImmersed && { backgroundColor: 'rgba(47,142,108,0.5)' },
                ]}
              />
            </View>
          </View>
          <Text style={styles.probeLabel}>
            {probeImmersed ? 'Probe Immersed' : 'Probe Lifted'}
          </Text>
        </Pressable>
      </View>

      {/* Auto-balancing Ion Level Indicators */}
      <View style={styles.ionBarRow}>
        <View style={styles.ionGroup}>
          <Text style={styles.ionLabel}>[H⁺] Hydronium</Text>
          <Text style={[styles.ionVal, { color: '#B23428' }]}>
            {formatScientific(hConc)} M
          </Text>
        </View>
        <View style={styles.ionDivider}>
          <Text style={styles.kwText}>Kw = 10⁻¹⁴</Text>
        </View>
        <View style={[styles.ionGroup, { alignItems: 'flex-end' }]}>
          <Text style={styles.ionLabel}>[OH⁻] Hydroxide</Text>
          <Text style={[styles.ionVal, { color: '#4668AE' }]}>
            {formatScientific(ohConc)} M
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#F7F3EB',
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: color.hairline,
    padding: 12,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  solTitle: {
    fontFamily: font.bold,
    fontSize: 15,
    color: color.inkStrong,
    letterSpacing: -0.2,
  },
  solCategory: {
    fontFamily: font.medium,
    fontSize: 10,
    color: color.inkMuted,
  },
  naturePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: color.paper,
    borderWidth: 1,
    borderColor: color.hairline,
  },
  natureText: {
    fontFamily: font.bold,
    fontSize: 9.5,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  benchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 2,
  },
  stripCol: {
    alignItems: 'center',
    gap: 4,
  },
  stripHolder: {
    width: 14,
    height: 70,
    borderRadius: 2,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(28,24,21,0.2)',
    backgroundColor: '#EFE8D3',
  },
  stripDryTop: {
    flex: 1,
    backgroundColor: '#EFE8D3',
  },
  stripDippedTip: {
    height: 35,
  },
  stripLabel: {
    fontFamily: font.bold,
    fontSize: 9,
    color: color.brass,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  beakerCol: {
    alignItems: 'center',
  },
  beakerGlass: {
    alignItems: 'center',
  },
  beakerLip: {
    width: 74,
    height: 4,
    backgroundColor: 'rgba(160,190,210,0.8)',
    borderRadius: 2,
    borderWidth: 0.8,
    borderColor: 'rgba(120,160,180,0.9)',
  },
  glassBody: {
    width: 68,
    height: 78,
    backgroundColor: 'rgba(240,248,255,0.4)',
    borderWidth: 1.5,
    borderTopWidth: 0,
    borderColor: 'rgba(120,160,180,0.7)',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    position: 'relative',
  },
  probeInBeaker: {
    position: 'absolute',
    top: 0,
    right: 14,
    alignItems: 'center',
    zIndex: 2,
  },
  probeShaftInner: {
    width: 7,
    height: 52,
    backgroundColor: 'rgba(180,210,230,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(100,150,180,0.8)',
  },
  probeBulbInner: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: 'rgba(80,180,240,0.8)',
  },
  paperInBeaker: {
    position: 'absolute',
    top: 15,
    left: 12,
    width: 10,
    height: 45,
    borderRadius: 2,
    zIndex: 2,
    borderWidth: 0.8,
    borderColor: 'rgba(0,0,0,0.15)',
  },
  solutionLiquid: {
    width: '100%',
    height: '68%',
    borderBottomLeftRadius: 7,
    borderBottomRightRadius: 7,
    position: 'relative',
  },
  liquidMeniscus: {
    position: 'absolute',
    top: 0,
    left: 1,
    right: 1,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 2,
  },
  beakerLabel: {
    fontFamily: font.medium,
    fontSize: 8.5,
    color: color.inkMuted,
    marginTop: 3,
  },
  probeCol: {
    alignItems: 'center',
    gap: 4,
  },
  probeStand: {
    alignItems: 'center',
    height: 70,
    justifyContent: 'flex-end',
  },
  probeCable: {
    width: 2.5,
    height: 12,
    backgroundColor: '#3E372F',
  },
  probeBody: {
    alignItems: 'center',
  },
  probeShaft: {
    width: 8,
    height: 40,
    backgroundColor: 'rgba(200,225,235,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(120,160,180,0.7)',
  },
  probeBulb: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(100,180,240,0.5)',
  },
  probeLabel: {
    fontFamily: font.bold,
    fontSize: 9,
    color: color.inkMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  ionBarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: color.paper,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.chip,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: color.hairline,
  },
  ionGroup: {
    gap: 1,
  },
  ionLabel: {
    fontFamily: font.bold,
    fontSize: 8,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: color.inkMuted,
  },
  ionVal: {
    fontFamily: font.bold,
    fontSize: 11,
    fontVariant: ['tabular-nums'],
  },
  ionDivider: {
    alignItems: 'center',
  },
  kwText: {
    fontFamily: font.medium,
    fontSize: 8.5,
    color: color.inkMuted,
  },
});
