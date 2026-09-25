import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { color, font, radius, bevel, space } from '../theme';
import { useAppState } from '../store/AppState';
import { initialsOf } from '../store/user';

/**
 * The strip under the status bar: who you are, how long you have kept it up,
 * and what you have banked. Three numbers, no sentences.
 */
export default function Hud({ navigation }) {
  const { user, stats, game, level } = useAppState();

  return (
    <View style={styles.bar}>
      <Pressable style={styles.avatar} onPress={() => navigation.navigate('Profile')}>
        <Text style={styles.avatarText}>{initialsOf(user?.name)}</Text>
      </Pressable>

      <View style={styles.spacer} />

      <View style={styles.item}>
        <Text style={styles.glyph}>🔥</Text>
        <Text style={[styles.value, { color: color.red }]}>{stats.streak}</Text>
      </View>

      <View style={styles.item}>
        <Text style={[styles.glyph, { color: color.gold }]}>★</Text>
        <Text style={[styles.value, { color: color.brass }]}>{game.xp.toLocaleString()}</Text>
      </View>

      <Pressable style={styles.levelChip} onPress={() => navigation.navigate('Profile')}>
        <Text style={styles.levelText}>Lv {level.level}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: space.gutter,
    paddingTop: 6,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: color.hairline,
  },
  avatar: {
    width: 38,
    height: 34,
    borderRadius: 11,
    backgroundColor: color.blue,
    alignItems: 'center',
    justifyContent: 'center',
    ...bevel(color.blueDeep, 3),
  },
  avatarText: { fontFamily: font.displayBold, fontSize: 13, color: '#FFFFFF' },
  spacer: { flex: 1 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  glyph: { fontSize: 14 },
  value: { fontFamily: font.displayBold, fontSize: 17, fontVariant: ['tabular-nums'] },
  levelChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: color.purpleSoft,
    borderWidth: 2,
    borderColor: color.purpleEdge,
  },
  levelText: { fontFamily: font.displayBold, fontSize: 12.5, color: color.purpleDeep },
});
