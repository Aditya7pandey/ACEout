import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { color, font, radius } from '../theme';
import { Eyebrow } from '../components/ui';

export const UNIVERSAL_PH_COLORS = [
  { ph: 0, hex: '#EE1C25', label: 'pH 0', type: 'Strongly Acidic' },
  { ph: 1, hex: '#F15A24', label: 'pH 1', type: 'Strongly Acidic' },
  { ph: 2, hex: '#F7931E', label: 'pH 2', type: 'Strongly Acidic' },
  { ph: 3, hex: '#FBB03B', label: 'pH 3', type: 'Moderately Acidic' },
  { ph: 4, hex: '#FCEE21', label: 'pH 4', type: 'Weakly Acidic' },
  { ph: 5, hex: '#D7DF23', label: 'pH 5', type: 'Weakly Acidic' },
  { ph: 6, hex: '#8CC63F', label: 'pH 6', type: 'Slightly Acidic' },
  { ph: 7, hex: '#39B54A', label: 'pH 7', type: 'Neutral' },
  { ph: 8, hex: '#00A99D', label: 'pH 8', type: 'Slightly Basic' },
  { ph: 9, hex: '#00AEEF', label: 'pH 9', type: 'Weakly Basic' },
  { ph: 10, hex: '#2E3192', label: 'pH 10', type: 'Moderately Basic' },
  { ph: 11, hex: '#1B1464', label: 'pH 11', type: 'Strongly Basic' },
  { ph: 12, hex: '#662D91', label: 'pH 12', type: 'Strongly Basic' },
  { ph: 13, hex: '#92278F', label: 'pH 13', type: 'Very Strongly Basic' },
  { ph: 14, hex: '#4A0E4E', label: 'pH 14', type: 'Very Strongly Basic' },
];

export function getUniversalColor(ph) {
  const clamped = Math.min(14, Math.max(0, ph));
  const lower = Math.floor(clamped);
  const upper = Math.ceil(clamped);
  if (lower === upper) return UNIVERSAL_PH_COLORS[lower].hex;
  return UNIVERSAL_PH_COLORS[Math.round(clamped)].hex;
}

/**
 * Standard Universal Indicator Color Chart (0–14 pH).
 *
 * The student compares the dipped paper strip against this reference scale to read the pH value.
 */
export default function PHColorScale({
  selectedPH = null,
  onSelectPH,
  highlightedPH = null,
  label = 'Universal Indicator Color Reference (0 – 14)',
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Eyebrow>{label}</Eyebrow>
        <Text style={styles.lc}>L.C. 1 pH</Text>
      </View>

      <Text style={styles.instruction}>
        Match the color developed on your test strip with the reference swatches below:
      </Text>

      {/* Swatch grid */}
      <View style={styles.grid}>
        {UNIVERSAL_PH_COLORS.map((item) => {
          const isSelected = selectedPH === item.ph;
          const isMatched = highlightedPH !== null && Math.round(highlightedPH) === item.ph;

          return (
            <Pressable
              key={item.ph}
              onPress={() => onSelectPH && onSelectPH(item.ph)}
              style={({ pressed }) => [
                styles.swatchWrap,
                isSelected && styles.swatchWrapSelected,
                isMatched && styles.swatchWrapMatched,
                pressed && { opacity: 0.8 },
              ]}
            >
              <View style={[styles.colorBlock, { backgroundColor: item.hex }]}>
                {isMatched && <View style={styles.matchIndicator} />}
              </View>
              <Text style={[styles.phNumber, isSelected && { color: color.brass, fontFamily: font.bold }]}>
                {item.ph}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Classification Band */}
      <View style={styles.rangeLegend}>
        <View style={[styles.legendPill, { backgroundColor: 'rgba(238,28,37,0.12)' }]}>
          <Text style={[styles.legendText, { color: '#B23428' }]}>Acidic (0–6)</Text>
        </View>
        <View style={[styles.legendPill, { backgroundColor: 'rgba(57,181,74,0.15)' }]}>
          <Text style={[styles.legendText, { color: '#2F8E6C' }]}>Neutral (7)</Text>
        </View>
        <View style={[styles.legendPill, { backgroundColor: 'rgba(46,49,146,0.12)' }]}>
          <Text style={[styles.legendText, { color: '#4668AE' }]}>Basic (8–14)</Text>
        </View>
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
    padding: 14,
    gap: 10,
  },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lc: {
    fontFamily: font.bold,
    fontSize: 9,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: color.inkMuted,
  },
  instruction: {
    fontFamily: font.regular,
    fontSize: 11.5,
    lineHeight: 16,
    color: color.inkMuted,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 4,
    backgroundColor: 'rgba(28,24,21,0.03)',
    padding: 8,
    borderRadius: radius.chip,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: color.hairline,
  },
  swatchWrap: {
    alignItems: 'center',
    width: '18%',
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  swatchWrapSelected: {
    borderColor: color.brass,
    backgroundColor: 'rgba(150,102,47,0.1)',
  },
  swatchWrapMatched: {
    borderColor: '#39B54A',
    backgroundColor: 'rgba(57,181,74,0.12)',
  },
  colorBlock: {
    width: 32,
    height: 22,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchIndicator: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#FFFFFF',
  },
  phNumber: {
    fontFamily: font.semibold,
    fontSize: 11,
    color: color.inkBody,
    marginTop: 3,
  },
  rangeLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    marginTop: 2,
  },
  legendPill: {
    flex: 1,
    paddingVertical: 5,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  legendText: {
    fontFamily: font.bold,
    fontSize: 9.5,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
});
