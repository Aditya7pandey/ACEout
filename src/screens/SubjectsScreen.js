import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { color, font, type, radius, space } from '../theme';
import { Page, PageScroll, Eyebrow, withAlpha } from '../components/ui';
import TabBar from '../components/TabBar';
import { SUBJECTS, CLASSES } from '../data/catalog';
import { useAppState } from '../store/AppState';
import { initialsOf, firstNameOf } from '../store/user';

/**
 * The home of the Learn tab. The class is no longer picked here — it comes
 * from the student's profile and is changed in the You tab — so this screen
 * opens straight on the four disciplines.
 */
export default function SubjectsScreen({ navigation }) {
  const { user, stats } = useAppState();
  const cls = user?.cls || '11';
  const first = firstNameOf(user?.name);
  const clsMeta = CLASSES.find((c) => c.num === cls);

  return (
    <Page>
      <View style={styles.header}>
        <View style={styles.headRow}>
          <View style={{ gap: 7, flex: 1 }}>
            <Eyebrow numberOfLines={1}>
              {greeting()}
              {first ? `, ${first}` : ''}
            </Eyebrow>
            <Text style={type.display}>
              Class {cls} · four <Text style={{ color: color.brass }}>disciplines</Text>
            </Text>
          </View>
          <Pressable style={styles.avatar} onPress={() => navigation.navigate('Profile')}>
            <Text style={styles.avatarText}>{initialsOf(user?.name)}</Text>
          </Pressable>
        </View>

        <Pressable style={styles.classLine} onPress={() => navigation.navigate('Profile')}>
          <Text style={styles.classLineText}>
            {clsMeta ? `${clsMeta.labs} labs · ` : ''}
            {stats.labsDone > 0
              ? `${stats.labsDone} logged${stats.streak > 1 ? ` · ${stats.streak}-day streak` : ''}`
              : 'Not your class? Change it in You'}
          </Text>
        </Pressable>

        <Pressable style={styles.search} onPress={() => navigation.navigate('Search')}>
          <View style={styles.searchDot} />
          <Text style={styles.searchText}>Search labs, chapters, concepts</Text>
        </Pressable>
      </View>

      <PageScroll contentStyle={{ gap: 11 }}>
        {SUBJECTS.map((s) => {
          const done = stats.bySubject[s.key] || 0;
          return (
            <Pressable
              key={s.key}
              onPress={() => navigation.navigate('Chapters', { cls, subject: s.key })}
              style={({ pressed }) => [
                styles.card,
                pressed && { borderColor: 'rgba(28,24,21,0.24)' },
              ]}
            >
              <View style={[styles.spine, { backgroundColor: s.accent }]} />
              <View
                style={[
                  styles.badge,
                  {
                    borderColor: withAlpha(s.accent, 0.35),
                    backgroundColor: withAlpha(s.accent, 0.07),
                  },
                ]}
              >
                <Text style={[styles.mark, { color: s.accent }]}>{s.mark}</Text>
              </View>
              <View style={{ flex: 1, gap: 5 }}>
                <Text style={styles.name}>{s.name}</Text>
                <Text style={styles.blurb}>{s.blurb}</Text>
                <Text style={[styles.meta, { color: s.accent }]}>
                  {done > 0 ? `${done} of ${s.totalLabs} done` : s.meta}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </PageScroll>

      <TabBar navigation={navigation} active="Subjects" />
    </Page>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: space.gutter, paddingTop: 16, paddingBottom: 20, gap: 18 },
  headRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F2EADC',
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: color.edge,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: font.bold, fontSize: 12, letterSpacing: 0.5, color: color.inkSoft },
  classLine: { marginTop: -8 },
  classLineText: {
    fontFamily: font.bold,
    fontSize: 9.5,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: color.brass,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: 'rgba(28,24,21,0.11)',
    backgroundColor: 'rgba(28,24,21,0.03)',
  },
  searchDot: { width: 13, height: 13, borderRadius: 7, borderWidth: 1.4, borderColor: color.inkMuted },
  searchText: { fontFamily: font.regular, fontSize: 13.5, color: color.inkMuted },
  card: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: radius.panel,
    paddingVertical: 20,
    paddingLeft: 22,
    paddingRight: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: color.hairline,
    backgroundColor: 'rgba(28,24,21,0.028)',
  },
  spine: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 2 },
  badge: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mark: { fontFamily: font.bold, fontSize: 16, letterSpacing: -0.4 },
  name: { fontFamily: font.bold, fontSize: 16.5, letterSpacing: -0.17, color: color.inkStrong },
  blurb: { fontFamily: font.regular, fontSize: 12.5, lineHeight: 19, color: color.inkMuted },
  meta: {
    fontFamily: font.bold,
    fontSize: 9.5,
    letterSpacing: 1.7,
    textTransform: 'uppercase',
    marginTop: 4,
  },
});
