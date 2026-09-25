import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { color, font, radius, shadow } from '../../theme';
import { withAlpha } from '../../components/ui';
// Language-aware Text: one import makes every string in this file carry the
// Devanagari face when the bench is running in Hindi.
import { Text, useLanguage } from '../../i18n';
import Slider from '../../components/Slider';
import EyeScene from './EyeScene';
import RetinalView, { verdictFor } from './RetinalView';
import { STATIONS, BENCH_MIN_CM, BENCH_MAX_CM } from './steps';
import { EYES, focusFor, resolveFocus, checkReading, correctionFor } from './optics';
import { INSTRUMENTS, sigFigsForReading } from '../../measure/leastCount';

const BENCH = INSTRUMENTS.metreScale; // least count 0.1 cm

// The acuity card in the meter, laid on its side next to the readings rather
// than stacked above them. Its aspect follows RetinalView's own viewBox, so the
// letters keep their proportions whatever the bar is sized to.
// Kept deliberately small: the card is the tallest thing in the bar, and every
// pixel the bar takes comes off the bench on a short landscape phone.
const POV_W = 100;
const POV_H = Math.round((POV_W * 120) / 208);

/**
 * The bench, run as a guided walk from one eye to the next.
 *
 * Each station plays the same five beats, and the instruction box is the thing
 * that carries them:
 *
 *   arriving  the camera travels to the eye; no box, slider locked
 *   brief     the box appears and asks for a slider move
 *   adjust    the box gets out of the way the instant the slider is touched
 *   record    they let go, the box returns and asks for the reading
 *   reveal    on the two defective eyes, the spectacle lens goes in
 *
 * Recording validates the *action* — did they stop at the boundary? A miss is
 * sent back with the direction to go and never with the number.
 */
export default function GuidedFlow({ onFinish }) {
  const { width: winW, height: winH } = useWindowDimensions();
  const landscape = winW > winH;
  const { t } = useLanguage();

  const [frame, setFrame] = useState({ w: 0, h: 0 });
  const [idx, setIdx] = useState(0);
  const [beat, setBeat] = useState('arriving');
  const [objectCm, setObjectCm] = useState(STATIONS[0].homeCm);
  const [rows, setRows] = useState([]);
  const [nudge, setNudge] = useState(null);
  const [mix, setMix] = useState(0); // spectacle lens, 0 → 1

  const camera = useRef(new Animated.Value(0)).current;
  const boxIn = useRef(new Animated.Value(0)).current;

  const station = STATIONS[idx];
  const eye = EYES[station.eyeKey];
  const focus = useMemo(() => focusFor(eye, objectCm), [eye, objectCm]);

  // On the reveal beat the spectacle lens worked out from the student's own
  // reading goes into the path and the eye is solved again with it there. The
  // sharpness that comes back is earned by the prescription rather than
  // asserted by the beat — get the reading wrong and the lens is wrong with it.
  const correction = useMemo(() => correctionFor(station, objectCm), [station, objectCm]);
  const wearing = beat === 'reveal' && correction.kind !== 'none';
  const shownFocus = useMemo(
    () =>
      wearing
        ? resolveFocus({ retinaCm: eye.retinaCm, specD: correction.powerD }, objectCm)
        : focus,
    [wearing, eye.retinaCm, correction.powerD, objectCm, focus]
  );
  const shownLens = wearing ? { kind: correction.kind, mix } : null;

  // --- the camera travelling between stations ---------------------------
  useEffect(() => {
    if (!frame.w) return;
    Animated.spring(camera, {
      toValue: -idx * frame.w,
      useNativeDriver: true,
      damping: 19,
      stiffness: 70,
      mass: 1.1,
    }).start();
  }, [idx, frame.w, camera]);

  // Arriving is a beat in its own right: the box waits until the travel is
  // over, so the student watches the eye come in rather than reading over it.
  useEffect(() => {
    if (beat !== 'arriving') return undefined;
    const t = setTimeout(() => setBeat('brief'), idx === 0 ? 620 : 900);
    return () => clearTimeout(t);
  }, [beat, idx]);

  const showBox = beat === 'brief' || beat === 'record' || beat === 'reveal';

  useEffect(() => {
    Animated.timing(boxIn, {
      toValue: showBox ? 1 : 0,
      duration: showBox ? 260 : 170,
      useNativeDriver: true,
    }).start();
  }, [showBox, boxIn]);

  // --- the spectacle lens arriving --------------------------------------
  useEffect(() => {
    if (beat !== 'reveal') {
      setMix(0);
      return undefined;
    }
    // Driven through state rather than an Animated prop: react-native-svg's
    // animated bindings are inconsistent across backends, and thirty frames of
    // re-render on a static scene costs nothing.
    let raf;
    const t0 = Date.now();
    const tick = () => {
      const p = Math.min(1, (Date.now() - t0) / 700);
      setMix(easeOut(p));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [beat]);

  // --- slider ------------------------------------------------------------
  const locked = beat === 'arriving' || beat === 'reveal';

  const onSlideStart = useCallback(() => {
    if (locked) return;
    setNudge(null);
    setBeat('adjust'); // the box gets out of the way
  }, [locked]);

  const onSlideEnd = useCallback(() => {
    if (locked) return;
    setBeat('record'); // and comes back asking for the reading
  }, [locked]);

  // --- recording ---------------------------------------------------------
  // One reading per station, however many times the button is hit. A ref
  // rather than the beat, because two taps in the same frame both see the
  // pre-render state and would otherwise bank the reading twice.
  const banked = useRef(null);

  const record = () => {
    if (banked.current === station.key) return;
    const verdict = checkReading(station, objectCm);
    if (!verdict.ok) {
      setNudge(t(verdict.hintKey, { dir: t(verdict.dirKey) }));
      return;
    }
    banked.current = station.key;
    const reading = Number(objectCm.toFixed(1));
    const correction = correctionFor(station, reading);
    setRows((r) => [
      ...r,
      {
        stationKey: station.key,
        // English, deliberately: this goes into the saved lab record, which
        // has to stay comparable whatever language the bench was run in.
        limit: station.readingLabel,
        readingCm: reading,
        sf: sigFigsForReading(reading, BENCH.leastCount),
        correction,
      },
    ]);
    setNudge(null);
    setBeat(station.hasReveal ? 'reveal' : 'done');
  };

  const advance = () => {
    const next = idx + 1;
    if (next >= STATIONS.length) {
      onFinish(rows);
      return;
    }
    setObjectCm(STATIONS[next].homeCm); // the slider resets for the next eye
    setNudge(null);
    setMix(0);
    setIdx(next);
    setBeat('arriving');
  };

  // 'done' is a pass-through beat so that Record and Continue are never the
  // same tap on the same frame.
  useEffect(() => {
    if (beat !== 'done') return undefined;
    const t = setTimeout(advance, 260);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beat]);

  const boxStyle = {
    opacity: boxIn,
    transform: [
      { translateY: boxIn.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) },
    ],
  };

  return (
    <View style={styles.wrap}>
      {/* Progress and the retinal readout share one bar above the bench. Both
          used to float over the scene, and the meter floated over exactly the
          corner the eye is drawn in — it covered the eyeball in portrait and
          clipped it in landscape. In flow, neither can reach the drawing. */}
      <View style={styles.topBar}>
        <View style={styles.pips}>
          {STATIONS.map((s, i) => (
            <View
              key={s.key}
              style={[
                styles.pip,
                i === idx && { backgroundColor: s.tone, width: 22 },
                i < idx && { backgroundColor: withAlpha(color.paper, 0.55) },
              ]}
            />
          ))}
          <Text style={styles.pipLabel} numberOfLines={1}>
            {t(`eye.${station.key}.ordinal`)} · {t(`eye.${station.key}.name`)}
          </Text>
        </View>

        <SharpnessMeter
          focus={shownFocus}
          corrected={wearing}
          clinical={t(`eye.${station.key}.clinical`)}
        />
      </View>

      <View
        style={styles.stage}
        onLayout={(e) =>
          setFrame({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })
        }
      >
        {frame.w > 0 ? (
        <Animated.View
          style={[
            styles.track,
            { width: frame.w * STATIONS.length, transform: [{ translateX: camera }] },
          ]}
          pointerEvents="none"
        >
          {STATIONS.map((s, i) => (
            <EyeScene
              key={s.key}
              station={s}
              eye={EYES[s.eyeKey]}
              objectCm={i === idx ? objectCm : s.homeCm}
              focus={i === idx ? shownFocus : focusFor(EYES[s.eyeKey], s.homeCm)}
              lens={i === idx ? shownLens : null}
              width={frame.w}
              height={frame.h}
            />
          ))}
        </Animated.View>
      ) : null}

      {/* ---- the instruction box ---- */}
      {/* Centred while they work, but pushed aside for the correction beat —
          the spectacle lens and the eye both sit on the right of the bench and
          that reveal is the thing worth watching. */}
      <Animated.View
        style={[
          styles.boxWrap,
          landscape && beat === 'reveal' && styles.boxWrapAside,
          boxStyle,
        ]}
        pointerEvents={showBox ? 'auto' : 'none'}
      >
        <View style={[styles.box, landscape ? styles.boxLandscape : styles.boxPortrait]}>
          <View style={styles.boxHead}>
            <View style={[styles.dot, { backgroundColor: station.tone }]} />
            <Text style={[styles.boxEyebrow, { color: station.tone }]}>
              {beat === 'reveal'
                ? t('eye.beat.correction')
                : beat === 'record'
                ? t('eye.beat.reading')
                : t(`eye.${station.key}.ordinal`)}
            </Text>
          </View>

          {beat === 'brief' ? (
            <>
              <Text style={styles.boxTitle}>{t(`eye.${station.key}.name`)}</Text>
              <Text style={styles.boxBody}>{t(`eye.${station.key}.brief`)}</Text>
              <Text style={[styles.boxPrompt, { color: station.tone }]}>
                ↓ {t(`eye.${station.key}.prompt`)}
              </Text>
            </>
          ) : null}

          {beat === 'record' ? (
            <>
              <View style={styles.readingRow}>
                <View>
                  <Text style={styles.readingLabel}>
                    {t(`eye.${station.key}.readingLabel`)}
                  </Text>
                  <Text style={styles.reading}>{objectCm.toFixed(1)} cm</Text>
                </View>
                <Pressable
                  onPress={record}
                  style={({ pressed }) => [
                    styles.recordBtn,
                    { backgroundColor: station.tone },
                    pressed && { opacity: 0.82 },
                  ]}
                >
                  <Text style={styles.recordLabel}>{t('eye.action.record')}</Text>
                </Pressable>
              </View>
              <Text style={[styles.boxBody, nudge && styles.boxBodyTight]}>
                {nudge || t(`eye.${station.key}.record`)}
              </Text>
              {nudge ? <Text style={styles.nudgeTag}>{t('eye.nudge.tag')}</Text> : null}
            </>
          ) : null}

          {beat === 'reveal' ? (
            <>
              <Text style={styles.boxTitle}>{t(`eye.${station.key}.revealTitle`)}</Text>
              <Text style={styles.boxBody}>{t(`eye.${station.key}.reveal`)}</Text>
              <Pressable
                onPress={advance}
                style={({ pressed }) => [
                  styles.recordBtn,
                  styles.continueBtn,
                  { backgroundColor: station.tone },
                  pressed && { opacity: 0.82 },
                ]}
              >
                <Text style={styles.recordLabel}>
                  {idx === STATIONS.length - 1
                    ? t('eye.action.finish')
                    : t('eye.action.next')}
                </Text>
              </Pressable>
            </>
          ) : null}
        </View>
      </Animated.View>

      </View>

      {/* ---- the slider, always at the bottom ---- */}
      <View style={styles.sliderBar}>
        <Slider
          value={objectCm}
          min={BENCH_MIN_CM}
          max={BENCH_MAX_CM}
          step={BENCH.leastCount}
          onChange={setObjectCm}
          onSlideStart={onSlideStart}
          onSlideEnd={onSlideEnd}
          disabled={locked}
          tone={station.tone}
          label={t('eye.slider.object', {
            dir: t(station.direction === 'in' ? 'eye.slider.towards' : 'eye.slider.away'),
          })}
          display={`${objectCm.toFixed(1)} cm`}
        />
      </View>
    </View>
  );
}

/**
 * What the retina is getting, in the only terms the eye itself reports it: a
 * point, or not a point. Never a distance — that is the thing being measured.
 *
 * The acuity card above the bar is the same verdict shown rather than named —
 * the bench turned round and looked down, so the student can see the letters
 * go before they have to decide whether the lozenge on the back wall counts as
 * a point. It is driven by the same `sharpness`, so it can never disagree
 * with the bar underneath it.
 */
function SharpnessMeter({ focus, corrected, clinical }) {
  const { sharpness, sharp, straining, blurCm } = focus;
  const verdict = verdictFor(sharpness, sharp, corrected);
  const { t } = useLanguage();

  return (
    <View style={styles.meter} pointerEvents="none">
      <View style={styles.pov}>
        <RetinalView sharpness={sharpness} width={POV_W} height={POV_H} />
      </View>

      <View style={styles.meterBody}>
        <View style={styles.meterRow}>
          <Text style={styles.meterEyebrow}>{t('eye.meter.title')}</Text>
          <Text style={[styles.meterValue, { color: verdict.tone }]} numberOfLines={1}>
            {t(verdict.key)}
          </Text>
          {/* The blur circle in millimetres, to the two decimals a prescription
              is written to. It reads 0.00 for the last stretch before the limit,
              so it describes the image without handing over the distance. */}
          <Text style={styles.meterBlur}>{(blurCm * 10).toFixed(2)} mm</Text>
        </View>

        <View style={styles.meterTrack}>
          <View
            style={[
              styles.meterFill,
              { width: `${Math.round(sharpness * 100)}%`, backgroundColor: verdict.tone },
            ]}
          />
        </View>

        <Text style={styles.meterNote} numberOfLines={1}>
          {clinical} ·{' '}
          {corrected
            ? t('eye.lensState.corrected')
            : straining
            ? t('eye.lensState.straining')
            : t('eye.lensState.relaxed')}
        </Text>
      </View>
    </View>
  );
}


function easeOut(t) {
  return 1 - Math.pow(1 - t, 3);
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#10151D' },
  stage: { flex: 1, overflow: 'hidden' },
  track: { position: 'absolute', top: 0, left: 0, bottom: 0, flexDirection: 'row' },

  // Progress on the left, retinal readout on the right. They sit side by side
  // when there is room and stack on a narrow portrait phone. The floating back
  // button is up on the mode strip above this, so the bar keeps its full width.
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    columnGap: 16,
    rowGap: 8,
    paddingLeft: 14,
    paddingRight: 14,
    paddingTop: 6,
    paddingBottom: 6,
    borderBottomWidth: StyleSheet.hairlineWidth * 2,
    borderBottomColor: 'rgba(255,255,255,0.12)',
  },

  pips: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 150,
    minWidth: 0,
  },
  pip: {
    width: 8,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  pipLabel: {
    marginLeft: 8,
    flexShrink: 1,
    fontFamily: font.bold,
    fontSize: 9.5,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: 'rgba(255,253,248,0.72)',
  },

  meter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 260,
    minWidth: 0,
  },
  meterBody: { flex: 1, minWidth: 0, gap: 3 },
  meterEyebrow: {
    fontFamily: font.bold,
    fontSize: 8.5,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: 'rgba(255,253,248,0.5)',
  },
  pov: {
    width: POV_W,
    height: POV_H,
    borderRadius: 7,
    overflow: 'hidden',
  },
  meterRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  meterValue: { fontFamily: font.bold, fontSize: 13, letterSpacing: -0.1, flexShrink: 1 },
  meterBlur: {
    fontFamily: font.bold,
    fontSize: 10,
    color: 'rgba(255,253,248,0.55)',
    fontVariant: ['tabular-nums'],
    marginLeft: 'auto',
  },
  meterTrack: {
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.14)',
    overflow: 'hidden',
    marginTop: 2,
  },
  meterFill: { height: 3, borderRadius: 2 },
  meterNote: {
    fontFamily: font.medium,
    fontSize: 9,
    color: 'rgba(255,253,248,0.45)',
    marginTop: 1,
  },

  // Centred, so the object at the far left of the bench and the eye at the far
  // right both stay visible while the box is up. It is out of the way entirely
  // the moment the slider is touched.
  // The box is the only thing standing between the student and the eye, so it
  // is kept as short as the words allow: the copy in `steps.js` is written
  // tight, and the type here is a step down from the app's reading sizes.
  boxWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  boxWrapAside: { alignItems: 'flex-start' },
  boxLandscape: { width: '100%', maxWidth: 470 },
  boxPortrait: { width: '100%' },
  box: {
    backgroundColor: color.paper,
    borderRadius: radius.tile,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: color.hairline,
    paddingHorizontal: 13,
    paddingVertical: 11,
    gap: 5,
    ...shadow.raised,
  },
  boxHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 5, height: 5, borderRadius: 3 },
  boxEyebrow: {
    fontFamily: font.bold,
    fontSize: 8.5,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  boxTitle: {
    fontFamily: font.display,
    fontSize: 15,
    lineHeight: 18,
    color: color.ink,
  },
  boxBody: { fontFamily: font.regular, fontSize: 12, lineHeight: 16.5, color: color.inkSoft },
  boxBodyTight: { color: color.inkBody },
  boxPrompt: { fontFamily: font.bold, fontSize: 11.5, lineHeight: 15.5, marginTop: 1 },

  readingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  readingLabel: {
    fontFamily: font.bold,
    fontSize: 8.5,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: color.inkMuted,
  },
  reading: {
    fontFamily: font.displayBold,
    fontSize: 22,
    color: color.ink,
    fontVariant: ['tabular-nums'],
  },
  recordBtn: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: radius.pill },
  continueBtn: { alignSelf: 'flex-start', marginTop: 2 },
  recordLabel: {
    fontFamily: font.displayBold,
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: color.paper,
  },
  nudgeTag: {
    fontFamily: font.bold,
    fontSize: 8.5,
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    color: color.red,
  },

  sliderBar: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: 'rgba(255,253,248,0.96)',
    borderTopWidth: StyleSheet.hairlineWidth * 2,
    borderTopColor: color.hairline,
  },
});
