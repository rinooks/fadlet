'use client';

import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase/client';
import { postsPath } from '@/lib/firebase/collections';
import type { EmojiType, Reaction } from '@/lib/types';

export function useReactions(boardId: string, postId: string) {
  const [reactions, setReactions] = useState<(Reaction & { id: string })[]>([]);

  useEffect(() => {
    if (!postId) return;
    const unsub = onSnapshot(
      collection(db, `${postsPath(boardId)}/${postId}/reactions`),
      (snap) => {
        setReactions(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Reaction & { id: string }));
      }
    );
    return unsub;
  }, [boardId, postId]);

  async function toggleReaction(userId: string, emoji: EmojiType) {
    const ref = doc(db, `${postsPath(boardId)}/${postId}/reactions`, userId);
    const existing = reactions.find((r) => r.id === userId);
    if (existing?.emoji === emoji) {
      await deleteDoc(ref);
    } else {
      await setDoc(ref, { userId, emoji, createdAt: serverTimestamp() });
    }
  }

  function getCount(emoji: EmojiType) {
    return reactions.filter((r) => r.emoji === emoji).length;
  }

  function myEmoji(userId: string): EmojiType | null {
    return reactions.find((r) => r.id === userId)?.emoji ?? null;
  }

  return { reactions, toggleReaction, getCount, myEmoji };
}
