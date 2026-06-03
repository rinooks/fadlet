'use client';

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';
import { db } from '@/lib/firebase/client';
import { wordcloudEntriesPath } from '@/lib/firebase/collections';
import { safeParseDocs, wordcloudEntrySchema } from '@/lib/types/schemas';
import type { WordcloudEntry } from '@/lib/types';

export function useWordcloud(boardId: string, stageId: string | null) {
  const [entries, setEntries] = useState<WordcloudEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!boardId || !stageId) {
      setEntries([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const q = query(
      collection(db, wordcloudEntriesPath(boardId)),
      where('stageId', '==', stageId),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = safeParseDocs<WordcloudEntry>(snap.docs, wordcloudEntrySchema, 'useWordcloud');
        setEntries(list);
        setLoading(false);
      },
      (err) => {
        console.error('[useWordcloud] snapshot error', err);
        setLoading(false);
      },
    );
    return unsub;
  }, [boardId, stageId]);

  const addEntry = useCallback(
    async (userId: string, text: string) => {
      if (!boardId || !stageId) return;
      const trimmed = text.trim();
      if (!trimmed) return;
      await addDoc(collection(db, wordcloudEntriesPath(boardId)), {
        stageId,
        userId,
        text: trimmed,
        createdAt: serverTimestamp(),
      });
    },
    [boardId, stageId],
  );

  const removeEntry = useCallback(
    async (entryId: string) => {
      if (!boardId) return;
      await deleteDoc(doc(db, wordcloudEntriesPath(boardId), entryId));
    },
    [boardId],
  );

  return { entries, loading, addEntry, removeEntry };
}
