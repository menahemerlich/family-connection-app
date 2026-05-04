import { useEffect } from 'react';
import { collection, doc, onSnapshot, query, where, documentId } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthStore } from '@/stores/authStore';
import { useFamilyStore } from '@/stores/familyStore';
import type { FamilyDoc, MemberDoc, UserDoc } from '@/types/models';

/**
 * Subscribes to the user's family + members + member profiles in real-time.
 */
export function useFamilyListener() {
  const familyId = useAuthStore((s) => s.profile?.familyId ?? null);
  const setFamily = useFamilyStore((s) => s.setFamily);
  const setMembers = useFamilyStore((s) => s.setMembers);
  const setMemberProfiles = useFamilyStore((s) => s.setMemberProfiles);
  const reset = useFamilyStore((s) => s.reset);

  useEffect(() => {
    if (!familyId) {
      reset();
      return;
    }

    const unsubFamily = onSnapshot(doc(db, 'families', familyId), (snap) => {
      if (snap.exists()) {
        setFamily({ id: snap.id, ...(snap.data() as Omit<FamilyDoc, 'id'>) });
      } else {
        setFamily(null);
      }
    });

    const unsubMembers = onSnapshot(
      collection(db, 'families', familyId, 'members'),
      (qs) => {
        const list: MemberDoc[] = qs.docs.map((d) => ({
          uid: d.id,
          ...(d.data() as Omit<MemberDoc, 'uid'>),
        }));
        setMembers(list);
      },
    );

    return () => {
      unsubFamily();
      unsubMembers();
    };
  }, [familyId, setFamily, setMembers, reset]);

  // Listen for member profiles
  const members = useFamilyStore((s) => s.members);
  useEffect(() => {
    if (!members.length) {
      setMemberProfiles({});
      return;
    }
    // Firestore "in" supports up to 30 ids; chunk if needed.
    const chunks: string[][] = [];
    for (let i = 0; i < members.length; i += 30) {
      chunks.push(members.slice(i, i + 30).map((m) => m.uid));
    }
    const profiles: Record<string, UserDoc> = {};
    const unsubs = chunks.map((ids) =>
      onSnapshot(query(collection(db, 'users'), where(documentId(), 'in', ids)), (qs) => {
        qs.docs.forEach((d) => {
          profiles[d.id] = { uid: d.id, ...(d.data() as Omit<UserDoc, 'uid'>) };
        });
        setMemberProfiles({ ...profiles });
      }),
    );

    return () => unsubs.forEach((u) => u());
  }, [members, setMemberProfiles]);
}
