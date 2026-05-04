import { Image } from 'expo-image';
import { Text, View } from 'react-native';

type Props = {
  uri?: string | null;
  name?: string;
  size?: number;
  online?: boolean;
};

const PALETTE = [
  '#3380ff',
  '#34c759',
  '#ff9500',
  '#af52de',
  '#ff2d55',
  '#5ac8fa',
  '#ffcc00',
  '#ff3b30',
];

function colorForName(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return PALETTE[Math.abs(h) % PALETTE.length];
}

export function Avatar({ uri, name = '?', size = 48, online }: Props) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
  const bg = colorForName(name);
  return (
    <View style={{ width: size, height: size }}>
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          contentFit="cover"
        />
      ) : (
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: bg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: 'white', fontSize: size * 0.4, fontWeight: '700' }}>
            {initials || '?'}
          </Text>
        </View>
      )}
      {online !== undefined && (
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: size * 0.28,
            height: size * 0.28,
            borderRadius: size * 0.14,
            backgroundColor: online ? '#34c759' : '#9ca3af',
            borderWidth: 2,
            borderColor: 'white',
          }}
        />
      )}
    </View>
  );
}
