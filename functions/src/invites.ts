import * as functions from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { Resend } from 'resend';
import { randomBytes } from 'crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from './admin';

const RESEND_API_KEY = defineSecret('RESEND_API_KEY');
const RESEND_FROM = defineSecret('RESEND_FROM');
const APP_PUBLIC_URL = defineSecret('APP_PUBLIC_URL');

const INVITE_EXPIRY_DAYS = 14;

export const sendInvite = functions.onCall(
  { secrets: [RESEND_API_KEY, RESEND_FROM, APP_PUBLIC_URL], cors: true },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new functions.HttpsError('unauthenticated', 'Sign in required');

    const { familyId, email } = request.data as { familyId: string; email: string };
    if (!familyId || !email) {
      throw new functions.HttpsError('invalid-argument', 'familyId and email are required');
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      throw new functions.HttpsError('invalid-argument', 'Invalid email');
    }

    const familySnap = await db.doc(`families/${familyId}`).get();
    if (!familySnap.exists) {
      throw new functions.HttpsError('not-found', 'Family not found');
    }
    const family = familySnap.data() as { ownerUid: string; name: string };
    const memberSnap = await db.doc(`families/${familyId}/members/${uid}`).get();
    const memberRole = (memberSnap.data()?.role ?? 'member') as string;
    if (family.ownerUid !== uid && memberRole !== 'admin' && memberRole !== 'owner') {
      throw new functions.HttpsError('permission-denied', 'Only family admins can invite');
    }

    const token = randomBytes(24).toString('base64url');
    const expiresAt = new Date(Date.now() + INVITE_EXPIRY_DAYS * 86400 * 1000);

    const inviteRef = await db.collection(`families/${familyId}/invites`).add({
      email: normalizedEmail,
      token,
      status: 'pending',
      invitedBy: uid,
      createdAt: FieldValue.serverTimestamp(),
      expiresAt,
    });

    const publicUrl = process.env.APP_PUBLIC_URL ?? APP_PUBLIC_URL.value();
    const deepLink = `familyconnect://join/${token}`;
    const webLink = `${publicUrl}/join/${token}`;

    const resend = new Resend(RESEND_API_KEY.value());
    const inviterSnap = await db.doc(`users/${uid}`).get();
    const inviterName = (inviterSnap.data()?.displayName ?? 'בן משפחה') as string;

    try {
      await resend.emails.send({
        from: RESEND_FROM.value(),
        to: normalizedEmail,
        subject: `${inviterName} הזמין/ה אותך להצטרף ל"${family.name}" באפליקציית קשר משפחתי`,
        html: `
          <div dir="rtl" style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1a1a1a">
            <h1 style="color:#1f63f0">קשר משפחתי</h1>
            <p>שלום!</p>
            <p><strong>${escapeHtml(inviterName)}</strong> הזמין/ה אותך להצטרף ל-<strong>${escapeHtml(
          family.name,
        )}</strong> באפליקציית "קשר משפחתי" - המקום שבו המשפחה נשארת קרובה.</p>
            <p style="margin:32px 0">
              <a href="${webLink}" style="background:#1f63f0;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block">
                הצטרף עכשיו
              </a>
            </p>
            <p style="font-size:12px;color:#666">או הדבק את הקישור הבא בדפדפן:<br/>${webLink}</p>
            <p style="font-size:12px;color:#666">פתחת כבר את האפליקציה? הקישור הזה יפתח אותה ישירות:<br/>${deepLink}</p>
            <p style="font-size:11px;color:#999;margin-top:32px">ההזמנה תפוג בעוד ${INVITE_EXPIRY_DAYS} ימים.</p>
          </div>
        `,
      });
    } catch (err) {
      console.error('[sendInvite] Resend failed', err);
      throw new functions.HttpsError('internal', 'Failed to send email');
    }

    return { ok: true, inviteId: inviteRef.id };
  },
);

export const acceptInvite = functions.onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new functions.HttpsError('unauthenticated', 'Sign in required');

  const { token } = request.data as { token: string };
  if (!token) throw new functions.HttpsError('invalid-argument', 'token is required');

  const invitesSnap = await db.collectionGroup('invites').where('token', '==', token).limit(1).get();
  if (invitesSnap.empty) {
    throw new functions.HttpsError('not-found', 'Invalid invite');
  }
  const inviteDoc = invitesSnap.docs[0];
  const invite = inviteDoc.data() as {
    status: string;
    expiresAt: FirebaseFirestore.Timestamp;
    email: string;
  };
  if (invite.status !== 'pending') {
    throw new functions.HttpsError('failed-precondition', 'Invite no longer valid');
  }
  if (invite.expiresAt && invite.expiresAt.toMillis() < Date.now()) {
    await inviteDoc.ref.update({ status: 'expired' });
    throw new functions.HttpsError('failed-precondition', 'Invite expired');
  }

  const familyId = inviteDoc.ref.parent.parent!.id;

  const batch = db.batch();
  batch.set(db.doc(`families/${familyId}/members/${uid}`), {
    uid,
    role: 'member',
    joinedAt: FieldValue.serverTimestamp(),
  });
  batch.update(db.doc(`users/${uid}`), { familyId });
  batch.update(inviteDoc.ref, {
    status: 'accepted',
    acceptedAt: FieldValue.serverTimestamp(),
    acceptedBy: uid,
  });
  // Add user to the family group chat participants
  batch.update(db.doc(`families/${familyId}/chats/group`), {
    participants: FieldValue.arrayUnion(uid),
  });

  await batch.commit();

  return { ok: true, familyId };
});

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
