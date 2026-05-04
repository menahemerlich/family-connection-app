import { View, Text, Pressable } from 'react-native';
import { LiveKitRoom } from '@livekit/react-native';

type Props = {
  serverUrl: string;
  token: string;
  onLeave: () => void;
};

/**
 * Native (iOS/Android) LiveKit wrapper. Requires dev client / prebuild (not Expo Go).
 */
export function CallRoomView(props: Props) {
  return (
    <View className="flex-1 bg-black">
      <LiveKitRoom
        serverUrl={props.serverUrl}
        token={props.token}
        connect
        audio
        video
      >
        <View className="flex-1 items-center justify-center">
          <Text className="text-white text-center px-4">שיחת וידאו — בחר מצלמה/מיקרופון בהרשאות המערכת</Text>
        </View>
        <Pressable
          onPress={props.onLeave}
          className="absolute bottom-10 self-center bg-red-600 px-8 py-4 rounded-full"
        >
          <Text className="text-white font-bold">סיים שיחה</Text>
        </Pressable>
      </LiveKitRoom>
    </View>
  );
}
