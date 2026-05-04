import { FlatList, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '@/components/Screen';
import { useAuthStore } from '@/stores/authStore';
import { useChats } from '@/features/chat/useChat';
import { useFamilyStore } from '@/stores/familyStore';
import { privateChatId, GROUP_CHAT_ID } from '@/features/chat/chatService';

export default function ChatsListScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const me = useAuthStore((s) => s.profile);
  const familyId = me?.familyId;
  const chats = useChats(familyId, me?.uid);
  const members = useFamilyStore((s) => s.members);
  const profiles = useFamilyStore((s) => s.memberProfiles);

  const labelForChat = (chatId: string, type: string, participants: string[]) => {
    if (chatId === GROUP_CHAT_ID || type === 'group') return t('chat.groupTitle');
    const other = participants.find((u) => u !== me?.uid);
    return other ? profiles[other]?.displayName ?? t('chat.newChat') : t('chat.newChat');
  };

  return (
    <Screen padded={false}>
      <View className="px-4 pt-4 pb-2 border-b border-gray-100 dark:border-gray-800">
        <Text className="text-2xl font-bold text-gray-900 dark:text-white text-right">צ&apos;אטים</Text>
      </View>
      <FlatList
        data={chats}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ padding: 16, gap: 8 }}
        ListEmptyComponent={
          <Text className="text-center text-gray-500 mt-10">{t('chat.noChats')}</Text>
        }
        ListHeaderComponent={
          members.filter((m) => m.uid !== me?.uid).length ? (
            <View className="mb-4 gap-2">
              <Text className="text-sm font-semibold text-gray-700 dark:text-gray-200 text-right">
                {t('chat.newChat')}
              </Text>
              <View className="flex-row flex-wrap gap-2 justify-end">
                {members
                  .filter((m) => m.uid !== me?.uid)
                  .map((m) => (
                    <Pressable
                      key={m.uid}
                      onPress={() => {
                        if (!me) return;
                        const id = privateChatId(me.uid, m.uid);
                        router.push(`/(app)/chats/${id}`);
                      }}
                      className="px-3 py-2 bg-brand-50 dark:bg-gray-800 rounded-full border border-brand-100 dark:border-gray-700"
                    >
                      <Text className="text-brand-700 dark:text-brand-300 text-sm">
                        {profiles[m.uid]?.displayName ?? m.uid}
                      </Text>
                    </Pressable>
                  ))}
              </View>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/(app)/chats/${item.id}`)}
            className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700"
          >
            <Text className="text-base font-semibold text-gray-900 dark:text-white text-right">
              {labelForChat(item.id, item.type, item.participants)}
            </Text>
            {item.lastMessage ? (
              <Text className="text-sm text-gray-500 text-right mt-1" numberOfLines={1}>
                {item.lastMessage}
              </Text>
            ) : null}
          </Pressable>
        )}
      />
    </Screen>
  );
}
