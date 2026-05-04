import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { ListDoc, ListItem, ListType } from '@/types/models';

export async function createList(args: {
  familyId: string;
  uid: string;
  name: string;
  type: ListType;
}) {
  const ref = await addDoc(collection(db, `families/${args.familyId}/lists`), {
    name: args.name,
    type: args.type,
    items: [] as ListItem[],
    createdBy: args.uid,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function addListItem(familyId: string, listId: string, text: string) {
  const ref = doc(db, `families/${familyId}/lists`, listId);
  const snap = await getDoc(ref);
  const data = snap.data() as ListDoc | undefined;
  const items = [...(data?.items ?? [])];
  items.push({ id: `${Date.now()}`, text, done: false });
  await updateDoc(ref, { items });
}

export async function toggleItem(
  familyId: string,
  listId: string,
  itemId: string,
  uid: string,
  done: boolean,
) {
  const ref = doc(db, `families/${familyId}/lists`, listId);
  const snap = await getDoc(ref);
  const data = snap.data() as ListDoc | undefined;
  const items = (data?.items ?? []).map((it) =>
    it.id === itemId
      ? {
          ...it,
          done,
          doneBy: done ? uid : undefined,
          doneAt: done ? Timestamp.now() : null,
        }
      : it,
  );
  await updateDoc(ref, { items });
}

export async function deleteList(familyId: string, listId: string) {
  await deleteDoc(doc(db, `families/${familyId}/lists`, listId));
}
