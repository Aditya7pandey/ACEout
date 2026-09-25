import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { color, font } from '../../theme';
import Slider from '../../components/Slider';
import EyeScene from './EyeScene';
import RetinalView, { verdictFor } from './RetinalView';
import {
  RETINA_CM,
  resolveFocus,
  limitsFor,
  diagnose,
  idealSpecD,
  fmt,
  fmtSigned,
} from './optics';

/**
 * Free play: the same eye, with the eyeball itself unbolted.
 *
 * The guided bench fixes three eyes and asks the student to measure them. Here
 * all three of the things that were fixed are live at once:
 *
 *   object distance   how far away the arrow is
 *   eyeball length    lens to retina, in millimetres
 *   corrective power  the spectacle lens in front of it, in dioptres
 *
 * Nothing is validated and nothing is scored, which is what lets the panel say
 * out loud what the guided bench must never print — the far point, the near
 * point, the diameter of the blur circle. The whole point of the mode is that
 * a student can drive a normal eye into myopia a tenth of a millimetre at a
 * time and watch the far point come in from infinity to arm's length, then put
 * the lens in front of it and watch it go back.
 *
 * There is one thing worth finding in here and it is not printed anywhere: for
 * any eyeball length there is exactly one corrective power that restores the
 * normal range, and the acuity card is how you know you have found it.
 */

const OBJECT_MIN_CM = 15;
const OBJECT_MAX_CM = 100;

/**
 * The eyeball, in millimetres. 25.0 is normal; both defects are axial.
 *
 * The top of this range is what `MAX_STRETCH` in EyeScene reserves room for —
 * raise it here and the longest eye starts running off the right of the frame.
 */
const AXIAL_MIN_MM = 22;
const AXIAL_MAX_MM = 28;

/** Dioptres, stepped the way a real prescription is written. */
const POWER_LIMIT_D = 6;
const POWER_STEP_D = 0.25;

/** Free play has no station, so the scene gets a neutral one. */
const BENCH = { key: 'free', tone: color.physics };
const IRIS = ['#9CBFD4', '#3C617A'];

export default function FreePlay() {
  const [frame, setFrame] = useState({ w: 0, h: 0 });
  const [objectCm, setObjectCm] = useState(50);
  const [axialMm, setAxialMm] = useState(RETINA_CM * 10);
  const [specD, setSpecD] = useState(0);

  const retinaCm = axialMm / 10;

  const eye = useMemo(
    () => ({ irisColor: IRIS, axialStretch: retinaCm / RETINA_CM }),
    [retinaCm]
  );
  const focus = useMemo(
    () => resolveFocus({ retinaCm, specD }, objectCm),
    [retinaCm, specD, objectCm]
  );

  // The defect is a property of the eyeball, so it is diagnosed bare. The range
  // underneath it is what the eye can actually reach *as currently dressed*.
  const defect = useMemo(() => diagnose(retinaCm), [retinaCm]);
  const range = useMemo(() => limitsFor(retinaCm, specD), [retinaCm, specD]);

  const lens = specD === 0 ? null : { kind: specD < 0 ? 'concave' : 'convex', mix: 1 };
  const verdict = verdictFor(focus.sharpness, focus.sharp, !!lens);

  return (
    <View style={styles.wrap}>
      {/* The readout sits above the bench rather than over it. It used to be an
          absolute panel in the top right, which is exactly where the eye is
          drawn — in portrait it covered the eyeball outright, and in landscape
          it clipped the top of it. In flow and laid out across, it cannot. */}
      <View style={styles.readout} pointerEvents="none">
        <View style={styles.pov}>
          <RetinalView sharpness={focus.sharpness} width={POV_W} height={POV_H} />
        </View>

        <View style={styles.readoutBody}>
          <View style={styles.verdictRow}>
            <Text style={styles.eyebrow}>Retinal image</Text>
            <Text style={[styles.verdict, { color: verdict.tone }]} numberOfLines={1}>
              {verdict.label}
            </Text>
            <Text style={styles.blur}>{(focus.blurCm * 10).toFixed(2)} mm</Text>
          </View>

          <View style={styles.track}>
            <View
              style={[
                styles.fill,
                {
                  width: `${Math.round(focus.sharpness * 100)}%`,
                  backgroundColor: verdict.tone,
                },
              ]}
            />
          </View>

          <View style={styles.statsRow}>
            <Stat label="Eyeball" value={defect.name} />
            <Stat
              label={lens ? 'Range, wearing it' : 'Range, bare'}
              value={`far ${fmtRange(range.farCm)} · near ${fmtRange(range.nearCm)}`}
            />
          </View>

          <Text style={styles.note} numberOfLines={1}>
            {focus.straining
              ? 'Lens at full accommodation — nothing left to give'
              : focus.effort < 0.02
              ? 'Lens fully relaxed'
              : `Lens accommodating · ${Math.round(focus.effort * 100)}% of its range`}
          </Text>
        </View>
      </View>

      <View
        style={styles.stage}
        onLayout={(e) =>
          setFrame({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })
        }
      >
        {frame.w > 0 ? (
          <EyeScene
            station={BENCH}
            eye={eye}
            objectCm={objectCm}
            focus={focus}
            lens={lens}
            width={frame.w}
            height={frame.h}
          />
        ) : null}

      </View>

      <View style={styles.controls}>
        <Slider
          style={styles.slider}
          value={objectCm}
          min={OBJECT_MIN_CM}
          max={OBJECT_MAX_CM}
          step={0.1}
          onChange={setObjectCm}
          tone={color.brass}
          label="Object distance"
          display={`${objectCm.toFixed(1)} cm`}
          marks={[{ value: 25, label: 'reading', color: color.edge }]}
        />
        <Slider
          style={styles.slider}
          value={axialMm}
          min={AXIAL_MIN_MM}
          max={AXIAL_MAX_MM}
          step={0.1}
          onChange={setAxialMm}
          tone={color.physics}
          label="Eyeball · lens to retina"
          display={`${axialMm.toFixed(1)} mm`}
          marks={[{ value: RETINA_CM * 10, label: 'normal', color: color.edge }]}
        />
        <Slider
          style={styles.slider}
          value={specD}
          min={-POWER_LIMIT_D}
          max={POWER_LIMIT_D}
          step={POWER_STEP_D}
          onChange={setSpecD}
          tone={color.biology}
          label="Corrective power"
          display={`${fmtSigned(specD)} D`}
          marks={[
            { value: 0, label: 'none', color: color.edge },
            // Where the prescription for *this* eyeball sits. A tick, not a
            // number: the acuity card is still what tells them they are on it.
            ...(Math.abs(idealSpecD(retinaCm)) > POWER_STEP_D / 2 &&
            Math.abs(idealSpecD(retinaCm)) <= POWER_LIMIT_D
              ? [{ value: idealSpecD(retinaCm), color: color.green }]
              : []),
          ]}
        />
      </View>
    </View>
  );
}

/**
 * A limit of the eye's range, in whichever unit reads honestly.
 *
 * A quarter-dioptre step will not always land the far point exactly at
 * infinity, so a near-correct lens leaves it out at twenty-odd metres. That is
 * a true and interesting number — it is why prescriptions come in quarters —
 * and it wants metres rather than four digits of centimetres.
 */
function fmtRange(cm) {
  if (!Number.isFinite(cm)) return '∞';
  if (cm >= 200) return `${(cm / 100).toFixed(1)} m`;
  return `${fmt(cm)} cm`;
}

function Stat({ label, value }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

// The acuity card, laid on its side next to the numbers rather than above
// them. Its aspect follows RetinalView's own viewBox.
const POV_W = 112;
const POV_H = Math.round((POV_W * 120) / 208);

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#10151D' },
  stage: { flex: 1, overflow: 'hidden' },

  // Left padding clears the screen's floating back button, which the bench
  // hides its own title bar for.
  readout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingLeft: 56,
    paddingRight: 14,
    paddingTop: 8,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth * 2,
    borderBottomColor: 'rgba(255,255,255,0.12)',
  },
  readoutBody: { flex: 1, minWidth: 0, gap: 3 },
  eyebrow: {
    fontFamily: font.bold,
    fontSize: 8.5,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: 'rgba(255,253,248,0.5)',
  },
  pov: { width: POV_W, height: POV_H, borderRadius: 7, overflow: 'hidden' },

  verdictRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  verdict: { fontFamily: font.bold, fontSize: 13.5, letterSpacing: -0.1, flexShrink: 1 },
  blur: {
    fontFamily: font.bold,
    fontSize: 10,
    color: 'rgba(255,253,248,0.55)',
    fontVariant: ['tabular-nums'],
    marginLeft: 'auto',
  },
  track: {
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.14)',
    overflow: 'hidden',
    marginTop: 2,
  },
  fill: { height: 3, borderRadius: 2 },

  // Side by side when there is room; the pair drops to two lines on a narrow
  // portrait phone rather than truncating either one.
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 16,
    rowGap: 2,
    marginTop: 2,
  },
  statRow: { gap: 1, flexGrow: 1, flexBasis: 150, minWidth: 0 },
  statLabel: {
    fontFamily: font.bold,
    fontSize: 8,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: 'rgba(255,253,248,0.42)',
  },
  statValue: {
    fontFamily: font.medium,
    fontSize: 11,
    color: 'rgba(255,253,248,0.84)',
    fontVariant: ['tabular-nums'],
  },
  note: {
    fontFamily: font.medium,
    fontSize: 9,
    lineHeight: 13,
    color: 'rgba(255,253,248,0.45)',
    marginTop: 2,
  },

  // Three across on a landscape phone; they wrap to two rows if the window is
  // ever narrower than the bench is meant to be.
  controls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 22,
    rowGap: 4,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: 'rgba(255,253,248,0.96)',
    borderTopWidth: StyleSheet.hairlineWidth * 2,
    borderTopColor: color.hairline,
  },
  slider: { flexGrow: 1, flexBasis: 210, minWidth: 180 },
});
