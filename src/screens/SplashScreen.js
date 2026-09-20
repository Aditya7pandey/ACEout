import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { color, font, type } from '../theme';
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
          <View style={styles.hair} />
          <Text style={styles.tagline}>
            Every NCERT experiment, rebuilt as a laboratory you can walk into. Classes 8 to 12.
          </Text>
        </View>
      </View>

      <View style={styles.bottom}>
        <GoldButton label="Enter the lab" onPress={() => navigation.navigate('Onboarding')} />
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
    borderWidth: 1,
    borderColor: 'rgba(150,102,47,0.16)',
  },
  pipOuter: {
    position: 'absolute',
    top: -2.5,
    left: 97.5,
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: color.brass,
  },
  orbitInner: {
    position: 'absolute',
    width: 132,
    height: 132,
    borderRadius: 66,
    borderWidth: 1,
    borderColor: 'rgba(28,24,21,0.09)',
  },
  pipInner: {
    position: 'absolute',
    bottom: -2,
    left: 26,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: color.physics,
  },
  sun: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#C79F6E',
    borderWidth: 6,
    borderColor: '#DCBB8C',
    shadowColor: '#96662F',
    shadowOpacity: 0.28,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 16 },
    elevation: 8,
  },
  titleBlock: { alignItems: 'center', gap: 16 },
  wordmark: {
    fontFamily: font.bold,
    fontSize: 50,
    lineHeight: 52,
    letterSpacing: -1.25,
    color: color.ink,
  },
  hair: { height: 1, width: 52, backgroundColor: 'rgba(150,102,47,0.5)' },
  tagline: {
    fontFamily: font.regular,
    fontSize: 14.5,
    lineHeight: 24,
    textAlign: 'center',
    color: color.inkMuted,
    maxWidth: 278,
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
