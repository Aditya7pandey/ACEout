import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import { color, font, type } from '../../theme';
import { Eyebrow, GoldButton, GhostButton, Annotation, Panel, withAlpha } from '../../components/ui';
import { supported, lockLandscape, unlock, onOrientationChange } from '../../utils/orientation';

/**
 * The first thing this bench asks for.
 *
 * A horizontal launch is a wide picture — the rover travels three times
 * further sideways than it falls — and in a portrait column the parabola is
 * squeezed into a strip. So the lab asks before it opens, and offers both
 * ways of getting there: turn the screen automatically, or turn the phone
 * yourself and have the bench notice.
 *
 * If the native orientation module is unavailable (web, or a client built
 * before it was added), the automatic route is hidden rather than offered and
 * silently failing.
 */
export default function OrientationGate({ onDone }) {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  // 'ask' → the choice; 'waiting' → unlocked, watching for the student to turn
  // the phone; anything else means we are done here.
  const [stage, setStage] = useState('ask');
  const [sensed, setSensed] = useState(isLandscape);

  // Two signals for the same thing. The listener is the authoritative one, but
  // the window dimensions flip on every platform including those where the
  // native listener never fires, so both are watched.
  useEffect(() => {
    if (stage !== 'waiting') return undefined;
    return onOrientationChange((landscape) => setSensed(landscape));
  }, [stage]);

  useEffect(() => {
    if (stage === 'waiting' && (isLandscape || sensed)) onDone('manual');
  }, [stage, isLandscape, sensed, onDone]);

  // Already sideways when the lab opened — nothing to ask about.
  useEffect(() => {
    if (stage === 'ask' && isLandscape) onDone('already');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const autoRotate = async () => {
    const ok = await lockLandscape();
    if (ok) onDone('auto');
    else {
      // The lock was refused — fall back to asking for a wrist.
      await unlock();
      setStage('waiting');
    }
  };

  const manualRotate = async () => {
    await unlock();
    setStage('waiting');
  };

  return (
    <View style={styles.wrap}>
      <View style={{ gap: 10 }}>
        <Eyebrow tone={color.space}>Turn the screen</Eyebrow>
        <Text style={type.title}>This bench is built to be read sideways</Text>
        <Text style={[type.body, { lineHeight: 21 }]}>
          The rover leaves the deck horizontally and travels a long way sideways for the short
          distance it falls — on Pluto, nearly two metres across for every one it drops. In a
          portrait column that flight is squeezed into a strip. Held wide, the whole parabola and
          the entire length of the floor tape are on screen at once.
        </Text>
      </View>

      <PhoneGlyph turning={stage === 'waiting'} />

      {stage === 'ask' ? (
        <View style={{ gap: 10 }}>
          {supported ? (
            <GoldButton label="Turn the screen for me" onPress={autoRotate} />
          ) : null}
          <GhostButton
            label={supported ? 'I’ll rotate my phone' : 'Rotate your phone to continue'}
            onPress={manualRotate}
          />
          <Pressable onPress={() => onDone('portrait')} style={styles.skip}>
            <Text style={styles.skipLabel}>Continue in portrait anyway</Text>
          </Pressable>
        </View>
      ) : (
        <Panel tone={withAlpha(color.space, 0.45)} style={{ gap: 9 }}>
          <Eyebrow tone={color.space}>Waiting for you</Eyebrow>
          <Text style={type.body}>
            Turn the phone on its side. The bench will open the moment it is wide — no button to
            press.
          </Text>
          <Text style={styles.hint}>
            If nothing happens, your phone's own rotation lock is probably on. Use the button below
            instead.
          </Text>
          <View style={{ gap: 9, marginTop: 4 }}>
            {supported ? <GoldButton label="Turn it for me instead" onPress={autoRotate} /> : null}
            <Pressable onPress={() => onDone('portrait')} style={styles.skip}>
              <Text style={styles.skipLabel}>Continue in portrait anyway</Text>
            </Pressable>
          </View>
        </Panel>
      )}

      <Annotation label="You can change your mind">
        Portrait works — every reading, every graph and every instrument is the same. It is only the
        3D bench that would rather be wide. The lab puts your phone back the way it found it when
        you leave.
      </Annotation>
    </View>
  );
}

/** A phone that lies down. Cheap, and it says the thing words take a line to. */
function PhoneGlyph({ turning }) {
  return (
    <View style={styles.glyphRow}>
      <View style={styles.phonePortrait}>
        <View style={styles.phoneNotch} />
      </View>
      <Text style={[styles.arrow, turning && { color: color.space }]}>→</Text>
      <View style={[styles.phoneLandscape, turning && styles.phoneActive]}>
        <View style={styles.phoneNotchSide} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 20, paddingBottom: 40, gap: 26 },
  glyphRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 18 },
  phonePortrait: {
    width: 44,
    height: 72,
    borderRadius: 9,
    borderWidth: 1.6,
    borderColor: color.edge,
    backgroundColor: color.paper,
    alignItems: 'center',
    paddingTop: 5,
  },
  phoneLandscape: {
    width: 72,
    height: 44,
    borderRadius: 9,
    borderWidth: 1.6,
    borderColor: color.edge,
    backgroundColor: color.paper,
    justifyContent: 'center',
    paddingLeft: 5,
  },
  phoneActive: {
    borderColor: withAlpha(color.space, 0.7),
    backgroundColor: withAlpha(color.space, 0.07),
  },
  phoneNotch: { width: 16, height: 3, borderRadius: 2, backgroundColor: color.edge },
  phoneNotchSide: { width: 3, height: 16, borderRadius: 2, backgroundColor: color.edge },
  arrow: { fontFamily: font.bold, fontSize: 18, color: color.inkMuted },
  skip: { alignItems: 'center', paddingVertical: 12 },
  skipLabel: {
    fontFamily: font.bold,
    fontSize: 10.5,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: color.inkMuted,
  },
  hint: { fontFamily: font.regular, fontSize: 11.5, lineHeight: 17, color: color.inkMuted },
});
