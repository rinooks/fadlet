'use client';

import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { boardsPath } from '@/lib/firebase/collections';

export function useLockBoard(boardId: string) {
  async function lockBoard() {
    await updateDoc(doc(db, boardsPath(), boardId), {
      'settings.lockedAt': serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  async function unlockBoard() {
    await updateDoc(doc(db, boardsPath(), boardId), {
      'settings.lockedAt': null,
      updatedAt: serverTimestamp(),
    });
  }

  return { lockBoard, unlockBoard };
}
