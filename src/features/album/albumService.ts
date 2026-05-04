import { addDoc, collection, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';

export async function uploadAlbumMedia(args: {
  familyId: string;
  uid: string;
  uri: string;
  type: 'image' | 'video';
  caption?: string;
}) {
  const { familyId, uid, uri, type, caption } = args;
  const ext = uri.split('?')[0].split('.').pop() ?? 'jpg';
  const path = `families/${familyId}/album/${Date.now()}_${uid}.${ext}`;
  const blob = await fetch(uri).then((r) => r.blob());
  const sRef = storageRef(storage, path);
  await uploadBytes(sRef, blob);
  const mediaUrl = await getDownloadURL(sRef);
  await addDoc(collection(db, 'families', familyId, 'album'), {
    uploadedBy: uid,
    mediaUrl,
    type,
    caption: caption ?? '',
    createdAt: serverTimestamp(),
  });
}

export async function deleteAlbumItem(familyId: string, photoId: string) {
  await deleteDoc(doc(db, 'families', familyId, 'album', photoId));
}
