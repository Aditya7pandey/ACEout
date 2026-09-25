# The lab contract

Read this before building a new lab. Every bench in LabVR ships the five
things below, wherever the experiment can carry them. A lab that hands the
student a number teaches nothing — the point is that every value in the final
report traces back to a graduation they read themselves.

`ray_optics_eye/` is the reference implementation — it is the bench that is
translated, and the one whose shape (`steps.js` as data, a station walk with
named beats, a short closing report) the others are being moved onto.
`incline/` follows the same shape in English and is the simpler read; both
carry a comment block naming the parts of this contract they cannot honour.

---

## 1. Two modes

Guided and free play, switched from the strip above the bench. There is no
setup page: a lab opens on step one, and `LabShell` carries the mode toggle
and the fault switches so no bench has to build them again.

- **Guided** — a fixed procedure, one step at a time, each step validated
  before the next unlocks. Validate the *action* (did they read the instrument
  correctly?), never the truth. If a worn scale is lying to them, a correctly
  read wrong number is accepted, carried into the table, and shows up later as
  a discrepancy they have to explain. That is how a real practical works.
- **Free play** — every parameter exposed, no validation, no scoring. Let them
  set the angle past the point where the block never moves, take the mass to
  zero, and watch what happens.

Pattern: `InclineLab.js` holds `mode` and `errorConfig`, randomises the bench
from a per-session seed so answers cannot be memorised between runs, and hands
both to `<LabShell>`, which renders `GuidedFlow` or `FreePlay` beneath its
strip. Steps live in their own `steps.js` as data, not as JSX.

Benches are portrait. The app is locked upright and no lab asks for the phone
to be turned; if a stage needs more room, spend height rather than asking for
width.

**A translated bench** keeps its copy in `src/i18n/strings.js`, not in
`steps.js` — `ray_optics_eye` is the worked example. Its `steps.js` holds only
what a station *is*, every string is keyed `eye.<station>.<beat>`, and the pure
modules (`optics.js`, `RetinalView.js`) return catalogue *keys* rather than
sentences so they stay language-free. Swap `import { Text } from '../../i18n'`
for react-native's and the file picks up a Devanagari face for any string that
needs one. Anything written into the student's saved record — `readingLabel`,
for instance — stays English, so a record is comparable whatever language the
bench was run in.

## 2. Real measurement, not readouts

The student operates the instrument and reads the scale. Never print the
answer next to it.

Available in `src/instruments/`:

| Component | What the student does |
| --- | --- |
| `MetreScale` | Reads a graduated scale against a mark, eye position included |
| `Stopwatch` | Starts and stops it by hand; reaction time is theirs to own |
| `Balance` | Reads a display that may not rest at zero |

Build the instrument a new lab needs (vernier callipers, burette meniscus,
ammeter, travelling microscope) in the same folder and to the same rule: it
shows a scale, it does not announce a value. Readings enter the app through
`ReadingInput` and nothing else.

## 3. Graph from their own points

Plot what they recorded, not what the simulation knows.

```js
import GraphPlot from '../../measure/GraphPlot';

<GraphPlot
  points={rows.map((r) => ({ x: r.s, y: r.tSquared }))}
  xLabel="s" yLabel="t²" xUnit=" m" yUnit=" s²"
  slopeLabel="gradient"
  allowOriginToggle              // let them argue about the intercept
/>
```

`GraphPlot` draws the least-squares line of best fit and reports its gradient;
`leastSquares` / `leastSquaresThroughOrigin` in `incline/physics.js` are the
fits themselves if a lab needs the numbers directly. The derived quantity comes
off the student's gradient — not from the true parameters.

## 4. Least count and significant figures, enforced

An answer quoted to eight decimal places from a metre scale is wrong and must
be flagged. This is not advisory formatting; it is a validation failure.

```js
import {
  INSTRUMENTS, validateReading, sigFigsForReading,
  combineSigFigs, formatSigFigs, checkDerived,
} from '../../measure/leastCount';
```

- `INSTRUMENTS` — least count, unit and range per instrument
  (metre scale 0.1 cm, vernier 0.01 cm, stopwatch 0.01 s, balance 1 g,
  protractor 0.5°). Add new instruments here.
- `validateReading(raw, instrument)` — rejects more decimals than the least
  count justifies, and values outside the instrument's range. `ReadingInput`
  calls this on every entry, so use `ReadingInput` and you get it for free.
- `combineSigFigs(...)` — a derived answer is held to the weakest measurement
  that fed it.
- `checkDerived(raw, { expected, sf, unit, tolerance })` — checks a computed
  answer against the student's own table, to the right number of figures.

## 5. Error injection, optional and per-run

Offered as toggles behind the Faults pill in `LabShell`, off by default. These are what school
practicals actually assess.

`incline/errors.js` is the model: `ERROR_KINDS` describes each fault in the
student's language, `makeErrorProfile(seed)` fixes the magnitudes for the
session so a re-read of the same scale gives the same wrong answer — the way a
real faulty instrument behaves — and the `apparent*` helpers bend what the
student *sees*.

- **Zero error** — worn scale end, balance off zero. A constant offset no
  amount of repeating will average away.
- **Parallax** — the scale sits above the object; read from the side and the
  mark shifts with eye position.
- **Timing lag** — a sticky start and a watch that will not return to zero,
  biasing every time in the same direction.

The rule: the fault is applied to what is *displayed*, never announced in a
readout. The student has to notice it and, in guided mode, correct for it.

A bench that takes **one reading per station** should pass no `errorKinds` at
all, and say so in its container. A fault the student has no repeat to compare
against is not a fault they can catch — it is just a wrong answer. `incline/`
and `ray_optics_eye/` both opt out on exactly these grounds. Note that
`incline/errors.js` stays regardless of whether that bench uses it:
`MetreScale` and `Balance` import their `apparent*` helpers from it.

---

## Wiring a new lab in

1. Build it under `src/labs/<slug>/` following the incline layout:
   `<Name>Lab.js` (container: mode, errorConfig, seed, and a `<LabShell>`),
   `GuidedFlow.js`, `FreePlay.js`, `steps.js`, `physics.js`, `errors.js`,
   `<Name>Scene.js`.
2. Call `onComplete({ data, analysis, sf })` when the report is finished —
   that is what gets persisted to the student's record.
3. Register the component in `REGISTRY` in `src/screens/LabScreen.js`.
4. Add the lab to `LABS` and `SEARCH_INDEX` in `src/data/catalog.js`, with
   `built: true` so it becomes tappable.

If an experiment genuinely cannot carry one of the five — a lab with nothing
to plot, say — say so in the lab's own comments rather than dropping it
quietly.
