import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { color, font, type, radius } from '../../theme';
import { Eyebrow, GoldButton, GhostButton, Panel, Annotation, withAlpha } from '../../components/ui';
import Slider from '../../components/Slider';
import ColorComparator from '../../instruments/ColorComparator';
import FeScnCanvas from './FeScnCanvas';
import {
  calculateEquilibrium,
  getSolutionColor,
  DEFAULT_FE_PARAMS,
  KC_TRUE,
} from './chemistry';

export default function FreePlay() {
  const [params, setParams] = useState({
    feMoles: 2.0e-6,
    scnMoles: 2.0e-6,
    oxalicMoles: 0,
    volumeMl: 10.0,
    feDrops: 0,
    scnDrops: 0,
    oxalicDrops: 0,
    waterDrops: 0,
  });

  const eq = useMemo(() => {
    return calculateEquilibrium({
      feMoles: params.feMoles,
      scnMoles: params.scnMoles,
      oxalicMoles: params.oxalicMoles,
      volumeL: params.volumeMl / 1000,
      Kc: KC_TRUE,
    });
  }, [params]);

  const addDrop = (type) => {
    // 1 drop ≈ 0.05 mL, 0.1 M solution = 5.0e-6 mol
    if (type === 'fe') {
      setParams((p) => ({
        ...p,
        feMoles: p.feMoles + 5.0e-6,
        volumeMl: p.volumeMl + 0.05,
        feDrops: p.feDrops + 1,
      }));
    } else if (type === 'scn') {
      setParams((p) => ({
        ...p,
        scnMoles: p.scnMoles + 5.0e-6,
        volumeMl: p.volumeMl + 0.05,
        scnDrops: p.scnDrops + 1,
      }));
    } else if (type === 'oxalic') {
      setParams((p) => ({
        ...p,
        oxalicMoles: p.oxalicMoles + 5.0e-6,
        volumeMl: p.volumeMl + 0.05,
        oxalicDrops: p.oxalicDrops + 1,
      }));
    } else if (type === 'water') {
      setParams((p) => ({
        ...p,
        volumeMl: p.volumeMl + 1.0,
        waterDrops: p.waterDrops + 20,
      }));
    }
  };

  const reset = () => {
    setParams({
      feMoles: 2.0e-6,
      scnMoles: 2.0e-6,
      oxalicMoles: 0,
      volumeMl: 10.0,
      feDrops: 0,
      scnDrops: 0,
      oxalicDrops: 0,
      waterDrops: 0,
    });
  };

  const tubes = [
    {
      id: 0,
      name: 'Interactive Tube',
      tag: 'Live Bench',
      complexConc: eq.complexConc,
      volumeMl: params.volumeMl,
    },
  ];

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      <FeScnCanvas
        tubes={tubes}
        selectedTubeId={0}
        shiftDirection={
          params.feDrops > 0 || params.scnDrops > 0
            ? 'FORWARD'
            : params.oxalicDrops > 0
            ? 'REVERSE'
            : 'EQUILIBRIUM'
        }
      />

      {/* Quick Add Dropper Bar */}
      <View style={styles.dropperCard}>
        <Eyebrow>Reagent Dropper Dispenser</Eyebrow>
        <View style={styles.dropperRow}>
          <Pressable
            onPress={() => addDrop('fe')}
            style={({ pressed }) => [styles.dropBtn, pressed && { opacity: 0.7 }]}
          >
            <Text style={styles.dropBtnTitle}>+ 0.1M FeCl₃</Text>
            <Text style={styles.dropBtnSub}>({params.feDrops} drops)</Text>
          </Pressable>

          <Pressable
            onPress={() => addDrop('scn')}
            style={({ pressed }) => [styles.dropBtn, pressed && { opacity: 0.7 }]}
          >
            <Text style={styles.dropBtnTitle}>+ 0.1M KSCN</Text>
            <Text style={styles.dropBtnSub}>({params.scnDrops} drops)</Text>
          </Pressable>

          <Pressable
            onPress={() => addDrop('oxalic')}
            style={({ pressed }) => [styles.dropBtn, pressed && { opacity: 0.7 }]}
          >
            <Text style={styles.dropBtnTitle}>+ Oxalic Acid</Text>
            <Text style={styles.dropBtnSub}>({params.oxalicDrops} drops)</Text>
          </Pressable>

          <Pressable
            onPress={() => addDrop('water')}
            style={({ pressed }) => [styles.dropBtn, pressed && { opacity: 0.7 }]}
          >
            <Text style={styles.dropBtnTitle}>+ H₂O Dilute</Text>
            <Text style={styles.dropBtnSub}>({params.volumeMl.toFixed(1)} mL)</Text>
          </Pressable>
        </View>
      </View>

      {/* Colorimeter live readout */}
      <ColorComparator
        sampleColor={getSolutionColor(eq.complexConc)}
        apparentAbsorbance={eq.absorbance}
        trueAbsorbance={eq.absorbance}
        label="Live Optical Absorbance (A)"
      />

      {/* Equilibrium State Readouts */}
      <View style={styles.readouts}>
        <View style={styles.readoutCard}>
          <Text style={styles.readoutLabel}>[[Fe(SCN)]²⁺]</Text>
          <Text style={[styles.readoutVal, { color: color.red }]}>
            {(eq.complexConc * 1e4).toFixed(2)}
          </Text>
          <Text style={styles.readoutUnit}>×10⁻⁴ M</Text>
        </View>

        <View style={styles.readoutCard}>
          <Text style={styles.readoutLabel}>Free [Fe³⁺]</Text>
          <Text style={[styles.readoutVal, { color: color.amber }]}>
            {(eq.freeFeConc * 1e4).toFixed(2)}
          </Text>
          <Text style={styles.readoutUnit}>×10⁻⁴ M</Text>
        </View>

        <View style={styles.readoutCard}>
          <Text style={styles.readoutLabel}>Free [SCN⁻]</Text>
          <Text style={styles.readoutVal}>{(eq.freeScnConc * 1e4).toFixed(2)}</Text>
          <Text style={styles.readoutUnit}>×10⁻⁴ M</Text>
        </View>
      </View>

      <Panel style={{ gap: 10 }}>
        <View style={styles.statusRow}>
          <Eyebrow>Equilibrium Constant (Kc)</Eyebrow>
          <Text style={styles.kcVal}>{KC_TRUE.toFixed(0)} L mol⁻¹</Text>
        </View>
        <Text style={[type.body, { lineHeight: 20 }]}>
          Kc = [[Fe(SCN)]²⁺] / ([Fe³⁺] · [SCN⁻]). As you add Fe³⁺ or SCN⁻, the reaction
          quotient momentarily shifts, driving more product formation until equilibrium is restored.
        </Text>
      </Panel>

      <View style={{ marginTop: 6 }}>
        <GhostButton label="Reset to Initial Equilibrium" onPress={reset} />
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
  dropperCard: {
    backgroundColor: color.paper,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: color.hairline,
    borderRadius: radius.tile,
    padding: 14,
    gap: 10,
  },
  dropperRow: {
    flexDirection: 'row',
    gap: 6,
  },
  dropBtn: {
    flex: 1,
    backgroundColor: 'rgba(28,24,21,0.04)',
    borderWidth: 1,
    borderColor: color.hairline,
    borderRadius: radius.chip,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  dropBtnTitle: {
    fontFamily: font.bold,
    fontSize: 10,
    color: color.inkStrong,
    textAlign: 'center',
  },
  dropBtnSub: {
    fontFamily: font.medium,
    fontSize: 8.5,
    color: color.inkMuted,
  },
  readouts: {
    flexDirection: 'row',
    gap: 10,
  },
  readoutCard: {
    flex: 1,
    backgroundColor: color.paper,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: color.hairline,
    borderRadius: radius.chip,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  readoutLabel: {
    fontFamily: font.bold,
    fontSize: 8.5,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: color.inkMuted,
  },
  readoutVal: {
    fontFamily: font.bold,
    fontSize: 18,
    letterSpacing: -0.4,
    color: color.inkStrong,
    fontVariant: ['tabular-nums'],
  },
  readoutUnit: {
    fontFamily: font.medium,
    fontSize: 8.5,
    color: color.inkMuted,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kcVal: {
    fontFamily: font.bold,
    fontSize: 14,
    color: color.brass,
  },
});
