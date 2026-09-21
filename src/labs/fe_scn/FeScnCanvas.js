import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { color, font, radius } from '../../theme';
import { getSolutionColor } from './chemistry';
import ChemistryStage from '../chemistry3d/ChemistryStage';
import { TestTube3D, TestTubeRack3D } from '../chemistry3d/Glassware3D';
import Fluid3D from '../chemistry3d/Fluid3D';
import { EffervescenceBubbles3D } from '../chemistry3d/ParticleSystems3D';
import TelemetryHUD3D from '../chemistry3d/TelemetryHUD3D';

/**
 * Real-time Interactive 3D Bench for Fe3+ / SCN- Equilibrium Lab.
 * Features 3D wooden test tube stand, dynamic blood-red complex color variations,
 * spatial selection, and live Le Chatelier shift telemetry.
 */
export default function FeScnCanvas({
  tubes = [],
  selectedTubeId = 0,
  onSelectTube,
  shiftDirection = 'EQUILIBRIUM',
  height = 245,
}) {
  const safeTubes = tubes && tubes.length > 0 ? tubes : [
    { id: 'tube-1', name: 'Interactive Tube', complexConc: 0.0001, volumeMl: 10.0, tag: 'Live Bench' },
  ];

  const activeTube = safeTubes[selectedTubeId] || safeTubes[0];

  const isForward = shiftDirection === 'FORWARD';
  const isReverse = shiftDirection === 'REVERSE';

  const numTubes = safeTubes.length;
  const spacing = 0.44;
  const startX = -((numTubes - 1) * spacing) / 2;

  const hudOverlay = (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Top Floating Telemetry & Equilibrium Shift Badge */}
      <TelemetryHUD3D
        title={activeTube.name || `Tube ${selectedTubeId + 1}`}
        category={activeTube.tag || 'Equilibrium Sample'}
        ph={isForward ? 2.5 : isReverse ? 3.8 : 3.0}
        volumeMl={activeTube.volumeMl || 10.0}
        temperatureC={25.0}
        customMetrics={
          <>
            <View style={styles.metricGroup}>
              <Text style={styles.metricLabel}>[Fe(SCN)]²⁺ Complex</Text>
              <Text style={[styles.metricVal, { color: color.red }]}>
                {((activeTube.complexConc || 0) * 1000).toFixed(2)} mM
              </Text>
            </View>
            <View style={styles.shiftBadgeWrap}>
              <Text
                style={[
                  styles.shiftStatusText,
                  isForward && { color: color.red },
                  isReverse && { color: color.brass },
                ]}
              >
                {isForward ? '→ Forward' : isReverse ? '← Reverse' : '⇌ Equilibrium'}
              </Text>
            </View>
            <View style={[styles.metricGroup, { alignItems: 'flex-end' }]}>
              <Text style={styles.metricLabel}>Volume</Text>
              <Text style={[styles.metricVal, { color: color.physics }]}>
                {(activeTube.volumeMl || 10.0).toFixed(1)} mL
              </Text>
            </View>
          </>
        }
      />

      {/* Test Tubes Selection Shelf Pills */}
      {safeTubes.length > 1 && (
        <View style={styles.tubeSelectorRow} pointerEvents="box-none">
          {safeTubes.map((t, idx) => {
            const isSelected = selectedTubeId === idx;
            const liqColor = getSolutionColor(t.complexConc);
            return (
              <Pressable
                key={t.id || idx}
                onPress={() => onSelectTube && onSelectTube(idx)}
                style={({ pressed }) => [
                  styles.tubePill,
                  isSelected && styles.tubePillActive,
                  pressed && { opacity: 0.75 },
                ]}
              >
                <View style={[styles.tubeColorDot, { backgroundColor: liqColor }]} />
                <Text style={[styles.tubePillText, isSelected && { color: color.brass }]}>
                  {t.name || `T${idx + 1}`}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );

  return (
    <ChemistryStage
      height={height}
      initialOrbit={{ az: -0.15, el: 0.32, dist: 2.6 }}
      target={[0, 0.45, 0]}
      overlay={hudOverlay}
    >
      {/* 3D Varnished Wooden Test Tube Stand / Rack */}
      <TestTubeRack3D
        numSlots={numTubes}
        slotSpacing={spacing}
        position={[0, 0, 0]}
      />

      {/* Array of 3D Glass Test Tubes with blood-red complex solution */}
      {safeTubes.map((tube, idx) => {
        const posX = startX + idx * spacing;
        const isSelected = selectedTubeId === idx;
        const fluidColor = getSolutionColor(tube.complexConc);
        const fluidHeight = Math.min(0.85, Math.max(0.25, (tube.volumeMl || 10) * 0.05));

        // When selected, test tube is lifted slightly for closer inspection
        const posY = isSelected ? 0.22 : 0.08;
        const rotZ = isSelected ? 0.08 : 0;

        return (
          <group key={tube.id || idx} position={[posX, posY, 0]} rotation={[0, 0, rotZ]}>
            {/* 3D Glass Test Tube */}
            <TestTube3D radius={0.12} height={1.05}>
              <Fluid3D
                color={fluidColor}
                height={fluidHeight}
                radiusTop={0.115}
                radiusBottom={0.115}
                position={[0, 0, 0]}
                opacity={0.88}
              />

              {/* Effervescence Bubbles when complex forms */}
              <EffervescenceBubbles3D
                active={isSelected}
                intensity={0.6}
                liquidBase={[0, 0.08, 0]}
                liquidRadius={0.1}
                liquidHeight={fluidHeight * 0.8}
              />
            </TestTube3D>
          </group>
        );
      })}
    </ChemistryStage>
  );
}

const styles = StyleSheet.create({
  tubeSelectorRow: {
    position: 'absolute',
    bottom: 36,
    left: 8,
    right: 48,
    flexDirection: 'row',
    gap: 5,
    flexWrap: 'wrap',
    zIndex: 15,
  },
  tubePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 253, 248, 0.94)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(28, 24, 21, 0.12)',
  },
  tubePillActive: {
    backgroundColor: 'rgba(255, 253, 248, 0.98)',
    borderColor: color.brass,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  tubeColorDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.15)',
  },
  tubePillText: {
    fontFamily: font.bold,
    fontSize: 9,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: color.inkSoft,
  },
  shiftBadgeWrap: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(28, 24, 21, 0.05)',
  },
  shiftStatusText: {
    fontFamily: font.bold,
    fontSize: 8.5,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: color.inkSoft,
  },
  metricGroup: {
    gap: 1,
  },
  metricLabel: {
    fontFamily: font.bold,
    fontSize: 7.5,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    color: color.inkMuted,
  },
  metricVal: {
    fontFamily: font.bold,
    fontSize: 10,
    fontVariant: ['tabular-nums'],
  },
});
