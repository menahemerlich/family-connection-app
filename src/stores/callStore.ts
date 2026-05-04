import { create } from 'zustand';

export type IncomingCallPayload = {
  familyId: string;
  callId: string;
  initiatorName: string;
};

type CallState = {
  incoming: IncomingCallPayload | null;
  setIncoming: (c: IncomingCallPayload | null) => void;
};

export const useCallStore = create<CallState>((set) => ({
  incoming: null,
  setIncoming: (incoming) => set({ incoming }),
}));
