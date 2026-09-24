# ACEout — 3D Virtual Labs

Offline NCERT virtual laboratories for Classes 8–12. React Native (Expo SDK 57),
three.js via `@react-three/fiber` for the benches, `react-native-svg` for the
instruments and graphs. No network calls anywhere — fonts, physics and progress
are all on the device.

One lab is built end to end:
**Class 11 · Physics · Ch. V Work, Energy and Power — Box on an inclined plane.**

## Running it

```bash
cd app && npx expo start
```

Scan the QR with Expo Go, or `npx expo run:android` for a standalone build
(needs the Android SDK).

## Layout

| Path | What it is |
| --- | --- |
| `src/theme.js` | Design tokens taken from the ACEout prototype |
| `src/components/` | Shared UI — buttons, rules, panels, slider, tab bar |
| `src/data/catalog.js` | Class → subject → NCERT chapter → lab tree |
| `src/screens/` | Splash, Classes, Subjects, Chapters, Labs, Lab, Search, Profile |
| `src/instruments/` | Stopwatch, metre scale, electronic balance |
| `src/measure/` | Least-count/sig-fig engine, reading input, data table, graph |
| `src/labs/incline/` | The work–energy lab: physics, 3D scene, guided flow, free play |
| `src/store/progress.js` | AsyncStorage-backed completions |

## The lab’s design rules

**Nothing is handed over.** The simulation never prints the quantity being
measured. Distances come off a metre scale the student scrolls and reads;
times come off a stopwatch the student starts and stops against a block that
is genuinely moving; the mass comes off a balance whose pan can be emptied.

**Guided mode validates the action, not the answer.** If a worn scale is
lying, a correctly-read wrong number is accepted and carried into the table,
where it shows up later as a discrepancy the student has to account for. That
is how a practical works. Free play validates nothing at all.

**Least count is enforced** (`src/measure/leastCount.js`). A metre scale reads
to 0.1 cm, a stopwatch to 0.01 s, a balance to 1 g. Quote a length to three
decimals and it is rejected with the reason. Readings that miss a graduation
are rejected. Under-quoting raises a warning instead. Derived answers are
capped at the significant figures the weakest reading justifies, counted from
the instrument's least count rather than from ambiguous trailing zeros.

**Error injection** (`src/labs/incline/errors.js`), each optional:

- *Zero error* — the metre scale's zero is worn and the balance does not rest
  at zero. It spoils the rise and the run, which are read from one end. It
  cancels in the track lengths, which are read at both ends and subtracted.
- *Parallax* — the scale stands proud of the surface, so an off-axis eye
  displaces the mark. A sight pin lets the student find the square-on position.
- *Stopwatch lag* — the watch does not return to zero and its start button
  sticks. Both bias every reading the same way, so averaging cannot remove them.

Magnitudes are drawn from a per-session seeded profile, so a faulty instrument
gives the *same* wrong answer each time it is read.

**Graphs from the student's own points.** Five track lengths, two timings each,
plotted as v² against s with an ordinary least-squares fit. The fit defaults to
passing through the origin because a block released from rest has no speed at
zero distance; toggling to the free fit and looking at the intercept is itself
a diagnostic.

**The procedure** (`src/labs/incline/steps.js`): weigh the block → measure the
rise and run and get θ by trigonometry → five
timed runs → plot → read a off the gradient and back out μ → audit
W_gravity + W_friction against ΔK → report.

The closing report puts the student's θ, mass, acceleration and μ against the
bench's true values, then names each active fault with its actual injected
magnitude and traces how it moved the result.

## Physics

`src/labs/incline/physics.js`. SI throughout, x positive down-slope.

- Static check: the block breaks away only when `tan θ > μs`.
- `a = g(sin θ − μk cos θ)`, integrated at a fixed 1/240 s sub-step inside the
  render loop so the motion is real-time and hand-timeable.
- Energy book: lost P.E. = K.E. + heat, with heat accumulated as
  `∫ μk mg cos θ |dx|`.
- Free play exposes θ, mass, surface (wood/glass/felt/ice/ideal), gravity
  (Earth/Moon/Mars) and track length.

## Gotchas worth knowing

`metro.config.js` forces `three` to its ESM build. three's exports map is
`{ import: three.module.js, require: three.cjs }`, and `three.cjs` opens with a
Node-only `process.emitWarning(...)` deprecation notice. React Native's
`process` shim has no `emitWarning`, so on native the CJS branch throws
`TypeError: undefined is not a function` during module evaluation and the app
dies with "runtime not ready" before any of this code runs. Web resolves the
`import` branch and never sees it. Do not remove that resolver override.

`src/three/fiber.{native,web}.js` exists for the same class of reason:
`@react-three/fiber/native` renders into an `expo-gl` GLView and cannot load in
a browser, so the entry point is chosen per platform.

For sideloading an Android build, use a profile with `android.buildType: apk`
(`preview` or `production-apk`). The `production` profile emits an `.aab`,
which the Play Store wants and a phone cannot install.

## Tests

The physics and measurement engines are pure ES modules with no React or
native imports, and were verified against closed-form solutions: integrator
vs `idealRun`, energy conservation, mass independence, static-friction lock-up,
and a round trip that recovers θ, a and μ from synthesised perfect readings.

## Not yet built

Every other chapter lists its labs but only this bench is playable. The lab
registry in `src/screens/LabScreen.js` is the extension point — add an entry
keyed by lab id.
