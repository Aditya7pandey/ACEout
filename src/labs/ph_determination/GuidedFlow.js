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
import PHColorScale from '../../instruments/PHColorScale';
import PHMeter from '../../instruments/PHMeter';
import ReadingInput from '../../measure/ReadingInput';
import DataTable from '../../measure/DataTable';
import GraphPlot from '../../measure/GraphPlot';
import { INSTRUMENTS, formatSigFigs } from '../../measure/leastCount';
import { STEPS } from './steps';
import { NCERT_SOLUTIONS, getHydroniumConc, formatScientific } from './chemistry';
import { apparentMeterPH } from './errors';
import PhCanvas from './PhCanvas';
import { useLabLayout } from '../useLabLayout';

export default function GuidedFlow({ profile, errorConfig, onFinish }) {
  // Chemistry stages use a vertical field of view, so the apparatus is sized by
  // the stage's height alone. Held wide there is less height to spend, so the
  // stage takes a larger share of it.
  const layout = useLabLayout({ portraitStage: 290, fraction: 0.7, maxStage: 320 });
  const [stepIdx, setStepIdx] = useState(0);
  const [activeSolIdx, setActiveSolIdx] = useState(0);
  const [paperDipped, setPaperDipped] = useState(false);
  const [probeImmersed, setProbeImmersed] = useState(true);
  const [isCalibrated, setIsCalibrated] = useState(false);

  // 5 core NCERT practical solutions: HCl, Lemon, Vinegar, Water, NaOH
  const activeSolutions = useMemo(() => [
    NCERT_SOLUTIONS[0], // 0.1 M HCl
    NCERT_SOLUTIONS[1], // Lemon juice
    NCERT_SOLUTIONS[2], // Vinegar
    NCERT_SOLUTIONS[4], // Pure water
    NCERT_SOLUTIONS[7], // 0.1 M NaOH
  ], []);

  const [paperReadings, setPaperReadings] = useState({
    hcl: '',
    lemon: '',
    vinegar: '',
    water: '',
    naoh: '',
  });

  const [meterReadings, setMeterReadings] = useState({
    hcl: '',
    lemon: '',
    vinegar: '',
    water: '',
    naoh: '',
  });

  const [committedPaper, setCommittedPaper] = useState({});
  const [committedMeter, setCommittedMeter] = useState({});

  const step = STEPS[stepIdx];
  const currentSol = activeSolutions[activeSolIdx] || activeSolutions[0];

  const meterApparent = apparentMeterPH(
    currentSol.truePH,
    profile,
    errorConfig,
    isCalibrated
  );

  const handleNext = () => {
    if (stepIdx < STEPS.length - 1) {
      setStepIdx((s) => s + 1);
      setActiveSolIdx(0);
      setPaperDipped(false);
    }
  };

  const handlePrev = () => {
    if (stepIdx > 0) setStepIdx((s) => s - 1);
  };

  const finishLab = () => {
    if (onFinish) {
      onFinish({
        data: {
          paper: paperReadings,
          meter: meterReadings,
        },
        analysis: {
          solutions: activeSolutions,
          isCalibrated,
        },
        sf: 2,
      });
    }
  };

  // Points for graph: pH vs -log[H+]
  const graphPoints = useMemo(() => {
    const pts = [];
    activeSolutions.forEach((sol) => {
      const val = meterReadings[sol.id];
      if (val) {
        pts.push({
          x: Number(val),
          y: Number(val), // -log[H+] matches pH exactly
          label: sol.name.split(' ')[0],
        });
      }
    });
    return pts;
  }, [meterReadings, activeSolutions]);

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

      {/* Visual Beaker Bench */}
      <PhCanvas
        height={layout.stageHeight}
        solutionName={currentSol.name}
        solutionCategory={currentSol.category}
        ph={currentSol.truePH}
        paperDipped={paperDipped}
        probeImmersed={probeImmersed}
        onDipPaper={() => setPaperDipped(true)}
        onToggleProbe={() => setProbeImmersed((p) => !p)}
      />

      {/* Solution Selector Pills in measurement steps */}
      {(stepIdx === 1 || stepIdx === 3) && (
        <View style={{ gap: 6 }}>
          <Eyebrow>Active Solution in Beaker</Eyebrow>
          <View style={styles.pillsRow}>
            {activeSolutions.map((sol, idx) => {
              const isSelected = activeSolIdx === idx;
              const hasRecorded =
                stepIdx === 1 ? committedPaper[sol.id] : committedMeter[sol.id];

              return (
                <Pressable
                  key={sol.id}
                  onPress={() => {
                    setActiveSolIdx(idx);
                    setPaperDipped(false);
                  }}
                  style={[
                    styles.solPill,
                    isSelected && styles.solPillActive,
                    hasRecorded && styles.solPillDone,
                  ]}
                >
                  <Text style={[styles.solPillText, isSelected && { color: color.brass }]}>
                    {sol.name}
                  </Text>
                  {hasRecorded && <Text style={styles.doneMark}>✓</Text>}
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {step.instruction ? (
        <Text style={[type.body, { lineHeight: 21 }]}>{step.instruction}</Text>
      ) : null}

      {/* Step 1: Universal Paper measurement */}
      {stepIdx === 1 && (
        <View style={{ gap: 14 }}>
          <PHColorScale
            selectedPH={paperReadings[currentSol.id] ? Number(paperReadings[currentSol.id]) : null}
            highlightedPH={paperDipped ? currentSol.truePH : null}
            onSelectPH={(selected) => {
              setPaperReadings((r) => ({ ...r, [currentSol.id]: String(selected) }));
            }}
          />

          <ReadingInput
            instrument={INSTRUMENTS.phPaper}
            label={`${currentSol.name} (pH Paper Reading)`}
            value={paperReadings[currentSol.id]}
            onChange={(t) => setPaperReadings((r) => ({ ...r, [currentSol.id]: t }))}
            onCommit={() => setCommittedPaper((c) => ({ ...c, [currentSol.id]: true }))}
            committed={committedPaper[currentSol.id]}
            hint="Match the strip color against the 0–14 chart and record the nearest integer pH."
          />
        </View>
      )}

      {/* Step 2: Digital meter calibration */}
      {stepIdx === 2 && (
        <View style={{ gap: 14 }}>
          <PHMeter
            apparentPH={isCalibrated ? 7.0 : 7.0 + (profile?.zeroOffset || 0.28)}
            isImmersed={true}
            isCalibrated={isCalibrated}
            onCalibrate={() => setIsCalibrated(true)}
            label="Calibration Standard: pH 7.00 Buffer"
          />

          <Panel style={{ gap: 10 }}>
            <Eyebrow>Electrode Standardization</Eyebrow>
            <Text style={type.bodySoft}>
              {isCalibrated
                ? '✓ Calibration successful. The electronic zero offset has been neutralized against standard pH 7.00 phosphate buffer.'
                : 'Immerse the glass combination probe in the standard buffer and tap Calibrate.'}
            </Text>
          </Panel>
        </View>
      )}

      {/* Step 3: Digital meter measurement */}
      {stepIdx === 3 && (
        <View style={{ gap: 14 }}>
          <PHMeter
            apparentPH={meterApparent}
            isImmersed={probeImmersed}
            isCalibrated={isCalibrated}
            label={`Digital Measurement: ${currentSol.name}`}
          />

          <ReadingInput
            instrument={INSTRUMENTS.phMeter}
            label={`${currentSol.name} (Digital pH)`}
            value={meterReadings[currentSol.id]}
            onChange={(t) => setMeterReadings((r) => ({ ...r, [currentSol.id]: t }))}
            onCommit={() => setCommittedMeter((c) => ({ ...c, [currentSol.id]: true }))}
            committed={committedMeter[currentSol.id]}
            hint="Record the stabilized digital readout quoting 2 decimal places (L.C. 0.01 pH)."
          />
        </View>
      )}

      {/* Step 4: Comparison Table & Ion Calculation */}
      {stepIdx === 4 && (
        <View style={{ gap: 14 }}>
          <DataTable
            title="Comparison: pH Paper vs Digital Meter"
            columns={[
              { key: 'sol', label: 'Solution', flex: 2 },
              { key: 'paper', label: 'pH Paper (L.C. 1)', flex: 1.5, align: 'right' },
              { key: 'meter', label: 'pH Meter (L.C. 0.01)', flex: 1.5, align: 'right' },
              { key: 'hPlus', label: '[H⁺] (mol L⁻¹)', flex: 2, align: 'right' },
            ]}
            rows={activeSolutions.map((s) => {
              const mVal = Number(meterReadings[s.id] || s.truePH);
              return {
                sol: s.name,
                paper: paperReadings[s.id] ? `pH ${paperReadings[s.id]}` : `pH ${s.approxPHPaper}`,
                meter: meterReadings[s.id] ? `pH ${meterReadings[s.id]}` : `pH ${s.truePH.toFixed(2)}`,
                hPlus: `${formatScientific(getHydroniumConc(mVal))} M`,
              };
            })}
          />
        </View>
      )}

      {/* Step 5: Graph & Summary Report */}
      {stepIdx === 5 && (
        <View style={{ gap: 14 }}>
          <GraphPlot
            points={graphPoints}
            xLabel="Measured pH"
            yLabel="-log₁₀[H⁺]"
            xUnit="pH"
            yUnit="units"
            slopeLabel="Correlation (Slope)"
            defaultThroughOrigin={true}
          />

          <Panel style={{ gap: 12 }}>
            <Eyebrow tone={color.green}>Lab Report Summary</Eyebrow>
            <Text style={type.title}>Precision & Least Count Verification</Text>
            <Text style={[type.body, { lineHeight: 21 }]}>
              • Universal Indicator paper provides quick integer approximations (L.C. 1 pH).
            </Text>
            <Text style={[type.body, { lineHeight: 21 }]}>
              • The digital pH meter with glass electrode resolves subtle differences (e.g. Lemon
              juice pH 2.20 vs Vinegar pH 2.85) to 0.01 pH accuracy.
            </Text>
            <Text style={[type.body, { lineHeight: 21 }]}>
              • [H⁺] concentrations spanned 13 orders of magnitude from 0.1 M (HCl) to 10⁻¹³ M (NaOH),
              confirming the logarithmic nature of the pH scale.
            </Text>
          </Panel>
        </View>
      )}

      {step.note ? <Annotation label="NCERT Lab Note">{step.note}</Annotation> : null}

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
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  solPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: color.hairline,
    backgroundColor: color.paper,
    gap: 4,
  },
  solPillActive: {
    borderColor: color.brass,
    backgroundColor: 'rgba(150,102,47,0.08)',
  },
  solPillDone: {
    borderColor: 'rgba(47,142,108,0.4)',
  },
  solPillText: {
    fontFamily: font.semibold,
    fontSize: 10.5,
    color: color.inkBody,
  },
  doneMark: {
    fontFamily: font.bold,
    fontSize: 9.5,
    color: color.green,
  },
});
