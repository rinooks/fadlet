'use client';

import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase/client';
import { boardsPath } from '@/lib/firebase/collections';
import type { Board } from '@/lib/types';

export function useBoard(boardId: string) {
  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ref = doc(db, boardsPath(), boardId);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          setBoard({ id: snap.id, ...snap.data() } as Board);
        } else {
          setError('보드를 찾을 수 없습니다.');
        }
        setLoading(false);
      },
      () => {
        setError('보드를 불러오는 중 오류가 발생했습니다.');
        setLoading(false);
      }
    );
    return unsub;
  }, [boardId]);

  return { board, loading, error };
}
