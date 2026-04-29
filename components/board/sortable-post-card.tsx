'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { PostCard } from './post-card';
import type { Post } from '@/lib/types';

interface SortablePostCardProps {
  post: Post;
  currentUid: string;
  isHost: boolean;
  canDrag: boolean;
  onUpdate: (postId: string, content: string) => Promise<void>;
  onDelete: (postId: string) => Promise<void>;
  onOpenDetail: (post: Post) => void;
}

export function SortablePostCard({ post, canDrag, ...rest }: SortablePostCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: post.id,
    data: { columnId: post.columnId ?? null, type: 'post' },
    disabled: !canDrag,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      {canDrag && (
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="포스트 드래그하여 순서 변경"
          className="absolute top-1 right-1 z-10 p-1 rounded text-gray-400 opacity-0 group-hover:opacity-100 hover:text-blue-600 hover:bg-white/70 cursor-grab active:cursor-grabbing focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 transition-opacity"
        >
          <GripVertical size={14} />
        </button>
      )}
      <PostCard post={post} {...rest} />
    </div>
  );
}
