import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Text as RNText, StyleSheet } from 'react-native';
import * as Font from 'expo-font';
import { KEYS, readJSON, writeJSON } from '../store/storage';
import { CATALOG } from './strings';

/**
 * Translation, kept as small as it can be.
 *
 * One catalogue, one hook, and a `Text` that swaps the typeface — there is no
 * library here because the app needs exactly two languages and no plurals,
 * dates or genders yet. When a third language or a plural rule shows up, this
 * is the file to replace.
 *
 * Only the ray-optics bench is translated; everything else is English in both
 * languages and falls back to `en` on a missing key, so a partly-translated
 * screen reads as English rather than as a list of dotted key names.
 */

export const LANGS = [
  { key: 'en', label: 'English' },
  { key: 'hi', label: 'हिन्दी' },
];

/**
 * Whether the catalogue has an entry at all — for the places that fall back to
 * something other than English, like a lab title that lives in the catalogue.
 */
export function hasKey(key) {
  return key in CATALOG.en;
}

/**
 * Plus Jakarta Sans and Fredoka carry no Devanagari, and a missing glyph is a
 * blank box on Android. Every weight therefore maps onto Noto Sans Devanagari,
 * which does — and which also carries Latin, so a line mixing "12.4 cm" into
 * Hindi stays in one typeface instead of two.
 */
const DEVANAGARI = {
  Fredoka_500Medium: 'NotoSansDevanagari_500Medium',
  Fredoka_600SemiBold: 'NotoSansDevanagari_600SemiBold',
  Fredoka_700Bold: 'NotoSansDevanagari_700Bold',
  PlusJakartaSans_400Regular: 'NotoSansDevanagari_400Regular',
  PlusJakartaSans_500Medium: 'NotoSansDevanagari_500Medium',
  PlusJakartaSans_600SemiBold: 'NotoSansDevanagari_600SemiBold',
  PlusJakartaSans_700Bold: 'NotoSansDevanagari_700Bold',
  PlusJakartaSans_800ExtraBold: 'NotoSansDevanagari_700Bold',
};

const LanguageContext = createContext(null);

/**
 * The Devanagari faces, fetched the first time they are actually needed.
 *
 * These are ~219 KB each and used to be registered at launch alongside the
 * Latin faces, which meant every English cold start paid for a script it would
 * never draw. Loading them here costs a Hindi student a moment of the system
 * Devanagari face on their first Hindi screen — which renders correctly, just
 * not in Noto — and costs an English student nothing at all.
 *
 * Module-level promise, so switching back and forth does not reload them.
 */
let devanagariLoad = null;

function loadDevanagari() {
  if (!devanagariLoad) {
    devanagariLoad = import('@expo-google-fonts/noto-sans-devanagari')
      .then((m) =>
        Font.loadAsync({
          NotoSansDevanagari_400Regular: m.NotoSansDevanagari_400Regular,
          NotoSansDevanagari_500Medium: m.NotoSansDevanagari_500Medium,
          NotoSansDevanagari_600SemiBold: m.NotoSansDevanagari_600SemiBold,
          NotoSansDevanagari_700Bold: m.NotoSansDevanagari_700Bold,
        })
      )
      .catch(() => {
        // A missing face is a cosmetic problem, never a crash: the platform
        // falls back to its own Devanagari. Let the next switch try again.
        devanagariLoad = null;
      });
  }
  return devanagariLoad;
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState('en');

  useEffect(() => {
    let alive = true;
    readJSON(KEYS.lang, null).then((stored) => {
      if (alive && stored?.lang && CATALOG[stored.lang]) setLangState(stored.lang);
    });
    return () => {
      alive = false;
    };
  }, []);

  // Pull the Devanagari faces in as soon as Hindi is in play — on the stored
  // preference at boot as much as on a live switch, but always *after* the
  // first paint rather than before it.
  useEffect(() => {
    if (lang === 'hi') loadDevanagari();
  }, [lang]);

  const setLang = useCallback(async (next) => {
    if (!CATALOG[next]) return;
    setLangState(next);
    await writeJSON(KEYS.lang, { lang: next });
  }, []);

  const t = useCallback(
    (key, vars) => {
      const raw = CATALOG[lang]?.[key] ?? CATALOG.en[key] ?? key;
      if (!vars) return raw;
      return raw.replace(/\{(\w+)\}/g, (m, name) => (name in vars ? String(vars[name]) : m));
    },
    [lang]
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

/**
 * Safe outside the provider: falls back to English rather than throwing, so a
 * component can be translated before its screen is wrapped.
 */
export function useLanguage() {
  return (
    useContext(LanguageContext) || {
      lang: 'en',
      setLang: () => {},
      t: (key, vars) => {
        const raw = CATALOG.en[key] ?? key;
        return vars ? raw.replace(/\{(\w+)\}/g, (m, n) => (n in vars ? String(vars[n]) : m)) : raw;
      },
    }
  );
}

const HAS_DEVANAGARI = /[ऀ-ॿ]/;

function containsDevanagari(node) {
  if (typeof node === 'string') return HAS_DEVANAGARI.test(node);
  if (Array.isArray(node)) return node.some(containsDevanagari);
  if (node && typeof node === 'object' && node.props) return containsDevanagari(node.props.children);
  return false;
}

/**
 * A drop-in replacement for react-native's `Text` that carries the right
 * typeface for whatever it is actually rendering.
 *
 * A translated file swaps one import — `import { Text } from '../../i18n'` —
 * and every string in it becomes Devanagari-safe, instead of thirty style
 * rules each needing a conditional font.
 *
 * The swap is decided by the *content*, not by the current language, so a
 * screen that is half translated keeps Fredoka on its English half instead of
 * quietly restyling it. A label that is still English in Hindi mode looks the
 * way it does everywhere else in the app.
 */
export function Text({ style, children, ...rest }) {
  const flat = StyleSheet.flatten(style) || {};
  const swapped = DEVANAGARI[flat.fontFamily];

  if (!swapped || !containsDevanagari(children)) {
    return (
      <RNText style={style} {...rest}>
        {children}
      </RNText>
    );
  }

  return (
    <RNText style={[style, { fontFamily: swapped }]} {...rest}>
      {children}
    </RNText>
  );
}
