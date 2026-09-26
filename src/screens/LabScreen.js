import React, { Suspense, lazy, useCallback, useState, useEffect } from 'react';
import { View, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, useLanguage, hasKey } from '../i18n';
import { color, font, radius, bevel, shadow } from '../theme';
import { Page, BackButton, Rule } from '../components/ui';
import { getChapters } from '../data/catalog';
import { useAppState } from '../store/AppState';
import { isVoiceEnabled, checkOnline } from '../voice';
import VoiceOverlay from '../voice/VoiceOverlay';

/**
 * The benches, loaded when one is opened rather than when the app starts.
 *
 * These six imports used to be static, and they were the single most expensive
 * thing about launching the app. Four of the benches reach three.js — through
 * `ChemistryStage`, `LaunchScene`, `PlantPhysiologyScene3D` and the glassware —
 * so every cold start parsed and evaluated the whole 3D stack before it could
 * draw the splash, for a screen the student is at least three taps away from
 * and may never visit in a session.
 *
 * `lazy()` defers the module's *evaluation*, which is the cost that matters
 * here; on web Metro also splits it into its own chunk. The bench is behind a
 * navigation push, so the Suspense fallback below is almost never seen — and
 * when it is, it is a spinner on the screen the student just asked for rather
 * than a longer wait on the screen before it.
 */
const REGISTRY = {
  'incline-work-energy': lazy(() => import('../labs/incline/InclineLab')),
  'acid-base-indicators': lazy(() => import('../labs/indicators/IndicatorsLab')),
  'ph-determination': lazy(() => import('../labs/ph_determination/PhDeterminationLab')),
  'gravity-launch': lazy(() => import('../labs/gravity_launch/GravityLaunchLab')),
  'plant-physiology': lazy(() => import('../labs/plant_physiology/PlantPhysiologyLab')),
  'eye-defects': lazy(() => import('../labs/ray_optics_eye/RayOpticsEyeLab')),
};

export default function LabScreen({ navigation, route }) {
  const { labId, title, cls, subject, chapterNo } = route.params;
  const Lab = REGISTRY[labId];
  const { completeLab } = useAppState();
  const { t } = useLanguage();
  const [activeVoice, setActiveVoice] = useState(false);

  // `Page` pads itself by the safe-area inset, but an absolutely positioned
  // child is laid out against the padding box — padding does not push it in.
  // Under Android edge-to-edge (the default since SDK 54) that puts a plain
  // `bottom: 24` underneath the system navigation bar, so the offset has to
  // carry the inset itself.
  const insets = useSafeAreaInsets();

  // The catalogue is English. A bench that has been translated names itself in
  // the string catalogue, and the bar prefers that when it is there.
  const shownTitle = hasKey(`lab.title.${labId}`) ? t(`lab.title.${labId}`) : title;
  const [finished, setFinished] = useState(false);

  // A bench can ask for the whole screen. The bar above it is chrome the
  // simulation does not need once the student is inside it, so labs call
  // `onChrome(false)` when they open and `onChrome(true)` when they come back
  // out. A lab that never calls it keeps the bar, which is the old behaviour.
  const [chrome, setChrome] = useState(true);

  // Voice AI: check connectivity so the "Ask AI" button only appears online.
  const hasVoice = isVoiceEnabled(labId);
  const [isOnline, setIsOnline] = useState(false);
  useEffect(() => {
    if (!hasVoice) return;
    checkOnline().then(setIsOnline);
    const id = setInterval(() => checkOnline().then(setIsOnline), 30000);
    return () => clearInterval(id);
  }, [hasVoice]);

  /**
   * A finished bench hands over to the reward screen, which owns the way back
   * to the chapter path.
   *
   * The chapter params are rebuilt and carried through rather than left to the
   * route already on the stack: `popTo` without params does not preserve the
   * old ones, it *replaces* them with undefined, and `LabsScreen` destructures
   * `route.params` on its first line.
   */
  const toResult = useCallback(
    (award) => {
      const chapter = getChapters(cls, subject).find((c) => c.no === chapterNo) || {
        no: chapterNo,
        title: `Chapter ${chapterNo}`,
        labs: 0,
      };
      navigation.replace('Complete', {
        award,
        title,
        backTo: { cls, subject, chapterNo, chapter },
        labParams: { labId, title, cls, subject, chapterNo },
      });
    },
    [navigation, labId, title, cls, subject, chapterNo]
  );

  return (
    <Page background={color.screen}>
      {chrome ? (
        <>
          <View style={styles.bar}>
            <BackButton onPress={() => navigation.goBack()} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.title} numberOfLines={1}>
                {shownTitle}
              </Text>
            </View>
            <View style={[styles.status, finished && styles.statusDone]}>
              <Text style={[styles.statusLabel, finished && { color: color.brass }]}>
                {finished ? 'Logged' : 'Live'}
              </Text>
            </View>
          </View>
          <Rule />
        </>
      ) : null}

      {Lab ? (
        <Suspense
          fallback={
            <View style={styles.loading}>
              <ActivityIndicator color={color.brandInk} />
            </View>
          }
        >
          <Lab
            onChrome={setChrome}
            onComplete={async (result) => {
              setFinished(true);
              const award = await completeLab(labId, result, { title, cls, subject, chapterNo });
              toResult(award);
            }}
          />
        </Suspense>
      ) : (
        <View style={styles.missing}>
          <Text style={styles.missingText}>
            This bench has not been built yet. Class 11 Physics · Work, Energy and Power is live.
          </Text>
        </View>
      )}

      {/* The bar carries the only way out of a lab, so hiding it has to put one
          back. Small, dark and in the corner the bench keeps clear. */}
      {chrome ? null : (
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={12}
          style={({ pressed }) => [styles.exit, pressed && { opacity: 0.6 }]}
        >
          <Text style={styles.exitGlyph}>←</Text>
        </Pressable>
      )}

      {/* Floating Ask AI Button / Voice Overlay */}
      {hasVoice && isOnline && (
        activeVoice ? (
          <VoiceOverlay labId={labId} onClose={() => setActiveVoice(false)} />
        ) : (
          <Pressable
            onPress={() => setActiveVoice(true)}
            style={({ pressed }) => [
              styles.fabAi,
              { bottom: insets.bottom + GUTTER },
              pressed && { transform: [{ translateY: 3 }], borderBottomWidth: 1 },
            ]}
          >
            <Text style={styles.fabAiText}>✨ Ask AI</Text>
          </Pressable>
        )
      )}
    </Page>
  );
}

/** The gap a floating control keeps from the screen edge, and from the inset. */
const GUTTER = 24;

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: {
    fontFamily: font.display,
    fontSize: 15,
    color: color.inkStrong,
  },
  status: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: color.greenSoft,
    borderWidth: 2,
    borderColor: color.greenEdge,
  },
  statusDone: { backgroundColor: '#FDF3DD', borderColor: '#F3D48F' },
  statusLabel: {
    fontFamily: font.displayBold,
    fontSize: 12,
    color: color.greenDeep,
  },
  exit: {
    position: 'absolute',
    top: 12,
    left: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16,21,29,0.55)',
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  exitGlyph: { fontSize: 15, color: 'rgba(255,253,248,0.9)', marginTop: -1 },

  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  missing: { padding: 30 },
  missingText: {
    fontFamily: font.regular,
    fontSize: 13,
    lineHeight: 21,
    color: color.inkMuted,
  },

  // Purple is the design system's prompt colour, and depth here is the same
  // hard bottom edge every other pressable block in the app carries.
  fabAi: {
    position: 'absolute',
    // `bottom` is applied at the call site — it depends on the safe-area inset.
    right: GUTTER,
    backgroundColor: color.purple,
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    ...bevel(color.purpleDeep),
    ...shadow.raised,
  },
  fabAiText: {
    fontFamily: font.displayBold,
    fontSize: 14,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
