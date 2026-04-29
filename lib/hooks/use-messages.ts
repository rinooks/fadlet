'use client';

import {
  addDoc,
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase/client';
import { messagesPath } from '@/lib/firebase/collections';
import type { Message, UserRole } from '@/lib/types';

export function useMessages(boardId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, messagesPath(boardId)),
      orderBy('createdAt', 'asc'),
      limit(200)
    );
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Message));
      setLoading(false);
    });
    return unsub;
  }, [boardId]);

  async function sendMessage(params: {
    authorId: string;
    authorName: string;
    role: UserRole;
    content: string;
  }) {
    await addDoc(collection(db, messagesPath(boardId)), {
      ...params,
      type: 'text',
      createdAt: serverTimestamp(),
    });
  }

  return { messages, loading, sendMessage };
}
