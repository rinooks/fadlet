'use client';

import {
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';
import { db } from '@/lib/firebase/client';
import { pollResponsesPath } from '@/lib/firebase/collections';
import { pollResponseSchema, safeParseDocs } from '@/lib/types/schemas';
import type { PollResponse } from '@/lib/types';
import { runFirestore } from '@/lib/utils/firestore-action';

export function usePoll(boardId: string, stageId: string | null) {
  const [responses, setResponses] = useState<PollResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!boardId || !stageId) {
      setResponses([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const q = query(
      collection(db, pollResponsesPath(boardId)),
      where('stageId', '==', stageId),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = safeParseDocs<PollResponse>(snap.docs, pollResponseSchema, 'usePoll');
        setResponses(list);
        setLoading(false);
      },
      (err) => {
        console.error('[usePoll] snapshot error', err);
        setLoading(false);
      },
    );
    return unsub;
  }, [boardId, stageId]);

  const submitResponse = useCallback(
    async (userId: string, optionIndexes: number[]) => {
      if (!boardId || !stageId) return;
      const docId = `${stageId}_${userId}`;
      const ref = doc(db, pollResponsesPath(boardId), docId);
      await runFirestore('투표 응답을 저장하지 못했습니다.', () =>
        setDoc(
          ref,
          {
            stageId,
            userId,
            optionIndexes,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        ),
      );
    },
    [boardId, stageId],
  );

  return { responses, loading, submitResponse };
}
