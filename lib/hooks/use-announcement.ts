'use client';

import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { boardsPath } from '@/lib/firebase/collections';

export function useAnnouncement(boardId: string) {
  async function pinAnnouncement(content: string, byUserId: string, byName: string) {
    const trimmed = content.trim();
    if (!trimmed) return;
    await updateDoc(doc(db, boardsPath(), boardId), {
      pinnedAnnouncement: {
        content: trimmed,
        byUserId,
        byName,
        pinnedAt: serverTimestamp(),
      },
      updatedAt: serverTimestamp(),
    });
  }

  async function unpinAnnouncement() {
    await updateDoc(doc(db, boardsPath(), boardId), {
      pinnedAnnouncement: null,
      updatedAt: serverTimestamp(),
    });
  }

  return { pinAnnouncement, unpinAnnouncement };
}
