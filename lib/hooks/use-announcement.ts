'use client';

import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { boardsPath } from '@/lib/firebase/collections';
import { runFirestore } from '@/lib/utils/firestore-action';

export function useAnnouncement(boardId: string) {
  const ref = doc(db, boardsPath(), boardId);

  async function pinAnnouncement(content: string, byUserId: string, byName: string) {
    const trimmed = content.trim();
    if (!trimmed) return;
    await runFirestore('공지를 고정하지 못했습니다.', () =>
      updateDoc(ref, {
        pinnedAnnouncement: {
          content: trimmed,
          byUserId,
          byName,
          pinnedAt: serverTimestamp(),
        },
        updatedAt: serverTimestamp(),
      }),
    );
  }

  async function unpinAnnouncement() {
    await runFirestore('공지 고정을 해제하지 못했습니다.', () =>
      updateDoc(ref, {
        pinnedAnnouncement: null,
        updatedAt: serverTimestamp(),
      }),
    );
  }

  return { pinAnnouncement, unpinAnnouncement };
}
