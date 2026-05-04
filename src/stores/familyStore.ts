import { create } from 'zustand';
import type { FamilyDoc, MemberDoc, UserDoc } from '@/types/models';

type FamilyState = {
  family: FamilyDoc | null;
  members: MemberDoc[];
  memberProfiles: Record<string, UserDoc>;
  setFamily: (family: FamilyDoc | null) => void;
  setMembers: (members: MemberDoc[]) => void;
  upsertMemberProfile: (profile: UserDoc) => void;
  setMemberProfiles: (profiles: Record<string, UserDoc>) => void;
  reset: () => void;
};

export const useFamilyStore = create<FamilyState>((set) => ({
  family: null,
  members: [],
  memberProfiles: {},
  setFamily: (family) => set({ family }),
  setMembers: (members) => set({ members }),
  upsertMemberProfile: (profile) =>
    set((s) => ({ memberProfiles: { ...s.memberProfiles, [profile.uid]: profile } })),
  setMemberProfiles: (memberProfiles) => set({ memberProfiles }),
  reset: () => set({ family: null, members: [], memberProfiles: {} }),
}));
