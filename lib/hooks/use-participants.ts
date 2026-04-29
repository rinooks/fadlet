'use client';

import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase/client';
import { participantsPath } from '@/lib/firebase/collections';
import type { Participant, UserRole } from '@/lib/types';

export function useParticipants(boardId: string) {
  const [participants, setParticipants] = useState<(Participant & { id: string })[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, participantsPath(boardId)), (snap) => {
      setParticipants(
        snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Participant & { id: string })
      );
    });
    return unsub;
  }, [boardId]);

  async function joinBoard(params: {
    userId: string;
    nickname: string;
    role: UserRole;
  }) {
    const ref = doc(db, participantsPath(boardId), params.userId);
    await setDoc(ref, {
      nickname: params.nickname,
      role: params.role,
      joinedAt: serverTimestamp(),
      lastActiveAt: serverTimestamp(),
      isOnline: true,
    });
  }

  async function setOffline(userId: string) {
    const ref = doc(db, participantsPath(boardId), userId);
    await updateDoc(ref, { isOnline: false, lastActiveAt: serverTimestamp() });
  }

  const onlineCount = participants.filter((p) => p.isOnline).length;

  return { participants, onlineCount, joinBoard, setOffline };
}
