import { useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { doc, onSnapshot } from 'firebase/firestore';
import { Screen } from '@/components/Screen';
import { Button } from '@/components/Button';
import { useAuthStore } from '@/stores/authStore';
import { db } from '@/lib/firebase';
import type { ListDoc } from '@/types/models';
import { addListItem, deleteList, toggleItem } from '@/features/lists/listsService';

export default function ListDetailScreen() {
  const { listId } = useLocalSearchParams<{ listId: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const me = useAuthStore((s) => s.profile);
  const familyId = me?.familyId;
  const [list, setList] = useState<ListDoc | null>(null);
  const [newItem, setNewItem] = useState('');

  useEffect(() => {
    if (!familyId || !listId) return;
    return onSnapshot(doc(db, 'families', familyId, 'lists', listId), (snap) => {
      if (snap.exists()) setList({ id: snap.id, ...(snap.data() as Omit<ListDoc, 'id'>) });
      else setList(null);
    });
  }, [familyId, listId]);

  const onAdd = async () => {
    if (!familyId || !listId || !newItem.trim()) return;
    try {
      await addListItem(familyId, listId, newItem.trim());
      setNewItem('');
    } catch (e) {
      Alert.alert(t('common.error'), e instanceof Error ? e.message : 'שגיאה');
    }
  };

  const onRemoveList = async () => {
    if (!familyId || !listId) return;
    try {
      await deleteList(familyId, listId);
      router.back();
    } catch (e) {
      Alert.alert(t('common.error'), e instanceof Error ? e.message : 'שגיאה');
    }
  };

  if (!list) {
    return (
      <Screen>
        <Text className="text-center text-gray-500">{t('common.loading')}</Text>
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <View className="px-4 pt-3 flex-row items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
        <Pressable onPress={() => router.back()}>
          <Text className="text-brand-600">{t('common.back')}</Text>
        </Pressable>
        <Text className="text-lg font-bold text-gray-900 dark:text-white flex-1 text-right">
          {list.name}
        </Text>
      </View>

      <View className="px-4 py-3 flex-row gap-2 items-center">
        <TextInput
          className="flex-1 border border-gray-200 dark:border-gray-700 rounded-2xl px-3 py-2 text-right text-gray-900 dark:text-white"
          placeholder={t('lists.addItem')}
          placeholderTextColor="#9ca3af"
          value={newItem}
          onChangeText={setNewItem}
          style={{ writingDirection: 'rtl' }}
        />
        <Button title={t('common.send')} onPress={() => void onAdd()} />
      </View>

      <FlatList
        data={list.items ?? []}
        keyExtractor={(it) => it.id}
        contentContainerStyle={{ padding: 16, gap: 8 }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              familyId &&
              listId &&
              me?.uid &&
              void toggleItem(familyId, listId, item.id, me.uid, !item.done)
            }
            className="bg-white dark:bg-gray-800 rounded-2xl p-3 border border-gray-100 dark:border-gray-700"
          >
            <Text
              className={`text-right text-base ${item.done ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}
            >
              {item.text}
            </Text>
          </Pressable>
        )}
      />

      <View className="p-4">
        <Button title={t('common.delete')} variant="danger" onPress={() => void onRemoveList()} />
      </View>
    </Screen>
  );
}
