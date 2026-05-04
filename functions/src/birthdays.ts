import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as logger from 'firebase-functions/logger';
import { FieldValue } from 'firebase-admin/firestore';
import { db, messaging } from './admin';

/**
 * Daily check (07:00 Israel time) for birthdays in each family. Creates a calendar event
 * if missing for the year, and posts a system message to the family group chat.
 */
export const dailyBirthdayJob = onSchedule(
  { schedule: '0 7 * * *', timeZone: 'Asia/Jerusalem' },
  async () => {
    const today = new Date();
    const todayMonth = today.getMonth() + 1;
    const todayDay = today.getDate();
    const yearKey = today.getFullYear();

    const familiesSnap = await db.collection('families').get();
    for (const famDoc of familiesSnap.docs) {
      const familyId = famDoc.id;
      const membersSnap = await db.collection(`families/${familyId}/members`).get();

      for (const m of membersSnap.docs) {
        const userSnap = await db.doc(`users/${m.id}`).get();
        const profile = userSnap.data() as
          | { birthdate?: string; displayName?: string }
          | undefined;
        if (!profile?.birthdate) continue;

        const [yyyy, mm, dd] = profile.birthdate.split('-').map(Number);
        if (mm !== todayMonth || dd !== todayDay) continue;

        const eventId = `birthday-${m.id}-${yearKey}`;
        const eventRef = db.doc(`families/${familyId}/events/${eventId}`);
        if (!(await eventRef.get()).exists) {
          await eventRef.set({
            title: `יום הולדת ל${profile.displayName ?? 'בן/בת משפחה'}`,
            type: 'birthday',
            startsAt: new Date(yearKey, todayMonth - 1, todayDay),
            createdBy: 'system',
            relatedUserId: m.id,
          });
        }

        // Post a system message to the family group chat
        await db.collection(`families/${familyId}/chats/group/messages`).add({
          senderId: 'system',
          type: 'system',
          text: `🎂 היום יום הולדת ל${profile.displayName ?? 'בן/בת משפחה'}!${
            yyyy ? ' יום הולדת ' + (yearKey - yyyy) + '!' : ''
          }`,
          createdAt: FieldValue.serverTimestamp(),
          readBy: [],
          reactions: {},
        });

        // Notify all family members
        const tokens: string[] = [];
        for (const mm2 of membersSnap.docs) {
          const us = await db.doc(`users/${mm2.id}`).get();
          tokens.push(...(((us.data()?.fcmTokens ?? []) as string[]) ?? []));
        }
        if (tokens.length) {
          try {
            await messaging.sendEachForMulticast({
              tokens,
              notification: {
                title: '🎂 יום הולדת היום',
                body: `יום הולדת שמח ל${profile.displayName ?? 'בן/בת משפחה'}!`,
              },
              data: { type: 'birthday', familyId, userId: m.id },
            });
          } catch (err) {
            logger.error('birthday push failed', err);
          }
        }
      }
    }
  },
);
