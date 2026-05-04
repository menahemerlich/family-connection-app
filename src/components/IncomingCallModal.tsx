import { Modal, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useCallStore } from '@/stores/callStore';

export function IncomingCallModal() {
  const { t } = useTranslation();
  const router = useRouter();
  const incoming = useCallStore((s) => s.incoming);
  const setIncoming = useCallStore((s) => s.setIncoming);

  if (!incoming) return null;

  return (
    <Modal visible transparent animationType="fade">
      <View className="flex-1 bg-black/70 items-center justify-center px-6">
        <View className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-3xl p-6 gap-4">
          <Text className="text-xl font-bold text-center text-gray-900 dark:text-white">
            {t('calls.incoming')}
          </Text>
          <Text className="text-center text-gray-600 dark:text-gray-300">
            {t('calls.incomingFrom', { name: incoming.initiatorName })}
          </Text>
          <View className="flex-row gap-3 mt-2">
            <Pressable
              className="flex-1 bg-red-600 py-3 rounded-2xl"
              onPress={() => setIncoming(null)}
            >
              <Text className="text-white text-center font-bold">{t('calls.decline')}</Text>
            </Pressable>
            <Pressable
              className="flex-1 bg-green-600 py-3 rounded-2xl"
              onPress={() => {
                const id = incoming.callId;
                setIncoming(null);
                router.push({ pathname: '/(app)/calls/answer', params: { callId: id } });
              }}
            >
              <Text className="text-white text-center font-bold">{t('calls.accept')}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
