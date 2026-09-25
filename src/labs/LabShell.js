import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { color, font, radius, bevel } from '../theme';
import { Segmented } from '../components/ui';

/**
 * The strip every bench opens with.
 *
 * A lab used to front a page of prose, a mode picker and a column of fault
 * switches before you could touch anything. That page is gone: the bench opens
 * on step one, and the two things the page actually decided — which mode, and
 * which instruments are lying to you — live in one row above it. The faults
 * stay a deliberate choice (the lab contract asks for them), just folded away
 * until you want them.
 *
 * @param mode         'guided' | 'free'
 * @param onMode       mode setter
 * @param errorKinds   ERROR_KINDS from the lab, or nothing if it injects none
 * @param errorConfig  { [key]: boolean }
 * @param onErrorConfig setter, called with the next config
 */
export default function LabShell({
  mode,
  onMode,
  errorKinds,
  errorConfig,
  onErrorConfig,
  leftInset,
  // A translated bench passes its own { guided, free, faults }; an English one
  // leaves these alone and gets the defaults.
  labels,
  children,
}) {
  const [open, setOpen] = useState(false);
  const kinds = errorKinds ? Object.values(errorKinds) : [];
  const on = kinds.filter((k) => errorConfig?.[k.key]).length;
  const canFault = mode === 'guided' && kinds.length > 0;

  return (
    <View style={styles.wrap}>
      {/* A bench that hides the app bar puts a floating back button in the
          top-left corner; the strip steps around it. */}
      <View style={[styles.strip, leftInset && { paddingLeft: 54, paddingTop: 10 }]}>
        <Segmented
          style={{ flex: 1 }}
          value={mode}
          onChange={(m) => {
            setOpen(false);
            onMode(m);
          }}
          options={[
            { value: 'guided', label: labels?.guided || 'Guided' },
            { value: 'free', label: labels?.free || 'Free play' },
          ]}
        />
        {canFault ? (
          <Pressable
            onPress={() => setOpen((o) => !o)}
            style={({ pressed }) => [
              styles.faultsPill,
              on > 0 && styles.faultsPillOn,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.faultsLabel, on > 0 && { color: color.redDeep }]}>
              {on > 0 ? `Faults ${on}` : 'Faults'}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {canFault && open ? (
        <ScrollView style={styles.sheet} contentContainerStyle={{ gap: 8, padding: 12 }}>
          {kinds.map((k) => {
            const active = Boolean(errorConfig?.[k.key]);
            return (
              <Pressable
                key={k.key}
                onPress={() => onErrorConfig({ ...errorConfig, [k.key]: !active })}
                style={[styles.fault, active && styles.faultOn]}
              >
                <View style={styles.faultHead}>
                  <Text style={[styles.faultLabel, active && { color: color.redDeep }]}>
                    {k.label}
                  </Text>
                  <View style={[styles.switch, active && styles.switchOn]}>
                    <View style={[styles.knob, active && styles.knobOn]} />
                  </View>
                </View>
                <Text style={styles.faultBlurb}>{k.blurb}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}

      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  faultsPill: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: color.hairline,
    ...bevel(color.hairline, 3),
  },
  faultsPillOn: {
    borderColor: color.redEdge,
    borderBottomColor: color.redEdge,
    backgroundColor: color.redSoft,
  },
  pressed: { transform: [{ translateY: 2 }], borderBottomWidth: 2 },
  faultsLabel: {
    fontFamily: font.displayBold,
    fontSize: 12.5,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: color.inkMuted,
  },

  sheet: { maxHeight: 250, backgroundColor: color.paper, borderRadius: radius.tile, margin: 16, marginTop: 0 },
  fault: {
    borderWidth: 2,
    borderColor: color.hairline,
    borderRadius: radius.chip,
    padding: 13,
    gap: 6,
    backgroundColor: color.screen,
  },
  faultOn: { borderColor: color.redEdge, backgroundColor: color.redSoft },
  faultHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  faultLabel: { fontFamily: font.display, fontSize: 14, color: color.inkStrong },
  faultBlurb: {
    fontFamily: font.regular,
    fontSize: 11.5,
    lineHeight: 17,
    color: color.inkMuted,
  },
  switch: {
    width: 40,
    height: 23,
    borderRadius: 12,
    backgroundColor: color.locked,
    padding: 2.5,
    justifyContent: 'center',
  },
  switchOn: { backgroundColor: color.red },
  knob: { width: 18, height: 18, borderRadius: 9, backgroundColor: color.screen },
  knobOn: { alignSelf: 'flex-end' },
});
