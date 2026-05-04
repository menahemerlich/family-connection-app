import {
  addDoc,
  collection,
  serverTimestamp,
  updateDoc,
  doc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { ChatType } from '@/types/models';

export async function createCallRecord(args: {
  familyId: string;
  initiator: string;
  participants: string[];
  type: ChatType;
}): Promise<string> {
  const ref = await addDoc(collection(db, 'families', args.familyId, 'calls'), {
    type: args.type,
    initiator: args.initiator,
    participants: args.participants,
    status: 'ringing',
    livekitRoom: '',
    startedAt: serverTimestamp(),
  });
  const room = `${args.familyId}-${ref.id}`;
  await updateDoc(ref, { livekitRoom: room });
  return ref.id;
}

export async function updateCallStatus(
  familyId: string,
  callId: string,
  status: 'ringing' | 'active' | 'ended' | 'declined' | 'missed',
) {
  await updateDoc(doc(db, 'families', familyId, 'calls', callId), {
    status,
    ...(status === 'ended' ? { endedAt: serverTimestamp() } : {}),
  });
}
