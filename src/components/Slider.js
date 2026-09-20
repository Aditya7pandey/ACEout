import React, { useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, PanResponder } from 'react-native';
import { color, font, type } from '../theme';

/**
 * Minimal slider matching the paper/brass design. Kept in-house so the track
 * can carry lab-specific decoration (limit marks, danger zones).
 */
export default function Slider({
  value,
  min,
  max,
  step = 0.01,
  onChange,
  label,
  display,
  tone = color.brass,
  marks = [],
  disabled,
  style,
}) {
  const [width, setWidth] = useState(0);
  const widthRef = useRef(0);

  const clampToStep = useCallback(
    (v) => {
      const stepped = Math.round((v - min) / step) * step + min;
      return Math.min(max, Math.max(min, Number(stepped.toFixed(6))));
    },
    [min, max, step]
  );

  const setFromX = useCallback(
    (x) => {
      const w = widthRef.current;
      if (!w) return;
      const frac = Math.min(1, Math.max(0, x / w));
      onChange(clampToStep(min + frac * (max - min)));
    },
    [min, max, clampToStep, onChange]
  );

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => setFromX(e.nativeEvent.locationX),
      onPanResponderMove: (e, gs) => {
        // locationX is unreliable mid-drag on Android; derive from the grant point.
        setFromX(gs.x0 - originRef.current + gs.dx);
      },
    })
  ).current;

  const originRef = useRef(0);
  const containerRef = useRef(null);

  const frac = max === min ? 0 : (value - min) / (max - min);

  return (
    <View style={[styles.wrap, disabled && { opacity: 0.4 }, style]}>
      {(label || display) && (
        <View style={styles.headRow}>
          {label ? <Text style={type.eyebrowTight}>{label}</Text> : <View />}
          {display ? (
            <Text style={[styles.value, { color: tone }]}>{display}</Text>
          ) : null}
        </View>
      )}
      <View
        ref={containerRef}
        style={styles.touch}
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          widthRef.current = w;
          setWidth(w);
          containerRef.current?.measureInWindow?.((x) => {
            originRef.current = x;
          });
        }}
        {...(disabled ? {} : pan.panHandlers)}
      >
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${frac * 100}%`, backgroundColor: tone }]} />
        </View>
        {marks.map((m) => {
          const f = max === min ? 0 : (m.value - min) / (max - min);
          return (
            <View
              key={`${m.value}-${m.label ?? ''}`}
              pointerEvents="none"
              style={[styles.mark, { left: f * width, backgroundColor: m.color || color.edge }]}
            />
          );
        })}
        <View
          pointerEvents="none"
          style={[styles.thumb, { left: frac * width - 11, borderColor: tone }]}
        />
      </View>
      {marks.some((m) => m.label) && width > 0 ? (
        <View style={styles.markLabels} pointerEvents="none">
          {marks
            .filter((m) => m.label)
            .map((m) => {
              const f = max === min ? 0 : (m.value - min) / (max - min);
              return (
                <Text
                  key={`l-${m.value}`}
                  style={[styles.markLabel, { left: Math.max(0, f * width - 28) }]}
                >
                  {m.label}
                </Text>
              );
            })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 9 },
  headRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  value: {
    fontFamily: font.bold,
    fontSize: 16,
    letterSpacing: -0.3,
    fontVariant: ['tabular-nums'],
  },
  touch: { height: 34, justifyContent: 'center' },
  track: {
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(28,24,21,0.11)',
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: 2 },
  mark: { position: 'absolute', width: 1, height: 11, top: 11.5 },
  thumb: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: color.paper,
    borderWidth: 2,
    shadowColor: '#4A3C28',
    shadowOpacity: 0.18,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  markLabels: { height: 12 },
  markLabel: {
    position: 'absolute',
    width: 56,
    textAlign: 'center',
    fontFamily: font.bold,
    fontSize: 8.5,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: color.inkMuted,
  },
});
