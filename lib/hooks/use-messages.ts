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
import type { LinkPreview, Message, MessageType, UserRole } from '@/lib/types';

const URL_REGEX = /https?:\/\/[^\s]+/g;

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
    type?: MessageType;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
  }) {
    const { type = 'text', ...rest } = params;
    const data: Record<string, unknown> = { ...rest, type, createdAt: serverTimestamp() };

    // URL 자동 감지 → OG 미리보기
    if (type === 'text') {
      const urls = params.content.match(URL_REGEX);
      if (urls?.[0]) {
        try {
          const res = await fetch(`/api/og-preview?url=${encodeURIComponent(urls[0])}`);
          if (res.ok) {
            const preview: LinkPreview = await res.json();
            if (preview.title) {
              data.type = 'link';
              data.linkPreview = preview;
            }
          }
        } catch {
          // OG 실패 시 일반 텍스트로 전송
        }
      }
    }

    await addDoc(collection(db, messagesPath(boardId)), data);
  }

  return { messages, loading, sendMessage };
}
