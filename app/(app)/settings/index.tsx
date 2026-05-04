import { useEffect, useState } from 'react';
import { Alert, Pressable, Switch, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Timestamp, doc, updateDoc } from 'firebase/firestore';
import * as Location from 'expo-location';
import { Screen } from '@/components/Screen';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { db } from '@/lib/firebase';
import { useAuthStore } from '@/stores/authStore';
import { signOut as authSignOut } from '@/features/auth/authService';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const scheme = useColorScheme();
  const me = useAuthStore((s) => s.profile);
  const [displayName, setDisplayName] = useState(me?.displayName ?? '');
  const [phone, setPhone] = useState(me?.phone ?? '');
  const [birthdate, setBirthdate] = useState(me?.birthdate ?? '');
  const [locationOptIn, setLocationOptIn] = useState(!!me?.locationOptIn);

  useEffect(() => {
    setDisplayName(me?.displayName ?? '');
    setPhone(me?.phone ?? '');
    setBirthdate(me?.birthdate ?? '');
    setLocationOptIn(!!me?.locationOptIn);
  }, [me]);

  const saveProfile = async () => {
    if (!me?.uid) return;
    try {
      await updateDoc(doc(db, 'users', me.uid), {
        displayName: displayName.trim(),
        phone: phone.trim() || null,
        birthdate: birthdate.trim() || null,
        locale: i18n.language === 'en' ? 'en' : 'he',
        locationOptIn,
      });
      Alert.alert(t('common.ok'), t('settings.profile'));
    } catch (e) {
      Alert.alert(t('common.error'), e instanceof Error ? e.message : 'שגיאה');
    }
  };

  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;

    (async () => {
      if (!me?.uid || !me.familyId || !locationOptIn) return;
      const fg = await Location.requestForegroundPermissionsAsync();
      if (!fg.granted) return;
      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 50, timeInterval: 30_000 },
        async (pos) => {
          try {
            await updateDoc(doc(db, 'families', me.familyId!, 'locations', me.uid), {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              accuracy: pos.coords.accuracy ?? null,
              updatedAt: Timestamp.now(),
            });
          } catch {
            /* ignore */
          }
        },
      );
    })();

    return () => {
      sub?.remove();
    };
  }, [locationOptIn, me?.familyId, me?.uid]);

  const toggleLang = () => {
    const next = i18n.language === 'he' ? 'en' : 'he';
    void i18n.changeLanguage(next);
  };

  const logout = async () => {
    await authSignOut();
    router.replace('/(auth)/sign-in');
  };

  return (
    <Screen scrollable>
      <Text className="text-2xl font-bold text-gray-900 dark:text-white text-right">
        {t('settings.title')}
      </Text>
      <Text className="text-xs text-gray-500 text-right">
        {t('settings.darkMode')}: {scheme === 'dark' ? 'dark' : 'light'} (system)
      </Text>

      <Input label={t('settings.displayName')} value={displayName} onChangeText={setDisplayName} />
      <Input label={t('settings.phone')} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <Input
        label={t('settings.birthdate')}
        value={birthdate}
        onChangeText={setBirthdate}
        placeholder="YYYY-MM-DD"
      />

      <View className="flex-row items-center justify-between py-2">
        <Switch value={locationOptIn} onValueChange={setLocationOptIn} />
        <Text className="text-base text-gray-800 dark:text-gray-100 flex-1 text-right">
          {t('settings.locationSharing')}
        </Text>
      </View>

      <Pressable className="py-3 border border-gray-200 dark:border-gray-700 rounded-2xl" onPress={toggleLang}>
        <Text className="text-center text-brand-600 font-semibold">
          {t('settings.language')}: {i18n.language === 'he' ? 'עברית' : 'English'}
        </Text>
      </Pressable>

      <Button title={t('common.save')} onPress={() => void saveProfile()} />

      <Button title={t('common.logout')} variant="secondary" onPress={() => void logout()} />
    </Screen>
  );
}
