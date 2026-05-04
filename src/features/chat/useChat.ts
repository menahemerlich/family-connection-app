import { useEffect, useState } from 'react';
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { ChatDoc, MessageDoc } from '@/types/models';

export function useChats(familyId: string | null | undefined, uid: string | null | undefined) {
  const [chats, setChats] = useState<ChatDoc[]>([]);
  useEffect(() => {
    if (!familyId || !uid) return;
    const q = query(
      collection(db, 'families', familyId, 'chats'),
      where('participants', 'array-contains', uid),
      orderBy('lastMessageAt', 'desc'),
    );
    const unsub = onSnapshot(q, (qs) => {
      setChats(
        qs.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ChatDoc, 'id'>) })),
      );
    });
    return () => unsub();
  }, [familyId, uid]);
  return chats;
}

export function useGroupChat(familyId: string | null | undefined) {
  const [chat, setChat] = useState<ChatDoc | null>(null);
  useEffect(() => {
    if (!familyId) return;
    const unsub = onSnapshot(
      collection(db, 'families', familyId, 'chats'),
      (qs) => {
        const group = qs.docs.find((d) => d.id === 'group');
        if (group) setChat({ id: group.id, ...(group.data() as Omit<ChatDoc, 'id'>) });
      },
    );
    return () => unsub();
  }, [familyId]);
  return chat;
}

export function useMessages(
  familyId: string | null | undefined,
  chatId: string | null | undefined,
  pageSize = 50,
) {
  const [messages, setMessages] = useState<MessageDoc[]>([]);
  useEffect(() => {
    if (!familyId || !chatId) return;
    const q = query(
      collection(db, 'families', familyId, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'desc'),
      limit(pageSize),
    );
    const unsub = onSnapshot(q, (qs) => {
      setMessages(
        qs.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<MessageDoc, 'id'>) })).reverse(),
      );
    });
    return () => unsub();
  }, [familyId, chatId, pageSize]);
  return messages;
}

export function useTyping(
  familyId: string | null | undefined,
  chatId: string | null | undefined,
  excludeUid: string | null | undefined,
) {
  const [typers, setTypers] = useState<string[]>([]);
  useEffect(() => {
    if (!familyId || !chatId) return;
    const unsub = onSnapshot(
      collection(db, 'families', familyId, 'chats', chatId, 'typing'),
      (qs) => {
        const list = qs.docs.map((d) => d.id).filter((u) => u !== excludeUid);
        setTypers(list);
      },
    );
    return () => unsub();
  }, [familyId, chatId, excludeUid]);
  return typers;
}
