import React, { useState, useMemo, useRef } from 'react';
import GuidedFlow from './GuidedFlow';
import FreePlay from './FreePlay';
import LabShell from '../LabShell';
import { makeSimRef } from './LaunchScene';
import { DEFAULT_PARAMS, MYSTERY_WORLDS } from './physics';
import { makeErrorProfile, defaultErrorConfig, ERROR_KINDS } from './errors';

/**
 * Container for the horizontal-launch lab: decides which faults the apparatus
 * has today, seals a world for the last step, and randomises the bench so the
 * answers cannot be memorised between runs. The bench is portrait, like the
 * rest of the app, and opens on step one.
 */
export default function GravityLaunchLab({ onComplete }) {
  const [mode, setMode] = useState('guided');
  const [errorConfig, setErrorConfig] = useState(defaultErrorConfig());
  const [seed] = useState(() => Math.random());

  const profile = useMemo(() => makeErrorProfile(seed), [seed]);

  // A fresh bench every session. The deck height and the launcher's spring are
  // both unknown to the student, and both are quantities they will end up
  // measuring rather than being told.
  const [params, setParams] = useState(() => {
    const r = profile.rand;
    const mm = (x) => Math.round(x * 1000) / 1000; // land on a millimetre
    return {
      ...DEFAULT_PARAMS,
      heightM: mm(0.36 + r() * 0.08),
      // The spread is bounded so that even the longest flight — Pluto, with
      // the launcher scattering high — still lands on the metre of tape.
      speedMS: Math.round((0.58 + r() * 0.1) * 1000) / 1000,
      originM: mm(0.04 + r() * 0.05),
      massKg: Math.round((0.15 + r() * 0.15) * 1000) / 1000,
    };
  });

  // The sealed world of the final step, fixed for the session.
  const [mysteryKey] = useState(
    () => MYSTERY_WORLDS[Math.floor(profile.rand() * MYSTERY_WORLDS.length)]
  );

  const simRef = useRef(makeSimRef());

  return (
    <LabShell
      mode={mode}
      onMode={setMode}
      errorKinds={ERROR_KINDS}
      errorConfig={errorConfig}
      onErrorConfig={setErrorConfig}
    >
      {mode === 'guided' ? (
        <GuidedFlow
          params={params}
          setParams={setParams}
          simRef={simRef}
          profile={profile}
          errorConfig={errorConfig}
          mysteryKey={mysteryKey}
          onFinish={onComplete}
        />
      ) : (
        <FreePlay params={params} setParams={setParams} simRef={simRef} />
      )}
    </LabShell>
  );
}
