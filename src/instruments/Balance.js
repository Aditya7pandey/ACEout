import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { color, font, radius } from '../theme';
import { Eyebrow } from '../components/ui';
import { apparentMassG } from '../labs/incline/errors';

/**
 * Electronic balance, least count 1 g.
 *
 * The pan can be emptied, which is the only way to discover the zero error.
 * Taring is offered because students reach for it — but taring with the block
 * already on the pan destroys the measurement, and the app says so.
 */
export default function Balance({
  trueMassG,
  profile,
  errorConfig,
  label = 'Electronic balance',
}) {
  const [loaded, setLoaded] = useState(false);
  const [tareOffset, setTareOffset] = useState(0);
  const [tareWarning, setTareWarning] = useState(null);

  const raw = apparentMassG(loaded ? trueMassG : 0, profile, errorConfig || {});
  const shown = Math.round(raw - tareOffset);

  const tare = () => {
    setTareOffset(raw);
    setTareWarning(
      loaded
        ? 'You tared with the block on the pan. The balance now calls your block “zero grams”. Take it off and tare again.'
        : null
    );
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Eyebrow>{label}</Eyebrow>
        <Text style={styles.lc}>L.C. 1 g</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.pan}>
          {loaded ? <View style={styles.block} /> : <Text style={styles.empty}>empty pan</Text>}
        </View>
        <View style={styles.displayWrap}>
          <Text style={styles.display}>{shown}</Text>
          <Text style={styles.unit}>g</Text>
        </View>
      </View>

      <View style={styles.row}>
        <Pressable
          onPress={() => setLoaded((v) => !v)}
          style={({ pressed }) => [
            styles.btn,
            loaded && styles.btnActive,
            pressed && { opacity: 0.8 },
          ]}
        >
          <Text style={[styles.btnLabel, loaded && { color: color.onGold }]}>
            {loaded ? 'Remove block' : 'Place block'}
          </Text>
        </Pressable>
        <Pressable onPress={tare} style={({ pressed }) => [styles.btn, pressed && { opacity: 0.8 }]}>
          <Text style={styles.btnLabel}>Tare</Text>
        </Pressable>
      </View>

      {tareWarning ? <Text style={styles.warn}>{tareWarning}</Text> : null}
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
    gap: 12,
  },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  lc: {
    fontFamily: font.bold,
    fontSize: 9,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: color.inkMuted,
  },
  body: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  pan: {
    width: 92,
    height: 62,
    borderRadius: 10,
    backgroundColor: 'rgba(28,24,21,0.04)',
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: color.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  block: {
    width: 42,
    height: 30,
    borderRadius: 4,
    backgroundColor: '#C08F46',
    borderWidth: 1,
    borderColor: '#8A6428',
  },
  empty: {
    fontFamily: font.regular,
    fontSize: 10,
    color: color.inkMuted,
    letterSpacing: 0.4,
  },
  displayWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'flex-end',
    gap: 5,
    backgroundColor: '#1B1713',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  display: {
    fontFamily: font.bold,
    fontSize: 30,
    letterSpacing: -1,
    color: '#8FE3C0',
    fontVariant: ['tabular-nums'],
  },
  unit: { fontFamily: font.bold, fontSize: 13, color: 'rgba(143,227,192,0.6)' },
  row: { flexDirection: 'row', gap: 9 },
  btn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: 'rgba(28,24,21,0.16)',
    alignItems: 'center',
  },
  btnActive: { backgroundColor: color.goldTop, borderColor: color.goldBottom },
  btnLabel: {
    fontFamily: font.bold,
    fontSize: 10.5,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: color.inkSoft,
  },
  warn: {
    fontFamily: font.regular,
    fontSize: 11.5,
    lineHeight: 17,
    color: color.red,
  },
});
