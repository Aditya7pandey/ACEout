import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { color, font, radius, type } from '../../theme';
import { Eyebrow, withAlpha } from '../../components/ui';
import { WORLDS } from './physics';

/**
 * The gravity tab.
 *
 * A horizontal strip of worlds, each carrying nothing but its name and its
 * surface gravity — because that is the only property of a world this
 * experiment can feel. Locking it to a subset is how guided mode walks the
 * student through a prescribed sequence without hiding the rest of the
 * solar system from them.
 */
export default function GravityDeck({
  value,
  onChange,
  worlds,
  label = 'Gravity',
  locked = [],
  done = [],
  caption,
  sealedLabel,
}) {
  const keys = worlds || Object.keys(WORLDS);

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Eyebrow>{label}</Eyebrow>
        <Text style={styles.unit}>m s⁻²</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.strip}
      >
        {keys.map((key) => {
          const w = WORLDS[key];
          if (!w) return null;
          const active = key === value;
          const isLocked = locked.includes(key);
          const isDone = done.includes(key);
          const sealed = sealedLabel && active && !!sealedLabel;
          return (
            <Pressable
              key={key}
              disabled={isLocked}
              onPress={() => onChange?.(key)}
              style={[
                styles.card,
                active && styles.cardActive,
                isLocked && styles.cardLocked,
              ]}
            >
              <View style={[styles.orb, { backgroundColor: w.tint }]} />
              <Text style={[styles.name, active && { color: color.brass }]} numberOfLines={1}>
                {sealed ? sealedLabel : w.label}
              </Text>
              <Text style={[styles.g, active && { color: color.brass }]}>
                {sealed ? '?.??' : w.g.toFixed(2)}
              </Text>
              {isDone ? <View style={styles.doneDot} /> : null}
            </Pressable>
          );
        })}
      </ScrollView>

      {caption ? <Text style={styles.caption}>{caption}</Text> : null}
    </View>
  );
}

/** One-line comparison of the selected world against Earth. */
export function GravityRelation({ g }) {
  const ratio = g / 9.81;
  return (
    <Text style={[type.bodySoft, { lineHeight: 19 }]}>
      A 70 kg astronaut weighs{' '}
      <Text style={styles.strong}>{Math.round(70 * ratio)} kgf</Text> here —{' '}
      {ratio < 1
        ? `${(1 / ratio).toFixed(1)}× lighter than on Earth`
        : ratio > 1
        ? `${ratio.toFixed(1)}× heavier than on Earth`
        : 'exactly as on Earth'}
      . Nothing about the rover changes; only the pull on it does.
    </Text>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: color.hairline,
    borderRadius: radius.tile,
    backgroundColor: color.paper,
    paddingVertical: 14,
    gap: 11,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },
  unit: {
    fontFamily: font.bold,
    fontSize: 9,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: color.inkMuted,
  },
  strip: { paddingHorizontal: 14, gap: 8 },
  card: {
    width: 78,
    paddingVertical: 11,
    paddingHorizontal: 10,
    borderRadius: radius.chip,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: color.hairline,
    gap: 6,
  },
  cardActive: {
    borderColor: withAlpha(color.brass, 0.55),
    backgroundColor: withAlpha(color.brass, 0.06),
  },
  cardLocked: { opacity: 0.35 },
  orb: { width: 16, height: 16, borderRadius: 8 },
  name: { fontFamily: font.bold, fontSize: 11.5, color: color.inkBody },
  g: {
    fontFamily: font.bold,
    fontSize: 14,
    letterSpacing: -0.3,
    color: color.inkStrong,
    fontVariant: ['tabular-nums'],
  },
  doneDot: {
    position: 'absolute',
    top: 8,
    right: 9,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: color.green,
  },
  caption: {
    paddingHorizontal: 14,
    fontFamily: font.regular,
    fontSize: 11.5,
    lineHeight: 17,
    color: color.inkMuted,
  },
  strong: { fontFamily: font.bold, color: color.inkStrong },
});
