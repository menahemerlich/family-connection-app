import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '@/lib/firebase';
import { describeFunctionsError } from '@/lib/authMessages';
import type { FamilyDoc } from '@/types/models';

/**
 * Creates a family in Firestore and registers the creator as the owner-member.
 * Also creates the default family-wide group chat.
 */
export async function createFamily(args: {
  name: string;
  ownerUid: string;
}): Promise<FamilyDoc> {
  const familyRef = await addDoc(collection(db, 'families'), {
    name: args.name,
    ownerUid: args.ownerUid,
    createdAt: serverTimestamp(),
  });

  const batch = writeBatch(db);

  batch.set(doc(db, 'families', familyRef.id, 'members', args.ownerUid), {
    uid: args.ownerUid,
    role: 'owner',
    joinedAt: serverTimestamp(),
  });

  batch.set(doc(db, 'families', familyRef.id, 'chats', 'group'), {
    type: 'group',
    participants: [args.ownerUid],
    title: args.name,
    lastMessage: null,
    lastMessageAt: serverTimestamp(),
  });

  batch.update(doc(db, 'users', args.ownerUid), { familyId: familyRef.id });

  await batch.commit();

  return { id: familyRef.id, name: args.name, ownerUid: args.ownerUid };
}

const callableSendInvite = httpsCallable<
  { familyId: string; email: string },
  { ok: boolean; inviteId: string }
>(functions, 'sendInvite');

const callableAcceptInvite = httpsCallable<{ token: string }, { ok: boolean; familyId: string }>(
  functions,
  'acceptInvite',
);

export async function sendInvite(familyId: string, email: string) {
  try {
    const res = await callableSendInvite({ familyId, email });
    return res.data;
  } catch (e: unknown) {
    const { title, hint } = describeFunctionsError(e);
    throw new Error(hint ? `${title}\n\n${hint}` : title);
  }
}

export async function acceptInvite(token: string) {
  try {
    const res = await callableAcceptInvite({ token });
    return res.data;
  } catch (e: unknown) {
    const { title, hint } = describeFunctionsError(e);
    throw new Error(hint ? `${title}\n\n${hint}` : title);
  }
}

export async function fetchFamily(familyId: string): Promise<FamilyDoc | null> {
  const snap = await getDoc(doc(db, 'families', familyId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Omit<FamilyDoc, 'id'>) };
}

export async function updateMemberRelation(
  familyId: string,
  uid: string,
  relation: string,
) {
  await updateDoc(doc(db, 'families', familyId, 'members', uid), { relation });
}

/**
 * Fallback for tests: register a member directly (used by Cloud Function in production).
 */
export async function joinFamilyDirectly(familyId: string, uid: string) {
  await setDoc(
    doc(db, 'families', familyId, 'members', uid),
    { uid, role: 'member', joinedAt: serverTimestamp() },
    { merge: true },
  );
  await updateDoc(doc(db, 'users', uid), { familyId });
}
