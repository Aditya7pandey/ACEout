import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { color, font, radius, bevel, deepen } from '../theme';
import { Page, PageScroll, Eyebrow, Bar } from '../components/ui';
import TabBar from '../components/TabBar';
import Hud from '../components/Hud';
import { SUBJECTS, findLabMeta, SEARCH_INDEX } from '../data/catalog';
import { useAppState } from '../store/AppState';

/**
 * The Learn tab: your level, what you were last on, and the four worlds.
 * Everything that used to be a sentence here is now a number.
 */
export default function SubjectsScreen({ navigation }) {
  const { user, stats, level, progress } = useAppState();
  const cls = user?.cls || '11';
  const next = nextBench(progress, cls);

  return (
    <Page>
      <Hud navigation={navigation} />

      <PageScroll contentStyle={{ gap: 18, paddingTop: 16 }}>
        <View style={styles.levelCard}>
          <View style={styles.levelTop}>
            <Text style={styles.rank}>{level.rank}</Text>
            <Text style={styles.levelXp}>{level.toNext} XP to go</Text>
          </View>
          <Text style={styles.levelNum}>Level {level.level}</Text>
          <Bar value={level.fraction} tone={color.goldTop} track="rgba(0,0,0,0.22)" height={14} />
        </View>

        {next ? (
          <Pressable
            style={({ pressed }) => [styles.next, pressed && styles.pressed]}
            onPress={() =>
              navigation.navigate('Lab', {
                labId: next.id,
                title: next.title,
                cls: next.cls,
                subject: next.subject,
                chapterNo: next.chapterNo,
              })
            }
          >
            <View style={{ flex: 1, gap: 4 }}>
              <Eyebrow tone={color.greenDeep}>{next.resume ? 'Resume' : 'Start here'}</Eyebrow>
              <Text style={styles.nextTitle} numberOfLines={2}>
                {next.title}
              </Text>
            </View>
            <View style={styles.play}>
              <Text style={styles.playGlyph}>▶</Text>
            </View>
          </Pressable>
        ) : null}

        <Eyebrow style={{ marginTop: 2 }}>Worlds · Class {cls}</Eyebrow>

        <View style={styles.grid}>
          {SUBJECTS.map((s) => {
            const done = stats.bySubject[s.key] || 0;
            return (
              <Pressable
                key={s.key}
                onPress={() => navigation.navigate('Chapters', { cls, subject: s.key })}
                style={({ pressed }) => [
                  styles.world,
                  { backgroundColor: s.accent },
                  bevel(deepen[s.accent] || color.inkStrong),
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.mark}>{s.mark}</Text>
                <View style={{ gap: 7 }}>
                  <Text style={styles.worldName} numberOfLines={1}>
                    {s.name}
                  </Text>
                  <Bar
                    value={done / s.totalLabs}
                    tone="#FFFFFF"
                    track="rgba(255,255,255,0.28)"
                    height={7}
                  />
                  <Text style={styles.worldCount}>
                    {done} / {s.totalLabs}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </PageScroll>

      <TabBar navigation={navigation} active="Subjects" />
    </Page>
  );
}

/**
 * What the big green card points at: the bench you last ran, or — on a fresh
 * install — the first built bench in your class, so the card is never empty.
 */
function nextBench(progress, cls) {
  const last = (progress?.completions || [])[0];
  if (last) {
    const meta = findLabMeta(last.labId);
    if (meta?.built) return { ...meta, resume: true };
  }
  const built = SEARCH_INDEX.filter((l) => l.built);
  const mine = built.find((l) => l.cls === cls) || built[0];
  return mine ? { ...mine, resume: false } : null;
}

const styles = StyleSheet.create({
  pressed: { transform: [{ translateY: 3 }], borderBottomWidth: 1 },

  levelCard: {
    borderRadius: radius.card,
    backgroundColor: color.blue,
    ...bevel(color.blueDeep),
    padding: 16,
    gap: 10,
  },
  levelTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rank: {
    fontFamily: font.extra,
    fontSize: 10.5,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.85)',
  },
  levelXp: {
    fontFamily: font.displayBold,
    fontSize: 12.5,
    color: 'rgba(255,255,255,0.85)',
    fontVariant: ['tabular-nums'],
  },
  levelNum: { fontFamily: font.displayBold, fontSize: 26, color: '#FFFFFF' },

  next: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: radius.card,
    backgroundColor: color.greenSoft,
    borderWidth: 2,
    borderColor: color.greenEdge,
    ...bevel(color.greenEdge),
    padding: 16,
  },
  nextTitle: {
    fontFamily: font.display,
    fontSize: 18,
    lineHeight: 22,
    color: color.greenDeep,
  },
  play: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: color.green,
    ...bevel(color.greenDeep),
    alignItems: 'center',
    justifyContent: 'center',
  },
  playGlyph: { fontSize: 16, color: '#FFFFFF', marginLeft: 2 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  world: {
    width: '47.5%',
    flexGrow: 1,
    borderRadius: radius.card,
    padding: 14,
    gap: 20,
  },
  mark: { fontFamily: font.displayBold, fontSize: 22, color: '#FFFFFF' },
  worldName: { fontFamily: font.displayBold, fontSize: 14.5, color: '#FFFFFF' },
  worldCount: {
    fontFamily: font.displayBold,
    fontSize: 11.5,
    color: 'rgba(255,255,255,0.9)',
    fontVariant: ['tabular-nums'],
  },
});
