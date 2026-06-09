'use client';

import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortablePostCard } from './sortable-post-card';
import { NewPostDialog } from './new-post-dialog';
import type { Post, PostColor } from '@/lib/types';

interface ProsConsBoardProps {
  posts: Post[];
  boardId: string;
  canPost: boolean;
  currentUid: string;
  isHost: boolean;
  showReactionCounts: boolean;
  titleEnabled?: boolean;
  isLocked: boolean;
  onAddPost: (content: string, color: PostColor, imageFile?: File, columnId?: string, title?: string) => Promise<void>;
  onUpdatePost: (postId: string, content: string, title?: string) => Promise<void>;
  onDeletePost: (postId: string) => Promise<void>;
  onOpenDetail: (post: Post) => void;
}

const PANELS = [
  {
    id: 'pros',
    emoji: '👍',
    label: '찬성',
    defaultColor: 'green' as PostColor,
    headerClass: 'bg-emerald-600 text-white',
    panelClass: 'bg-emerald-50/40',
    addBtnClass: 'hover:bg-emerald-100 hover:border-emerald-400 hover:text-emerald-700',
    emptyClass: 'text-emerald-300',
  },
  {
    id: 'cons',
    emoji: '👎',
    label: '반대',
    defaultColor: 'pink' as PostColor,
    headerClass: 'bg-rose-500 text-white',
    panelClass: 'bg-rose-50/40',
    addBtnClass: 'hover:bg-rose-100 hover:border-rose-400 hover:text-rose-700',
    emptyClass: 'text-rose-300',
  },
] as const;

function Panel({
  panel,
  posts,
  boardId,
  canPost,
  currentUid,
  isHost,
  showReactionCounts,
  titleEnabled,
  isLocked,
  onUpdatePost,
  onDeletePost,
  onOpenDetail,
  onClickAdd,
}: {
  panel: (typeof PANELS)[number];
  posts: Post[];
  boardId: string;
  canPost: boolean;
  currentUid: string;
  isHost: boolean;
  showReactionCounts: boolean;
  titleEnabled?: boolean;
  isLocked: boolean;
  onUpdatePost: (id: string, content: string, title?: string) => Promise<void>;
  onDeletePost: (id: string) => Promise<void>;
  onOpenDetail: (post: Post) => void;
  onClickAdd: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `col-${panel.id}`,
    data: { columnId: panel.id, type: 'column' },
  });

  return (
    <div className={`flex-1 flex flex-col min-w-0 ${panel.panelClass}`}>
      <div className={`flex items-center justify-between px-5 py-3 flex-shrink-0 ${panel.headerClass}`}>
        <span className="font-bold text-base">{panel.emoji} {panel.label}</span>
        <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-semibold">
          {posts.length}개
        </span>
      </div>

      <SortableContext items={posts.map((p) => p.id)} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={`flex-1 overflow-y-auto p-3 space-y-2 transition-colors ${isOver ? 'bg-white/50' : ''}`}
        >
          {posts.map((post) => (
            <SortablePostCard
              key={post.id}
              post={post}
              boardId={boardId}
              currentUid={currentUid}
              isHost={isHost}
              showReactionCounts={showReactionCounts}
              titleEnabled={titleEnabled}
              canDrag={!isLocked || isHost}
              onUpdate={onUpdatePost}
              onDelete={onDeletePost}
              onOpenDetail={onOpenDetail}
            />
          ))}
          {posts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <span className={`text-4xl opacity-30 ${panel.emptyClass}`}>{panel.emoji}</span>
              <p className="text-xs text-gray-400">아직 의견이 없습니다</p>
            </div>
          )}
        </div>
      </SortableContext>

      {canPost && (
        <div className="px-3 py-2 flex-shrink-0">
          <button
            onClick={onClickAdd}
            className={`w-full text-xs text-gray-500 border border-dashed border-gray-300 rounded-md py-2 transition-colors ${panel.addBtnClass}`}
          >
            + 의견 추가
          </button>
        </div>
      )}
    </div>
  );
}

export function ProsConsBoard({
  posts,
  boardId,
  canPost,
  currentUid,
  isHost,
  showReactionCounts,
  titleEnabled,
  isLocked,
  onAddPost,
  onUpdatePost,
  onDeletePost,
  onOpenDetail,
}: ProsConsBoardProps) {
  const [activeColumn, setActiveColumn] = useState<string | null>(null);

  const postsByPanel: Record<string, Post[]> = { pros: [], cons: [] };
  for (const p of posts) {
    if (p.columnId === 'pros' || p.columnId === 'cons') postsByPanel[p.columnId].push(p);
  }

  const activePanel = PANELS.find((p) => p.id === activeColumn);

  return (
    <div className="flex flex-col flex-1 overflow-hidden h-full">
      {isLocked && !isHost && (
        <div className="text-center py-2.5 bg-gray-50 border-b border-gray-200 flex-shrink-0">
          <p className="text-xs text-gray-500">🔒 퍼실리테이터가 보드를 잠갔습니다. 새 포스트를 작성할 수 없습니다.</p>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden divide-x divide-gray-300">
        {PANELS.map((panel) => (
          <Panel
            key={panel.id}
            panel={panel}
            posts={postsByPanel[panel.id]}
            boardId={boardId}
            canPost={canPost}
            currentUid={currentUid}
            isHost={isHost}
            showReactionCounts={showReactionCounts}
            titleEnabled={titleEnabled}
            isLocked={isLocked}
            onUpdatePost={onUpdatePost}
            onDeletePost={onDeletePost}
            onOpenDetail={onOpenDetail}
            onClickAdd={() => setActiveColumn(panel.id)}
          />
        ))}
      </div>

      {activePanel && (
        <NewPostDialog
          open
          onClose={() => setActiveColumn(null)}
          onSubmit={(content, color, imageFile, title) =>
            onAddPost(content, color, imageFile, activePanel.id, title)
          }
          defaultColor={activePanel.defaultColor}
          columnLabel={`${activePanel.emoji} ${activePanel.label}`}
          titleEnabled={titleEnabled}
        />
      )}
    </div>
  );
}
