'use client';

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase/client';
import { postsPath } from '@/lib/firebase/collections';
import type { Comment } from '@/lib/types';

export function useComments(boardId: string, postId: string) {
  const [comments, setComments] = useState<Comment[]>([]);

  useEffect(() => {
    if (!postId) return;
    const q = query(
      collection(db, `${postsPath(boardId)}/${postId}/comments`),
      orderBy('createdAt', 'asc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setComments(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Comment));
    });
    return unsub;
  }, [boardId, postId]);

  async function addComment(params: { authorId: string; authorName: string; content: string }) {
    await addDoc(collection(db, `${postsPath(boardId)}/${postId}/comments`), {
      ...params,
      createdAt: serverTimestamp(),
    });
  }

  async function deleteComment(commentId: string) {
    await deleteDoc(doc(db, `${postsPath(boardId)}/${postId}/comments`, commentId));
  }

  return { comments, addComment, deleteComment };
}
