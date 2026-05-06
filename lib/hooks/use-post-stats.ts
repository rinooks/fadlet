'use client';

import { collection, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase/client';
import { postsPath } from '@/lib/firebase/collections';
import type { EmojiType, Reaction } from '@/lib/types';

export interface ReactionTally {
  emoji: EmojiType;
  count: number;
}

export interface PostStats {
  commentCount: number;
  reactionTotal: number;
  topReactions: ReactionTally[];
}

const EMPTY: PostStats = { commentCount: 0, reactionTotal: 0, topReactions: [] };

export function usePostStats(boardId: string, postId: string): PostStats {
  const [stats, setStats] = useState<PostStats>(EMPTY);

  useEffect(() => {
    if (!boardId || !postId) {
      setStats(EMPTY);
      return;
    }
    let comments = 0;
    let reactions: ReactionTally[] = [];
    let total = 0;

    function publish() {
      setStats({ commentCount: comments, reactionTotal: total, topReactions: reactions });
    }

    const unsubReactions = onSnapshot(
      collection(db, `${postsPath(boardId)}/${postId}/reactions`),
      (snap) => {
        const counts = new Map<EmojiType, number>();
        snap.docs.forEach((d) => {
          const e = (d.data() as Reaction).emoji;
          counts.set(e, (counts.get(e) ?? 0) + 1);
        });
        reactions = Array.from(counts.entries())
          .map(([emoji, count]) => ({ emoji, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 3);
        total = snap.size;
        publish();
      },
      () => { /* 권한·네트워크 오류는 무시 */ },
    );

    const unsubComments = onSnapshot(
      collection(db, `${postsPath(boardId)}/${postId}/comments`),
      (snap) => {
        comments = snap.size;
        publish();
      },
      () => { /* 권한·네트워크 오류는 무시 */ },
    );

    return () => {
      unsubReactions();
      unsubComments();
    };
  }, [boardId, postId]);

  return stats;
}
