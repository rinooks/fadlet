'use client';

import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortablePostCard } from './sortable-post-card';
import { NewPostDialog } from './new-post-dialog';
import type { TemplateDefinition } from '@/lib/templates';
import type { Post, PostAttachment, PostColor } from '@/lib/types';

interface ColumnBoardProps {
  template: TemplateDefinition;
  posts: Post[];
  boardId: string;
  canPost: boolean;
  currentUid: string;
  isHost: boolean;
  showReactionCounts: boolean;
  titleEnabled?: boolean;
  isLocked: boolean;
  onAddPost: (content: string, color: PostColor, imageUrl?: string, columnId?: string, title?: string, attachment?: PostAttachment) => Promise<void>;
  onUpdatePost: (postId: string, content: string, title?: string) => Promise<void>;
  onDeletePost: (postId: string) => Promise<void>;
  onOpenDetail: (post: Post) => void;
}

interface DroppableColumnProps {
  columnId: string;
  isGrid: boolean;
  isCompact?: boolean;
  /** 포스트를 메모지처럼 가로로 wrap되게 배치 */
  isWrap?: boolean;
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

function DroppableColumn({ columnId, isGrid, isCompact, isWrap, postIds, children }: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `col-${columnId}`, data: { columnId, type: 'column' } });
  const minHeightClass = isCompact ? 'min-h-[80px]' : isGrid ? 'min-h-[120px]' : 'min-h-[200px]';
  const layoutClass = isWrap ? 'flex flex-wrap gap-2' : 'space-y-2';

  return (
    <SortableContext items={postIds} strategy={isWrap ? rectSortingStrategy : verticalListSortingStrategy}>
      <div
        ref={setNodeRef}
        className={`flex-1 p-2 overflow-y-auto rounded-b-md transition-colors ${layoutClass} ${
          isOver ? 'bg-indigo-50' : ''
        } ${minHeightClass}`}
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
  titleEnabled,
  isLocked,
  onAddPost,
  onUpdatePost,
  onDeletePost,
  onOpenDetail,
}: ColumnBoardProps) {
  const [activeColumn, setActiveColumn] = useState<string | null>(null);

  const columns = template.columns ?? [];
  const isGrid = !!template.gridCols;
  const stackRows = !!template.stackRows && !isGrid;
  const showFlow = !!template.showFlow && !isGrid && !stackRows;

  const containerClass = isGrid
    ? `grid gap-2`
    : stackRows
      ? 'flex flex-col gap-3'
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
                isGrid
                  ? 'min-h-[200px]'
                  : stackRows
                    ? 'w-full'
                    : 'min-w-[240px] flex-shrink-0 w-64'
              } ${showFlow ? 'mx-1' : ''}`}
            >
              <div
                className={`flex items-center justify-between px-3 py-2 rounded-t-md font-semibold text-sm ${col.headerStyle ? '' : col.headerClass}`}
                style={col.headerStyle}
              >
                <span>{col.label}</span>
                <span className="text-xs opacity-70">{colPosts.length}</span>
              </div>

              <DroppableColumn columnId={col.id} isGrid={isGrid} isCompact={stackRows} isWrap={stackRows} postIds={postIds}>
                {colPosts.map((post) => (
                  <SortablePostCard
                    key={post.id}
                    post={post}
                    boardId={boardId}
                    currentUid={currentUid}
                    isHost={isHost}
                    showReactionCounts={showReactionCounts}
                    titleEnabled={titleEnabled}
                    canDrag={!isLocked || isHost}
                    className={stackRows ? 'w-56 flex-shrink-0' : ''}
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
          onSubmit={(content, color, imageUrl, title, attachment) =>
            onAddPost(content, color, imageUrl, activeColumn, title, attachment)
          }
          boardId={boardId}
          defaultColor={columns.find((c) => c.id === activeColumn)?.defaultColor}
          columnLabel={columns.find((c) => c.id === activeColumn)?.label}
          titleEnabled={titleEnabled}
        />
      )}
    </>
  );
}
