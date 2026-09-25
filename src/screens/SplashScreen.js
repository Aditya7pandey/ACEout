import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { color, font } from '../theme';
import { Page, GoldButton } from '../components/ui';

export default function SplashScreen({ navigation }) {
  const outer = useRef(new Animated.Value(0)).current;
  const inner = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const spin = (v, duration, reverse) =>
      Animated.loop(
        Animated.timing(v, {
          toValue: reverse ? -1 : 1,
          duration,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
    const a = spin(outer, 26000, false);
    const b = spin(inner, 15000, true);
    a.start();
    b.start();
    return () => {
      a.stop();
      b.stop();
    };
  }, [outer, inner]);

  const rot = (v) => ({
    transform: [
      {
        rotate: v.interpolate({ inputRange: [-1, 1], outputRange: ['-360deg', '360deg'] }),
      },
    ],
  });

  return (
    <Page style={styles.page}>
      <View style={styles.middle}>
        <View style={styles.orbits}>
          <Animated.View style={[styles.orbitOuter, rot(outer)]}>
            <View style={styles.pipOuter} />
          </Animated.View>
          <Animated.View style={[styles.orbitInner, rot(inner)]}>
            <View style={styles.pipInner} />
          </Animated.View>
          <View style={styles.sun} />
        </View>

        <View style={styles.titleBlock}>
          <Text style={styles.wordmark}>ACEout</Text>
          <Text style={styles.tagline}>Every NCERT experiment. Your own readings.</Text>
        </View>
      </View>

      <View style={styles.bottom}>
        <GoldButton label="Start" onPress={() => navigation.navigate('Onboarding')} />
        {/* <Text style={styles.signin}>
          Already enrolled? <Text style={styles.signinLink}>Sign in</Text>
        </Text> */}
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  page: { paddingHorizontal: 30, justifyContent: 'space-between' },
  middle: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 34 },
  orbits: { width: 200, height: 200, alignItems: 'center', justifyContent: 'center' },
  orbitOuter: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: color.hairline,
  },
  pipOuter: {
    position: 'absolute',
    top: -5,
    left: 95,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: color.gold,
  },
  orbitInner: {
    position: 'absolute',
    width: 132,
    height: 132,
    borderRadius: 66,
    borderWidth: 2,
    borderColor: color.hairline,
  },
  pipInner: {
    position: 'absolute',
    bottom: -4,
    left: 26,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: color.purple,
  },
  sun: {
    width: 92,
    height: 86,
    borderRadius: 46,
    backgroundColor: color.blue,
    borderBottomWidth: 7,
    borderBottomColor: color.blueDeep,
  },
  titleBlock: { alignItems: 'center', gap: 10 },
  wordmark: {
    fontFamily: font.displayBold,
    fontSize: 52,
    lineHeight: 58,
    color: color.ink,
  },
  tagline: {
    fontFamily: font.regular,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    color: color.inkMuted,
    maxWidth: 260,
  },
  bottom: { gap: 16, paddingBottom: 38, flexDirection: 'column' },
  signin: {
    textAlign: 'center',
    fontFamily: font.regular,
    fontSize: 13,
    color: color.inkMuted,
  },
  signinLink: { fontFamily: font.semibold, color: color.brass },
});
