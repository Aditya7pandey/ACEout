import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { color, font, type, radius } from '../../theme';
import {
  Eyebrow,
  GoldButton,
  Annotation,
  Segmented,
} from '../../components/ui';
import GuidedFlow from './GuidedFlow';
import FreePlay from './FreePlay';
import { makeErrorProfile, defaultErrorConfig, ERROR_KINDS } from './errors';

export default function PlantPhysiologyLab({ onComplete }) {
  const [mode, setMode] = useState('guided');
  const [started, setStarted] = useState(false);
  const [errorConfig, setErrorConfig] = useState(defaultErrorConfig());
  const [seed] = useState(() => Math.random());

  const profile = useMemo(() => makeErrorProfile(seed), [seed]);

  if (!started) {
    return (
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.setup}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ gap: 10 }}>
          <Eyebrow tone={color.biology}>Before you begin · NCERT Class 11 Biology</Eyebrow>
          <Text style={type.title}>
            Plant Physiology Laboratory
          </Text>
          <Text style={[type.body, { lineHeight: 21 }]}>
            Investigate key plant physiological mechanisms across 3 core NCERT Class 11 practicals:
            osmotic plasmolysis/deplasmolysis in epidermal peels (*Rhoeo*), comparative stomatal
            density and Stomatal Index calculation (*Dicot vs Monocot*), and differential
            transpiration rates using moisture-sensitive Cobalt Chloride paper.
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
              ? 'Sequential experimental protocols for Plasmolysis, Stomatal Index calibration, and Cobalt Chloride Time-Lapse analysis with validated steps and NCERT checkpoints.'
              : 'Interactive 3D sandbox with live chemical application, FOV reticle grid toggles, time-lapse speed controls, and cellular shader telemetry.'}
          </Text>
        </View>

        {mode === 'guided' ? (
          <View style={{ gap: 12 }}>
            <Eyebrow>Faults in the apparatus & specimen</Eyebrow>
            <Text style={[type.bodySoft, { lineHeight: 19 }]}>
              Switch these on to introduce real experimental anomalies like coverslip air bubble
              entrapment, Safranin stain precipitation, or elevated lab humidity.
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

        <Annotation label="Stomatal Index & Osmotic Equations">
          Stomatal Index: I = [S / (S + E)] × 100. Water Potential: Ψw = Ψs + Ψp. Cobalt Chloride
          hydration: Anhydrous Blue CoCl₂ + 6H₂O ⇄ Pink CoCl₂·6H₂O.
        </Annotation>

        <GoldButton
          label={mode === 'guided' ? 'Start the experiments' : 'Open the sandbox'}
          onPress={() => setStarted(true)}
        />
      </ScrollView>
    );
  }

  return mode === 'guided' ? (
    <GuidedFlow errorConfig={errorConfig} profile={profile} onComplete={onComplete} />
  ) : (
    <FreePlay errorConfig={errorConfig} profile={profile} />
  );
}

const styles = StyleSheet.create({
  setup: {
    padding: 24,
    gap: 22,
    paddingBottom: 40,
  },
  fault: {
    padding: 14,
    borderRadius: radius.tile,
    backgroundColor: '#FFFDF8',
    borderWidth: 1,
    borderColor: 'rgba(28,24,21,0.10)',
    gap: 6,
  },
  faultOn: {
    borderColor: color.brass,
    backgroundColor: 'rgba(150,102,47,0.06)',
  },
  faultHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  faultLabel: {
    fontFamily: font.semibold,
    fontSize: 13.5,
    color: color.inkStrong,
  },
  faultBlurb: {
    fontFamily: font.regular,
    fontSize: 12,
    lineHeight: 18,
    color: color.inkMuted,
  },
  switch: {
    width: 38,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(28,24,21,0.15)',
    padding: 2,
    justifyContent: 'center',
  },
  switchOn: {
    backgroundColor: color.brass,
  },
  knob: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFFDF8',
  },
  knobOn: {
    alignSelf: 'flex-end',
  },
});
