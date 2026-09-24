import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { color, font, type, radius } from '../../theme';
import { Eyebrow, GoldButton, GhostButton, Annotation, Panel, Tag, withAlpha } from '../../components/ui';
import LaunchScene from './LaunchScene';
import GravityDeck, { GravityRelation } from './GravityDeck';
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
import { apparentScaleReading, apparentMassG, stopwatchFaults, apparentLaunchSpeed } from './errors';
import {
  WORLDS,
  TRIAL_WORLDS,
  analyseStudentData,
  gravityFromRange,
  nearestWorld,
  flightTime,
  rangeOf,
  initialState,
} from './physics';
import { STEPS, REPEATS_TIMED } from './steps';
import { useLabLayout } from '../useLabLayout';

const READ_TOLERANCE_CM = 0.15; // a correctly-read millimetre, plus a mark of slack

export default function GuidedFlow({
  params,
  setParams,
  simRef,
  profile,
  errorConfig,
  mysteryKey,
  onFinish,
}) {
  const { width } = useWindowDimensions();
  const layout = useLabLayout();
  const [stepIndex, setStepIndex] = useState(0);
  const [eyeOffset, setEyeOffset] = useState(errorConfig.parallax ? -0.55 : 0);
  const [d, setD] = useState({
    massRaw: '',
    heightRaw: '',
    originRaw: '',
    trials: [],
    times: [],
    uRaw: '',
    mysteryRaw: '',
    gMysteryRaw: '',
  });

  // per-launch working state
  const [shots, setShots] = useState([]); // committed landing readings, cm
  const [shotRaw, setShotRaw] = useState('');
  const [landed, setLanded] = useState(null); // { tapeCm, t } for the flight just finished
  const [flying, setFlying] = useState(false);
  const [runU, setRunU] = useState(params.speedMS);
  const shotCount = useRef(0);

  const step = STEPS[stepIndex];
  const watch = stopwatchFaults(profile, errorConfig);
  const set = (patch) => setD((prev) => ({ ...prev, ...patch }));

  // The launcher's spring is the same on every world, so the speed the scene
  // integrates is the true one — unless launcher scatter is switched on, in
  // which case each shot gets its own push and the student has to repeat.
  const runParams = useMemo(() => ({ ...params, speedMS: runU }), [params, runU]);

  const shotsNeeded = errorConfig.launcherScatter ? 2 : 1;

  // --- truth the instruments are pointing at -------------------------------
  const truth = useMemo(
    () => ({
      massG: params.massKg * 1000,
      heightCm: params.heightM * 100,
      originCm: params.originM * 100,
    }),
    [params.massKg, params.heightM, params.originM]
  );

  const apparent = useCallback(
    (trueCm) => apparentScaleReading(trueCm, profile, errorConfig, eyeOffset),
    [profile, errorConfig, eyeOffset]
  );

  const misread = (raw, expectedCm) => {
    const v = Number(raw);
    if (!Number.isFinite(v)) return null;
    if (Math.abs(v - expectedCm) <= READ_TOLERANCE_CM) return null;
    return 'That is not what the tape says. Find the graduation the marker actually falls on and read it again.';
  };

  const readingOk = (raw, expectedCm) =>
    !!raw && validateReading(raw, INSTRUMENTS.metreScale).ok && !misread(raw, expectedCm);

  // --- launching -----------------------------------------------------------
  const resetRover = useCallback(() => {
    simRef.current.running = false;
    simRef.current.state = initialState();
    setLanded(null);
    setFlying(false);
  }, [simRef]);

  const launch = useCallback(() => {
    shotCount.current += 1;
    setRunU(apparentLaunchSpeed(params.speedMS, profile, errorConfig, shotCount.current));
    simRef.current.state = initialState();
    simRef.current.running = true;
    setLanded(null);
    setFlying(true);
  }, [params.speedMS, profile, errorConfig, simRef]);

  const onLand = useCallback(
    ({ t, x }) => {
      setFlying(false);
      setLanded({ tapeCm: (params.originM + x) * 100, t });
    },
    [params.originM]
  );

  const chooseWorld = useCallback(
    (key) => {
      resetRover();
      setShots([]);
      setShotRaw('');
      setParams((p) => ({ ...p, world: key, g: WORLDS[key].g }));
    },
    [resetRover, setParams]
  );

  // The timing step belongs to the slowest world the student actually ran; the
  // sealed world is fixed for the session. Both are set on arrival so the
  // bench is already standing on the right planet.
  useEffect(() => {
    if (step.kind === 'timing') {
      const slowest = [...d.trials].sort((a, b) => a.g - b.g)[0];
      if (slowest && params.world !== slowest.worldKey) chooseWorld(slowest.worldKey);
    }
    if (step.kind === 'mystery' && params.world !== mysteryKey) chooseWorld(mysteryKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step.kind]);

  // --- derived analysis ----------------------------------------------------
  const analysis = useMemo(() => {
    const heightCm = Number(d.heightRaw);
    if (!heightCm || d.trials.length < 2) return null;
    return analyseStudentData(
      d.trials.map((t) => ({ worldKey: t.worldKey, g: t.g, rCm: t.rCm })),
      { heightCm }
    );
  }, [d.heightRaw, d.trials]);

  // The weakest reading in the whole experiment caps every derived answer.
  const sf = useMemo(() => {
    const lcScale = INSTRUMENTS.metreScale.leastCount;
    const parts = [
      sigFigsForReading(d.heightRaw, lcScale),
      sigFigsForReading(d.originRaw, lcScale),
    ];
    d.trials.forEach((t) => t.readings.forEach((r) => parts.push(sigFigsForReading(r, lcScale))));
    return combineSigFigs(...parts) || 3;
  }, [d.heightRaw, d.originRaw, d.trials]);

  const mysteryRCm =
    d.mysteryRaw !== '' && d.originRaw !== ''
      ? round1(Number(d.mysteryRaw) - Number(d.originRaw))
      : null;
  const gMysteryExpected =
    analysis && mysteryRCm ? gravityFromRange(analysis.gradient, mysteryRCm) : NaN;

  // --- step gating ---------------------------------------------------------
  const complete = useMemo(() => {
    switch (step.kind) {
      case 'mass':
        return d.massRaw !== '';
      case 'geometry':
        return d.heightRaw !== '' && d.originRaw !== '';
      case 'trials':
        return d.trials.length >= TRIAL_WORLDS.length;
      case 'timing':
        return d.times.length >= REPEATS_TIMED;
      case 'graph':
        return d.trials.length >= 4;
      case 'speed':
        return d.uRaw !== '';
      case 'mystery':
        return d.mysteryRaw !== '' && d.gMysteryRaw !== '';
      default:
        return true;
    }
  }, [step, d]);

  const advance = () => {
    if (stepIndex < STEPS.length - 1) setStepIndex((i) => i + 1);
    else onFinish?.({ data: d, analysis, sf });
  };

  // --- trial machinery -----------------------------------------------------
  const doneKeys = d.trials.map((t) => t.worldKey);
  const remainingKeys = TRIAL_WORLDS.filter((k) => !doneKeys.includes(k));
  const selectedIsPending = remainingKeys.includes(params.world);

  const recordShot = () => {
    const next = [...shots, Number(shotRaw)];
    setShotRaw('');
    setLanded(null);
    simRef.current.state = initialState();
    if (next.length >= shotsNeeded) {
      const mean = next.reduce((a, b) => a + b, 0) / next.length;
      const rCm = round1(mean - Number(d.originRaw));
      setD((prev) => ({
        ...prev,
        trials: [
          ...prev.trials,
          {
            worldKey: params.world,
            g: WORLDS[params.world].g,
            readings: next,
            landingCm: round1(mean),
            rCm,
            trueRCm: rangeOf({ ...params, speedMS: params.speedMS }) * 100,
          },
        ],
      }));
      setShots([]);
    } else {
      setShots(next);
    }
  };

  const graphPoints = useMemo(
    () =>
      d.trials.map((t) => {
        const R = t.rCm / 100;
        return { x: 1 / t.g, y: R * R, label: WORLDS[t.worldKey].label };
      }),
    [d.trials]
  );

  const plotWidth = Math.min(width - 68, 360);

  return (
    <View style={{ flex: 1 }}>
      <Progress index={stepIndex} total={STEPS.length} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scroll, layout.contentStyle]}
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
              label="Reading with the rover on the pan"
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
            <Annotation label="Keep this number">{step.note}</Annotation>
          </View>
        ) : null}

        {step.kind === 'geometry' ? (
          <View style={styles.block}>
            <LaunchScene params={runParams} simRef={simRef} height={layout.stageHeight - 30} showTrail={false} />
            <MetreScale
              label="Metre scale — height of the deck lip above the floor"
              pointers={[{ id: 'height', trueCm: truth.heightCm, label: 'Lip h', tone: color.physics }]}
              profile={profile}
              errorConfig={errorConfig}
              eyeOffset={eyeOffset}
              onEyeOffset={setEyeOffset}
            />
            <ReadingInput
              instrument={INSTRUMENTS.metreScale}
              label="Deck height h"
              value={d.heightRaw}
              onChange={(v) => set({ heightRaw: v })}
              extraError={d.heightRaw ? misread(d.heightRaw, apparent(truth.heightCm)) : null}
            />
            <MetreScale
              label="Floor tape — the mark directly under the lip"
              pointers={[{ id: 'origin', trueCm: truth.originCm, label: 'Lip', tone: color.brass }]}
              profile={profile}
              errorConfig={errorConfig}
              eyeOffset={eyeOffset}
              onEyeOffset={setEyeOffset}
            />
            <ReadingInput
              instrument={INSTRUMENTS.metreScale}
              label="Tape reading under the lip — your origin x₀"
              value={d.originRaw}
              onChange={(v) => set({ originRaw: v })}
              extraError={d.originRaw ? misread(d.originRaw, apparent(truth.originCm)) : null}
            />
            <Annotation label="One end or two">{step.note}</Annotation>
          </View>
        ) : null}

        {step.kind === 'trials' ? (
          <View style={styles.block}>
            <View style={styles.trialHead}>
              <Eyebrow tone={color.brass}>
                {d.trials.length} of {TRIAL_WORLDS.length} worlds run
              </Eyebrow>
              <Tag
                label={
                  !selectedIsPending
                    ? 'Choose a world'
                    : landed
                    ? 'Read the tape'
                    : `Launch · ${shots.length}/${shotsNeeded}`
                }
                tone={color.brass}
                filled
              />
            </View>

            <LaunchScene params={runParams} simRef={simRef} onLand={onLand} height={layout.stageHeight} />

            <GravityDeck
              value={params.world}
              onChange={chooseWorld}
              worlds={TRIAL_WORLDS}
              locked={doneKeys}
              done={doneKeys}
              label="Gravity — pick a world to run"
              caption={
                remainingKeys.length
                  ? 'Worlds with a green dot are logged and cannot be re-run. Take them in any order you like.'
                  : 'All five worlds are logged. Move on to the timing.'
              }
            />

            {selectedIsPending ? (
              <>
                <GravityRelation g={params.g} />
                <View style={styles.actions}>
                  <GhostButton label="Reset" onPress={resetRover} />
                  <GoldButton
                    label={flying ? 'In flight…' : landed ? 'Launch again' : 'Launch the rover'}
                    onPress={launch}
                    disabled={flying || (!!landed && shots.length + 1 > shotsNeeded)}
                  />
                </View>

                {landed ? (
                  <>
                    <MetreScale
                      label="Floor tape — where the rover touched down"
                      pointers={[
                        {
                          id: `land-${params.world}-${shots.length}`,
                          trueCm: landed.tapeCm,
                          label: 'Landing',
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
                      label={`Landing position on ${WORLDS[params.world].label}`}
                      value={shotRaw}
                      onChange={setShotRaw}
                      extraError={shotRaw ? misread(shotRaw, apparent(landed.tapeCm)) : null}
                    />
                    {readingOk(shotRaw, apparent(landed.tapeCm)) ? (
                      <>
                        <Panel style={{ gap: 6 }}>
                          <Eyebrow>Range from the lip</Eyebrow>
                          <Text style={styles.derived}>
                            R = {Number(shotRaw).toFixed(1)} − {Number(d.originRaw).toFixed(1)} ={' '}
                            {round1(Number(shotRaw) - Number(d.originRaw)).toFixed(1)} cm
                          </Text>
                          <Text style={styles.derivedNote}>
                            Both ends read off the same tape, so whatever is wrong with that tape's
                            zero cancels in the subtraction. Your ranges are immune to it; your deck
                            height is not.
                          </Text>
                        </Panel>
                        <GoldButton
                          label={
                            shots.length + 1 >= shotsNeeded
                              ? `Log ${WORLDS[params.world].label}`
                              : `Record landing ${shots.length + 1} of ${shotsNeeded}`
                          }
                          onPress={recordShot}
                        />
                      </>
                    ) : null}
                  </>
                ) : null}

                {shots.length ? (
                  <Panel style={{ gap: 6 }}>
                    <Eyebrow>Landings logged on this world</Eyebrow>
                    <View style={styles.lapRow}>
                      {shots.map((s, i) => (
                        <Text key={i} style={styles.lap}>
                          x{i + 1} = {s.toFixed(1)} cm
                        </Text>
                      ))}
                    </View>
                    <Text style={styles.derivedNote}>
                      The spring does not push identically twice. Averaging two landings halves the
                      damage — which is exactly what averaging cannot do for a worn tape.
                    </Text>
                  </Panel>
                ) : null}
              </>
            ) : (
              <Panel style={{ gap: 7 }}>
                <Eyebrow tone={color.brass}>Pick a world</Eyebrow>
                <Text style={type.body}>
                  {remainingKeys.length
                    ? 'Tap one of the worlds above that has not been logged yet. The bench moves there and the launcher stays exactly as it is.'
                    : 'Every world is logged. Continue to the timing step.'}
                </Text>
              </Panel>
            )}

            {d.trials.length ? (
              <DataTable
                columns={TRIAL_COLUMNS}
                rows={d.trials.map((t) => ({
                  w: WORLDS[t.worldKey].label,
                  g: t.g.toFixed(2),
                  x: t.landingCm.toFixed(1),
                  r: t.rCm.toFixed(1),
                  invg: (1 / t.g).toFixed(3),
                  r2: Math.pow(t.rCm / 100, 2).toFixed(4),
                }))}
                caption="Blue columns were calculated, not measured. R is in centimetres; R² is in square metres, because that is what the graph wants."
              />
            ) : null}

            <Annotation label="What changed and what did not">{step.note}</Annotation>
          </View>
        ) : null}

        {step.kind === 'timing' ? (
          <View style={styles.block}>
            <Panel style={{ gap: 7 }}>
              <Eyebrow tone={color.brass}>Standing on {WORLDS[params.world]?.label}</Eyebrow>
              <Text style={type.body}>
                Start the watch as the rover leaves the lip and stop it as it touches down. Three
                flights. You are the timing instrument here — watch the rover, not the watch.
              </Text>
            </Panel>

            <LaunchScene params={runParams} simRef={simRef} onLand={onLand} height={layout.stageHeight - 10} />

            <View style={styles.actions}>
              <GhostButton label="Reset" onPress={resetRover} />
              <GoldButton
                label={flying ? 'In flight…' : 'Launch the rover'}
                onPress={launch}
                disabled={flying || d.times.length >= REPEATS_TIMED}
              />
            </View>

            <Stopwatch
              zeroOffsetS={watch.zeroOffsetS}
              startDelayS={watch.startDelayS}
              onLap={(s) => {
                if (d.times.length >= REPEATS_TIMED) return;
                setD((prev) => ({ ...prev, times: [...prev.times, s] }));
              }}
              disabled={d.times.length >= REPEATS_TIMED}
            />

            {d.times.length ? (
              <Panel style={{ gap: 8 }}>
                <Eyebrow>Flight times</Eyebrow>
                <View style={styles.lapRow}>
                  {d.times.map((t, i) => (
                    <Text key={i} style={styles.lap}>
                      t{i + 1} = {t.toFixed(2)} s
                    </Text>
                  ))}
                </View>
                {d.times.length >= REPEATS_TIMED ? (
                  <Text style={styles.derivedNote}>
                    Mean t̄ = {mean(d.times).toFixed(2)} s · spread{' '}
                    {(Math.max(...d.times) - Math.min(...d.times)).toFixed(2)} s
                  </Text>
                ) : null}
              </Panel>
            ) : null}

            {d.times.length >= REPEATS_TIMED && d.heightRaw ? (
              <>
                <DerivedAnswer
                  label={`Fall time predicted from your own h`}
                  unit=" s"
                  value={d.tPredRaw || ''}
                  onChange={(v) => set({ tPredRaw: v })}
                  expected={flightTime(Number(d.heightRaw) / 100, params.g)}
                  sf={Math.min(sf, 3)}
                  hint={`t = √(2h/g) with h = ${d.heightRaw} cm and g = ${params.g.toFixed(
                    2
                  )} m s⁻². Compare it with the mean you just timed.`}
                />
                <Panel style={{ gap: 6 }}>
                  <Eyebrow>Against the fast worlds</Eyebrow>
                  <Text style={styles.derivedNote}>
                    {TRIAL_WORLDS.map((k) => {
                      const t = flightTime(Number(d.heightRaw) / 100 || params.heightM, WORLDS[k].g);
                      return `${WORLDS[k].label} ${t.toFixed(2)} s`;
                    }).join(' · ')}
                  </Text>
                  <Text style={styles.derivedNote}>
                    A human reaction is about 0.2 s. On Jupiter that is most of the flight, which is
                    why this lab gets its answer from a tape measure and not from a stopwatch.
                  </Text>
                </Panel>
              </>
            ) : null}

            <Annotation label="Reaction time">{step.note}</Annotation>
          </View>
        ) : null}

        {step.kind === 'graph' ? (
          <View style={styles.block}>
            <GraphPlot
              points={graphPoints}
              xLabel="1/g"
              xUnit="s² m⁻¹"
              yLabel="R²"
              yUnit="m²"
              width={plotWidth}
              slopeLabel="Gradient (= 2u²h)"
              defaultThroughOrigin
              accent={color.space}
            />
            <Annotation label="Reading the graph">{step.note}</Annotation>
            {analysis?.fit ? (
              <Panel style={{ gap: 6 }}>
                <Eyebrow>What the gradient is telling you</Eyebrow>
                <Text style={styles.derived}>
                  gradient = {formatSigFigs(analysis.gradient, 3)} m³ s⁻²
                </Text>
                <Text style={styles.derivedNote}>
                  Five worlds, five ranges, one straight line. Toggle the free fit above and see how
                  far its intercept sits from zero — that gap is your systematic error made visible.
                </Text>
              </Panel>
            ) : null}
          </View>
        ) : null}

        {step.kind === 'speed' ? (
          <View style={styles.block}>
            <GraphPlot
              points={graphPoints}
              xLabel="1/g"
              xUnit="s² m⁻¹"
              yLabel="R²"
              yUnit="m²"
              width={plotWidth}
              slopeLabel="Gradient (= 2u²h)"
              defaultThroughOrigin
              accent={color.space}
            />
            <DerivedAnswer
              label="Launch speed u"
              unit=" m s⁻¹"
              value={d.uRaw}
              onChange={(v) => set({ uRaw: v })}
              expected={analysis?.uMeasured}
              sf={sf}
              hint={`u = √(gradient ÷ 2h), with h = ${d.heightRaw || '—'} cm expressed in metres.`}
            />
            {analysis ? (
              <Panel style={{ gap: 6 }}>
                <Eyebrow>Where the mass went</Eyebrow>
                <Text style={styles.derivedNote}>
                  You weighed the rover at {d.massRaw || '—'} g in step 2 and have not used it once.
                  R = u√(2h/g) contains no mass, so a rover twice as heavy would have landed on the
                  same mark. That is Galileo's result, arriving as a hole in your own working.
                </Text>
              </Panel>
            ) : null}
            <Annotation label="Significant figures">{step.note}</Annotation>
          </View>
        ) : null}

        {step.kind === 'mystery' ? (
          <View style={styles.block}>
            <LaunchScene params={runParams} simRef={simRef} onLand={onLand} height={layout.stageHeight - 10} sealed />

            <GravityDeck
              value={params.world}
              worlds={[mysteryKey]}
              label="Gravity — sealed"
              sealedLabel="Unknown"
              caption="The tab will not tell you this one. You are going to have to measure it."
            />

            <View style={styles.actions}>
              <GhostButton label="Reset" onPress={resetRover} />
              <GoldButton
                label={flying ? 'In flight…' : landed ? 'Launch again' : 'Launch the rover'}
                onPress={launch}
                disabled={flying}
              />
            </View>

            {landed ? (
              <>
                <MetreScale
                  label="Floor tape — landing on the sealed world"
                  pointers={[
                    {
                      id: 'mystery-land',
                      trueCm: landed.tapeCm,
                      label: 'Landing',
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
                  label="Landing position"
                  value={d.mysteryRaw}
                  onChange={(v) => set({ mysteryRaw: v })}
                  extraError={d.mysteryRaw ? misread(d.mysteryRaw, apparent(landed.tapeCm)) : null}
                />
              </>
            ) : null}

            {mysteryRCm ? (
              <Panel style={{ gap: 6 }}>
                <Eyebrow>Range on the sealed world</Eyebrow>
                <Text style={styles.derived}>R = {mysteryRCm.toFixed(1)} cm</Text>
                <Text style={styles.derivedNote}>
                  Your gradient k = {formatSigFigs(analysis?.gradient, 3)} m³ s⁻². Both the launch
                  speed and the deck height are already inside it, so g = k ÷ R² and nothing else is
                  needed.
                </Text>
              </Panel>
            ) : null}

            <DerivedAnswer
              label="Surface gravity of the sealed world"
              unit=" m s⁻²"
              value={d.gMysteryRaw}
              onChange={(v) => set({ gMysteryRaw: v })}
              expected={gMysteryExpected}
              sf={Math.min(sf, 3)}
              hint="g = k ÷ R², with R in metres."
            />

            <Annotation label="How this is really done">{step.note}</Annotation>
          </View>
        ) : null}

        {step.kind === 'report' ? (
          <Report
            d={d}
            analysis={analysis}
            sf={sf}
            params={params}
            profile={profile}
            errorConfig={errorConfig}
            mysteryKey={mysteryKey}
            mysteryRCm={mysteryRCm}
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
      ? checkDerived(value, { expected, sf, unit, tolerance: 0.07 })
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
        <TextInput
          style={styles.answerInput}
          value={value}
          onChangeText={(t) => {
            setTouched(true);
            onChange(t.replace(/[^0-9.\-]/g, ''));
          }}
          placeholder="0.00"
          placeholderTextColor="rgba(28,24,21,0.25)"
          keyboardType="decimal-pad"
          returnKeyType="done"
        />
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

function Report({ d, analysis, sf, params, profile, errorConfig, mysteryKey, mysteryRCm }) {
  if (!analysis) {
    return (
      <Panel>
        <Text style={type.body}>No data to report.</Text>
      </Panel>
    );
  }

  const trueU = params.speedMS;
  const trueH = params.heightM * 100;
  const mystery = WORLDS[mysteryKey];
  const gStudent = Number(d.gMysteryRaw);
  const named = Number.isFinite(gStudent) && gStudent > 0 ? nearestWorld(gStudent) : null;

  const rows = [
    {
      q: 'Deck height h',
      yours: `${Number(d.heightRaw).toFixed(1)} cm`,
      actual: `${trueH.toFixed(1)} cm`,
      err: pct(Number(d.heightRaw), trueH),
    },
    {
      q: 'Launch speed u',
      yours: `${formatSigFigs(analysis.uMeasured, sf)} m s⁻¹`,
      actual: `${trueU.toFixed(3)} m s⁻¹`,
      err: pct(analysis.uMeasured, trueU),
    },
    {
      q: `Gravity of ${mystery.label}`,
      yours: `${d.gMysteryRaw || '—'} m s⁻²`,
      actual: `${mystery.g.toFixed(2)} m s⁻²`,
      err: pct(gStudent, mystery.g),
    },
  ];

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
                {
                  color:
                    Math.abs(r.err) < 3
                      ? color.green
                      : Math.abs(r.err) < 10
                      ? color.amber
                      : color.red,
                },
              ]}
            >
              {r.err >= 0 ? '+' : ''}
              {r.err.toFixed(1)}%
            </Text>
          </View>
        ))}
      </Panel>

      <Panel tone={withAlpha(color.space, 0.45)} style={{ gap: 8 }}>
        <Eyebrow tone={color.space}>The sealed world was {mystery.label}</Eyebrow>
        <Text style={type.body}>
          A {mystery.body} with a surface gravity of {mystery.g.toFixed(2)} m s⁻². You measured{' '}
          {d.gMysteryRaw || '—'} m s⁻² from a single landing mark {mysteryRCm?.toFixed(1)} cm from
          the lip
          {named
            ? `, which is closest to ${named.world.label} in the catalogue — ${
                named.world.key === mysteryKey
                  ? 'you named it correctly'
                  : 'close enough to confuse it with a different world, which is what a 5% error buys you out here'
              }.`
            : '.'}
        </Text>
      </Panel>

      <DataTable
        columns={REPORT_COLUMNS}
        rows={d.trials.map((t) => ({
          w: WORLDS[t.worldKey].label,
          g: t.g.toFixed(2),
          r: t.rCm.toFixed(1),
          rt: t.trueRCm.toFixed(1),
          e: `${pct(t.rCm, t.trueRCm) >= 0 ? '+' : ''}${pct(t.rCm, t.trueRCm).toFixed(1)}%`,
        }))}
        title="Range, world by world"
        caption="A bias that runs the same way on every world is systematic. Scatter that changes sign is not."
      />

      <Annotation label="Where your error came from" tone={color.physics}>
        <View style={{ gap: 10 }}>
          {!errorConfig.zeroError &&
          !errorConfig.parallax &&
          !errorConfig.timingLag &&
          !errorConfig.launcherScatter ? (
            <Text style={type.body}>
              You ran with clean apparatus, so whatever spread you see is your own reading. Turn the
              faults on and run it again — telling random scatter apart from a systematic bias is
              the single most examined idea in practical physics.
            </Text>
          ) : null}

          {errorConfig.zeroError ? (
            <Text style={type.body}>
              <Text style={styles.strong}>Zero error. </Text>
              The balance sat {profile.balanceZeroG} g off zero and the tape's zero was scuffed by{' '}
              {profile.scaleZeroCm.toFixed(1)} cm. Notice which measurement it spoiled: the deck
              height, read from one end, carries the whole offset — and h sits inside your gradient,
              so it walked straight into your launch speed. Your ranges escaped it entirely, because
              you read both ends of the same tape and subtracted.
            </Text>
          ) : null}

          {errorConfig.parallax ? (
            <Text style={type.body}>
              <Text style={styles.strong}>Parallax. </Text>
              The tape lay below the wheels, so every reading taken off-axis was displaced by up to{' '}
              {profile.parallaxGainCm.toFixed(2)} cm. Unlike a zero error this one changes whenever
              you move, so it looks like random scatter in your graph even though each individual
              reading was wrong for a perfectly systematic reason.
            </Text>
          ) : null}

          {errorConfig.launcherScatter ? (
            <Text style={type.body}>
              <Text style={styles.strong}>Launcher scatter. </Text>
              The spring's push varied by about {(profile.launcherSigma * 100).toFixed(1)}% from
              shot to shot. This is the one fault today that averaging genuinely beats, which is why
              you launched twice on every world. It shows up as points scattered either side of your
              line — never as a line in the wrong place.
            </Text>
          ) : null}

          {errorConfig.timingLag && d.times.length ? (
            <Text style={type.body}>
              <Text style={styles.strong}>Stopwatch lag. </Text>
              The watch rested at {profile.stopwatchZeroS.toFixed(2)} s instead of zero and its start
              button stuck for {profile.startStickS.toFixed(2)} s. Both push every flight time the
              same way. It cost you nothing in the end — the graph that produced your answer never
              used a time at all, which is precisely why the experiment was built around a tape.
            </Text>
          ) : null}
        </View>
      </Annotation>

      <Annotation label="What you proved" tone={color.green}>
        From one height, one tape and five landing marks, you measured a speed without timing it,
        found that the mass of the rover appears nowhere in the result, and put a number on the
        surface gravity of a world you were told nothing about. Every figure on this page traces
        back to a graduation you read yourself.
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
  { key: 'w', label: 'World', width: 64 },
  { key: 'g', label: 'g', unit: 'm s⁻²', width: 60 },
  { key: 'x', label: 'x', unit: 'cm', width: 56 },
  { key: 'r', label: 'R', unit: 'cm', width: 56 },
  { key: 'invg', label: '1/g', unit: 's² m⁻¹', width: 66, derived: true, divider: true },
  { key: 'r2', label: 'R²', unit: 'm²', width: 66, derived: true },
];

const REPORT_COLUMNS = [
  { key: 'w', label: 'World', width: 64 },
  { key: 'g', label: 'g', unit: 'm s⁻²', width: 60 },
  { key: 'r', label: 'R yours', unit: 'cm', width: 64 },
  { key: 'rt', label: 'R bench', unit: 'cm', width: 66, derived: true, divider: true },
  { key: 'e', label: 'error', width: 58, derived: true },
];

function round1(x) {
  return Math.round(x * 10) / 10;
}

function mean(xs) {
  return xs.reduce((a, b) => a + b, 0) / (xs.length || 1);
}

function pct(a, b) {
  if (!Number.isFinite(a) || !Number.isFinite(b) || b === 0) return 0;
  return ((a - b) / b) * 100;
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 30, gap: 18 },
  block: { gap: 16 },
  stepHead: { gap: 0 },
  progress: { flexDirection: 'row', gap: 4, paddingHorizontal: 20, paddingBottom: 14 },
  pip: { flex: 1, height: 3, borderRadius: 2, backgroundColor: 'rgba(28,24,21,0.1)' },
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
