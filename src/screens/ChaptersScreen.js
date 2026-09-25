import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { color, font, radius, bevel, deepen, space } from '../theme';
import { PageScroll, BackButton, Bar, Stars } from '../components/ui';
import { getChapters, SUBJECTS, getLabs } from '../data/catalog';
import { useAppState } from '../store/AppState';
import { starsFor } from '../store/game';

/** A world's chapters, each one a block you can see the state of at a glance. */
export default function ChaptersScreen({ navigation, route }) {
  const { cls, subject } = route.params;
  const insets = useSafeAreaInsets();
  const subj = SUBJECTS.find((s) => s.key === subject);
  const chapters = getChapters(cls, subject);
  const { game, stats } = useAppState();

  const done = stats.bySubject[subject] || 0;
  const deep = deepen[subj.accent] || color.inkStrong;

  return (
    <View style={styles.page}>
      <View style={[styles.head, { backgroundColor: subj.accent, paddingTop: insets.top + 8 }]}>
        <View style={styles.headRow}>
          <BackButton light onPress={() => navigation.goBack()} />
          <Text style={styles.crumb} numberOfLines={1}>
            Class {cls}
          </Text>
          <View style={styles.starChip}>
            <Text style={styles.starChipText}>{starsIn(game, cls, subject, chapters)} ★</Text>
          </View>
        </View>
        <Text style={styles.title}>{subj.name}</Text>
        <View style={styles.headBar}>
          <Bar
            value={done / subj.totalLabs}
            tone="#FFFFFF"
            track="rgba(0,0,0,0.22)"
            height={12}
            style={{ flex: 1 }}
          />
          <Text style={styles.headCount}>
            {done}/{subj.totalLabs}
          </Text>
        </View>
      </View>

      <PageScroll contentStyle={{ gap: 12, paddingTop: 18, paddingBottom: Math.max(insets.bottom, 20) + 14 }}>
        {chapters.map((ch) => {
          const labs = getLabs(cls, subject, ch.no);
          const live = labs.some((l) => l.built);
          const earned = labs.reduce((n, l) => n + starsFor(game, l.id), 0);
          return (
            <Pressable
              key={ch.no}
              onPress={() =>
                navigation.navigate('Labs', { cls, subject, chapterNo: ch.no, chapter: ch })
              }
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}
            >
              <View
                style={[
                  styles.node,
                  live
                    ? { backgroundColor: subj.accent, ...bevel(deep, 5) }
                    : { backgroundColor: color.locked, ...bevel(color.lockedDeep, 5) },
                ]}
              >
                <Text style={[styles.nodeText, !live && { color: color.lockedInk }]}>{ch.no}</Text>
              </View>
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={styles.chapter} numberOfLines={2}>
                  {ch.title}
                </Text>
                <View style={styles.metaRow}>
                  {earned > 0 ? <Stars earned={Math.min(3, earned)} size={13} /> : null}
                  <Text style={styles.meta}>{ch.labs} labs</Text>
                </View>
              </View>
            </Pressable>
          );
        })}
      </PageScroll>
    </View>
  );
}

function starsIn(game, cls, subject, chapters) {
  return chapters.reduce(
    (n, ch) => n + getLabs(cls, subject, ch.no).reduce((m, l) => m + starsFor(game, l.id), 0),
    0
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
  title: { fontFamily: font.displayBold, fontSize: 28, color: '#FFFFFF' },
  headBar: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headCount: {
    fontFamily: font.displayBold,
    fontSize: 12.5,
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 12,
    borderRadius: radius.card,
    borderWidth: 2,
    borderColor: color.hairline,
    ...bevel(color.hairline),
    backgroundColor: color.screen,
  },
  pressed: { transform: [{ translateY: 3 }], borderBottomWidth: 2 },
  node: {
    minWidth: 52,
    height: 48,
    paddingHorizontal: 8,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeText: { fontFamily: font.displayBold, fontSize: 15, color: '#FFFFFF' },
  chapter: { fontFamily: font.display, fontSize: 15.5, lineHeight: 19, color: color.inkStrong },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  meta: {
    fontFamily: font.extra,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: color.inkFaint,
  },
});
