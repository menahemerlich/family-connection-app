import { I18nManager, Platform } from 'react-native';

/**
 * Force RTL on first load. Returns true if a reload is required (caller should reload the app
 * - on bare/dev builds, the user may need to close and reopen the app once for RTL to take effect).
 */
export async function ensureRTL(): Promise<boolean> {
  if (Platform.OS === 'web') {
    if (typeof document !== 'undefined') {
      document.documentElement.dir = 'rtl';
      document.documentElement.lang = 'he';
    }
    return false;
  }

  if (!I18nManager.isRTL) {
    try {
      I18nManager.allowRTL(true);
      I18nManager.forceRTL(true);
    } catch {
      // ignore
    }
    try {
      const Updates = require('expo-updates') as { reloadAsync?: () => Promise<void> };
      await Updates.reloadAsync?.();
    } catch {
      // expo-updates not present in Expo Go / dev; user must reload manually
    }
    return true;
  }
  return false;
}
