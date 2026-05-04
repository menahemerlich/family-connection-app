import { useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, Text, View, useWindowDimensions } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { Screen } from '@/components/Screen';
import { useAuthStore } from '@/stores/authStore';
import { db } from '@/lib/firebase';
import type { AlbumPhotoDoc } from '@/types/models';
import { uploadAlbumMedia } from '@/features/album/albumService';

export default function AlbumScreen() {
  const { t } = useTranslation();
  const me = useAuthStore((s) => s.profile);
  const familyId = me?.familyId;
  const { width } = useWindowDimensions();
  const colW = (width - 48) / 2;

  const [items, setItems] = useState<AlbumPhotoDoc[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!familyId) return;
    const q = query(collection(db, 'families', familyId, 'album'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (qs) =>
      setItems(qs.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AlbumPhotoDoc, 'id'>) }))),
    );
  }, [familyId]);

  const pick = async () => {
    if (!familyId || !me?.uid) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.85,
    });
    if (res.canceled || !res.assets?.length) return;
    setUploading(true);
    try {
      for (const a of res.assets) {
        if (a.uri) {
          await uploadAlbumMedia({
            familyId,
            uid: me.uid,
            uri: a.uri,
            type: 'image',
          });
        }
      }
    } catch (e) {
      Alert.alert(t('common.error'), e instanceof Error ? e.message : 'שגיאה');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Screen padded={false}>
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <Text className="text-xl font-bold text-gray-900 dark:text-white">{t('album.title')}</Text>
        <Pressable
          onPress={() => void pick()}
          disabled={uploading}
          className="flex-row items-center gap-2 bg-brand-600 px-3 py-2 rounded-full"
        >
          <Ionicons name="cloud-upload-outline" size={18} color="#fff" />
          <Text className="text-white font-semibold">{t('album.upload')}</Text>
        </Pressable>
      </View>
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        ListEmptyComponent={<Text className="text-center text-gray-500 mt-10">{t('album.empty')}</Text>}
        renderItem={({ item }) => (
          <View style={{ width: colW }} className="rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800">
            <Image source={{ uri: item.mediaUrl }} style={{ width: '100%', height: colW }} contentFit="cover" />
            {item.caption ? (
              <Text className="text-xs text-gray-600 dark:text-gray-300 p-2" numberOfLines={2}>
                {item.caption}
              </Text>
            ) : null}
          </View>
        )}
      />
    </Screen>
  );
}
