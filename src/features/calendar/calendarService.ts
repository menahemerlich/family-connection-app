import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  updateDoc,
} from 'firebase/firestore';import { db } from '@/lib/firebase';
import type { EventType } from '@/types/models';

export async function createEvent(args: {
  familyId: string;
  uid: string;
  title: string;
  startsAt: Date;
  endsAt?: Date;
  location?: string;
  type: EventType;
  description?: string;
}) {
  await addDoc(collection(db, `families/${args.familyId}/events`), {
    title: args.title,
    description: args.description ?? '',
    startsAt: Timestamp.fromDate(args.startsAt),
    endsAt: args.endsAt ? Timestamp.fromDate(args.endsAt) : null,
    location: args.location ?? '',
    type: args.type,
    createdBy: args.uid,
    attendees: [],
  });
}

export async function deleteEvent(familyId: string, eventId: string) {
  await deleteDoc(doc(db, `families/${familyId}/events`, eventId));
}

export async function updateEventMeta(
  familyId: string,
  eventId: string,
  data: { title?: string; location?: string },
) {
  await updateDoc(doc(db, `families/${familyId}/events`, eventId), data);
}
