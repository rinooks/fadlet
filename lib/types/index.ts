import { Timestamp } from 'firebase/firestore';

export type PostColor = 'yellow' | 'blue' | 'pink' | 'green' | 'purple' | 'gray';
export type UserRole = 'host' | 'member';
export type MessageType = 'text' | 'image' | 'file' | 'link';
export type BoardTemplate = 'free' | 'canvas' | 'brainstorming' | 'proscons' | 'kanban' | 'kpt' | '4f' | 'qna' | 'nineWindow';
export type LiveActivity = 'poll' | 'wordcloud';
export type ActivityType = BoardTemplate | LiveActivity;
export type BoardMode = 'single' | 'workshop';
export type EmojiType = 'thumbsup' | 'heart' | 'party' | 'bulb' | 'thinking';
export type ReportTarget = 'message' | 'post';
export type ReportStatus = 'open' | 'resolved';
export type WorkspaceRole = 'admin' | 'member';
export type BoardSkin = 'standard' | 'dense' | 'glass' | 'brutal' | 'swiss' | 'glassmorphism' | 'skeuomorphism' | 'terminal';
export type BoardBackground = 'plain' | 'dots' | 'grid' | 'paper' | 'mint' | 'lavender' | 'cream' | 'custom';

export interface BoardSettings {
  allowChat: boolean;
  retainChatLog: boolean;
  lockedAt: Timestamp | null;
  /** 포스트 이모지 반응 수 노출 여부. 미설정 시 true(기본 노출). 운영자에게는 항상 노출. */
  showPostReactionCounts?: boolean;
}

export interface PollConfig {
  question: string;
  options: string[];
  allowMultiple?: boolean;
}

export interface WordcloudConfig {
  prompt: string;
  maxLength?: number;
}

export interface QnaConfig {
  prompt: string;
}

export interface ActivityConfig {
  poll?: PollConfig;
  wordcloud?: WordcloudConfig;
  qna?: QnaConfig;
}

export interface Stage {
  id: string;
  title: string;
  durationSec: number;
  order: number;
  activityType?: ActivityType;
  activityConfig?: ActivityConfig;
}

export interface KanbanColumn {
  id: string;
  label: string;
  /** 헤더 배경 (HEX) */
  headerColor: string;
  /** 새 포스트 작성 시 기본 색상 */
  defaultPostColor: PostColor;
}

export interface ActivityState {
  resultsVisible: boolean;
  closed: boolean;
  updatedAt?: Timestamp;
}

export interface PollResponse {
  id: string;
  stageId: string;
  userId: string;
  optionIndexes: number[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface WordcloudEntry {
  id: string;
  stageId: string;
  userId: string;
  text: string;
  createdAt: Timestamp;
}

export interface QnaQuestion {
  id: string;
  stageId: string;
  authorId: string;
  authorName: string;
  text: string;
  upvotes: string[];
  answered: boolean;
  answer?: string;
  answeredAt?: Timestamp;
  answeredBy?: string;
  createdAt: Timestamp;
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
  mode?: BoardMode;
  skin?: BoardSkin;
  background?: BoardBackground;
  customBackgroundColor?: string;
  kanbanColumns?: KanbanColumn[];
  ownerId: string;
  workspaceId: string;
  isDemo?: boolean;
  maxParticipants?: number;
  settings: BoardSettings;
  stages?: Stage[];
  timer?: TimerState;
  pinnedAnnouncement?: PinnedAnnouncement | null;
  bannedWords?: string[];
  aiInsights?: BoardAiInsights | null;
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
  stageId?: string;
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

export interface MessageReplyTo {
  id: string;
  authorName: string;
  content: string;
  type: MessageType;
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
  replyTo?: MessageReplyTo;
  reactions?: Partial<Record<EmojiType, string[]>>;
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

export interface Operator {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  allowed: boolean;
  isSuperAdmin?: boolean;
  createdAt: Timestamp;
  lastLoginAt: Timestamp;
  reviewedAt?: Timestamp;
  reviewedBy?: string;
}

export interface AppSettings {
  geminiApiKey?: string;
  geminiModel?: string;
  updatedAt?: Timestamp;
  updatedBy?: string;
}

export interface BoardAiInsights {
  insights: string[];
  nextSteps: string[];
  summary?: string;
  model: string;
  generatedAt: Timestamp;
  generatedBy: string;
}

export interface Feedback {
  id: string;
  uid: string;
  email?: string;
  displayName?: string;
  message: string;
  url?: string;
  boardId?: string;
  userAgent?: string;
  createdAt: Timestamp;
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
