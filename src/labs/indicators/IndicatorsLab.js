import React, { useState, useMemo } from 'react';
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

export default function IndicatorsLab({ onComplete }) {
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
          <Eyebrow tone={color.brass}>Before you begin · NCERT Class 11</Eyebrow>
          <Text style={type.title}>Study of Acid-Base Indicators</Text>
          <Text style={[type.body, { lineHeight: 21 }]}>
            Explore the sharp color changes and transition intervals of Phenolphthalein,
            Methyl Orange, and Litmus solutions across acidic, neutral, and alkaline media.
            You will map indicator dissociation equilibria and identify unknown solutions.
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
              ? 'Five systematic steps: test Phenolphthalein, Methyl Orange, and Litmus across standard solutions, then deduce an unknown mystery sample.'
              : 'Continuous pH workbench with live indicator color spectrum, ionization percentage curves, and Henderson-Hasselbalch math.'}
          </Text>
        </View>

        {mode === 'guided' ? (
          <View style={{ gap: 12 }}>
            <Eyebrow>Faults in the apparatus</Eyebrow>
            <Text style={[type.bodySoft, { lineHeight: 19 }]}>
              Simulate real-world lab anomalies such as degraded indicator stock or yellow lighting.
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

        <Annotation label="Color Transformation Principle">
          Indicators operate across a transition band of approximately 2 pH units centered
          around their pK_In (pH = pK_In ± 1).
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
