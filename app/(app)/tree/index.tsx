import { useEffect, useState } from 'react';
import { Alert, FlatList, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { collection, onSnapshot } from 'firebase/firestore';
import { Screen } from '@/components/Screen';
import { Button } from '@/components/Button';
import { useAuthStore } from '@/stores/authStore';
import { db } from '@/lib/firebase';
import type { TreeNodeDoc } from '@/types/models';
import { addTreeNode } from '@/features/tree/treeService';

export default function FamilyTreeScreen() {
  const { t } = useTranslation();
  const me = useAuthStore((s) => s.profile);
  const familyId = me?.familyId;
  const [nodes, setNodes] = useState<TreeNodeDoc[]>([]);
  const [name, setName] = useState('');

  useEffect(() => {
    if (!familyId) return;
    return onSnapshot(collection(db, 'families', familyId, 'tree'), (qs) =>
      setNodes(qs.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<TreeNodeDoc, 'id'>) }))),
    );
  }, [familyId]);

  const onAdd = async () => {
    if (!familyId || !name.trim()) return;
    try {
      await addTreeNode({ familyId, node: { name: name.trim(), parents: [], childrenIds: [] } });
      setName('');
    } catch (e) {
      Alert.alert(t('common.error'), e instanceof Error ? e.message : 'שגיאה');
    }
  };

  return (
    <Screen padded={false}>
      <View className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <Text className="text-2xl font-bold text-gray-900 dark:text-white text-right">
          {t('tree.title')}
        </Text>
        <View className="mt-3 gap-2">
          <TextInput
            className="border border-gray-200 dark:border-gray-700 rounded-2xl px-3 py-2 text-right"
            placeholder={t('tree.addNode')}
            placeholderTextColor="#9ca3af"
            value={name}
            onChangeText={setName}
            style={{ writingDirection: 'rtl' }}
          />
          <Button title={t('tree.addNode')} onPress={() => void onAdd()} />
        </View>
      </View>
      <FlatList
        data={nodes}
        keyExtractor={(n) => n.id}
        contentContainerStyle={{ padding: 16, gap: 8 }}
        ListEmptyComponent={<Text className="text-center text-gray-500">{t('tree.title')} — ריק</Text>}
        renderItem={({ item }) => (
          <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
            <Text className="text-lg font-semibold text-right text-gray-900 dark:text-white">
              {item.name || item.userId || item.id}
            </Text>
            {item.parents?.length ? (
              <Text className="text-xs text-gray-500 text-right">הורים: {item.parents.join(', ')}</Text>
            ) : null}
          </View>
        )}
      />
    </Screen>
  );
}
