import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { loadUser, saveUser, clearUser } from './user';
import {
  loadProgress,
  recordCompletion,
  resetProgress as wipeProgress,
  EMPTY_PROGRESS,
  summarise,
} from './progress';
import {
  loadGame,
  recordRun,
  resetGame as wipeGame,
  claimQuest as bankQuest,
  refreshQuests,
  EMPTY_GAME,
  levelOf,
} from './game';

/**
 * One place that owns the two persisted records (user + progress) and keeps
 * the screens in sync with them. Every screen reads from here; nothing else
 * touches AsyncStorage directly.
 */

const AppStateContext = createContext(null);

export function AppStateProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null);
  const [progress, setProgress] = useState(EMPTY_PROGRESS);
  const [game, setGame] = useState(EMPTY_GAME);

  useEffect(() => {
    let alive = true;
    Promise.all([loadUser(), loadProgress(), loadGame().then(refreshQuests)]).then(
      ([u, p, g]) => {
        if (!alive) return;
        setUser(u);
        setProgress(p);
        setGame(g);
        setReady(true);
      }
    );
    return () => {
      alive = false;
    };
  }, []);

  const saveProfile = useCallback(async (patch) => {
    const next = await saveUser(patch);
    setUser(next);
    return next;
  }, []);

  /**
   * One finished bench updates both records: the honest lab log, and the score
   * on top of it. Returns the award so the result screen can show what the run
   * was worth without recomputing it.
   */
  const completeLab = useCallback(async (labId, result, meta) => {
    const [nextProgress, scored] = await Promise.all([
      recordCompletion(labId, result, meta),
      recordRun(labId, result),
    ]);
    setProgress(nextProgress);
    setGame(scored.game);
    return scored.award;
  }, []);

  const claimQuest = useCallback(async (questId) => {
    const next = await bankQuest(game, questId);
    setGame(next);
    return next;
  }, [game]);

  const resetProgress = useCallback(async () => {
    const [nextProgress, nextGame] = await Promise.all([wipeProgress(), wipeGame()]);
    setProgress(nextProgress);
    setGame(nextGame);
    return nextProgress;
  }, []);

  /** Wipes the identity card too — used by "Start over" in the You tab. */
  const signOut = useCallback(async () => {
    await clearUser();
    const [nextProgress, nextGame] = await Promise.all([wipeProgress(), wipeGame()]);
    setUser(null);
    setProgress(nextProgress);
    setGame(nextGame);
  }, []);

  const value = useMemo(
    () => ({
      ready,
      user,
      progress,
      game,
      level: levelOf(game.xp),
      stats: summarise(progress),
      saveProfile,
      completeLab,
      claimQuest,
      resetProgress,
      signOut,
    }),
    [ready, user, progress, game, saveProfile, completeLab, claimQuest, resetProgress, signOut]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used inside <AppStateProvider>');
  return ctx;
}
