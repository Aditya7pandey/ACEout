import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Svg, { Rect, Circle, Line, Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { color, font, radius } from '../../theme';
import { Eyebrow } from '../../components/ui';
import { getIndicatorColor, INDICATORS } from './chemistry';

export default function IndicatorsCanvas({
  solutions = [], // array of { id, name, ph, drops, indicatorKey }
  selectedIdx = 0,
  onSelectSolution,
  activeIndicator = 'phenolphthalein',
  onAddDrop,
  height = 230,
}) {
  const currentInd = INDICATORS[activeIndicator] || INDICATORS.phenolphthalein;

  return (
    <View style={[styles.wrap, { height }]}>
      {/* Top Indicator info & Transition bar */}
      <View style={styles.topInfo}>
        <View style={styles.indicatorBadge}>
          <Text style={styles.indicatorName}>{currentInd.name}</Text>
          <Text style={styles.indicatorRange}>{currentInd.transitionDesc}</Text>
        </View>
      </View>

      {/* Beakers Row */}
      <View style={styles.beakersRow}>
        {solutions.map((sol, idx) => {
          const isSelected = selectedIdx === idx;
          const fluidColor = getIndicatorColor(sol.indicatorKey || activeIndicator, sol.ph, sol.drops || 0);

          return (
            <Pressable
              key={sol.id || idx}
              onPress={() => onSelectSolution && onSelectSolution(idx)}
              style={[styles.beakerWrap, isSelected && styles.beakerWrapSelected]}
            >
              {/* Beaker Container */}
              <View style={styles.beakerGlass}>
                <View style={styles.beakerLip} />
                <View style={styles.glassBody}>
                  {/* Graduation marks */}
                  <View style={styles.gradLine1} />
                  <View style={styles.gradLine2} />
                  <View style={styles.gradLine3} />

                  {/* Liquid fill */}
                  <View style={[styles.liquid, { backgroundColor: fluidColor }]}>
                    <View style={styles.meniscus} />
                  </View>
                </View>
              </View>

              <Text style={[styles.solTitle, isSelected && { color: color.brass, fontFamily: font.bold }]}>
                {sol.name}
              </Text>
              <Text style={styles.solDrops}>
                {sol.drops ? `${sol.drops} drops` : 'No indicator'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Pipette Dropper Trigger */}
      {onAddDrop ? (
        <Pressable
          onPress={onAddDrop}
          style={({ pressed }) => [styles.dropperAction, pressed && { opacity: 0.8 }]}
        >
          <Text style={styles.dropperIcon}>💧</Text>
          <Text style={styles.dropperActionText}>
            Add 1 Drop of {currentInd.name} to Selected Beaker
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#F7F3EB',
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: color.hairline,
    padding: 12,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  topInfo: {
    alignItems: 'center',
  },
  indicatorBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(28,24,21,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: color.hairline,
    gap: 1,
  },
  indicatorName: {
    fontFamily: font.bold,
    fontSize: 11,
    color: color.inkStrong,
    letterSpacing: 0.5,
  },
  indicatorRange: {
    fontFamily: font.medium,
    fontSize: 9,
    color: color.inkMuted,
  },
  beakersRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    paddingVertical: 4,
    gap: 6,
  },
  beakerWrap: {
    alignItems: 'center',
    padding: 6,
    borderRadius: 10,
  },
  beakerWrapSelected: {
    backgroundColor: 'rgba(150,102,47,0.08)',
  },
  beakerGlass: {
    alignItems: 'center',
  },
  beakerLip: {
    width: 48,
    height: 3,
    backgroundColor: 'rgba(160,190,210,0.8)',
    borderRadius: 2,
    borderWidth: 0.8,
    borderColor: 'rgba(120,160,180,0.9)',
  },
  glassBody: {
    width: 44,
    height: 70,
    backgroundColor: 'rgba(240,248,255,0.4)',
    borderWidth: 1.5,
    borderTopWidth: 0,
    borderColor: 'rgba(120,160,180,0.7)',
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    position: 'relative',
  },
  gradLine1: {
    position: 'absolute',
    top: 15,
    right: 3,
    width: 8,
    height: 1,
    backgroundColor: 'rgba(120,160,180,0.5)',
  },
  gradLine2: {
    position: 'absolute',
    top: 30,
    right: 3,
    width: 12,
    height: 1,
    backgroundColor: 'rgba(120,160,180,0.5)',
  },
  gradLine3: {
    position: 'absolute',
    top: 45,
    right: 3,
    width: 8,
    height: 1,
    backgroundColor: 'rgba(120,160,180,0.5)',
  },
  liquid: {
    width: '100%',
    height: '65%',
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
    position: 'relative',
  },
  meniscus: {
    position: 'absolute',
    top: 0,
    left: 1,
    right: 1,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.45)',
    borderRadius: 2,
  },
  solTitle: {
    fontFamily: font.semibold,
    fontSize: 10.5,
    color: color.inkBody,
    marginTop: 4,
    textAlign: 'center',
  },
  solDrops: {
    fontFamily: font.medium,
    fontSize: 8.5,
    color: color.inkMuted,
  },
  dropperAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.paper,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: color.hairline,
    borderRadius: radius.pill,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
  },
  dropperIcon: {
    fontSize: 13,
  },
  dropperActionText: {
    fontFamily: font.bold,
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: color.inkSoft,
  },
});
