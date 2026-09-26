import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, Pressable, Animated, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  RecordingPresets,
  createAudioPlayer,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
} from 'expo-audio';
import { Text } from '../i18n';
import { color, font, radius, bevel, shadow } from '../theme';
import { speechToText, textToSpeech } from './deepgramService';
import { answerQuestion } from './ragEngine';

/**
 * The in-lab voice assistant, as a pill over the bench.
 *
 * States: IDLE → GREETING → LISTENING → THINKING → SPEAKING → LISTENING…
 *
 * The answer is always written into the card above the pill, not only spoken.
 * Speech is the network-dependent half of this feature and the half that fails
 * first on a phone; when it does, the student still gets the answer in text
 * rather than a pill that pulses and says nothing.
 */
export default function VoiceOverlay({ labId, onClose }) {
  const [voiceState, setVoiceState] = useState('IDLE');
  const [turn, setTurn] = useState(null); // { question?, answer }
  const [notice, setNotice] = useState(null); // non-fatal failure, shown once

  const [pulse] = useState(new Animated.Value(1));

  // The pill takes over the corner the "Ask AI" button sits in, so it clears
  // the system navigation bar the same way — see the note in LabScreen.
  const insets = useSafeAreaInsets();

  // expo-audio hands back one long-lived recorder rather than expo-av's
  // object-per-take, so "are we mid-take?" is ours to track.
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recordingRef = useRef(false);
  const playerRef = useRef(null);
  const unmounted = useRef(false);

  // Animation for recording
  useEffect(() => {
    let anim;
    if (voiceState === 'LISTENING') {
      anim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.06, duration: 600, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true })
        ])
      );
      anim.start();
    } else {
      pulse.setValue(1);
    }
    return () => anim?.stop();
  }, [voiceState, pulse]);

  /**
   * Drop the current player. Tearing a player down from inside its own status
   * callback re-enters native teardown, so the release always lands on the
   * next tick — the ref is cleared immediately either way.
   */
  const releasePlayer = useCallback(() => {
    const player = playerRef.current;
    playerRef.current = null;
    if (!player) return;
    setTimeout(() => {
      try {
        player.remove();
      } catch (e) {}
    }, 0);
  }, []);

  const cleanupAudio = useCallback(async () => {
    if (recordingRef.current || recorder.isRecording) {
      recordingRef.current = false;
      try {
        await recorder.stop();
      } catch (e) {}
    }
    releasePlayer();
  }, [recorder, releasePlayer]);

  /**
   * `allowsRecording` has to be toggled, not set once: while it is true iOS
   * routes playback to the earpiece, so leaving it on makes the answer come out
   * of the receiver at a whisper. Android ignores it.
   */
  const setAudioMode = useCallback(async (recording) => {
    await setAudioModeAsync({
      allowsRecording: recording,
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      // expo-audio folded expo-av's `shouldDuckAndroid` into one cross-platform
      // interruption mode; ducking is what a lab assistant talking over other
      // audio should do.
      interruptionMode: 'duckOthers',
      shouldRouteThroughEarpiece: false,
    });
  }, []);

  const startListening = useCallback(async () => {
    if (unmounted.current) return;
    try {
      await cleanupAudio(); // ensure clean state
      await setAudioMode(true);
      setVoiceState('LISTENING');

      // A fresh prepare is required before every take — a recorder that has
      // already stopped will not record again without it.
      await recorder.prepareToRecordAsync();
      if (unmounted.current) return;
      recorder.record();
      recordingRef.current = true;
    } catch (e) {
      console.error('Failed to start recording', e);
      setNotice('Could not reach the microphone.');
      setVoiceState('IDLE');
    }
  }, [cleanupAudio, recorder, setAudioMode]);

  /**
   * Speak `text`, then hand back to the mic. A speech failure is reported and
   * stepped over — the caller has already put the text on screen.
   */
  const playSpeech = useCallback(async (text) => {
    if (unmounted.current) return;
    try {
      const uri = await textToSpeech(text);
      if (unmounted.current) return;

      await setAudioMode(false);
      releasePlayer();

      const player = createAudioPlayer({ uri });
      playerRef.current = player;

      // `didJustFinish` arrives on a repeating status stream rather than
      // expo-av's one-shot callback, so the handoff back to the mic is latched
      // to fire once.
      let handedOff = false;
      let sub = null;
      sub = player.addListener('playbackStatusUpdate', (status) => {
        if (!status?.didJustFinish || handedOff) return;
        handedOff = true;
        sub?.remove();
        if (playerRef.current === player) releasePlayer();
        // After speaking, immediately start listening again
        if (!unmounted.current) startListening();
      });

      player.play();
    } catch (e) {
      console.error('TTS Error:', e);
      setNotice('Speech is unavailable — the answer is written above.');
      startListening(); // fallback to listening if speech fails
    }
  }, [releasePlayer, setAudioMode, startListening]);

  const setupAudioAndGreet = useCallback(async () => {
    try {
      const { granted } = await requestRecordingPermissionsAsync();
      if (!granted) {
        setNotice('Microphone permission is required for the voice assistant.');
        setVoiceState('IDLE');
        return;
      }

      await setAudioMode(false);

      const GREETINGS = {
        'incline-work-energy': "Hi, I'm your lab assistant! Ask me anything about friction or this incline.",
        'eye-defects': "Hi, I'm your lab assistant! I can help you with the human eye and optics.",
        'acid-base-indicators': "Hi, I'm your lab assistant! Ask me anything about pH indicators and their color transitions.",
        'ph-determination': "Hi, I'm your lab assistant! I can help you understand pH and concentration.",
        'gravity-launch': "Hi, I'm your lab assistant! Ask me anything about projectile motion and finding gravity.",
        'plant-physiology': "Hi, I'm your lab assistant! I can help you with plasmolysis, stomata, or transpiration."
      };
      const greeting = GREETINGS[labId] || "Hi, I'm your lab assistant! Ask me anything about this lab.";

      setVoiceState('GREETING');
      setTurn({ answer: greeting });
      await playSpeech(greeting);
    } catch (e) {
      console.error(e);
      setNotice('The voice assistant could not start.');
      setVoiceState('IDLE');
    }
  }, [labId, playSpeech, setAudioMode]);

  useEffect(() => {
    unmounted.current = false;
    setupAudioAndGreet();
    return () => {
      unmounted.current = true;
      cleanupAudio();
    };
    // Mount only: re-running this would restart the greeting mid-conversation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopListeningAndProcess = async () => {
    if (voiceState !== 'LISTENING' || !recordingRef.current) return;

    setVoiceState('THINKING');
    setNotice(null);
    try {
      recordingRef.current = false;
      await recorder.stop();
      // The URI is a property on the recorder now, and it is only populated
      // once the take has been finalised.
      const uri = recorder.uri;
      if (!uri) throw new Error('The recording produced no audio file.');

      // 1. STT
      const { text: sttText } = await speechToText(uri);

      if (!sttText || sttText.trim() === '') {
        setNotice("I didn't catch that — tap the mic and try again.");
        setVoiceState('IDLE');
        return;
      }

      // 2. RAG
      const { answer } = await answerQuestion(labId, sttText);
      if (unmounted.current) return;

      // 3. TTS — the text lands first so a speech failure is not a dead end.
      setTurn({ question: sttText, answer });
      setVoiceState('SPEAKING');
      await playSpeech(answer);
    } catch (e) {
      console.error('Processing error:', e);
      if (unmounted.current) return;
      const message = 'Sorry, I had trouble understanding that.';
      setTurn({ answer: message });
      setVoiceState('SPEAKING');
      await playSpeech(message);
    }
  };

  const onPillPress = () => {
    if (voiceState === 'LISTENING') stopListeningAndProcess();
    else if (voiceState === 'IDLE') startListening();
    // GREETING / THINKING / SPEAKING are transient — the ✕ is the way out.
  };

  const label = {
    GREETING: 'Greeting…',
    LISTENING: 'Tap to send',
    THINKING: 'Thinking…',
    SPEAKING: 'Speaking…',
  }[voiceState] || 'Tap to ask';

  const listening = voiceState === 'LISTENING';
  const busy = voiceState === 'THINKING' || voiceState === 'SPEAKING' || voiceState === 'GREETING';

  return (
    <View style={[styles.overlay, { bottom: insets.bottom + GUTTER }]} pointerEvents="box-none">
      {(turn || notice) && (
        <View style={styles.card}>
          <View style={styles.cardHead}>
            <Text style={styles.eyebrow}>Lab assistant</Text>
            <Pressable onPress={onClose} hitSlop={10} style={styles.close}>
              <Text style={styles.closeGlyph}>✕</Text>
            </Pressable>
          </View>

          {turn?.question ? (
            <Text style={styles.question} numberOfLines={2}>“{turn.question}”</Text>
          ) : null}

          {turn?.answer ? (
            <ScrollView style={styles.answerScroll} nestedScrollEnabled>
              <Text style={styles.answer}>{turn.answer}</Text>
            </ScrollView>
          ) : null}

          {notice ? <Text style={styles.notice}>{notice}</Text> : null}
        </View>
      )}

      <Animated.View style={{ transform: [{ scale: pulse }] }}>
        <Pressable
          onPress={onPillPress}
          disabled={busy}
          style={({ pressed }) => [
            styles.pill,
            listening ? styles.pillListening : styles.pillIdle,
            busy && styles.pillBusy,
            pressed && !busy && styles.pillPressed,
          ]}
        >
          <Text style={styles.pillText}>{listening ? '◼' : '🎤'}  {label}</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

/** Matches the "Ask AI" button this overlay replaces. */
const GUTTER = 24;

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    // `bottom` is applied at the call site — it depends on the safe-area inset.
    right: GUTTER,
    left: GUTTER,
    alignItems: 'flex-end',
    gap: 10,
    zIndex: 1000,
  },

  // The answer card borrows the assistant bubble from VoiceAssistantScreen:
  // paper fill, hairline border, hard bottom edge.
  card: {
    maxWidth: 420,
    alignSelf: 'flex-end',
    backgroundColor: color.paper,
    borderWidth: 2,
    borderColor: color.hairline,
    borderRadius: radius.panel,
    ...bevel(color.edge, 3),
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 6,
    ...shadow.panel,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  eyebrow: {
    fontFamily: font.extra,
    fontSize: 9.5,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: color.purpleDeep,
  },
  close: {
    width: 22,
    height: 22,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.sunk,
    borderWidth: 1.5,
    borderColor: color.edge,
  },
  closeGlyph: { fontFamily: font.semibold, fontSize: 11, color: color.inkMuted, marginTop: -1 },
  question: { fontFamily: font.medium, fontSize: 12.5, lineHeight: 18, color: color.inkMuted },
  answerScroll: { maxHeight: 132 },
  answer: { fontFamily: font.regular, fontSize: 13.5, lineHeight: 20, color: color.inkBody },
  notice: { fontFamily: font.semibold, fontSize: 11.5, lineHeight: 17, color: color.redDeep },

  // The pill is a pressable block, so its depth is the design system's hard
  // bottom edge — the light shade fills, the deep shade is the edge under it.
  pill: {
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadow.raised,
  },
  pillIdle: { backgroundColor: color.purple, ...bevel(color.purpleDeep) },
  pillListening: { backgroundColor: color.red, ...bevel(color.redDeep) },
  pillBusy: { backgroundColor: color.purple, ...bevel(color.purpleDeep), opacity: 0.85 },
  pillPressed: { transform: [{ translateY: 3 }], borderBottomWidth: 1 },
  pillText: {
    fontFamily: font.displayBold,
    fontSize: 14,
    color: '#FFFFFF',
    letterSpacing: 0.5,
    // Fredoka has no glyph for the stop square; fall back cleanly on Android.
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : null),
  },
});
