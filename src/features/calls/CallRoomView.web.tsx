import { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Room, RoomEvent, Track } from 'livekit-client';

type Props = {
  serverUrl: string;
  token: string;
  onLeave: () => void;
};

/**
 * Web LiveKit room using livekit-client (video elements via refs).
 */
export function CallRoomView(props: Props) {
  const roomRef = useRef<Room | null>(null);
  const localRef = useRef<HTMLVideoElement | null>(null);
  const remoteRef = useRef<HTMLVideoElement | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    const room = new Room({ adaptiveStream: true, dynacast: true });
    roomRef.current = room;

    const attachLocal = () => {
      const pub = room.localParticipant.getTrackPublication(Track.Source.Camera);
      const track = pub?.track;
      if (track && localRef.current) track.attach(localRef.current);
    };

    room.on(RoomEvent.LocalTrackPublished, () => {
      attachLocal();
      setTick((t) => t + 1);
    });

    room.on(RoomEvent.TrackSubscribed, (track) => {
      if (track.kind === Track.Kind.Video && remoteRef.current) {
        track.attach(remoteRef.current);
      }
      if (track.kind === Track.Kind.Audio) {
        if (typeof document !== 'undefined') {
          const el = track.attach();
          el.play().catch(() => undefined);
        }
      }
    });

    void room.connect(props.serverUrl, props.token);
    void room.localParticipant.setCameraEnabled(true);
    void room.localParticipant.setMicrophoneEnabled(true);

    return () => {
      room.disconnect();
      roomRef.current = null;
    };
  }, [props.serverUrl, props.token]);

  return (
    <View className="flex-1 bg-black">
      <View className="flex-1 flex-col md:flex-row gap-2 p-2" style={{ flex: 1 }}>
        {/* Local */}
        <View style={{ flex: 1, minHeight: 160 }}>
          <video
            ref={localRef}
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }}
            autoPlay
            playsInline
            muted
          />
          <Text className="text-white text-xs mt-1 text-center">אני</Text>
        </View>
        {/* Remote */}
        <View style={{ flex: 1, minHeight: 220 }}>
          <video
            ref={remoteRef}
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12, background: '#111' }}
            autoPlay
            playsInline
          />
          <Text className="text-white text-xs mt-1 text-center">משפחה</Text>
        </View>
      </View>
      <Pressable
        onPress={props.onLeave}
        className="mb-6 self-center bg-red-600 px-10 py-4 rounded-full"
      >
        <Text className="text-white font-bold">סיים שיחה</Text>
      </Pressable>
    </View>
  );
}
