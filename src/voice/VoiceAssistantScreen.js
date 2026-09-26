import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Animated,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../i18n';
import { color, font, radius, type as typeStyle, bevel } from '../theme';
import { BackButton, Eyebrow, Tag } from '../components/ui';
import { Page } from '../components/ui';
import { checkOnline, speechToText, textToSpeech } from './deepgramService';
import { answerQuestion } from './ragEngine';

/**
 * Voice AI Lab Assistant — the conversational interface.
 *
 * This screen sits behind the "Ask AI" button on the two supported labs
 * (incline and eye-defects). It is **online-only**: Deepgram needs the network
 * for STT and TTS, and the screen checks connectivity before enabling the mic.
 *
 * The RAG engine (`ragEngine.js`) runs entirely on-device — it retrieves chunks
 * from the local knowledge base and builds a grounded answer without calling an
 * external LLM. Only the voice pipeline (Deepgram) needs the network.
 */
export default function VoiceAssistantScreen({ route, navigation }) {
  const { labId, labTitle } = route.params;
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [inputText, setInputText] = useState('');

  // Pulsing animation for the mic during recording
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const GREETINGS = {
      'incline-work-energy': "Hi! I'm your lab assistant for the Inclined Plane experiment. I know all about friction, the work-energy theorem, and how to run this bench. Ask me anything — tap the mic or type below!",
      'eye-defects': "Hi! I'm your lab assistant for the Human Eye and Spectacles experiment. I can help with accommodation, myopia, hypermetropia, and lens prescriptions. Ask me anything — tap the mic or type below!",
      'acid-base-indicators': "Hi! I'm your lab assistant for the Acid-Base Indicators experiment. I know all about pH transitions, Phenolphthalein, and Methyl Orange. Ask me anything — tap the mic or type below!",
      'ph-determination': "Hi! I'm your lab assistant for the pH Determination experiment. I can help with universal indicator, digital pH meters, and H+ concentration. Ask me anything — tap the mic or type below!",
      'gravity-launch': "Hi! I'm your lab assistant for the Gravity Launch experiment. I can help with projectile motion, finding launch speeds, and calculating gravity. Ask me anything — tap the mic or type below!",
      'plant-physiology': "Hi! I'm your lab assistant for the Plant Physiology experiments. I can help with plasmolysis, stomatal distribution, and transpiration. Ask me anything — tap the mic or type below!"
    };
    const welcomeText = GREETINGS[labId] || "Hi! I'm your lab assistant. Ask me anything — tap the mic or type below!";

    setMessages([{ role: 'assistant', text: welcomeText, timestamp: new Date() }]);

    // Check connectivity on mount and every 30 s
    verifyOnlineStatus();
    const id = setInterval(verifyOnlineStatus, 30000);
    return () => clearInterval(id);
  }, [labId]);

  // Pulsing mic animation
  useEffect(() => {
    let animation;
    if (isRecording) {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.45, duration: 700, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        ])
      );
      animation.start();
    } else {
      pulseAnim.setValue(1);
    }
    return () => animation?.stop();
  }, [isRecording]);

  const verifyOnlineStatus = async () => {
    try {
      setIsOnline(await checkOnline());
    } catch {
      setIsOnline(false);
    }
  };

  // ---- recording stubs — wire up expo-audio here ----
  // VoiceOverlay.js is the working implementation of this pipeline; copy from
  // there rather than from expo-av examples, which no longer run on SDK 57.

  const handleStartRecording = () => {
    if (!isOnline) return;
    setIsRecording(true);
    // TODO: start the expo-audio recorder
    //   const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
    //   await recorder.prepareToRecordAsync();
    //   recorder.record();
  };

  const handleStopRecording = async () => {
    if (!isRecording) return;
    setIsRecording(false);
    setIsProcessing(true);

    try {
      // TODO: stop the expo-audio recording and get its URI
      //   await recorder.stop();
      //   const uri = recorder.uri;
      //   const { text } = await speechToText(uri);
      //   if (text) await processUserMessage(text);

      // For now, fall through without audio — the text input still works.
      console.warn('[VoiceAssistant] Recording stubs — use text input for now.');
    } catch (err) {
      console.error('STT error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // ---- text pipeline ----

  const handleSendText = async () => {
    const text = inputText.trim();
    if (!text || !isOnline) return;
    setInputText('');
    setIsProcessing(true);
    try {
      await processUserMessage(text);
    } catch (err) {
      console.error('Processing error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const processUserMessage = async (text) => {
    setMessages((prev) => [...prev, { role: 'user', text, timestamp: new Date() }]);

    try {
      const { answer, sources } = await answerQuestion(labId, text);

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: answer, sources, timestamp: new Date() },
      ]);

      // TODO: play the answer aloud via an expo-audio player
      //   const uri = await textToSpeech(answer);
      //   const player = createAudioPlayer({ uri });
      //   player.play();  // player.remove() once it has finished
    } catch (err) {
      console.error('RAG error:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: "Sorry, I had trouble processing that. Please try again.",
          timestamp: new Date(),
        },
      ]);
    }
  };

  const fmtTime = (d) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // ---- render ----

  const renderMessage = (msg, index) => {
    const isUser = msg.role === 'user';
    return (
      <View
        key={index}
        style={[styles.msgRow, isUser ? styles.msgRowUser : styles.msgRowAssistant]}
      >
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
          <Text style={[styles.msgText, isUser && styles.msgTextUser]}>{msg.text}</Text>

          {msg.sources?.length > 0 && (
            <View style={styles.sources}>
              {msg.sources.map((s, i) => (
                <View key={i} style={styles.srcTag}>
                  <Text style={styles.srcLabel}>{s.title}</Text>
                </View>
              ))}
            </View>
          )}

          <Text style={[styles.ts, isUser && styles.tsUser]}>{fmtTime(msg.timestamp)}</Text>
        </View>
      </View>
    );
  };

  return (
    <Page>
      {/* ---- header ---- */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <BackButton onPress={() => navigation.goBack()} />
          <View style={styles.headerTitles}>
            <Eyebrow tone={color.purple}>AI LAB ASSISTANT</Eyebrow>
            <Text style={styles.labTitle} numberOfLines={1}>
              {labTitle}
            </Text>
          </View>
          <View style={styles.onlineBadge}>
            <View
              style={[styles.dot, { backgroundColor: isOnline ? color.green : color.red }]}
            />
            <Text style={[styles.onlineLabel, !isOnline && { color: color.red }]}>
              {isOnline ? 'Online' : 'Offline'}
            </Text>
          </View>
        </View>

        {!isOnline && (
          <View style={styles.offlineBanner}>
            <Text style={styles.offlineBannerText}>
              ⚠️  Voice assistant requires an internet connection
            </Text>
          </View>
        )}
      </View>

      {/* ---- chat ---- */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.chat}
        contentContainerStyle={styles.chatContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        keyboardShouldPersistTaps="handled"
      >
        {messages.map(renderMessage)}

        {isProcessing && (
          <View style={[styles.msgRow, styles.msgRowAssistant]}>
            <View style={[styles.bubble, styles.bubbleAssistant, styles.thinkingBubble]}>
              <ActivityIndicator size="small" color={color.purple} />
              <Text style={styles.thinkingLabel}>Thinking…</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ---- controls ---- */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={[styles.controls, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          {isRecording && (
            <Animated.Text style={[styles.listeningLabel, { opacity: pulseAnim }]}>
              🎤  Listening…
            </Animated.Text>
          )}

          <View style={styles.inputRow}>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                placeholder="Type a question…"
                placeholderTextColor={color.inkFaint}
                value={inputText}
                onChangeText={setInputText}
                editable={isOnline && !isRecording}
                onSubmitEditing={handleSendText}
                returnKeyType="send"
              />
              <Pressable
                style={[
                  styles.sendBtn,
                  (!inputText.trim() || !isOnline) && styles.sendBtnDisabled,
                ]}
                onPress={handleSendText}
                disabled={!inputText.trim() || !isOnline}
              >
                <Text style={styles.sendGlyph}>↑</Text>
              </Pressable>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.micBtn,
                isRecording ? styles.micRecording : styles.micIdle,
                !isOnline && styles.micDisabled,
                pressed && !isRecording && { transform: [{ translateY: 3 }], borderBottomWidth: 2 },
              ]}
              onPressIn={handleStartRecording}
              onPressOut={handleStopRecording}
              disabled={!isOnline}
            >
              <Text style={styles.micGlyph}>🎤</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Page>
  );
}

// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  // header
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 2,
    borderBottomColor: color.hairline,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTitles: { flex: 1, gap: 2 },
  labTitle: { fontFamily: font.display, fontSize: 16, color: color.inkStrong },
  onlineBadge: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  onlineLabel: { fontFamily: font.semibold, fontSize: 11, color: color.greenDeep },
  offlineBanner: {
    marginTop: 10,
    backgroundColor: color.redSoft,
    borderWidth: 2,
    borderColor: color.redEdge,
    borderRadius: radius.chip,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  offlineBannerText: { fontFamily: font.semibold, fontSize: 12.5, color: color.redDeep },

  // chat
  chat: { flex: 1 },
  chatContent: { padding: 18, paddingBottom: 40, gap: 14 },
  msgRow: { flexDirection: 'row' },
  msgRowUser: { justifyContent: 'flex-end' },
  msgRowAssistant: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '82%', padding: 14, borderRadius: radius.tile },
  bubbleUser: {
    backgroundColor: color.blue,
    borderBottomRightRadius: 4,
    borderBottomWidth: 3,
    borderBottomColor: color.blueDeep,
  },
  bubbleAssistant: {
    backgroundColor: color.paper,
    borderBottomLeftRadius: 4,
    borderBottomWidth: 3,
    borderBottomColor: color.hairline,
  },
  msgText: { fontFamily: font.regular, fontSize: 14, lineHeight: 21, color: color.inkBody },
  msgTextUser: { color: '#FFFFFF' },
  sources: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 8 },
  srcTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: color.purpleEdge,
  },
  srcLabel: { fontFamily: font.extra, fontSize: 8.5, letterSpacing: 0.8, color: color.purpleDeep, textTransform: 'uppercase' },
  ts: { fontFamily: font.regular, fontSize: 10, color: color.inkFaint, marginTop: 6, alignSelf: 'flex-end' },
  tsUser: { color: 'rgba(255,255,255,0.65)' },
  thinkingBubble: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  thinkingLabel: { fontFamily: font.medium, fontSize: 13, color: color.purple },

  // controls
  controls: {
    paddingHorizontal: 18,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: color.hairline,
    backgroundColor: color.screen,
  },
  listeningLabel: {
    fontFamily: font.displayBold,
    fontSize: 15,
    color: color.red,
    textAlign: 'center',
    marginBottom: 8,
  },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: color.paper,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: color.hairline,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 10 : 4,
  },
  input: { flex: 1, fontFamily: font.regular, fontSize: 14, color: color.ink, maxHeight: 80 },
  sendBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: color.blue,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendBtnDisabled: { backgroundColor: color.locked },
  sendGlyph: { fontSize: 17, color: '#FFFFFF', fontWeight: '700', marginTop: -1 },
  micBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 4,
  },
  micIdle: { backgroundColor: color.purple, borderBottomColor: color.purpleDeep },
  micRecording: { backgroundColor: color.red, borderBottomColor: color.redDeep },
  micDisabled: { backgroundColor: color.locked, borderBottomColor: color.lockedDeep },
  micGlyph: { fontSize: 24 },
});
