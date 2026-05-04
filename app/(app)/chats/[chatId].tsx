import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Screen } from '@/components/Screen';
import { MessageBubble } from '@/components/MessageBubble';
import { useAuthStore } from '@/stores/authStore';
import { useFamilyStore } from '@/stores/familyStore';
import {
  sendTextMessage,
  sendMediaMessage,
  setTyping,
  markRead,
  GROUP_CHAT_ID,
} from '@/features/chat/chatService';
import { useMessages, useTyping } from '@/features/chat/useChat';

export default function ChatThreadScreen() {
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const me = useAuthStore((s) => s.profile);
  const familyId = me?.familyId;
  const profiles = useFamilyStore((s) => s.memberProfiles);

  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const typers = useTyping(familyId ?? undefined, chatId, me?.uid);
  const messages = useMessages(familyId, chatId);
  const listRef = useRef<FlatList>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const title = useMemo(() => {
    if (chatId === GROUP_CHAT_ID) return t('chat.groupTitle');
    const parts = chatId?.split('_') ?? [];
    const other = parts.find((u) => u !== me?.uid);
    return other ? profiles[other]?.displayName ?? t('chat.newChat') : t('chat.newChat');
  }, [chatId, me?.uid, profiles, t]);

  const onTyping = useCallback(
    (active: boolean) => {
      if (!familyId || !chatId || !me?.uid) return;
      void setTyping({ familyId, chatId, uid: me.uid, isTyping: active });
    },
    [chatId, familyId, me?.uid],
  );

  useEffect(() => {
    if (!familyId || !chatId || !messages.length || !me?.uid) return;
    const last = messages[messages.length - 1];
    if (last.senderId !== me.uid && last.id) {
      void markRead({ familyId, chatId, messageId: last.id, uid: me.uid });
    }
  }, [chatId, familyId, me?.uid, messages]);

  const send = async () => {
    if (!text.trim() || !familyId || !chatId || !me?.uid) return;
    setSending(true);
    onTyping(false);
    try {
      await sendTextMessage({ familyId, chatId, senderId: me.uid, text: text.trim() });
      setText('');
    } catch (e) {
      Alert.alert(t('common.error'), e instanceof Error ? e.message : 'שגיאה');
    } finally {
      setSending(false);
    }
  };

  const onChangeText = (v: string) => {
    setText(v);
    onTyping(true);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => onTyping(false), 1500);
  };

  const pickMedia = async (mode: 'image' | 'video') => {
    if (!familyId || !chatId || !me?.uid) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes:
        mode === 'image'
          ? ImagePicker.MediaTypeOptions.Images
          : ImagePicker.MediaTypeOptions.Videos,
      quality: 0.85,
      videoMaxDuration: 120,
    });
    if (res.canceled || !res.assets?.[0]?.uri) return;
    const asset = res.assets[0];
    setSending(true);
    try {
      await sendMediaMessage({
        familyId,
        chatId,
        senderId: me.uid,
        type: mode,
        uri: asset.uri,
        mediaMeta: {
          width: asset.width,
          height: asset.height,
          durationMs: asset.duration ? asset.duration * 1000 : undefined,
          mimeType: asset.mimeType ?? undefined,
        },
      });
    } catch (e) {
      Alert.alert(t('common.error'), e instanceof Error ? e.message : 'שגיאה');
    } finally {
      setSending(false);
    }
  };

  const toggleRecord = async () => {
    if (!familyId || !chatId || !me?.uid) return;
    if (recording) {
      try {
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        setRecording(null);
        if (uri) {
          setSending(true);
          await sendMediaMessage({
            familyId,
            chatId,
            senderId: me.uid,
            type: 'audio',
            uri,
            mediaMeta: { mimeType: 'audio/m4a' },
          });
        }
      } catch (e) {
        Alert.alert(t('common.error'), e instanceof Error ? e.message : 'שגיאה');
      } finally {
        setSending(false);
        setRecording(null);
      }
      return;
    }
    const perm = await Audio.requestPermissionsAsync();
    if (!perm.granted) return;
    await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
    const rec = new Audio.Recording();
    await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
    await rec.startAsync();
    setRecording(rec);
  };

  if (!familyId || !chatId) {
    return (
      <Screen>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator />
        </View>
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
        keyboardVerticalOffset={80}
      >
        <View className="flex-row items-center px-3 py-3 border-b border-gray-100 dark:border-gray-800">
          <Pressable onPress={() => router.back()} className="p-2">
            <Ionicons name="chevron-back" size={24} color="#1f63f0" />
          </Pressable>
          <Text className="flex-1 text-lg font-bold text-gray-900 dark:text-white text-right pr-2">
            {title}
          </Text>
        </View>

        {typers.length ? (
          <Text className="text-xs text-gray-500 text-center py-1">
            {typers.length === 1 ? t('chat.typing') : t('chat.typingMany', { count: typers.length })}
          </Text>
        ) : null}

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => (
            <MessageBubble
              message={item}
              familyId={familyId}
              chatId={chatId}
              currentUid={me?.uid ?? ''}
              showSenderName={chatId === GROUP_CHAT_ID}
              senderName={profiles[item.senderId]?.displayName}
            />
          )}
        />

        {sending ? (
          <View className="absolute inset-0 bg-black/10 items-center justify-center">
            <ActivityIndicator size="large" />
          </View>
        ) : null}

        <View className="flex-row items-end gap-2 px-2 py-2 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
          <Pressable onPress={() => void pickMedia('image')} className="p-2">
            <Ionicons name="image-outline" size={24} color="#1f63f0" />
          </Pressable>
          <Pressable onPress={() => void pickMedia('video')} className="p-2">
            <Ionicons name="videocam-outline" size={24} color="#1f63f0" />
          </Pressable>
          <Pressable onPress={() => void toggleRecord()} className="p-2">
            <Ionicons name={recording ? 'stop-circle' : 'mic'} size={24} color={recording ? '#ef4444' : '#1f63f0'} />
          </Pressable>
          <TextInput
            className="flex-1 min-h-[44px] max-h-28 px-3 py-2 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white text-right"
            placeholder={t('chat.typeMessage')}
            placeholderTextColor="#9ca3af"
            value={text}
            onChangeText={onChangeText}
            multiline
            style={{ writingDirection: 'rtl' }}
          />
          <Pressable onPress={() => void send()} className="p-2 mb-1" disabled={!text.trim()}>
            <Ionicons name="send" size={24} color={text.trim() ? '#1f63f0' : '#ccc'} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
