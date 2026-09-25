import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, Animated, Pressable } from 'react-native';
import { color, font, radius, bevel } from '../../theme';
import { Text } from '../../i18n';
import { withAlpha } from '../../components/ui';
import Slider from '../../components/Slider';
import InclineScene2D from './InclineScene2D';
import { STATIONS, INTRO, ANGLE, MASS, TRACK_CM, SLOW_MO } from './steps';
import { runToGate, positionAt, analyseRun, SURFACES } from './physics';
import { INSTRUMENTS, sigFigsForReading } from '../../measure/leastCount';

const CLOCK = INSTRUMENTS.stopwatch; // least count 0.01 s

/**
 * The bench, run as a guided walk from one surface to the next.
 *
 * Each run plays four beats, and the instruction box carries them:
 *
 *   brief    the box explains the run and asks for the sliders; any touch
 *            anywhere dismisses it, which is the whole of its interaction
 *   setup    sliders live, block waiting at the mark, Release armed
 *   running  the block is on its way and the gate clock is counting
 *   record   the gate has caught it; the time is banked on a tap
 *
 * The run is not scripted. The block's position comes from x = ½at² with the
 * acceleration the student's own slope and surface produce, and the time the
 * clock stops on is solved from the same equation — so a steeper slope really
 * is quicker, and by the amount it should be.
 */
export default function GuidedFlow({ onFinish }) {
  const [frame, setFrame] = useState({ w: 0, h: 0 });
  const [idx, setIdx] = useState(0);
  const [beat, setBeat] = useState('brief');
  const [rows, setRows] = useState([]);
  // The handover to the report happens from a timer, whose closure would
  // otherwise hold the row list as it was one beat ago.
  const rowsRef = useRef(rows);
  rowsRef.current = rows;

  const station = STATIONS[idx];
  const [thetaDeg, setTheta] = useState(station.home.thetaDeg);
  const [massKg, setMass] = useState(station.home.massKg);
  const [trackCm, setTrack] = useState(station.home.trackCm);

  // Where the block has got to, and how many *simulated* seconds that took.
  const [travelM, setTravelM] = useState(0);
  const [clockS, setClockS] = useState(0);

  const boxIn = useRef(new Animated.Value(0)).current;

  const solved = useMemo(
    () => runToGate({ thetaDeg, surface: station.surface, sM: trackCm / 100 }),
    [thetaDeg, station.surface, trackCm]
  );

  const showBox = beat === 'brief' || beat === 'record';

  useEffect(() => {
    Animated.timing(boxIn, {
      toValue: showBox ? 1 : 0,
      duration: showBox ? 240 : 150,
      useNativeDriver: true,
    }).start();
  }, [showBox, boxIn]);

  // --- the brief goes on first contact -----------------------------------
  // The box is an explanation, not a gate. Touching anything — the stage, the
  // box, a slider — is taken as "understood", which is why every one of those
  // calls this rather than there being a Dismiss button to hunt for.
  const dismissBrief = useCallback(() => {
    setBeat((b) => (b === 'brief' ? 'setup' : b));
  }, []);

  // --- the run ------------------------------------------------------------
  const raf = useRef(null);

  const release = () => {
    if (beat !== 'setup' || !solved.slides) return;
    setBeat('running');
    setTravelM(0);
    setClockS(0);

    const sM = trackCm / 100;
    const startedAt = Date.now();

    const tick = () => {
      // Wall-clock elapsed, divided down: the bench plays at 1/SLOW_MO speed so
      // a half-second slide is watchable, but the clock counts the simulated
      // seconds the run actually takes.
      const simS = (Date.now() - startedAt) / 1000 / SLOW_MO;

      if (simS >= solved.t) {
        setTravelM(sM);
        setClockS(solved.t);
        setBeat('record');
        return;
      }
      setTravelM(positionAt(solved.a, simS));
      setClockS(simS);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  };

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  /**
   * Back to the mark — changing any slider re-arms the run.
   *
   * This has to drop a finished run back to `setup` rather than leaving the
   * box up: the time on screen belongs to the settings that produced it, and a
   * Record button still live after the slope has been moved would bank a time
   * for a run that never happened.
   */
  const rearm = useCallback(() => {
    cancelAnimationFrame(raf.current);
    setTravelM(0);
    setClockS(0);
    setBeat((b) => (b === 'running' || b === 'done' ? b : 'setup'));
  }, []);

  // --- recording ----------------------------------------------------------
  // One reading per run, however many times the button is hit — two taps in
  // the same frame would otherwise both see the pre-render state and bank it
  // twice. A ref, because state would not have settled between them.
  const banked = useRef(null);

  const record = () => {
    if (banked.current === station.key) return;
    banked.current = station.key;

    const tS = Number(solved.t.toFixed(2)); // as the gate clock reads it
    const sM = trackCm / 100;
    const { a, mu } = analyseRun({ thetaDeg, sM, tS });

    setRows((r) => [
      ...r,
      {
        stationKey: station.key,
        // English, deliberately: this goes into the saved lab record, which has
        // to stay comparable whatever language the bench was run in.
        surface: SURFACES[station.surface].label,
        thetaDeg,
        massKg,
        trackCm,
        timeS: tS,
        a,
        mu,
        sf: sigFigsForReading(tS, CLOCK.leastCount),
      },
    ]);
    setBeat('done');
  };

  // 'done' is a pass-through beat so Record and the next run are never the
  // same tap on the same frame.
  useEffect(() => {
    if (beat !== 'done') return undefined;
    const timer = setTimeout(() => {
      const next = idx + 1;
      if (next >= STATIONS.length) {
        onFinish(rowsRef.current);
        return;
      }
      setIdx(next);
      setTheta(STATIONS[next].home.thetaDeg);
      setMass(STATIONS[next].home.massKg);
      setTrack(STATIONS[next].home.trackCm);
      setTravelM(0);
      setClockS(0);
      setBeat('brief');
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beat]);

  const boxStyle = {
    opacity: boxIn,
    transform: [{ translateY: boxIn.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
  };

  const locked = beat === 'running';

  return (
    <View style={styles.wrap}>
      {/* Progress and the gate clock share one bar above the bench, in flow —
          nothing floats over the drawing, so nothing can land on the ramp. */}
      <View style={styles.topBar}>
        <View style={styles.pips}>
          {STATIONS.map((s, i) => (
            <View
              key={s.key}
              style={[
                styles.pip,
                i === idx && { backgroundColor: s.tone, width: 22 },
                i < idx && { backgroundColor: withAlpha(s.tone, 0.45) },
              ]}
            />
          ))}
          <Text style={styles.pipLabel} numberOfLines={1}>
            {station.ordinal} · {station.name}
          </Text>
        </View>

        <View style={styles.clock}>
          <Text style={styles.clockLabel}>Gate clock</Text>
          <Text
            style={[
              styles.clockValue,
              beat === 'record' && { color: color.greenDeep },
            ]}
          >
            {clockS.toFixed(2)} s
          </Text>
        </View>
      </View>

      <Pressable style={styles.stage} onPress={dismissBrief}>
        <View
          style={StyleSheet.absoluteFill}
          onLayout={(e) =>
            setFrame({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })
          }
          pointerEvents="none"
        >
          {frame.w > 0 ? (
            <InclineScene2D
              thetaDeg={thetaDeg}
              massKg={massKg}
              trackCm={trackCm}
              surface={station.surface}
              travelM={travelM}
              tripped={beat === 'record' || beat === 'done'}
              width={frame.w}
              height={frame.h}
            />
          ) : null}
        </View>

        {/* ---- the instruction box ---- */}
        <Animated.View
          style={[styles.boxWrap, boxStyle]}
          pointerEvents={showBox ? 'auto' : 'none'}
        >
          <View style={styles.box}>
            <View style={styles.boxHead}>
              <View style={[styles.dot, { backgroundColor: station.tone }]} />
              <Text style={[styles.boxEyebrow, { color: station.tone }]}>
                {beat === 'record' ? 'Take the reading' : station.ordinal}
              </Text>
            </View>

            {beat === 'brief' ? (
              <>
                <Text style={styles.boxTitle}>
                  {idx === 0 ? INTRO.title : station.name}
                </Text>
                <Text style={styles.boxBody}>
                  {idx === 0 ? INTRO.body : station.brief}
                </Text>
                <Text style={[styles.boxPrompt, { color: station.tone }]}>
                  ↓ {station.prompt}
                </Text>
                {idx === 0 ? <Text style={styles.boxHint}>{INTRO.hint}</Text> : null}
              </>
            ) : null}

            {beat === 'record' ? (
              <>
                <View style={styles.readingRow}>
                  <View>
                    <Text style={styles.readingLabel}>Time to the gate</Text>
                    <Text style={styles.reading}>{clockS.toFixed(2)} s</Text>
                  </View>
                  <Pressable
                    onPress={record}
                    style={({ pressed }) => [
                      styles.action,
                      { backgroundColor: station.tone },
                      pressed && styles.actionPressed,
                    ]}
                  >
                    <Text style={styles.actionLabel}>Record</Text>
                  </Pressable>
                </View>
                <Text style={styles.boxBody}>{station.record}</Text>
              </>
            ) : null}
          </View>
        </Animated.View>
      </Pressable>

      {/* ---- the three sliders and the release, always at the bottom ---- */}
      <View style={styles.controls}>
        <Slider
          value={thetaDeg}
          min={ANGLE.min}
          max={ANGLE.max}
          step={ANGLE.step}
          onChange={setTheta}
          onSlideStart={rearm}
          disabled={locked}
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
          onSlideStart={rearm}
          disabled={locked}
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
          onSlideStart={rearm}
          disabled={locked}
          tone={color.brass}
          label="Track length to the gate"
          display={`${trackCm} cm`}
        />

        <Pressable
          onPress={release}
          disabled={beat !== 'setup'}
          style={({ pressed }) => [
            styles.release,
            beat !== 'setup' && styles.releaseOff,
            pressed && beat === 'setup' && styles.actionPressed,
          ]}
        >
          <Text style={styles.releaseLabel}>
            {beat === 'running'
              ? 'Running…'
              : beat === 'record' || beat === 'done'
              ? 'At the gate'
              : 'Release the block'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: color.screen },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    columnGap: 14,
    rowGap: 6,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  pips: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 160,
    minWidth: 0,
  },
  pip: { width: 8, height: 4, borderRadius: 2, backgroundColor: color.locked },
  pipLabel: {
    marginLeft: 8,
    flexShrink: 1,
    fontFamily: font.extra,
    fontSize: 9.5,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: color.inkMuted,
  },
  clock: { alignItems: 'flex-end' },
  clockLabel: {
    fontFamily: font.extra,
    fontSize: 8.5,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: color.inkFaint,
  },
  clockValue: {
    fontFamily: font.displayBold,
    fontSize: 20,
    color: color.inkStrong,
    fontVariant: ['tabular-nums'],
  },

  stage: { flex: 1, overflow: 'hidden' },

  boxWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 12,
    paddingHorizontal: 14,
  },
  box: {
    backgroundColor: color.paper,
    borderRadius: radius.panel,
    borderWidth: 2,
    borderColor: color.hairline,
    padding: 15,
    gap: 8,
    ...bevel(color.edge, 4),
  },
  boxHead: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  boxEyebrow: {
    fontFamily: font.extra,
    fontSize: 9.5,
    letterSpacing: 1.3,
    textTransform: 'uppercase',
  },
  boxTitle: {
    fontFamily: font.displayBold,
    fontSize: 18.5,
    lineHeight: 23,
    color: color.ink,
  },
  boxBody: { fontFamily: font.regular, fontSize: 14.5, lineHeight: 21.5, color: color.inkSoft },
  boxPrompt: { fontFamily: font.displayBold, fontSize: 13.5, lineHeight: 19.5 },
  boxHint: {
    fontFamily: font.medium,
    fontSize: 11.5,
    color: color.inkFaint,
    textAlign: 'center',
    marginTop: 2,
  },

  readingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  readingLabel: {
    fontFamily: font.extra,
    fontSize: 9,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: color.inkMuted,
  },
  reading: {
    fontFamily: font.displayBold,
    fontSize: 28,
    color: color.ink,
    fontVariant: ['tabular-nums'],
  },
  action: {
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: radius.pill,
    ...bevel('rgba(0,0,0,0.22)', 4),
  },
  actionPressed: { transform: [{ translateY: 2 }], borderBottomWidth: 2 },
  actionLabel: {
    fontFamily: font.displayBold,
    fontSize: 13,
    letterSpacing: 0.5,
    color: color.onGold,
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
