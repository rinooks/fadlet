'use client';

import { useState } from 'react';
import { PostCard } from './post-card';
import { NewPostDialog } from './new-post-dialog';
import type { TemplateDefinition } from '@/lib/templates';
import type { Post, PostColor } from '@/lib/types';

interface ColumnBoardProps {
  template: TemplateDefinition;
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

export function ColumnBoard({
  template,
  posts,
  canPost,
  currentUid,
  isHost,
  isLocked,
  onAddPost,
  onUpdatePost,
  onDeletePost,
  onOpenDetail,
}: ColumnBoardProps) {
  const [activeColumn, setActiveColumn] = useState<string | null>(null);

  const columns = template.columns ?? [];
  const isGrid = !!template.gridCols;

  const containerClass = isGrid
    ? `grid gap-2`
    : 'flex gap-3 overflow-x-auto pb-2';

  const containerStyle = isGrid
    ? { gridTemplateColumns: `repeat(${template.gridCols}, minmax(0, 1fr))` }
    : undefined;

  return (
    <>
      {isLocked && !isHost && (
        <div className="text-center py-3 mb-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500">🔒 운영자가 보드를 잠갔습니다. 새 포스트를 작성할 수 없습니다.</p>
        </div>
      )}

      <div className={containerClass} style={containerStyle}>
        {columns.map((col) => {
          const colPosts = posts.filter((p) => p.columnId === col.id);
          return (
            <div
              key={col.id}
              className={`flex flex-col rounded-xl border border-gray-200 bg-white/70 ${
                isGrid ? 'min-h-[200px]' : 'min-w-[240px] flex-shrink-0 w-64'
              }`}
            >
              <div className={`flex items-center justify-between px-3 py-2 rounded-t-xl font-semibold text-sm ${col.headerClass}`}>
                <span>{col.label}</span>
                <span className="text-xs opacity-70">{colPosts.length}</span>
              </div>

              <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                {colPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    currentUid={currentUid}
                    isHost={isHost}
                    onUpdate={onUpdatePost}
                    onDelete={onDeletePost}
                    onOpenDetail={onOpenDetail}
                  />
                ))}
                {colPosts.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-4">포스트가 없습니다</p>
                )}
              </div>

              {canPost && (
                <div className="px-2 pb-2">
                  <button
                    onClick={() => setActiveColumn(col.id)}
                    className="w-full text-xs text-gray-400 hover:text-blue-600 hover:bg-blue-50 border border-dashed border-gray-300 hover:border-blue-400 rounded-lg py-1.5 transition-colors"
                  >
                    + 추가
                  </button>
                </div>
              )}
            </div>
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
