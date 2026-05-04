import '../global.css';
import '@/lib/firebaseWebRedirect';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import '@/lib/i18n';
import { ensureRTL } from '@/lib/rtl';
import { initSentry } from '@/lib/sentry';
import { useAuthListener } from '@/features/auth/useAuthListener';
import { useFamilyListener } from '@/features/family/useFamilyListener';
import { useIncomingCallListener } from '@/features/calls/useIncomingCallListener';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAuthStore } from '@/stores/authStore';
import { IncomingCallModal } from '@/components/IncomingCallModal';
import { clearPendingJoinToken, consumePendingJoinToken, peekPendingJoinToken } from '@/lib/pendingJoinTokenWeb';

import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

function NavigationGate() {
  const router = useRouter();
  const segments = useSegments();
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const familyId = useAuthStore((s) => s.profile?.familyId);

  useEffect(() => {
    if (!isInitialized) return;
    const inAuthGroup = segments[0] === '(auth)';
    const inAppGroup = segments[0] === '(app)';
    const inOnboarding = segments[0] === 'onboarding';
    const inJoin = segments[0] === 'join';

    // אחרי Google redirect חוזרים ללא נתיב /join; נשלים ניווט רק אם אין עדיין משפחה (אחרת מנקים שאריות)
    if (Platform.OS === 'web' && firebaseUser && !inJoin) {
      const pending = peekPendingJoinToken();
      if (pending) {
        if (familyId) {
          clearPendingJoinToken();
        } else {
          consumePendingJoinToken();
          router.replace(`/join/${pending}`);
          return;
        }
      }
    }

    if (!firebaseUser && !inAuthGroup && !inJoin) {
      router.replace('/(auth)/sign-in');
    } else if (firebaseUser && !familyId && !inOnboarding && !inJoin) {
      router.replace('/onboarding');
    } else if (firebaseUser && familyId && (inAuthGroup || inOnboarding)) {
      router.replace('/(app)/home');
    } else if (
      firebaseUser &&
      familyId &&
      !inAppGroup &&
      (segments as string[]).length === 0
    ) {
      router.replace('/(app)/home');
    }
  }, [isInitialized, firebaseUser, familyId, segments, router]);

  return null;
}

function AppShell() {
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const uid = firebaseUser?.uid;
  const familyId = useAuthStore((s) => s.profile?.familyId);
  const isInitialized = useAuthStore((s) => s.isInitialized);

  useAuthListener();
  useFamilyListener();
  usePushNotifications(uid);
  useIncomingCallListener(familyId, uid);

  useEffect(() => {
    if (isInitialized) {
      void SplashScreen.hideAsync();
    }
  }, [isInitialized]);

  useEffect(() => {
    initSentry();
  }, []);

  useEffect(() => {
    void ensureRTL();
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    try {
      const lk = require('@livekit/react-native') as { registerGlobals?: () => void };
      lk.registerGlobals?.();
    } catch {
      /* LiveKit optional until native deps are linked */
    }
  }, []);

  const scheme = useColorScheme();

  return (
    <>
      <NavigationGate />
      <IncomingCallModal />
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="join/[token]" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AppShell />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
