'use client';

import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';
import { db } from '@/lib/firebase/client';
import { activityStateDocPath } from '@/lib/firebase/collections';
import type { ActivityState } from '@/lib/types';

const DEFAULT_STATE: ActivityState = { resultsVisible: false, closed: false };

export function useActivityState(boardId: string, stageId: string | null) {
  const [state, setState] = useState<ActivityState>(DEFAULT_STATE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!boardId || !stageId) {
      setState(DEFAULT_STATE);
      setLoading(false);
      return;
    }
    setLoading(true);
    const ref = doc(db, activityStateDocPath(boardId, stageId));
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          setState(snap.data() as ActivityState);
        } else {
          setState(DEFAULT_STATE);
        }
        setLoading(false);
      },
      (err) => {
        console.error('[useActivityState] snapshot error', err);
        setLoading(false);
      },
    );
    return unsub;
  }, [boardId, stageId]);

  const setResultsVisible = useCallback(
    async (visible: boolean) => {
      if (!boardId || !stageId) return;
      const ref = doc(db, activityStateDocPath(boardId, stageId));
      await setDoc(
        ref,
        { resultsVisible: visible, updatedAt: serverTimestamp() },
        { merge: true },
      );
    },
    [boardId, stageId],
  );

  const setClosed = useCallback(
    async (closed: boolean) => {
      if (!boardId || !stageId) return;
      const ref = doc(db, activityStateDocPath(boardId, stageId));
      await setDoc(
        ref,
        { closed, updatedAt: serverTimestamp() },
        { merge: true },
      );
    },
    [boardId, stageId],
  );

  return { state, loading, setResultsVisible, setClosed };
}
