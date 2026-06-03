'use client';

import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';
import { db } from '@/lib/firebase/client';
import { qnaQuestionsPath } from '@/lib/firebase/collections';
import { qnaQuestionSchema, safeParseDocs } from '@/lib/types/schemas';
import type { QnaQuestion } from '@/lib/types';

export function useQna(boardId: string, stageId: string | null) {
  const [questions, setQuestions] = useState<QnaQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!boardId || !stageId) {
      setQuestions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const q = query(
      collection(db, qnaQuestionsPath(boardId)),
      where('stageId', '==', stageId),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = safeParseDocs<QnaQuestion>(snap.docs, qnaQuestionSchema, 'useQna');
        setQuestions(list);
        setLoading(false);
      },
      (err) => {
        console.error('[useQna] snapshot error', err);
        setLoading(false);
      },
    );
    return unsub;
  }, [boardId, stageId]);

  const addQuestion = useCallback(
    async (authorId: string, authorName: string, text: string) => {
      if (!boardId || !stageId) return;
      const trimmed = text.trim();
      if (!trimmed) return;
      await addDoc(collection(db, qnaQuestionsPath(boardId)), {
        stageId,
        authorId,
        authorName,
        text: trimmed,
        upvotes: [],
        answered: false,
        createdAt: serverTimestamp(),
      });
    },
    [boardId, stageId],
  );

  const toggleUpvote = useCallback(
    async (questionId: string, userId: string, currentlyUpvoted: boolean) => {
      if (!boardId) return;
      const ref = doc(db, qnaQuestionsPath(boardId), questionId);
      await updateDoc(ref, {
        upvotes: currentlyUpvoted ? arrayRemove(userId) : arrayUnion(userId),
      });
    },
    [boardId],
  );

  const setAnswer = useCallback(
    async (questionId: string, answer: string, byUid: string) => {
      if (!boardId) return;
      const ref = doc(db, qnaQuestionsPath(boardId), questionId);
      await updateDoc(ref, {
        answer: answer.trim(),
        answered: true,
        answeredAt: serverTimestamp(),
        answeredBy: byUid,
      });
    },
    [boardId],
  );

  const reopenQuestion = useCallback(
    async (questionId: string) => {
      if (!boardId) return;
      const ref = doc(db, qnaQuestionsPath(boardId), questionId);
      await updateDoc(ref, { answered: false });
    },
    [boardId],
  );

  const deleteQuestion = useCallback(
    async (questionId: string) => {
      if (!boardId) return;
      await deleteDoc(doc(db, qnaQuestionsPath(boardId), questionId));
    },
    [boardId],
  );

  return { questions, loading, addQuestion, toggleUpvote, setAnswer, reopenQuestion, deleteQuestion };
}
