import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { color, font, type, radius } from '../../theme';
import { Eyebrow, GoldButton, GhostButton, Annotation, Panel } from '../../components/ui';
import Slider from '../../components/Slider';
import LaunchScene from './LaunchScene';
import GravityDeck, { GravityRelation } from './GravityDeck';
import {
  WORLDS,
  G_EARTH,
  initialState,
  idealLaunch,
  flightTime,
  rangeOf,
  worldOf,
} from './physics';
import { useLabLayout } from './layout';

/**
 * Free play: every parameter is live, every number is on show, and nothing
 * stops you doing something stupid. Wind gravity down to a tenth of the Moon's
 * and the rover sails off the end of the tape; wind it up past Jupiter and it
 * drops at its own wheels. The last four flights stay on the bench so the
 * parabolas can be compared side by side.
 */
export default function FreePlay({ params, setParams, simRef }) {
  const [live, setLive] = useState({ x: 0, y: 0, vx: 0, vy: 0, t: 0, phase: 'deck' });
  const [custom, setCustom] = useState(false);
  const layout = useLabLayout(280);

  // Sample the simulation for the HUD. The 3D scene owns the integration; this
  // only reads it, so the readouts can never disagree with the motion.
  useEffect(() => {
    const id = setInterval(() => {
      const s = simRef.current;
      setLive({ ...s.state, running: s.running });
    }, 80);
    return () => clearInterval(id);
  }, [simRef]);

  const launch = () => {
    simRef.current.state = initialState();
    simRef.current.running = true;
  };

  const reset = () => {
    simRef.current.running = false;
    simRef.current.state = initialState();
    setLive({ x: 0, y: 0, vx: 0, vy: 0, t: 0, phase: 'deck' });
  };

  const clearGhosts = () => {
    simRef.current.ghosts = [];
    reset();
  };

  const patch = (p) => {
    reset();
    setParams((prev) => ({ ...prev, ...p }));
  };

  const ideal = useMemo(() => idealLaunch(params), [params]);
  const world = worldOf(params);
  const landed = live.phase === 'landed';

  // The same launcher, fired on every world in the catalogue.
  const comparison = useMemo(
    () =>
      Object.values(WORLDS).map((w) => ({
        key: w.key,
        label: w.label,
        g: w.g,
        r: rangeOf({ ...params, g: w.g }),
        t: flightTime(params.heightM, w.g),
      })),
    [params.speedMS, params.heightM]
  );
  const maxR = Math.max(...comparison.map((c) => c.r));

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[styles.scroll, layout.contentStyle]}
      showsVerticalScrollIndicator={false}
    >
      <LaunchScene params={params} simRef={simRef} showGhosts height={layout.stageHeight} />

      <View style={styles.actions}>
        <GhostButton label="Reset" onPress={reset} />
        <GoldButton
          label={live.running ? 'Running…' : 'Launch the rover'}
          onPress={launch}
        />
      </View>

      <View style={styles.readouts}>
        <Readout
          label="Distance"
          value={(Math.max(0, live.x) * 100).toFixed(1)}
          unit="cm"
          tone={color.gold}
        />
        <Readout
          label="Height"
          value={((live.phase === 'deck' ? params.heightM : live.y) * 100).toFixed(1)}
          unit="cm"
        />
        <Readout
          label="Flight time"
          value={(live.phase === 'deck' ? 0 : live.t).toFixed(2)}
          unit="s"
        />
      </View>

      <Panel style={{ gap: 12 }}>
        <View style={styles.statusRow}>
          <Eyebrow tone={color.space}>{world.label}</Eyebrow>
          <Text style={styles.statusMath}>
            R = u√(2h/g) = {(ideal.range * 100).toFixed(1)} cm
          </Text>
        </View>
        <GravityRelation g={params.g} />
        <View style={styles.factRow}>
          <Fact label="Fall time" value={`${ideal.t.toFixed(2)} s`} />
          <Fact label="Impact speed" value={`${ideal.impactSpeed.toFixed(2)} m s⁻¹`} />
          <Fact label="Impact angle" value={`${ideal.impactAngleDeg.toFixed(0)}° below`} />
        </View>
        <Text style={styles.note}>
          {landed
            ? `The rover landed ${(live.x * 100).toFixed(1)} cm from the lip after ${live.t.toFixed(
                2
              )} s. Its horizontal speed never changed for a single instant of that flight — the whole of the difference between worlds is in how fast the ground came up to meet it.`
            : 'The horizontal motion is uniform and the vertical motion is a free fall. They share nothing but a clock, which is why the range is just the launch speed multiplied by the fall time.'}
        </Text>
      </Panel>

      <GravityDeck
        value={custom ? null : params.world}
        onChange={(key) => {
          setCustom(false);
          patch({ world: key, g: WORLDS[key].g });
        }}
        label="Gravity — pick a world"
        caption="Tap a world and the whole bench moves there. Nothing about the rover or the launcher changes."
      />

      <View style={styles.controls}>
        <Eyebrow>The apparatus</Eyebrow>

        <Slider
          label="Gravity g — drag it anywhere"
          display={`${params.g.toFixed(2)} m s⁻²`}
          value={params.g}
          min={0.1}
          max={30}
          step={0.01}
          tone={color.space}
          onChange={(v) => {
            setCustom(true);
            patch({ g: v, world: nearestKey(v) });
          }}
          marks={[
            { value: WORLDS.moon.g, color: color.inkMuted, label: 'moon' },
            { value: G_EARTH, color: color.physics, label: 'earth' },
            { value: WORLDS.jupiter.g, color: color.red, label: 'jupiter' },
          ]}
        />

        <Slider
          label="Launch speed u"
          display={`${params.speedMS.toFixed(2)} m s⁻¹`}
          value={params.speedMS}
          min={0.1}
          max={2.5}
          step={0.01}
          onChange={(v) => patch({ speedMS: v })}
        />

        <Slider
          label="Deck height h"
          display={`${(params.heightM * 100).toFixed(0)} cm`}
          value={params.heightM}
          min={0.1}
          max={0.9}
          step={0.005}
          onChange={(v) => patch({ heightM: v })}
        />

        <Slider
          label="Mass of the rover — watch nothing happen"
          display={`${(params.massKg * 1000).toFixed(0)} g`}
          value={params.massKg}
          min={0.05}
          max={2}
          step={0.01}
          onChange={(v) => patch({ massKg: v })}
        />

        <GhostButton label="Clear the ghost trails" onPress={clearGhosts} />
      </View>

      <Panel style={{ gap: 12 }}>
        <View style={styles.statusRow}>
          <Eyebrow>This launcher, on every world</Eyebrow>
          <Text style={styles.statusMath}>
            u = {params.speedMS.toFixed(2)} m s⁻¹ · h = {(params.heightM * 100).toFixed(0)} cm
          </Text>
        </View>
        {comparison.map((c) => (
          <View key={c.key} style={{ gap: 5 }}>
            <View style={styles.barHead}>
              <Text style={styles.barLabel}>
                {c.label} · g {c.g.toFixed(2)}
              </Text>
              <Text
                style={[
                  styles.barValue,
                  { color: c.key === params.world ? color.brass : color.inkMuted },
                ]}
              >
                {(c.r * 100).toFixed(1)} cm · {c.t.toFixed(2)} s
              </Text>
            </View>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  {
                    width: `${(c.r / maxR) * 100}%`,
                    backgroundColor: c.key === params.world ? color.gold : 'rgba(28,24,21,0.18)',
                  },
                ]}
              />
            </View>
          </View>
        ))}
        <Text style={styles.note}>
          Mercury and Mars differ by 0.01 m s⁻², so this launcher cannot tell them apart — a real
          limit of a real method, not a gap in the simulation. Pluto and Jupiter differ by a factor
          of forty, and the ranges differ by a factor of six: range goes as 1/√g, not as 1/g.
        </Text>
      </Panel>

      <Annotation label="Try breaking it">
        Set gravity to 0.1 m s⁻² and the rover leaves the tape entirely — nothing has gone wrong,
        the flight simply lasts long enough for the horizontal motion to run out of floor. Take the
        mass from 50 g to 2 kg and read the range each time: it does not shift by a millimetre,
        because no mass appears anywhere in u√(2h/g). Then double the launch speed and watch the
        range double, but the flight time stay exactly where it was — the rover falls for the same
        length of time no matter how fast it is thrown sideways.
      </Annotation>

      <Annotation label="What this bench ignores" tone={color.inkMuted}>
        There is no atmosphere here. That is nearly true on the Moon, defensible on Mars at these
        speeds, and badly wrong on Venus, where the air is ninety times denser than Earth's and
        would slow the rover visibly. Treat the Venusian range as the answer for a Venus-sized world
        with no air.
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

function Fact({ label, value }) {
  return (
    <View style={{ flex: 1, gap: 3 }}>
      <Text style={styles.factLabel}>{label}</Text>
      <Text style={styles.factValue}>{value}</Text>
    </View>
  );
}

/** Closest catalogued world, so the scene still has a sky to paint. */
function nearestKey(g) {
  let best = 'earth';
  let err = Infinity;
  Object.values(WORLDS).forEach((w) => {
    const e = Math.abs(w.g - g);
    if (e < err) {
      err = e;
      best = w.key;
    }
  });
  return best;
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 40, gap: 18 },
  actions: { flexDirection: 'row', gap: 10 },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 10,
  },
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
  factRow: { flexDirection: 'row', gap: 10 },
  factLabel: {
    fontFamily: font.bold,
    fontSize: 8.5,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: color.inkMuted,
  },
  factValue: {
    fontFamily: font.bold,
    fontSize: 13,
    color: color.inkStrong,
    fontVariant: ['tabular-nums'],
  },
  note: { fontFamily: font.regular, fontSize: 12, lineHeight: 19, color: color.inkMuted },
  controls: { gap: 18 },
  barHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  barLabel: { fontFamily: font.semibold, fontSize: 12, color: color.inkBody },
  barValue: { fontFamily: font.bold, fontSize: 11.5, fontVariant: ['tabular-nums'] },
  barTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(28,24,21,0.06)',
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 3 },
});
