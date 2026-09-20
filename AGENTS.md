# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# Building a lab

Every bench ships these five, wherever the experiment can carry them:

1. **Two modes** — guided (step by step, each action validated) and free play
   (change anything, break it, see what happens).
2. **Real measurement, not readouts** — they work the vernier, read the
   meniscus, time it on a stopwatch. A lab that hands you the answer teaches
   nothing.
3. **A graph plotted from their own data points**, with the line of best fit.
4. **Least count and significant figures enforced** — an answer to eight
   decimal places off a metre scale is flagged, not formatted away.
5. **Error injection as an option** — parallax, zero error, timing lag. This
   is what school practicals actually assess.

The full contract, the shared modules that implement each one, and how to wire
a new lab in: [src/labs/CLAUDE.md](src/labs/CLAUDE.md).
`src/labs/incline/` is the reference implementation.
