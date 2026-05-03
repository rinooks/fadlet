'use client';

import { DndContext, DragEndEvent, PointerSensor, TouchSensor, useDraggable, useSensor, useSensors } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useMemo, useState } from 'react';
import { PostCard } from './post-card';
import type { Post } from '@/lib/types';

const CANVAS_WIDTH = 3000;
const CANVAS_HEIGHT = 2000;
const POST_WIDTH = 220;
const POST_HEIGHT_ESTIMATE = 140;

interface CanvasBoardProps {
  posts: Post[];
  canDrag: boolean;
  currentUid: string;
  isHost: boolean;
  onUpdate: (postId: string, content: string) => Promise<void>;
  onDelete: (postId: string) => Promise<void>;
  onUpdatePosition: (postId: string, pos: { x: number; y: number }) => Promise<void>;
  onOpenDetail: (post: Post) => void;
}

interface DraggablePostProps {
  post: Post;
  position: { x: number; y: number };
  canDrag: boolean;
  currentUid: string;
  isHost: boolean;
  onUpdate: (postId: string, content: string) => Promise<void>;
  onDelete: (postId: string) => Promise<void>;
  onOpenDetail: (post: Post) => void;
}

function DraggablePost({ post, position, canDrag, ...rest }: DraggablePostProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: post.id,
    disabled: !canDrag,
  });

  const style: React.CSSProperties = {
    position: 'absolute',
    left: position.x,
    top: position.y,
    width: POST_WIDTH,
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.85 : 1,
    zIndex: isDragging ? 50 : 1,
    cursor: canDrag ? (isDragging ? 'grabbing' : 'grab') : 'default',
    touchAction: 'none',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <PostCard post={post} {...rest} />
    </div>
  );
}

export function CanvasBoard({
  posts,
  canDrag,
  currentUid,
  isHost,
  onUpdate,
  onDelete,
  onUpdatePosition,
  onOpenDetail,
}: CanvasBoardProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  );

  // 드래그 종료 직후 Firestore 스냅샷 도착 전까지 위치를 유지하기 위한 로컬 오버라이드
  const [localPositions, setLocalPositions] = useState<Record<string, { x: number; y: number }>>({});

  // 위치가 없는 포스트엔 자동으로 적당한 좌표를 배정 (생성 순서 기반 격자)
  const positioned = useMemo(() => {
    return posts.map((post, idx) => {
      const local = localPositions[post.id];
      if (local) return { post, x: local.x, y: local.y };
      if (post.position && typeof post.position.x === 'number' && typeof post.position.y === 'number') {
        return { post, x: post.position.x, y: post.position.y };
      }
      // 자동 배치: 5칸 격자
      const col = idx % 5;
      const row = Math.floor(idx / 5);
      return {
        post,
        x: 60 + col * (POST_WIDTH + 20),
        y: 60 + row * (POST_HEIGHT_ESTIMATE + 20),
      };
    });
  }, [posts, localPositions]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, delta } = event;
    if (!delta || (delta.x === 0 && delta.y === 0)) return;
    const id = String(active.id);
    const item = positioned.find((p) => p.post.id === id);
    if (!item) return;
    const newX = Math.round(Math.max(0, Math.min(CANVAS_WIDTH - POST_WIDTH, item.x + delta.x)));
    const newY = Math.round(Math.max(0, Math.min(CANVAS_HEIGHT - POST_HEIGHT_ESTIMATE, item.y + delta.y)));

    // 즉시 로컬 반영 → 튀는 느낌 제거
    setLocalPositions((prev) => ({ ...prev, [id]: { x: newX, y: newY } }));

    onUpdatePosition(id, { x: newX, y: newY }).catch(() => {
      // 실패 시 로컬 오버라이드 제거 → Firestore 값으로 복구
      setLocalPositions((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    });
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="relative w-full h-full overflow-auto bg-gray-50">
        <div
          className="relative"
          style={{
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
            backgroundColor: '#FAFAFB',
            backgroundImage: [
              'radial-gradient(circle, rgba(99,102,241,0.18) 2px, transparent 2px)',
              'radial-gradient(circle, rgba(15,23,42,0.10) 1px, transparent 1px)',
            ].join(', '),
            backgroundSize: '120px 120px, 24px 24px',
            backgroundPosition: '0 0, 0 0',
          }}
        >
          {positioned.map(({ post, x, y }) => (
            <DraggablePost
              key={post.id}
              post={post}
              position={{ x, y }}
              canDrag={canDrag}
              currentUid={currentUid}
              isHost={isHost}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onOpenDetail={onOpenDetail}
            />
          ))}
          {posts.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm pointer-events-none">
              포스트가 없습니다. 우측 상단에서 추가하세요.
            </div>
          )}
        </div>
      </div>
    </DndContext>
  );
}
