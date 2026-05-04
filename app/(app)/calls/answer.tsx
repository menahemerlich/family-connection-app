import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { Screen } from '@/components/Screen';
import { db } from '@/lib/firebase';
import { useAuthStore } from '@/stores/authStore';
import { updateCallStatus } from '@/features/calls/callService';
import { fetchLiveKitToken } from '@/lib/livekit';
import { CallRoomView } from '@/features/calls/CallRoomView';
import type { CallDoc } from '@/types/models';

/**
 * Joins an existing call (incoming). Query param: callId
 */
export default function AnswerCallScreen() {
  const router = useRouter();
  const { callId } = useLocalSearchParams<{ callId: string }>();
  const me = useAuthStore((s) => s.profile);
  const familyId = me?.familyId ?? undefined;

  const [token, setToken] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onLeave = useCallback(async () => {
    if (familyId && callId) {
      try {
        await updateCallStatus(familyId, callId, 'ended');
      } catch {
        /* ignore */
      }
    }
    router.back();
  }, [callId, familyId, router]);

  useEffect(() => {
    if (!familyId || !me || !callId) return;
    let cancelled = false;

    (async () => {
      try {
        const snap = await getDoc(doc(db, 'families', familyId, 'calls', callId));
        if (!snap.exists()) {
          setError('השיחה לא נמצאה');
          return;
        }
        const data = snap.data() as CallDoc;
        if (!data.participants?.includes(me.uid)) {
          setError('אין הרשאה לשיחה זו');
          return;
        }
        await updateCallStatus(familyId, callId, 'active');
        const tok = await fetchLiveKitToken({
          familyId,
          callId,
          identity: me.uid,
          name: me.displayName,
        });
        if (cancelled) return;
        setToken(tok.token);
        setUrl(tok.url);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'שגיאה');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [callId, familyId, me]);

  if (error) {
    return (
      <Screen>
        <View className="flex-1 justify-center items-center p-6">
          <Text className="text-center text-red-600">{error}</Text>
        </View>
      </Screen>
    );
  }

  if (!token || !url) {
    return (
      <Screen>
        <View className="flex-1 justify-center items-center gap-3">
          <ActivityIndicator size="large" color="#1f63f0" />
          <Text className="text-gray-600">מצטרף לשיחה...</Text>
        </View>
      </Screen>
    );
  }

  return <CallRoomView serverUrl={url} token={token} onLeave={onLeave} />;
}
