import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';

export default function MoreScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  const rows: { href: string; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { href: '/(app)/lists', label: t('lists.title'), icon: 'list' },
    { href: '/(app)/tree', label: t('tree.title'), icon: 'git-network-outline' },
    { href: '/(app)/settings', label: t('settings.title'), icon: 'settings-outline' },
  ];

  return (
    <Screen scrollable>
      <Text className="text-2xl font-bold text-gray-900 dark:text-white text-right mb-4">עוד</Text>
      <View className="gap-3">
        {rows.map((r) => (
          <Pressable
            key={r.href}
            onPress={() => router.push(r.href as never)}
            className="flex-row items-center justify-between bg-white dark:bg-gray-800 rounded-2xl px-4 py-4 border border-gray-100 dark:border-gray-700"
          >
            <Text className="text-base text-gray-900 dark:text-white">{r.label}</Text>
            <Ionicons name={r.icon} size={22} color="#6b7280" />
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}
