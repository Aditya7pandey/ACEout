import React, { useState, useEffect } from 'react';
import GuidedFlow from './GuidedFlow';
import FreePlay from './FreePlay';
import TheoryReport from './TheoryReport';
import LabShell from '../LabShell';
import { useLanguage } from '../../i18n';

/**
 * Class 12 Physics · Ray Optics and Optical Instruments — the human eye.
 *
 * ---------------------------------------------------------------------------
 * Where this bench departs from the contract in `src/labs/CLAUDE.md`, and why.
 * The contract asks every bench to say so out loud rather than drop a
 * requirement quietly, so:
 *
 * 1. **No error injection.** The instrument here is the student's own judgement
 *    of when a point stops being a point, and that judgement is already the
 *    dominant source of error — the accepting band is ±1.5 cm wide precisely
 *    because finding a blur boundary is a soft call. Adding a zero error on top
 *    would be injecting a second fault into a measurement that is already
 *    mostly about the first. So the bench shows no Faults control.
 *
 * 2. **No graph.** Three readings cannot carry a line of best fit. What the
 *    closing page does instead is derive both spectacle powers from the
 *    student's own numbers, which is the same discipline applied to the data
 *    this experiment actually produces.
 *
 * Least count is enforced: the bench resolves 0.1 cm, the slider steps in
 * 0.1 cm, and every derived power on the report is held to the significant
 * figures those readings justify.
 * ---------------------------------------------------------------------------
 */
export default function RayOpticsEyeLab({ onComplete, onChrome }) {
  const [mode, setMode] = useState('guided');
  const [rows, setRows] = useState(null);
  const { t } = useLanguage();

  // The closing report is a document rather than a simulation, so it keeps the
  // title bar. The bench itself wants the height.
  useEffect(() => {
    onChrome?.(Boolean(rows));
    return () => onChrome?.(true);
  }, [rows, onChrome]);

  if (rows) return <TheoryReport rows={rows} onComplete={onComplete} />;

  return (
    <LabShell
      mode={mode}
      onMode={setMode}
      leftInset
      labels={{ guided: t('lab.mode.guided'), free: t('lab.mode.free') }}
    >
      {mode === 'guided' ? <GuidedFlow onFinish={setRows} /> : <FreePlay />}
    </LabShell>
  );
}
