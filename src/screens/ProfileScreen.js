import React, { useState } from 'react';
import { View, StyleSheet, Pressable, TextInput } from 'react-native';
import { color, font, radius, bevel, space } from '../theme';
import { Page, PageScroll, GhostButton, Bar, Badge, Stars } from '../components/ui';
import { confirm } from '../components/confirm';
import TabBar from '../components/TabBar';
import { findLabMeta } from '../data/catalog';
import { describeWhen } from '../store/progress';
import { BOARDS, CLASS_OPTIONS, initialsOf, cleanName, isValidName } from '../store/user';
import { useAppState } from '../store/AppState';
import { BADGES, earnedBadges, totalStars, starsFor } from '../store/game';
import { LANGS, useLanguage, Text } from '../i18n';

/** The trophy shelf: who you are, what you have banked, what you have run. */
export default function ProfileScreen({ navigation }) {
  const { user, progress, stats, game, level, saveProfile, resetProgress, signOut } =
    useAppState();
  const { lang, setLang, t } = useLanguage();
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState(user?.name || '');
  const [openRow, setOpenRow] = useState(null);

  const completions = (progress.completions || []).slice(0, 5);
  const earned = earnedBadges(game, stats);

  const commitName = () => {
    if (isValidName(draftName)) saveProfile({ name: cleanName(draftName) });
    else setDraftName(user?.name || '');
    setEditingName(false);
  };

  const confirmReset = () =>
    confirm({
      title: 'Clear your record?',
      message: 'Every logged bench, star and XP on this device goes. Your name and class stay.',
      confirmLabel: 'Clear',
      cancelLabel: 'Keep it',
      onConfirm: () => resetProgress(),
    });

  const confirmSignOut = () =>
    confirm({
      title: 'Start over?',
      message: 'This wipes your name, class and everything you have earned.',
      confirmLabel: 'Start over',
      onConfirm: async () => {
        await signOut();
        navigation.reset({ index: 0, routes: [{ name: 'Splash' }] });
      },
    });

  return (
    <Page>
      <View style={styles.header}>
        <View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initialsOf(user?.name)}</Text>
          </View>
          <View style={styles.levelChip}>
            <Text style={styles.levelChipText}>Lv {level.level}</Text>
          </View>
        </View>
        <View style={{ gap: 5, flex: 1 }}>
          {editingName ? (
            <TextInput
              value={draftName}
              onChangeText={setDraftName}
              onBlur={commitName}
              onSubmitEditing={commitName}
              style={styles.nameInput}
              autoFocus
              autoCapitalize="words"
              autoCorrect={false}
              maxLength={40}
              returnKeyType="done"
              placeholder="Your name"
              placeholderTextColor={color.inkFaint}
            />
          ) : (
            <Pressable
              onPress={() => {
                setDraftName(user?.name || '');
                setEditingName(true);
              }}
            >
              <Text style={styles.name} numberOfLines={1}>
                {user?.name || 'Your name'}
              </Text>
            </Pressable>
          )}
          <Text style={styles.sub}>
            Class {user?.cls || '—'} · {level.rank}
          </Text>
        </View>
      </View>

      <PageScroll contentStyle={{ gap: 22 }}>
        <View style={styles.tiles}>
          <Tile value={stats.streak} label="Streak" tone={color.red} />
          <Tile value={game.xp.toLocaleString()} label="XP" tone={color.gold} />
          <Tile value={totalStars(game)} label="Stars" tone={color.blue} />
        </View>

        <View style={{ gap: 9 }}>
          <View style={styles.barTop}>
            <Text style={styles.sectionTitle}>Level {level.level}</Text>
            <Text style={styles.barXp}>{level.toNext} XP to go</Text>
          </View>
          <Bar value={level.fraction} tone={color.gold} height={14} />
        </View>

        <View style={{ gap: 14 }}>
          <Text style={styles.sectionTitle}>Badges</Text>
          <View style={styles.shelf}>
            {BADGES.map((b) => (
              <View key={b.id} style={styles.badgeSlot}>
                <Badge glyph={b.glyph} tone={earned[b.id] ? b.tone : color.locked} size={54} />
                <Text style={[styles.badgeLabel, !earned[b.id] && { color: color.inkFaint }]}>
                  {b.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ gap: 10 }}>
          <Text style={styles.sectionTitle}>Recent benches</Text>
          {completions.length === 0 ? (
            <Text style={styles.empty}>Nothing yet. Pick a world and start.</Text>
          ) : (
            completions.map((c) => {
              const meta = findLabMeta(c.labId);
              return (
                <Pressable
                  key={c.labId}
                  style={({ pressed }) => [styles.recent, pressed && styles.pressed]}
                  onPress={() =>
                    meta?.built
                      ? navigation.navigate('Lab', {
                          labId: c.labId,
                          title: meta.title,
                          cls: meta.cls,
                          subject: meta.subject,
                          chapterNo: meta.chapterNo,
                        })
                      : undefined
                  }
                >
                  <View style={{ flex: 1, gap: 6 }}>
                    <Text style={styles.recentTitle} numberOfLines={1}>
                      {c.title || meta?.title || c.labId}
                    </Text>
                    <Text style={styles.recentWhen}>{describeWhen(c.at)}</Text>
                  </View>
                  <Stars earned={starsFor(game, c.labId)} size={14} />
                </Pressable>
              );
            })
          )}
        </View>

        <View style={{ gap: 4 }}>
          <Text style={styles.sectionTitle}>Setup</Text>
          <OptionRow
            label="Class"
            value={user?.cls ? `Class ${user.cls}` : '—'}
            options={CLASS_OPTIONS}
            render={(c) => `Class ${c}`}
            selected={user?.cls}
            open={openRow === 'cls'}
            onToggle={() => setOpenRow(openRow === 'cls' ? null : 'cls')}
            onPick={(c) => {
              saveProfile({ cls: c });
              setOpenRow(null);
            }}
          />
          <OptionRow
            label="Board"
            value={user?.board || '—'}
            options={BOARDS}
            selected={user?.board}
            open={openRow === 'board'}
            onToggle={() => setOpenRow(openRow === 'board' ? null : 'board')}
            onPick={(b) => {
              saveProfile({ board: b });
              setOpenRow(null);
            }}
          />
          {/* Only the ray-optics bench is translated so far, and the row says
              so rather than promising a Hindi app it cannot deliver yet. */}
          <OptionRow
            label={t('settings.language')}
            note={t('settings.language.note')}
            value={LANGS.find((l) => l.key === lang)?.label || '—'}
            options={LANGS.map((l) => l.key)}
            render={(k) => LANGS.find((l) => l.key === k)?.label || k}
            selected={lang}
            open={openRow === 'lang'}
            onToggle={() => setOpenRow(openRow === 'lang' ? null : 'lang')}
            onPick={(k) => {
              setLang(k);
              setOpenRow(null);
            }}
          />
        </View>

        <View style={{ gap: 10 }}>
          <GhostButton label="Clear record" onPress={confirmReset} />
          <GhostButton label="Start over" onPress={confirmSignOut} tone={color.red} />
        </View>
      </PageScroll>

      <TabBar navigation={navigation} active="Profile" />
    </Page>
  );
}

function Tile({ value, label, tone }) {
  return (
    <View style={[styles.tile, { borderColor: tone }]}>
      <Text style={[styles.tileValue, { color: tone }]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.tileLabel}>{label}</Text>
    </View>
  );
}

/** A settings row that expands into chips instead of pushing a picker screen. */
function OptionRow({ label, note, value, options, selected, open, onToggle, onPick, render }) {
  return (
    <View>
      <Pressable style={styles.setting} onPress={onToggle}>
        <View style={{ flex: 1 }}>
          <Text style={styles.settingLabel}>{label}</Text>
          {note ? <Text style={styles.settingNote}>{note}</Text> : null}
        </View>
        <Text style={[styles.settingValue, open && { color: color.blueDeep }]}>{value}</Text>
      </Pressable>
      {open ? (
        <View style={styles.chips}>
          {options.map((o) => {
            const on = o === selected;
            return (
              <Pressable
                key={o}
                onPress={() => onPick(o)}
                style={[styles.chip, on && styles.chipOn]}
              >
                <Text style={[styles.chipLabel, on && { color: color.blueDeep }]}>
                  {render ? render(o) : o}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    paddingHorizontal: space.gutter,
    paddingTop: 14,
    paddingBottom: 20,
  },
  avatar: {
    width: 66,
    height: 62,
    borderRadius: 22,
    backgroundColor: color.blue,
    ...bevel(color.blueDeep, 5),
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: font.displayBold, fontSize: 21, color: '#FFFFFF' },
  levelChip: {
    position: 'absolute',
    bottom: -10,
    alignSelf: 'center',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: color.ink,
  },
  levelChipText: { fontFamily: font.displayBold, fontSize: 11, color: color.goldTop },
  name: { fontFamily: font.displayBold, fontSize: 24, color: color.ink },
  nameInput: {
    fontFamily: font.displayBold,
    fontSize: 24,
    color: color.ink,
    padding: 0,
    borderBottomWidth: 2,
    borderBottomColor: color.blueEdge,
  },
  sub: {
    fontFamily: font.extra,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: color.inkMuted,
  },

  tiles: { flexDirection: 'row', gap: 10 },
  tile: {
    flex: 1,
    borderRadius: radius.tile,
    borderWidth: 2,
    borderBottomWidth: 4,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 3,
  },
  tileValue: { fontFamily: font.displayBold, fontSize: 22, fontVariant: ['tabular-nums'] },
  tileLabel: {
    fontFamily: font.extra,
    fontSize: 9.5,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: color.inkMuted,
  },

  sectionTitle: { fontFamily: font.displayBold, fontSize: 19, color: color.ink },
  barTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  barXp: { fontFamily: font.displayBold, fontSize: 12.5, color: color.brass },

  shelf: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 16, columnGap: 10 },
  badgeSlot: { width: '30%', alignItems: 'center', gap: 7 },
  badgeLabel: {
    fontFamily: font.semibold,
    fontSize: 11,
    lineHeight: 14,
    textAlign: 'center',
    color: color.inkBody,
  },

  recent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 13,
    borderRadius: radius.tile,
    borderWidth: 2,
    borderColor: color.hairline,
    ...bevel(color.hairline),
  },
  pressed: { transform: [{ translateY: 3 }], borderBottomWidth: 2 },
  recentTitle: { fontFamily: font.display, fontSize: 14.5, color: color.inkStrong },
  recentWhen: {
    fontFamily: font.extra,
    fontSize: 9.5,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: color.inkFaint,
  },
  empty: { fontFamily: font.regular, fontSize: 13, color: color.inkMuted },

  setting: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderTopWidth: 2,
    borderTopColor: color.hairline,
  },
  settingLabel: { fontFamily: font.medium, fontSize: 14, color: color.inkBody },
  settingNote: { fontFamily: font.regular, fontSize: 11.5, color: color.inkFaint, marginTop: 2 },
  settingValue: { fontFamily: font.displayBold, fontSize: 13.5, color: color.inkMuted },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 14 },
  chip: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: color.hairline,
  },
  chipOn: { borderColor: color.blueEdge, backgroundColor: color.blueSoft },
  chipLabel: {
    fontFamily: font.displayBold,
    fontSize: 12,
    color: color.inkMuted,
  },
});
