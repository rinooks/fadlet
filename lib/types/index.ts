import { Timestamp } from 'firebase/firestore';

export type PostColor = 'yellow' | 'blue' | 'pink' | 'green' | 'purple' | 'gray';
export type UserRole = 'host' | 'member';
export type MessageType = 'text' | 'image' | 'file' | 'link';
export type BoardTemplate = 'free' | 'canvas' | 'brainstorming' | 'proscons' | 'kpt' | '4f' | 'qna' | 'nineWindow';
export type EmojiType = 'thumbsup' | 'heart' | 'party' | 'bulb' | 'thinking';
export type ReportTarget = 'message' | 'post';
export type ReportStatus = 'open' | 'resolved';
export type WorkspaceRole = 'admin' | 'member';
export type BoardSkin = 'standard' | 'dense' | 'glass' | 'brutal';

export interface BoardSettings {
  allowChat: boolean;
  retainChatLog: boolean;
  lockedAt: Timestamp | null;
}

export interface Stage {
  id: string;
  title: string;
  durationSec: number;
  order: number;
}

export type TimerStatus = 'idle' | 'running' | 'paused';

export interface TimerState {
  stageId: string | null;
  status: TimerStatus;
  startedAt: number | null;
  pausedAt: number | null;
  accumulatedMs: number;
}

export interface PinnedAnnouncement {
  content: string;
  byUserId: string;
  byName: string;
  pinnedAt: Timestamp;
}

export interface Board {
  id: string;
  title: string;
  boardCode: string;
  template: BoardTemplate;
  skin?: BoardSkin;
  ownerId: string;
  workspaceId: string;
  settings: BoardSettings;
  stages?: Stage[];
  timer?: TimerState;
  pinnedAnnouncement?: PinnedAnnouncement | null;
  bannedWords?: string[];
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
  order?: number;
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

export interface Workspace {
  id: string;
  name: string;
  workspaceCode: string;
  ownerUid: string;
  createdAt: Timestamp;
}

export interface WorkspaceMember {
  uid: string;
  role: WorkspaceRole;
  displayName: string;
  email?: string;
  joinedAt: Timestamp;
}

export interface Report {
  id: string;
  targetType: ReportTarget;
  targetId: string;
  targetSnapshot: string;
  reporterId: string;
  reporterName: string;
  reason: string;
  status: ReportStatus;
  resolvedById?: string;
  resolvedAt?: Timestamp;
  createdAt: Timestamp;
}
