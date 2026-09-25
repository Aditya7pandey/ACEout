import React, { useRef, useState, useCallback } from 'react';
import { View, StyleSheet, PanResponder } from 'react-native';
import { Text } from '../i18n';
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
  onSlideStart,
  onSlideEnd,
  label,
  display,
  tone = color.brass,
  marks = [],
  rangeZone = null, // { start, end, color }
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

  // The PanResponder is built once and would otherwise keep the props it saw on
  // the first render for the life of the component. Everything it needs is read
  // through this ref instead, which is refreshed every render.
  const live = useRef({});
  live.current = { setFromX, onSlideStart, onSlideEnd };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        live.current.onSlideStart?.();
        live.current.setFromX(e.nativeEvent.locationX);
      },
      onPanResponderMove: (e, gs) => {
        live.current.setFromX(gs.x0 - originRef.current + gs.dx);
      },
      onPanResponderRelease: () => live.current.onSlideEnd?.(),
      onPanResponderTerminate: () => live.current.onSlideEnd?.(),
    })
  ).current;

  const originRef = useRef(0);
  const containerRef = useRef(null);

  const frac = max === min ? 0 : (value - min) / (max - min);

  // Compute non-overlapping label layout
  const labeledMarks = marks.filter((m) => m.label);
  const markPositions = labeledMarks.map((m, idx) => {
    const f = max === min ? 0 : (m.value - min) / (max - min);
    return {
      mark: m,
      idealX: f * width,
      idx,
    };
  });

  // Adjust label x positions to prevent overlapping
  const labelWidth = 48;
  const minSpacing = 44;
  for (let i = 1; i < markPositions.length; i++) {
    const prev = markPositions[i - 1];
    const curr = markPositions[i];
    if (curr.idealX - prev.idealX < minSpacing) {
      const overlap = minSpacing - (curr.idealX - prev.idealX);
      prev.idealX = Math.max(labelWidth / 2, prev.idealX - overlap / 2);
      curr.idealX = Math.min(width - labelWidth / 2, curr.idealX + overlap / 2);
    }
  }

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
          {/* Optional Range Highlight Zone */}
          {rangeZone && width > 0 ? (
            <View
              style={[
                styles.rangeZone,
                {
                  left: `${Math.max(0, (rangeZone.start - min) / (max - min)) * 100}%`,
                  width: `${Math.max(0, (rangeZone.end - rangeZone.start) / (max - min)) * 100}%`,
                  backgroundColor: rangeZone.color || 'rgba(150,102,47,0.25)',
                },
              ]}
            />
          ) : null}

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

      {labeledMarks.length > 0 && width > 0 ? (
        <View style={styles.markLabels} pointerEvents="none">
          {markPositions.map(({ mark, idealX }) => {
            const clampedLeft = Math.max(0, Math.min(width - labelWidth, idealX - labelWidth / 2));
            return (
              <Text
                key={`l-${mark.value}-${mark.label}`}
                style={[
                  styles.markLabel,
                  {
                    left: clampedLeft,
                    color: mark.color || color.inkMuted,
                  },
                ]}
                numberOfLines={1}
              >
                {mark.label}
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
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(28,24,21,0.11)',
    overflow: 'hidden',
    position: 'relative',
  },
  rangeZone: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    borderRadius: 2,
  },
  fill: { height: '100%', borderRadius: 2 },
  mark: { position: 'absolute', width: 1.5, height: 12, top: 11 },
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
  markLabels: { height: 14, position: 'relative' },
  markLabel: {
    position: 'absolute',
    width: 48,
    textAlign: 'center',
    fontFamily: font.bold,
    fontSize: 8.5,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
