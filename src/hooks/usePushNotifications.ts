import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { arrayUnion, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Registers for push, stores the native device token in users/{uid}.fcmTokens.
 * Cloud Functions expect FCM/APNs tokens via Firebase Admin; configure FCM in Firebase Console per Expo docs.
 */
export function usePushNotifications(uid: string | null | undefined) {
  const registrationRef = useRef<string | null>(null);

  useEffect(() => {
    if (!uid || Platform.OS === 'web') return;

    let cancelled = false;

    (async () => {
      const { status: existing } = await Notifications.getPermissionsAsync();
      let finalStatus = existing;
      if (existing !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted' || cancelled) return;

      try {
        const push = await Notifications.getDevicePushTokenAsync();
        const token = String(push.data);
        if (!token || registrationRef.current === token) return;
        registrationRef.current = token;
        await updateDoc(doc(db, 'users', uid), {
          fcmTokens: arrayUnion(token),
        });
      } catch (e) {
        console.warn('[push] failed to register', e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [uid]);
}
