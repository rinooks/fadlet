'use client';

import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { boardsPath } from '@/lib/firebase/collections';
import { runFirestore } from '@/lib/utils/firestore-action';

export function useLockBoard(boardId: string) {
  const ref = doc(db, boardsPath(), boardId);

  async function lockBoard() {
    await runFirestore('보드를 잠그지 못했습니다.', () =>
      updateDoc(ref, {
        'settings.lockedAt': serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    );
  }

  async function unlockBoard() {
    await runFirestore('보드 잠금을 해제하지 못했습니다.', () =>
      updateDoc(ref, {
        'settings.lockedAt': null,
        updatedAt: serverTimestamp(),
      }),
    );
  }

  return { lockBoard, unlockBoard };
}
