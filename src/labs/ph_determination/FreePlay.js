import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { color, font, type, radius } from '../../theme';
import { Eyebrow, GoldButton, GhostButton, Panel, Annotation, withAlpha } from '../../components/ui';
import PHColorScale from '../../instruments/PHColorScale';
import PHMeter from '../../instruments/PHMeter';
import PhCanvas from './PhCanvas';
import { NCERT_SOLUTIONS, calculateSolutionMixture, formatScientific } from './chemistry';
import { useLabLayout } from '../useLabLayout';

export default function FreePlay() {
  // Chemistry stages use a vertical field of view, so the apparatus is sized by
  // the stage's height alone. Held wide there is less height to spend, so the
  // stage takes a larger share of it.
  const layout = useLabLayout({ portraitStage: 280, fraction: 0.7, maxStage: 320 });
  const [selectedSolId, setSelectedSolId] = useState('tomato');
  const [addDoseMl, setAddDoseMl] = useState(25);
  const [volumes, setVolumes] = useState({ tomato: 100 });
  const [paperDipped, setPaperDipped] = useState(false);
  const [probeImmersed, setProbeImmersed] = useState(true);

  // Compute real-time mixture equilibrium
  const mixture = calculateSolutionMixture(volumes);
  const activeSolutionDef = NCERT_SOLUTIONS.find((s) => s.id === selectedSolId) || NCERT_SOLUTIONS[3];

  // Add arbitrary volume of selected solution from rack
  const handleAddRackSolution = (solId, vol) => {
    setVolumes((prev) => {
      const current = prev[solId] || 0;
      const newTotal = Object.values(prev).reduce((a, b) => a + b, 0) + vol;
      if (newTotal > 300) {
        // Cap max beaker fill at 300 mL
        const allowed = Math.max(0, 300 - (newTotal - vol));
        return { ...prev, [solId]: current + allowed };
      }
      return { ...prev, [solId]: current + vol };
    });
  };

  // Fresh pour single solution (replaces current contents)
  const handleFreshFill = (solId, vol = 100) => {
    setVolumes({ [solId]: vol });
    setSelectedSolId(solId);
    setPaperDipped(false);
  };

  // Titration pipette additions
  const handleTitrate = (reagentId, volMl) => {
    setVolumes((prev) => {
      const current = prev[reagentId] || 0;
      return { ...prev, [reagentId]: current + volMl };
    });
  };

  const handleEmptyBeaker = () => {
    setVolumes({});
    setPaperDipped(false);
  };

  const handleResetBenchmark = () => {
    setVolumes({ [selectedSolId]: 100 });
    setPaperDipped(false);
  };

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[styles.scroll, layout.contentStyle]}
      showsVerticalScrollIndicator={false}
    >
      {/* Real-time 3D Chemistry Viewport */}
      <PhCanvas
        height={layout.stageHeight}
        solutionName={mixture.name}
        solutionCategory={mixture.category}
        ph={mixture.ph}
        volumeMl={mixture.totalVolumeMl}
        paperDipped={paperDipped}
        probeImmersed={probeImmersed}
        onDipPaper={() => setPaperDipped((d) => !d)}
        onToggleProbe={() => setProbeImmersed((p) => !p)}
      />

      {/* Workbench Solution Rack */}
      <View style={{ gap: 8 }}>
        <View style={styles.sectionHeaderRow}>
          <Eyebrow>Workbench Solution Rack</Eyebrow>
          <Text style={styles.headerSub}>Tap to select · Add any amount</Text>
        </View>

        <View style={styles.shelfGrid}>
          {NCERT_SOLUTIONS.map((s) => {
            const isSelected = selectedSolId === s.id;
            const currentVolInBeaker = volumes[s.id] || 0;
            return (
              <Pressable
                key={s.id}
                onPress={() => setSelectedSolId(s.id)}
                style={[styles.shelfCard, isSelected && styles.shelfCardActive]}
              >
                <View style={styles.shelfCardTop}>
                  <Text
                    style={[
                      styles.shelfCardName,
                      isSelected && { color: color.brass, fontFamily: font.bold },
                    ]}
                  >
                    {s.name}
                  </Text>
                  {currentVolInBeaker > 0 ? (
                    <Text style={styles.inBeakerBadge}>{currentVolInBeaker.toFixed(0)} mL in beaker</Text>
                  ) : null}
                </View>
                <Text style={styles.shelfCardPh}>Base pH {s.truePH.toFixed(1)} · {s.category}</Text>

                {isSelected ? (
                  <View style={styles.quickAddRow}>
                    <Pressable
                      onPress={() => handleAddRackSolution(s.id, addDoseMl)}
                      style={({ pressed }) => [styles.quickAddBtn, pressed && { opacity: 0.7 }]}
                    >
                      <Text style={styles.quickAddText}>+ Add {addDoseMl} mL</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleFreshFill(s.id, 100)}
                      style={({ pressed }) => [styles.freshFillBtn, pressed && { opacity: 0.7 }]}
                    >
                      <Text style={styles.freshFillText}>Fresh Fill (100 mL)</Text>
                    </Pressable>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>

        {/* Rack Dosage Selector */}
        <View style={styles.doseSelectorBar}>
          <Text style={styles.doseLabel}>Dosing Volume:</Text>
          <View style={styles.doseChips}>
            {[10, 25, 50, 100].map((dose) => (
              <Pressable
                key={dose}
                onPress={() => setAddDoseMl(dose)}
                style={[styles.doseChip, addDoseMl === dose && styles.doseChipActive]}
              >
                <Text
                  style={[
                    styles.doseChipText,
                    addDoseMl === dose && { color: color.brass, fontFamily: font.bold },
                  ]}
                >
                  +{dose} mL
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      {/* Chemical Perturbation & Real-Time Titration Pipettes */}
      <View style={styles.perturbCard}>
        <View style={styles.sectionHeaderRow}>
          <Eyebrow>Titration / Addition Pipettes</Eyebrow>
          <Text style={styles.headerSub}>Dynamic Real-time Neutralization & Dilution</Text>
        </View>

        <View style={styles.perturbGrid}>
          {/* Add Acid Pipette */}
          <View style={styles.reagentCol}>
            <Text style={[styles.reagentTitle, { color: color.red }]}>0.1 M HCl (Acidify)</Text>
            <View style={styles.doseBtnRow}>
              {[1, 5, 10].map((ml) => (
                <Pressable
                  key={ml}
                  onPress={() => handleTitrate('hcl', ml)}
                  style={({ pressed }) => [styles.titrateBtn, pressed && { opacity: 0.7 }]}
                >
                  <Text style={[styles.titrateBtnText, { color: color.red }]}>+{ml} mL</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Add Base Pipette */}
          <View style={styles.reagentCol}>
            <Text style={[styles.reagentTitle, { color: color.physics }]}>0.1 M NaOH (Alkalinize)</Text>
            <View style={styles.doseBtnRow}>
              {[1, 5, 10].map((ml) => (
                <Pressable
                  key={ml}
                  onPress={() => handleTitrate('naoh', ml)}
                  style={({ pressed }) => [styles.titrateBtn, pressed && { opacity: 0.7 }]}
                >
                  <Text style={[styles.titrateBtnText, { color: color.physics }]}>+{ml} mL</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Add Water Dilution */}
          <View style={styles.reagentCol}>
            <Text style={[styles.reagentTitle, { color: color.green }]}>Pure H₂O (Dilute)</Text>
            <View style={styles.doseBtnRow}>
              {[10, 25, 50].map((ml) => (
                <Pressable
                  key={ml}
                  onPress={() => handleTitrate('water', ml)}
                  style={({ pressed }) => [styles.titrateBtn, pressed && { opacity: 0.7 }]}
                >
                  <Text style={[styles.titrateBtnText, { color: color.green }]}>+{ml} mL</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </View>

      {/* Digital pH Meter Readout */}
      <PHMeter
        apparentPH={mixture.ph}
        isImmersed={probeImmersed}
        onToggleImmerse={() => setProbeImmersed((p) => !p)}
        isCalibrated={true}
        label={`Active Probe: ${mixture.name}`}
      />

      {/* Universal pH Reference Scale */}
      <PHColorScale
        highlightedPH={paperDipped ? mixture.ph : null}
        selectedPH={Math.round(mixture.ph)}
      />

      {/* Workbench Actions */}
      <View style={styles.benchActionsRow}>
        <View style={{ flex: 1 }}>
          <GhostButton label="Clean / Empty Beaker" onPress={handleEmptyBeaker} />
        </View>
        <View style={{ flex: 1 }}>
          <GhostButton label="Reset to Initial (100 mL)" onPress={handleResetBenchmark} />
        </View>
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
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  headerSub: {
    fontFamily: font.medium,
    fontSize: 9.5,
    color: color.inkMuted,
  },
  shelfGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  shelfCard: {
    width: '48.8%',
    backgroundColor: color.paper,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: color.hairline,
    borderRadius: radius.chip,
    paddingVertical: 8,
    paddingHorizontal: 9,
    gap: 2,
  },
  shelfCardActive: {
    borderColor: color.brass,
    backgroundColor: 'rgba(150,102,47,0.08)',
  },
  shelfCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 4,
  },
  shelfCardName: {
    fontFamily: font.semibold,
    fontSize: 11,
    color: color.inkStrong,
    flex: 1,
  },
  shelfCardPh: {
    fontFamily: font.medium,
    fontSize: 9,
    color: color.inkMuted,
  },
  inBeakerBadge: {
    fontFamily: font.bold,
    fontSize: 8,
    color: color.brass,
    backgroundColor: 'rgba(150,102,47,0.12)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  quickAddRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 6,
    paddingTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150,102,47,0.2)',
  },
  quickAddBtn: {
    flex: 1,
    backgroundColor: color.brass,
    borderRadius: 4,
    paddingVertical: 4,
    alignItems: 'center',
  },
  quickAddText: {
    fontFamily: font.bold,
    fontSize: 8.5,
    color: '#FFF8EE',
  },
  freshFillBtn: {
    flex: 1,
    backgroundColor: 'rgba(28,24,21,0.06)',
    borderRadius: 4,
    paddingVertical: 4,
    alignItems: 'center',
  },
  freshFillText: {
    fontFamily: font.medium,
    fontSize: 8,
    color: color.inkStrong,
  },
  doseSelectorBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(28,24,21,0.03)',
    borderRadius: radius.chip,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 2,
  },
  doseLabel: {
    fontFamily: font.medium,
    fontSize: 10,
    color: color.inkMuted,
  },
  doseChips: {
    flexDirection: 'row',
    gap: 5,
  },
  doseChip: {
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: color.hairline,
    backgroundColor: color.paper,
  },
  doseChipActive: {
    borderColor: color.brass,
    backgroundColor: 'rgba(150,102,47,0.12)',
  },
  doseChipText: {
    fontFamily: font.semibold,
    fontSize: 9,
    color: color.inkSoft,
  },
  perturbCard: {
    backgroundColor: color.paper,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: color.hairline,
    borderRadius: radius.tile,
    padding: 12,
    gap: 10,
  },
  perturbGrid: {
    gap: 8,
  },
  reagentCol: {
    gap: 4,
  },
  reagentTitle: {
    fontFamily: font.bold,
    fontSize: 9.5,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  doseBtnRow: {
    flexDirection: 'row',
    gap: 6,
  },
  titrateBtn: {
    flex: 1,
    backgroundColor: 'rgba(28,24,21,0.03)',
    borderWidth: 1,
    borderColor: color.hairline,
    borderRadius: radius.chip,
    paddingVertical: 7,
    alignItems: 'center',
  },
  titrateBtnText: {
    fontFamily: font.bold,
    fontSize: 9.5,
  },
  benchActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
});
