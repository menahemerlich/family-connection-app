import { Pressable, Text, View } from 'react-native';

type Props = {
  title: string;
  hint?: string | null;
  onDismiss: () => void;
};

export function AuthFeedbackBanner({ title, hint, onDismiss }: Props) {
  if (!title) return null;

  return (
    <View className="rounded-xl border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/40 p-4 gap-2">
      <Text className="text-red-800 dark:text-red-200 font-semibold text-sm leading-5">{title}</Text>
      {hint ? (
        <Text className="text-red-700/90 dark:text-red-300/90 text-xs leading-5">{hint}</Text>
      ) : null}
      <Pressable onPress={onDismiss} className="self-end py-1">
        <Text className="text-red-600 dark:text-red-400 text-xs font-medium">סגור הודעה</Text>
      </Pressable>
    </View>
  );
}
