import React, { useState, useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { color, font, type, radius } from '../../theme';
import { Eyebrow, GoldButton, Annotation, Segmented, withAlpha } from '../../components/ui';
import GuidedFlow from './GuidedFlow';
import FreePlay from './FreePlay';
import OrientationGate from './OrientationGate';
import { makeSimRef } from './LaunchScene';
import { DEFAULT_PARAMS, MYSTERY_WORLDS } from './physics';
import { makeErrorProfile, defaultErrorConfig, ERROR_KINDS } from './errors';
import { lockPortrait } from '../../utils/orientation';

/**
 * Container for the horizontal-launch lab: picks the mode, decides which
 * faults the apparatus has today, seals a world for the last step, and
 * randomises the bench so the answers cannot be memorised between runs.
 */
export default function GravityLaunchLab({ onComplete }) {
  const [mode, setMode] = useState('guided');
  const [started, setStarted] = useState(false);
  const [oriented, setOriented] = useState(false);
  const [errorConfig, setErrorConfig] = useState(defaultErrorConfig());
  const [seed] = useState(() => Math.random());

  const profile = useMemo(() => makeErrorProfile(seed), [seed]);

  // A fresh bench every session. The deck height and the launcher's spring are
  // both unknown to the student, and both are quantities they will end up
  // measuring rather than being told.
  const [params, setParams] = useState(() => {
    const r = profile.rand;
    const mm = (x) => Math.round(x * 1000) / 1000; // land on a millimetre
    return {
      ...DEFAULT_PARAMS,
      heightM: mm(0.36 + r() * 0.08),
      // The spread is bounded so that even the longest flight — Pluto, with
      // the launcher scattering high — still lands on the metre of tape.
      speedMS: Math.round((0.58 + r() * 0.1) * 1000) / 1000,
      originM: mm(0.04 + r() * 0.05),
      massKg: Math.round((0.15 + r() * 0.15) * 1000) / 1000,
    };
  });

  // The sealed world of the final step, fixed for the session.
  const [mysteryKey] = useState(
    () => MYSTERY_WORLDS[Math.floor(profile.rand() * MYSTERY_WORLDS.length)]
  );

  const simRef = useRef(makeSimRef());

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
        <OrientationGate onDone={() => setOriented(true)} />
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
          <Eyebrow tone={color.space}>Before you begin</Eyebrow>
          <Text style={type.title}>
            A rover driven off a deck, and eleven different strengths of gravity
          </Text>
          <Text style={[type.body, { lineHeight: 21 }]}>
            The rover leaves the lip horizontally at a speed nobody will tell you, and falls under
            whatever gravity the world has. You will send it off the same deck on five worlds, read
            where it lands each time, and plot your own points. Out of that one graph comes the
            launch speed — measured without ever timing the launch — and then the surface gravity of
            a world you are told nothing about at all.
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
              ? 'Nine steps, each one checked before you move on. Misread the tape and it will say so. This is the mode that produces a report.'
              : 'Every parameter live, every number on show. Drag gravity anywhere between a tenth of the Moon and past Jupiter, keep the last four flight paths on the bench, and find the settings where the rover clears the floor entirely.'}
          </Text>
        </View>

        {mode === 'guided' ? (
          <View style={{ gap: 12 }}>
            <Eyebrow>Faults in the apparatus</Eyebrow>
            <Text style={[type.bodySoft, { lineHeight: 19 }]}>
              Switch these on and the instruments will lie to you in the specific ways real ones do.
              You will not be told when it happens — you have to catch it.
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
          The floor tape resolves 0.1 cm and the stopwatch 0.01 s. Quote a landing position to three
          decimals and the app will reject it, because no reading you can physically take justifies
          that digit. Derived answers are held to the significant figures your weakest measurement
          supports.
        </Annotation>

        <Annotation label="No atmosphere" tone={color.space}>
          Every world here is treated as a vacuum. That is honest for the Moon and close enough for
          Mars at these speeds; it is badly wrong for Venus, whose air is ninety times denser than
          Earth's. The bench says so rather than quietly pretending otherwise.
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
      mysteryKey={mysteryKey}
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
  faultBlurb: { fontFamily: font.regular, fontSize: 12, lineHeight: 18.5, color: color.inkMuted },
  switch: {
    width: 40,
    height: 23,
    borderRadius: 12,
    backgroundColor: 'rgba(28,24,21,0.12)',
    padding: 2.5,
    justifyContent: 'center',
  },
  switchOn: { backgroundColor: color.goldBottom },
  knob: { width: 18, height: 18, borderRadius: 9, backgroundColor: color.paper },
  knobOn: { alignSelf: 'flex-end' },
});
