import type { Timestamp } from 'firebase/firestore';

export type UserDoc = {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string | null;
  phone?: string | null;
  birthdate?: string | null;
  familyId?: string | null;
  fcmTokens?: string[];
  locale?: 'he' | 'en';
  isOnline?: boolean;
  lastSeenAt?: Timestamp | null;
  locationOptIn?: boolean;
  createdAt?: Timestamp;
};

export type MemberRole = 'owner' | 'admin' | 'member' | 'child';

export type FamilyDoc = {
  id: string;
  name: string;
  photoURL?: string | null;
  ownerUid: string;
  createdAt?: Timestamp;
};

export type MemberDoc = {
  uid: string;
  role: MemberRole;
  relation?: string;
  joinedAt?: Timestamp;
};

export type InviteDoc = {
  id: string;
  email: string;
  token: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  invitedBy: string;
  createdAt?: Timestamp;
  expiresAt?: Timestamp;
};

export type ChatType = 'group' | 'private';

export type ChatDoc = {
  id: string;
  type: ChatType;
  participants: string[];
  title?: string;
  lastMessage?: string | null;
  lastMessageAt?: Timestamp | null;
  lastSenderId?: string | null;
};

export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'file' | 'system';

export type MediaMeta = {
  width?: number;
  height?: number;
  durationMs?: number;
  size?: number;
  mimeType?: string;
};

export type MessageDoc = {
  id: string;
  senderId: string;
  type: MessageType;
  text?: string;
  mediaUrl?: string;
  mediaMeta?: MediaMeta;
  createdAt?: Timestamp;
  reactions?: Record<string, string[]>;
  readBy?: string[];
};

export type AlbumPhotoDoc = {
  id: string;
  uploadedBy: string;
  mediaUrl: string;
  type: 'image' | 'video';
  caption?: string;
  thumbnailUrl?: string;
  createdAt?: Timestamp;
};

export type EventType = 'birthday' | 'general';

export type EventDoc = {
  id: string;
  title: string;
  description?: string;
  startsAt: Timestamp;
  endsAt?: Timestamp;
  location?: string;
  type: EventType;
  createdBy: string;
  attendees?: string[];
  relatedUserId?: string | null;
};

export type ListType = 'shopping' | 'todo';

export type ListItem = {
  id: string;
  text: string;
  done: boolean;
  doneBy?: string;
  doneAt?: Timestamp | null;
};

export type ListDoc = {
  id: string;
  name: string;
  type: ListType;
  items: ListItem[];
  createdBy: string;
  createdAt?: Timestamp;
};

export type TreeNodeDoc = {
  id: string;
  userId?: string | null;
  name?: string;
  parents?: string[];
  spouseId?: string | null;
  childrenIds?: string[];
};

export type CallDoc = {
  id: string;
  type: ChatType;
  initiator: string;
  participants: string[];
  status: 'ringing' | 'active' | 'ended' | 'declined' | 'missed';
  livekitRoom: string;
  startedAt?: Timestamp;
  endedAt?: Timestamp;
};

export type LocationDoc = {
  uid: string;
  lat: number;
  lng: number;
  accuracy?: number;
  updatedAt?: Timestamp;
};
