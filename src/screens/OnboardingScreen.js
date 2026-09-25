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
import { color, font, radius, bevel } from '../theme';
import { Page, ChunkyButton, BackButton, Bar } from '../components/ui';
import { CLASSES } from '../data/catalog';
import { BOARDS, CLASS_OPTIONS, cleanName, isValidName, firstNameOf } from '../store/user';
import { useAppState } from '../store/AppState';

/**
 * Asked once, on the very first launch. Three taps, three questions, no
 * paragraphs — the name unlocks the app and the class decides which syllabus
 * the Learn tab opens on.
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
          <Bar value={(stage + 1) / STAGES.length} tone={color.green} height={14} style={{ flex: 1 }} />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {key === 'name' ? (
            <View style={styles.block}>
              <Text style={styles.ask}>What do we call you?</Text>

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
                  placeholder="Your name"
                  placeholderTextColor={color.inkFaint}
                  style={styles.input}
                  autoFocus
                  autoCapitalize="words"
                  autoCorrect={false}
                  maxLength={40}
                  returnKeyType="next"
                  onSubmitEditing={next}
                />
              </Pressable>
              {touched && !nameOk ? (
                <Text style={styles.hint}>Two letters, at least.</Text>
              ) : null}
            </View>
          ) : null}

          {key === 'class' ? (
            <View style={styles.block}>
              <Text style={styles.ask}>
                Which class{firstNameOf(name) ? `, ${firstNameOf(name)}` : ''}?
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
                      <Text style={[styles.classNum, on && { color: color.blueDeep }]}>{c}</Text>
                      <Text style={[styles.classLabel, on && { color: color.blueDeep }]}>
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
              <Text style={styles.ask}>Which board?</Text>

              <View style={{ gap: 10 }}>
                {BOARDS.map((b) => {
                  const on = b === board;
                  return (
                    <Pressable
                      key={b}
                      onPress={() => setBoard(b)}
                      style={[styles.boardRow, on && styles.boardRowOn]}
                    >
                      <Text style={[styles.boardLabel, on && { color: color.blueDeep }]}>{b}</Text>
                      {on ? <Text style={styles.tick}>✓</Text> : null}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.bottom}>
          <ChunkyButton
            label={key === 'board' ? 'Start' : 'Continue'}
            disabled={(key === 'name' && !nameOk) || saving}
            onPress={next}
          />
        </View>
      </KeyboardAvoidingView>
    </Page>
  );
}

const styles = StyleSheet.create({
  page: { paddingHorizontal: 20 },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingTop: 12,
    paddingBottom: 30,
  },
  body: { paddingBottom: 24 },
  block: { gap: 20 },
  ask: { fontFamily: font.displayBold, fontSize: 28, lineHeight: 33, color: color.ink },
  field: {
    paddingVertical: 15,
    paddingHorizontal: 18,
    borderRadius: radius.tile,
    borderWidth: 2,
    borderColor: color.hairline,
    ...bevel(color.hairline),
  },
  fieldBad: { borderColor: color.redEdge, borderBottomColor: color.redEdge },
  input: {
    fontFamily: font.display,
    fontSize: 18,
    color: color.inkStrong,
    padding: 0,
  },
  hint: { fontFamily: font.semibold, fontSize: 12.5, color: color.redDeep, paddingLeft: 4 },

  classGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  classTile: {
    width: 94,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 3,
    borderRadius: radius.tile,
    borderWidth: 2,
    borderColor: color.hairline,
    ...bevel(color.hairline),
  },
  classTileOn: {
    borderColor: color.blueEdge,
    borderBottomColor: color.blueEdge,
    backgroundColor: color.blueSoft,
  },
  classNum: {
    fontFamily: font.displayBold,
    fontSize: 28,
    color: color.inkMuted,
    fontVariant: ['tabular-nums'],
  },
  classLabel: {
    fontFamily: font.extra,
    fontSize: 9.5,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: color.inkFaint,
  },

  boardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: radius.tile,
    borderWidth: 2,
    borderColor: color.hairline,
    ...bevel(color.hairline),
  },
  boardRowOn: {
    borderColor: color.blueEdge,
    borderBottomColor: color.blueEdge,
    backgroundColor: color.blueSoft,
  },
  boardLabel: { fontFamily: font.display, fontSize: 16, color: color.inkSoft },
  tick: { fontFamily: font.displayBold, fontSize: 16, color: color.blueDeep },
  bottom: { paddingBottom: 30, paddingTop: 6, flexDirection: 'column' },
});
