import { useEffect } from 'react';
import {
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useCallStore } from '@/stores/callStore';

/**
 * Watches recent calls involving the current user and surfaces an incoming ring when
 * another member starts a call with status "ringing".
 */
export function useIncomingCallListener(
  familyId: string | null | undefined,
  uid: string | null | undefined,
) {
  const setIncoming = useCallStore((s) => s.setIncoming);

  useEffect(() => {
    if (!familyId || !uid) {
      setIncoming(null);
      return;
    }

    const q = query(
      collection(db, 'families', familyId, 'calls'),
      where('participants', 'array-contains', uid),
      limit(25),
    );

    const unsub = onSnapshot(q, (snap) => {
      let found: { id: string; initiator: string } | null = null;
      snap.forEach((docSnap) => {
        const d = docSnap.data() as {
          status: string;
          initiator: string;
        };
        if (d.status === 'ringing' && d.initiator !== uid) {
          if (!found) found = { id: docSnap.id, initiator: d.initiator };
        }
      });

      if (found === null) {
        setIncoming(null);
        return;
      }

      const match: { id: string; initiator: string } = found;

      void (async () => {
        try {
          const u = await getDoc(doc(db, 'users', match.initiator));
          const name = (u.data()?.displayName as string) ?? 'משפחה';
          setIncoming({ familyId, callId: match.id, initiatorName: name });
        } catch {
          setIncoming({ familyId, callId: match.id, initiatorName: 'משפחה' });
        }
      })();
    });

    return () => unsub();
  }, [familyId, uid, setIncoming]);
}
