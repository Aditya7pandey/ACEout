import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  Rect,
  Line,
  G,
  Path,
  Ellipse,
  Circle,
  Polyline,
} from 'react-native-svg';
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
            <LabArt colours={l.art} scene={l.scene} uid={l.id} />
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

/**
 * A lab's card art. Most benches get the house gradient-and-grid; a lab that
 * names a `scene` gets a drawing of the apparatus instead, so the card shows
 * what it is before you open it.
 */
function LabArt({ colours, scene, uid }) {
  const Scene = SCENES[scene];
  if (Scene) return <Scene uid={uid} />;

  // Gradient ids share one document on web, so they have to be per-card.
  const gid = `g-${uid}`;
  return (
    <View style={styles.art}>
      <Svg width="100%" height={118}>
        <Defs>
          <LinearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colours[0]} />
            <Stop offset="1" stopColor={colours[1]} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="118" fill={`url(#${gid})`} />
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

/**
 * The human-eye bench, in miniature: the object on its rule, three rays, and
 * the eye they land in. Same drawing the lab opens with, cropped to a card.
 */
function EyeCardArt({ uid }) {
  // The card is as wide as the screen allows, so the drawing is laid out in
  // real pixels against the measured width rather than squeezed into a fixed
  // viewBox — the eye stays pinned to the right and the bench fills the rest.
  const [w, setW] = useState(0);
  const H = 118;
  const AX = 58;
  const W = Math.max(300, w);
  const LENS = W - 120;
  const RET = LENS + 88;
  const OBJ = Math.max(40, W - 320);
  const rays = [-15, 0, 15].map((k) => ({
    a: `${OBJ},26 ${LENS},${AX + k}`,
    b: `${LENS},${AX + k} ${RET},70`,
  }));

  return (
    <View style={styles.art} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
        <Defs>
          <LinearGradient id={`eb-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#1A2230" />
            <Stop offset="1" stopColor="#10161F" />
          </LinearGradient>
          <RadialGradient id={`eg-${uid}`} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#4668AE" stopOpacity="0.3" />
            <Stop offset="1" stopColor="#4668AE" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id={`es-${uid}`} cx="36%" cy="32%" r="76%">
            <Stop offset="0" stopColor="#FFFFFF" />
            <Stop offset="1" stopColor="#CFC4B5" />
          </RadialGradient>
          <LinearGradient id={`ei-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#6B8FA8" />
            <Stop offset="1" stopColor="#2E4A5E" />
          </LinearGradient>
        </Defs>

        <Rect x="0" y="0" width={W} height={H} fill={`url(#eb-${uid})`} />
        <Ellipse cx={LENS + 42} cy={AX} rx="150" ry="100" fill={`url(#eg-${uid})`} />

        <Line
          x1="18"
          y1={AX}
          x2={RET}
          y2={AX}
          stroke="rgba(255,255,255,0.18)"
          strokeWidth="1"
          strokeDasharray="5 6"
        />

        {/* the rule the object runs on */}
        <Line x1="18" y1="100" x2={LENS - 24} y2="100" stroke="rgba(255,255,255,0.4)" strokeWidth="1.4" />
        {Array.from({ length: Math.max(4, Math.floor((LENS - 46) / 19)) }).map((_, i) => (
          <Line
            key={i}
            x1={22 + i * 19}
            y1="100"
            x2={22 + i * 19}
            y2={i % 3 === 0 ? 108 : 105}
            stroke="rgba(255,255,255,0.34)"
            strokeWidth="1"
          />
        ))}

        {rays.map((r, i) => (
          <G key={i}>
            <Polyline points={r.a} fill="none" stroke="#E8A33D" strokeWidth="1.7" strokeOpacity="0.9" />
            <Polyline points={r.b} fill="none" stroke="#E8A33D" strokeWidth="1.7" strokeOpacity="0.72" />
          </G>
        ))}

        {/* The eye. At thumbnail size the iris and the corneal dome collapse
            into noise, so this keeps only what reads: the ball, the retina it
            is painted on, the lens, and the point the light lands at. */}
        <Ellipse cx={LENS + 44} cy={AX} rx="54" ry="48" fill={`url(#es-${uid})`} />
        <Path
          d={`M ${LENS + 44} ${AX - 42} A 46 42 0 0 1 ${LENS + 44} ${AX + 42}`}
          fill="none"
          stroke="#A84034"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Path
          d={`M ${LENS} ${AX - 18} Q ${LENS + 11} ${AX} ${LENS} ${AX + 18} Q ${LENS - 11} ${AX} ${LENS} ${AX - 18} Z`}
          fill={`url(#ei-${uid})`}
          fillOpacity="0.35"
          stroke="rgba(150,196,220,0.95)"
          strokeWidth="1.4"
        />
        <Circle cx={RET} cy="70" r="6" fill="#FFF2CE" fillOpacity="0.3" />
        <Circle cx={RET} cy="70" r="2.8" fill="#FFF6DC" />

        {/* the object */}
        <Line x1={OBJ} y1="100" x2={OBJ} y2={AX} stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
        <Line x1={OBJ} y1={AX} x2={OBJ} y2="32" stroke="#E8A33D" strokeWidth="4" strokeLinecap="round" />
        <Path d={`M ${OBJ} 22 L ${OBJ - 7} 38 L ${OBJ + 7} 38 Z`} fill="#E8A33D" />
        <Circle cx={OBJ} cy="27" r="3.5" fill="#FFF3D8" />
      </Svg>
    </View>
  );
}

const SCENES = { eye: EyeCardArt };

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
