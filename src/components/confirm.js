import { Alert, Platform } from 'react-native';

/**
 * react-native-web ships `Alert.alert` as a no-op, which would make the
 * destructive rows in the You tab silently do nothing in the browser build.
 * Fall back to the native dialog there.
 */
export function confirm({ title, message, confirmLabel = 'OK', cancelLabel = 'Cancel', onConfirm }) {
  if (Platform.OS === 'web') {
    const ok =
      typeof window !== 'undefined' && window.confirm
        ? window.confirm(`${title}\n\n${message}`)
        : true;
    if (ok) onConfirm?.();
    return;
  }
  Alert.alert(title, message, [
    { text: cancelLabel, style: 'cancel' },
    { text: confirmLabel, style: 'destructive', onPress: () => onConfirm?.() },
  ]);
}
