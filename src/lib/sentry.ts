import Constants from 'expo-constants';

/**
 * Optional Sentry. Set EXPO_PUBLIC_SENTRY_DSN in env; add @sentry/react-native plugin in app.config for native symbolication.
 */
export function initSentry(): void {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (!dsn || typeof dsn !== 'string') return;

  try {
    const Sentry = require('@sentry/react-native') as typeof import('@sentry/react-native');
    Sentry.init({
      dsn,
      tracesSampleRate: 0.1,
      enableAutoSessionTracking: true,
      environment: Constants.expoConfig?.extra?.environment ?? 'development',
    });
  } catch {
    /* optional */
  }
}
