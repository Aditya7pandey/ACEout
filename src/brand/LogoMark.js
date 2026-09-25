import React, { useMemo } from 'react';
import Svg, { Path } from 'react-native-svg';
import { bladePaths, VIEW, BRAND } from './logoGeometry';

/**
 * The LabVR vortex, in the app.
 *
 * Shares `logoGeometry.js` with `scripts/make-brand-assets.js`, so the mark on
 * the splash screen and the mark on the launcher icon are the same drawing and
 * cannot drift apart.
 *
 * The path data depends only on the geometry, never on the size, so it is
 * memoised once per module rather than per instance — the viewBox does the
 * scaling.
 */
const PATHS = bladePaths();

export default function LogoMark({ size = 120, color = BRAND, style }) {
  const paths = useMemo(
    () => PATHS.map((d, i) => <Path key={i} d={d} fill={color} />),
    [color]
  );

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${VIEW} ${VIEW}`} style={style}>
      {paths}
    </Svg>
  );
}
