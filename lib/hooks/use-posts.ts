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
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase/client';
import { postsPath } from '@/lib/firebase/collections';
import type { Post, PostColor } from '@/lib/types';

export function usePosts(boardId: string) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, postsPath(boardId)), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Post);
      list.sort((a, b) => {
        const oa = a.order ?? a.createdAt?.toMillis?.() ?? 0;
        const ob = b.order ?? b.createdAt?.toMillis?.() ?? 0;
        return oa - ob;
      });
      setPosts(list);
      setLoading(false);
    });
    return unsub;
  }, [boardId]);

  async function addPost(params: {
    authorId: string;
    authorName: string;
    content: string;
    color: PostColor;
    imageUrl?: string;
    columnId?: string;
  }) {
    const payload: Record<string, unknown> = {
      authorId: params.authorId,
      authorName: params.authorName,
      content: params.content,
      color: params.color,
      position: null,
      order: Date.now(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (params.imageUrl) payload.imageUrl = params.imageUrl;
    if (params.columnId) payload.columnId = params.columnId;
    await addDoc(collection(db, postsPath(boardId)), payload);
  }

  async function updatePost(postId: string, content: string) {
    await updateDoc(doc(db, postsPath(boardId), postId), {
      content,
      updatedAt: serverTimestamp(),
    });
  }

  async function deletePost(postId: string) {
    await deleteDoc(doc(db, postsPath(boardId), postId));
  }

  async function reorderPosts(orderedIds: string[], columnUpdates?: Record<string, string | undefined>) {
    const batch = writeBatch(db);
    orderedIds.forEach((id, idx) => {
      const ref = doc(db, postsPath(boardId), id);
      const payload: Record<string, unknown> = { order: (idx + 1) * 1000 };
      if (columnUpdates && id in columnUpdates) payload.columnId = columnUpdates[id] ?? null;
      batch.update(ref, payload);
    });
    await batch.commit();
  }

  return { posts, loading, addPost, updatePost, deletePost, reorderPosts };
}
