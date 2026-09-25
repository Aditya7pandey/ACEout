import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { color, font } from '../theme';
import { Page, GoldButton } from '../components/ui';
import LogoMark from '../brand/LogoMark';

export default function SplashScreen({ navigation }) {
  const spin = useRef(new Animated.Value(0)).current;

  // The mark is a vortex, so it turns. Slowly — one revolution every half
  // minute, which reads as motion without ever asking to be watched.
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 30000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [spin]);

  const rot = {
    transform: [
      {
        rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }),
      },
    ],
  };

  return (
    <Page style={styles.page}>
      <View style={styles.middle}>
        <Animated.View style={rot}>
          <LogoMark size={176} />
        </Animated.View>

        <View style={styles.titleBlock}>
          <Text style={styles.wordmark}>LabVR</Text>
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
  middle: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 30 },
  titleBlock: { alignItems: 'center', gap: 10 },
  wordmark: {
    fontFamily: font.displayBold,
    fontSize: 52,
    lineHeight: 58,
    letterSpacing: 0.5,
    color: color.brandInk,
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
