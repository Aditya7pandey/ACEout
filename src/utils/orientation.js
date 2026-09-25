import { Platform } from 'react-native';

/**
 * Screen orientation, wrapped so that a missing native module degrades into a
 * no-op rather than a crash.
 *
 * LabVR is portrait, everywhere, including the benches — they used to ask you
 * to turn the phone sideways and no longer do. `lockPortrait` is called once at
 * startup and is the only thing left here; expo-screen-orientation is a native
 * module absent on web and in any client built before it was added, so the call
 * is optional by design.
 */

let SO = null;
try {
  // eslint-disable-next-line global-require
  SO = require('expo-screen-orientation');
} catch (e) {
  SO = null;
}

const supported = !!SO && Platform.OS !== 'web';

/** Hold the screen upright. */
export function lockPortrait() {
  if (!supported) return Promise.resolve(false);
  return SO.lockAsync(SO.OrientationLock.PORTRAIT_UP).then(
    () => true,
    () => false
  );
}
