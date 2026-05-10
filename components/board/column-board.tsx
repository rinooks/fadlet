'use client';

import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortablePostCard } from './sortable-post-card';
import { NewPostDialog } from './new-post-dialog';
import type { TemplateDefinition } from '@/lib/templates';
import type { Post, PostColor } from '@/lib/types';

interface ColumnBoardProps {
  template: TemplateDefinition;
  posts: Post[];
  boardId: string;
  canPost: boolean;
  currentUid: string;
  isHost: boolean;
  showReactionCounts: boolean;
  isLocked: boolean;
  onAddPost: (content: string, color: PostColor, imageFile?: File, columnId?: string) => Promise<void>;
  onUpdatePost: (postId: string, content: string) => Promise<void>;
  onDeletePost: (postId: string) => Promise<void>;
  onOpenDetail: (post: Post) => void;
}

interface DroppableColumnProps {
  columnId: string;
  isGrid: boolean;
  postIds: string[];
  children: React.ReactNode;
}

function FlowFragment({ showFlow, isFirst, children }: { showFlow: boolean; isFirst: boolean; children: React.ReactNode }) {
  if (!showFlow) return <>{children}</>;
  return (
    <>
      {!isFirst && (
        <div className="flex items-center text-indigo-300 px-1 flex-shrink-0" aria-hidden>
          <span className="text-xl font-bold">→</span>
        </div>
      )}
      {children}
    </>
  );
}

function DroppableColumn({ columnId, isGrid, postIds, children }: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `col-${columnId}`, data: { columnId, type: 'column' } });

  return (
    <SortableContext items={postIds} strategy={verticalListSortingStrategy}>
      <div
        ref={setNodeRef}
        className={`flex-1 p-2 space-y-2 overflow-y-auto rounded-b-md transition-colors ${
          isOver ? 'bg-indigo-50' : ''
        } ${isGrid ? 'min-h-[120px]' : 'min-h-[200px]'}`}
      >
        {children}
      </div>
    </SortableContext>
  );
}

export function ColumnBoard({
  template,
  posts,
  boardId,
  canPost,
  currentUid,
  isHost,
  showReactionCounts,
  isLocked,
  onAddPost,
  onUpdatePost,
  onDeletePost,
  onOpenDetail,
}: ColumnBoardProps) {
  const [activeColumn, setActiveColumn] = useState<string | null>(null);

  const columns = template.columns ?? [];
  const isGrid = !!template.gridCols;
  const showFlow = !!template.showFlow && !isGrid;

  const containerClass = isGrid
    ? `grid gap-2`
    : showFlow
      ? 'flex items-stretch overflow-x-auto pb-2'
      : 'flex gap-3 overflow-x-auto pb-2';

  const containerStyle = isGrid
    ? { gridTemplateColumns: `repeat(${template.gridCols}, minmax(0, 1fr))` }
    : undefined;

  return (
    <>
      {isLocked && !isHost && (
        <div className="text-center py-3 mb-3 bg-gray-50 rounded-md border border-gray-200">
          <p className="text-sm text-gray-500">🔒 퍼실리테이터가 보드를 잠갔습니다. 새 포스트를 작성할 수 없습니다.</p>
        </div>
      )}

      <div className={containerClass} style={containerStyle}>
        {columns.map((col, idx) => {
          const colPosts = posts.filter((p) => p.columnId === col.id);
          const postIds = colPosts.map((p) => p.id);
          return (
            <FlowFragment key={col.id} showFlow={showFlow} isFirst={idx === 0}>
            <div
              className={`flex flex-col rounded-md border border-gray-200 bg-white/70 ${
                isGrid ? 'min-h-[200px]' : 'min-w-[240px] flex-shrink-0 w-64'
              } ${showFlow ? 'mx-1' : ''}`}
            >
              <div
                className={`flex items-center justify-between px-3 py-2 rounded-t-md font-semibold text-sm ${col.headerStyle ? '' : col.headerClass}`}
                style={col.headerStyle}
              >
                <span>{col.label}</span>
                <span className="text-xs opacity-70">{colPosts.length}</span>
              </div>

              <DroppableColumn columnId={col.id} isGrid={isGrid} postIds={postIds}>
                {colPosts.map((post) => (
                  <SortablePostCard
                    key={post.id}
                    post={post}
                    boardId={boardId}
                    currentUid={currentUid}
                    isHost={isHost}
                    showReactionCounts={showReactionCounts}
                    canDrag={!isLocked || isHost}
                    onUpdate={onUpdatePost}
                    onDelete={onDeletePost}
                    onOpenDetail={onOpenDetail}
                  />
                ))}
                {colPosts.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-4">포스트가 없습니다</p>
                )}
              </DroppableColumn>

              {canPost && (
                <div className="px-2 pb-2">
                  <button
                    onClick={() => setActiveColumn(col.id)}
                    className="w-full text-xs text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 border border-dashed border-gray-300 hover:border-indigo-400 rounded-md py-1.5 transition-colors"
                  >
                    + 추가
                  </button>
                </div>
              )}
            </div>
            </FlowFragment>
          );
        })}
      </div>

      {activeColumn && (
        <NewPostDialog
          open={true}
          onClose={() => setActiveColumn(null)}
          onSubmit={(content, color, imageFile) =>
            onAddPost(content, color, imageFile, activeColumn)
          }
          defaultColor={columns.find((c) => c.id === activeColumn)?.defaultColor}
          columnLabel={columns.find((c) => c.id === activeColumn)?.label}
        />
      )}
    </>
  );
}
