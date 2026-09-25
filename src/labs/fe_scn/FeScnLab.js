import React, { useState, useMemo } from 'react';
import GuidedFlow from './GuidedFlow';
import FreePlay from './FreePlay';
import LabShell from '../LabShell';
import { makeErrorProfile, defaultErrorConfig, ERROR_KINDS } from './errors';

/** Class 11 Chemistry · Fe³⁺ + SCN⁻ equilibrium. Opens straight on the bench. */
export default function FeScnLab({ onComplete }) {
  const [mode, setMode] = useState('guided');
  const [errorConfig, setErrorConfig] = useState(defaultErrorConfig());
  const [seed] = useState(() => Math.random());

  const profile = useMemo(() => makeErrorProfile(seed), [seed]);

  return (
    <LabShell
      mode={mode}
      onMode={setMode}
      errorKinds={ERROR_KINDS}
      errorConfig={errorConfig}
      onErrorConfig={setErrorConfig}
    >
      {mode === 'guided' ? (
        <GuidedFlow profile={profile} errorConfig={errorConfig} onFinish={onComplete} />
      ) : (
        <FreePlay />
      )}
    </LabShell>
  );
}
