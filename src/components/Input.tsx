import { Text, TextInput, View, type TextInputProps } from 'react-native';

type Props = TextInputProps & {
  label?: string;
  error?: string;
};

export function Input({ label, error, ...rest }: Props) {
  return (
    <View className="w-full gap-1">
      {label ? (
        <Text className="text-sm text-gray-700 dark:text-gray-300 text-right">{label}</Text>
      ) : null}
      <TextInput
        {...rest}
        placeholderTextColor="#9ca3af"
        className={`w-full px-4 py-3 rounded-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white border ${
          error ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'
        } text-right`}
        style={{ writingDirection: 'rtl' }}
      />
      {error ? <Text className="text-xs text-red-500 text-right">{error}</Text> : null}
    </View>
  );
}
