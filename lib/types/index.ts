import { Timestamp } from 'firebase/firestore';

export type PostColor = 'yellow' | 'blue' | 'pink' | 'green' | 'purple' | 'gray';
export type UserRole = 'host' | 'member';
export type MessageType = 'text';
export type BoardTemplate = 'free';

export interface BoardSettings {
  allowChat: boolean;
  retainChatLog: boolean;
  lockedAt: Timestamp | null;
}

export interface Board {
  id: string;
  title: string;
  boardCode: string;
  template: BoardTemplate;
  ownerId: string;
  workspaceId: string;
  settings: BoardSettings;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  color: PostColor;
  position: { x: number; y: number } | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Message {
  id: string;
  authorId: string;
  authorName: string;
  role: UserRole;
  type: MessageType;
  content: string;
  createdAt: Timestamp;
}

export interface Participant {
  nickname: string;
  role: UserRole;
  joinedAt: Timestamp;
  lastActiveAt: Timestamp;
  isOnline: boolean;
}
