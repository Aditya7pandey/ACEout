import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { color, font } from '../theme';
import { Page, BackButton, Rule } from '../components/ui';
import InclineLab from '../labs/incline/InclineLab';
import IndicatorsLab from '../labs/indicators/IndicatorsLab';
import PhDeterminationLab from '../labs/ph_determination/PhDeterminationLab';
import GravityLaunchLab from '../labs/gravity_launch/GravityLaunchLab';
import PlantPhysiologyLab from '../labs/plant_physiology/PlantPhysiologyLab';
import { useAppState } from '../store/AppState';

const REGISTRY = {
  'incline-work-energy': InclineLab,
  'acid-base-indicators': IndicatorsLab,
  'ph-determination': PhDeterminationLab,
  'gravity-launch': GravityLaunchLab,
  'plant-physiology': PlantPhysiologyLab,
};

export default function LabScreen({ navigation, route }) {
  const { labId, title, cls, subject, chapterNo } = route.params;
  const Lab = REGISTRY[labId];
  const { completeLab } = useAppState();
  const [finished, setFinished] = useState(false);

  return (
    <Page background={color.sand}>
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

      {Lab ? (
        <Lab
          onComplete={(result) => {
            setFinished(true);
            completeLab(labId, result, { title, cls, subject, chapterNo });
          }}
        />
      ) : (
        <View style={styles.missing}>
          <Text style={styles.missingText}>
            This bench has not been built yet. Class 11 Physics · Work, Energy and Power is live.
          </Text>
        </View>
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
  missing: { padding: 30 },
  missingText: {
    fontFamily: font.regular,
    fontSize: 13,
    lineHeight: 21,
    color: color.inkMuted,
  },
});
