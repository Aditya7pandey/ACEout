import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { color, font, radius, bevel, deepen, space } from '../theme';
import { PageScroll, BackButton, Bar, Stars } from '../components/ui';
import { getLabs, SUBJECTS } from '../data/catalog';
import { useAppState } from '../store/AppState';
import { starsFor } from '../store/game';

/**
 * A chapter is a path of benches. One node per experiment, cleared ones behind
 * you, the next one flagged START — the card list that used to live here said
 * the same thing in four times the words.
 */

// The zig-zag. Repeated down the list so a long chapter keeps weaving.
const SWAY = [0, -46, -66, -30, 20, 54, 24];

export default function LabsScreen({ navigation, route }) {
  const { cls, subject, chapterNo, chapter } = route.params;
  const insets = useSafeAreaInsets();
  const labs = getLabs(cls, subject, chapterNo);
  const { game } = useAppState();

  const subj = SUBJECTS.find((s) => s.key === subject);
  const accent = subj?.accent || color.blue;
  const deep = deepen[accent] || color.inkStrong;

  const cleared = labs.filter((l) => starsFor(game, l.id) > 0).length;
  const currentId = labs.find((l) => l.built && starsFor(game, l.id) === 0)?.id;

  return (
    <View style={styles.page}>
      <View style={[styles.head, { backgroundColor: accent, paddingTop: insets.top + 8 }]}>
        <View style={styles.headRow}>
          <BackButton light onPress={() => navigation.goBack()} />
          <Text style={styles.crumb} numberOfLines={1}>
            Chapter {chapterNo}
          </Text>
          <View style={styles.starChip}>
            <Text style={styles.starChipText}>
              {labs.reduce((n, l) => n + starsFor(game, l.id), 0)} ★
            </Text>
          </View>
        </View>
        <Text style={styles.title} numberOfLines={2}>
          {chapter.title}
        </Text>
        <View style={styles.headBar}>
          <Bar
            value={labs.length ? cleared / labs.length : 0}
            tone="#FFFFFF"
            track="rgba(0,0,0,0.22)"
            height={12}
            style={{ flex: 1 }}
          />
          <Text style={styles.headCount}>
            {cleared}/{labs.length}
          </Text>
        </View>
      </View>

      <PageScroll
        contentStyle={{
          paddingTop: 44,
          paddingBottom: Math.max(insets.bottom, 20) + 30,
          alignItems: 'center',
          gap: 26,
        }}
      >
        {labs.map((l, i) => {
          const stars = starsFor(game, l.id);
          const current = l.id === currentId;
          const locked = !l.built;
          const fill = locked ? color.locked : stars > 0 ? color.green : accent;
          const fillDeep = locked ? color.lockedDeep : stars > 0 ? color.greenDeep : deep;

          return (
            <View
              key={l.id}
              style={[
                styles.slot,
                { transform: [{ translateX: SWAY[i % SWAY.length] }] },
                current && { marginTop: 26 },
              ]}
            >
              {current ? (
                <View style={styles.flag}>
                  <Text style={styles.flagText}>Start</Text>
                </View>
              ) : null}

              <Pressable
                disabled={locked}
                onPress={() =>
                  navigation.navigate('Lab', {
                    labId: l.id,
                    title: l.title,
                    cls,
                    subject,
                    chapterNo,
                  })
                }
                style={({ pressed }) => [
                  styles.node,
                  { backgroundColor: fill, ...bevel(fillDeep, 7) },
                  current && styles.nodeCurrent,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.nodeGlyph, locked && { color: color.lockedInk }]}>
                  {stars > 0 ? '✓' : locked ? '🔒' : i + 1}
                </Text>
              </Pressable>

              {stars > 0 ? <Stars earned={stars} size={14} /> : null}

              <Text
                style={[styles.label, locked && { color: color.inkFaint }]}
                numberOfLines={2}
              >
                {l.title}
              </Text>
            </View>
          );
        })}
      </PageScroll>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: color.screen },
  head: { paddingHorizontal: space.gutter, paddingBottom: 18, gap: 12 },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  crumb: {
    flex: 1,
    fontFamily: font.extra,
    fontSize: 10.5,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.85)',
  },
  starChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  starChipText: { fontFamily: font.displayBold, fontSize: 12.5, color: color.goldTop },
  title: { fontFamily: font.displayBold, fontSize: 25, lineHeight: 29, color: '#FFFFFF' },
  headBar: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headCount: {
    fontFamily: font.displayBold,
    fontSize: 12.5,
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },

  slot: { alignItems: 'center', gap: 8, maxWidth: 180 },
  flag: {
    position: 'absolute',
    top: -44,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.chip,
    backgroundColor: color.screen,
    borderWidth: 2,
    borderColor: color.hairline,
    ...bevel(color.hairline, 3),
  },
  flagText: {
    fontFamily: font.displayBold,
    fontSize: 14,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: color.blueDeep,
  },
  node: {
    width: 78,
    height: 72,
    borderRadius: 39,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeCurrent: { width: 88, height: 82, borderRadius: 44 },
  nodeGlyph: { fontFamily: font.displayBold, fontSize: 26, color: '#FFFFFF' },
  pressed: { transform: [{ translateY: 4 }], borderBottomWidth: 2 },
  label: {
    fontFamily: font.semibold,
    fontSize: 12.5,
    lineHeight: 16,
    textAlign: 'center',
    color: color.inkBody,
  },
});
