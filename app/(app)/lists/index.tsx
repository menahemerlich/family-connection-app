import { useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { Screen } from '@/components/Screen';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useAuthStore } from '@/stores/authStore';
import { db } from '@/lib/firebase';
import type { ListDoc } from '@/types/models';
import { createList } from '@/features/lists/listsService';

export default function ListsIndexScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const me = useAuthStore((s) => s.profile);
  const familyId = me?.familyId;
  const [lists, setLists] = useState<ListDoc[]>([]);
  const [name, setName] = useState('');
  const [type, setType] = useState<'shopping' | 'todo'>('shopping');

  useEffect(() => {
    if (!familyId) return;
    const q = query(collection(db, 'families', familyId, 'lists'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (qs) =>
      setLists(qs.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ListDoc, 'id'>) }))),
    );
  }, [familyId]);

  const onCreate = async () => {
    if (!familyId || !me?.uid || !name.trim()) return;
    try {
      const id = await createList({ familyId, uid: me.uid, name: name.trim(), type });
      setName('');
      router.push(`/(app)/lists/${id}`);
    } catch (e) {
      Alert.alert(t('common.error'), e instanceof Error ? e.message : 'שגיאה');
    }
  };

  return (
    <Screen padded={false}>
      <View className="px-4 pt-4 pb-2">
        <Text className="text-2xl font-bold text-gray-900 dark:text-white text-right">
          {t('lists.title')}
        </Text>
        <View className="mt-4 gap-3 bg-white dark:bg-gray-800 p-3 rounded-2xl border border-gray-100 dark:border-gray-700">
          <Input label={t('lists.newList')} value={name} onChangeText={setName} />
          <View className="flex-row gap-2 justify-end">
            <Pressable
              onPress={() => setType('shopping')}
              className={`px-3 py-2 rounded-full ${type === 'shopping' ? 'bg-brand-600' : 'bg-gray-200'}`}
            >
              <Text className={type === 'shopping' ? 'text-white' : 'text-gray-800'}>
                {t('lists.shopping')}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setType('todo')}
              className={`px-3 py-2 rounded-full ${type === 'todo' ? 'bg-brand-600' : 'bg-gray-200'}`}
            >
              <Text className={type === 'todo' ? 'text-white' : 'text-gray-800'}>
                {t('lists.todo')}
              </Text>
            </Pressable>
          </View>
          <Button title={t('common.save')} onPress={() => void onCreate()} />
        </View>
      </View>

      <FlatList
        data={lists}
        keyExtractor={(l) => l.id}
        contentContainerStyle={{ padding: 16, gap: 8 }}
        ListEmptyComponent={<Text className="text-center text-gray-500">{t('lists.noLists')}</Text>}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/(app)/lists/${item.id}`)}
            className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700"
          >
            <Text className="text-lg font-semibold text-gray-900 dark:text-white text-right">
              {item.name}
            </Text>
            <Text className="text-xs text-gray-500 text-right">
              {item.type === 'shopping' ? t('lists.shopping') : t('lists.todo')} ·{' '}
              {item.items?.length ?? 0}
            </Text>
          </Pressable>
        )}
      />
    </Screen>
  );
}
