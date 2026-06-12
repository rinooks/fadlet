'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronLeft } from 'lucide-react';
import { use, useEffect, useRef, useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy } from '@dnd-kit/sortable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CanvasBoard } from '@/components/board/canvas-board';
import { ColumnBoard } from '@/components/board/column-board';
import { ProsConsBoard } from '@/components/board/pros-cons-board';
import { FacilitatorPanel } from '@/components/board/facilitator-panel';
import { AiInsightsCard } from '@/components/board/ai-insights-card';
import { HostActionsMenu } from '@/components/board/host-actions-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { HostOnboarding } from '@/components/board/host-onboarding';
import { NewPostDialog } from '@/components/board/new-post-dialog';
import { ReportsPanel } from '@/components/board/reports-panel';
import { SortablePostCard } from '@/components/board/sortable-post-card';
import { PostDetailModal } from '@/components/board/post-detail-modal';
import { PostDeleteDialog } from '@/components/board/post-delete-dialog';
import { MoveBoardDialog } from '@/components/board/move-board-dialog';
import { StageBanner } from '@/components/board/stage-banner';
import { ChatPanel } from '@/components/chat/chat-panel';
import { PollBoard } from '@/components/activities/poll-board';
import { WordcloudBoard } from '@/components/activities/wordcloud-board';
import { QnaBoard } from '@/components/activities/qna-board';
import { ExportMenu } from '@/components/shared/export-menu';
import { FeedbackButton } from '@/components/shared/feedback-button';
import { ShareDialog } from '@/components/shared/share-dialog';
import { getTemplate, isColumnEditableTemplate } from '@/lib/templates';
import { getActivity, isLiveActivity } from '@/lib/activities';
import { useAuth } from '@/lib/hooks/use-auth';
import { useBoard } from '@/lib/hooks/use-board';
import { useLockBoard } from '@/lib/hooks/use-lock-board';
import { useMessages } from '@/lib/hooks/use-messages';
import { useParticipants } from '@/lib/hooks/use-participants';
import { usePresence } from '@/lib/hooks/use-presence';
import { usePosts } from '@/lib/hooks/use-posts';
import { useReports } from '@/lib/hooks/use-reports';
import { useTimer } from '@/lib/hooks/use-timer';
import { findBannedHit } from '@/lib/hooks/use-banned-words';
import { auth, db } from '@/lib/firebase/client';
import { boardsPath, messagesPath, workspaceMembersPath } from '@/lib/firebase/collections';
import { deleteDoc, doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import type { BoardBackground, BoardSkin, BoardTemplate, EmojiType, KanbanColumn, MessageReplyTo, Post, PostColor, TimerState, UserRole } from '@/lib/types';
import { getBackground } from '@/lib/backgrounds';
import { DEFAULT_KANBAN_COLUMNS, DEFAULT_CATEGORY_COLUMNS } from '@/lib/kanban-colors';
import { cloneBoard } from '@/lib/utils/clone-board';
import { FREE_TIER_LIMIT_CODE, showUpgradeMessage } from '@/lib/free-tier';

interface PageProps {
  params: Promise<{ boardId: string }>;
  searchParams: Promise<{ code?: string }>;
}

const IDLE_TIMER: TimerState = {
  stageId: null,
  status: 'idle',
  startedAt: null,
  pausedAt: null,
  accumulatedMs: 0,
};

// 데스크톱 채팅 패널 너비(px) — 드래그로 조절, localStorage에 기억
const CHAT_WIDTH_DEFAULT = 320;
const CHAT_WIDTH_MIN = 280;
const CHAT_WIDTH_MAX = 640;
const CHAT_WIDTH_KEY = 'fadlet-chat-width';

export default function BoardPage({ params, searchParams }: PageProps) {
  const { boardId } = use(params);
  const { code } = use(searchParams);
  const router = useRouter();
  const { uid, loading: authLoading } = useAuth();

  const [role, setRole] = useState<UserRole>('member');
  const [nickname, setNickname] = useState('');
  const [isWsAdmin, setIsWsAdmin] = useState(false);
  const [isWsMember, setIsWsMember] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showDesktopChat, setShowDesktopChat] = useState(true);
  const [chatWidth, setChatWidth] = useState(CHAT_WIDTH_DEFAULT);
  const chatWidthRef = useRef(CHAT_WIDTH_DEFAULT);
  const chatPanelRef = useRef<HTMLDivElement>(null);
  const chatResizingRef = useRef(false);
  const [showNewPost, setShowNewPost] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showFacilitator, setShowFacilitator] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [showMoveBoard, setShowMoveBoard] = useState(false);
  const [showAiInsights, setShowAiInsights] = useState(false);
  const [detailPost, setDetailPost] = useState<Post | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ postId: string; resolve: () => void } | null>(null);
  const [joined, setJoined] = useState(false);
  const [needNickname, setNeedNickname] = useState(false);
  const [nicknameInput, setNicknameInput] = useState('');
  const [joining, setJoining] = useState(false);

  // 저장된 채팅 너비 복원
  useEffect(() => {
    const saved = Number(localStorage.getItem(CHAT_WIDTH_KEY));
    if (saved >= CHAT_WIDTH_MIN && saved <= CHAT_WIDTH_MAX) {
      /* eslint-disable-next-line react-hooks/set-state-in-effect */
      setChatWidth(saved);
      chatWidthRef.current = saved;
    }
  }, []);

  // 채팅 패널 드래그 리사이즈 (드래그 중엔 DOM만 갱신해 보드 리렌더 방지, 놓을 때 1회 커밋)
  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!chatResizingRef.current) return;
      const next = Math.min(CHAT_WIDTH_MAX, Math.max(CHAT_WIDTH_MIN, window.innerWidth - e.clientX));
      chatWidthRef.current = next;
      if (chatPanelRef.current) chatPanelRef.current.style.width = `${next}px`;
    }
    function onUp() {
      if (!chatResizingRef.current) return;
      chatResizingRef.current = false;
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      setChatWidth(chatWidthRef.current);
      try { localStorage.setItem(CHAT_WIDTH_KEY, String(chatWidthRef.current)); } catch { /* 무시 */ }
    }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  function startChatResize(e: React.MouseEvent) {
    e.preventDefault();
    chatResizingRef.current = true;
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
  }

  const { board, loading: boardLoading, error: boardError } = useBoard(boardId);
  const { posts, loading: postsLoading, addPost, updatePost, updatePosition, deletePost, reorderPosts } = usePosts(boardId);
  const { messages, loading: msgsLoading, sendMessage, toggleReaction } = useMessages(boardId);
  const { joinBoard, setOffline } = useParticipants(boardId);
  const { sessionCount: onlineCount } = usePresence(boardId, uid);
  const { lockBoard, unlockBoard } = useLockBoard(boardId);
  const { selectStage, startTimer, pauseTimer, resumeTimer, stopTimer } = useTimer(boardId, board?.timer);
  const isHostUser = role === 'host';
  const { reports } = useReports(boardId, isHostUser);
  const openReportCount = reports.filter((r) => r.status === 'open').length;
  async function deleteMessage(messageId: string) {
    await deleteDoc(doc(db, messagesPath(boardId), messageId));
  }

  // 포스트 삭제 시 확인 다이얼로그를 띄우고, 사용자가 승인하면 실제 삭제를 수행한다.
  // 취소하면 삭제 없이 resolve하여 호출부의 await가 그대로 종료되도록 한다.
  function confirmDeletePost(postId: string) {
    return new Promise<void>((resolve) => {
      setPendingDelete({ postId, resolve });
    });
  }

  async function handleConfirmDelete() {
    if (!pendingDelete) return;
    await deletePost(pendingDelete.postId);
    pendingDelete.resolve();
    setPendingDelete(null);
  }

  function handleCancelDelete() {
    if (!pendingDelete) return;
    pendingDelete.resolve();
    setPendingDelete(null);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  );

  // sessionStorage는 브라우저 전용이라 lazy init하면 SSR/CSR hydration mismatch가 나서
  // 의도적으로 effect에서 한 번만 동기화한다. uid 도착 + !joined 조건으로 1회 실행 보장.
  // 소유자 자동 호스트 복구를 위해 board 로드까지 기다린다(boardLoading).
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!uid || joined || boardLoading) return;
    const savedRole = (sessionStorage.getItem(`board-role-${boardId}`) ?? 'member') as UserRole;
    const savedNickname = sessionStorage.getItem(`board-nickname-${boardId}`) ?? '';

    if (savedNickname) {
      setRole(savedRole);
      setNickname(savedNickname);
      joinBoard({ userId: uid, nickname: savedNickname, role: savedRole }).catch(() => {});
      setJoined(true);
      if (code && savedRole === 'host') setShowShare(true);
      return;
    }

    // 닉네임이 없는데 본인이 소유한 보드면 — 세션이 끊겨도 자동으로 호스트로 복구.
    // (Firebase Auth 로그인은 영구 저장되어 uid가 유지되므로 ownerId로 본인 확인 가능)
    if (board && board.ownerId === uid) {
      const hostName = auth.currentUser?.displayName?.split(' ')[0] ?? '퍼실리테이터';
      setRole('host');
      setNickname(hostName);
      sessionStorage.setItem(`board-role-${boardId}`, 'host');
      sessionStorage.setItem(`board-nickname-${boardId}`, hostName);
      joinBoard({ userId: uid, nickname: hostName, role: 'host' }).catch(() => {});
      setJoined(true);
      return;
    }

    // 일반 참여자가 닉네임 없이 보드 URL로 직접 진입한 경우 — 입장 관문 노출
    setRole(savedRole);
    setNeedNickname(true);
  }, [uid, boardId, joined, joinBoard, code, board, boardLoading]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!uid || !joined) return;
    const handleUnload = () => { setOffline(uid).catch(() => {}); };
    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      setOffline(uid).catch(() => {});
    };
  }, [uid, joined, setOffline]);

  // 워크스페이스 멤버 여부 확인 (보드 로드 + uid 확정 후 1회)
  useEffect(() => {
    if (!uid || !board?.workspaceId || board.workspaceId === 'default') return;
    getDoc(doc(db, workspaceMembersPath(board.workspaceId), uid)).then((snap) => {
      if (snap.exists()) {
        setIsWsMember(true);
        if (snap.data().role === 'admin') setIsWsAdmin(true);
      }
    }).catch(() => {});
  }, [uid, board?.workspaceId]);

  function checkBanned(text: string): boolean {
    if (role === 'host') return false;
    const hit = findBannedHit(text, board?.bannedWords);
    if (hit) {
      toast.error(`"${hit}" 키워드가 포함되어 작성할 수 없습니다.`);
      return true;
    }
    return false;
  }

  async function handleSkinChange(skin: BoardSkin) {
    try {
      await updateDoc(doc(db, boardsPath(), boardId), {
        skin,
        updatedAt: serverTimestamp(),
      });
    } catch {
      toast.error('스킨 변경에 실패했습니다.');
    }
  }

  async function handleBackgroundChange(background: BoardBackground) {
    try {
      await updateDoc(doc(db, boardsPath(), boardId), {
        background,
        updatedAt: serverTimestamp(),
      });
    } catch {
      toast.error('배경 변경에 실패했습니다.');
    }
  }

  async function handleCustomBackgroundColorChange(color: string) {
    try {
      await updateDoc(doc(db, boardsPath(), boardId), {
        background: 'custom',
        customBackgroundColor: color,
        updatedAt: serverTimestamp(),
      });
    } catch {
      toast.error('배경 색상 변경에 실패했습니다.');
    }
  }

  async function handleKanbanColumnsChange(columns: KanbanColumn[]) {
    try {
      await updateDoc(doc(db, boardsPath(), boardId), {
        kanbanColumns: columns,
        updatedAt: serverTimestamp(),
      });
    } catch {
      toast.error('칸반 컬럼 변경에 실패했습니다.');
    }
  }

  async function handleToggleReactionCounts(visible: boolean) {
    try {
      await updateDoc(doc(db, boardsPath(), boardId), {
        'settings.showPostReactionCounts': visible,
        updatedAt: serverTimestamp(),
      });
    } catch {
      toast.error('반응 수 표시 설정 변경에 실패했습니다.');
    }
  }

  async function handleTogglePostTitle(enabled: boolean) {
    try {
      await updateDoc(doc(db, boardsPath(), boardId), {
        'settings.showPostTitle': enabled,
        updatedAt: serverTimestamp(),
      });
    } catch {
      toast.error('제목 영역 설정 변경에 실패했습니다.');
    }
  }

  async function handleNicknameJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!uid) return;
    const nn = nicknameInput.trim();
    if (nn.length < 2) return;
    setJoining(true);
    try {
      await joinBoard({ userId: uid, nickname: nn, role });
      sessionStorage.setItem(`board-role-${boardId}`, role);
      sessionStorage.setItem(`board-nickname-${boardId}`, nn);
      setNickname(nn);
      setJoined(true);
      setNeedNickname(false);
    } catch {
      toast.error('입장에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setJoining(false);
    }
  }

  async function handleAddPost(content: string, color: PostColor, imageUrl?: string, columnId?: string, title?: string) {
    if (!uid || !nickname) return;
    if (checkBanned(content) || (title && checkBanned(title))) throw new Error('banned');
    const stageId = isWorkshopMode ? currentStage?.id : undefined;
    await addPost({ authorId: uid, authorName: nickname, title, content, color, imageUrl, columnId, stageId });
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const activeId = String(active.id);
    const overData = over.data.current as { columnId?: string | null; type?: string } | undefined;
    const activePost = posts.find((p) => p.id === activeId);
    if (!activePost) return;

    const sourceCol = activePost.columnId ?? null;
    const targetCol =
      overData?.type === 'column'
        ? overData.columnId ?? null
        : overData?.type === 'post'
        ? overData.columnId ?? null
        : null;

    const isFree = getTemplate(board?.template ?? 'free').columns === null;
    if (!isFree && targetCol === null) return;

    if (sourceCol === targetCol) {
      const colPosts = posts.filter((p) => (p.columnId ?? null) === sourceCol);
      const oldIndex = colPosts.findIndex((p) => p.id === activeId);
      const newIndex =
        overData?.type === 'post'
          ? colPosts.findIndex((p) => p.id === String(over.id))
          : colPosts.length - 1;
      if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return;
      const reordered = arrayMove(colPosts, oldIndex, newIndex);
      try {
        await reorderPosts(reordered.map((p) => p.id));
      } catch {}
      return;
    }

    const sourcePosts = posts
      .filter((p) => (p.columnId ?? null) === sourceCol)
      .filter((p) => p.id !== activeId);
    const targetPosts = posts.filter((p) => (p.columnId ?? null) === targetCol);
    let insertIndex = targetPosts.length;
    if (overData?.type === 'post') {
      const idx = targetPosts.findIndex((p) => p.id === String(over.id));
      if (idx >= 0) insertIndex = idx;
    }
    const newTarget = [
      ...targetPosts.slice(0, insertIndex),
      activePost,
      ...targetPosts.slice(insertIndex),
    ];
    try {
      if (sourcePosts.length > 0) {
        await reorderPosts(sourcePosts.map((p) => p.id));
      }
      await reorderPosts(newTarget.map((p) => p.id), { [activeId]: targetCol ?? undefined });
    } catch {}
  }

  async function handleSendMessage(
    content: string,
    fileAttachment?: { url: string; name: string; size: number; type: 'image' | 'file' },
    replyTo?: MessageReplyTo,
  ) {
    if (!uid || !nickname) return;
    if (checkBanned(content)) throw new Error('banned');
    if (fileAttachment) {
      await sendMessage({ authorId: uid, authorName: nickname, role, content, type: fileAttachment.type, fileUrl: fileAttachment.url, fileName: fileAttachment.name, fileSize: fileAttachment.size, replyTo });
    } else {
      await sendMessage({ authorId: uid, authorName: nickname, role, content, replyTo });
    }
  }

  function handleToggleReaction(messageId: string, emoji: EmojiType) {
    if (!uid) return;
    toggleReaction(messageId, uid, emoji).catch(() => {});
  }

  const lastStageIdRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const isWorkshopMode = (board?.mode ?? 'single') === 'workshop';
    if (!isWorkshopMode) return;
    const newId = board?.timer?.stageId ?? null;
    if (lastStageIdRef.current === undefined) {
      lastStageIdRef.current = newId;
      return;
    }
    if (lastStageIdRef.current === newId) return;
    lastStageIdRef.current = newId;
    if (newId) {
      const stages = [...(board?.stages ?? [])].sort((a, b) => a.order - b.order);
      const stage = stages.find((s) => s.id === newId);
      if (stage) {
        const def = stage.activityType ? getActivity(stage.activityType) : null;
        toast(`📍 ${stage.title}${def ? ` (${def.emoji} ${def.label})` : ''} 시작`);
      }
    }
  }, [board?.mode, board?.timer?.stageId, board?.stages]);

  const overdueNotifiedRef = useRef<string | null>(null);
  // 의존성을 원시값으로 추출 — board.timer/stages 객체 참조가 매 스냅샷마다 바뀌어 interval이 재생성되는 것을 방지.
  const overdueIsWorkshop = (board?.mode ?? 'single') === 'workshop';
  const overdueStageId = board?.timer?.stageId ?? null;
  const overdueStage = (board?.stages ?? []).find((s) => s.id === overdueStageId);
  const overdueDurationSec = overdueStage?.durationSec ?? 0;
  const overdueStageTitle = overdueStage?.title ?? '';
  const timerStatus = board?.timer?.status;
  const timerStartedAt = board?.timer?.startedAt ?? null;
  const timerAccumulatedMs = board?.timer?.accumulatedMs ?? 0;
  useEffect(() => {
    if (!overdueIsWorkshop || role !== 'host') return;
    if (!overdueStageId || overdueDurationSec <= 0) return;
    if (timerStatus !== 'running' || !timerStartedAt) return;
    const totalMs = overdueDurationSec * 1000;
    const interval = setInterval(() => {
      const elapsed = (Date.now() - timerStartedAt) + timerAccumulatedMs;
      if (elapsed >= totalMs && overdueNotifiedRef.current !== overdueStageId) {
        overdueNotifiedRef.current = overdueStageId;
        toast.warning(`⏰ "${overdueStageTitle}" 시간이 종료되었습니다`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [overdueIsWorkshop, role, overdueStageId, overdueDurationSec, overdueStageTitle, timerStatus, timerStartedAt, timerAccumulatedMs]);

  if (authLoading || boardLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-400">불러오는 중...</p>
      </div>
    );
  }

  if (boardError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500">{boardError}</p>
      </div>
    );
  }

  const displayCode = board?.boardCode ?? '';
  const isLocked = !!board?.settings?.lockedAt;
  const allowChat = board?.settings?.allowChat !== false;
  // 미설정(undefined) 시 기본 ON. 운영자가 체크 해제(false)한 경우에만 숨김.
  const titleEnabled = board?.settings?.showPostTitle !== false;
  const canPost = role === 'host' || !isLocked;
  const boardMode = board?.mode ?? 'single';
  const isWorkshopMode = boardMode === 'workshop';
  const sortedStages = [...(board?.stages ?? [])].sort((a, b) => a.order - b.order);
  const currentStageId = board?.timer?.stageId ?? null;
  const currentStage = sortedStages.find((s) => s.id === currentStageId) ?? null;
  const activeActivity = isWorkshopMode
    ? (currentStage?.activityType ?? null)
    : (board?.template ?? 'free');
  const isLive = isLiveActivity(activeActivity);
  const boardTemplateId: BoardTemplate = (activeActivity && !isLive)
    ? (activeActivity as BoardTemplate)
    : 'free';
  const baseTemplate = getTemplate(boardTemplateId);
  const isEditableColumns = isColumnEditableTemplate(boardTemplateId);
  const editableColumnDefaults = boardTemplateId === 'categories'
    ? DEFAULT_CATEGORY_COLUMNS
    : DEFAULT_KANBAN_COLUMNS;
  const editableColumnSource = isEditableColumns
    ? (board?.kanbanColumns && board.kanbanColumns.length > 0
        ? board.kanbanColumns
        : editableColumnDefaults)
    : null;
  const template = editableColumnSource
    ? {
        ...baseTemplate,
        columns: editableColumnSource.map((c) => ({
          id: c.id,
          label: c.label,
          headerClass: '',
          headerStyle: { backgroundColor: c.headerColor, color: '#fff' },
          defaultColor: c.defaultPostColor,
        })),
      }
    : baseTemplate;
  const hasActiveActivity = !!activeActivity;
  const isFreeLayout = template.columns === null;
  const isCanvas = template.id === 'canvas';
  const isProscons = template.id === 'proscons';
  const skin = board?.skin ?? 'standard';
  const backgroundDef = getBackground(board?.background, board?.customBackgroundColor);
  const showWorkshopEmptyHint = isWorkshopMode && !hasActiveActivity;
  const visiblePosts = isWorkshopMode && currentStage
    ? posts.filter((p) => p.stageId === currentStage.id)
    : posts;

  return (
    <div data-skin={skin} className="skin-root flex flex-col h-screen h-dvh" style={backgroundDef.style}>
      {/* 헤더 */}
      <header className="flex items-center justify-between gap-2 px-3 sm:px-4 py-3 bg-white border-b border-gray-100 shadow-sm flex-shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <Link
            href="/"
            className="relative text-indigo-600 font-bold text-lg flex-shrink-0 hover:text-indigo-700 focus-visible:outline focus-visible:outline-2 rounded transition-colors"
            aria-label="홈으로 이동"
          >
            Fadlet
            <span className="absolute -top-1 -right-4 text-[10px] font-semibold text-indigo-400 leading-none">beta</span>
          </Link>
          {isWsMember && board?.workspaceId && board.workspaceId !== 'default' && (
            <Link
              href={`/workspaces/${board.workspaceId}`}
              className="hidden sm:flex items-center gap-0.5 text-xs text-gray-500 hover:text-indigo-600 transition-colors flex-shrink-0"
            >
              <ArrowLeft size={12} />
              워크스페이스
            </Link>
          )}
          {!isWsMember && role === 'host' && (
            <Link
              href="/dashboard"
              className="hidden sm:flex items-center gap-0.5 text-xs text-gray-500 hover:text-indigo-600 transition-colors flex-shrink-0"
            >
              <ArrowLeft size={12} />
              내 워크스페이스
            </Link>
          )}
          <span className="text-gray-300 hidden sm:inline" aria-hidden>|</span>
          <h1 className="text-sm font-semibold text-gray-900 truncate">{board?.title}</h1>
          {isWorkshopMode ? (
            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full flex-shrink-0 hidden sm:inline">
              🎬 워크숍
              {hasActiveActivity && currentStage && ` · ${template.emoji} ${currentStage.title}`}
            </span>
          ) : (
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full flex-shrink-0 hidden sm:inline">
              {template.emoji} {template.label}
            </span>
          )}
          {isLocked && (
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full flex-shrink-0">
              🔒 잠김
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          <span
            className="flex items-center gap-1 text-xs text-gray-500 px-1.5 sm:px-2"
            title={`현재 접속자 ${onlineCount}명`}
            aria-label={`현재 접속자 ${onlineCount}명`}
          >
            <span className="w-2 h-2 rounded-full bg-green-400 inline-block" aria-hidden />
            <span className="hidden sm:inline">접속</span> {onlineCount}명
          </span>
          {displayCode && (
            <button
              onClick={() => setShowShare(true)}
              className="font-mono text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg hover:bg-indigo-100 transition-colors focus-visible:outline focus-visible:outline-2"
              aria-label="보드 공유"
            >
              {displayCode}
            </button>
          )}
          <div className="hidden md:flex items-center gap-2">
            <FeedbackButton boardId={boardId} className="inline-flex items-center justify-center w-7 h-7 text-gray-500 hover:text-indigo-600 transition-colors" />
            <ExportMenu boardId={boardId} isWorkshop={isWorkshopMode} />
            {isHostUser && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowReports(true)}
                  className="relative text-xs h-7 px-3"
                  aria-label={`신고 ${openReportCount > 0 ? `${openReportCount}건 미처리` : '없음'}`}
                >
                  🚩 신고
                  {openReportCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
                      {openReportCount > 99 ? '99+' : openReportCount}
                    </span>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={isLocked ? unlockBoard : lockBoard}
                  className="text-xs h-7 px-3"
                >
                  {isLocked ? '🔓 잠금 해제' : '🔒 잠금'}
                </Button>
                <Button
                  size="sm"
                  onClick={() => setShowShare(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-7 px-3"
                >
                  공유
                </Button>
              </>
            )}
            {(isHostUser || isWsAdmin) && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowFacilitator(true)}
                className="text-xs h-7 px-3"
              >
                🎛 환경설정
              </Button>
            )}
          </div>
          {isHostUser && (
            <div className="md:hidden">
              <HostActionsMenu
                isLocked={isLocked}
                openReportCount={openReportCount}
                onOpenReports={() => setShowReports(true)}
                onOpenFacilitator={() => setShowFacilitator(true)}
                onToggleLock={() => (isLocked ? unlockBoard() : lockBoard())}
                onOpenShare={() => setShowShare(true)}
                onOpenAiInsights={() => setShowAiInsights(true)}
                onCloneBoard={
                  board && uid && board.workspaceId !== 'demo'
                    ? async () => {
                        if (!board || !uid) return;
                        try {
                          const { id } = await cloneBoard({ source: board, ownerUid: uid });
                          toast.success('보드를 복제했습니다.');
                          router.push(`/boards/${id}`);
                        } catch (err) {
                          if (err instanceof Error && err.message === FREE_TIER_LIMIT_CODE) {
                            showUpgradeMessage('board');
                          } else {
                            console.error('[clone]', err);
                            toast.error('복제에 실패했습니다.');
                          }
                        }
                      }
                    : undefined
                }
              />
            </div>
          )}
        </div>
      </header>

      {/* 단계 배너 */}
      {board?.stages && board.stages.length > 0 && (
        <StageBanner
          stages={board.stages}
          timer={board.timer ?? IDLE_TIMER}
          isHost={role === 'host'}
          onStart={startTimer}
          onPause={pauseTimer}
          onResume={resumeTimer}
          onStop={stopTimer}
          onSelect={isWorkshopMode ? startTimer : selectStage}
        />
      )}

      {/* 메인 영역 */}
      <div className="flex flex-1 overflow-hidden">
        {showWorkshopEmptyHint ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="max-w-md text-center">
              {role === 'host' ? (
                <>
                  <div className="text-5xl mb-4">🎬</div>
                  <h2 className="text-lg font-bold text-gray-900 mb-2">워크숍 단계가 시작되지 않았습니다</h2>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {sortedStages.length === 0
                      ? '퍼실리테이터 패널을 열어 단계를 추가해 보세요. 단계를 시작하면 모든 참여자 화면이 그 활동으로 자동 전환됩니다.'
                      : '하단 단계 배너에서 ▶ 시작 버튼을 누르면 첫 단계가 시작됩니다.'}
                  </p>
                </>
              ) : (
                <>
                  <div className="relative inline-flex items-center justify-center mb-5">
                    <span className="absolute inline-flex h-20 w-20 rounded-full bg-indigo-200/60 opacity-60 animate-ping" aria-hidden />
                    <span className="relative inline-flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-3xl">
                      🎬
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">곧 시작합니다</h2>
                  <p className="text-sm text-gray-500 leading-relaxed mb-5">
                    퍼실리테이터가 첫 단계를 시작하면 화면이 자동으로 전환됩니다.<br />
                    편하게 계세요.
                  </p>
                  {nickname && (
                    <p className="inline-flex items-center gap-1.5 text-xs text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                      <span className="font-mono">{nickname}</span> 님으로 참여 중
                    </p>
                  )}
                  {sortedStages.length > 0 && (
                    <div className="mt-6 max-w-xs mx-auto">
                      <p className="text-[11px] uppercase tracking-widest font-bold text-gray-400 mb-2">
                        예정된 단계 {sortedStages.length}개
                      </p>
                      <ol className="space-y-1 text-left">
                        {sortedStages.slice(0, 4).map((s, i) => (
                          <li key={s.id} className="text-xs text-gray-600 truncate">
                            <span className="font-mono text-gray-400">{i + 1}.</span> {s.title}
                          </li>
                        ))}
                        {sortedStages.length > 4 && (
                          <li className="text-xs text-gray-400">…외 {sortedStages.length - 4}개</li>
                        )}
                      </ol>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ) : isLive && currentStage && activeActivity === 'poll' && currentStage.activityConfig?.poll ? (
          <PollBoard
            boardId={boardId}
            stageId={currentStage.id}
            stageTitle={currentStage.title}
            config={currentStage.activityConfig.poll}
            currentUid={uid ?? ''}
            isHost={role === 'host'}
          />
        ) : isLive && currentStage && activeActivity === 'wordcloud' && currentStage.activityConfig?.wordcloud ? (
          <WordcloudBoard
            boardId={boardId}
            stageId={currentStage.id}
            stageTitle={currentStage.title}
            config={currentStage.activityConfig.wordcloud}
            currentUid={uid ?? ''}
            isHost={role === 'host'}
          />
        ) : isLive && currentStage && activeActivity === 'qna' && currentStage.activityConfig?.qna ? (
          <QnaBoard
            boardId={boardId}
            stageId={currentStage.id}
            stageTitle={currentStage.title}
            config={currentStage.activityConfig.qna}
            currentUid={uid ?? ''}
            currentName={nickname}
            isHost={role === 'host'}
          />
        ) : isLive ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <p className="text-sm text-gray-500">이 활동은 설정이 누락되었습니다.</p>
          </div>
        ) : isCanvas ? (
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 bg-white flex-shrink-0">
              <span className="text-xs text-gray-400">{visiblePosts.length}개의 포스트 · 드래그하여 위치 변경</span>
              {canPost && (
                <Button
                  onClick={() => setShowNewPost(true)}
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                >
                  + 새 포스트
                </Button>
              )}
            </div>
            <div className="flex-1 overflow-hidden">
              {postsLoading ? (
                <p className="text-gray-400 text-sm text-center py-12">불러오는 중...</p>
              ) : (
                <CanvasBoard
                  posts={visiblePosts}
                  boardId={boardId}
                  canDrag={!isLocked || role === 'host'}
                  currentUid={uid ?? ''}
                  isHost={role === 'host'}
                  showReactionCounts={board?.settings?.showPostReactionCounts !== false}
                  titleEnabled={titleEnabled}
                  onUpdate={updatePost}
                  onDelete={confirmDeletePost}
                  onUpdatePosition={updatePosition}
                  onOpenDetail={setDetailPost}
                />
              )}
            </div>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            {isProscons ? (
              /* 찬반 템플릿 — 전체 높이 좌우 분할 */
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 bg-white flex-shrink-0">
                  <span className="text-xs text-gray-400">{visiblePosts.length}개의 포스트</span>
                </div>
                {postsLoading ? (
                  <p className="text-gray-400 text-sm text-center py-12">불러오는 중...</p>
                ) : (
                  <ProsConsBoard
                    posts={visiblePosts}
                    boardId={boardId}
                    canPost={canPost}
                    currentUid={uid ?? ''}
                    isHost={role === 'host'}
                    showReactionCounts={board?.settings?.showPostReactionCounts !== false}
                    titleEnabled={titleEnabled}
                    isLocked={isLocked}
                    onAddPost={handleAddPost}
                    onUpdatePost={updatePost}
                    onDeletePost={confirmDeletePost}
                    onOpenDetail={setDetailPost}
                  />
                )}
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-4">
                {isFreeLayout ? (
                  /* 자유형 / 브레인스토밍 */
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs text-gray-400">{visiblePosts.length}개의 포스트</span>
                      {canPost && (
                        <Button
                          onClick={() => setShowNewPost(true)}
                          size="sm"
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                        >
                          + 새 포스트
                        </Button>
                      )}
                    </div>

                    {isLocked && role !== 'host' && (
                      <div className="text-center py-3 mb-4 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-sm text-gray-500">🔒 퍼실리테이터가 보드를 잠갔습니다. 새 포스트를 작성할 수 없습니다.</p>
                      </div>
                    )}

                    {postsLoading ? (
                      <p className="text-gray-400 text-sm text-center py-12">불러오는 중...</p>
                    ) : visiblePosts.length === 0 ? (
                      <div className="text-center py-16">
                        <p className="text-gray-400 text-sm mb-3">아직 포스트가 없습니다.</p>
                        {canPost && (
                          <Button onClick={() => setShowNewPost(true)} variant="outline" size="sm">
                            첫 번째 포스트 작성하기
                          </Button>
                        )}
                      </div>
                    ) : (
                      <SortableContext items={visiblePosts.map((p) => p.id)} strategy={rectSortingStrategy}>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                          {visiblePosts.map((post) => (
                            <SortablePostCard
                              key={post.id}
                              post={post}
                              boardId={boardId}
                              currentUid={uid ?? ''}
                              isHost={role === 'host'}
                              showReactionCounts={board?.settings?.showPostReactionCounts !== false}
                              titleEnabled={titleEnabled}
                              canDrag={!isLocked || role === 'host'}
                              onUpdate={updatePost}
                              onDelete={confirmDeletePost}
                              onOpenDetail={setDetailPost}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    )}
                  </>
                ) : (
                  /* 컬럼형 템플릿 */
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs text-gray-400">{visiblePosts.length}개의 포스트</span>
                    </div>
                    {postsLoading ? (
                      <p className="text-gray-400 text-sm text-center py-12">불러오는 중...</p>
                    ) : (
                      <ColumnBoard
                        template={template}
                        posts={visiblePosts}
                        boardId={boardId}
                        canPost={canPost}
                        currentUid={uid ?? ''}
                        isHost={role === 'host'}
                        showReactionCounts={board?.settings?.showPostReactionCounts !== false}
                        titleEnabled={titleEnabled}
                        isLocked={isLocked}
                        onAddPost={handleAddPost}
                        onUpdatePost={updatePost}
                        onDeletePost={confirmDeletePost}
                        onOpenDetail={setDetailPost}
                      />
                    )}
                  </>
                )}
              </div>
            )}
          </DndContext>
        )}

        {/* 데스크톱 채팅 패널 */}
        {allowChat && showDesktopChat && (
          <div
            ref={chatPanelRef}
            className="hidden lg:flex flex-col flex-shrink-0 relative"
            style={{ width: chatWidth }}
          >
            {/* 너비 조절 핸들 */}
            <div
              onMouseDown={startChatResize}
              onDoubleClick={() => {
                setChatWidth(CHAT_WIDTH_DEFAULT);
                chatWidthRef.current = CHAT_WIDTH_DEFAULT;
                try { localStorage.setItem(CHAT_WIDTH_KEY, String(CHAT_WIDTH_DEFAULT)); } catch { /* 무시 */ }
              }}
              role="separator"
              aria-orientation="vertical"
              aria-label="채팅 너비 조절 (더블클릭 시 기본값)"
              title="드래그하여 너비 조절 · 더블클릭 시 기본 너비"
              className="group absolute left-0 top-0 bottom-0 z-20 flex w-2 -translate-x-1/2 cursor-col-resize items-center justify-center"
            >
              <div className="h-10 w-0.5 rounded-full bg-gray-200 transition-colors group-hover:bg-indigo-400" />
            </div>
            <ChatPanel
              messages={messages}
              loading={msgsLoading}
              onSend={handleSendMessage}
              onToggleReaction={handleToggleReaction}
              currentUid={uid ?? ''}
              currentName={nickname}
              currentRole={role}
              boardId={boardId}
              pinnedAnnouncement={board?.pinnedAnnouncement}
              onClose={() => setShowDesktopChat(false)}
            />
          </div>
        )}
        {/* 채팅 접혔을 때 재열기 탭 */}
        {allowChat && !showDesktopChat && (
          <button
            onClick={() => setShowDesktopChat(true)}
            className="hidden lg:flex flex-col items-center justify-center gap-1.5 w-8 border-l border-gray-200 bg-white hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 transition-colors flex-shrink-0"
            aria-label="채팅 열기"
          >
            <ChevronLeft size={15} />
            <span className="text-[10px] font-semibold" style={{ writingMode: 'vertical-rl', letterSpacing: '0.05em' }}>
              채팅
            </span>
          </button>
        )}
      </div>

      {/* 모바일 채팅 버튼 */}
      {allowChat && <div className="lg:hidden fixed bottom-5 right-5">
        <button
          onClick={() => setShowChat(true)}
          className="w-14 h-14 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg text-xl focus-visible:outline focus-visible:outline-2"
          aria-label="채팅 열기"
        >
          💬
        </button>
      </div>}

      {/* 모바일 채팅 오버레이 */}
      {allowChat && showChat && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col bg-white" role="dialog" aria-modal="true" aria-label="채팅">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="font-semibold text-gray-900">채팅</span>
            <button
              onClick={() => setShowChat(false)}
              className="text-gray-400 hover:text-gray-700 text-xl focus-visible:outline focus-visible:outline-2"
              aria-label="채팅 닫기"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <ChatPanel
              messages={messages}
              loading={msgsLoading}
              onSend={handleSendMessage}
              onToggleReaction={handleToggleReaction}
              currentUid={uid ?? ''}
              currentName={nickname}
              currentRole={role}
              boardId={boardId}
              pinnedAnnouncement={board?.pinnedAnnouncement}
            />
          </div>
        </div>
      )}

      {isFreeLayout && canPost && (
        <NewPostDialog
          open={showNewPost}
          onClose={() => setShowNewPost(false)}
          onSubmit={(content, color, imageUrl, title) => handleAddPost(content, color, imageUrl, undefined, title)}
          boardId={boardId}
          titleEnabled={titleEnabled}
        />
      )}

      {detailPost && (
        <PostDetailModal
          post={detailPost}
          boardId={boardId}
          currentUid={uid ?? ''}
          currentNickname={nickname}
          isHost={role === 'host'}
          showReactionCounts={board?.settings?.showPostReactionCounts !== false}
          onClose={() => setDetailPost(null)}
          onDelete={confirmDeletePost}
        />
      )}

      <PostDeleteDialog
        open={pendingDelete !== null}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      />

      {board && uid && (
        <MoveBoardDialog
          open={showMoveBoard}
          boardId={boardId}
          boardTitle={board.title}
          currentWorkspaceId={board.workspaceId}
          currentUid={uid}
          onClose={() => setShowMoveBoard(false)}
        />
      )}

      {board && (
        <ShareDialog
          open={showShare}
          onClose={() => setShowShare(false)}
          boardCode={displayCode}
          boardTitle={board.title}
        />
      )}

      {(isHostUser || isWsAdmin) && board && (
        <FacilitatorPanel
          open={showFacilitator}
          onClose={() => setShowFacilitator(false)}
          boardId={boardId}
          mode={board.mode ?? 'single'}
          stages={board.stages ?? []}
          pinnedAnnouncement={board.pinnedAnnouncement}
          bannedWords={board.bannedWords}
          currentUid={uid ?? ''}
          currentName={nickname}
          currentSkin={board.skin ?? 'standard'}
          onSkinChange={handleSkinChange}
          currentBackground={board.background ?? 'plain'}
          customBackgroundColor={board.customBackgroundColor}
          onBackgroundChange={handleBackgroundChange}
          onCustomBackgroundColorChange={handleCustomBackgroundColorChange}
          boardTemplate={board.template}
          kanbanColumns={board.kanbanColumns}
          onKanbanColumnsChange={handleKanbanColumnsChange}
          showReactionCounts={board.settings?.showPostReactionCounts !== false}
          onToggleReactionCounts={handleToggleReactionCounts}
          showPostTitle={titleEnabled}
          onTogglePostTitle={handleTogglePostTitle}
          isHostUser={isHostUser}
          onOpenMoveWorkspace={
            (board.ownerId === uid || isWsAdmin) && board.workspaceId !== 'default' && board.workspaceId !== 'demo'
              ? () => { setShowFacilitator(false); setShowMoveBoard(true); }
              : undefined
          }
        />
      )}

      {role === 'host' && (
        <ReportsPanel
          open={showReports}
          onClose={() => setShowReports(false)}
          boardId={boardId}
          currentUid={uid ?? ''}
          onDeleteMessage={deleteMessage}
          onDeletePost={deletePost}
        />
      )}

      {board && (
        <Dialog open={showAiInsights} onOpenChange={(v) => setShowAiInsights(v)}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <DialogHeader>
              <DialogTitle className="text-lg">AI 인사이트 · {board.title}</DialogTitle>
            </DialogHeader>
            <div className="mt-3">
              <AiInsightsCard
                board={board}
                posts={posts}
                messages={messages}
                isHost={isHostUser}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* 닉네임 입장 관문 — URL 직접 진입 등으로 닉네임이 없을 때 */}
      <Dialog open={needNickname} onOpenChange={() => {}}>
        <DialogContent className="max-w-sm" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>닉네임 입력</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500 -mt-1">보드에서 표시될 이름을 입력하세요. (2~12자)</p>
          <form onSubmit={handleNicknameJoin} className="flex flex-col gap-4">
            <Input
              placeholder="예: 박지영"
              value={nicknameInput}
              onChange={(e) => setNicknameInput(e.target.value)}
              minLength={2}
              maxLength={12}
              required
              autoFocus
              className="text-base"
            />
            <Button
              type="submit"
              disabled={joining || nicknameInput.trim().length < 2}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold h-12"
            >
              {joining ? '입장 중...' : '보드 입장하기'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <HostOnboarding enabled={joined && role === 'host'} />
    </div>
  );
}
