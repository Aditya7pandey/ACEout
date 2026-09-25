import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { color, font, radius, bevel } from '../../theme';
import { Text } from '../../i18n';
import Slider from '../../components/Slider';
import InclineScene2D from './InclineScene2D';
import { MASS, TRACK_CM, SLOW_MO } from './steps';
import { SURFACES, runToGate, positionAt } from './physics';

/**
 * Free play: the same bench with the surface unbolted and no floor under the
 * angle.
 *
 * The guided runs fix the two surfaces and keep the angle above the point where
 * varnished wood lets go. Here every surface is on the shelf and the angle goes
 * down to 5°, which means the block can be made to sit there and refuse to
 * move — and that is the thing worth finding in this mode. Nothing is validated
 * and nothing is scored, which is what lets the panel say out loud what the
 * guided bench must never print: the coefficients themselves.
 */

const FREE_ANGLE = { min: 5, max: 45, step: 1 };
const SURFACE_KEYS = ['felt', 'wood', 'glass', 'ice', 'frictionless'];

export default function FreePlay() {
  const [frame, setFrame] = useState({ w: 0, h: 0 });
  const [thetaDeg, setTheta] = useState(28);
  const [massKg, setMass] = useState(0.5);
  const [trackCm, setTrack] = useState(50);
  const [surface, setSurface] = useState('wood');

  const [travelM, setTravelM] = useState(0);
  const [clockS, setClockS] = useState(0);
  const [running, setRunning] = useState(false);

  const solved = useMemo(
    () => runToGate({ thetaDeg, surface, sM: trackCm / 100 }),
    [thetaDeg, surface, trackCm]
  );
  const surf = SURFACES[surface];

  const raf = useRef(null);
  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const reset = useCallback(() => {
    cancelAnimationFrame(raf.current);
    setRunning(false);
    setTravelM(0);
    setClockS(0);
  }, []);

  const release = () => {
    if (running || !solved.slides) return;
    setRunning(true);
    const sM = trackCm / 100;
    const startedAt = Date.now();
    const tick = () => {
      const simS = (Date.now() - startedAt) / 1000 / SLOW_MO;
      if (simS >= solved.t) {
        setTravelM(sM);
        setClockS(solved.t);
        setRunning(false);
        return;
      }
      setTravelM(positionAt(solved.a, simS));
      setClockS(simS);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.readout}>
        <Stat label="Surface" value={surf.label} />
        {/* Spelled out rather than "μs · μk": the label style uppercases, and
            uppercasing a Greek mu turns it into an M. */}
        <Stat
          label="Friction, static · kinetic"
          value={`${surf.muS.toFixed(2)} · ${surf.muK.toFixed(2)}`}
        />
        <Stat
          label="Acceleration"
          value={solved.slides ? `${solved.a.toFixed(2)} m/s²` : 'stuck'}
          tone={solved.slides ? color.inkStrong : color.redDeep}
        />
        <Stat label="Clock" value={`${clockS.toFixed(2)} s`} />
      </View>

      <View
        style={styles.stage}
        onLayout={(e) =>
          setFrame({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })
        }
      >
        {frame.w > 0 ? (
          <InclineScene2D
            thetaDeg={thetaDeg}
            massKg={massKg}
            trackCm={trackCm}
            surface={surface}
            travelM={travelM}
            tripped={!running && travelM > 0}
            width={frame.w}
            height={frame.h}
          />
        ) : null}

        {!solved.slides ? (
          <View style={styles.stuckTag} pointerEvents="none">
            <Text style={styles.stuckText}>
              tan {thetaDeg}° is under μs — static friction is holding it
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.controls}>
        <View style={styles.surfaceRow}>
          {SURFACE_KEYS.map((k) => (
            <Pressable
              key={k}
              onPress={() => {
                reset();
                setSurface(k);
              }}
              style={({ pressed }) => [
                styles.chip,
                surface === k && styles.chipOn,
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.chipLabel, surface === k && { color: color.blueDeep }]}>
                {SURFACES[k].label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Slider
          value={thetaDeg}
          min={FREE_ANGLE.min}
          max={FREE_ANGLE.max}
          step={FREE_ANGLE.step}
          onChange={setTheta}
          onSlideStart={reset}
          disabled={running}
          tone={color.physics}
          label="Angle of incline"
          display={`${thetaDeg}°`}
        />
        <Slider
          value={massKg}
          min={MASS.min}
          max={MASS.max}
          step={MASS.step}
          onChange={setMass}
          onSlideStart={reset}
          disabled={running}
          tone={color.purple}
          label="Mass of block"
          display={`${massKg.toFixed(2)} kg`}
        />
        <Slider
          value={trackCm}
          min={TRACK_CM.min}
          max={TRACK_CM.max}
          step={TRACK_CM.step}
          onChange={setTrack}
          onSlideStart={reset}
          disabled={running}
          tone={color.brass}
          label="Track length to the gate"
          display={`${trackCm} cm`}
        />

        <Pressable
          onPress={release}
          disabled={running || !solved.slides}
          style={({ pressed }) => [
            styles.release,
            (running || !solved.slides) && styles.releaseOff,
            pressed && !running && solved.slides && styles.pressed,
          ]}
        >
          <Text style={styles.releaseLabel}>
            {running ? 'Running…' : solved.slides ? 'Release the block' : 'It will not move'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function Stat({ label, value, tone }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, tone && { color: tone }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: color.screen },

  readout: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 18,
    rowGap: 4,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  stat: { gap: 1, flexGrow: 1, flexBasis: 110, minWidth: 0 },
  statLabel: {
    fontFamily: font.extra,
    fontSize: 8.5,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: color.inkFaint,
  },
  statValue: {
    fontFamily: font.display,
    fontSize: 13.5,
    color: color.inkStrong,
    fontVariant: ['tabular-nums'],
  },

  stage: { flex: 1, overflow: 'hidden' },
  stuckTag: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 12,
    paddingVertical: 9,
    paddingHorizontal: 13,
    borderRadius: radius.chip,
    backgroundColor: color.redSoft,
    borderWidth: 2,
    borderColor: color.redEdge,
  },
  stuckText: {
    fontFamily: font.medium,
    fontSize: 12.5,
    color: color.redDeep,
    textAlign: 'center',
  },

  controls: {
    gap: 4,
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 12,
    borderTopWidth: 2,
    borderTopColor: color.hairline,
    backgroundColor: color.paper,
  },
  surfaceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, paddingBottom: 6 },
  chip: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: color.hairline,
  },
  chipOn: { borderColor: color.blueEdge, backgroundColor: color.blueSoft },
  chipLabel: { fontFamily: font.display, fontSize: 12, color: color.inkMuted },
  pressed: { transform: [{ translateY: 2 }] },

  release: {
    marginTop: 8,
    alignItems: 'center',
    paddingVertical: 13,
    borderRadius: radius.pill,
    backgroundColor: color.green,
    ...bevel(color.greenDeep, 4),
  },
  releaseOff: { backgroundColor: color.locked, borderBottomColor: color.lockedDeep },
  releaseLabel: {
    fontFamily: font.displayBold,
    fontSize: 14,
    letterSpacing: 0.4,
    color: color.onGold,
  },
});
