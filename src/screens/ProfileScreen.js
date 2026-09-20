import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import { color, font, type, space } from '../theme';
import { Page, PageScroll, Eyebrow, GhostButton } from '../components/ui';
import { confirm } from '../components/confirm';
import TabBar from '../components/TabBar';
import { SUBJECTS, findLabMeta } from '../data/catalog';
import { describeWhen } from '../store/progress';
import { BOARDS, CLASS_OPTIONS, initialsOf, cleanName, isValidName } from '../store/user';
import { useAppState } from '../store/AppState';
import { formatSigFigs } from '../measure/leastCount';

export default function ProfileScreen({ navigation }) {
  const { user, progress, stats, saveProfile, resetProgress, signOut } = useAppState();
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState(user?.name || '');
  const [openRow, setOpenRow] = useState(null);

  const completions = progress.completions || [];

  const commitName = () => {
    if (isValidName(draftName)) saveProfile({ name: cleanName(draftName) });
    else setDraftName(user?.name || '');
    setEditingName(false);
  };

  const confirmReset = () =>
    confirm({
      title: 'Clear your lab record?',
      message:
        'Every completed experiment and reading stored on this device will be removed. Your name and class stay.',
      confirmLabel: 'Clear',
      cancelLabel: 'Keep it',
      onConfirm: () => resetProgress(),
    });

  const confirmSignOut = () =>
    confirm({
      title: 'Start over?',
      message:
        'This wipes your name, class and every logged experiment, and takes you back to onboarding.',
      confirmLabel: 'Start over',
      onConfirm: async () => {
        await signOut();
        navigation.reset({ index: 0, routes: [{ name: 'Splash' }] });
      },
    });

  return (
    <Page>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initialsOf(user?.name)}</Text>
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
              placeholder="Your full name"
              placeholderTextColor="rgba(28,24,21,0.28)"
            />
          ) : (
            <Pressable
              onPress={() => {
                setDraftName(user?.name || '');
                setEditingName(true);
              }}
            >
              <Text style={type.title} numberOfLines={1}>
                {user?.name || 'Your name'}
              </Text>
            </Pressable>
          )}
          <Text style={styles.sub}>
            Class {user?.cls || '—'} · {user?.board || '—'}
            {stats.streak > 0 ? ` · ${stats.streak}-day streak` : ''}
          </Text>
        </View>
      </View>

      <PageScroll contentStyle={{ gap: 26 }}>
        <View style={styles.tally}>
          <Stat value={stats.labsDone} label="Labs done" />
          <Stat value={stats.totalRuns} label="Total runs" />
          <Stat
            value={describeWhen(stats.lastActiveAt) || '—'}
            label="Last bench"
            small
          />
        </View>

        <View style={{ gap: 14 }}>
          <Eyebrow>Progress by discipline</Eyebrow>
          {SUBJECTS.map((s) => {
            const done = stats.bySubject[s.key] || 0;
            const total = s.totalLabs;
            return (
              <View key={s.key} style={{ gap: 9 }}>
                <View style={styles.progressHead}>
                  <Text style={styles.progressName}>{s.name}</Text>
                  <Text style={styles.progressCount}>
                    {done}/{total}
                  </Text>
                </View>
                <View style={styles.track}>
                  <View
                    style={[
                      styles.fill,
                      {
                        width: `${Math.min(100, (done / total) * 100)}%`,
                        backgroundColor: s.accent,
                      },
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </View>

        <View style={{ gap: 12 }}>
          <Eyebrow>Recently run</Eyebrow>
          {completions.length === 0 ? (
            <Text style={styles.empty}>
              Nothing yet. Class 11 · Physics · Work, Energy and Power has a live bench waiting.
            </Text>
          ) : (
            completions.map((c) => {
              const meta = findLabMeta(c.labId);
              return (
                <Pressable
                  key={c.labId}
                  style={styles.recent}
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
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={styles.recentTitle}>{c.title || meta?.title || c.labId}</Text>
                    <Text style={styles.recentWhen}>
                      {describeWhen(c.at)} · {c.trials} readings
                      {c.runs > 1 ? ` · ${c.runs} runs` : ''}
                      {Number.isFinite(c.mu) ? (
                        // Kept out of the uppercase transform — μ must not
                        // become a capital Mu.
                        <Text style={styles.symbol}> · μ = {formatSigFigs(c.mu, 2)}</Text>
                      ) : null}
                    </Text>
                  </View>
                  <Text style={styles.done}>DONE</Text>
                </Pressable>
              );
            })
          )}
        </View>

        <View style={{ gap: 4 }}>
          <Eyebrow>Your setup</Eyebrow>
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
          <View style={styles.setting}>
            <Text style={styles.settingLabel}>Offline lab downloads</Text>
            <Text style={styles.settingValue}>All bundled</Text>
          </View>
          <View style={styles.setting}>
            <Text style={styles.settingLabel}>Where your data lives</Text>
            <Text style={styles.settingValue}>This device only</Text>
          </View>
        </View>

        <View style={{ gap: 10 }}>
          <GhostButton label="Clear lab record" onPress={confirmReset} tone={color.inkMuted} />
          <GhostButton label="Start over" onPress={confirmSignOut} tone={color.red} />
        </View>
      </PageScroll>

      <TabBar navigation={navigation} active="Profile" />
    </Page>
  );
}

function Stat({ value, label, small }) {
  return (
    <View style={{ flex: 1, gap: 5 }}>
      <Text style={[styles.statValue, small && styles.statValueSmall]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

/** A settings row that expands into chips instead of pushing a picker screen. */
function OptionRow({ label, value, options, selected, open, onToggle, onPick, render }) {
  return (
    <View>
      <Pressable style={styles.setting} onPress={onToggle}>
        <Text style={styles.settingLabel}>{label}</Text>
        <Text style={[styles.settingValue, open && { color: color.brass }]}>{value}</Text>
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
                <Text style={[styles.chipLabel, on && { color: color.brass }]}>
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
    gap: 17,
    paddingHorizontal: space.gutter,
    paddingTop: 18,
    paddingBottom: 22,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#C79F6E',
    borderWidth: 5,
    borderColor: '#DCBB8C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: font.extra, fontSize: 16, color: '#2A1F10' },
  nameInput: {
    fontFamily: font.bold,
    fontSize: 22,
    lineHeight: 26,
    letterSpacing: -0.44,
    color: color.ink,
    padding: 0,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150,102,47,0.5)',
  },
  sub: {
    fontFamily: font.bold,
    fontSize: 9.5,
    letterSpacing: 1.7,
    textTransform: 'uppercase',
    color: color.inkMuted,
  },
  tally: {
    flexDirection: 'row',
    gap: 16,
    paddingVertical: 18,
    borderTopWidth: StyleSheet.hairlineWidth * 2,
    borderBottomWidth: StyleSheet.hairlineWidth * 2,
    borderColor: color.hairline,
  },
  statValue: {
    fontFamily: font.bold,
    fontSize: 24,
    letterSpacing: -0.6,
    color: color.inkStrong,
    fontVariant: ['tabular-nums'],
  },
  statValueSmall: { fontSize: 14, letterSpacing: -0.2, paddingTop: 8 },
  statLabel: {
    fontFamily: font.bold,
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: color.inkMuted,
  },
  progressHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  progressName: { fontFamily: font.semibold, fontSize: 14, color: color.inkStrong },
  progressCount: {
    fontFamily: font.bold,
    fontSize: 11.5,
    color: color.inkMuted,
    fontVariant: ['tabular-nums'],
  },
  track: { height: 2, backgroundColor: 'rgba(28,24,21,0.11)', overflow: 'hidden' },
  fill: { height: '100%' },
  recent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 13,
    borderTopWidth: StyleSheet.hairlineWidth * 2,
    borderTopColor: color.hairline,
  },
  recentTitle: { fontFamily: font.semibold, fontSize: 13.5, lineHeight: 18, color: color.inkStrong },
  recentWhen: {
    fontFamily: font.bold,
    fontSize: 9.5,
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    color: color.inkMuted,
  },
  symbol: { textTransform: 'none' },
  done: { fontFamily: font.bold, fontSize: 9.5, letterSpacing: 1.5, color: color.green },
  empty: { fontFamily: font.regular, fontSize: 12.5, lineHeight: 20, color: color.inkMuted },
  setting: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderTopWidth: StyleSheet.hairlineWidth * 2,
    borderTopColor: color.hairline,
  },
  settingLabel: { fontFamily: font.regular, fontSize: 13.5, color: color.inkBody },
  settingValue: { fontFamily: font.semibold, fontSize: 12.5, color: color.inkMuted },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 14 },
  chip: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: color.hairline,
    backgroundColor: 'rgba(28,24,21,0.028)',
  },
  chipOn: { borderColor: 'rgba(150,102,47,0.5)', backgroundColor: 'rgba(150,102,47,0.07)' },
  chipLabel: {
    fontFamily: font.bold,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: color.inkMuted,
  },
});
