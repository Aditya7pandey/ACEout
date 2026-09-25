import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { color, font, radius, bevel, space } from '../theme';
import { PageScroll, Bar, Badge } from '../components/ui';
import TabBar from '../components/TabBar';
import { useAppState } from '../store/AppState';
import { QUESTS, BADGES, progressOf, earnedBadges } from '../store/game';

/** Today's three jobs, and the shelf they add up to. */
export default function QuestsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { game, stats, claimQuest } = useAppState();
  const earned = earnedBadges(game, stats);
  const have = BADGES.filter((b) => earned[b.id]).length;

  return (
    <View style={styles.page}>
      <View style={[styles.head, { paddingTop: insets.top + 10 }]}>
        <Text style={styles.headEyebrow}>Resets in {hoursLeft()}h</Text>
        <Text style={styles.headTitle}>Daily quests</Text>
      </View>

      <PageScroll contentStyle={{ gap: 14, paddingTop: 18 }}>
        <View style={styles.card}>
          {QUESTS.map((q, i) => {
            const at = progressOf(game, q);
            const full = at >= q.target;
            const claimed = Boolean(game.claimed[q.id]);
            return (
              <View key={q.id} style={[styles.quest, i > 0 && styles.questTop]}>
                <View style={{ flex: 1, gap: 8 }}>
                  <Text style={styles.questLabel}>{q.label}</Text>
                  <Bar value={at / q.target} tone={q.tone} height={13} />
                </View>
                {full && !claimed ? (
                  <Pressable
                    onPress={() => claimQuest(q.id)}
                    style={({ pressed }) => [
                      styles.chest,
                      { backgroundColor: color.gold, ...bevel(color.goldDeep) },
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.chestOpen}>Open</Text>
                  </Pressable>
                ) : (
                  <View
                    style={[
                      styles.chest,
                      claimed
                        ? { backgroundColor: '#FDF3DD', borderWidth: 2, borderColor: '#F3D48F' }
                        : { backgroundColor: color.locked, ...bevel(color.lockedDeep) },
                    ]}
                  >
                    <Text
                      style={[
                        styles.chestText,
                        claimed && { color: color.brass },
                      ]}
                    >
                      {claimed ? `+${q.reward}` : `${Math.min(at, q.target)}/${q.target}`}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        <View style={styles.shelfHead}>
          <Text style={styles.shelfTitle}>Badges</Text>
          <Text style={styles.shelfCount}>
            {have} / {BADGES.length}
          </Text>
        </View>

        <View style={styles.shelf}>
          {BADGES.map((b) => {
            const on = earned[b.id];
            return (
              <View key={b.id} style={styles.badgeSlot}>
                <Badge glyph={b.glyph} tone={on ? b.tone : color.locked} size={58} />
                <Text style={[styles.badgeLabel, !on && { color: color.inkFaint }]}>
                  {b.label}
                </Text>
              </View>
            );
          })}
        </View>
      </PageScroll>

      <TabBar navigation={navigation} active="Quests" />
    </View>
  );
}

function hoursLeft() {
  const now = new Date();
  return 24 - now.getHours();
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: color.screen },
  head: {
    backgroundColor: color.purple,
    paddingHorizontal: space.gutter,
    paddingBottom: 20,
    gap: 6,
  },
  headEyebrow: {
    fontFamily: font.extra,
    fontSize: 10.5,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.85)',
  },
  headTitle: { fontFamily: font.displayBold, fontSize: 28, color: '#FFFFFF' },

  card: {
    borderRadius: radius.card,
    borderWidth: 2,
    borderColor: color.hairline,
    paddingHorizontal: 16,
  },
  quest: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16 },
  questTop: { borderTopWidth: 2, borderTopColor: color.hairline },
  questLabel: { fontFamily: font.display, fontSize: 15, color: color.inkStrong },
  chest: {
    width: 56,
    height: 46,
    borderRadius: radius.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { transform: [{ translateY: 3 }], borderBottomWidth: 1 },
  chestOpen: { fontFamily: font.displayBold, fontSize: 13.5, color: '#FFFFFF' },
  chestText: {
    fontFamily: font.displayBold,
    fontSize: 13,
    color: color.lockedInk,
    fontVariant: ['tabular-nums'],
  },

  shelfHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 8,
  },
  shelfTitle: { fontFamily: font.displayBold, fontSize: 20, color: color.ink },
  shelfCount: { fontFamily: font.displayBold, fontSize: 13, color: color.brass },
  shelf: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 18, columnGap: 10 },
  badgeSlot: { width: '30%', alignItems: 'center', gap: 8 },
  badgeLabel: {
    fontFamily: font.semibold,
    fontSize: 11.5,
    lineHeight: 15,
    textAlign: 'center',
    color: color.inkBody,
  },
});
