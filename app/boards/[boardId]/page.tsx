'use client';

import { use, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ColumnBoard } from '@/components/board/column-board';
import { NewPostDialog } from '@/components/board/new-post-dialog';
import { PostCard } from '@/components/board/post-card';
import { PostDetailModal } from '@/components/board/post-detail-modal';
import { ChatPanel } from '@/components/chat/chat-panel';
import { ShareDialog } from '@/components/shared/share-dialog';
import { getTemplate } from '@/lib/templates';
import { useAuth } from '@/lib/hooks/use-auth';
import { useBoard } from '@/lib/hooks/use-board';
import { useLockBoard } from '@/lib/hooks/use-lock-board';
import { useMessages } from '@/lib/hooks/use-messages';
import { useParticipants } from '@/lib/hooks/use-participants';
import { usePosts } from '@/lib/hooks/use-posts';
import type { Post, PostColor, UserRole } from '@/lib/types';
import { uploadPostImage } from '@/lib/utils/upload-file';

interface PageProps {
  params: Promise<{ boardId: string }>;
  searchParams: Promise<{ code?: string }>;
}

export default function BoardPage({ params, searchParams }: PageProps) {
  const { boardId } = use(params);
  const { code } = use(searchParams);
  const { uid, loading: authLoading } = useAuth();

  const [role, setRole] = useState<UserRole>('member');
  const [nickname, setNickname] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [showNewPost, setShowNewPost] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [detailPost, setDetailPost] = useState<Post | null>(null);
  const [joined, setJoined] = useState(false);

  const { board, loading: boardLoading, error: boardError } = useBoard(boardId);
  const { posts, loading: postsLoading, addPost, updatePost, deletePost } = usePosts(boardId);
  const { messages, loading: msgsLoading, sendMessage } = useMessages(boardId);
  const { onlineCount, joinBoard, setOffline } = useParticipants(boardId);
  const { lockBoard, unlockBoard } = useLockBoard(boardId);

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

  useEffect(() => {
    if (!uid || !joined) return;
    const handleUnload = () => { setOffline(uid).catch(() => {}); };
    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      setOffline(uid).catch(() => {});
    };
  }, [uid, joined, setOffline]);

  async function handleAddPost(content: string, color: PostColor, imageFile?: File, columnId?: string) {
    if (!uid || !nickname) return;
    let imageUrl: string | undefined;
    if (imageFile) imageUrl = await uploadPostImage(imageFile, boardId);
    await addPost({ authorId: uid, authorName: nickname, content, color, imageUrl, columnId });
  }

  async function handleSendMessage(content: string, fileAttachment?: { url: string; name: string; size: number; type: 'image' | 'file' }) {
    if (!uid || !nickname) return;
    if (fileAttachment) {
      await sendMessage({ authorId: uid, authorName: nickname, role, content, type: fileAttachment.type, fileUrl: fileAttachment.url, fileName: fileAttachment.name, fileSize: fileAttachment.size });
    } else {
      await sendMessage({ authorId: uid, authorName: nickname, role, content });
    }
  }

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
  const canPost = role === 'host' || !isLocked;
  const template = getTemplate(board?.template ?? 'free');
  const isFreeLayout = template.columns === null;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 shadow-sm flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-blue-600 font-bold text-lg flex-shrink-0">Fadlet</span>
          <h1 className="text-sm font-semibold text-gray-900 truncate">{board?.title}</h1>
          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full flex-shrink-0 hidden sm:inline">
            {template.emoji} {template.label}
          </span>
          {isLocked && (
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full flex-shrink-0">
              🔒 잠김
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {displayCode && (
            <button
              onClick={() => setShowShare(true)}
              className="font-mono text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg hover:bg-blue-100 transition-colors focus-visible:outline focus-visible:outline-2"
              aria-label="보드 공유"
            >
              {displayCode}
            </button>
          )}
          {role === 'host' && (
            <>
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
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-7 px-3"
              >
                공유
              </Button>
            </>
          )}
        </div>
      </header>

      {/* 메인 영역 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 보드 캔버스 */}
        <div className="flex-1 overflow-y-auto p-4">
          {isFreeLayout ? (
            /* 자유형 / 브레인스토밍 */
            <>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-gray-400">{posts.length}개의 포스트</span>
                {canPost && (
                  <Button
                    onClick={() => setShowNewPost(true)}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
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
              ) : posts.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-gray-400 text-sm mb-3">아직 포스트가 없습니다.</p>
                  {canPost && (
                    <Button onClick={() => setShowNewPost(true)} variant="outline" size="sm">
                      첫 번째 포스트 작성하기
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {posts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      currentUid={uid ?? ''}
                      isHost={role === 'host'}
                      onUpdate={updatePost}
                      onDelete={deletePost}
                      onOpenDetail={setDetailPost}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            /* 컬럼형 템플릿 */
            <>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-gray-400">{posts.length}개의 포스트</span>
              </div>
              {postsLoading ? (
                <p className="text-gray-400 text-sm text-center py-12">불러오는 중...</p>
              ) : (
                <ColumnBoard
                  template={template}
                  posts={posts}
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

        {/* 데스크톱 채팅 패널 */}
        <div className="hidden lg:flex w-80 flex-col flex-shrink-0">
          <ChatPanel
            messages={messages}
            loading={msgsLoading}
            onlineCount={onlineCount}
            onSend={handleSendMessage}
            currentUid={uid ?? ''}
            currentRole={role}
            boardId={boardId}
          />
        </div>
      </div>

      {/* 모바일 채팅 버튼 */}
      <div className="lg:hidden fixed bottom-5 right-5">
        <button
          onClick={() => setShowChat(true)}
          className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg text-xl focus-visible:outline focus-visible:outline-2"
          aria-label="채팅 열기"
        >
          💬
        </button>
      </div>

      {/* 모바일 채팅 오버레이 */}
      {showChat && (
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
              currentUid={uid ?? ''}
              currentRole={role}
              boardId={boardId}
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
    </div>
  );
}
