import { useWindowDimensions } from 'react-native';

/**
 * How the bench lays itself out at the moment.
 *
 * Held wide, the 3D stage takes most of the screen's height and the reading
 * column is capped so the prose does not run to a hundred characters a line.
 * Held upright, nothing changes from how the other labs behave.
 */
export function useLabLayout(portraitStage = 270) {
  const { width, height } = useWindowDimensions();
  const landscape = width > height;

  return {
    landscape,
    stageHeight: landscape
      ? Math.min(300, Math.max(170, Math.round(height * 0.6)))
      : portraitStage,
    // A measure, not a container: the column stays readable on a tablet or a
    // phone on its side, while the page itself still fills the screen.
    contentStyle: landscape ? { maxWidth: 780, alignSelf: 'center', width: '100%' } : null,
  };
}
