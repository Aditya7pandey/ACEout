import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { color, font, radius, space } from '../theme';
import { Page, ChunkyButton, GhostButton, StatTile } from '../components/ui';
import { useAppState } from '../store/AppState';

/**
 * What a finished bench looks like. Three stars, three numbers, one button —
 * the full report still lives in the lab; this is the reward screen.
 */
export default function CompleteScreen({ navigation, route }) {
  const { award, title, backTo, labParams } = route.params;
  const { level } = useAppState();
  const levelledUp = award.levelAfter > award.levelBefore;

  /**
   * This screen replaced the bench on the stack, so there is no lab to fall
   * back through — claiming pops to the chapter path if it is still behind us
   * and replaces it if the student arrived from Search.
   */
  const claim = () => {
    if (!backTo) {
      navigation.navigate('Subjects');
      return;
    }
    const onStack = navigation.getState()?.routes?.some((r) => r.name === 'Labs');
    if (onStack && navigation.popTo) navigation.popTo('Labs', backTo);
    else navigation.replace('Labs', backTo);
  };

  return (
    <Page>
      <Confetti />
      <View style={styles.body}>
        <View style={styles.middle}>
          <View style={styles.starRow}>
            <Text style={[styles.star, award.stars >= 1 && styles.starOn]}>★</Text>
            <Text style={[styles.starBig, award.stars >= 2 && styles.starOn]}>★</Text>
            <Text style={[styles.star, award.stars >= 3 && styles.starOn]}>★</Text>
          </View>

          <Text style={styles.headline}>Bench cleared!</Text>
          <Text style={styles.sub} numberOfLines={2}>
            {title}
          </Text>

          {levelledUp ? (
            <View style={styles.levelUp}>
              <Text style={styles.levelUpText}>Level {award.levelAfter}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.tiles}>
          <StatTile label="XP" value={`+${award.xp}`} tone={color.gold} />
          <StatTile label="Readings" value={award.trials} tone={color.green} />
          <StatTile label="Stars" value={`${award.stars}/3`} tone={color.blue} />
        </View>

        <View style={styles.bar}>
          <View style={styles.barTop}>
            <Text style={styles.barLabel}>{level.rank}</Text>
            <Text style={styles.barXp}>{level.toNext} XP to Level {level.level + 1}</Text>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${level.fraction * 100}%` }]} />
          </View>
        </View>

        <View style={{ gap: 10 }}>
          <ChunkyButton label="Claim XP" tone={color.green} onPress={claim} />
          {award.stars < 3 && labParams ? (
            <GhostButton
              label="Run it again"
              onPress={() => navigation.replace('Lab', labParams)}
            />
          ) : null}
        </View>
      </View>
    </Page>
  );
}

/** Falling paper. Purely decorative, so it never blocks a tap. */
function Confetti() {
  const { width, height } = Dimensions.get('window');
  const pieces = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => ({
        key: i,
        left: ((i * 37) % 100) / 100,
        size: i % 3 ? 8 : 11,
        tall: i % 2 ? 13 : 8,
        round: i % 4 === 0,
        tone: [color.gold, color.blue, color.green, color.red, color.purple][i % 5],
        delay: i * 180,
        duration: 3200 + (i % 5) * 600,
      })),
    []
  );

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((p) => (
        <Piece key={p.key} piece={p} width={width} height={height} />
      ))}
    </View>
  );
}

function Piece({ piece, width, height }) {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(t, {
        toValue: 1,
        duration: piece.duration,
        delay: piece.delay,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [t, piece.duration, piece.delay]);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: piece.left * width,
        top: -40,
        width: piece.size,
        height: piece.tall,
        borderRadius: piece.round ? piece.size / 2 : 2,
        backgroundColor: piece.tone,
        opacity: 0.9,
        transform: [
          { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [0, height + 80] }) },
          {
            rotate: t.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '540deg'] }),
          },
        ],
      }}
    />
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    paddingHorizontal: space.gutter,
    paddingTop: 24,
    paddingBottom: 28,
    gap: 20,
  },
  middle: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  starRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  star: { fontSize: 46, color: color.locked },
  starBig: { fontSize: 60, color: color.locked },
  starOn: { color: color.gold },
  headline: { fontFamily: font.displayBold, fontSize: 32, color: color.brass },
  sub: {
    fontFamily: font.regular,
    fontSize: 13.5,
    lineHeight: 20,
    textAlign: 'center',
    color: color.inkMuted,
    maxWidth: 280,
  },
  levelUp: {
    marginTop: 4,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: color.purpleSoft,
    borderWidth: 2,
    borderColor: color.purpleEdge,
  },
  levelUpText: { fontFamily: font.displayBold, fontSize: 14, color: color.purpleDeep },

  tiles: { flexDirection: 'row', gap: 10 },

  bar: { gap: 8 },
  barTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  barLabel: {
    fontFamily: font.extra,
    fontSize: 10.5,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: color.inkMuted,
  },
  barXp: { fontFamily: font.displayBold, fontSize: 12.5, color: color.brass },
  track: { height: 14, borderRadius: 999, backgroundColor: color.hairline, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 999, backgroundColor: color.gold },
});
