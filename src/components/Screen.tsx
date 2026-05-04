import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { compactViewChildren } from '@/lib/compactViewChildren';

type Props = {
  children: ReactNode;
  scrollable?: boolean;
  padded?: boolean;
};

export function Screen({ children, scrollable = false, padded = true }: Props) {
  const compacted = compactViewChildren(children);
  const inner = padded ? <View className="flex-1 p-4 gap-4">{compacted}</View> : compacted;
  return (
    <SafeAreaView className="flex-1 bg-surface dark:bg-surface-dark" edges={['top']}>
      {scrollable ? (
        <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
          {inner}
        </ScrollView>
      ) : (
        inner
      )}
    </SafeAreaView>
  );
}
