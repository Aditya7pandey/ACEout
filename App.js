import React, { useCallback, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreenApi from 'expo-splash-screen';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import {
  Fredoka_500Medium,
  Fredoka_600SemiBold,
  Fredoka_700Bold,
} from '@expo-google-fonts/fredoka';

import { color } from './src/theme';
import { lockPortrait } from './src/utils/orientation';
import { AppStateProvider, useAppState } from './src/store/AppState';
import { LanguageProvider } from './src/i18n';
import SplashScreen from './src/screens/SplashScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import SubjectsScreen from './src/screens/SubjectsScreen';
import ChaptersScreen from './src/screens/ChaptersScreen';
import LabsScreen from './src/screens/LabsScreen';
import LabScreen from './src/screens/LabScreen';
import SearchScreen from './src/screens/SearchScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import QuestsScreen from './src/screens/QuestsScreen';
import CompleteScreen from './src/screens/CompleteScreen';

SplashScreenApi.preventAutoHideAsync().catch(() => {});

const Stack = createNativeStackNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: color.screen, card: color.screen },
};

export default function App() {
  return (
    <AppStateProvider>
      <LanguageProvider>
        <Root />
      </LanguageProvider>
    </AppStateProvider>
  );
}

function Root() {
  const { ready, user } = useAppState();

  /**
   * Only the faces the first screen actually needs are allowed to hold up the
   * launch.
   *
   * The four Devanagari weights used to be in here, and they are ~876 KB of the
   * ~1.5 MB this call had to register before the app could draw anything —
   * more than half the font cost, for a script that only appears if the student
   * switches the ray-optics bench to Hindi. They now load from
   * `LanguageProvider` the moment the language becomes `hi`, and the system
   * Devanagari face covers the gap in the meantime.
   */
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    Fredoka_500Medium,
    Fredoka_600SemiBold,
    Fredoka_700Bold,
  });

  const booted = fontsLoaded && ready;

  // app.json declares `default` so the OS will permit a rotation at all; the
  // app itself is portrait everywhere except the wide lab benches, which
  // unlock it deliberately and put it back when they close.
  useEffect(() => {
    lockPortrait();
  }, []);

  const onReady = useCallback(() => {
    if (booted) SplashScreenApi.hideAsync().catch(() => {});
  }, [booted]);

  // Wait for both the fonts and the stored profile before mounting the
  // navigator — the initial route depends on whether this student has
  // onboarded, and React Navigation only reads it once.
  if (!booted) return <View style={styles.boot} />;

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <NavigationContainer theme={navTheme} onReady={onReady}>
        <Stack.Navigator
          initialRouteName={user ? 'Subjects' : 'Splash'}
          screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.screen } }}
        >
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Subjects" component={SubjectsScreen} />
          <Stack.Screen name="Chapters" component={ChaptersScreen} />
          <Stack.Screen name="Labs" component={LabsScreen} />
          <Stack.Screen name="Lab" component={LabScreen} />
          <Stack.Screen name="Complete" component={CompleteScreen} />
          <Stack.Screen name="Search" component={SearchScreen} />
          <Stack.Screen name="Quests" component={QuestsScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  boot: { flex: 1, backgroundColor: color.screen },
});
