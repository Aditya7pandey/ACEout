import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { color, font, radius, soften } from '../theme';

const TABS = [
  { route: 'Subjects', label: 'Learn', tone: color.blue },
  { route: 'Quests', label: 'Quests', tone: color.purple },
  { route: 'Search', label: 'Search', tone: color.gold },
  { route: 'Profile', label: 'You', tone: color.green },
];

export default function TabBar({ navigation, active }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      {TABS.map((t) => {
        const on = t.route === active;
        const skin = soften[t.tone];
        return (
          <Pressable
            key={t.route}
            style={[
              styles.tab,
              on && { backgroundColor: skin.soft, borderColor: skin.edge },
            ]}
            onPress={() => {
              if (!on) navigation.navigate(t.route);
            }}
          >
            <Text style={[styles.label, on && { color: skin.ink }]}>{t.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 10,
    paddingHorizontal: 12,
    borderTopWidth: 2,
    borderTopColor: color.hairline,
    backgroundColor: color.screen,
  },
  tab: {
    minWidth: 62,
    paddingVertical: 11,
    paddingHorizontal: 10,
    borderRadius: radius.chip,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: font.displayBold,
    fontSize: 13,
    color: color.inkFaint,
  },
});
