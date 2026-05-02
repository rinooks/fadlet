'use client';

import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortablePostCard } from './sortable-post-card';
import { NewPostDialog } from './new-post-dialog';
import type { Post, PostColor } from '@/lib/types';

interface ProsConsBoardProps {
  posts: Post[];
  canPost: boolean;
  currentUid: string;
  isHost: boolean;
  isLocked: boolean;
  onAddPost: (content: string, color: PostColor, imageFile?: File, columnId?: string) => Promise<void>;
  onUpdatePost: (postId: string, content: string) => Promise<void>;
  onDeletePost: (postId: string) => Promise<void>;
  onOpenDetail: (post: Post) => void;
}

const PANELS = [
  {
    id: 'pros',
    label: '👍 찬성',
    defaultColor: 'green' as PostColor,
    headerClass: 'bg-emerald-500 text-white',
    panelClass: 'bg-emerald-50/50',
    addBtnClass: 'hover:bg-emerald-100 hover:border-emerald-400 hover:text-emerald-700',
    emptyClass: 'text-emerald-300',
  },
  {
    id: 'cons',
    label: '👎 반대',
    defaultColor: 'pink' as PostColor,
    headerClass: 'bg-red-500 text-white',
    panelClass: 'bg-red-50/50',
    addBtnClass: 'hover:bg-red-100 hover:border-red-400 hover:text-red-700',
    emptyClass: 'text-red-300',
  },
] as const;

function DroppablePanel({
  columnId,
  postIds,
  children,
  isOver,
  setNodeRef,
}: {
  columnId: string;
  postIds: string[];
  children: React.ReactNode;
  isOver: boolean;
  setNodeRef: (el: HTMLElement | null) => void;
}) {
  return (
    <SortableContext items={postIds} strategy={verticalListSortingStrategy}>
      <div
        ref={setNodeRef}
        className={`flex-1 overflow-y-auto p-3 space-y-2 transition-colors ${isOver ? 'bg-white/50' : ''}`}
      >
        {children}
      </div>
    </SortableContext>
  );
}

function Panel({
  panel,
  posts,
  canPost,
  currentUid,
  isHost,
  isLocked,
  onUpdatePost,
  onDeletePost,
  onOpenDetail,
  onClickAdd,
}: {
  panel: (typeof PANELS)[number];
  posts: Post[];
  canPost: boolean;
  currentUid: string;
  isHost: boolean;
  isLocked: boolean;
  onUpdatePost: (id: string, content: string) => Promise<void>;
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
        <span className="font-bold text-base">{panel.label}</span>
        <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-semibold">
          {posts.length}개
        </span>
      </div>

      <DroppablePanel
        columnId={panel.id}
        postIds={posts.map((p) => p.id)}
        isOver={isOver}
        setNodeRef={setNodeRef}
      >
        {posts.map((post) => (
          <SortablePostCard
            key={post.id}
            post={post}
            currentUid={currentUid}
            isHost={isHost}
            canDrag={!isLocked || isHost}
            onUpdate={onUpdatePost}
            onDelete={onDeletePost}
            onOpenDetail={onOpenDetail}
          />
        ))}
        {posts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <span className={`text-4xl opacity-30 ${panel.emptyClass}`}>
              {panel.id === 'pros' ? '👍' : '👎'}
            </span>
            <p className="text-xs text-gray-400">아직 의견이 없습니다</p>
          </div>
        )}
      </DroppablePanel>

      {canPost && (
        <div className="px-3 py-2 flex-shrink-0">
          <button
            onClick={onClickAdd}
            className={`w-full text-xs text-gray-500 border border-dashed border-gray-300 rounded-lg py-2 transition-colors ${panel.addBtnClass}`}
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
  canPost,
  currentUid,
  isHost,
  isLocked,
  onAddPost,
  onUpdatePost,
  onDeletePost,
  onOpenDetail,
}: ProsConsBoardProps) {
  const [activeColumn, setActiveColumn] = useState<string | null>(null);

  const prosPosts = posts.filter((p) => p.columnId === 'pros');
  const consPosts = posts.filter((p) => p.columnId === 'cons');
  const postsByPanel = { pros: prosPosts, cons: consPosts };

  return (
    <div className="flex flex-col flex-1 overflow-hidden h-full">
      {isLocked && !isHost && (
        <div className="text-center py-2.5 bg-gray-50 border-b border-gray-200 flex-shrink-0">
          <p className="text-xs text-gray-500">🔒 운영자가 보드를 잠갔습니다. 새 포스트를 작성할 수 없습니다.</p>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {PANELS.map((panel, idx) => (
          <div key={panel.id} className="flex flex-1 min-w-0 overflow-hidden">
            {idx > 0 && <div className="w-px bg-gray-300 flex-shrink-0" />}
            <Panel
              panel={panel}
              posts={postsByPanel[panel.id]}
              canPost={canPost}
              currentUid={currentUid}
              isHost={isHost}
              isLocked={isLocked}
              onUpdatePost={onUpdatePost}
              onDeletePost={onDeletePost}
              onOpenDetail={onOpenDetail}
              onClickAdd={() => setActiveColumn(panel.id)}
            />
          </div>
        ))}
      </div>

      {activeColumn && (
        <NewPostDialog
          open
          onClose={() => setActiveColumn(null)}
          onSubmit={(content, color, imageFile) =>
            onAddPost(content, color, imageFile, activeColumn)
          }
          defaultColor={PANELS.find((p) => p.id === activeColumn)?.defaultColor}
          columnLabel={PANELS.find((p) => p.id === activeColumn)?.label}
        />
      )}
    </div>
  );
}
