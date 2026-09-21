import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { color, font, type, radius } from '../../theme';
import { Eyebrow, GoldButton, GhostButton, Panel, Annotation, withAlpha } from '../../components/ui';
import PHColorScale from '../../instruments/PHColorScale';
import PHMeter from '../../instruments/PHMeter';
import PhCanvas from './PhCanvas';
import { NCERT_SOLUTIONS, getHydroniumConc, getHydroxideConc, formatScientific } from './chemistry';

export default function FreePlay() {
  const [selectedSolIdx, setSelectedSolIdx] = useState(0);
  const [customOffset, setCustomOffset] = useState(0);
  const [paperDipped, setPaperDipped] = useState(false);
  const [probeImmersed, setProbeImmersed] = useState(true);

  const baseSol = NCERT_SOLUTIONS[selectedSolIdx] || NCERT_SOLUTIONS[0];
  const effectivePH = Math.min(14.0, Math.max(0.0, baseSol.truePH + customOffset));

  const addAcid = () => {
    setCustomOffset((o) => Math.max(-baseSol.truePH, o - 0.4));
  };

  const addBase = () => {
    setCustomOffset((o) => Math.min(14.0 - baseSol.truePH, o + 0.4));
  };

  const reset = () => {
    setCustomOffset(0);
    setPaperDipped(false);
  };

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      <PhCanvas
        solutionName={baseSol.name}
        solutionCategory={baseSol.category}
        ph={effectivePH}
        paperDipped={paperDipped}
        probeImmersed={probeImmersed}
        onDipPaper={() => setPaperDipped((d) => !d)}
        onToggleProbe={() => setProbeImmersed((p) => !p)}
      />

      {/* Solution Shelf */}
      <View style={{ gap: 8 }}>
        <Eyebrow>Workbench Solution Rack</Eyebrow>
        <View style={styles.shelfGrid}>
          {NCERT_SOLUTIONS.map((s, idx) => {
            const isSelected = selectedSolIdx === idx;
            return (
              <Pressable
                key={s.id}
                onPress={() => {
                  setSelectedSolIdx(idx);
                  setCustomOffset(0);
                  setPaperDipped(false);
                }}
                style={[styles.shelfCard, isSelected && styles.shelfCardActive]}
              >
                <Text
                  style={[
                    styles.shelfCardName,
                    isSelected && { color: color.brass, fontFamily: font.bold },
                  ]}
                >
                  {s.name}
                </Text>
                <Text style={styles.shelfCardPh}>Base pH {s.truePH.toFixed(1)}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Chemical Perturbation: Add Acid or Base */}
      <View style={styles.perturbCard}>
        <Eyebrow>Titration / Addition Pipettes</Eyebrow>
        <View style={styles.perturbRow}>
          <Pressable
            onPress={addAcid}
            style={({ pressed }) => [styles.perturbBtn, pressed && { opacity: 0.7 }]}
          >
            <Text style={[styles.perturbBtnText, { color: color.red }]}>+ Add 0.1M HCl (Acidify)</Text>
            <Text style={styles.perturbBtnSub}>Drops pH by 0.4</Text>
          </Pressable>

          <Pressable
            onPress={addBase}
            style={({ pressed }) => [styles.perturbBtn, pressed && { opacity: 0.7 }]}
          >
            <Text style={[styles.perturbBtnText, { color: color.physics }]}>+ Add 0.1M NaOH (Alkalinize)</Text>
            <Text style={styles.perturbBtnSub}>Raises pH by 0.4</Text>
          </Pressable>
        </View>
      </View>

      {/* Digital pH Meter Readout */}
      <PHMeter
        apparentPH={effectivePH}
        isImmersed={probeImmersed}
        onToggleImmerse={() => setProbeImmersed((p) => !p)}
        isCalibrated={true}
        label={`Active Probe: ${baseSol.name}`}
      />

      {/* Universal pH Reference Scale */}
      <PHColorScale
        highlightedPH={paperDipped ? effectivePH : null}
        selectedPH={Math.round(effectivePH)}
      />

      <View style={{ marginTop: 4 }}>
        <GhostButton label="Reset Solution to Initial pH" onPress={reset} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: 20,
    paddingBottom: 40,
    gap: 16,
  },
  shelfGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  shelfCard: {
    width: '48%',
    backgroundColor: color.paper,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: color.hairline,
    borderRadius: radius.chip,
    paddingVertical: 9,
    paddingHorizontal: 10,
    gap: 2,
  },
  shelfCardActive: {
    borderColor: color.brass,
    backgroundColor: 'rgba(150,102,47,0.08)',
  },
  shelfCardName: {
    fontFamily: font.semibold,
    fontSize: 11,
    color: color.inkStrong,
  },
  shelfCardPh: {
    fontFamily: font.medium,
    fontSize: 9,
    color: color.inkMuted,
  },
  perturbCard: {
    backgroundColor: color.paper,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: color.hairline,
    borderRadius: radius.tile,
    padding: 12,
    gap: 8,
  },
  perturbRow: {
    flexDirection: 'row',
    gap: 8,
  },
  perturbBtn: {
    flex: 1,
    backgroundColor: 'rgba(28,24,21,0.03)',
    borderWidth: 1,
    borderColor: color.hairline,
    borderRadius: radius.chip,
    paddingVertical: 9,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 2,
  },
  perturbBtnText: {
    fontFamily: font.bold,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  perturbBtnSub: {
    fontFamily: font.medium,
    fontSize: 8.5,
    color: color.inkMuted,
  },
});
