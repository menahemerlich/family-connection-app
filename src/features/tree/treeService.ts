import { addDoc, collection, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { TreeNodeDoc } from '@/types/models';

export async function addTreeNode(args: {
  familyId: string;
  node: Omit<TreeNodeDoc, 'id'>;
}) {
  const ref = await addDoc(collection(db, `families/${args.familyId}/tree`), {
    userId: args.node.userId ?? null,
    name: args.node.name ?? '',
    parents: args.node.parents ?? [],
    spouseId: args.node.spouseId ?? null,
    childrenIds: args.node.childrenIds ?? [],
  });
  return ref.id;
}

export async function deleteTreeNode(familyId: string, nodeId: string) {
  await deleteDoc(doc(db, `families/${familyId}/tree`, nodeId));
}

export async function linkNodes(
  familyId: string,
  nodeId: string,
  patch: Partial<Pick<TreeNodeDoc, 'parents' | 'spouseId' | 'childrenIds'>>,
) {
  await updateDoc(doc(db, `families/${familyId}/tree`, nodeId), patch);
}
