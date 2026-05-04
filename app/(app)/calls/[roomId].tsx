import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { useAuthStore } from '@/stores/authStore';
import { useFamilyStore } from '@/stores/familyStore';
import { createCallRecord, updateCallStatus } from '@/features/calls/callService';
import { fetchLiveKitToken } from '@/lib/livekit';
import { CallRoomView } from '@/features/calls/CallRoomView';

/**
 * Starts a new outgoing call. roomId: "group" or "private-<uid>"
 */
export default function OutgoingCallScreen() {
  const router = useRouter();
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const me = useAuthStore((s) => s.profile);
  const familyId = me?.familyId ?? undefined;
  const members = useFamilyStore((s) => s.members);

  const [callId, setCallId] = useState<string | null>(null);
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
    if (!familyId || !me || !roomId) return;

    let cancelled = false;

    (async () => {
      try {
        let type: 'group' | 'private' = 'group';
        let participants = members.map((m) => m.uid);

        if (roomId !== 'group') {
          type = 'private';
          const other = roomId.startsWith('private-') ? roomId.slice('private-'.length) : roomId;
          participants = [me.uid, other].filter(Boolean);
        } else {
          if (!participants.includes(me.uid)) participants = [...participants, me.uid];
        }

        const id = await createCallRecord({
          familyId,
          initiator: me.uid,
          participants,
          type,
        });
        if (cancelled) return;
        setCallId(id);
        await updateCallStatus(familyId, id, 'active');

        const tok = await fetchLiveKitToken({
          familyId,
          callId: id,
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
  }, [familyId, me, members, roomId]);

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
          <Text className="text-gray-600">מתחבר לשיחה...</Text>
        </View>
      </Screen>
    );
  }

  return <CallRoomView serverUrl={url} token={token} onLeave={onLeave} />;
}
