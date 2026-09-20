import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect, Line, G } from 'react-native-svg';
import { color, font, radius } from '../theme';
import { Page, PageScroll, ScreenHeader, Rule } from '../components/ui';
import { getLabs } from '../data/catalog';
import { useAppState } from '../store/AppState';
import { completionFor, describeWhen } from '../store/progress';

export default function LabsScreen({ navigation, route }) {
  const { cls, subject, chapterNo, chapter } = route.params;
  const labs = getLabs(cls, subject, chapterNo);
  const { progress } = useAppState();

  return (
    <Page>
      <View>
        <ScreenHeader
          onBack={() => navigation.goBack()}
          eyebrow={`Chapter ${chapterNo}`}
          title={chapter.title}
          subtitle={
            chapter.blurb ||
            'Run every prescribed experiment from this chapter on a 3D bench, with readings you record yourself.'
          }
        />
        <Rule />
      </View>

      <PageScroll contentStyle={{ gap: 14, paddingTop: 18 }}>
        {labs.map((l) => {
          const done = completionFor(progress, l.id);
          return (
          <Pressable
            key={l.id}
            onPress={() =>
              l.built
                ? navigation.navigate('Lab', {
                    labId: l.id,
                    title: l.title,
                    cls,
                    subject,
                    chapterNo,
                  })
                : undefined
            }
            style={({ pressed }) => [
              styles.card,
              !l.built && { opacity: 0.55 },
              pressed && l.built && { borderColor: 'rgba(150,102,47,0.4)' },
            ]}
          >
            <LabArt colours={l.art} />
            {done ? (
              <View style={styles.doneChip}>
                <Text style={styles.doneChipText}>
                  Done · {describeWhen(done.at)}
                  {done.runs > 1 ? ` · ${done.runs} runs` : ''}
                </Text>
              </View>
            ) : null}
            <View style={styles.body}>
              <Text style={styles.title}>{l.title}</Text>
              <Text style={styles.desc}>{l.desc}</Text>
              <View style={styles.tags}>
                <Text style={styles.tag}>{l.tag1}</Text>
                <Text style={styles.tag}>{l.tag2}</Text>
              </View>
            </View>
          </Pressable>
          );
        })}
      </PageScroll>
    </Page>
  );
}

function LabArt({ colours }) {
  return (
    <View style={styles.art}>
      <Svg width="100%" height={118}>
        <Defs>
          <LinearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colours[0]} />
            <Stop offset="1" stopColor={colours[1]} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="118" fill="url(#g)" />
        <G opacity={0.28}>
          {Array.from({ length: 16 }).map((_, i) => (
            <Line
              key={`v${i}`}
              x1={i * 26}
              y1="0"
              x2={i * 26}
              y2="118"
              stroke="rgba(28,24,21,0.35)"
              strokeWidth="0.6"
            />
          ))}
          {Array.from({ length: 5 }).map((_, i) => (
            <Line
              key={`h${i}`}
              x1="0"
              y1={i * 26}
              x2="100%"
              y2={i * 26}
              stroke="rgba(28,24,21,0.35)"
              strokeWidth="0.6"
            />
          ))}
        </G>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: color.hairline,
    backgroundColor: 'rgba(28,24,21,0.028)',
    overflow: 'hidden',
  },
  art: { height: 118, position: 'relative' },
  doneChip: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(251,247,240,0.94)',
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: 'rgba(47,142,108,0.5)',
  },
  doneChipText: {
    fontFamily: font.bold,
    fontSize: 8.5,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: color.green,
  },
  body: { paddingHorizontal: 18, paddingTop: 17, paddingBottom: 19, gap: 7 },
  title: {
    fontFamily: font.bold,
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: -0.16,
    color: color.ink,
  },
  desc: { fontFamily: font.regular, fontSize: 12.5, lineHeight: 19.5, color: color.inkMuted },
  tags: { flexDirection: 'row', gap: 14, marginTop: 8 },
  tag: {
    fontFamily: font.bold,
    fontSize: 9.5,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: color.inkMuted,
  },
});
