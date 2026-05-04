import type { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'קשר משפחתי',
  slug: 'family-connection',
  scheme: 'familyconnect',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#1f63f0',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.familyconnect.app',
    infoPlist: {
      NSCameraUsageDescription: 'נדרש כדי לצלם תמונות וסרטונים ולקיים שיחות וידאו',
      NSMicrophoneUsageDescription: 'נדרש להקלטת הודעות קוליות ולשיחות וידאו',
      NSPhotoLibraryUsageDescription: 'נדרש כדי לבחור תמונות וסרטונים מהאלבום',
      NSLocationWhenInUseUsageDescription: 'נדרש כדי לשתף את המיקום שלך עם המשפחה (אופציונלי)',
      UIBackgroundModes: ['voip', 'audio'],
    },
  },
  android: {
    package: 'com.familyconnect.app',
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#1f63f0',
    },
    permissions: [
      'CAMERA',
      'RECORD_AUDIO',
      'READ_EXTERNAL_STORAGE',
      'WRITE_EXTERNAL_STORAGE',
      'ACCESS_FINE_LOCATION',
      'ACCESS_COARSE_LOCATION',
      'INTERNET',
      'WAKE_LOCK',
      'VIBRATE',
    ],
  },
  web: {
    bundler: 'metro',
    output: 'single',
    favicon: './assets/favicon.png',
    name: 'קשר משפחתי',
    shortName: 'קשר משפחתי',
    lang: 'he',
    dir: 'rtl',
  },
  plugins: [
    'expo-router',
    'expo-localization',
    'expo-secure-store',
    [
      'expo-notifications',
      {
        icon: './assets/notification-icon.png',
        color: '#1f63f0',
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission: 'נדרש כדי לבחור תמונות לצ\'אט ולאלבום המשפחתי',
        cameraPermission: 'נדרש כדי לצלם תמונות וסרטונים',
      },
    ],
    [
      'expo-av',
      {
        microphonePermission: 'נדרש להקלטת הודעות קוליות',
      },
    ],
    [
      'expo-location',
      {
        locationAlwaysAndWhenInUsePermission: 'נדרש כדי לשתף את המיקום עם המשפחה',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    eas: {
      projectId: process.env.EAS_PROJECT_ID ?? '',
    },
    firebase: {
      apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
      measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
    },
    livekit: {
      url: process.env.EXPO_PUBLIC_LIVEKIT_URL,
    },
  },
});
