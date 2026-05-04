import { useState } from 'react';
import { Alert, FlatList, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { MemberCard } from '@/components/MemberCard';
import { useAuthStore } from '@/stores/authStore';
import { useFamilyStore } from '@/stores/familyStore';
import { sendInvite } from '@/features/family/familyService';
import { ensurePrivateChat, GROUP_CHAT_ID } from '@/features/chat/chatService';
import { compactViewChildren } from '@/lib/compactViewChildren';

export default function Home() {
  const { t } = useTranslation();
  const router = useRouter();
  const me = useAuthStore((s) => s.profile);
  const family = useFamilyStore((s) => s.family);
  const members = useFamilyStore((s) => s.members);
  const profiles = useFamilyStore((s) => s.memberProfiles);

  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [sending, setSending] = useState(false);

  const onSendInvite = async () => {
    if (!family || !inviteEmail.trim()) return;
    setSending(true);
    try {
      await sendInvite(family.id, inviteEmail.trim());
      Alert.alert(t('common.confirm'), t('invite.sent'));
      setInviteEmail('');
      setShowInvite(false);
    } catch (err: unknown) {
      Alert.alert(t('common.error'), err instanceof Error ? err.message : 'שגיאה');
    } finally {
      setSending(false);
    }
  };

  const openChatWith = async (otherUid: string) => {
    if (!family || !me) return;
    const chatId = await ensurePrivateChat(family.id, me.uid, otherUid);
    router.push(`/(app)/chats/${chatId}`);
  };

  const startVideoCall = (uid: string) => {
    router.push(`/(app)/calls/private-${uid}`);
  };

  const startGroupCall = () => {
    router.push(`/(app)/calls/group`);
  };

  const openGroupChat = () => {
    router.push(`/(app)/chats/${GROUP_CHAT_ID}`);
  };

  return (
    <Screen padded={false}>
      <View className="px-4 pt-4 pb-2 flex-row items-center justify-between">
        {compactViewChildren(
          <>
            <View>
              <Text className="text-2xl font-bold text-gray-900 dark:text-white text-right">
                {family?.name ?? t('home.title')}
              </Text>
              <Text className="text-sm text-gray-500 text-right">
                {members.length} {t('home.members')}
              </Text>
            </View>
            <Pressable
              onPress={() => router.push('/(app)/settings')}
              className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 items-center justify-center border border-gray-200 dark:border-gray-700"
            >
              <Ionicons name="settings-outline" size={20} color="#6b7280" />
            </Pressable>
          </>,
        )}
      </View>

      <View className="px-4 gap-3">
        <View className="flex-row gap-3">
          {compactViewChildren(
            <>
              <View className="flex-1">
                <Button
                  title={t('home.groupChat')}
                  icon={<Ionicons name="chatbubbles" size={18} color="#fff" />}
                  onPress={openGroupChat}
                  fullWidth
                />
              </View>
              <View className="flex-1">
                <Button
                  title={t('home.groupCall')}
                  icon={<Ionicons name="videocam" size={18} color="#fff" />}
                  onPress={startGroupCall}
                  fullWidth
                />
              </View>
            </>,
          )}
        </View>

        <Button
          title={t('home.inviteMember')}
          variant="secondary"
          icon={<Ionicons name="person-add" size={18} color="#1f63f0" />}
          onPress={() => setShowInvite((v) => !v)}
          fullWidth
        />

        {showInvite && (
          <View className="gap-2 bg-white dark:bg-gray-800 rounded-2xl p-3 border border-gray-100 dark:border-gray-700">
            <Input
              label={t('invite.emailLabel')}
              placeholder={t('invite.emailPlaceholder')}
              value={inviteEmail}
              onChangeText={setInviteEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <Button title={t('invite.send')} onPress={onSendInvite} loading={sending} fullWidth />
          </View>
        )}
      </View>

      <FlatList
        data={members}
        keyExtractor={(m) => m.uid}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        ListHeaderComponent={
          <Text className="text-base font-semibold text-gray-700 dark:text-gray-200 text-right mb-1">
            {t('home.members')}
          </Text>
        }
        ListEmptyComponent={
          <View className="p-6 items-center">
            <Text className="text-gray-500">{t('home.noMembers')}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <MemberCard
            member={item}
            profile={profiles[item.uid]}
            isMe={item.uid === me?.uid}
            onChatPress={() => openChatWith(item.uid)}
            onVideoPress={() => startVideoCall(item.uid)}
          />
        )}
      />
    </Screen>
  );
}
