import React, { useState, useEffect } from 'react';
import GuidedFlow from './GuidedFlow';
import FreePlay from './FreePlay';
import Report from './Report';
import LabShell from '../LabShell';

/**
 * Class 11 Physics · Work, Energy and Power — a block on an inclined plane.
 *
 * ---------------------------------------------------------------------------
 * Where this bench departs from the contract in `src/labs/CLAUDE.md`, and why.
 * The contract asks every bench to say so out loud rather than drop a
 * requirement quietly, so:
 *
 * 1. **No error injection.** The Faults pill is deliberately not passed to
 *    `LabShell`. This bench was rebuilt around two runs and one reading each;
 *    a zero error on a gate clock that the student reads once per run is a
 *    fault they cannot triangulate, because there is no repeat to compare it
 *    against. A bench that asks for a fault to be *noticed* needs more than two
 *    numbers to notice it in.
 *
 * 2. **No graph.** Two timings cannot carry a line of best fit. What the
 *    closing report does instead is derive an acceleration and a coefficient of
 *    friction from each of the student's own timings, which is the same
 *    discipline applied to the data this version of the experiment produces.
 *
 * Least count is enforced: the gate clock resolves 0.01 s, the time is banked
 * to two decimal places, and every derived figure on the report is held to the
 * significant figures that timing justifies.
 * ---------------------------------------------------------------------------
 */
export default function InclineLab({ onComplete, onChrome }) {
  const [mode, setMode] = useState('guided');
  const [rows, setRows] = useState(null);

  // The closing report is a document rather than a simulation, so it keeps the
  // title bar. The bench itself wants the height.
  useEffect(() => {
    onChrome?.(Boolean(rows));
    return () => onChrome?.(true);
  }, [rows, onChrome]);

  if (rows) return <Report rows={rows} onComplete={onComplete} />;

  return (
    <LabShell mode={mode} onMode={setMode} leftInset>
      {mode === 'guided' ? <GuidedFlow onFinish={setRows} /> : <FreePlay />}
    </LabShell>
  );
}
