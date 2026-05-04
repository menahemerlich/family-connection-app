import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import type { ChatDoc, MediaMeta, MessageType } from '@/types/models';

export const GROUP_CHAT_ID = 'group';

export function privateChatId(uidA: string, uidB: string): string {
  return [uidA, uidB].sort().join('_');
}

export async function ensurePrivateChat(
  familyId: string,
  uidA: string,
  uidB: string,
): Promise<string> {
  const chatId = privateChatId(uidA, uidB);
  const ref = doc(db, 'families', familyId, 'chats', chatId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      type: 'private',
      participants: [uidA, uidB],
      lastMessage: null,
      lastMessageAt: serverTimestamp(),
    });
  }
  return chatId;
}

async function updateChatLastMessage(
  familyId: string,
  chatId: string,
  text: string,
  senderId: string,
) {
  await updateDoc(doc(db, 'families', familyId, 'chats', chatId), {
    lastMessage: text,
    lastMessageAt: serverTimestamp(),
    lastSenderId: senderId,
  });
}

export async function sendTextMessage(args: {
  familyId: string;
  chatId: string;
  senderId: string;
  text: string;
}) {
  const { familyId, chatId, senderId, text } = args;
  await addDoc(collection(db, 'families', familyId, 'chats', chatId, 'messages'), {
    senderId,
    type: 'text' as MessageType,
    text,
    createdAt: serverTimestamp(),
    readBy: [senderId],
    reactions: {},
  });
  await updateChatLastMessage(familyId, chatId, text.slice(0, 80), senderId);
}

export async function sendMediaMessage(args: {
  familyId: string;
  chatId: string;
  senderId: string;
  type: Extract<MessageType, 'image' | 'video' | 'audio' | 'file'>;
  uri: string;
  mediaMeta?: MediaMeta;
  caption?: string;
}) {
  const { familyId, chatId, senderId, type, uri, mediaMeta, caption } = args;

  const fileExt = uri.split('?')[0].split('.').pop() ?? 'bin';
  const path = `families/${familyId}/chats/${chatId}/${Date.now()}_${senderId}.${fileExt}`;

  const blob = await fetch(uri).then((r) => r.blob());
  const sRef = storageRef(storage, path);
  await uploadBytes(sRef, blob, { contentType: mediaMeta?.mimeType });
  const mediaUrl = await getDownloadURL(sRef);

  await addDoc(collection(db, 'families', familyId, 'chats', chatId, 'messages'), {
    senderId,
    type,
    text: caption ?? '',
    mediaUrl,
    mediaMeta: mediaMeta ?? {},
    createdAt: serverTimestamp(),
    readBy: [senderId],
    reactions: {},
  });

  const preview =
    type === 'image' ? '📷 תמונה' : type === 'video' ? '🎥 סרטון' : type === 'audio' ? '🎤 הודעה קולית' : '📎 קובץ';
  await updateChatLastMessage(familyId, chatId, caption || preview, senderId);
}

export async function toggleReaction(args: {
  familyId: string;
  chatId: string;
  messageId: string;
  uid: string;
  emoji: string;
  add: boolean;
}) {
  const ref = doc(db, 'families', args.familyId, 'chats', args.chatId, 'messages', args.messageId);
  const fieldKey = `reactions.${args.emoji}`;
  await updateDoc(ref, {
    [fieldKey]: args.add ? arrayUnion(args.uid) : arrayRemove(args.uid),
  });
}

export async function markRead(args: {
  familyId: string;
  chatId: string;
  messageId: string;
  uid: string;
}) {
  const ref = doc(db, 'families', args.familyId, 'chats', args.chatId, 'messages', args.messageId);
  await updateDoc(ref, { readBy: arrayUnion(args.uid) });
}

export async function deleteMessage(args: {
  familyId: string;
  chatId: string;
  messageId: string;
}) {
  await deleteDoc(
    doc(db, 'families', args.familyId, 'chats', args.chatId, 'messages', args.messageId),
  );
}

export async function setTyping(args: {
  familyId: string;
  chatId: string;
  uid: string;
  isTyping: boolean;
}) {
  const ref = doc(db, 'families', args.familyId, 'chats', args.chatId, 'typing', args.uid);
  if (args.isTyping) {
    await setDoc(ref, { uid: args.uid, at: serverTimestamp() });
  } else {
    await deleteDoc(ref).catch(() => undefined);
  }
}
