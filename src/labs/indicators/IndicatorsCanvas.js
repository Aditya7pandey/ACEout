import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { color, font, radius } from '../../theme';
import { INDICATORS, getIndicatorColor } from './chemistry';
import ChemistryStage from '../chemistry3d/ChemistryStage';
import { Beaker3D, DropperPipette3D } from '../chemistry3d/Glassware3D';
import Fluid3D from '../chemistry3d/Fluid3D';
import { PouringStream3D } from '../chemistry3d/ParticleSystems3D';
import TelemetryHUD3D from '../chemistry3d/TelemetryHUD3D';

/**
 * Real-time Interactive 3D Bench for Acid-Base Indicators Lab.
 * Features 3D beakers array, 3D animated dropper pipette, dynamic fluid mixing,
 * and real-time color transitions.
 */
export default function IndicatorsCanvas({
  solutions = [],
  selectedIdx = 0,
  onSelectSolution,
  activeIndicator = 'phenolphthalein',
  onAddDrop,
  height = 245,
}) {
  const currentInd = INDICATORS[activeIndicator] || INDICATORS.phenolphthalein;
  const safeSolutions = solutions && solutions.length > 0 ? solutions : [
    { id: 'custom', name: 'Solution (pH 7.0)', ph: 7.0, drops: 0, indicatorKey: activeIndicator },
  ];

  const activeSol = safeSolutions[selectedIdx] || safeSolutions[0];
  
  // Dropper animation state
  const [isDropping, setIsDropping] = useState(false);

  const handleAddDrop = () => {
    if (onAddDrop) {
      setIsDropping(true);
      onAddDrop();
      setTimeout(() => setIsDropping(false), 550);
    }
  };

  // Compute 3D positions for the solutions
  const numSols = safeSolutions.length;
  const spacing = 0.72;
  const startX = -((numSols - 1) * spacing) / 2;

  const hudOverlay = (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Top Floating Telemetry Info */}
      <TelemetryHUD3D
        title={activeSol.name || 'Test Solution'}
        category={`Indicator: ${currentInd.name}`}
        ph={activeSol.ph}
        volumeMl={50 + (activeSol.drops || 0) * 0.5}
        temperatureC={25.0}
        customMetrics={
          <>
            <View style={styles.metricGroupGrow}>
              <Text style={styles.metricLabel} numberOfLines={1}>Active Indicator</Text>
              <Text style={[styles.metricVal, { color: color.brass }]} numberOfLines={1} ellipsizeMode="tail">
                {currentInd.short} · {currentInd.transitionDesc}
              </Text>
            </View>
            <View style={styles.metricGroupFixed}>
              <Text style={[styles.metricLabel, { textAlign: 'right' }]} numberOfLines={1}>Dosage</Text>
              <Text style={[styles.metricVal, { color: color.chemistry, textAlign: 'right' }]} numberOfLines={1}>
                {activeSol.drops || 0} drops
              </Text>
            </View>
          </>
        }
      />

      {/* Solutions Selection Pills & Pipette Trigger Bar */}
      <View style={styles.bottomControls} pointerEvents="box-none">
        {safeSolutions.length > 1 && (
          <View style={styles.selectorRow} pointerEvents="box-none">
            {safeSolutions.map((sol, idx) => {
              const isSelected = selectedIdx === idx;
              const fluidClr = getIndicatorColor(sol.indicatorKey || activeIndicator, sol.ph, sol.drops || 0);
              return (
                <Pressable
                  key={sol.id || idx}
                  onPress={() => onSelectSolution && onSelectSolution(idx)}
                  style={({ pressed }) => [
                    styles.solPill,
                    isSelected && styles.solPillActive,
                    pressed && { opacity: 0.75 },
                  ]}
                >
                  <View style={[styles.fluidColorDot, { backgroundColor: fluidClr }]} />
                  <Text style={[styles.solPillText, isSelected && { color: color.brass }]}>
                    {sol.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {onAddDrop ? (
          <Pressable
            onPress={handleAddDrop}
            style={({ pressed }) => [
              styles.dropperAction,
              isDropping && styles.dropperActionActive,
              pressed && { opacity: 0.75 },
            ]}
          >
            <Text style={styles.dropperIcon}>💧</Text>
            <Text style={styles.dropperActionText}>
              Add 1 Drop of {currentInd.name}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );

  return (
    <ChemistryStage
      height={height}
      initialOrbit={{ az: 0, el: 0.38, dist: 2.55 }}
      target={[0, 0.35, 0]}
      overlay={hudOverlay}
    >
      {/* Array of 3D Glass Beakers with dynamic fluid colors */}
      {safeSolutions.map((sol, idx) => {
        const posX = startX + idx * spacing;
        const isSelected = selectedIdx === idx;
        const fluidColor = getIndicatorColor(
          sol.indicatorKey || activeIndicator,
          sol.ph,
          sol.drops || 0
        );

        return (
          <group key={sol.id || idx} position={[posX, 0, 0]}>
            {/* Selection Highlight Base Ring */}
            {isSelected && (
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
                <ringGeometry args={[0.34, 0.39, 32]} />
                <meshBasicMaterial
                  color="#D4A458"
                  transparent
                  opacity={0.7}
                />
              </mesh>
            )}

            {/* 3D Glass Beaker */}
            <Beaker3D radius={0.32} height={0.75} position={[0, 0, 0]}>
              <Fluid3D
                color={fluidColor}
                height={0.46}
                radiusTop={0.31}
                radiusBottom={0.3}
                position={[0, 0, 0]}
                opacity={sol.drops > 0 ? 0.88 : 0.65}
              />
            </Beaker3D>

            {/* Floating Dropper Pipette directly above the selected beaker */}
            {isSelected && (
              <>
                <DropperPipette3D
                  position={[0, isDropping ? 0.95 : 1.15, 0]}
                  bulbColor={currentInd.baseColor}
                />
                <PouringStream3D
                  active={isDropping}
                  startPos={[0, 0.95, 0]}
                  endPos={[0, 0.46, 0]}
                  color={currentInd.baseColor}
                  count={16}
                  flowSpeed={3.0}
                />
              </>
            )}
          </group>
        );
      })}
    </ChemistryStage>
  );
}

const styles = StyleSheet.create({
  bottomControls: {
    position: 'absolute',
    bottom: 34,
    left: 8,
    right: 48,
    gap: 5,
    zIndex: 15,
  },
  selectorRow: {
    flexDirection: 'row',
    gap: 5,
    flexWrap: 'wrap',
  },
  solPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 253, 248, 0.92)',
    paddingVertical: 3.5,
    paddingHorizontal: 7,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(28, 24, 21, 0.12)',
  },
  solPillActive: {
    backgroundColor: 'rgba(255, 253, 248, 0.98)',
    borderColor: color.brass,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  fluidColorDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.15)',
  },
  solPillText: {
    fontFamily: font.bold,
    fontSize: 8.5,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: color.inkSoft,
  },
  dropperAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 253, 248, 0.96)',
    borderWidth: 1,
    borderColor: 'rgba(28, 24, 21, 0.14)',
    borderRadius: radius.pill,
    paddingVertical: 5,
    paddingHorizontal: 10,
    gap: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  dropperActionActive: {
    backgroundColor: 'rgba(255, 245, 230, 0.98)',
    borderColor: color.brass,
  },
  dropperIcon: {
    fontSize: 11,
  },
  dropperActionText: {
    fontFamily: font.bold,
    fontSize: 9,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: color.inkStrong,
  },
  metricGroupGrow: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  metricGroupFixed: {
    flexShrink: 0,
    paddingLeft: 8,
    gap: 1,
  },
  metricGroup: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  metricLabel: {
    fontFamily: font.bold,
    fontSize: 7,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: color.inkMuted,
  },
  metricVal: {
    fontFamily: font.bold,
    fontSize: 9.5,
    fontVariant: ['tabular-nums'],
  },
});
