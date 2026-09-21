import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { color, font, type, radius } from '../../theme';
import {
  Eyebrow,
  GoldButton,
  GhostButton,
  Panel,
  Annotation,
  Tag,
} from '../../components/ui';
import DataTable from '../../measure/DataTable';
import GraphPlot from '../../measure/GraphPlot';
import { STEPS } from './steps';
import { INDICATORS, STANDARD_SOLUTIONS, getIndicatorColor, getIonizedFraction } from './chemistry';
import IndicatorsCanvas from './IndicatorsCanvas';
import { useLabLayout } from '../useLabLayout';

export default function GuidedFlow({ profile, errorConfig, onFinish }) {
  // Chemistry stages use a vertical field of view, so the apparatus is sized by
  // the stage's height alone. Held wide there is less height to spend, so the
  // stage takes a larger share of it.
  const layout = useLabLayout({ portraitStage: 300, fraction: 0.7, maxStage: 320 });
  const [stepIdx, setStepIdx] = useState(0);
  const [selectedSolution, setSelectedSolution] = useState(0);
  const [solutionDrops, setSolutionDrops] = useState({
    acid: 0,
    neutral: 0,
    base: 0,
    mystery: 0,
  });

  const [observations, setObservations] = useState({
    phen_acid: '',
    phen_neutral: '',
    phen_base: '',
    mo_acid: '',
    mo_neutral: '',
    mo_base: '',
    lit_acid: '',
    lit_neutral: '',
    lit_base: '',
    mystery_nature: '',
  });

  const step = STEPS[stepIdx];

  // Active indicator by step
  const activeIndicatorKey =
    stepIdx === 1
      ? 'phenolphthalein'
      : stepIdx === 2
      ? 'methylOrange'
      : stepIdx === 3
      ? 'litmus'
      : stepIdx === 4
      ? 'phenolphthalein'
      : 'phenolphthalein';

  // Solutions array for canvas
  const canvasSolutions = useMemo(() => {
    if (stepIdx === 4) {
      // Mystery solution
      return [
        { id: 'mystery', name: 'Solution X (Unknown)', ph: 12.5, drops: solutionDrops.mystery },
      ];
    }
    return [
      { id: 'acid', name: '0.1 M HCl (Acid)', ph: 1.0, drops: solutionDrops.acid },
      { id: 'neutral', name: 'Water (Neutral)', ph: 7.0, drops: solutionDrops.neutral },
      { id: 'base', name: '0.1 M NaOH (Base)', ph: 13.0, drops: solutionDrops.base },
    ];
  }, [stepIdx, solutionDrops]);

  const addDrop = () => {
    const solKey = canvasSolutions[selectedSolution]?.id;
    if (solKey) {
      setSolutionDrops((d) => ({
        ...d,
        [solKey]: Math.min(6, (d[solKey] || 0) + 1),
      }));
    }
  };

  const handleNext = () => {
    if (stepIdx < STEPS.length - 1) {
      setStepIdx((s) => s + 1);
      setSelectedSolution(0);
      setSolutionDrops({ acid: 0, neutral: 0, base: 0, mystery: 0 });
    }
  };

  const handlePrev = () => {
    if (stepIdx > 0) setStepIdx((s) => s - 1);
  };

  const finishLab = () => {
    if (onFinish) {
      onFinish({
        data: observations,
        analysis: {
          mysteryIdentity: 'Basic Solution (pH ~ 12.5)',
          indicatorsTested: ['Phenolphthalein', 'Methyl Orange', 'Litmus'],
        },
        sf: 2,
      });
    }
  };

  // Sigmoidal ionization curve points for GraphPlot
  const ionizationCurvePoints = useMemo(() => {
    const pts = [];
    for (let ph = 0; ph <= 14; ph += 1) {
      const frac = getIonizedFraction(ph, 9.3); // Phenolphthalein
      pts.push({
        x: ph,
        y: frac * 100,
        label: ph === 9 ? 'pK_In' : undefined,
      });
    }
    return pts;
  }, []);

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[styles.scroll, layout.contentStyle]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.stepHeader}>
        <Eyebrow tone={color.brass}>Step {stepIdx + 1} of {STEPS.length}</Eyebrow>
        <Text style={type.heading}>{step.title}</Text>
      </View>

      {/* Visual Beaker Canvas */}
      <IndicatorsCanvas
        height={layout.stageHeight}
        solutions={canvasSolutions}
        selectedIdx={selectedSolution}
        onSelectSolution={(idx) => setSelectedSolution(idx)}
        activeIndicator={activeIndicatorKey}
        onAddDrop={addDrop}
      />

      {step.instruction ? (
        <Text style={[type.body, { lineHeight: 21 }]}>{step.instruction}</Text>
      ) : null}

      {/* Step 1: Phenolphthalein recording */}
      {stepIdx === 1 && (
        <Panel style={{ gap: 12 }}>
          <Eyebrow>Record Observations for Phenolphthalein</Eyebrow>
          <View style={styles.obsGrid}>
            <View style={styles.obsItem}>
              <Text style={styles.obsLabel}>In 0.1 M HCl (Acid)</Text>
              <Text style={styles.obsValue}>Colorless (Clear)</Text>
            </View>
            <View style={styles.obsItem}>
              <Text style={styles.obsLabel}>In Water (Neutral)</Text>
              <Text style={styles.obsValue}>Colorless (Clear)</Text>
            </View>
            <View style={styles.obsItem}>
              <Text style={styles.obsLabel}>In 0.1 M NaOH (Base)</Text>
              <Text style={[styles.obsValue, { color: '#E61875', fontFamily: font.bold }]}>
                Vivid Pink / Magenta
              </Text>
            </View>
          </View>
        </Panel>
      )}

      {/* Step 2: Methyl Orange recording */}
      {stepIdx === 2 && (
        <Panel style={{ gap: 12 }}>
          <Eyebrow>Record Observations for Methyl Orange</Eyebrow>
          <View style={styles.obsGrid}>
            <View style={styles.obsItem}>
              <Text style={styles.obsLabel}>In 0.1 M HCl (Acid)</Text>
              <Text style={[styles.obsValue, { color: '#D92027', fontFamily: font.bold }]}>
                Pinkish Red
              </Text>
            </View>
            <View style={styles.obsItem}>
              <Text style={styles.obsLabel}>In Water (Neutral)</Text>
              <Text style={[styles.obsValue, { color: '#FFB800', fontFamily: font.bold }]}>
                Yellow
              </Text>
            </View>
            <View style={styles.obsItem}>
              <Text style={styles.obsLabel}>In 0.1 M NaOH (Base)</Text>
              <Text style={[styles.obsValue, { color: '#FFB800', fontFamily: font.bold }]}>
                Yellow
              </Text>
            </View>
          </View>
        </Panel>
      )}

      {/* Step 3: Litmus recording */}
      {stepIdx === 3 && (
        <Panel style={{ gap: 12 }}>
          <Eyebrow>Record Observations for Litmus</Eyebrow>
          <View style={styles.obsGrid}>
            <View style={styles.obsItem}>
              <Text style={styles.obsLabel}>In 0.1 M HCl (Acid)</Text>
              <Text style={[styles.obsValue, { color: '#D92027', fontFamily: font.bold }]}>
                Red
              </Text>
            </View>
            <View style={styles.obsItem}>
              <Text style={styles.obsLabel}>In Water (Neutral)</Text>
              <Text style={[styles.obsValue, { color: '#7E3F8F', fontFamily: font.bold }]}>
                Purple
              </Text>
            </View>
            <View style={styles.obsItem}>
              <Text style={styles.obsLabel}>In 0.1 M NaOH (Base)</Text>
              <Text style={[styles.obsValue, { color: '#1D50A2', fontFamily: font.bold }]}>
                Blue
              </Text>
            </View>
          </View>
        </Panel>
      )}

      {/* Step 4: Unknown identification */}
      {stepIdx === 4 && (
        <Panel style={{ gap: 12 }}>
          <Eyebrow>Deduce Nature of Solution X</Eyebrow>
          <Text style={type.bodySoft}>
            When drops of Phenolphthalein were added, Solution X immediately turned deep pink.
            What is the nature of Solution X?
          </Text>
          <View style={styles.choiceRow}>
            {['Acidic (pH < 7)', 'Neutral (pH = 7)', 'Basic (pH > 7)'].map((choice, i) => {
              const isSelected = observations.mystery_nature === choice;
              return (
                <Pressable
                  key={i}
                  onPress={() => setObservations((o) => ({ ...o, mystery_nature: choice }))}
                  style={[styles.choiceBtn, isSelected && styles.choiceBtnActive]}
                >
                  <Text style={[styles.choiceText, isSelected && { color: color.brass, fontFamily: font.bold }]}>
                    {choice}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Panel>
      )}

      {/* Step 5: Summary Table & Transition curve */}
      {stepIdx === 5 && (
        <View style={{ gap: 16 }}>
          <DataTable
            title="Standard Indicator Color Chart"
            columns={[
              { key: 'ind', label: 'Indicator', flex: 2 },
              { key: 'range', label: 'pH Range', flex: 1.5 },
              { key: 'acid', label: 'Acid Color', flex: 1.5 },
              { key: 'base', label: 'Base Color', flex: 1.5 },
            ]}
            rows={[
              {
                ind: 'Phenolphthalein',
                range: '8.3 – 10.0',
                acid: 'Colorless',
                base: 'Pink',
              },
              {
                ind: 'Methyl Orange',
                range: '3.1 – 4.4',
                acid: 'Red',
                base: 'Yellow',
              },
              {
                ind: 'Litmus',
                range: '5.0 – 8.0',
                acid: 'Red',
                base: 'Blue',
              },
              {
                ind: 'Bromothymol Blue',
                range: '6.0 – 7.6',
                acid: 'Yellow',
                base: 'Blue',
              },
            ]}
          />

          <GraphPlot
            points={ionizationCurvePoints}
            xLabel="pH Scale"
            yLabel="% Ionized Form [In⁻]"
            xUnit="pH"
            yUnit="%"
            slopeLabel="Dissociation Rate"
            allowOriginToggle={false}
          />
        </View>
      )}

      {step.note ? <Annotation label="Key Concept">{step.note}</Annotation> : null}

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
  obsGrid: {
    gap: 8,
  },
  obsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color.hairline,
  },
  obsLabel: {
    fontFamily: font.medium,
    fontSize: 12,
    color: color.inkBody,
  },
  obsValue: {
    fontFamily: font.semibold,
    fontSize: 12.5,
    color: color.inkMuted,
  },
  choiceRow: {
    gap: 8,
    marginTop: 4,
  },
  choiceBtn: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radius.chip,
    borderWidth: 1.5,
    borderColor: color.hairline,
    backgroundColor: color.paper,
  },
  choiceBtnActive: {
    borderColor: color.brass,
    backgroundColor: 'rgba(150,102,47,0.08)',
  },
  choiceText: {
    fontFamily: font.medium,
    fontSize: 12.5,
    color: color.inkSoft,
  },
});
