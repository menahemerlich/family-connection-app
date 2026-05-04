import { useMemo, useState } from 'react';
import { Alert, Platform, Text, View } from 'react-native';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '@/components/Screen';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { AuthFeedbackBanner } from '@/components/AuthFeedbackBanner';
import { signUpWithEmail, signInWithGoogle } from '@/features/auth/authService';
import { describeAuthError } from '@/lib/authMessages';
import { getMissingFirebaseEnvFields } from '@/lib/firebaseEnvCheck';
import { clearPendingJoinToken } from '@/lib/pendingJoinTokenWeb';
import { useAuthStore } from '@/stores/authStore';

export default function SignUp() {
  const { t } = useTranslation();
  const router = useRouter();
  const { joinToken } = useLocalSearchParams<{ joinToken?: string }>();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const missingEnv = useMemo(() => getMissingFirebaseEnvFields(), []);
  const lastAuthError = useAuthStore((s) => s.lastAuthError);
  const lastAuthHint = useAuthStore((s) => s.lastAuthHint);
  const clearLastAuthError = useAuthStore((s) => s.clearLastAuthError);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = t('auth.errors.nameRequired');
    const mail = email.trim();
    if (!mail) e.email = t('auth.errors.emailRequired');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) e.email = t('auth.errors.invalidEmail');
    if (!password) e.password = t('auth.errors.passwordRequired');
    else if (password.length < 8) e.password = t('auth.errors.weakPassword');
    if (!confirm) e.confirm = t('auth.errors.confirmRequired');
    else if (password !== confirm) e.confirm = t('auth.errors.passwordMismatch');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const clearError = (key: string) => {
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const onSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    clearLastAuthError();
    try {
      await signUpWithEmail(email.trim(), password, name.trim());
      if (joinToken) {
        clearPendingJoinToken();
        router.replace(`/join/${joinToken}`);
      }
    } catch (err: unknown) {
      const { title, hint } = describeAuthError(err);
      useAuthStore.getState().setLastAuthError(`הרשמה נכשלה: ${title}`, hint ?? null);
      Alert.alert(t('common.error'), hint ? `${title}\n\n${hint}` : title);
    } finally {
      setLoading(false);
    }
  };

  const onGoogle = async () => {
    try {
      await signInWithGoogle({ joinToken: joinToken ? String(joinToken) : undefined });
    } catch (err: unknown) {
      const { title, hint } = describeAuthError(err);
      useAuthStore.getState().setLastAuthError(title, hint ?? null);
      Alert.alert(t('common.error'), hint ? `${title}\n\n${hint}` : title);
    }
  };

  return (
    <Screen scrollable>
      <View className="flex-1 justify-center gap-4 max-w-md w-full self-center">
        {missingEnv.length > 0 ? (
          <View className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40 p-4 gap-2">
            <Text className="text-amber-900 dark:text-amber-100 font-semibold text-sm">חסרה תצורת Firebase</Text>
            <Text className="text-amber-800 dark:text-amber-200 text-xs leading-5">
              הוסף לקובץ `.env` והפעל מחדש את Metro עם `--clear`:
            </Text>
            {missingEnv.map(({ envVar }) => (
              <Text key={envVar} className="text-amber-900 dark:text-amber-100 text-xs font-mono">
                • {envVar}
              </Text>
            ))}
          </View>
        ) : null}

        <AuthFeedbackBanner
          title={lastAuthError ?? ''}
          hint={lastAuthHint}
          onDismiss={clearLastAuthError}
        />

        <Text className="text-2xl font-bold text-center text-gray-900 dark:text-white">
          {t('auth.signUp')}
        </Text>
        <Input
          label={t('auth.displayName')}
          value={name}
          onChangeText={(v) => {
            setName(v);
            clearError('name');
          }}
          error={errors.name}
        />
        <Input
          label={t('auth.email')}
          value={email}
          onChangeText={(v) => {
            setEmail(v);
            clearError('email');
          }}
          autoCapitalize="none"
          keyboardType="email-address"
          error={errors.email}
        />
        <Input
          label={t('auth.password')}
          value={password}
          onChangeText={(v) => {
            setPassword(v);
            clearError('password');
          }}
          secureTextEntry
          error={errors.password}
        />
        <Input
          label={t('auth.confirmPassword')}
          value={confirm}
          onChangeText={(v) => {
            setConfirm(v);
            clearError('confirm');
          }}
          secureTextEntry
          error={errors.confirm}
        />
        <Button title={t('auth.signUp')} onPress={onSubmit} loading={loading} fullWidth />

        {Platform.OS === 'web' ? (
          <View className="gap-2">
            <Text className="text-center text-xs text-gray-500 dark:text-gray-400 px-1">{t('auth.googleNewOrExisting')}</Text>
            <Button title={t('auth.signInWithGoogle')} variant="secondary" onPress={onGoogle} fullWidth />
          </View>
        ) : null}
        <View className="flex-row justify-center gap-1">
          <Text className="text-gray-600 dark:text-gray-300">{t('auth.haveAccount')}</Text>
          <Link
            href={
              joinToken
                ? ({ pathname: '/(auth)/sign-in', params: { joinToken } } as const)
                : '/(auth)/sign-in'
            }
            className="text-brand-600 font-semibold"
          >
            {t('auth.signIn')}
          </Link>
        </View>
      </View>
    </Screen>
  );
}
