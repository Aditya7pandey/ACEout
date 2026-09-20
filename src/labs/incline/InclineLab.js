import React, { useState, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { color, font, type, radius } from '../../theme';
import {
  Eyebrow,
  GoldButton,
  Panel,
  Annotation,
  Segmented,
  withAlpha,
} from '../../components/ui';
import GuidedFlow from './GuidedFlow';
import FreePlay from './FreePlay';
import { makeSimRef } from './InclineScene';
import { DEFAULT_PARAMS } from './physics';
import { makeErrorProfile, defaultErrorConfig, ERROR_KINDS } from './errors';

/**
 * Container for the Class 11 work–energy lab: picks the mode, decides which
 * faults the apparatus has today, and randomises the bench so the answers
 * cannot be memorised between runs.
 */
export default function InclineLab({ onComplete }) {
  const [mode, setMode] = useState('guided');
  const [started, setStarted] = useState(false);
  const [errorConfig, setErrorConfig] = useState(defaultErrorConfig());
  const [seed] = useState(() => Math.random());

  const profile = useMemo(() => makeErrorProfile(seed), [seed]);

  // A fresh bench every session: the student has to measure, not remember.
  const [params, setParams] = useState(() => {
    const r = profile.rand;
    return {
      ...DEFAULT_PARAMS,
      thetaDeg: Math.round((19 + r() * 12) * 10) / 10,
      massKg: Math.round((0.32 + r() * 0.46) * 1000) / 1000,
    };
  });

  const simRef = useRef(makeSimRef());

  if (!started) {
    return (
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.setup}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ gap: 10 }}>
          <Eyebrow tone={color.brass}>Before you begin</Eyebrow>
          <Text style={type.title}>
            A block, a ramp, and the claim that work becomes kinetic energy
          </Text>
          <Text style={[type.body, { lineHeight: 21 }]}>
            You will release a block from rest, time it over five different track lengths, and
            plot your own points. Out of that graph comes the acceleration, the coefficient of
            friction of a surface you never touch, and a test of the work–energy theorem. Nothing
            here hands you a number — every value in your report will trace back to a graduation
            you read.
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
              ? 'Eight steps, each one checked before you move on. Misread a scale and it will say so. This is the mode that produces a report.'
              : 'Every parameter live, every number on show. Change the angle, the mass, the surface, even gravity — and find the settings where the block refuses to move at all.'}
          </Text>
        </View>

        {mode === 'guided' ? (
          <View style={{ gap: 12 }}>
            <Eyebrow>Faults in the apparatus</Eyebrow>
            <Text style={[type.bodySoft, { lineHeight: 19 }]}>
              Switch these on and the instruments will lie to you in the specific ways real ones
              do. You will not be told when it happens — you have to catch it.
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
                    <Text style={[styles.faultLabel, on && { color: color.brass }]}>{k.label}</Text>
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

        <Annotation label="Least count is enforced">
          A metre scale resolves 0.1 cm and a stopwatch 0.01 s. Quote a length to three decimals
          and the app will reject it, because no reading you can physically take justifies that
          digit. Derived answers are held to the significant figures your weakest measurement
          supports.
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
      params={params}
      setParams={setParams}
      simRef={simRef}
      profile={profile}
      errorConfig={errorConfig}
      onFinish={onComplete}
    />
  ) : (
    <FreePlay params={params} setParams={setParams} simRef={simRef} />
  );
}

const styles = StyleSheet.create({
  setup: { padding: 20, paddingBottom: 40, gap: 26 },
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
