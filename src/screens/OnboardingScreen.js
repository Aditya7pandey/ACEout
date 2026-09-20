import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { color, font, type, radius } from '../theme';
import { Page, GoldButton, Eyebrow, BackButton } from '../components/ui';
import { CLASSES } from '../data/catalog';
import { BOARDS, CLASS_OPTIONS, cleanName, isValidName, firstNameOf } from '../store/user';
import { useAppState } from '../store/AppState';

/**
 * Asked once, on the very first launch. Three short stages rather than one
 * long form — the name alone unlocks the app, and the class decides which
 * syllabus the Learn tab opens on.
 */
const STAGES = ['name', 'class', 'board'];

export default function OnboardingScreen({ navigation }) {
  const { saveProfile } = useAppState();
  const [stage, setStage] = useState(0);
  const [name, setName] = useState('');
  const [cls, setCls] = useState('11');
  const [board, setBoard] = useState(BOARDS[0]);
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const nameRef = useRef(null);

  const key = STAGES[stage];
  const nameOk = isValidName(name);

  const back = () => {
    if (stage === 0) navigation.goBack();
    else setStage((s) => s - 1);
  };

  const next = async () => {
    if (key === 'name') {
      setTouched(true);
      if (!nameOk) return;
      setStage(1);
      return;
    }
    if (key === 'class') {
      setStage(2);
      return;
    }
    setSaving(true);
    await saveProfile({ name: cleanName(name), cls, board });
    navigation.reset({ index: 0, routes: [{ name: 'Subjects' }] });
  };

  return (
    <Page style={styles.page}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.top}>
          {stage > 0 || navigation.canGoBack() ? <BackButton onPress={back} /> : null}
          <View style={styles.pips}>
            {STAGES.map((s, i) => (
              <View key={s} style={[styles.pip, i <= stage && styles.pipOn]} />
            ))}
          </View>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {key === 'name' ? (
            <View style={styles.block}>
              <Eyebrow>Step one of three</Eyebrow>
              <Text style={type.display}>
                What should we <Text style={{ color: color.brass }}>call you</Text>?
              </Text>
              <Text style={styles.blurb}>
                Your name sits on every report you produce, the way it would on a real practical
                record. Nothing leaves this device.
              </Text>

              <Pressable
                onPress={() => nameRef.current?.focus()}
                style={[styles.field, touched && !nameOk && styles.fieldBad]}
              >
                <TextInput
                  ref={nameRef}
                  value={name}
                  onChangeText={(t) => {
                    setName(t);
                    if (touched) setTouched(false);
                  }}
                  placeholder="Your full name"
                  placeholderTextColor="rgba(28,24,21,0.28)"
                  style={styles.input}
                  autoFocus
                  autoCapitalize="words"
                  autoCorrect={false}
                  maxLength={40}
                  returnKeyType="next"
                  onSubmitEditing={next}
                />
              </Pressable>
              <Text style={[styles.hint, touched && !nameOk && { color: color.red }]}>
                {touched && !nameOk
                  ? 'Give us at least two letters to go on.'
                  : 'You can change this later from the You tab.'}
              </Text>
            </View>
          ) : null}

          {key === 'class' ? (
            <View style={styles.block}>
              <Eyebrow>Step two of three</Eyebrow>
              <Text style={type.display}>
                Which <Text style={{ color: color.brass }}>class</Text> are you in
                {firstNameOf(name) ? `, ${firstNameOf(name)}` : ''}?
              </Text>
              <Text style={styles.blurb}>
                The Learn tab opens straight on your class. You can switch class any time from
                the You tab.
              </Text>

              <View style={styles.classGrid}>
                {CLASS_OPTIONS.map((c) => {
                  const on = c === cls;
                  const meta = CLASSES.find((x) => x.num === c);
                  return (
                    <Pressable
                      key={c}
                      onPress={() => setCls(c)}
                      style={[styles.classTile, on && styles.classTileOn]}
                    >
                      <Text style={[styles.classNum, on && { color: color.brass }]}>{c}</Text>
                      <Text style={[styles.classLabel, on && { color: color.inkStrong }]}>
                        {meta ? `${meta.labs} labs` : 'labs'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}

          {key === 'board' ? (
            <View style={styles.block}>
              <Eyebrow>Step three of three</Eyebrow>
              <Text style={type.display}>
                Which <Text style={{ color: color.brass }}>board</Text> do you follow?
              </Text>
              <Text style={styles.blurb}>
                Benches are built to the NCERT 2025–26 syllabus; your board decides how the
                practical record is worded.
              </Text>

              <View style={{ gap: 10 }}>
                {BOARDS.map((b) => {
                  const on = b === board;
                  return (
                    <Pressable
                      key={b}
                      onPress={() => setBoard(b)}
                      style={[styles.boardRow, on && styles.boardRowOn]}
                    >
                      <View style={[styles.radio, on && styles.radioOn]}>
                        {on ? <View style={styles.radioDot} /> : null}
                      </View>
                      <Text style={[styles.boardLabel, on && { color: color.inkStrong }]}>{b}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.summary}>
                <Text style={styles.summaryLine}>
                  {cleanName(name)} · Class {cls} · {board}
                </Text>
              </View>
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.bottom}>
          <GoldButton
            label={key === 'board' ? 'Start experimenting' : 'Continue'}
            disabled={(key === 'name' && !nameOk) || saving}
            onPress={next}
          />
        </View>
      </KeyboardAvoidingView>
    </Page>
  );
}

const styles = StyleSheet.create({
  page: { paddingHorizontal: 26 },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingTop: 12,
    paddingBottom: 26,
  },
  pips: { flexDirection: 'row', gap: 6, flex: 1 },
  pip: { height: 2, width: 26, backgroundColor: 'rgba(28,24,21,0.12)' },
  pipOn: { backgroundColor: color.brass },
  body: { paddingBottom: 24 },
  block: { gap: 16 },
  blurb: {
    fontFamily: font.regular,
    fontSize: 13.5,
    lineHeight: 22,
    color: color.inkMuted,
    maxWidth: 320,
  },
  field: {
    marginTop: 10,
    paddingVertical: 15,
    paddingHorizontal: 18,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: 'rgba(150,102,47,0.4)',
    backgroundColor: 'rgba(150,102,47,0.05)',
  },
  fieldBad: { borderColor: color.red, backgroundColor: 'rgba(178,52,40,0.05)' },
  input: {
    fontFamily: font.semibold,
    fontSize: 16,
    color: color.inkStrong,
    padding: 0,
  },
  hint: {
    fontFamily: font.regular,
    fontSize: 11.5,
    lineHeight: 17,
    color: color.inkMuted,
    paddingHorizontal: 4,
  },
  classGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 6 },
  classTile: {
    width: 92,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 4,
    borderRadius: radius.tile,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: color.hairline,
    backgroundColor: 'rgba(28,24,21,0.028)',
  },
  classTileOn: {
    borderColor: 'rgba(150,102,47,0.5)',
    backgroundColor: 'rgba(150,102,47,0.07)',
  },
  classNum: {
    fontFamily: font.bold,
    fontSize: 26,
    letterSpacing: -0.7,
    color: color.inkMuted,
    fontVariant: ['tabular-nums'],
  },
  classLabel: {
    fontFamily: font.bold,
    fontSize: 9,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: color.inkMuted,
  },
  boardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: radius.tile,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: color.hairline,
    backgroundColor: 'rgba(28,24,21,0.028)',
  },
  boardRowOn: {
    borderColor: 'rgba(150,102,47,0.5)',
    backgroundColor: 'rgba(150,102,47,0.07)',
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.4,
    borderColor: 'rgba(28,24,21,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { borderColor: color.brass },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: color.brass },
  boardLabel: { fontFamily: font.semibold, fontSize: 14.5, color: color.inkSoft },
  summary: {
    marginTop: 14,
    paddingLeft: 14,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(150,102,47,0.35)',
  },
  summaryLine: {
    fontFamily: font.bold,
    fontSize: 10,
    letterSpacing: 1.7,
    textTransform: 'uppercase',
    color: color.brass,
  },
  bottom: { paddingBottom: 30, paddingTop: 6, flexDirection: 'column' },
});
