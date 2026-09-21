import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { color, font, radius } from '../../theme';
import { getUniversalColor } from '../../instruments/PHColorScale';
import { getHydroniumConc, getHydroxideConc, formatScientific } from './chemistry';
import ChemistryStage from '../chemistry3d/ChemistryStage';
import { Beaker3D } from '../chemistry3d/Glassware3D';
import Fluid3D from '../chemistry3d/Fluid3D';
import { PhPaperStrip3D, PhProbe3D } from '../chemistry3d/DippingProbes3D';
import { EffervescenceBubbles3D, ThermalVaporSmoke3D } from '../chemistry3d/ParticleSystems3D';
import TelemetryHUD3D from '../chemistry3d/TelemetryHUD3D';

/**
 * Real-time Interactive 3D Bench for pH Determination.
 * Features dynamic volume fluid scaling, realistic physical color physics,
 * dipping pH indicator strips, glass electrode sensor immersion, and floating telemetry HUD.
 */
export default function PhCanvas({
  solutionName = '0.1 M HCl',
  solutionCategory = 'Strong Acid',
  ph = 1.0,
  volumeMl = 100,
  paperDipped = false,
  probeImmersed = true,
  onDipPaper,
  onToggleProbe,
  height = 245,
}) {
  const [temperatureC] = useState(25.0);
  const paperColor = getUniversalColor(ph);
  const hConc = getHydroniumConc(ph);
  const ohConc = getHydroxideConc(ph);

  // Scaled fluid column in 250 mL beaker
  const safeVol = Math.max(0, volumeMl);
  const fluidHeight = safeVol <= 0 ? 0.001 : Math.min(0.82, Math.max(0.06, (safeVol / 250) * 0.82));

  // Fluid color tint according to solution nature
  let fluidTint = '#F0F8FF';
  if (solutionName.toLowerCase().includes('tomato')) {
    fluidTint = '#E89080';
  } else if (solutionName.toLowerCase().includes('lemon')) {
    fluidTint = '#F5EDB0';
  } else if (solutionName.toLowerCase().includes('magnesia')) {
    fluidTint = '#E8ECEF';
  } else if (ph < 3.0) {
    fluidTint = '#FCE8E6';
  } else if (ph > 11.0) {
    fluidTint = '#E6F0FA';
  } else {
    fluidTint = '#F2F8FC';
  }

  const hudOverlay = (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Top Floating Telemetry & Solution Nature */}
      <TelemetryHUD3D
        title={solutionName}
        category={solutionCategory}
        ph={ph}
        volumeMl={safeVol}
        temperatureC={temperatureC}
        hConc={formatScientific(hConc)}
        ohConc={formatScientific(ohConc)}
      />

      {/* Floating Apparatus Spatial Action Pills */}
      <View style={styles.actionRow} pointerEvents="box-none">
        <Pressable
          onPress={onDipPaper}
          style={({ pressed }) => [
            styles.actionPill,
            paperDipped && styles.actionPillActive,
            pressed && { opacity: 0.75 },
          ]}
        >
          <View
            style={[
              styles.colorDot,
              { backgroundColor: paperDipped ? paperColor : '#EFE8D3' },
            ]}
          />
          <Text style={[styles.actionText, paperDipped && { color: color.brass }]}>
            {paperDipped ? 'Strip Dipped' : 'Dip pH Strip'}
          </Text>
        </Pressable>

        <Pressable
          onPress={onToggleProbe}
          style={({ pressed }) => [
            styles.actionPill,
            probeImmersed && styles.actionPillActive,
            pressed && { opacity: 0.75 },
          ]}
        >
          <View
            style={[
              styles.colorDot,
              { backgroundColor: probeImmersed ? '#2F8E6C' : '#6E675E' },
            ]}
          />
          <Text style={[styles.actionText, probeImmersed && { color: color.brass }]}>
            {probeImmersed ? 'Probe Immersed' : 'Lift Probe'}
          </Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <ChemistryStage
      height={height}
      initialOrbit={{ az: -0.28, el: 0.35, dist: 2.45 }}
      target={[0, 0.42, 0]}
      overlay={hudOverlay}
    >
      {/* Central 250 mL Laboratory Beaker */}
      <Beaker3D position={[0, 0, 0]} radius={0.42} height={0.92}>
        {/* Dynamic 3D Fluid Column with Meniscus */}
        {safeVol > 0 && (
          <Fluid3D
            color={fluidTint}
            height={fluidHeight}
            radiusTop={0.41}
            radiusBottom={0.4}
            position={[0, 0, 0]}
            opacity={solutionName.toLowerCase().includes('tomato') ? 0.9 : 0.68}
          />
        )}

        {/* Effervescence Bubbles in Acidic / Active Solutions */}
        <EffervescenceBubbles3D
          active={safeVol > 0 && (ph < 3.5 || ph > 12.5)}
          intensity={ph < 2.0 ? 1.4 : 0.6}
          liquidBase={[0, 0.05, 0]}
          liquidRadius={0.38}
          liquidHeight={fluidHeight}
        />

        {/* Subtle Vapor for Volatile Solutions */}
        <ThermalVaporSmoke3D
          active={safeVol > 0 && ph < 2.0}
          origin={[0, Math.max(0.4, fluidHeight + 0.05), 0]}
          radius={0.32}
          temperature={38}
        />
      </Beaker3D>

      {/* 3D pH Universal Indicator Paper Strip */}
      <PhPaperStrip3D
        position={[-0.52, 0.52, 0.1]}
        isDipped={paperDipped}
        dipColor={paperColor}
      />

      {/* 3D Glass pH Electrode Sensor Probe */}
      <PhProbe3D
        position={[0.52, 0.58, -0.05]}
        isImmersed={probeImmersed}
        bulbColor={ph < 6.5 ? '#B23428' : ph <= 7.5 ? '#2F8E6C' : '#4668AE'}
      />
    </ChemistryStage>
  );
}

const styles = StyleSheet.create({
  actionRow: {
    position: 'absolute',
    bottom: 34,
    left: 8,
    right: 48,
    flexDirection: 'row',
    gap: 6,
    zIndex: 15,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 253, 248, 0.94)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(28, 24, 21, 0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  actionPillActive: {
    backgroundColor: 'rgba(255, 253, 248, 0.98)',
    borderColor: color.brass,
  },
  colorDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.15)',
  },
  actionText: {
    fontFamily: font.bold,
    fontSize: 9,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: color.inkSoft,
  },
});
