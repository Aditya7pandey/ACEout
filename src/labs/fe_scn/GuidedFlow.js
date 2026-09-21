import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { color, font, type, radius } from '../../theme';
import {
  Eyebrow,
  GoldButton,
  GhostButton,
  Panel,
  Annotation,
  Tag,
} from '../../components/ui';
import ColorComparator from '../../instruments/ColorComparator';
import ReadingInput from '../../measure/ReadingInput';
import DataTable from '../../measure/DataTable';
import GraphPlot from '../../measure/GraphPlot';
import { INSTRUMENTS, formatSigFigs, checkDerived } from '../../measure/leastCount';
import { STEPS } from './steps';
import {
  calculateEquilibrium,
  getSolutionColor,
  EPSILON_B,
  KC_TRUE,
} from './chemistry';
import { apparentAbsorbance } from './errors';
import FeScnCanvas from './FeScnCanvas';
import { useLabLayout } from '../useLabLayout';

export default function GuidedFlow({
  profile,
  errorConfig,
  onFinish,
}) {
  // Chemistry stages use a vertical field of view, so the apparatus is sized by
  // the stage's height alone. Held wide there is less height to spend, so the
  // stage takes a larger share of it.
  const layout = useLabLayout({ portraitStage: 300, fraction: 0.7, maxStage: 320 });
  const [stepIdx, setStepIdx] = useState(0);
  const [userReadings, setUserReadings] = useState({
    blank: '',
    tube1: '',
    tube2: '',
    tube3: '',
    tube4: '',
    calcSlope: '',
    calcKc: '',
  });

  const [committed, setCommitted] = useState({});
  const [selectedTube, setSelectedTube] = useState(0);

  const step = STEPS[stepIdx];

  // Benchmark equilibrium mixtures for the 4 test tubes
  const tubesData = useMemo(() => {
    // Master: 5 mL of 0.002M Fe + 5 mL of 0.002M SCN diluted to 50 mL
    // Each 10 mL sample contains:
    // Fe moles = 0.002 * 0.005 * (10/50) = 2.0e-6 mol in 0.010 L -> 0.00020 M
    // SCN moles = 0.002 * 0.005 * (10/50) = 2.0e-6 mol in 0.010 L -> 0.00020 M

    // Tube 1: Control (no additions)
    const t1 = calculateEquilibrium({
      feMoles: 2.0e-6,
      scnMoles: 2.0e-6,
      volumeL: 0.01,
    });

    // Tube 2: + 4 drops of 0.1 M FeCl3 (4 * 0.05 mL = 0.20 mL -> 2.0e-5 mol Fe added)
    const t2 = calculateEquilibrium({
      feMoles: 2.0e-6 + 2.0e-5,
      scnMoles: 2.0e-6,
      volumeL: 0.0102,
    });

    // Tube 3: + 4 drops of 0.1 M KSCN (2.0e-5 mol SCN added)
    const t3 = calculateEquilibrium({
      feMoles: 2.0e-6,
      scnMoles: 2.0e-6 + 2.0e-5,
      volumeL: 0.0102,
    });

    // Tube 4: + 4 drops of 0.1 M Oxalic Acid (2.0e-5 mol oxalic added)
    const t4 = calculateEquilibrium({
      feMoles: 2.0e-6,
      scnMoles: 2.0e-6,
      oxalicMoles: 2.0e-5,
      volumeL: 0.0102,
    });

    return [
      { id: 0, name: 'Tube 1', tag: 'Control', ...t1, volumeMl: 10.0 },
      { id: 1, name: 'Tube 2', tag: '+FeCl₃', ...t2, volumeMl: 10.2 },
      { id: 2, name: 'Tube 3', tag: '+KSCN', ...t3, volumeMl: 10.2 },
      { id: 3, name: 'Tube 4', tag: '+Oxalic', ...t4, volumeMl: 10.2 },
    ];
  }, []);

  const activeTube = tubesData[selectedTube] || tubesData[0];
  const apparentA = apparentAbsorbance(activeTube.absorbance, profile, errorConfig);

  const handleNext = () => {
    if (stepIdx < STEPS.length - 1) {
      const next = stepIdx + 1;
      setStepIdx(next);
      if (next === 2) setSelectedTube(0);
      if (next === 3) setSelectedTube(1);
      if (next === 4) setSelectedTube(2);
      if (next === 5) setSelectedTube(3);
    }
  };

  const handlePrev = () => {
    if (stepIdx > 0) setStepIdx(stepIdx - 1);
  };

  const finishLab = () => {
    if (onFinish) {
      onFinish({
        data: userReadings,
        analysis: {
          tubes: tubesData,
          Kc: KC_TRUE,
        },
        sf: 3,
      });
    }
  };

  // Graph points derived from student readings
  const graphPoints = useMemo(() => {
    const pts = [];
    if (committed.tube1 && userReadings.tube1) {
      pts.push({
        x: tubesData[0].complexConc * 1e4, // 10^-4 M
        y: Number(userReadings.tube1),
        label: 'T1',
      });
    }
    if (committed.tube2 && userReadings.tube2) {
      pts.push({
        x: tubesData[1].complexConc * 1e4,
        y: Number(userReadings.tube2),
        label: 'T2',
      });
    }
    if (committed.tube3 && userReadings.tube3) {
      pts.push({
        x: tubesData[2].complexConc * 1e4,
        y: Number(userReadings.tube3),
        label: 'T3',
      });
    }
    if (committed.tube4 && userReadings.tube4) {
      pts.push({
        x: tubesData[3].complexConc * 1e4,
        y: Number(userReadings.tube4),
        label: 'T4',
      });
    }
    return pts;
  }, [committed, userReadings, tubesData]);

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[styles.scroll, layout.contentStyle]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header bar with step tracker */}
      <View style={styles.stepHeader}>
        <Eyebrow tone={color.brass}>Step {stepIdx + 1} of {STEPS.length}</Eyebrow>
        <Text style={type.heading}>{step.title}</Text>
      </View>

      {/* Visual Canvas */}
      <FeScnCanvas
        height={layout.stageHeight}
        tubes={tubesData}
        selectedTubeId={selectedTube}
        onSelectTube={(idx) => setSelectedTube(idx)}
        shiftDirection={
          selectedTube === 1 || selectedTube === 2
            ? 'FORWARD'
            : selectedTube === 3
            ? 'REVERSE'
            : 'EQUILIBRIUM'
        }
      />

      {/* Main step instruction & notes */}
      {step.instruction ? (
        <Text style={[type.body, { lineHeight: 21 }]}>{step.instruction}</Text>
      ) : null}

      {/* Step Specific Workflows */}
      {stepIdx === 0 && (
        <Panel style={{ gap: 10 }}>
          <Eyebrow>Reaction Stoichiometry</Eyebrow>
          <Text style={[type.body, { fontFamily: font.semibold }]}>
            Fe³⁺(aq) + SCN⁻(aq) ⇌ [Fe(SCN)]²⁺(aq)
          </Text>
          <Text style={type.bodySoft}>
            Light straw yellow Fe³⁺ ions react reversibly with thiocyanate SCN⁻ to form the
            deeply colored monothiocyanatoiron(III) complex.
          </Text>
        </Panel>
      )}

      {stepIdx >= 1 && stepIdx <= 5 && (
        <View style={{ gap: 14 }}>
          <ColorComparator
            sampleColor={getSolutionColor(activeTube.complexConc)}
            apparentAbsorbance={apparentA}
            trueAbsorbance={activeTube.absorbance}
            label={`Colorimeter Chamber: ${activeTube.name} (${activeTube.tag})`}
          />

          {stepIdx === 1 && (
            <ReadingInput
              instrument={INSTRUMENTS.colorimeter}
              label="Blank Absorbance Reading"
              value={userReadings.blank}
              onChange={(t) => setUserReadings((r) => ({ ...r, blank: t }))}
              onCommit={() => setCommitted((c) => ({ ...c, blank: true }))}
              committed={committed.blank}
              hint="Distilled water should read exactly 0.00 A."
            />
          )}

          {stepIdx === 2 && (
            <ReadingInput
              instrument={INSTRUMENTS.colorimeter}
              label="Tube 1 (Control) Absorbance (A)"
              value={userReadings.tube1}
              onChange={(t) => setUserReadings((r) => ({ ...r, tube1: t }))}
              onCommit={() => setCommitted((c) => ({ ...c, tube1: true }))}
              committed={committed.tube1}
              hint="Read needle position on the analog dial to 2 decimal places."
            />
          )}

          {stepIdx === 3 && (
            <ReadingInput
              instrument={INSTRUMENTS.colorimeter}
              label="Tube 2 (+FeCl₃) Absorbance (A)"
              value={userReadings.tube2}
              onChange={(t) => setUserReadings((r) => ({ ...r, tube2: t }))}
              onCommit={() => setCommitted((c) => ({ ...c, tube2: true }))}
              committed={committed.tube2}
              hint="Absorbance increases as equilibrium shifts forward."
            />
          )}

          {stepIdx === 4 && (
            <ReadingInput
              instrument={INSTRUMENTS.colorimeter}
              label="Tube 3 (+KSCN) Absorbance (A)"
              value={userReadings.tube3}
              onChange={(t) => setUserReadings((r) => ({ ...r, tube3: t }))}
              onCommit={() => setCommitted((c) => ({ ...c, tube3: true }))}
              committed={committed.tube3}
              hint="Absorbance increases with added SCN⁻."
            />
          )}

          {stepIdx === 5 && (
            <ReadingInput
              instrument={INSTRUMENTS.colorimeter}
              label="Tube 4 (+Oxalic Acid) Absorbance (A)"
              value={userReadings.tube4}
              onChange={(t) => setUserReadings((r) => ({ ...r, tube4: t }))}
              onCommit={() => setCommitted((c) => ({ ...c, tube4: true }))}
              committed={committed.tube4}
              hint="Oxalate removes Fe³⁺, shifting equilibrium in reverse and decreasing absorbance."
            />
          )}
        </View>
      )}

      {/* Observation Table */}
      {stepIdx >= 2 && stepIdx <= 6 && (
        <DataTable
          title="Equilibrium Perturbation Table"
          columns={[
            { key: 'tube', label: 'Tube', flex: 1.2 },
            { key: 'reagent', label: 'Stress / Reagent', flex: 2 },
            { key: 'shift', label: 'Shift Direction', flex: 1.5 },
            { key: 'abs', label: 'Absorbance (A)', flex: 1.5, align: 'right' },
          ]}
          rows={[
            {
              tube: 'Tube 1',
              reagent: 'Control',
              shift: 'Equilibrium',
              abs: userReadings.tube1 ? `${userReadings.tube1} A` : '—',
            },
            {
              tube: 'Tube 2',
              reagent: '+FeCl₃ (↑ Fe³⁺)',
              shift: 'Forward (→)',
              abs: userReadings.tube2 ? `${userReadings.tube2} A` : '—',
            },
            {
              tube: 'Tube 3',
              reagent: '+KSCN (↑ SCN⁻)',
              shift: 'Forward (→)',
              abs: userReadings.tube3 ? `${userReadings.tube3} A` : '—',
            },
            {
              tube: 'Tube 4',
              reagent: '+Oxalic (↓ Fe³⁺)',
              shift: 'Reverse (←)',
              abs: userReadings.tube4 ? `${userReadings.tube4} A` : '—',
            },
          ]}
        />
      )}

      {stepIdx === 6 && (
        <View style={{ gap: 14 }}>
          <GraphPlot
            points={graphPoints}
            xLabel="[Fe(SCN)²⁺]"
            yLabel="Absorbance"
            xUnit="×10⁻⁴ M"
            yUnit="A"
            slopeLabel="ε · b (slope)"
            defaultThroughOrigin={true}
          />
        </View>
      )}

      {stepIdx === 7 && (
        <Panel style={{ gap: 14 }}>
          <Eyebrow tone={color.green}>Lab Report Summary</Eyebrow>
          <Text style={type.title}>Le Chatelier’s Principle Verified</Text>
          <Text style={[type.body, { lineHeight: 21 }]}>
            By disturbing the initial equilibrium state through concentration variations of Fe³⁺,
            SCN⁻, and complexing agents, the chemical system responded in accordance with Le
            Chatelier’s principle to re-establish dynamic equilibrium:
          </Text>
          <View style={styles.summaryPoints}>
            <Text style={styles.summaryBullet}>
              • Adding FeCl₃ increased [Fe³⁺], driving the forward reaction (deeper blood-red color).
            </Text>
            <Text style={styles.summaryBullet}>
              • Adding KSCN increased [SCN⁻], driving the forward reaction (absorbance increased).
            </Text>
            <Text style={styles.summaryBullet}>
              • Adding Oxalic acid removed Fe³⁺ via formation of [Fe(C₂O₄)₃]³⁻, forcing a reverse shift.
            </Text>
          </View>
        </Panel>
      )}

      {step.note ? <Annotation label="NCERT Lab Note">{step.note}</Annotation> : null}

      {/* Navigation Buttons */}
      <View style={styles.actions}>
        {stepIdx > 0 && <GhostButton label="Previous" onPress={handlePrev} />}
        {stepIdx < STEPS.length - 1 ? (
          <GoldButton label="Next step" onPress={handleNext} />
        ) : (
          <GoldButton label="Finish Lab & Save" onPress={finishLab} />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: 20,
    paddingBottom: 40,
    gap: 18,
  },
  stepHeader: {
    gap: 6,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  summaryPoints: {
    gap: 8,
    backgroundColor: 'rgba(47,142,108,0.06)',
    padding: 12,
    borderRadius: radius.chip,
  },
  summaryBullet: {
    fontFamily: font.medium,
    fontSize: 12.5,
    lineHeight: 19,
    color: color.inkSoft,
  },
});
