import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { color, font, radius } from '../theme';
import { Eyebrow } from '../components/ui';

/**
 * Digital pH Meter with Glass Combination Electrode, least count 0.01 pH.
 *
 * The student immerses the electrode into the solution to read the stabilized pH.
 * A calibration button allows setting zero offset against standard buffer.
 */
export default function PHMeter({
  apparentPH = 7.0,
  isImmersed = true,
  onToggleImmerse,
  onCalibrate,
  isCalibrated = true,
  label = 'Digital pH Meter (Glass Electrode)',
}) {
  const [powerOn, setPowerOn] = useState(true);

  // When not immersed, electrode reads open ambient air drift (~6.80-7.20 unstable)
  const displayValue = !powerOn
    ? '---'
    : isImmersed
    ? apparentPH.toFixed(2)
    : '7.02';

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <View>
          <Eyebrow>{label}</Eyebrow>
          <Text style={styles.subMeta}>ATC @ 25.0 °C · Ag/AgCl Reference</Text>
        </View>
        <Text style={styles.lc}>L.C. 0.01 pH</Text>
      </View>

      {/* Meter housing with LCD screen and Probe status */}
      <View style={styles.meterBody}>
        {/* LCD Panel */}
        <View style={styles.lcdWrap}>
          <View style={styles.lcdHeader}>
            <View style={styles.statusGroup}>
              <View style={[styles.ledDot, powerOn && isImmersed && styles.ledReady]} />
              <Text style={styles.lcdStatus}>
                {!powerOn ? 'OFF' : isImmersed ? 'STABLE' : 'DRY / AIR'}
              </Text>
            </View>
            <Text style={styles.lcdTemp}>25.0 °C</Text>
          </View>

          <View style={styles.displayRow}>
            <Text style={[styles.lcdDigits, !powerOn && { opacity: 0.2 }]}>{displayValue}</Text>
            <Text style={styles.lcdUnit}>pH</Text>
          </View>

          <View style={styles.lcdFooter}>
            <Text style={styles.footerText}>
              {isCalibrated ? 'CAL: 2-PT OK' : 'UNCALIBRATED (OFFSET DETECTED)'}
            </Text>
          </View>
        </View>

        {/* Electrode Visual Graphic */}
        <View style={styles.probeSide}>
          <View style={styles.probeCable} />
          <View style={styles.probeBody}>
            <View style={styles.probeCollar} />
            <View style={styles.glassShaft}>
              <View style={styles.internalWire} />
              <View
                style={[
                  styles.glassBulb,
                  isImmersed && { backgroundColor: 'rgba(47,142,108,0.3)' },
                ]}
              />
            </View>
          </View>
          <Text style={styles.probeLabel}>
            {isImmersed ? 'Probe in solution' : 'Probe in air'}
          </Text>
        </View>
      </View>

      {/* Control Buttons */}
      <View style={styles.btnRow}>
        <Pressable
          onPress={() => {
            if (onToggleImmerse) onToggleImmerse();
          }}
          style={({ pressed }) => [
            styles.actionBtn,
            isImmersed && styles.actionBtnActive,
            pressed && { opacity: 0.8 },
          ]}
        >
          <Text style={[styles.actionBtnText, isImmersed && { color: color.onGold }]}>
            {isImmersed ? 'Lift Probe' : 'Immerse Probe'}
          </Text>
        </Pressable>

        {onCalibrate ? (
          <Pressable
            onPress={onCalibrate}
            style={({ pressed }) => [
              styles.actionBtn,
              isCalibrated && styles.calibratedBtn,
              pressed && { opacity: 0.8 },
            ]}
          >
            <Text style={[styles.actionBtnText, isCalibrated && { color: color.green }]}>
              {isCalibrated ? '✓ Calibrated' : 'Calibrate (pH 7.00)'}
            </Text>
          </Pressable>
        ) : null}

        <Pressable
          onPress={() => setPowerOn((p) => !p)}
          style={({ pressed }) => [styles.pwrBtn, pressed && { opacity: 0.8 }]}
        >
          <Text style={styles.pwrText}>{powerOn ? 'PWR OFF' : 'PWR ON'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: color.hairline,
    borderRadius: radius.tile,
    backgroundColor: color.paper,
    padding: 15,
    gap: 12,
  },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  subMeta: {
    fontFamily: font.medium,
    fontSize: 9.5,
    color: color.inkMuted,
    marginTop: 2,
  },
  lc: {
    fontFamily: font.bold,
    fontSize: 9,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: color.inkMuted,
  },
  meterBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  lcdWrap: {
    flex: 1,
    backgroundColor: '#161B18',
    borderRadius: radius.chip,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#26332C',
  },
  lcdHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  ledDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#666',
  },
  ledReady: {
    backgroundColor: '#2F8E6C',
  },
  lcdStatus: {
    fontFamily: font.bold,
    fontSize: 8.5,
    letterSpacing: 1,
    color: 'rgba(255,255,255,0.6)',
  },
  lcdTemp: {
    fontFamily: font.semibold,
    fontSize: 9,
    color: 'rgba(255,255,255,0.5)',
    fontVariant: ['tabular-nums'],
  },
  displayRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'flex-end',
    gap: 6,
    paddingVertical: 6,
  },
  lcdDigits: {
    fontFamily: font.bold,
    fontSize: 34,
    letterSpacing: -1,
    color: '#8EE0A8',
    fontVariant: ['tabular-nums'],
  },
  lcdUnit: {
    fontFamily: font.bold,
    fontSize: 14,
    color: 'rgba(142,224,168,0.7)',
  },
  lcdFooter: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 4,
  },
  footerText: {
    fontFamily: font.bold,
    fontSize: 8,
    letterSpacing: 0.8,
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
  },
  probeSide: {
    alignItems: 'center',
    width: 80,
    backgroundColor: 'rgba(28,24,21,0.03)',
    borderRadius: radius.chip,
    paddingVertical: 8,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: color.hairline,
  },
  probeCable: {
    width: 3,
    height: 10,
    backgroundColor: '#4A423A',
  },
  probeBody: {
    alignItems: 'center',
  },
  probeCollar: {
    width: 14,
    height: 6,
    borderRadius: 2,
    backgroundColor: '#2E2822',
  },
  glassShaft: {
    width: 10,
    height: 38,
    backgroundColor: 'rgba(200,225,235,0.4)',
    borderWidth: 1,
    borderColor: 'rgba(120,160,180,0.6)',
    alignItems: 'center',
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
    overflow: 'hidden',
  },
  internalWire: {
    width: 1.5,
    height: 30,
    backgroundColor: '#B08030',
  },
  glassBulb: {
    position: 'absolute',
    bottom: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(100,180,240,0.5)',
  },
  probeLabel: {
    fontFamily: font.medium,
    fontSize: 8.5,
    color: color.inkMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 2,
    paddingVertical: 10,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: 'rgba(28,24,21,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnActive: {
    backgroundColor: color.goldTop,
    borderColor: color.goldBottom,
  },
  actionBtnText: {
    fontFamily: font.bold,
    fontSize: 10.5,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: color.inkSoft,
  },
  calibratedBtn: {
    borderColor: 'rgba(47,142,108,0.4)',
    backgroundColor: 'rgba(47,142,108,0.08)',
  },
  pwrBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: 'rgba(28,24,21,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pwrText: {
    fontFamily: font.bold,
    fontSize: 9.5,
    letterSpacing: 0.8,
    color: color.inkMuted,
  },
});
