'use client';

import Link from 'next/link';
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
import { CanvasBoard } from '@/components/board/canvas-board';
import { ColumnBoard } from '@/components/board/column-board';
import { ProsConsBoard } from '@/components/board/pros-cons-board';
import { FacilitatorPanel } from '@/components/board/facilitator-panel';
import { HostActionsMenu } from '@/components/board/host-actions-menu';
import { HostOnboarding } from '@/components/board/host-onboarding';
import { NewPostDialog } from '@/components/board/new-post-dialog';
import { ReportsPanel } from '@/components/board/reports-panel';
import { SortablePostCard } from '@/components/board/sortable-post-card';
import { PostDetailModal } from '@/components/board/post-detail-modal';
import { StageBanner } from '@/components/board/stage-banner';
import { ChatPanel } from '@/components/chat/chat-panel';
import { PollBoard } from '@/components/activities/poll-board';
import { ExportMenu } from '@/components/shared/export-menu';
import { ShareDialog } from '@/components/shared/share-dialog';
import { getTemplate } from '@/lib/templates';
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
import { db } from '@/lib/firebase/client';
import { boardsPath, messagesPath, workspaceMembersPath } from '@/lib/firebase/collections';
import { deleteDoc, doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import type { BoardSkin, BoardTemplate, EmojiType, MessageReplyTo, Post, PostColor, TimerState, UserRole } from '@/lib/types';
import { uploadPostImage } from '@/lib/utils/upload-file';

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

export default function BoardPage({ params, searchParams }: PageProps) {
  const { boardId } = use(params);
  const { code } = use(searchParams);
  const { uid, loading: authLoading } = useAuth();

  const [role, setRole] = useState<UserRole>('member');
  const [nickname, setNickname] = useState('');
  const [isWsAdmin, setIsWsAdmin] = useState(false);
  const [isWsMember, setIsWsMember] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showDesktopChat, setShowDesktopChat] = useState(true);
  const [showNewPost, setShowNewPost] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showFacilitator, setShowFacilitator] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [detailPost, setDetailPost] = useState<Post | null>(null);
  const [joined, setJoined] = useState(false);

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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  );

  // sessionStorage는 브라우저 전용이라 lazy init하면 SSR/CSR hydration mismatch가 나서
  // 의도적으로 effect에서 한 번만 동기화한다. uid 도착 + !joined 조건으로 1회 실행 보장.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!uid || joined) return;
    const savedRole = (sessionStorage.getItem(`board-role-${boardId}`) ?? 'member') as UserRole;
    const savedNickname = sessionStorage.getItem(`board-nickname-${boardId}`) ?? '';
    setRole(savedRole);

    if (savedNickname) {
      setNickname(savedNickname);
      joinBoard({ userId: uid, nickname: savedNickname, role: savedRole }).catch(() => {});
      setJoined(true);
      if (code && savedRole === 'host') setShowShare(true);
    }
  }, [uid, boardId, joined, joinBoard, code]);
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

  async function handleAddPost(content: string, color: PostColor, imageFile?: File, columnId?: string) {
    if (!uid || !nickname) return;
    if (checkBanned(content)) throw new Error('banned');
    let imageUrl: string | undefined;
    if (imageFile) imageUrl = await uploadPostImage(imageFile, boardId);
    const stageId = isWorkshopMode ? currentStage?.id : undefined;
    await addPost({ authorId: uid, authorName: nickname, content, color, imageUrl, columnId, stageId });
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
  useEffect(() => {
    const isWorkshopMode = (board?.mode ?? 'single') === 'workshop';
    if (!isWorkshopMode || role !== 'host') return;
    const stages = [...(board?.stages ?? [])].sort((a, b) => a.order - b.order);
    const stage = stages.find((s) => s.id === (board?.timer?.stageId ?? null));
    if (!stage || stage.durationSec <= 0) return;
    const timer = board?.timer;
    if (!timer || timer.status !== 'running' || !timer.startedAt) return;
    const totalMs = stage.durationSec * 1000;
    const startedAt = timer.startedAt;
    const accumulatedMs = timer.accumulatedMs;
    const stageId = stage.id;
    const stageTitle = stage.title;
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startedAt) + accumulatedMs;
      if (elapsed >= totalMs && overdueNotifiedRef.current !== stageId) {
        overdueNotifiedRef.current = stageId;
        toast.warning(`⏰ "${stageTitle}" 시간이 종료되었습니다`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [board?.mode, board?.timer, board?.stages, role]);

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
  const template = getTemplate(boardTemplateId);
  const hasActiveActivity = !!activeActivity;
  const isFreeLayout = template.columns === null;
  const isCanvas = template.id === 'canvas';
  const isProscons = template.id === 'proscons';
  const skin = board?.skin ?? 'standard';
  const showWorkshopEmptyHint = isWorkshopMode && !hasActiveActivity;
  const visiblePosts = isWorkshopMode && currentStage
    ? posts.filter((p) => p.stageId === currentStage.id)
    : posts;

  return (
    <div data-skin={skin} className="skin-root flex flex-col h-screen h-dvh bg-gray-50">
      {/* 헤더 */}
      <header className="flex items-center justify-between gap-2 px-3 sm:px-4 py-3 bg-white border-b border-gray-100 shadow-sm flex-shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <Link
            href="/"
            className="text-indigo-600 font-bold text-lg flex-shrink-0 hover:text-indigo-700 focus-visible:outline focus-visible:outline-2 rounded transition-colors"
            aria-label="홈으로 이동"
          >
            Fadlet
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
            <ExportMenu boardId={boardId} />
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
                🎛 운영
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
              />
            </div>
          )}
        </div>
      </header>

      {/* 데모 배너 */}
      {board?.isDemo && (
        <div className="flex items-center justify-between px-4 py-2 bg-amber-50 border-b border-amber-200 flex-shrink-0">
          <p className="text-xs text-amber-800 font-medium">
            🎯 데모 모드 — 최대 50명 참여 가능 · 채팅 로그 미보관
          </p>
          <Link
            href="/dashboard"
            className="text-xs text-amber-700 hover:text-amber-900 font-semibold underline underline-offset-2 flex-shrink-0"
          >
            정식 운영자로 시작 →
          </Link>
        </div>
      )}

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
              <div className="text-5xl mb-4">🎬</div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">워크숍 단계가 시작되지 않았습니다</h2>
              {sortedStages.length === 0 ? (
                <p className="text-sm text-gray-500 leading-relaxed">
                  {role === 'host'
                    ? '운영자 패널을 열어 단계를 추가해 보세요. 단계를 시작하면 모든 참여자 화면이 그 활동으로 자동 전환됩니다.'
                    : '운영자가 곧 단계를 시작합니다. 잠시만 기다려주세요.'}
                </p>
              ) : (
                <p className="text-sm text-gray-500 leading-relaxed">
                  {role === 'host'
                    ? '하단 단계 배너에서 ▶ 시작 버튼을 누르면 첫 단계가 시작됩니다.'
                    : '운영자가 단계를 시작하면 화면이 자동으로 전환됩니다.'}
                </p>
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
        ) : isLive ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <p className="text-sm text-gray-500">이 활동은 아직 준비 중입니다.</p>
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
                  canDrag={!isLocked || role === 'host'}
                  currentUid={uid ?? ''}
                  isHost={role === 'host'}
                  onUpdate={updatePost}
                  onDelete={deletePost}
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
                    canPost={canPost}
                    currentUid={uid ?? ''}
                    isHost={role === 'host'}
                    isLocked={isLocked}
                    onAddPost={handleAddPost}
                    onUpdatePost={updatePost}
                    onDeletePost={deletePost}
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
                        <p className="text-sm text-gray-500">🔒 운영자가 보드를 잠갔습니다. 새 포스트를 작성할 수 없습니다.</p>
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
                              currentUid={uid ?? ''}
                              isHost={role === 'host'}
                              canDrag={!isLocked || role === 'host'}
                              onUpdate={updatePost}
                              onDelete={deletePost}
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
                        canPost={canPost}
                        currentUid={uid ?? ''}
                        isHost={role === 'host'}
                        isLocked={isLocked}
                        onAddPost={handleAddPost}
                        onUpdatePost={updatePost}
                        onDeletePost={deletePost}
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
          <div className="hidden lg:flex w-80 flex-col flex-shrink-0">
            <ChatPanel
              messages={messages}
              loading={msgsLoading}
              onlineCount={onlineCount}
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
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col bg-white">
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
              onlineCount={onlineCount}
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
          onSubmit={handleAddPost}
        />
      )}

      {detailPost && (
        <PostDetailModal
          post={detailPost}
          boardId={boardId}
          currentUid={uid ?? ''}
          currentNickname={nickname}
          isHost={role === 'host'}
          onClose={() => setDetailPost(null)}
          onDelete={deletePost}
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
          isHostUser={isHostUser}
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

      <HostOnboarding enabled={joined && role === 'host'} />
    </div>
  );
}
