import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { color, font, type } from '../theme';
import { Page, PageScroll, ScreenHeader, ListRow } from '../components/ui';
import { getChapters, SUBJECTS } from '../data/catalog';

export default function ChaptersScreen({ navigation, route }) {
  const { cls, subject } = route.params;
  const subj = SUBJECTS.find((s) => s.key === subject);
  const chapters = getChapters(cls, subject);

  return (
    <Page>
      <ScreenHeader onBack={() => navigation.goBack()} eyebrow={`Class ${cls} · ${subj.name}`}>
        <View style={styles.titleRow}>
          <Text style={type.display}>Chapters</Text>
          <Text style={styles.ncert}>NCERT 2025–26</Text>
        </View>
      </ScreenHeader>

      <PageScroll>
        {chapters.map((ch, i) => (
          <ListRow
            key={ch.no}
            first={i === 0}
            onPress={() =>
              navigation.navigate('Labs', { cls, subject, chapterNo: ch.no, chapter: ch })
            }
          >
            <Text style={styles.no}>{ch.no}</Text>
            <View style={{ flex: 1, gap: 5 }}>
              <Text style={styles.title}>{ch.title}</Text>
              <Text style={styles.meta}>{ch.labs} virtual labs</Text>
            </View>
            <Text style={styles.arrow}>→</Text>
          </ListRow>
        ))}
      </PageScroll>
    </Page>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  ncert: {
    fontFamily: font.bold,
    fontSize: 9.5,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: color.inkMuted,
    paddingBottom: 4,
  },
  no: {
    width: 30,
    fontFamily: font.bold,
    fontSize: 13,
    color: color.brass,
    fontVariant: ['tabular-nums'],
  },
  title: {
    fontFamily: font.semibold,
    fontSize: 15,
    lineHeight: 20,
    color: color.inkStrong,
  },
  meta: {
    fontFamily: font.bold,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: color.inkMuted,
  },
  arrow: { fontSize: 17, color: color.inkMuted },
});
