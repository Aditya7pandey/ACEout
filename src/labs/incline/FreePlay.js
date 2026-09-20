import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { color, font, type, radius } from '../../theme';
import { Eyebrow, GoldButton, GhostButton, Annotation, Panel, withAlpha } from '../../components/ui';
import Slider from '../../components/Slider';
import InclineScene from './InclineScene';
import {
  SURFACES,
  PRESETS,
  willSlide,
  accelerationDown,
  surfaceOf,
  initialState,
  MAX_TRACK_M,
} from './physics';

const DEG = Math.PI / 180;

/**
 * Free play: every parameter is live, every number is shown, and nothing stops
 * you doing something stupid. Set μ above tan θ and the block sits there.
 * Turn friction off entirely and watch the energy books balance exactly.
 */
export default function FreePlay({ params, setParams, simRef }) {
  const [live, setLive] = useState({ x: 0, v: 0, t: 0, heat: 0, running: false });

  // Sample the simulation for the HUD. The 3D scene owns the integration; this
  // just reads it, so the readouts can never disagree with the motion.
  useEffect(() => {
    const id = setInterval(() => {
      const s = simRef.current;
      setLive({ ...s.state, running: s.running });
    }, 90);
    return () => clearInterval(id);
  }, [simRef]);

  const release = () => {
    simRef.current.state = initialState();
    simRef.current.trueGateT = null;
    simRef.current.running = true;
  };

  const reset = () => {
    simRef.current.running = false;
    simRef.current.state = initialState();
    simRef.current.trueGateT = null;
    setLive({ x: 0, v: 0, t: 0, heat: 0, running: false });
  };

  const patch = (p) => {
    reset();
    setParams((prev) => ({ ...prev, ...p }));
  };

  const th = params.thetaDeg * DEG;
  const surf = surfaceOf(params);
  const slides = willSlide(params);
  const a = accelerationDown(params);
  const m = params.massKg;

  // Energy book-keeping, measured from the release point.
  const ke = 0.5 * m * live.v * live.v;
  const peLost = m * params.g * live.x * Math.sin(th);
  const heat = live.heat;
  const total = Math.max(peLost, 1e-9);

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      <InclineScene params={params} simRef={simRef} showTrajectory height={280} />

      <View style={styles.actions}>
        <GhostButton label="Reset" onPress={reset} />
        <GoldButton label={live.running ? 'Running…' : 'Release the block'} onPress={release} />
      </View>

      <Panel style={{ gap: 14 }}>
        <View style={styles.statusRow}>
          <Eyebrow tone={slides ? color.green : color.red}>
            {slides ? 'It will slide' : 'It will not move'}
          </Eyebrow>
          <Text style={styles.statusMath}>
            tan θ = {Math.tan(th).toFixed(3)} · μs = {surf.muS.toFixed(2)}
          </Text>
        </View>
        <Text style={[type.body, { lineHeight: 20 }]}>
          {slides
            ? `Gravity down the slope beats static friction, so the block breaks away and accelerates at ${a.toFixed(
                2
              )} m s⁻². Notice the acceleration does not contain the mass at all.`
            : `Static friction can supply up to μs mg cos θ, which is more than the mg sin θ pulling it down the slope. Tilt further, or pick a slicker surface.`}
        </Text>
      </Panel>

      <View style={styles.readouts}>
        <Readout label="Distance" value={(live.x * 100).toFixed(1)} unit="cm" />
        <Readout label="Speed" value={live.v.toFixed(2)} unit="m s⁻¹" tone={color.gold} />
        <Readout label="Time" value={live.t.toFixed(2)} unit="s" />
      </View>

      <Panel style={{ gap: 14 }}>
        <View style={styles.statusRow}>
          <Eyebrow>Energy book</Eyebrow>
          <Text style={styles.statusMath}>lost P.E. = K.E. + heat</Text>
        </View>
        <EnergyBar label="Kinetic energy" value={ke} total={total} tone={color.gold} />
        <EnergyBar label="Heat to friction" value={heat} total={total} tone={color.red} />
        <EnergyBar
          label="Potential energy given up"
          value={peLost}
          total={total}
          tone={color.physics}
        />
        <Text style={styles.energyNote}>
          {params.surface === 'frictionless'
            ? 'With no friction the whole of the lost potential energy turns up as kinetic energy — the two bars stay equal for the entire run.'
            : `Friction is skimming ${
                total > 1e-6 ? Math.round((heat / total) * 100) : 0
              }% of the energy into heat. That heat is the work done against friction, and it is exactly what makes the block arrive slower than a frictionless one.`}
        </Text>
      </Panel>

      <View style={styles.controls}>
        <Eyebrow>The apparatus</Eyebrow>

        <Slider
          label="Angle of incline θ"
          display={`${params.thetaDeg.toFixed(1)}°`}
          value={params.thetaDeg}
          min={0}
          max={45}
          step={0.5}
          onChange={(v) => patch({ thetaDeg: v })}
          marks={[
            {
              value: Math.atan(surf.muS) / DEG,
              color: color.red,
              label: 'slips here',
            },
          ]}
        />

        <Slider
          label="Mass of block"
          display={`${(params.massKg * 1000).toFixed(0)} g`}
          value={params.massKg}
          min={0.1}
          max={2}
          step={0.01}
          onChange={(v) => patch({ massKg: v })}
        />

        <Slider
          label="Track length to the gate"
          display={`${(params.trackM * 100).toFixed(1)} cm`}
          value={params.trackM}
          min={0.1}
          max={MAX_TRACK_M}
          step={0.005}
          onChange={(v) => patch({ trackM: v })}
        />

        <Chips
          label="Running surface"
          options={Object.entries(SURFACES).map(([key, s]) => ({
            key,
            label: s.label,
            meta: `μk ${s.muK.toFixed(2)}`,
          }))}
          value={params.surface}
          onChange={(key) => patch({ surface: key })}
        />

        <Chips
          label="Gravity"
          options={Object.entries(PRESETS).map(([key, p]) => ({
            key,
            label: p.label,
            meta: `${p.g} m s⁻²`,
          }))}
          value={
            Object.keys(PRESETS).find((k) => Math.abs(PRESETS[k].g - params.g) < 1e-6) || 'earth'
          }
          onChange={(key) => patch({ g: PRESETS[key].g })}
        />
      </View>

      <Annotation label="Try breaking it">
        Set the surface to felt and drop θ below 27° — the block refuses to move however long you
        wait, because static friction adjusts itself to whatever is needed up to its limit. Then
        switch to the ideal frictionless surface and watch the heat bar stay flat at zero while
        kinetic energy tracks the lost potential energy exactly. Change the mass and you will find
        the acceleration does not budge: mass cancels out of g(sin θ − μ cos θ).
      </Annotation>
    </ScrollView>
  );
}

function Readout({ label, value, unit, tone = color.inkStrong }) {
  return (
    <View style={styles.readout}>
      <Text style={styles.readoutLabel}>{label}</Text>
      <Text style={[styles.readoutValue, { color: tone }]}>{value}</Text>
      <Text style={styles.readoutUnit}>{unit}</Text>
    </View>
  );
}

function EnergyBar({ label, value, total, tone }) {
  const frac = total > 1e-9 ? Math.min(1, value / total) : 0;
  return (
    <View style={{ gap: 6 }}>
      <View style={styles.barHead}>
        <Text style={styles.barLabel}>{label}</Text>
        <Text style={[styles.barValue, { color: tone }]}>{value.toFixed(3)} J</Text>
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${frac * 100}%`, backgroundColor: tone }]} />
      </View>
    </View>
  );
}

function Chips({ label, options, value, onChange }) {
  return (
    <View style={{ gap: 9 }}>
      <Text style={type.eyebrowTight}>{label}</Text>
      <View style={styles.chipRow}>
        {options.map((o) => {
          const active = o.key === value;
          return (
            <Pressable
              key={o.key}
              onPress={() => onChange(o.key)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipLabel, active && { color: color.brass }]}>{o.label}</Text>
              <Text style={[styles.chipMeta, active && { color: withAlpha(color.brass, 0.75) }]}>
                {o.meta}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 40, gap: 18 },
  actions: { flexDirection: 'row', gap: 10 },
  statusRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 },
  statusMath: {
    fontFamily: font.semibold,
    fontSize: 11,
    color: color.inkMuted,
    fontVariant: ['tabular-nums'],
  },
  readouts: { flexDirection: 'row', gap: 10 },
  readout: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: color.hairline,
    borderRadius: radius.chip,
    backgroundColor: color.paper,
    paddingVertical: 12,
    paddingHorizontal: 11,
    gap: 3,
  },
  readoutLabel: {
    fontFamily: font.bold,
    fontSize: 8.5,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: color.inkMuted,
  },
  readoutValue: {
    fontFamily: font.bold,
    fontSize: 19,
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
  readoutUnit: { fontFamily: font.medium, fontSize: 9.5, color: color.inkMuted },
  barHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  barLabel: { fontFamily: font.semibold, fontSize: 12, color: color.inkBody },
  barValue: { fontFamily: font.bold, fontSize: 12.5, fontVariant: ['tabular-nums'] },
  barTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(28,24,21,0.07)',
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 3 },
  energyNote: {
    fontFamily: font.regular,
    fontSize: 12,
    lineHeight: 19,
    color: color.inkMuted,
  },
  controls: { gap: 18 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingVertical: 9,
    paddingHorizontal: 13,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: color.hairline,
    gap: 1,
  },
  chipActive: { borderColor: withAlpha(color.brass, 0.55), backgroundColor: withAlpha(color.brass, 0.06) },
  chipLabel: {
    fontFamily: font.bold,
    fontSize: 11.5,
    color: color.inkBody,
  },
  chipMeta: {
    fontFamily: font.medium,
    fontSize: 9,
    color: color.inkMuted,
    fontVariant: ['tabular-nums'],
  },
});
