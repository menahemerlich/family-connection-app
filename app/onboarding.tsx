import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '@/components/Screen';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { useAuthStore } from '@/stores/authStore';
import { acceptInvite, createFamily } from '@/features/family/familyService';

type Mode = 'choice' | 'create' | 'join';

export default function Onboarding() {
  const { t } = useTranslation();
  const router = useRouter();
  const uid = useAuthStore((s) => s.firebaseUser?.uid);
  const [mode, setMode] = useState<Mode>('choice');
  const [familyName, setFamilyName] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);

  const onCreate = async () => {
    if (!uid || !familyName.trim()) return;
    setLoading(true);
    try {
      await createFamily({ name: familyName.trim(), ownerUid: uid });
      router.replace('/(app)/home');
    } catch (err: unknown) {
      Alert.alert(t('common.error'), err instanceof Error ? err.message : 'שגיאה');
    } finally {
      setLoading(false);
    }
  };

  const onJoin = async () => {
    if (!token.trim()) return;
    setLoading(true);
    try {
      await acceptInvite(token.trim());
      router.replace('/(app)/home');
    } catch (err: unknown) {
      Alert.alert(t('common.error'), t('invite.invalidToken'));
      console.warn(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scrollable>
      <View className="flex-1 justify-center gap-6 max-w-md w-full self-center">
        <Text className="text-3xl font-bold text-center text-brand-600">{t('onboarding.welcome')}</Text>
        <Text className="text-center text-gray-500">{t('onboarding.subtitle')}</Text>

        {mode === 'choice' && (
          <View className="gap-3 mt-4">
            <Button title={t('onboarding.createFamily')} onPress={() => setMode('create')} fullWidth />
            <Button
              title={t('onboarding.joinFamily')}
              variant="secondary"
              onPress={() => setMode('join')}
              fullWidth
            />
          </View>
        )}

        {mode === 'create' && (
          <View className="gap-3 mt-4">
            <Input
              label={t('onboarding.familyName')}
              placeholder={t('onboarding.familyNamePlaceholder')}
              value={familyName}
              onChangeText={setFamilyName}
            />
            <Button title={t('onboarding.createButton')} onPress={onCreate} loading={loading} fullWidth />
            <Button title={t('common.back')} variant="ghost" onPress={() => setMode('choice')} />
          </View>
        )}

        {mode === 'join' && (
          <View className="gap-3 mt-4">
            <Input label={t('onboarding.inviteToken')} value={token} onChangeText={setToken} />
            <Button title={t('onboarding.joinButton')} onPress={onJoin} loading={loading} fullWidth />
            <Button title={t('common.back')} variant="ghost" onPress={() => setMode('choice')} />
          </View>
        )}
      </View>
    </Screen>
  );
}
