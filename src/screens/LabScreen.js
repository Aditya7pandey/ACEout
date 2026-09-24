import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { color, font } from '../theme';
import { Page, BackButton, Rule } from '../components/ui';
import { getChapters } from '../data/catalog';
import InclineLab from '../labs/incline/InclineLab';
import IndicatorsLab from '../labs/indicators/IndicatorsLab';
import PhDeterminationLab from '../labs/ph_determination/PhDeterminationLab';
import GravityLaunchLab from '../labs/gravity_launch/GravityLaunchLab';
import PlantPhysiologyLab from '../labs/plant_physiology/PlantPhysiologyLab';
import RayOpticsEyeLab from '../labs/ray_optics_eye/RayOpticsEyeLab';
import { useAppState } from '../store/AppState';

const REGISTRY = {
  'incline-work-energy': InclineLab,
  'acid-base-indicators': IndicatorsLab,
  'ph-determination': PhDeterminationLab,
  'gravity-launch': GravityLaunchLab,
  'plant-physiology': PlantPhysiologyLab,
  'eye-defects': RayOpticsEyeLab,
};

export default function LabScreen({ navigation, route }) {
  const { labId, title, cls, subject, chapterNo } = route.params;
  const Lab = REGISTRY[labId];
  const { completeLab } = useAppState();
  const [finished, setFinished] = useState(false);

  // A bench can ask for the whole screen. The bar above it is chrome the
  // simulation does not need once the student is inside it, so labs call
  // `onChrome(false)` when they open and `onChrome(true)` when they come back
  // out. A lab that never calls it keeps the bar, which is the old behaviour.
  const [chrome, setChrome] = useState(true);

  /**
   * Back to the chapter's lab list, which is where the student came from and
   * where the bench they just finished now reads as done.
   *
   * The params are rebuilt and passed every time rather than left to the route
   * that is already on the stack: `popTo` without params does not preserve the
   * old ones, it *replaces* them with undefined, and `LabsScreen` destructures
   * `route.params` on its first line. Pop back to `Labs` when it is on the
   * stack; arriving from Search it is not, so replace this screen with it.
   */
  const toLabs = useCallback(() => {
    const chapter = getChapters(cls, subject).find((c) => c.no === chapterNo) || {
      no: chapterNo,
      title: `Chapter ${chapterNo}`,
      labs: 0,
    };
    const params = { cls, subject, chapterNo, chapter };

    const onStack = navigation.getState()?.routes?.some((r) => r.name === 'Labs');
    if (onStack && navigation.popTo) {
      navigation.popTo('Labs', params);
      return;
    }
    navigation.replace('Labs', params);
  }, [navigation, cls, subject, chapterNo]);

  return (
    <Page background={color.sand}>
      {chrome ? (
        <>
          <View style={styles.bar}>
            <BackButton onPress={() => navigation.goBack()} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.title} numberOfLines={1}>
                {title}
              </Text>
              <Text style={styles.sub}>{finished ? 'Complete' : 'Live simulation'}</Text>
            </View>
            <View style={styles.status}>
              <View style={[styles.pulse, finished && { backgroundColor: color.brass }]} />
              <Text style={[styles.statusLabel, finished && { color: color.brass }]}>
                {finished ? 'LOGGED' : 'RUNNING'}
              </Text>
            </View>
          </View>
          <Rule />
        </>
      ) : null}

      {Lab ? (
        <Lab
          onChrome={setChrome}
          onComplete={(result) => {
            setFinished(true);
            completeLab(labId, result, { title, cls, subject, chapterNo });
            toLabs();
          }}
        />
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
    </Page>
  );
}

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
    fontFamily: font.bold,
    fontSize: 13.5,
    letterSpacing: -0.14,
    color: color.inkStrong,
  },
  sub: {
    fontFamily: font.bold,
    fontSize: 9.5,
    letterSpacing: 1.9,
    textTransform: 'uppercase',
    color: color.inkMuted,
    marginTop: 2,
  },
  status: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  pulse: { width: 5, height: 5, borderRadius: 3, backgroundColor: color.green },
  statusLabel: {
    fontFamily: font.bold,
    fontSize: 9.5,
    letterSpacing: 1.7,
    color: color.green,
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

  missing: { padding: 30 },
  missingText: {
    fontFamily: font.regular,
    fontSize: 13,
    lineHeight: 21,
    color: color.inkMuted,
  },
});
