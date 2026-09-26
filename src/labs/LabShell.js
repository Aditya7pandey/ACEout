import React from 'react';
import { View, StyleSheet } from 'react-native';
import { color } from '../theme';
import { Segmented } from '../components/ui';

/**
 * The strip every bench opens with.
 *
 * A lab used to front a page of prose, a mode picker before you could touch
 * anything. That page is gone: the bench opens on step one, and the mode
 * picker lives in one row above it.
 *
 * @param mode         'guided' | 'free'
 * @param onMode       mode setter
 */
export default function LabShell({
  mode,
  onMode,
  leftInset,
  // A translated bench passes its own { guided, free }; an English one
  // leaves these alone and gets the defaults.
  labels,
  children,
}) {
  return (
    <View style={styles.wrap}>
      {/* A bench that hides the app bar puts a floating back button in the
          top-left corner; the strip steps around it. */}
      <View style={[styles.strip, leftInset && { paddingLeft: 54, paddingTop: 10 }]}>
        <Segmented
          style={{ flex: 1 }}
          value={mode}
          onChange={onMode}
          options={[
            { value: 'guided', label: labels?.guided || 'Guided' },
            { value: 'free', label: labels?.free || 'Free play' },
          ]}
        />
      </View>

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
});
