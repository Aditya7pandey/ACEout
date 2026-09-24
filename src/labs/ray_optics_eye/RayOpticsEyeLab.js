import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { color, font, type } from '../../theme';
import { Eyebrow, GoldButton, Annotation, Segmented } from '../../components/ui';
import OrientationGate from '../../components/OrientationGate';
import GuidedFlow from './GuidedFlow';
import FreePlay from './FreePlay';
import TheoryReport from './TheoryReport';
import { lockPortrait } from '../../utils/orientation';

/**
 * Class 12 Physics · Ray Optics and Optical Instruments — the human eye.
 *
 * ---------------------------------------------------------------------------
 * Where this bench departs from the contract in `src/labs/CLAUDE.md`, and why.
 * The contract asks every bench to say so out loud rather than drop a
 * requirement quietly, so:
 *
 * 1. **No error injection.** The instrument here is the student's own judgement
 *    of when a point stops being a point, and that judgement is already the
 *    dominant source of error — the accepting band is ±1.5 cm wide precisely
 *    because finding a blur boundary is a soft call. Adding a zero error on top
 *    would be injecting a second fault into a measurement that is already
 *    mostly about the first.
 *
 * 2. **No graph.** Three readings cannot carry a line of best fit. What the
 *    closing page does instead is derive both spectacle powers from the
 *    student's own numbers, which is the same discipline applied to the data
 *    this experiment actually produces.
 *
 * Least count is enforced: the bench resolves 0.1 cm, the slider steps in
 * 0.1 cm, and every derived power on the report is held to the significant
 * figures those readings justify.
 * ---------------------------------------------------------------------------
 */
export default function RayOpticsEyeLab({ onComplete, onChrome }) {
  const [oriented, setOriented] = useState(false);
  const [mode, setMode] = useState('guided');
  const [started, setStarted] = useState(false);
  const [rows, setRows] = useState(null);

  // The rest of the app is portrait; put the phone back as we found it.
  useEffect(() => () => {
    lockPortrait();
  }, []);

  // The bench itself takes the whole screen; the title bar is chrome it does
  // not need. The setup screen and the closing report are documents rather
  // than simulations, so they keep it. Restored on the way out either way.
  const onBench = started && !rows;
  useEffect(() => {
    onChrome?.(!onBench);
    return () => onChrome?.(true);
  }, [onBench, onChrome]);

  if (!oriented) {
    return (
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <OrientationGate
          onDone={() => setOriented(true)}
          tone={color.physics}
          title="This bench is a metre of optical axis"
          body={
            'The arrow travels almost a full metre before the retina loses it. Held wide, the ' +
            'whole bench — rule, arrow and eye — is on screen at once.'
          }
        />
      </ScrollView>
    );
  }

  if (rows) {
    return <TheoryReport rows={rows} onComplete={onComplete} />;
  }

  if (started) {
    return mode === 'guided' ? <GuidedFlow onFinish={setRows} /> : <FreePlay />;
  }

  const guided = mode === 'guided';

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={styles.setup}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ gap: 14 }}>
        <Eyebrow tone={color.physics}>Before you begin</Eyebrow>
        <Segmented
          value={mode}
          onChange={setMode}
          options={[
            { value: 'guided', label: 'Guided' },
            { value: 'free', label: 'Free play' },
          ]}
        />
      </View>

      {guided ? (
        <>
          <View style={{ gap: 10 }}>
            <Text style={type.title}>Three eyes, one arrow, three distances</Text>
            <Text style={styles.lede}>
              One eye that works, one that cannot see far, one that cannot see close. Same job at
              each: slide the arrow until the image on the retina turns into a smear, and read the
              distance off the rule. Three readings — enough to buy both spectacle prescriptions.
            </Text>
          </View>

          <Annotation label="How you know you have found it" tone={color.physics}>
            <Text style={styles.lede}>
              A millimetre before the limit the retina still gets a point; a millimetre after, a
              disc. The corner panel shows you what the retina is receiving — never the distance.
              That one is yours to read.
            </Text>
          </Annotation>

          {/* The contract asks that least count be enforced *and* visible. One
              line does that; the full argument belongs on the report page. */}
          <Text style={styles.footnote}>
            Bench least count 0.1 cm — readings to one decimal place, and the powers on the final
            page held to the figures those readings justify.
          </Text>
        </>
      ) : (
        <>
          <View style={{ gap: 10 }}>
            <Text style={type.title}>The same eye, with the eyeball unbolted</Text>
            <Text style={styles.lede}>
              Three things live at once: the arrow's distance, the depth of the eyeball, and the
              dioptres sitting in front of it. Nothing is marked, nothing is checked. Stretch the
              eyeball a millimetre and watch the far point walk in from infinity.
            </Text>
            <Text style={styles.lede}>A normal eye is 25.0 mm deep — the only number you get.</Text>
          </View>

          <Annotation label="Worth hunting for" tone={color.physics}>
            <Text style={styles.lede}>
              Every eyeball has exactly one power that restores the normal range. The acuity card
              tells you when you are on it. Find it for a long eye and a short one, and notice which
              sign each needs.
            </Text>
          </Annotation>
        </>
      )}

      <GoldButton
        label={guided ? 'Walk onto the bench' : 'Open the bench'}
        onPress={() => setStarted(true)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  setup: { padding: 20, paddingBottom: 40, gap: 24 },
  lede: { fontFamily: font.regular, fontSize: 15, lineHeight: 23, color: color.inkSoft },
  footnote: {
    fontFamily: font.regular,
    fontSize: 12.5,
    lineHeight: 19,
    color: color.inkMuted,
  },
});
