import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Svg, { Rect, Circle, Line, Path, Defs, LinearGradient, Stop, G } from 'react-native-svg';
import { color, font, radius } from '../../theme';
import { Eyebrow } from '../../components/ui';
import { getSolutionColor } from './chemistry';

export default function FeScnCanvas({
  tubes = [], // array of { id, name, complexConc, label, dropsFe, dropsScn, dropsOxalic }
  selectedTubeId = 0,
  onSelectTube,
  shiftDirection = 'EQUILIBRIUM', // 'FORWARD' | 'REVERSE' | 'EQUILIBRIUM'
  height = 230,
}) {
  return (
    <View style={[styles.canvasWrap, { height }]}>
      {/* Shift status badge */}
      <View style={styles.topBar}>
        <View style={styles.badgeRow}>
          <View
            style={[
              styles.shiftPill,
              shiftDirection === 'FORWARD' && styles.shiftForward,
              shiftDirection === 'REVERSE' && styles.shiftReverse,
            ]}
          >
            <Text
              style={[
                styles.shiftText,
                shiftDirection === 'FORWARD' && { color: '#B23428' },
                shiftDirection === 'REVERSE' && { color: '#96662F' },
              ]}
            >
              {shiftDirection === 'FORWARD'
                ? '→ Equilibrium Shift: Forward (Forming [Fe(SCN)]²⁺)'
                : shiftDirection === 'REVERSE'
                ? '← Equilibrium Shift: Reverse (Dissociating Complex)'
                : '⇌ Dynamic Chemical Equilibrium'}
            </Text>
          </View>
        </View>
      </View>

      {/* Test tube rack illustration */}
      <View style={styles.rackContainer}>
        <View style={styles.rackTopBar} />
        <View style={styles.tubesRow}>
          {tubes.map((t, idx) => {
            const isSelected = selectedTubeId === idx;
            const liquidColor = getSolutionColor(t.complexConc);

            return (
              <Pressable
                key={t.id || idx}
                onPress={() => onSelectTube && onSelectTube(idx)}
                style={[styles.tubeCol, isSelected && styles.tubeColActive]}
              >
                {/* Tube Glass & Fluid */}
                <View style={styles.tubeOuter}>
                  <View style={styles.tubeLip} />
                  <View style={styles.tubeGlass}>
                    {/* Liquid fill */}
                    <View
                      style={[
                        styles.liquidFill,
                        {
                          backgroundColor: liquidColor,
                          height: `${Math.min(85, Math.max(30, (t.volumeMl || 10) * 5.5))}%`,
                        },
                      ]}
                    >
                      <View style={styles.liquidMeniscus} />
                    </View>
                  </View>
                </View>

                <Text style={[styles.tubeName, isSelected && { color: color.brass, fontFamily: font.bold }]}>
                  {t.name || `Tube ${idx + 1}`}
                </Text>
                <Text style={styles.tubeMeta}>{t.tag || 'Sample'}</Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.rackBaseBar} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  canvasWrap: {
    backgroundColor: '#F7F3EB',
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: color.hairline,
    padding: 12,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  topBar: {
    alignItems: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
  },
  shiftPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(28,24,21,0.06)',
    borderWidth: 1,
    borderColor: color.hairline,
  },
  shiftForward: {
    backgroundColor: 'rgba(178,52,40,0.1)',
    borderColor: 'rgba(178,52,40,0.3)',
  },
  shiftReverse: {
    backgroundColor: 'rgba(150,102,47,0.12)',
    borderColor: 'rgba(150,102,47,0.3)',
  },
  shiftText: {
    fontFamily: font.bold,
    fontSize: 10,
    letterSpacing: 0.6,
    color: color.inkSoft,
    textTransform: 'uppercase',
  },
  rackContainer: {
    alignItems: 'center',
    marginTop: 6,
  },
  rackTopBar: {
    width: '92%',
    height: 6,
    backgroundColor: '#D6C8B4',
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#BAA890',
  },
  tubesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '90%',
    paddingVertical: 4,
    gap: 8,
  },
  tubeCol: {
    alignItems: 'center',
    padding: 4,
    borderRadius: 8,
  },
  tubeColActive: {
    backgroundColor: 'rgba(150,102,47,0.08)',
  },
  tubeOuter: {
    alignItems: 'center',
  },
  tubeLip: {
    width: 26,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(200,225,235,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(120,160,180,0.8)',
  },
  tubeGlass: {
    width: 22,
    height: 105,
    backgroundColor: 'rgba(240,248,255,0.35)',
    borderWidth: 1.5,
    borderTopWidth: 0,
    borderColor: 'rgba(120,160,180,0.7)',
    borderBottomLeftRadius: 11,
    borderBottomRightRadius: 11,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  liquidFill: {
    width: '100%',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    position: 'relative',
  },
  liquidMeniscus: {
    position: 'absolute',
    top: 0,
    left: 1,
    right: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  rackBaseBar: {
    width: '96%',
    height: 8,
    backgroundColor: '#C5B29B',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#A89278',
  },
  tubeName: {
    fontFamily: font.semibold,
    fontSize: 10.5,
    color: color.inkBody,
    marginTop: 4,
  },
  tubeMeta: {
    fontFamily: font.medium,
    fontSize: 8.5,
    color: color.inkMuted,
  },
});
