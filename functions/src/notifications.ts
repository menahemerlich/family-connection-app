import * as logger from 'firebase-functions/logger';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { db, messaging } from './admin';

export const onMessageCreate = onDocumentCreated(
  'families/{familyId}/chats/{chatId}/messages/{messageId}',
  async (event) => {
    const data = event.data?.data();
    if (!data) return;

    const { familyId, chatId } = event.params;
    const { senderId, type, text } = data as { senderId: string; type: string; text?: string };

    const chatSnap = await db.doc(`families/${familyId}/chats/${chatId}`).get();
    if (!chatSnap.exists) return;
    const chat = chatSnap.data() as { type: string; participants: string[]; title?: string };

    let recipientUids: string[] = [];
    if (chat.type === 'group') {
      const membersSnap = await db.collection(`families/${familyId}/members`).get();
      recipientUids = membersSnap.docs.map((d) => d.id).filter((u) => u !== senderId);
    } else {
      recipientUids = (chat.participants ?? []).filter((u) => u !== senderId);
    }

    if (!recipientUids.length) return;

    const senderSnap = await db.doc(`users/${senderId}`).get();
    const senderName = (senderSnap.data()?.displayName ?? 'משפחה') as string;

    const tokens: string[] = [];
    for (const uid of recipientUids) {
      const us = await db.doc(`users/${uid}`).get();
      const fcmTokens = (us.data()?.fcmTokens ?? []) as string[];
      tokens.push(...fcmTokens);
    }

    if (!tokens.length) {
      logger.info('No FCM tokens for chat', { familyId, chatId });
      return;
    }

    const body =
      type === 'text'
        ? text ?? ''
        : type === 'image'
          ? '📷 תמונה'
          : type === 'video'
            ? '🎥 סרטון'
            : type === 'audio'
              ? '🎤 הודעה קולית'
              : '📎 קובץ';

    const title = chat.type === 'group' ? `${senderName} ב${chat.title ?? 'משפחה'}` : senderName;

    try {
      await messaging.sendEachForMulticast({
        tokens,
        notification: { title, body: body.slice(0, 120) },
        data: {
          type: 'chat_message',
          familyId,
          chatId,
          messageId: event.params.messageId,
        },
        android: { priority: 'high' },
        apns: { headers: { 'apns-priority': '10' } },
      });
    } catch (err) {
      logger.error('FCM send failed', err);
    }
  },
);

export const onCallCreated = onDocumentCreated(
  'families/{familyId}/calls/{callId}',
  async (event) => {
    const data = event.data?.data();
    if (!data) return;

    const { familyId, callId } = event.params;
    const { initiator, participants, type } = data as {
      initiator: string;
      participants: string[];
      type: 'group' | 'private';
    };

    const recipientUids = (participants ?? []).filter((u) => u !== initiator);
    if (!recipientUids.length) return;

    const initiatorSnap = await db.doc(`users/${initiator}`).get();
    const initiatorName = (initiatorSnap.data()?.displayName ?? 'משפחה') as string;

    const tokens: string[] = [];
    for (const uid of recipientUids) {
      const us = await db.doc(`users/${uid}`).get();
      const fcmTokens = (us.data()?.fcmTokens ?? []) as string[];
      tokens.push(...fcmTokens);
    }
    if (!tokens.length) return;

    try {
      await messaging.sendEachForMulticast({
        tokens,
        notification: {
          title: type === 'group' ? 'שיחת וידאו משפחתית' : `${initiatorName} מתקשר/ת אליך`,
          body: 'הקש כדי לענות',
        },
        data: {
          type: 'incoming_call',
          familyId,
          callId,
          initiator,
        },
        android: { priority: 'high' },
        apns: { headers: { 'apns-priority': '10' } },
      });
    } catch (err) {
      logger.error('FCM call notify failed', err);
    }
  },
);
