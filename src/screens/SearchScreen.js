import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import { color, font, radius, bevel, deepen, space } from '../theme';
import { Page, PageScroll, Stars } from '../components/ui';
import TabBar from '../components/TabBar';
import { searchLabs, SEARCH_INDEX, SUBJECTS } from '../data/catalog';
import { useAppState } from '../store/AppState';
import { starsFor } from '../store/game';

export default function SearchScreen({ navigation }) {
  const { game } = useAppState();
  const [query, setQuery] = useState('');

  const results = useMemo(
    () => (query.trim() ? searchLabs(query) : SEARCH_INDEX),
    [query]
  );

  return (
    <Page>
      <View style={styles.header}>
        <View style={styles.field}>
          <Text style={styles.glass}>⌕</Text>
          <TextInput
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            placeholder="Search benches"
            placeholderTextColor={color.inkFaint}
            autoCorrect={false}
            returnKeyType="search"
          />
        </View>
      </View>

      <PageScroll contentStyle={{ gap: 10 }}>
        {results.length === 0 ? (
          <Text style={styles.empty}>Nothing for “{query}”.</Text>
        ) : (
          results.map((r) => {
            const subj = SUBJECTS.find((s) => s.key === r.subject);
            const accent = subj?.accent || color.blue;
            const stars = starsFor(game, r.id);
            return (
              <Pressable
                key={r.id}
                style={({ pressed }) => [styles.row, pressed && styles.pressed]}
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
                <View
                  style={[
                    styles.mark,
                    r.built
                      ? { backgroundColor: accent, ...bevel(deepen[accent] || color.inkStrong, 3) }
                      : { backgroundColor: color.locked, ...bevel(color.lockedDeep, 3) },
                  ]}
                >
                  <Text style={[styles.markText, !r.built && { color: color.lockedInk }]}>
                    {subj?.mark || '··'}
                  </Text>
                </View>
                <View style={{ flex: 1, gap: 5 }}>
                  <Text style={styles.title} numberOfLines={2}>
                    {r.title}
                  </Text>
                  <Text style={styles.crumb}>{r.crumb}</Text>
                </View>
                {stars > 0 ? (
                  <Stars earned={stars} size={12} />
                ) : r.built ? (
                  <View style={styles.live}>
                    <Text style={styles.liveText}>Live</Text>
                  </View>
                ) : null}
              </Pressable>
            );
          })
        )}
      </PageScroll>

      <TabBar navigation={navigation} active="Search" />
    </Page>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: space.gutter, paddingTop: 12, paddingBottom: 16 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: color.hairline,
    backgroundColor: color.sunk,
  },
  glass: { fontSize: 19, color: color.inkFaint, marginTop: -2 },
  input: {
    flex: 1,
    fontFamily: font.display,
    fontSize: 15,
    color: color.inkStrong,
    padding: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    padding: 12,
    borderRadius: radius.tile,
    borderWidth: 2,
    borderColor: color.hairline,
    ...bevel(color.hairline),
  },
  pressed: { transform: [{ translateY: 3 }], borderBottomWidth: 2 },
  mark: {
    width: 44,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markText: { fontFamily: font.displayBold, fontSize: 14, color: '#FFFFFF' },
  title: { fontFamily: font.display, fontSize: 14.5, lineHeight: 18, color: color.inkStrong },
  crumb: {
    fontFamily: font.extra,
    fontSize: 9.5,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: color.inkFaint,
  },
  live: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: color.greenSoft,
    borderWidth: 2,
    borderColor: color.greenEdge,
  },
  liveText: { fontFamily: font.displayBold, fontSize: 11, color: color.greenDeep },
  empty: { fontFamily: font.regular, fontSize: 13, color: color.inkMuted, paddingTop: 8 },
});
