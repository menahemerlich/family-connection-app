import { useMemo } from 'react';
import { Image, Linking, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { MessageDoc } from '@/types/models';
import { deleteMessage, toggleReaction } from '@/features/chat/chatService';

const QUICK_REACTIONS = ['❤️', '👍', '😂', '😮', '😢', '🎉'];

type Props = {
  message: MessageDoc;
  familyId: string;
  chatId: string;
  currentUid: string;
  showSenderName: boolean;
  senderName?: string;
  onReactionToggled?: () => void;
};

export function MessageBubble({
  message,
  familyId,
  chatId,
  currentUid,
  showSenderName,
  senderName,
  onReactionToggled,
}: Props) {
  const { t } = useTranslation();
  const isMine = message.senderId === currentUid;
  const isSystem = message.senderId === 'system';

  const timeLabel = useMemo(() => {
    try {
      const d = message.createdAt?.toDate?.() ?? null;
      if (!d) return '';
      return d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  }, [message.createdAt]);

  const onToggleEmoji = async (emoji: string) => {
    const reactionMap = message.reactions?.[emoji] ?? [];
    const has = reactionMap.includes(currentUid);
    await toggleReaction({
      familyId,
      chatId,
      messageId: message.id,
      uid: currentUid,
      emoji,
      add: !has,
    });
    onReactionToggled?.();
  };

  const openMedia = () => {
    if (message.mediaUrl) void Linking.openURL(message.mediaUrl);
  };

  if (isSystem) {
    return (
      <View className="items-center py-2">
        <Text className="text-xs text-gray-500 text-center px-4">{message.text}</Text>
      </View>
    );
  }

  return (
    <View className={`mb-2 max-w-[88%] ${isMine ? 'self-end items-end' : 'self-start items-start'}`}>
      {showSenderName && !isMine ? (
        <Text className="text-[11px] text-gray-400 mb-1 text-right">{senderName}</Text>
      ) : null}

      <Pressable
        onLongPress={() => {
          /* reaction bar is always visible below for MVP */
        }}
        className={`rounded-2xl px-3 py-2 ${
          isMine ? 'bg-brand-600' : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700'
        }`}
      >
        {message.type === 'image' && message.mediaUrl ? (
          <Pressable onPress={openMedia}>
            <Image
              source={{ uri: message.mediaUrl }}
              style={{ width: 220, height: 160, borderRadius: 12 }}
              resizeMode="cover"
            />
            {message.text ? (
              <Text className={`mt-2 text-sm ${isMine ? 'text-white' : 'text-gray-800 dark:text-gray-100'}`}>
                {message.text}
              </Text>
            ) : null}
          </Pressable>
        ) : message.type === 'video' && message.mediaUrl ? (
          <Pressable onPress={openMedia}>
            <View className="w-[220] h-[120] bg-black/80 rounded-xl items-center justify-center">
              <Ionicons name="play-circle" size={48} color="white" />
            </View>
            {message.text ? (
              <Text className={`mt-2 text-sm ${isMine ? 'text-white' : 'text-gray-800 dark:text-gray-100'}`}>
                {message.text}
              </Text>
            ) : null}
          </Pressable>
        ) : message.type === 'audio' && message.mediaUrl ? (
          <Pressable onPress={openMedia} className="flex-row items-center gap-2">
            <Ionicons name="mic" size={20} color={isMine ? '#fff' : '#1f63f0'} />
            <Text className={`text-sm ${isMine ? 'text-white' : 'text-gray-800 dark:text-gray-100'}`}>
              {t('chat.voiceMessage')}
            </Text>
          </Pressable>
        ) : (
          <Text className={`text-base ${isMine ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
            {message.text}
          </Text>
        )}
        <Text
          className={`text-[10px] mt-1 ${isMine ? 'text-blue-100' : 'text-gray-400'}`}
          style={{ alignSelf: 'flex-end' }}
        >
          {timeLabel}
        </Text>
      </Pressable>

      <View className="flex-row flex-wrap gap-1 mt-1 justify-end">
        {QUICK_REACTIONS.map((emoji) => {
          const n = message.reactions?.[emoji]?.length ?? 0;
          const active = message.reactions?.[emoji]?.includes(currentUid);
          return (
            <Pressable
              key={emoji}
              onPress={() => void onToggleEmoji(emoji)}
              className={`px-2 py-0.5 rounded-full border ${
                active ? 'bg-brand-50 border-brand-200' : 'bg-transparent border-gray-200 dark:border-gray-600'
              }`}
            >
              <Text className="text-xs">
                {emoji}
                {n > 0 ? ` ${n}` : ''}
              </Text>
            </Pressable>
          );
        })}
        {isMine ? (
          <Pressable
            onPress={() => void deleteMessage({ familyId, chatId, messageId: message.id })}
            className="px-2 py-0.5"
          >
            <Ionicons name="trash-outline" size={16} color="#ef4444" />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
