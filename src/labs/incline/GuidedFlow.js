import React, { useState, useMemo, useRef, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { color, font, type, radius } from '../../theme';
import {
  Eyebrow,
  GoldButton,
  GhostButton,
  Annotation,
  Panel,
  Tag,
  withAlpha,
} from '../../components/ui';
import Slider from '../../components/Slider';
import InclineScene from './InclineScene';
import Stopwatch from '../../instruments/Stopwatch';
import MetreScale from '../../instruments/MetreScale';
import Balance from '../../instruments/Balance';
import ReadingInput from '../../measure/ReadingInput';
import DataTable from '../../measure/DataTable';
import GraphPlot from '../../measure/GraphPlot';
import {
  INSTRUMENTS,
  sigFigsForReading,
  combineSigFigs,
  formatSigFigs,
  checkDerived,
  validateReading,
} from '../../measure/leastCount';
import {
  apparentScaleReading,
  apparentMassG,
  stopwatchFaults,
} from './errors';
import {
  analyseStudentData,
  initialState,
  surfaceOf,
  RELEASE_MARK_CM,
  MAX_TRACK_M,
  G_EARTH,
} from './physics';
import { STEPS, TRIAL_TARGETS_CM, REPEATS_PER_TRIAL } from './steps';

const DEG = Math.PI / 180;
const READ_TOLERANCE_CM = 0.15; // a correctly-read millimetre, plus a mark of slack

export default function GuidedFlow({ params, setParams, simRef, profile, errorConfig, onFinish }) {
  const { width } = useWindowDimensions();
  const [stepIndex, setStepIndex] = useState(0);
  const [eyeOffset, setEyeOffset] = useState(errorConfig.parallax ? -0.55 : 0);
  const [d, setD] = useState({
    massRaw: '',
    riseRaw: '',
    runRaw: '',
    releaseMarkRaw: '',
    trials: [],
    accelRaw: '',
    muRaw: '',
    wGravRaw: '',
    wFricRaw: '',
    keRaw: '',
  });
  const [trialIdx, setTrialIdx] = useState(0);
  const [trialPhase, setTrialPhase] = useState('place'); // place → measure → time
  const [gateRaw, setGateRaw] = useState('');
  const [releaseRaw, setReleaseRaw] = useState('');
  const [laps, setLaps] = useState([]);
  const [released, setReleased] = useState(false);
  const trueGateTimes = useRef([]);

  const step = STEPS[stepIndex];
  const watch = stopwatchFaults(profile, errorConfig);
  const th = params.thetaDeg * DEG;

  // --- truth the instruments are pointing at -------------------------------
  const truth = useMemo(
    () => ({
      massG: params.massKg * 1000,
      riseCm: params.rampLengthM * Math.sin(th) * 100,
      runCm: params.rampLengthM * Math.cos(th) * 100,
      releaseCm: RELEASE_MARK_CM,
      gateCm: RELEASE_MARK_CM + params.trackM * 100,
    }),
    [params, th]
  );

  const apparent = useCallback(
    (trueCm) => apparentScaleReading(trueCm, profile, errorConfig, eyeOffset),
    [profile, errorConfig, eyeOffset]
  );

  const misread = (raw, expectedCm) => {
    const v = Number(raw);
    if (!Number.isFinite(v)) return null;
    if (Math.abs(v - expectedCm) <= READ_TOLERANCE_CM) return null;
    return 'That is not what the scale says. Find the graduation the mark actually falls on and read it again.';
  };

  /** A scale reading is usable only if it lands on a graduation AND is the
   *  graduation the mark is actually sitting on. */
  const readingOk = (raw, expectedCm) =>
    !!raw &&
    validateReading(raw, INSTRUMENTS.metreScale).ok &&
    !misread(raw, expectedCm);

  const set = (patch) => setD((prev) => ({ ...prev, ...patch }));

  // --- derived analysis ----------------------------------------------------
  const analysis = useMemo(() => {
    const massG = Number(d.massRaw);
    const heightCm = Number(d.riseRaw);
    const baseCm = Number(d.runRaw);
    if (!massG || !heightCm || !baseCm) return null;
    return analyseStudentData(
      d.trials.map((t) => ({ sCm: t.sCm, tS: t.meanT })),
      { massG, heightCm, baseCm, g: G_EARTH }
    );
  }, [d.massRaw, d.riseRaw, d.runRaw, d.trials]);

  // The weakest reading in the whole experiment caps every derived answer.
  const sf = useMemo(() => {
    const lcMass = INSTRUMENTS.balance.leastCount;
    const lcScale = INSTRUMENTS.metreScale.leastCount;
    const lcWatch = INSTRUMENTS.stopwatch.leastCount;
    const parts = [
      sigFigsForReading(d.massRaw, lcMass),
      sigFigsForReading(d.riseRaw, lcScale),
      sigFigsForReading(d.runRaw, lcScale),
    ];
    d.trials.forEach((t) => {
      parts.push(sigFigsForReading(t.sCm, lcScale));
      t.times.forEach((x) => parts.push(sigFigsForReading(x, lcWatch)));
    });
    return combineSigFigs(...parts) || 3;
  }, [d]);

  // --- step gating ---------------------------------------------------------
  const complete = useMemo(() => {
    switch (step.kind) {
      case 'mass':
        return d.massRaw !== '';
      case 'geometry':
        return d.riseRaw !== '' && d.runRaw !== '';
      case 'trials':
        return d.trials.length >= TRIAL_TARGETS_CM.length;
      case 'graph':
        return d.trials.length >= 4;
      case 'accel':
        return d.accelRaw !== '' && d.muRaw !== '';
      case 'work':
        return d.wGravRaw !== '' && d.wFricRaw !== '' && d.keRaw !== '';
      case 'report':
        return true;
      default:
        return true;
    }
  }, [step, d]);

  const advance = () => {
    if (stepIndex < STEPS.length - 1) setStepIndex((i) => i + 1);
    else onFinish?.({ data: d, analysis, sf });
  };

  // --- trial machinery -----------------------------------------------------
  const target = TRIAL_TARGETS_CM[trialIdx];

  const release = () => {
    simRef.current.state = initialState();
    simRef.current.trueGateT = null;
    simRef.current.running = true;
    setReleased(true);
  };

  const resetBlock = () => {
    simRef.current.running = false;
    simRef.current.state = initialState();
    simRef.current.trueGateT = null;
    setReleased(false);
  };

  const recordLap = (seconds) => {
    if (!released) return;
    const trueT = simRef.current.trueGateT;
    trueGateTimes.current.push(trueT);
    setLaps((l) => [...l, seconds]);
    resetBlock();
  };

  const commitTrial = () => {
    const sCm = round1(Number(gateRaw) - Number(d.releaseMarkRaw));
    const meanT = laps.reduce((a, b) => a + b, 0) / laps.length;
    const trueTs = trueGateTimes.current.filter((x) => Number.isFinite(x));
    setD((prev) => ({
      ...prev,
      trials: [
        ...prev.trials,
        {
          targetCm: target,
          sRaw: gateRaw,
          sCm,
          times: laps,
          meanT: Math.round(meanT * 1000) / 1000,
          trueMeanT: trueTs.length ? trueTs.reduce((a, b) => a + b, 0) / trueTs.length : null,
          trueSCm: params.trackM * 100,
        },
      ],
    }));
    setGateRaw('');
    setLaps([]);
    trueGateTimes.current = [];
    setTrialPhase('place');
    setTrialIdx((i) => i + 1);
  };

  const graphPoints = useMemo(
    () =>
      d.trials.map((t, i) => {
        const s = t.sCm / 100;
        const v = (2 * s) / t.meanT;
        return { x: s, y: v * v, label: `${i + 1}` };
      }),
    [d.trials]
  );

  const plotWidth = Math.min(width - 68, 360);

  return (
    <View style={{ flex: 1 }}>
      <Progress index={stepIndex} total={STEPS.length} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.stepHead}>
          <Eyebrow tone={color.brass}>
            Step {stepIndex + 1} of {STEPS.length}
          </Eyebrow>
          <Text style={[type.title, { marginTop: 8 }]}>{step.title}</Text>
          {step.instruction ? (
            <Text style={[type.body, { marginTop: 10, lineHeight: 21 }]}>{step.instruction}</Text>
          ) : null}
        </View>

        {step.kind === 'mass' ? (
          <View style={styles.block}>
            <Balance trueMassG={truth.massG} profile={profile} errorConfig={errorConfig} />
            <ReadingInput
              instrument={INSTRUMENTS.balance}
              label="Reading with the block on the pan"
              value={d.massRaw}
              onChange={(v) => set({ massRaw: v })}
              extraError={
                d.massRaw !== '' &&
                Math.abs(
                  Number(d.massRaw) - apparentMassG(truth.massG, profile, errorConfig)
                ) > 0.5
                  ? 'That is not the number on the display.'
                  : null
              }
              hint="Copy the display exactly, sign and all."
            />
            <Annotation label="Least count">{step.note}</Annotation>
          </View>
        ) : null}

        {step.kind === 'geometry' ? (
          <View style={styles.block}>
            <InclineScene params={params} simRef={simRef} height={230} />
            <MetreScale
              label="Metre scale — vertical rise of the top corner"
              pointers={[{ id: 'rise', trueCm: truth.riseCm, label: 'Rise h', tone: color.physics }]}
              profile={profile}
              errorConfig={errorConfig}
              eyeOffset={eyeOffset}
              onEyeOffset={setEyeOffset}
            />
            <ReadingInput
              instrument={INSTRUMENTS.metreScale}
              label="Rise h"
              value={d.riseRaw}
              onChange={(v) => set({ riseRaw: v })}
              extraError={d.riseRaw ? misread(d.riseRaw, apparent(truth.riseCm)) : null}
            />
            <MetreScale
              label="Metre scale — horizontal run of the base"
              pointers={[{ id: 'run', trueCm: truth.runCm, label: 'Run b', tone: color.gold }]}
              profile={profile}
              errorConfig={errorConfig}
              eyeOffset={eyeOffset}
              onEyeOffset={setEyeOffset}
            />
            <ReadingInput
              instrument={INSTRUMENTS.metreScale}
              label="Run b"
              value={d.runRaw}
              onChange={(v) => set({ runRaw: v })}
              extraError={d.runRaw ? misread(d.runRaw, apparent(truth.runCm)) : null}
            />
            {d.riseRaw && d.runRaw ? (
              <Panel style={{ gap: 6 }}>
                <Eyebrow>Angle from your two lengths</Eyebrow>
                <Text style={styles.derived}>
                  θ ={' '}
                  {(
                    Math.asin(
                      Number(d.riseRaw) /
                        Math.hypot(Number(d.riseRaw), Number(d.runRaw))
                    ) / DEG
                  ).toFixed(2)}
                  °
                </Text>
                <Text style={styles.derivedNote}>
                  sin θ = {Number(d.riseRaw).toFixed(1)} ÷{' '}
                  {Math.hypot(Number(d.riseRaw), Number(d.runRaw)).toFixed(1)}
                </Text>
              </Panel>
            ) : null}
            <Annotation label="Why not a protractor">{step.note}</Annotation>
          </View>
        ) : null}

        {step.kind === 'trials' ? (
          <View style={styles.block}>
            {d.releaseMarkRaw === '' ? (
              <>
                <Panel tone={withAlpha(color.brass, 0.4)} style={{ gap: 7 }}>
                  <Eyebrow tone={color.brass}>First, fix your origin</Eyebrow>
                  <Text style={type.body}>
                    Lay the metre scale along the slope and read the position of the brass release
                    mark. Every track length you measure will be counted from this number, so read
                    it once and read it well.
                  </Text>
                </Panel>
                <MetreScale
                  label="Metre scale along the slope"
                  pointers={[
                    { id: 'release', trueCm: truth.releaseCm, label: 'Release', tone: color.brass },
                  ]}
                  profile={profile}
                  errorConfig={errorConfig}
                  eyeOffset={eyeOffset}
                  onEyeOffset={setEyeOffset}
                />
                <ReadingInput
                  instrument={INSTRUMENTS.metreScale}
                  label="Position of the release mark"
                  value={releaseRaw}
                  onChange={setReleaseRaw}
                  extraError={releaseRaw ? misread(releaseRaw, apparent(truth.releaseCm)) : null}
                />
                {readingOk(releaseRaw, apparent(truth.releaseCm)) ? (
                  <GoldButton
                    label="Fix this as my origin"
                    onPress={() => set({ releaseMarkRaw: releaseRaw })}
                  />
                ) : null}
              </>
            ) : trialIdx < TRIAL_TARGETS_CM.length ? (
              <>
                <View style={styles.trialHead}>
                  <Eyebrow tone={color.brass}>
                    Run {trialIdx + 1} of {TRIAL_TARGETS_CM.length}
                  </Eyebrow>
                  <Tag
                    label={
                      trialPhase === 'place'
                        ? 'Place the gate'
                        : trialPhase === 'measure'
                        ? 'Measure s'
                        : `Time it · ${laps.length}/${REPEATS_PER_TRIAL}`
                    }
                    tone={color.brass}
                    filled
                  />
                </View>

                <InclineScene params={params} simRef={simRef} height={250} />

                {trialPhase === 'place' ? (
                  <View style={styles.block}>
                    <Panel style={{ gap: 7 }}>
                      <Text style={type.body}>
                        Slide the gate carriage to roughly{' '}
                        <Text style={styles.strong}>{target} cm</Text> down the slope from the
                        release mark. Roughly is fine — you are going to measure exactly where it
                        lands.
                      </Text>
                    </Panel>
                    <Slider
                      label="Gate carriage"
                      display="no scale"
                      value={params.trackM}
                      min={0.15}
                      max={MAX_TRACK_M}
                      step={0.001}
                      onChange={(v) => {
                        resetBlock();
                        setParams((p) => ({ ...p, trackM: v }));
                      }}
                    />
                    <GoldButton label="The gate is in place" onPress={() => setTrialPhase('measure')} />
                  </View>
                ) : null}

                {trialPhase === 'measure' ? (
                  <View style={styles.block}>
                    <MetreScale
                      label="Metre scale along the slope"
                      pointers={[
                        {
                          id: `gate-${trialIdx}`,
                          trueCm: truth.gateCm,
                          label: 'Gate',
                          tone: color.green,
                        },
                      ]}
                      profile={profile}
                      errorConfig={errorConfig}
                      eyeOffset={eyeOffset}
                      onEyeOffset={setEyeOffset}
                    />
                    <ReadingInput
                      instrument={INSTRUMENTS.metreScale}
                      label="Position of the gate"
                      value={gateRaw}
                      onChange={setGateRaw}
                      extraError={gateRaw ? misread(gateRaw, apparent(truth.gateCm)) : null}
                    />
                    {readingOk(gateRaw, apparent(truth.gateCm)) ? (
                      <>
                        <Panel style={{ gap: 6 }}>
                          <Eyebrow>Track length</Eyebrow>
                          <Text style={styles.derived}>
                            s = {Number(gateRaw).toFixed(1)} − {Number(d.releaseMarkRaw).toFixed(1)}{' '}
                            = {round1(Number(gateRaw) - Number(d.releaseMarkRaw)).toFixed(1)} cm
                          </Text>
                          <Text style={styles.derivedNote}>
                            Both ends read off the same scale, so any zero error in that scale
                            cancels in the subtraction. This is the one measurement today that is
                            immune to it.
                          </Text>
                        </Panel>
                        <GoldButton label="Now run it" onPress={() => setTrialPhase('time')} />
                      </>
                    ) : null}
                  </View>
                ) : null}

                {trialPhase === 'time' ? (
                  <View style={styles.block}>
                    <Panel style={{ gap: 7 }}>
                      <Text style={type.body}>
                        Release the block, and time it from the moment it breaks away to the moment
                        its leading face reaches the gate. You need {REPEATS_PER_TRIAL} runs at this
                        distance.
                      </Text>
                    </Panel>
                    <View style={styles.actions}>
                      <GhostButton label="Reset" onPress={resetBlock} />
                      <GoldButton
                        label={released ? 'Block released' : 'Release the block'}
                        onPress={release}
                        disabled={released}
                      />
                    </View>
                    <Stopwatch
                      zeroOffsetS={watch.zeroOffsetS}
                      startDelayS={watch.startDelayS}
                      onLap={recordLap}
                      disabled={!released || laps.length >= REPEATS_PER_TRIAL}
                    />
                    {laps.length ? (
                      <Panel style={{ gap: 8 }}>
                        <Eyebrow>Times recorded at this distance</Eyebrow>
                        <View style={styles.lapRow}>
                          {laps.map((l, i) => (
                            <Text key={i} style={styles.lap}>
                              t{i + 1} = {l.toFixed(2)} s
                            </Text>
                          ))}
                        </View>
                        {laps.length >= REPEATS_PER_TRIAL ? (
                          <Text style={styles.derivedNote}>
                            Mean t ={' '}
                            {(laps.reduce((a, b) => a + b, 0) / laps.length).toFixed(2)} s
                          </Text>
                        ) : null}
                      </Panel>
                    ) : null}
                    {laps.length >= REPEATS_PER_TRIAL ? (
                      <GoldButton label="Log this run" onPress={commitTrial} />
                    ) : null}
                  </View>
                ) : null}
              </>
            ) : null}

            {d.trials.length ? (
              <DataTable
                columns={TRIAL_COLUMNS}
                rows={d.trials.map((t, i) => ({
                  n: i + 1,
                  s: t.sCm.toFixed(1),
                  t1: t.times[0]?.toFixed(2),
                  t2: t.times[1]?.toFixed(2),
                  tm: t.meanT.toFixed(2),
                  v: ((2 * t.sCm) / 100 / t.meanT).toFixed(3),
                  v2: Math.pow((2 * t.sCm) / 100 / t.meanT, 2).toFixed(3),
                }))}
                caption="Blue columns were calculated, not measured. v = 2s/t because the block started from rest."
              />
            ) : null}

            {d.releaseMarkRaw !== '' ? <Annotation label="Technique">{step.note}</Annotation> : null}
          </View>
        ) : null}

        {step.kind === 'graph' ? (
          <View style={styles.block}>
            <GraphPlot
              points={graphPoints}
              xLabel="s"
              xUnit="m"
              yLabel="v²"
              yUnit="m² s⁻²"
              width={plotWidth}
              slopeLabel="Gradient (= 2a)"
              defaultThroughOrigin
            />
            <Annotation label="Reading the graph">{step.note}</Annotation>
            {analysis?.fit ? (
              <Panel style={{ gap: 6 }}>
                <Eyebrow>What the gradient is telling you</Eyebrow>
                <Text style={styles.derived}>
                  gradient = {formatSigFigs(analysis.fit.slope, 3)} m s⁻²
                </Text>
                <Text style={styles.derivedNote}>
                  A line that misses the origin badly means something systematic is wrong — a
                  mistimed start, or a track length measured from the wrong mark. Toggle the fit
                  above and see how far off zero the free intercept sits.
                </Text>
              </Panel>
            ) : null}
          </View>
        ) : null}

        {step.kind === 'accel' ? (
          <View style={styles.block}>
            <GraphPlot
              points={graphPoints}
              xLabel="s"
              xUnit="m"
              yLabel="v²"
              yUnit="m² s⁻²"
              width={plotWidth}
              slopeLabel="Gradient (= 2a)"
              defaultThroughOrigin
            />
            <DerivedAnswer
              label="Acceleration a"
              unit=" m s⁻²"
              value={d.accelRaw}
              onChange={(v) => set({ accelRaw: v })}
              expected={analysis?.aMeasured}
              sf={sf}
              hint="Half of the gradient of your best-fit line."
            />
            <DerivedAnswer
              label="Coefficient of kinetic friction μ"
              unit=""
              value={d.muRaw}
              onChange={(v) => set({ muRaw: v })}
              expected={analysis?.muMeasured}
              sf={Math.min(sf, 2)}
              hint="Rearrange a = g(sin θ − μ cos θ) with g = 9.8 m s⁻²."
            />
            <Annotation label="Significant figures">{step.note}</Annotation>
          </View>
        ) : null}

        {step.kind === 'work' ? (
          <WorkAudit
            d={d}
            set={set}
            analysis={analysis}
            sf={sf}
            note={step.note}
          />
        ) : null}

        {step.kind === 'report' ? (
          <Report
            d={d}
            analysis={analysis}
            sf={sf}
            params={params}
            profile={profile}
            errorConfig={errorConfig}
          />
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        {stepIndex > 0 ? (
          <GhostButton label="Back" onPress={() => setStepIndex((i) => i - 1)} />
        ) : null}
        <GoldButton
          label={stepIndex === STEPS.length - 1 ? 'Finish the lab' : 'Continue'}
          onPress={advance}
          disabled={!complete}
        />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------

function DerivedAnswer({ label, unit, value, onChange, expected, sf, hint }) {
  const [touched, setTouched] = useState(false);
  const result =
    touched && value && Number.isFinite(expected)
      ? checkDerived(value, { expected, sf, unit, tolerance: 0.06 })
      : null;

  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.answerLabel}>{label}</Text>
      <View
        style={[
          styles.answerField,
          result?.ok && { borderColor: withAlpha(color.green, 0.55) },
          result && !result.ok && { borderColor: withAlpha(color.red, 0.55) },
        ]}
      >
        <AnswerInput value={value} onChange={onChange} onTouch={() => setTouched(true)} />
        {unit ? <Text style={styles.answerUnit}>{unit.trim()}</Text> : null}
      </View>
      {result?.errors?.map((e) => (
        <Text key={e} style={[styles.feedback, { color: color.red }]}>
          {e}
        </Text>
      ))}
      {result?.warnings?.map((w) => (
        <Text key={w} style={[styles.feedback, { color: color.amber }]}>
          {w}
        </Text>
      ))}
      {result?.ok ? (
        <Text style={[styles.feedback, { color: color.green }]}>
          That follows from your data, to the right precision.
        </Text>
      ) : null}
      {!result && hint ? <Text style={styles.feedback}>{hint}</Text> : null}
    </View>
  );
}

function AnswerInput({ value, onChange, onTouch }) {
  return (
    <TextInput
      style={styles.answerInput}
      value={value}
      onChangeText={(t) => {
        onTouch();
        onChange(t.replace(/[^0-9.\-]/g, ''));
      }}
      placeholder="0.00"
      placeholderTextColor="rgba(28,24,21,0.25)"
      keyboardType="decimal-pad"
      returnKeyType="done"
    />
  );
}

function WorkAudit({ d, set, analysis, sf, note }) {
  const last = d.trials[d.trials.length - 1];
  if (!analysis || !last) {
    return (
      <Panel>
        <Text style={type.body}>Complete the trials first — there is nothing to audit yet.</Text>
      </Panel>
    );
  }
  const m = analysis.m;
  const s = last.sCm / 100;
  const v = (2 * s) / last.meanT;
  const mu = analysis.muMeasured;
  const wGrav = m * G_EARTH * s * analysis.sinTheta;
  const wFric = -mu * m * G_EARTH * s * analysis.cosTheta;
  const ke = 0.5 * m * v * v;

  const entered =
    d.wGravRaw !== '' && d.wFricRaw !== '' && d.keRaw !== ''
      ? {
          sum: Number(d.wGravRaw) + Number(d.wFricRaw),
          ke: Number(d.keRaw),
        }
      : null;

  return (
    <View style={styles.block}>
      <Panel style={{ gap: 7 }}>
        <Eyebrow>Working from run {d.trials.length}</Eyebrow>
        <Text style={styles.derivedNote}>
          m = {(m * 1000).toFixed(0)} g · s = {last.sCm.toFixed(1)} cm · t ={' '}
          {last.meanT.toFixed(2)} s · θ = {analysis.thetaDeg.toFixed(2)}° · μ ={' '}
          {formatSigFigs(mu, 2)}
        </Text>
      </Panel>

      <DerivedAnswer
        label="Work done by gravity W_g"
        unit=" J"
        value={d.wGravRaw}
        onChange={(v2) => set({ wGravRaw: v2 })}
        expected={wGrav}
        sf={sf}
        hint="mgs sin θ — only the component of the weight along the slope does any work."
      />
      <DerivedAnswer
        label="Work done by friction W_f"
        unit=" J"
        value={d.wFricRaw}
        onChange={(v2) => set({ wFricRaw: v2 })}
        expected={wFric}
        sf={Math.min(sf, 2)}
        hint="−μmgs cos θ. Friction opposes the motion, so this one is negative."
      />
      <DerivedAnswer
        label="Final kinetic energy K"
        unit=" J"
        value={d.keRaw}
        onChange={(v2) => set({ keRaw: v2 })}
        expected={ke}
        sf={sf}
        hint="½mv², with v = 2s/t."
      />

      {entered ? (
        <Panel
          tone={
            Math.abs(entered.sum - entered.ke) / Math.max(Math.abs(entered.ke), 1e-6) < 0.08
              ? withAlpha(color.green, 0.45)
              : withAlpha(color.amber, 0.45)
          }
          style={{ gap: 7 }}
        >
          <Eyebrow
            tone={
              Math.abs(entered.sum - entered.ke) / Math.max(Math.abs(entered.ke), 1e-6) < 0.08
                ? color.green
                : color.amber
            }
          >
            The work–energy theorem
          </Eyebrow>
          <Text style={styles.derived}>
            W_g + W_f = {entered.sum.toFixed(3)} J vs K = {entered.ke.toFixed(3)} J
          </Text>
          <Text style={styles.derivedNote}>
            {Math.abs(entered.sum - entered.ke) / Math.max(Math.abs(entered.ke), 1e-6) < 0.08
              ? 'The net work done on the block equals the kinetic energy it gained. Nothing was assumed — this came out of a length, a mass and a time you measured yourself.'
              : 'These do not balance. The gap is the size of the error you carried in from your readings — most of it will be in the times, because K depends on v and v depends on 1/t.'}
          </Text>
        </Panel>
      ) : null}

      <Annotation label="The formulae">{note}</Annotation>
    </View>
  );
}

function Report({ d, analysis, sf, params, profile, errorConfig }) {
  if (!analysis) {
    return (
      <Panel>
        <Text style={type.body}>No data to report.</Text>
      </Panel>
    );
  }
  const surf = surfaceOf(params);
  const trueTheta = params.thetaDeg;
  const trueMu = surf.muK;
  const trueA =
    params.g * (Math.sin(trueTheta * DEG) - trueMu * Math.cos(trueTheta * DEG));

  const rows = [
    {
      q: 'Angle θ',
      yours: `${analysis.thetaDeg.toFixed(2)}°`,
      actual: `${trueTheta.toFixed(2)}°`,
      err: pct(analysis.thetaDeg, trueTheta),
    },
    {
      q: 'Mass',
      yours: `${Number(d.massRaw).toFixed(0)} g`,
      actual: `${(params.massKg * 1000).toFixed(0)} g`,
      err: pct(Number(d.massRaw), params.massKg * 1000),
    },
    {
      q: 'Acceleration a',
      yours: `${formatSigFigs(analysis.aMeasured, sf)} m s⁻²`,
      actual: `${trueA.toFixed(2)} m s⁻²`,
      err: pct(analysis.aMeasured, trueA),
    },
    {
      q: 'Friction μ',
      yours: formatSigFigs(analysis.muMeasured, 2),
      actual: trueMu.toFixed(2),
      err: pct(analysis.muMeasured, trueMu),
    },
  ];

  const timingBias = (() => {
    const pairs = d.trials.filter((t) => Number.isFinite(t.trueMeanT));
    if (!pairs.length) return null;
    const mean =
      pairs.reduce((acc, t) => acc + (t.meanT - t.trueMeanT), 0) / pairs.length;
    return mean;
  })();

  return (
    <View style={styles.block}>
      <Panel style={{ gap: 12 }}>
        <Eyebrow tone={color.brass}>Your result against the bench</Eyebrow>
        {rows.map((r) => (
          <View key={r.q} style={styles.reportRow}>
            <Text style={styles.reportQ}>{r.q}</Text>
            <Text style={styles.reportYours}>{r.yours}</Text>
            <Text style={styles.reportActual}>{r.actual}</Text>
            <Text
              style={[
                styles.reportErr,
                { color: Math.abs(r.err) < 3 ? color.green : Math.abs(r.err) < 10 ? color.amber : color.red },
              ]}
            >
              {r.err >= 0 ? '+' : ''}
              {r.err.toFixed(1)}%
            </Text>
          </View>
        ))}
      </Panel>

      <Annotation label="Where your error came from" tone={color.physics}>
        <View style={{ gap: 10 }}>
          {!errorConfig.zeroError && !errorConfig.parallax && !errorConfig.timingLag ? (
            <Text style={type.body}>
              You ran with clean apparatus, so whatever spread you see is your own reading and
              timing. Turn on the systematic errors and run it again — the difference between random
              scatter and a systematic bias is the single most examined idea in practical physics.
            </Text>
          ) : null}

          {errorConfig.timingLag && timingBias !== null ? (
            <Text style={type.body}>
              <Text style={styles.strong}>Stopwatch lag. </Text>
              Your times ran on average {timingBias >= 0 ? '' : '−'}
              {Math.abs(timingBias).toFixed(2)} s {timingBias >= 0 ? 'long' : 'short'} against the
              true gate times. The watch's start button stuck for {profile.startStickS.toFixed(2)} s
              and it rested at {profile.stopwatchZeroS.toFixed(2)} s instead of zero. Because v =
              2s/t, a time that is too {timingBias >= 0 ? 'long' : 'short'} makes every speed too{' '}
              {timingBias >= 0 ? 'low' : 'high'}, and drags your acceleration — and therefore your μ
              — with it.
            </Text>
          ) : null}

          {errorConfig.zeroError ? (
            <Text style={type.body}>
              <Text style={styles.strong}>Zero error. </Text>
              The balance sat {profile.balanceZeroG} g off zero and the metre scale's zero was worn
              by {profile.scaleZeroCm.toFixed(1)} cm. Notice which measurements it spoiled: the rise
              and the run, both read from one end, carry the full offset. Your track lengths do not,
              because you read both ends on the same scale and subtracted.
            </Text>
          ) : null}

          {errorConfig.parallax ? (
            <Text style={type.body}>
              <Text style={styles.strong}>Parallax. </Text>
              The scale stood proud of the surface, so every reading taken off-axis was displaced by
              up to {profile.parallaxGainCm.toFixed(2)} cm. Unlike a zero error this one changes
              whenever you move, which makes it look like random scatter in the data even though it
              is not.
            </Text>
          ) : null}
        </View>
      </Annotation>

      <Annotation label="What you proved" tone={color.green}>
        From one mass, two lengths and a handful of times, you produced an acceleration that never
        mentioned the mass, a coefficient of friction for a surface you never touched, and a
        demonstration that the work done on a body equals the kinetic energy it gains. Every number
        on this page traces back to a graduation you read yourself.
      </Annotation>
    </View>
  );
}

// ---------------------------------------------------------------------------

function Progress({ index, total }) {
  return (
    <View style={styles.progress}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.pip,
            i < index && { backgroundColor: color.brass },
            i === index && { backgroundColor: color.gold, flex: 2 },
          ]}
        />
      ))}
    </View>
  );
}

const TRIAL_COLUMNS = [
  { key: 'n', label: '#', width: 30 },
  { key: 's', label: 's', unit: 'cm', width: 58 },
  { key: 't1', label: 't₁', unit: 's', width: 52 },
  { key: 't2', label: 't₂', unit: 's', width: 52 },
  { key: 'tm', label: 't̄', unit: 's', width: 52 },
  { key: 'v', label: 'v', unit: 'm s⁻¹', width: 62, derived: true, divider: true },
  { key: 'v2', label: 'v²', unit: 'm² s⁻²', width: 68, derived: true },
];

function round1(x) {
  return Math.round(x * 10) / 10;
}

function pct(a, b) {
  if (!Number.isFinite(a) || !Number.isFinite(b) || b === 0) return 0;
  return ((a - b) / b) * 100;
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 30, gap: 18 },
  block: { gap: 16 },
  stepHead: { gap: 0 },
  progress: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  pip: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(28,24,21,0.1)',
  },
  actions: { flexDirection: 'row', gap: 10 },
  trialHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  derived: {
    fontFamily: font.bold,
    fontSize: 16,
    letterSpacing: -0.3,
    color: color.inkStrong,
    fontVariant: ['tabular-nums'],
  },
  derivedNote: {
    fontFamily: font.regular,
    fontSize: 11.5,
    lineHeight: 18,
    color: color.inkMuted,
  },
  strong: { fontFamily: font.bold, color: color.inkStrong },
  lapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  lap: {
    fontFamily: font.bold,
    fontSize: 13,
    color: color.inkStrong,
    fontVariant: ['tabular-nums'],
  },
  answerLabel: {
    fontFamily: font.bold,
    fontSize: 9.5,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: color.inkMuted,
  },
  answerField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: color.hairline,
    borderRadius: radius.chip,
    backgroundColor: color.paper,
    paddingHorizontal: 14,
    height: 50,
  },
  answerInput: {
    flex: 1,
    fontFamily: font.bold,
    fontSize: 19,
    letterSpacing: -0.3,
    color: color.ink,
    padding: 0,
  },
  answerUnit: { fontFamily: font.semibold, fontSize: 13, color: color.inkMuted },
  feedback: {
    fontFamily: font.medium,
    fontSize: 11.5,
    lineHeight: 17,
    color: color.inkMuted,
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    borderTopWidth: StyleSheet.hairlineWidth * 2,
    borderTopColor: color.hairline,
    backgroundColor: color.screen,
  },
  reportRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  reportQ: { flex: 1.3, fontFamily: font.semibold, fontSize: 12, color: color.inkBody },
  reportYours: {
    flex: 1,
    fontFamily: font.bold,
    fontSize: 12,
    color: color.inkStrong,
    fontVariant: ['tabular-nums'],
    textAlign: 'right',
  },
  reportActual: {
    flex: 1,
    fontFamily: font.medium,
    fontSize: 12,
    color: color.inkMuted,
    fontVariant: ['tabular-nums'],
    textAlign: 'right',
  },
  reportErr: {
    width: 52,
    fontFamily: font.bold,
    fontSize: 11,
    fontVariant: ['tabular-nums'],
    textAlign: 'right',
  },
});
