import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import { color, font, radius } from '../theme';
import { validateReading, decimalsFor } from './leastCount';

/**
 * The only way a measurement enters the app. Every value is checked against
 * the instrument's least count before it is allowed into the data table.
 */
export default function ReadingInput({
  instrument,
  label,
  placeholder,
  value,
  onChange,
  onCommit,
  committed,
  hint,
  autoFocus,
  submitLabel = 'Record',
  extraError,
}) {
  const [touched, setTouched] = useState(false);
  const result = useMemo(
    () => (value ? validateReading(value, instrument) : null),
    [value, instrument]
  );

  const show = touched && result;
  const errors = [...(show ? result.errors : []), ...(extraError ? [extraError] : [])];
  const warnings = show && !extraError ? result.warnings : [];
  const state = committed
    ? 'committed'
    : errors.length
    ? 'error'
    : warnings.length
    ? 'warn'
    : show && result.ok
    ? 'ok'
    : 'idle';

  const borderColor = {
    committed: 'rgba(47,142,108,0.5)',
    error: 'rgba(178,52,40,0.55)',
    warn: 'rgba(184,134,47,0.55)',
    ok: 'rgba(47,142,108,0.4)',
    idle: color.hairline,
  }[state];

  return (
    <View style={styles.wrap}>
      {label ? (
        <View style={styles.labelRow}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.lc}>
            {instrument.name} · {decimalsFor(instrument.leastCount)} d.p.
          </Text>
        </View>
      ) : null}

      <View style={[styles.field, { borderColor }]}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={(t) => {
            setTouched(true);
            onChange(t.replace(/[^0-9.\-]/g, ''));
          }}
          onBlur={() => setTouched(true)}
          placeholder={placeholder || `0.${'0'.repeat(decimalsFor(instrument.leastCount))}`}
          placeholderTextColor="rgba(28,24,21,0.25)"
          keyboardType="decimal-pad"
          editable={!committed}
          autoFocus={autoFocus}
          returnKeyType="done"
        />
        <Text style={styles.unit}>{instrument.unit.trim()}</Text>
        {onCommit ? (
          <Pressable
            onPress={() => {
              setTouched(true);
              if (result?.ok) onCommit(result.value, result);
            }}
            disabled={committed || !result?.ok}
            style={({ pressed }) => [
              styles.commit,
              (!result?.ok || committed) && { opacity: 0.3 },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text style={styles.commitLabel}>{committed ? 'Logged' : submitLabel}</Text>
          </Pressable>
        ) : null}
      </View>

      {errors.map((e) => (
        <Feedback key={e} tone={color.red} text={e} />
      ))}
      {!errors.length && warnings.map((w) => <Feedback key={w} tone={color.amber} text={w} />)}
      {!errors.length && !warnings.length && hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

function Feedback({ tone, text }) {
  return (
    <View style={[styles.feedback, { borderLeftColor: tone }]}>
      <Text style={[styles.feedbackText, { color: tone }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  labelRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 },
  label: {
    flex: 1,
    fontFamily: font.bold,
    fontSize: 9.5,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: color.inkMuted,
  },
  lc: {
    fontFamily: font.medium,
    fontSize: 9.5,
    letterSpacing: 0.4,
    color: 'rgba(28,24,21,0.38)',
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: radius.chip,
    backgroundColor: color.paper,
    paddingLeft: 14,
    paddingRight: 6,
    height: 50,
  },
  input: {
    flex: 1,
    fontFamily: font.bold,
    fontSize: 19,
    letterSpacing: -0.3,
    color: color.ink,
    padding: 0,
  },
  unit: { fontFamily: font.semibold, fontSize: 13, color: color.inkMuted },
  commit: {
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: radius.pill,
    backgroundColor: color.goldBottom,
  },
  commitLabel: {
    fontFamily: font.extra,
    fontSize: 10,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: color.onGold,
  },
  feedback: { borderLeftWidth: 2, paddingLeft: 10, paddingVertical: 2 },
  feedbackText: { fontFamily: font.medium, fontSize: 11.5, lineHeight: 17 },
  hint: { fontFamily: font.regular, fontSize: 11.5, lineHeight: 17, color: color.inkMuted },
});
