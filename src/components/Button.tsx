import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import type { ReactNode } from 'react';
import { compactViewChildren } from '@/lib/compactViewChildren';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

type Props = {
  onPress?: () => void;
  title?: string;
  children?: ReactNode;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
};

const styles: Record<Variant, { bg: string; text: string; border?: string }> = {
  primary: { bg: 'bg-brand-600', text: 'text-white' },
  secondary: { bg: 'bg-white dark:bg-gray-800', text: 'text-gray-900 dark:text-white', border: 'border border-gray-200 dark:border-gray-700' },
  ghost: { bg: 'bg-transparent', text: 'text-brand-600' },
  danger: { bg: 'bg-red-600', text: 'text-white' },
};

export function Button({
  onPress,
  title,
  children,
  variant = 'primary',
  loading,
  disabled,
  icon,
  fullWidth,
}: Props) {
  const s = styles[variant];
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={`px-4 py-3 rounded-2xl items-center justify-center flex-row gap-2 ${s.bg} ${
        s.border ?? ''
      } ${fullWidth ? 'w-full' : ''} ${isDisabled ? 'opacity-50' : 'active:opacity-80'}`}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' || variant === 'danger' ? '#fff' : '#1f63f0'} />
      ) : (
        <View className="flex-row items-center gap-2">
          {compactViewChildren(
            <>
              {icon}
              {title ? <Text className={`text-base font-semibold ${s.text}`}>{title}</Text> : children}
            </>,
          )}
        </View>
      )}
    </Pressable>
  );
}
