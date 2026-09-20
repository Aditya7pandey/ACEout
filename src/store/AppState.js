import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { loadUser, saveUser, clearUser } from './user';
import {
  loadProgress,
  recordCompletion,
  resetProgress as wipeProgress,
  EMPTY_PROGRESS,
  summarise,
} from './progress';

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

  useEffect(() => {
    let alive = true;
    Promise.all([loadUser(), loadProgress()]).then(([u, p]) => {
      if (!alive) return;
      setUser(u);
      setProgress(p);
      setReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  const saveProfile = useCallback(async (patch) => {
    const next = await saveUser(patch);
    setUser(next);
    return next;
  }, []);

  const completeLab = useCallback(async (labId, result, meta) => {
    const next = await recordCompletion(labId, result, meta);
    setProgress(next);
    return next;
  }, []);

  const resetProgress = useCallback(async () => {
    const next = await wipeProgress();
    setProgress(next);
    return next;
  }, []);

  /** Wipes the identity card too — used by "Start over" in the You tab. */
  const signOut = useCallback(async () => {
    await clearUser();
    const next = await wipeProgress();
    setUser(null);
    setProgress(next);
  }, []);

  const value = useMemo(
    () => ({
      ready,
      user,
      progress,
      stats: summarise(progress),
      saveProfile,
      completeLab,
      resetProgress,
      signOut,
    }),
    [ready, user, progress, saveProfile, completeLab, resetProgress, signOut]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used inside <AppStateProvider>');
  return ctx;
}
