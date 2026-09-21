import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { color, font, type, radius } from '../../theme';
import { Eyebrow, GoldButton, GhostButton, Panel, Annotation, withAlpha } from '../../components/ui';
import Slider from '../../components/Slider';
import IndicatorsCanvas from './IndicatorsCanvas';
import { INDICATORS, STANDARD_SOLUTIONS, getIndicatorColor, getIonizedFraction } from './chemistry';
import { useLabLayout } from '../useLabLayout';

export default function FreePlay() {
  // Chemistry stages use a vertical field of view, so the apparatus is sized by
  // the stage's height alone. Held wide there is less height to spend, so the
  // stage takes a larger share of it.
  const layout = useLabLayout({ portraitStage: 280, fraction: 0.7, maxStage: 320 });
  const [ph, setPh] = useState(7.0);
  const [selectedIndKey, setSelectedIndKey] = useState('phenolphthalein');
  const [selectedPresetId, setSelectedPresetId] = useState(null);
  const [drops, setDrops] = useState(3);

  const ind = INDICATORS[selectedIndKey] || INDICATORS.phenolphthalein;
  const fracIonized = getIonizedFraction(ph, ind.pKIn);

  const canvasSolutions = [
    {
      id: 'custom',
      name: `Solution (pH ${ph.toFixed(1)})`,
      ph,
      drops,
      indicatorKey: selectedIndKey,
    },
  ];

  const handleSelectPreset = (s) => {
    setPh(s.ph);
    setSelectedPresetId(s.id);
  };

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[styles.scroll, layout.contentStyle]}
      showsVerticalScrollIndicator={false}
    >
      <IndicatorsCanvas
        height={layout.stageHeight}
        solutions={canvasSolutions}
        selectedIdx={0}
        activeIndicator={selectedIndKey}
        onAddDrop={() => setDrops((d) => Math.min(8, d + 1))}
      />

      {/* Indicator Selection Pills */}
      <View style={{ gap: 8 }}>
        <Eyebrow>Choose Active Indicator</Eyebrow>
        <View style={styles.pillsRow}>
          {Object.values(INDICATORS).map((i) => {
            const isSelected = selectedIndKey === i.id;
            return (
              <Pressable
                key={i.id}
                onPress={() => setSelectedIndKey(i.id)}
                style={[styles.indPill, isSelected && styles.indPillActive]}
              >
                <Text style={[styles.indPillLabel, isSelected && { color: color.brass }]}>
                  {i.name}
                </Text>
                <Text style={styles.indPillRange}>pH {i.rangeLow}–{i.rangeHigh}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* pH Slider */}
      <View style={{ gap: 12 }}>
        <Slider
          label="Solution pH Level"
          display={`pH ${ph.toFixed(1)}`}
          value={ph}
          min={0.0}
          max={14.0}
          step={0.1}
          onChange={setPh}
          rangeZone={{ start: ind.rangeLow, end: ind.rangeHigh, color: withAlpha(color.brass, 0.18) }}
          marks={[
            { value: ind.rangeLow, color: color.red, label: `${ind.rangeLow}` },
            { value: ind.pKIn, color: color.gold, label: `pK ${ind.pKIn}` },
            { value: ind.rangeHigh, color: color.green, label: `${ind.rangeHigh}` },
          ]}
        />
      </View>



      {/* Solution Presets */}
      <View style={{ gap: 8 }}>
        <Eyebrow>Preset Solutions</Eyebrow>
        <View style={styles.presetsRow}>
          {STANDARD_SOLUTIONS.map((s) => {
            const isActive = selectedPresetId === s.id;
            return (
              <Pressable
                key={s.id}
                onPress={() => handleSelectPreset(s)}
                style={({ pressed }) => [
                  styles.presetBtn,
                  isActive && styles.presetBtnActive,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text style={[styles.presetName, isActive && { color: color.brass }]}>{s.name}</Text>
                <Text style={[styles.presetPh, isActive && { color: color.brass }]}>pH {s.ph}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Indicator State Readouts */}
      <View style={styles.readouts}>
        <View style={styles.readoutCard}>
          <Text style={styles.readoutLabel}>Ionized [In⁻]</Text>
          <Text style={[styles.readoutVal, { color: color.green }]}>
            {(fracIonized * 100).toFixed(1)}%
          </Text>
          <Text style={styles.readoutUnit}>Basic form</Text>
        </View>

        <View style={styles.readoutCard}>
          <Text style={styles.readoutLabel}>Unionized [HIn]</Text>
          <Text style={[styles.readoutVal, { color: color.red }]}>
            {((1 - fracIonized) * 100).toFixed(1)}%
          </Text>
          <Text style={styles.readoutUnit}>Acidic form</Text>
        </View>

        <View style={styles.readoutCard}>
          <Text style={styles.readoutLabel}>pK_In</Text>
          <Text style={styles.readoutVal}>{ind.pKIn.toFixed(1)}</Text>
          <Text style={styles.readoutUnit}>Midpoint</Text>
        </View>
      </View>

      <Panel style={{ gap: 10 }}>
        <Eyebrow>Henderson–Hasselbalch Equation</Eyebrow>
        <Text style={[type.body, { fontFamily: font.semibold }]}>
          pH = pK_In + log([In⁻] / [HIn])
        </Text>
        <Text style={type.bodySoft}>
          When [In⁻] = [HIn], pH equals pK_In. The human eye perceives distinct color changes
          when one form is at least 10 times more concentrated than the other, yielding a transition
          interval of pK_In ± 1.
        </Text>
      </Panel>

      <View style={{ marginTop: 4 }}>
        <GhostButton label="Reset to Neutral pH 7.0" onPress={() => { setPh(7.0); setDrops(3); }} />
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
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  indPill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: color.hairline,
    backgroundColor: color.paper,
    gap: 1,
  },
  indPillActive: {
    borderColor: withAlpha(color.brass, 0.55),
    backgroundColor: withAlpha(color.brass, 0.08),
  },
  indPillLabel: {
    fontFamily: font.bold,
    fontSize: 11,
    color: color.inkBody,
  },
  indPillRange: {
    fontFamily: font.medium,
    fontSize: 9,
    color: color.inkMuted,
  },
  presetBtnActive: {
    borderColor: color.brass,
    backgroundColor: 'rgba(150,102,47,0.10)',
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  presetBtn: {
    backgroundColor: 'rgba(28,24,21,0.04)',
    borderWidth: 1,
    borderColor: color.hairline,
    borderRadius: radius.chip,
    paddingVertical: 7,
    paddingHorizontal: 10,
    alignItems: 'center',
    gap: 1,
  },
  presetName: {
    fontFamily: font.semibold,
    fontSize: 10.5,
    color: color.inkStrong,
  },
  presetPh: {
    fontFamily: font.medium,
    fontSize: 9,
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
    gap: 3,
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
});
