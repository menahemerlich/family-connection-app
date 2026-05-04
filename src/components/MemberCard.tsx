import { Linking, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Avatar } from './Avatar';
import type { MemberDoc, UserDoc } from '@/types/models';
import { compactViewChildren } from '@/lib/compactViewChildren';

type Props = {
  member: MemberDoc;
  profile?: UserDoc;
  isMe?: boolean;
  onChatPress?: () => void;
  onVideoPress?: () => void;
  onCallPress?: () => void;
};

export function MemberCard({ member, profile, isMe, onChatPress, onVideoPress, onCallPress }: Props) {
  const { t } = useTranslation();
  const name = profile?.displayName ?? 'משתמש';
  const phone = profile?.phone;

  return (
    <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 flex-row items-center gap-3 border border-gray-100 dark:border-gray-700">
      {compactViewChildren(
        <>
          <Avatar uri={profile?.photoURL ?? undefined} name={name} size={56} online={profile?.isOnline} />
          <View className="flex-1">
            {compactViewChildren(
              <>
                <Text className="text-base font-semibold text-gray-900 dark:text-white text-right">
                  {name}{' '}
                  {isMe ? <Text className="text-xs text-gray-500">{t('home.you')}</Text> : null}
                </Text>
                {member.relation ? (
                  <Text className="text-xs text-gray-500 text-right">{member.relation}</Text>
                ) : null}
                <Text className="text-xs text-gray-400 text-right">
                  {profile?.isOnline ? t('home.online') : t('home.offline')}
                </Text>
              </>,
            )}
          </View>
          {!isMe && (
            <View className="flex-row gap-2">
              {compactViewChildren(
                <>
                  <Pressable
                    onPress={onChatPress}
                    className="w-10 h-10 rounded-full bg-brand-50 dark:bg-brand-900 items-center justify-center"
                  >
                    <Ionicons name="chatbubble-ellipses" size={20} color="#1f63f0" />
                  </Pressable>
                  <Pressable
                    onPress={onVideoPress}
                    className="w-10 h-10 rounded-full bg-brand-50 dark:bg-brand-900 items-center justify-center"
                  >
                    <Ionicons name="videocam" size={20} color="#1f63f0" />
                  </Pressable>
                  {phone ? (
                    <Pressable
                      onPress={onCallPress ?? (() => Linking.openURL(`tel:${phone}`))}
                      className="w-10 h-10 rounded-full bg-brand-50 dark:bg-brand-900 items-center justify-center"
                    >
                      <Ionicons name="call" size={20} color="#1f63f0" />
                    </Pressable>
                  ) : null}
                </>,
              )}
            </View>
          )}
        </>,
      )}
    </View>
  );
}
