import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput } from 'react-native';
import { color, font, type, radius } from '../../theme';
import { Eyebrow, GoldButton, GhostButton, Segmented } from '../../components/ui';
import PHColorScale from '../../instruments/PHColorScale';
import PHMeter from '../../instruments/PHMeter';
import PhCanvas from './PhCanvas';
import {
  NCERT_SOLUTIONS,
  BIOLOGICAL_SOLUTIONS,
  SALT_BUFFER_SOLUTIONS,
  SOLUTION_PACKS,
  TITRATION_DOSAGE_MODES,
  TITRATION_REAGENTS,
} from './chemistry';
import { useLabLayout } from '../useLabLayout';

export default function FreePlay() {
  // Chemistry stages use a vertical field of view, so the apparatus is sized by
  // the stage's height alone. Held wide there is less height to spend, so the
  // stage takes a larger share of it.
  const layout = useLabLayout({ portraitStage: 280, fraction: 0.7, maxStage: 320 });

  // Solution Packs State
  const [activePackId, setActivePackId] = useState('ncert');
  const [selectedSolId, setSelectedSolId] = useState(NCERT_SOLUTIONS[0].id);
  const [customSolutions, setCustomSolutions] = useState([
    {
      id: 'custom_1',
      name: '0.05 M Oxalic Acid',
      truePH: 1.8,
      category: 'Diprotic Organic Acid',
      approxPHPaper: 2,
      desc: 'Dicarboxylic acid standard solution.',
    },
    {
      id: 'custom_2',
      name: 'Filtered Ocean Seawater',
      truePH: 8.1,
      category: 'Marine Carbonate System',
      approxPHPaper: 8,
      desc: 'Natural seawater buffered by dissolved inorganic carbon.',
    },
  ]);

  // Custom Solution Creator Form State
  const [newSolName, setNewSolName] = useState('');
  const [newSolPH, setNewSolPH] = useState('5.5');
  const [newSolCategory, setNewSolCategory] = useState('Mild Acid');
  const [showAddCustom, setShowAddCustom] = useState(false);

  // Titration & Perturbation State
  const [customOffset, setCustomOffset] = useState(0);
  const [dosageModeId, setDosageModeId] = useState('pipette');
  const [paperDipped, setPaperDipped] = useState(false);
  const [probeImmersed, setProbeImmersed] = useState(true);

  // Titration Volume Tracking Log
  const [titrationLog, setTitrationLog] = useState({
    acidMl: 0,
    acidDrops: 0,
    baseMl: 0,
    baseDrops: 0,
    diluentMl: 0,
  });

  // Determine active solution list based on pack
  const activeSolutionsList = useMemo(() => {
    if (activePackId === 'ncert') return NCERT_SOLUTIONS;
    if (activePackId === 'biological') return BIOLOGICAL_SOLUTIONS;
    if (activePackId === 'salts_buffers') return SALT_BUFFER_SOLUTIONS;
    return customSolutions;
  }, [activePackId, customSolutions]);

  // Find currently selected solution
  const baseSol = useMemo(() => {
    return (
      activeSolutionsList.find((s) => s.id === selectedSolId) ||
      activeSolutionsList[0] ||
      NCERT_SOLUTIONS[0]
    );
  }, [activeSolutionsList, selectedSolId]);

  const effectivePH = Math.min(14.0, Math.max(0.0, baseSol.truePH + customOffset));
  const activeDosage = TITRATION_DOSAGE_MODES.find((m) => m.id === dosageModeId) || TITRATION_DOSAGE_MODES[1];

  // Reagent Titration Handlers
  const handleApplyReagent = (reagent) => {
    const shift = reagent.baseShift * activeDosage.shiftMultiplier;
    
    if (reagent.type === 'diluent') {
      // Pure water moderates pH towards 7.0
      setCustomOffset((currOffset) => {
        const currentPH = baseSol.truePH + currOffset;
        const diffToNeutral = 7.0 - currentPH;
        const dilutionShift = diffToNeutral * 0.15 * activeDosage.shiftMultiplier;
        return currOffset + dilutionShift;
      });
      setTitrationLog((prev) => ({
        ...prev,
        diluentMl: Math.round((prev.diluentMl + activeDosage.volumeMl * 5) * 100) / 100,
      }));
    } else {
      setCustomOffset((currOffset) => {
        const newOffset = currOffset + shift;
        const clampedPH = Math.min(14.0, Math.max(0.0, baseSol.truePH + newOffset));
        return clampedPH - baseSol.truePH;
      });

      if (reagent.type.includes('acid')) {
        setTitrationLog((prev) => ({
          ...prev,
          acidMl: Math.round((prev.acidMl + activeDosage.volumeMl) * 100) / 100,
          acidDrops: prev.acidDrops + activeDosage.dropCount,
        }));
      } else if (reagent.type.includes('base')) {
        setTitrationLog((prev) => ({
          ...prev,
          baseMl: Math.round((prev.baseMl + activeDosage.volumeMl) * 100) / 100,
          baseDrops: prev.baseDrops + activeDosage.dropCount,
        }));
      }
    }
  };

  const resetTitration = () => {
    setCustomOffset(0);
    setTitrationLog({
      acidMl: 0,
      acidDrops: 0,
      baseMl: 0,
      baseDrops: 0,
      diluentMl: 0,
    });
  };

  const handleSelectSolution = (sol) => {
    setSelectedSolId(sol.id);
    resetTitration();
    setPaperDipped(false);
  };

  const handleAddCustomSolution = () => {
    const phVal = parseFloat(newSolPH);
    if (!newSolName.trim() || isNaN(phVal) || phVal < 0 || phVal > 14) return;

    const newSol = {
      id: `custom_${Date.now()}`,
      name: newSolName.trim(),
      truePH: Math.round(phVal * 100) / 100,
      category: newSolCategory,
      approxPHPaper: Math.round(phVal),
      desc: `Custom user-prepared laboratory solution at initial pH ${phVal.toFixed(2)}.`,
    };

    setCustomSolutions((prev) => [newSol, ...prev]);
    setSelectedSolId(newSol.id);
    setNewSolName('');
    setNewSolPH('5.5');
    setShowAddCustom(false);
    resetTitration();
  };

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[styles.scroll, layout.contentStyle]}
      showsVerticalScrollIndicator={false}
    >
      {/* 3D Visual Laboratory Simulation Stage */}
      <PhCanvas
        height={layout.stageHeight}
        solutionName={baseSol.name}
        solutionCategory={baseSol.category}
        ph={effectivePH}
        paperDipped={paperDipped}
        probeImmersed={probeImmersed}
        onDipPaper={() => setPaperDipped((d) => !d)}
        onToggleProbe={() => setProbeImmersed((p) => !p)}
      />

      {/* Solution Packs Selector */}
      <View style={{ gap: 8 }}>
        <View style={styles.headerRow}>
          <Eyebrow tone={color.biology}>Workbench Solution Rack & Packs</Eyebrow>
          <Text style={styles.packCountBadge}>
            {activeSolutionsList.length} Solutions
          </Text>
        </View>

        <Segmented
          value={activePackId}
          onChange={(pack) => {
            setActivePackId(pack);
            if (pack === 'ncert') setSelectedSolId(NCERT_SOLUTIONS[0].id);
            else if (pack === 'biological') setSelectedSolId(BIOLOGICAL_SOLUTIONS[0].id);
            else if (pack === 'salts_buffers') setSelectedSolId(SALT_BUFFER_SOLUTIONS[0].id);
            else if (customSolutions.length > 0) setSelectedSolId(customSolutions[0].id);
            resetTitration();
            setPaperDipped(false);
          }}
          options={[
            { value: 'ncert', label: 'NCERT Standard' },
            { value: 'biological', label: 'Everyday & Bio' },
            { value: 'salts_buffers', label: 'Salts & Buffers' },
            { value: 'custom', label: '+ Custom Pack' },
          ]}
        />

        {/* Custom Solution Creator Toggle / Box */}
        {activePackId === 'custom' && (
          <View style={styles.customFormCard}>
            <View style={styles.headerRow}>
              <Text style={styles.customCardTitle}>Add New Custom Solution</Text>
              <GhostButton
                label={showAddCustom ? 'Cancel' : '+ New Solution'}
                onPress={() => setShowAddCustom((v) => !v)}
                compact
              />
            </View>

            {showAddCustom && (
              <View style={styles.customInputsWrap}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Solution Name / Formula:</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. 0.05 M Citric Acid"
                    placeholderTextColor={color.inkMuted}
                    value={newSolName}
                    onChangeText={setNewSolName}
                  />
                </View>

                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Initial Base pH (0–14):</Text>
                    <TextInput
                      style={styles.textInput}
                      keyboardType="numeric"
                      placeholder="e.g. 3.2"
                      placeholderTextColor={color.inkMuted}
                      value={newSolPH}
                      onChangeText={setNewSolPH}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1.4 }]}>
                    <Text style={styles.inputLabel}>Category / Chemical Nature:</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. Weak Polyprotic Acid"
                      placeholderTextColor={color.inkMuted}
                      value={newSolCategory}
                      onChangeText={setNewSolCategory}
                    />
                  </View>
                </View>

                <GoldButton
                  label="✓ Add Solution to Active Rack"
                  onPress={handleAddCustomSolution}
                  disabled={!newSolName.trim()}
                  compact
                />
              </View>
            )}
          </View>
        )}

        {/* Active Solution Rack Grid */}
        <View style={styles.shelfGrid}>
          {activeSolutionsList.map((s) => {
            const isSelected = baseSol.id === s.id;
            return (
              <Pressable
                key={s.id}
                onPress={() => handleSelectSolution(s)}
                style={[styles.shelfCard, isSelected && styles.shelfCardActive]}
              >
                <View style={styles.shelfCardTop}>
                  <Text
                    style={[
                      styles.shelfCardName,
                      isSelected && { color: color.brass, fontFamily: font.bold },
                    ]}
                    numberOfLines={2}
                  >
                    {s.name}
                  </Text>
                  <View
                    style={[
                      styles.phBadge,
                      isSelected && { backgroundColor: color.brass, borderColor: color.brass },
                    ]}
                  >
                    <Text style={[styles.phBadgeText, isSelected && { color: '#FFFDF8' }]}>
                      pH {s.truePH.toFixed(1)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.shelfCardCat} numberOfLines={1}>
                  {s.category}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Titration / Addition Pipettes Workstation */}
      <View style={styles.perturbCard}>
        <View style={styles.headerRow}>
          <Eyebrow tone={color.chemistry}>Titration & Addition Pipettes</Eyebrow>
          {customOffset !== 0 && (
            <Text style={styles.offsetBadge}>
              ΔpH: {customOffset > 0 ? `+${customOffset.toFixed(2)}` : customOffset.toFixed(2)}
            </Text>
          )}
        </View>

        {/* Pipette Delivery Dosage Selector */}
        <View style={styles.dosageRow}>
          <Text style={styles.dosageLabel}>Delivery Mode:</Text>
          <View style={styles.dosageBtns}>
            {TITRATION_DOSAGE_MODES.map((mode) => {
              const isActive = dosageModeId === mode.id;
              return (
                <Pressable
                  key={mode.id}
                  style={[styles.dosageBtn, isActive && styles.dosageBtnActive]}
                  onPress={() => setDosageModeId(mode.id)}
                >
                  <Text
                    style={[
                      styles.dosageBtnText,
                      isActive && styles.dosageBtnTextActive,
                    ]}
                  >
                    {mode.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Pipette Reagents Grid */}
        <View style={styles.reagentsGrid}>
          {TITRATION_REAGENTS.map((reagent) => (
            <Pressable
              key={reagent.id}
              onPress={() => handleApplyReagent(reagent)}
              style={({ pressed }) => [
                styles.reagentBtn,
                { borderLeftColor: reagent.color, borderLeftWidth: 3.5 },
                pressed && { opacity: 0.75, transform: [{ scale: 0.98 }] },
              ]}
            >
              <Text style={[styles.reagentBtnText, { color: reagent.color }]}>
                + Add {reagent.name}
              </Text>
              <Text style={styles.reagentBtnSub}>{reagent.desc}</Text>
            </Pressable>
          ))}
        </View>

        {/* Titration Live Telemetry Tracker */}
        {(titrationLog.acidDrops > 0 || titrationLog.baseDrops > 0 || titrationLog.diluentMl > 0) && (
          <View style={styles.titrationLogCard}>
            <View style={styles.logItem}>
              <Text style={styles.logVal}>{titrationLog.acidMl.toFixed(2)} mL</Text>
              <Text style={styles.logSub}>Acid ({titrationLog.acidDrops} drops)</Text>
            </View>
            <View style={styles.logDivider} />
            <View style={styles.logItem}>
              <Text style={styles.logVal}>{titrationLog.baseMl.toFixed(2)} mL</Text>
              <Text style={styles.logSub}>Base ({titrationLog.baseDrops} drops)</Text>
            </View>
            {titrationLog.diluentMl > 0 && (
              <>
                <View style={styles.logDivider} />
                <View style={styles.logItem}>
                  <Text style={styles.logVal}>{titrationLog.diluentMl.toFixed(1)} mL</Text>
                  <Text style={styles.logSub}>H₂O Diluent</Text>
                </View>
              </>
            )}
          </View>
        )}
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

      {/* Action Buttons */}
      <View style={styles.footerRow}>
        <GhostButton
          label="Reset Solution to Initial pH"
          onPress={resetTitration}
          disabled={customOffset === 0 && titrationLog.acidDrops === 0 && titrationLog.baseDrops === 0}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  packCountBadge: {
    fontFamily: font.bold,
    fontSize: 10,
    color: color.inkMuted,
    backgroundColor: 'rgba(28, 24, 21, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  shelfGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  shelfCard: {
    width: '48.5%',
    backgroundColor: color.paper,
    borderWidth: 1.5,
    borderColor: 'rgba(28, 24, 21, 0.1)',
    borderRadius: radius.tile,
    paddingVertical: 10,
    paddingHorizontal: 11,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  shelfCardActive: {
    borderColor: color.brass,
    backgroundColor: 'rgba(150,102,47,0.08)',
    shadowOpacity: 0.08,
  },
  shelfCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 4,
  },
  shelfCardName: {
    flex: 1,
    fontFamily: font.semibold,
    fontSize: 11.5,
    lineHeight: 15,
    color: color.inkStrong,
  },
  phBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(28, 24, 21, 0.15)',
    backgroundColor: '#FAF5EE',
  },
  phBadgeText: {
    fontFamily: font.bold,
    fontSize: 9.5,
    color: color.inkBody,
  },
  shelfCardCat: {
    fontFamily: font.regular,
    fontSize: 9.5,
    color: color.inkMuted,
  },
  customFormCard: {
    backgroundColor: '#FFFDF8',
    borderWidth: 1,
    borderColor: 'rgba(28, 24, 21, 0.12)',
    borderRadius: radius.card,
    padding: 12,
    gap: 8,
    marginTop: 4,
  },
  customCardTitle: {
    fontFamily: font.bold,
    fontSize: 11.5,
    color: color.inkStrong,
  },
  customInputsWrap: {
    gap: 8,
    marginTop: 4,
  },
  inputGroup: {
    gap: 3,
  },
  inputLabel: {
    fontFamily: font.medium,
    fontSize: 10,
    color: color.inkMuted,
  },
  textInput: {
    height: 34,
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: 'rgba(28, 24, 21, 0.16)',
    borderRadius: radius.chip,
    paddingHorizontal: 10,
    fontFamily: font.medium,
    fontSize: 11.5,
    color: color.inkStrong,
  },
  perturbCard: {
    backgroundColor: '#FFFDF8',
    borderWidth: 1,
    borderColor: 'rgba(28, 24, 21, 0.12)',
    borderRadius: radius.card,
    padding: 12,
    gap: 10,
  },
  offsetBadge: {
    fontFamily: font.bold,
    fontSize: 10,
    color: color.chemistry,
    backgroundColor: 'rgba(178, 52, 40, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  dosageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dosageLabel: {
    fontFamily: font.medium,
    fontSize: 10.5,
    color: color.inkMuted,
  },
  dosageBtns: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
  },
  dosageBtn: {
    flex: 1,
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(28, 24, 21, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dosageBtnActive: {
    backgroundColor: color.brass,
  },
  dosageBtnText: {
    fontFamily: font.semibold,
    fontSize: 9.5,
    color: color.inkSoft,
  },
  dosageBtnTextActive: {
    color: '#FFFDF8',
    fontFamily: font.bold,
  },
  reagentsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  reagentBtn: {
    width: '48.5%',
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: 'rgba(28, 24, 21, 0.08)',
    borderRadius: radius.chip,
    paddingVertical: 8,
    paddingHorizontal: 8,
    gap: 2,
  },
  reagentBtnText: {
    fontFamily: font.bold,
    fontSize: 10.5,
  },
  reagentBtnSub: {
    fontFamily: font.regular,
    fontSize: 8.5,
    color: color.inkMuted,
  },
  titrationLogCard: {
    flexDirection: 'row',
    backgroundColor: '#F5EFE6',
    borderRadius: radius.tile,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 2,
  },
  logItem: {
    alignItems: 'center',
    gap: 1,
  },
  logVal: {
    fontFamily: font.bold,
    fontSize: 11,
    color: color.inkStrong,
  },
  logSub: {
    fontFamily: font.regular,
    fontSize: 8.5,
    color: color.inkMuted,
  },
  logDivider: {
    width: 1,
    height: 18,
    backgroundColor: 'rgba(28, 24, 21, 0.12)',
  },
  footerRow: {
    marginTop: 2,
  },
});
