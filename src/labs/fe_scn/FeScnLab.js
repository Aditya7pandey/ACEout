import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { color, font, type, radius } from '../../theme';
import {
  Eyebrow,
  GoldButton,
  Annotation,
  Segmented,
  withAlpha,
} from '../../components/ui';
import GuidedFlow from './GuidedFlow';
import FreePlay from './FreePlay';
import { makeErrorProfile, defaultErrorConfig, ERROR_KINDS } from './errors';
import OrientationGate from '../../components/OrientationGate';
import { lockPortrait } from '../../utils/orientation';

export default function FeScnLab({ onComplete }) {
  const [mode, setMode] = useState('guided');
  const [started, setStarted] = useState(false);
  const [oriented, setOriented] = useState(false);
  const [errorConfig, setErrorConfig] = useState(defaultErrorConfig());
  const [seed] = useState(() => Math.random());

  const profile = useMemo(() => makeErrorProfile(seed), [seed]);

  // Whatever the student chose in the gate, the phone goes back upright when
  // they leave the bench — the rest of the app is portrait.
  useEffect(() => () => {
    lockPortrait();
  }, []);

  if (!oriented) {
    return (
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <OrientationGate
          onDone={() => setOriented(true)}
          tone={color.chemistry}
          title={'A rack of five test tubes — turn the screen'}
          body={
            'The whole point of this bench is comparing five tubes against each other, and five tubes are a wide thing to look at. Upright they are packed shoulder to shoulder with the telemetry bar across them; held wide you can tell the colours apart.'
          }
        />
      </ScrollView>
    );
  }

  if (!started) {
    return (
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.setup}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ gap: 10 }}>
          <Eyebrow tone={color.brass}>Before you begin · NCERT Class 11</Eyebrow>
          <Text style={type.title}>
            Effect of Concentration on Chemical Equilibrium (Fe³⁺ + SCN⁻)
          </Text>
          <Text style={[type.body, { lineHeight: 21 }]}>
            In this investigation, you will explore the dynamic equilibrium between iron(III)
            ions (Fe³⁺) and thiocyanate ions (SCN⁻) to form the blood-red [Fe(SCN)]²⁺ complex.
            By perturbing concentrations of reactants and complexing agents, you will measure
            optical absorbance and verify Le Chatelier’s principle.
          </Text>
        </View>

        <View style={{ gap: 12 }}>
          <Eyebrow>How do you want to run it</Eyebrow>
          <Segmented
            value={mode}
            onChange={setMode}
            options={[
              { value: 'guided', label: 'Guided' },
              { value: 'free', label: 'Free play' },
            ]}
          />
          <Text style={[type.bodySoft, { lineHeight: 19 }]}>
            {mode === 'guided'
              ? 'Seven steps with colorimeter calibration, test tube additions, reading absorbance, and graph plotting.'
              : 'Interactive chemical bench with free reagent droppers, live optical density, and dynamic equilibrium response.'}
          </Text>
        </View>

        {mode === 'guided' ? (
          <View style={{ gap: 12 }}>
            <Eyebrow>Faults in the apparatus</Eyebrow>
            <Text style={[type.bodySoft, { lineHeight: 19 }]}>
              Switch these on and the optical bench will introduce real laboratory systematic
              errors you have to account for.
            </Text>
            {Object.values(ERROR_KINDS).map((k) => {
              const on = errorConfig[k.key];
              return (
                <Pressable
                  key={k.key}
                  onPress={() => setErrorConfig((c) => ({ ...c, [k.key]: !c[k.key] }))}
                  style={[styles.fault, on && styles.faultOn]}
                >
                  <View style={styles.faultHead}>
                    <Text style={[styles.faultLabel, on && { color: color.brass }]}>
                      {k.label}
                    </Text>
                    <View style={[styles.switch, on && styles.switchOn]}>
                      <View style={[styles.knob, on && styles.knobOn]} />
                    </View>
                  </View>
                  <Text style={styles.faultBlurb}>{k.blurb}</Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        <Annotation label="Measurement Discipline">
          The colorimeter resolves 0.01 A. Every absorbance reading must be read from the dial
          scale and quoted to 2 decimal places.
        </Annotation>

        <GoldButton
          label={mode === 'guided' ? 'Start the procedure' : 'Open the bench'}
          onPress={() => setStarted(true)}
        />
      </ScrollView>
    );
  }

  return mode === 'guided' ? (
    <GuidedFlow
      profile={profile}
      errorConfig={errorConfig}
      onFinish={onComplete}
    />
  ) : (
    <FreePlay />
  );
}

const styles = StyleSheet.create({
  setup: { padding: 20, paddingBottom: 40, gap: 24 },
  fault: {
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: color.hairline,
    borderRadius: radius.tile,
    padding: 15,
    gap: 8,
    backgroundColor: color.paper,
  },
  faultOn: {
    borderColor: withAlpha(color.brass, 0.5),
    backgroundColor: withAlpha(color.brass, 0.05),
  },
  faultHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  faultLabel: { fontFamily: font.bold, fontSize: 14, color: color.inkStrong },
  faultBlurb: {
    fontFamily: font.regular,
    fontSize: 12,
    lineHeight: 18.5,
    color: color.inkMuted,
  },
  switch: {
    width: 40,
    height: 23,
    borderRadius: 12,
    backgroundColor: 'rgba(28,24,21,0.12)',
    padding: 2.5,
    justifyContent: 'center',
  },
  switchOn: { backgroundColor: color.goldBottom },
  knob: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: color.paper,
  },
  knobOn: { alignSelf: 'flex-end' },
});
