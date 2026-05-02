'use client';

import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { useCallback, useEffect, useRef, useState } from 'react';
import { db } from '@/lib/firebase/client';
import { messagesPath } from '@/lib/firebase/collections';
import type { EmojiType, LinkPreview, Message, MessageReplyTo, MessageType, UserRole } from '@/lib/types';

const URL_REGEX = /https?:\/\/[^\s]+/g;

export function useMessages(boardId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const messagesRef = useRef<Message[]>([]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (!boardId) return;
    const q = query(
      collection(db, messagesPath(boardId)),
      orderBy('createdAt', 'asc'),
      limit(200)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const msgs = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Message);
        setMessages(msgs);
        setLoading(false);
      },
      (err) => {
        console.error('[useMessages] snapshot error', err);
        setLoading(false);
      }
    );
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
    replyTo?: MessageReplyTo;
  }) {
    const msgType: MessageType = params.type ?? 'text';

    const data: Record<string, unknown> = {
      authorId: params.authorId,
      authorName: params.authorName,
      role: params.role,
      content: params.content,
      type: msgType,
      createdAt: serverTimestamp(),
    };
    if (params.fileUrl) data.fileUrl = params.fileUrl;
    if (params.fileName) data.fileName = params.fileName;
    if (params.fileSize !== undefined) data.fileSize = params.fileSize;
    if (params.replyTo) data.replyTo = params.replyTo;

    // URL 자동 감지 → OG 미리보기
    if (msgType === 'text') {
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

  const toggleReaction = useCallback(async (messageId: string, userId: string, emoji: EmojiType) => {
    const msg = messagesRef.current.find((m) => m.id === messageId);
    const reactors = (msg?.reactions?.[emoji] ?? []) as string[];
    const ref = doc(db, messagesPath(boardId), messageId);
    if (reactors.includes(userId)) {
      await updateDoc(ref, { [`reactions.${emoji}`]: arrayRemove(userId) });
    } else {
      await updateDoc(ref, { [`reactions.${emoji}`]: arrayUnion(userId) });
    }
  }, [boardId]);

  return { messages, loading, sendMessage, toggleReaction };
}
