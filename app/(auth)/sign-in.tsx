import { useMemo, useState } from 'react';
import { Alert, Platform, Text, View } from 'react-native';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '@/components/Screen';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { AuthFeedbackBanner } from '@/components/AuthFeedbackBanner';
import { signInWithEmail, signInWithGoogle } from '@/features/auth/authService';
import { describeAuthError } from '@/lib/authMessages';
import { getMissingFirebaseEnvFields } from '@/lib/firebaseEnvCheck';
import { clearPendingJoinToken } from '@/lib/pendingJoinTokenWeb';
import { useAuthStore } from '@/stores/authStore';

export default function SignIn() {
  const { t } = useTranslation();
  const router = useRouter();
  const { joinToken } = useLocalSearchParams<{ joinToken?: string }>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  const lastAuthError = useAuthStore((s) => s.lastAuthError);
  const lastAuthHint = useAuthStore((s) => s.lastAuthHint);
  const clearLastAuthError = useAuthStore((s) => s.clearLastAuthError);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const firebaseUser = useAuthStore((s) => s.firebaseUser);

  const missingEnv = useMemo(() => getMissingFirebaseEnvFields(), []);
  const showSilentGoogleHint =
    Platform.OS === 'web' &&
    isInitialized &&
    !firebaseUser &&
    !lastAuthError &&
    missingEnv.length === 0;

  const validate = (): boolean => {
    const e: { email?: string; password?: string } = {};
    const mail = email.trim();
    if (!mail) {
      e.email = t('auth.errors.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) {
      e.email = t('auth.errors.invalidEmail');
    }
    if (!password) {
      e.password = t('auth.errors.passwordRequired');
    }
    setFieldErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    clearLastAuthError();
    try {
      await signInWithEmail(email.trim(), password);
      if (joinToken) {
        clearPendingJoinToken();
        router.replace(`/join/${joinToken}`);
      }
    } catch (err: unknown) {
      const { title, hint } = describeAuthError(err);
      useAuthStore.getState().setLastAuthError(`התחברות באימייל נכשלה: ${title}`, hint ?? null);
      Alert.alert(t('common.error'), `${title}${hint ? `\n\n${hint}` : ''}`);
      console.warn(err);
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
      <View className="flex-1 justify-center gap-6 max-w-md w-full self-center">
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

        {showSilentGoogleHint ? (
          <View className="rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/50 p-3">
            <Text className="text-gray-700 dark:text-gray-300 text-xs leading-5">
              אם סיימת התחברות Google וחזרת לכאן בלי להיכנס: בדוק בהודעה האדומה למעלה (אם יש), פתח קונסול (F12) →
              Console, וודא ב-Firebase ש-Authentication מופעל ושדומיין localhost / 127.0.0.1 מורשים.
            </Text>
          </View>
        ) : null}

        <View className="items-center gap-2 mb-4">
          <Text className="text-3xl font-bold text-brand-600">{t('appName')}</Text>
          <Text className="text-base text-gray-500">{t('onboarding.subtitle')}</Text>
        </View>

        <Input
          label={t('auth.email')}
          value={email}
          onChangeText={(v) => {
            setEmail(v);
            if (fieldErrors.email) setFieldErrors((x) => ({ ...x, email: undefined }));
          }}
          autoCapitalize="none"
          keyboardType="email-address"
          textContentType="emailAddress"
          placeholder="name@example.com"
          error={fieldErrors.email}
        />
        <Input
          label={t('auth.password')}
          value={password}
          onChangeText={(v) => {
            setPassword(v);
            if (fieldErrors.password) setFieldErrors((x) => ({ ...x, password: undefined }));
          }}
          secureTextEntry
          textContentType="password"
          error={fieldErrors.password}
        />

        <Button title={t('auth.signIn')} onPress={onSubmit} loading={loading} fullWidth />

        {Platform.OS === 'web' && (
          <Button title={t('auth.signInWithGoogle')} variant="secondary" onPress={onGoogle} fullWidth />
        )}

        <View className="flex-row justify-center gap-1">
          <Text className="text-gray-600 dark:text-gray-300">{t('auth.noAccount')}</Text>
          <Link
            href={
              joinToken
                ? ({ pathname: '/(auth)/sign-up', params: { joinToken } } as const)
                : '/(auth)/sign-up'
            }
            className="text-brand-600 font-semibold"
          >
            {t('auth.signUp')}
          </Link>
        </View>
      </View>
    </Screen>
  );
}
