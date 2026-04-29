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
      setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Post));
      setLoading(false);
    });
    return unsub;
  }, [boardId]);

  async function addPost(params: {
    authorId: string;
    authorName: string;
    content: string;
    color: PostColor;
  }) {
    await addDoc(collection(db, postsPath(boardId)), {
      ...params,
      position: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
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

  return { posts, loading, addPost, updatePost, deletePost };
}
