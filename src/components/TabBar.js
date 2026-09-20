import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { color, font } from '../theme';

const TABS = [
  { route: 'Subjects', label: 'Learn' },
  { route: 'Search', label: 'Search' },
  { route: 'Profile', label: 'You' },
];

export default function TabBar({ navigation, active }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {TABS.map((t) => {
        const on = t.route === active;
        return (
          <Pressable
            key={t.route}
            style={styles.tab}
            onPress={() => {
              if (!on) navigation.navigate(t.route);
            }}
          >
            <View style={[styles.dot, on && { backgroundColor: color.brass }]} />
            <Text style={[styles.label, on && { color: color.brass }]}>{t.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    paddingTop: 12,
    paddingHorizontal: 34,
    borderTopWidth: StyleSheet.hairlineWidth * 2,
    borderTopColor: color.hairline,
    backgroundColor: 'rgba(251,247,240,0.96)',
  },
  tab: { flex: 1, alignItems: 'center', gap: 7, paddingVertical: 4 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: 'transparent' },
  label: {
    fontFamily: font.bold,
    fontSize: 9.5,
    letterSpacing: 1.7,
    textTransform: 'uppercase',
    color: color.inkMuted,
  },
});
