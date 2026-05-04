import * as functions from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { AccessToken } from 'livekit-server-sdk';
import { db } from './admin';

const LIVEKIT_API_KEY = defineSecret('LIVEKIT_API_KEY');
const LIVEKIT_API_SECRET = defineSecret('LIVEKIT_API_SECRET');
const LIVEKIT_URL = defineSecret('LIVEKIT_URL');

export const livekitToken = functions.onCall(
  { secrets: [LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_URL] },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new functions.HttpsError('unauthenticated', 'Sign in required');

    const { familyId, callId, identity, name } = request.data as {
      familyId: string;
      callId: string;
      identity: string;
      name?: string;
    };
    if (!familyId || !callId || !identity) {
      throw new functions.HttpsError('invalid-argument', 'familyId, callId, identity required');
    }

    const memberSnap = await db.doc(`families/${familyId}/members/${uid}`).get();
    if (!memberSnap.exists) {
      throw new functions.HttpsError('permission-denied', 'Not a family member');
    }

    const roomName = `${familyId}-${callId}`;
    const at = new AccessToken(LIVEKIT_API_KEY.value(), LIVEKIT_API_SECRET.value(), {
      identity,
      name: name ?? identity,
      ttl: 60 * 60,
    });
    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();

    return { token, url: LIVEKIT_URL.value() };
  },
);
