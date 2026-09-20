import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { color, font, type, radius } from '../theme';
import { Eyebrow } from '../components/ui';

/**
 * A stopwatch the student actually has to run.
 *
 * It is deliberately NOT wired to the simulation clock: you press start when
 * you think the block moved and stop when you think it crossed the gate. Your
 * own reaction time is part of the reading, which is the whole point.
 *
 * Least count 0.01 s — the display never shows a third decimal.
 */
export default function Stopwatch({
  onLap,
  zeroOffsetS = 0,
  startDelayS = 0,
  disabled,
  compact,
  label = 'Stopwatch',
}) {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const startRef = useRef(0);
  const rafRef = useRef(null);

  // A sticky start button means the count begins after the press, so the
  // watch under-reads every interval by the same amount.
  const readWatch = useCallback(
    () => Math.max(0, (Date.now() - startRef.current) / 1000 - startDelayS),
    [startDelayS]
  );

  const tick = useCallback(() => {
    setElapsed(readWatch());
    rafRef.current = requestAnimationFrame(tick);
  }, [readWatch]);

  useEffect(() => {
    if (running) {
      rafRef.current = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(rafRef.current);
    }
    return undefined;
  }, [running, tick]);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  const press = () => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    if (running) {
      const total = readWatch();
      setRunning(false);
      setElapsed(total);
      onLap?.(truncate(total + zeroOffsetS));
    } else {
      startRef.current = Date.now();
      setElapsed(0);
      setRunning(true);
    }
  };

  const reset = () => {
    setRunning(false);
    setElapsed(0);
  };

  const shown = truncate(elapsed + (running || elapsed > 0 ? zeroOffsetS : 0));

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <View style={styles.head}>
        <Eyebrow>{label}</Eyebrow>
        <Text style={styles.lc}>L.C. 0.01 s</Text>
      </View>

      <Text style={[styles.readout, running && { color: color.brass }]}>
        {formatWatch(shown)}
      </Text>

      <View style={styles.row}>
        <Pressable
          onPress={press}
          disabled={disabled}
          style={({ pressed }) => [
            styles.big,
            running ? styles.bigStop : styles.bigStart,
            disabled && { opacity: 0.35 },
            pressed && { transform: [{ scale: 0.97 }] },
          ]}
        >
          <Text style={[styles.bigLabel, running && { color: '#FFF3F0' }]}>
            {running ? 'Stop' : 'Start'}
          </Text>
        </Pressable>
        <Pressable
          onPress={reset}
          disabled={running}
          style={({ pressed }) => [
            styles.small,
            running && { opacity: 0.3 },
            pressed && { backgroundColor: 'rgba(28,24,21,0.06)' },
          ]}
        >
          <Text style={styles.smallLabel}>Reset</Text>
        </Pressable>
      </View>
    </View>
  );
}

/** A stopwatch truncates, it does not round up to a graduation it never showed. */
export function truncate(seconds) {
  return Math.floor(Math.max(0, seconds) * 100) / 100;
}

export function formatWatch(seconds) {
  const s = Math.max(0, seconds);
  const mins = Math.floor(s / 60);
  const secs = Math.floor(s % 60);
  const cents = Math.floor((s * 100) % 100);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(
    cents
  ).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: color.hairline,
    borderRadius: radius.tile,
    backgroundColor: color.paper,
    padding: 16,
    gap: 12,
  },
  wrapCompact: { padding: 13, gap: 9 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  lc: {
    fontFamily: font.bold,
    fontSize: 9,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: color.inkMuted,
  },
  readout: {
    fontFamily: font.bold,
    fontSize: 40,
    letterSpacing: -1.6,
    color: color.ink,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  row: { flexDirection: 'row', gap: 9 },
  big: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  bigStart: { backgroundColor: color.green },
  bigStop: { backgroundColor: color.red },
  bigLabel: {
    fontFamily: font.extra,
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: '#F2FBF7',
  },
  small: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: 'rgba(28,24,21,0.16)',
  },
  smallLabel: {
    fontFamily: font.bold,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: color.inkSoft,
  },
});
