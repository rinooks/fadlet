'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { Post, PostColor } from '@/lib/types';

const COLOR_MAP: Record<PostColor, string> = {
  yellow: 'bg-yellow-100 border-yellow-300',
  blue: 'bg-blue-100 border-blue-300',
  pink: 'bg-pink-100 border-pink-300',
  green: 'bg-green-100 border-green-300',
  purple: 'bg-purple-100 border-purple-300',
  gray: 'bg-gray-100 border-gray-300',
};

interface PostCardProps {
  post: Post;
  currentUid: string;
  isHost: boolean;
  onUpdate: (postId: string, content: string) => Promise<void>;
  onDelete: (postId: string) => Promise<void>;
}

export function PostCard({ post, currentUid, isHost, onUpdate, onDelete }: PostCardProps) {
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const canEdit = post.authorId === currentUid || isHost;

  async function handleSave() {
    if (!editContent.trim()) return;
    await onUpdate(post.id, editContent.trim());
    setEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      setEditContent(post.content);
      setEditing(false);
    }
  }

  return (
    <div
      className={`relative rounded-xl border-2 p-4 shadow-sm min-h-[120px] flex flex-col ${COLOR_MAP[post.color]}`}
    >
      {editing ? (
        <div className="flex flex-col gap-2 flex-1">
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-white/70 text-sm resize-none border-0 focus-visible:ring-1"
            autoFocus
            maxLength={500}
          />
          <div className="flex gap-2 justify-end">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => { setEditContent(post.content); setEditing(false); }}
              className="text-xs h-7"
            >
              취소
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-7"
            >
              저장
            </Button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-800 flex-1 whitespace-pre-wrap break-words">
            {post.content}
          </p>
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-gray-500 font-medium">{post.authorName}</span>
            {canEdit && (
              <div className="flex gap-1">
                {post.authorId === currentUid && (
                  <button
                    onClick={() => setEditing(true)}
                    className="text-xs text-gray-400 hover:text-gray-700 px-1 focus-visible:outline focus-visible:outline-2 rounded"
                    aria-label="수정"
                  >
                    수정
                  </button>
                )}
                <button
                  onClick={() => onDelete(post.id)}
                  className="text-xs text-red-400 hover:text-red-600 px-1 focus-visible:outline focus-visible:outline-2 rounded"
                  aria-label="삭제"
                >
                  삭제
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
