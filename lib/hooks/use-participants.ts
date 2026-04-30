'use client';

import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';
import { db } from '@/lib/firebase/client';
import { participantsPath } from '@/lib/firebase/collections';
import type { Participant, UserRole } from '@/lib/types';

export function useParticipants(boardId: string) {
  const [participants, setParticipants] = useState<(Participant & { id: string })[]>([]);

  useEffect(() => {
    if (!boardId) return;
    const unsub = onSnapshot(collection(db, participantsPath(boardId)), (snap) => {
      setParticipants(
        snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Participant & { id: string })
      );
    });
    return unsub;
  }, [boardId]);

  const joinBoard = useCallback(
    async (params: { userId: string; nickname: string; role: UserRole }) => {
      const ref = doc(db, participantsPath(boardId), params.userId);
      await setDoc(ref, {
        nickname: params.nickname,
        role: params.role,
        joinedAt: serverTimestamp(),
        lastActiveAt: serverTimestamp(),
        isOnline: true,
      });
    },
    [boardId]
  );

  const setOffline = useCallback(
    async (userId: string) => {
      const ref = doc(db, participantsPath(boardId), userId);
      await updateDoc(ref, { isOnline: false, lastActiveAt: serverTimestamp() });
    },
    [boardId]
  );

  const onlineCount = participants.filter((p) => p.isOnline).length;

  return { participants, onlineCount, joinBoard, setOffline };
}
