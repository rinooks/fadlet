import { Timestamp } from 'firebase/firestore';

export type PostColor = 'yellow' | 'blue' | 'pink' | 'green' | 'purple' | 'gray';
export type UserRole = 'host' | 'member';
export type MessageType = 'text' | 'image' | 'file' | 'link';
export type BoardTemplate = 'free' | 'brainstorming' | 'kpt' | '4f' | 'qna' | 'nineWindow';
export type EmojiType = 'thumbsup' | 'heart' | 'party' | 'bulb' | 'thinking';

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
  imageUrl?: string;
  color: PostColor;
  columnId?: string;
  position: { x: number; y: number } | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: Timestamp;
}

export interface Reaction {
  userId: string;
  emoji: EmojiType;
  createdAt: Timestamp;
}

export interface LinkPreview {
  url: string;
  title: string;
  description: string;
  image: string;
  siteName: string;
}

export interface Message {
  id: string;
  authorId: string;
  authorName: string;
  role: UserRole;
  type: MessageType;
  content: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  linkPreview?: LinkPreview;
  createdAt: Timestamp;
}

export interface Participant {
  nickname: string;
  role: UserRole;
  joinedAt: Timestamp;
  lastActiveAt: Timestamp;
  isOnline: boolean;
}
