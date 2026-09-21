import { Platform } from 'react-native';

/**
 * Screen orientation, wrapped so that a missing native module degrades into
 * "ask the student to turn the phone themselves" rather than a crash.
 *
 * expo-screen-orientation is a native module: it is absent on web, and absent
 * in any client that was built before it was added to the project. Every call
 * here is therefore optional, and `supported` tells the UI which of the two
 * routes it can offer.
 *
 * The app as a whole is portrait. app.json declares `default` so the OS will
 * allow a rotation at all, and App.js locks portrait at startup — the wide
 * benches are the only screens that ever unlock it, and they put it back when
 * they leave.
 */

let SO = null;
try {
  // eslint-disable-next-line global-require
  SO = require('expo-screen-orientation');
} catch (e) {
  SO = null;
}

export const supported = !!SO && Platform.OS !== 'web';

async function safely(fn) {
  if (!supported) return false;
  try {
    await fn();
    return true;
  } catch (e) {
    return false;
  }
}

/** Turn the screen to landscape and hold it there. */
export function lockLandscape() {
  return safely(() => SO.lockAsync(SO.OrientationLock.LANDSCAPE));
}

/** Back to the app's normal upright self. */
export function lockPortrait() {
  return safely(() => SO.lockAsync(SO.OrientationLock.PORTRAIT_UP));
}

/** Let the device decide — used while the student turns the phone by hand. */
export function unlock() {
  return safely(() => SO.unlockAsync());
}

/**
 * Subscribe to rotations. Returns an unsubscribe function, always safe to
 * call. The callback receives true when the screen is landscape.
 */
export function onOrientationChange(cb) {
  if (!supported) return () => {};
  try {
    const sub = SO.addOrientationChangeListener((event) => {
      const o = event?.orientationInfo?.orientation;
      cb(
        o === SO.Orientation.LANDSCAPE_LEFT || o === SO.Orientation.LANDSCAPE_RIGHT
      );
    });
    return () => {
      try {
        sub?.remove?.();
      } catch (e) {
        /* the subscription is already gone */
      }
    };
  } catch (e) {
    return () => {};
  }
}
