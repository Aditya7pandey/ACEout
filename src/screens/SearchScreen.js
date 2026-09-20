import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { color, font, space } from '../theme';
import { Page, PageScroll, ListRow } from '../components/ui';
import TabBar from '../components/TabBar';
import { searchLabs, SEARCH_INDEX } from '../data/catalog';
import { useAppState } from '../store/AppState';
import { hasCompleted } from '../store/progress';

const FILTERS = ['Labs', 'Chapters', 'Concepts'];

export default function SearchScreen({ navigation }) {
  const { progress } = useAppState();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('Labs');

  const results = useMemo(
    () => (query.trim() ? searchLabs(query) : SEARCH_INDEX),
    [query]
  );

  return (
    <Page>
      <View style={styles.header}>
        <View style={styles.field}>
          <View style={styles.dot} />
          <TextInput
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            placeholder="Search labs, chapters, concepts"
            placeholderTextColor="rgba(28,24,21,0.3)"
            autoCorrect={false}
            returnKeyType="search"
          />
        </View>
        <View style={styles.filters}>
          {FILTERS.map((f) => (
            <Pressable key={f} onPress={() => setFilter(f)}>
              <Text style={[styles.filter, f === filter && styles.filterOn]}>{f}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <PageScroll>
        {results.length === 0 ? (
          <Text style={styles.empty}>
            Nothing matches “{query}”. Try “work”, “energy”, “incline” or “friction”.
          </Text>
        ) : (
          results.map((r, i) => (
            <ListRow
              key={r.id}
              first={i === 0}
              onPress={() =>
                r.built
                  ? navigation.navigate('Lab', {
                      labId: r.id,
                      title: r.title,
                      cls: r.cls,
                      subject: r.subject,
                      chapterNo: r.chapterNo,
                    })
                  : navigation.navigate('Labs', {
                      cls: r.cls,
                      subject: r.subject,
                      chapterNo: r.chapterNo,
                      chapter: { no: r.chapterNo, title: r.title, labs: 4 },
                    })
              }
            >
              <View style={styles.swatch}>
                <Svg width={36} height={36}>
                  <Defs>
                    <LinearGradient id={`s${i}`} x1="0" y1="0" x2="1" y2="1">
                      <Stop offset="0" stopColor={r.art[0]} />
                      <Stop offset="1" stopColor={r.art[1]} />
                    </LinearGradient>
                  </Defs>
                  <Rect width={36} height={36} rx={11} fill={`url(#s${i})`} />
                </Svg>
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.title}>{r.title}</Text>
                <Text style={styles.crumb}>{r.crumb}</Text>
              </View>
              {hasCompleted(progress, r.id) ? (
                <Text style={styles.doneMark}>DONE</Text>
              ) : r.built ? (
                <Text style={styles.live}>LIVE</Text>
              ) : null}
            </ListRow>
          ))
        )}
      </PageScroll>

      <TabBar navigation={navigation} active="Search" />
    </Page>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: space.gutter, paddingTop: 14, paddingBottom: 18, gap: 16 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingVertical: 12,
    paddingHorizontal: 17,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: 'rgba(150,102,47,0.4)',
    backgroundColor: 'rgba(150,102,47,0.05)',
  },
  dot: { width: 13, height: 13, borderRadius: 7, borderWidth: 1.4, borderColor: color.brass },
  input: {
    flex: 1,
    fontFamily: font.medium,
    fontSize: 13.5,
    color: color.inkStrong,
    padding: 0,
  },
  filters: { flexDirection: 'row', gap: 20, paddingLeft: 4 },
  filter: {
    fontFamily: font.bold,
    fontSize: 10,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: color.inkMuted,
    paddingBottom: 7,
  },
  filterOn: {
    color: color.brass,
    borderBottomWidth: 1,
    borderBottomColor: color.brass,
  },
  swatch: { width: 36, height: 36, borderRadius: 11, overflow: 'hidden' },
  title: { fontFamily: font.semibold, fontSize: 14, lineHeight: 19, color: color.inkStrong },
  crumb: {
    fontFamily: font.bold,
    fontSize: 9.5,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: color.inkMuted,
  },
  doneMark: {
    fontFamily: font.bold,
    fontSize: 9,
    letterSpacing: 1.4,
    color: color.brass,
  },
  live: {
    fontFamily: font.bold,
    fontSize: 9,
    letterSpacing: 1.4,
    color: color.green,
  },
  empty: {
    fontFamily: font.regular,
    fontSize: 13,
    lineHeight: 21,
    color: color.inkMuted,
    paddingTop: 10,
  },
});
