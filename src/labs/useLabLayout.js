import { useWindowDimensions } from 'react-native';

/**
 * How a lab bench lays itself out at the moment.
 *
 * Two things are worth knowing before changing the numbers here.
 *
 * The 3D stages use a *vertical* field of view, so how large the apparatus
 * renders depends only on the stage's height — never its width. Widening the
 * frame buys room around the apparatus (and gets the floating HUD chrome off
 * it), it does not make the glassware bigger.
 *
 * And a portrait phone has ~844dp of height to spend on a stage that was
 * historically fixed at 245. Most of the cramping on these benches came from
 * that crop rather than from the screen being upright, which is why the
 * portrait height is a parameter and not a constant.
 *
 * @param portraitStage  stage height when held upright
 * @param fraction       share of the screen's height the stage may take when
 *                       held wide (there is much less of it to go round)
 * @param maxStage       ceiling, so a tablet does not hand the stage the
 *                       entire page
 */
export function useLabLayout({
  portraitStage = 270,
  fraction = 0.6,
  maxStage = 300,
} = {}) {
  const { width, height } = useWindowDimensions();
  const landscape = width > height;

  return {
    landscape,
    width,
    stageHeight: landscape
      ? Math.min(maxStage, Math.max(170, Math.round(height * fraction)))
      : portraitStage,
    // A measure, not a container: the column stays readable on a tablet or a
    // phone on its side, while the page itself still fills the screen.
    contentStyle: landscape ? { maxWidth: 780, alignSelf: 'center', width: '100%' } : null,
  };
}

export default useLabLayout;
