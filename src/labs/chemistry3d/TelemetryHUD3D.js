import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { color, font, radius } from '../../theme';

/**
 * Floating Context-Aware Telemetry HUD for 3D Chemistry Viewports.
 * Displays real-time ion concentrations, volume, temperature, and pH.
 */
export default function TelemetryHUD3D({
  title = '0.1 M HCl',
  category = 'Strong Acid',
  ph = 1.0,
  volumeMl = 100,
  temperatureC = 25.0,
  hConc = '1.00 × 10⁻¹',
  ohConc = '1.00 × 10⁻¹³',
  customMetrics = null,
  showIonBar = true,
}) {
  const isAcidic = ph < 6.5;
  const isNeutral = ph >= 6.5 && ph <= 7.5;
  const badgeColor = isAcidic ? color.red : isNeutral ? color.chemistry : color.physics;

  return (
    <View style={styles.hudOverlay} pointerEvents="none">
      {/* Top Floating Badge & Specs */}
      <View style={styles.topRow}>
        <View style={styles.titleWrap}>
          <Text style={styles.titleText}>{title}</Text>
          <Text style={styles.categoryText}>{category}</Text>
        </View>

        <View style={styles.rightBadges}>
          <View style={[styles.naturePill, { borderColor: badgeColor + '55' }]}>
            <Text style={[styles.natureText, { color: badgeColor }]}>
              {isAcidic ? 'Acidic' : isNeutral ? 'Neutral' : 'Basic'} · pH {typeof ph === 'number' ? ph.toFixed(2) : ph}
            </Text>
          </View>
          <View style={styles.tempPill}>
            <Text style={styles.tempText}>{temperatureC.toFixed(1)}°C</Text>
          </View>
        </View>
      </View>

      {/* Dynamic Analytical Telemetry Footer */}
      {showIonBar && (
        <View style={styles.telemetryBar}>
          {customMetrics ? (
            customMetrics
          ) : (
            <>
              <View style={styles.metricGroup}>
                <Text style={styles.metricLabel}>[H⁺] Hydronium</Text>
                <Text style={[styles.metricVal, { color: color.red }]}>
                  {hConc} M
                </Text>
              </View>

              <View style={styles.divider}>
                <Text style={styles.volText}>{volumeMl.toFixed(0)} mL</Text>
              </View>

              <View style={[styles.metricGroup, { alignItems: 'flex-end' }]}>
                <Text style={styles.metricLabel}>[OH⁻] Hydroxide</Text>
                <Text style={[styles.metricVal, { color: color.physics }]}>
                  {ohConc} M
                </Text>
              </View>
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  hudOverlay: {
    ...StyleSheet.absoluteFillObject,
    padding: 8,
    justifyContent: 'space-between',
    zIndex: 10,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleWrap: {
    backgroundColor: 'rgba(255, 253, 248, 0.90)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.chip,
    borderWidth: 1,
    borderColor: 'rgba(28, 24, 21, 0.08)',
  },
  titleText: {
    fontFamily: font.bold,
    fontSize: 12.5,
    color: color.inkStrong,
    letterSpacing: -0.2,
  },
  categoryText: {
    fontFamily: font.medium,
    fontSize: 9,
    color: color.inkMuted,
  },
  rightBadges: {
    flexDirection: 'row',
    gap: 5,
  },
  naturePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 253, 248, 0.92)',
    borderWidth: 1,
  },
  natureText: {
    fontFamily: font.bold,
    fontSize: 9,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  tempPill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 253, 248, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(28, 24, 21, 0.1)',
  },
  tempText: {
    fontFamily: font.semibold,
    fontSize: 9,
    color: color.inkSoft,
  },
  telemetryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 253, 248, 0.94)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.chip,
    borderWidth: 1,
    borderColor: 'rgba(28, 24, 21, 0.09)',
    marginRight: 38, // Clearance for camera buttons on the right
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
  divider: {
    alignItems: 'center',
  },
  volText: {
    fontFamily: font.bold,
    fontSize: 8.5,
    color: color.brass,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});
