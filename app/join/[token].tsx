import { useEffect, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '@/components/Screen';
import { Button } from '@/components/Button';
import { acceptInvite } from '@/features/family/familyService';
import { useAuthStore } from '@/stores/authStore';

export default function JoinByToken() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const [loading, setLoading] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    if (!firebaseUser && token) {
      router.replace({ pathname: '/(auth)/sign-in', params: { joinToken: String(token) } });
    }
  }, [firebaseUser, token, router]);

  if (!firebaseUser) {
    return (
      <Screen scrollable>
        <View className="flex-1 justify-center p-6">
          <Text className="text-center text-gray-600">מעביר להתחברות...</Text>
        </View>
      </Screen>
    );
  }

  const onAccept = async () => {
    if (!token) return;
    setLoading(true);
    try {
      await acceptInvite(token);
      setAccepted(true);
      setTimeout(() => router.replace('/(app)/home'), 800);
    } catch (err: unknown) {
      Alert.alert(t('common.error'), err instanceof Error ? err.message : t('invite.invalidToken'));
      console.warn(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scrollable>
      <View className="flex-1 justify-center gap-4 max-w-md w-full self-center">
        <Text className="text-2xl font-bold text-center text-brand-600">{t('invite.joinTitle')}</Text>
        <Text className="text-center text-gray-500">{t('invite.joinSubtitle')}</Text>
        <Text className="text-center text-xs text-gray-400 mt-2">קוד: {token}</Text>
        {!accepted && (
          <Button title={t('invite.joinAccept')} onPress={onAccept} loading={loading} fullWidth />
        )}
        {accepted && (
          <Text className="text-center text-green-600 font-semibold">✓ הצטרפת בהצלחה!</Text>
        )}
      </View>
    </Screen>
  );
}
