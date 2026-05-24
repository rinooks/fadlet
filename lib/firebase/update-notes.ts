'use client';

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  limit as fbLimit,
  onSnapshot,
  orderBy,
  query,
  type QueryConstraint,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase/client';
import { updateNoteDocPath, updateNotesPath } from '@/lib/firebase/collections';
import type { UpdateNote } from '@/lib/types';

interface CreateInput {
  uid: string;
  title: string;
  userBody: string;
  devBody?: string;
  version?: string;
  isPublished: boolean;
}

interface UpdateInput {
  title?: string;
  userBody?: string;
  devBody?: string;
  version?: string;
  isPublished?: boolean;
}

export async function createUpdateNote(input: CreateInput): Promise<string> {
  const ref = await addDoc(collection(db, updateNotesPath()), {
    title: input.title.trim(),
    userBody: input.userBody,
    devBody: input.devBody?.trim() || null,
    version: input.version?.trim() || null,
    isPublished: input.isPublished,
    publishedAt: input.isPublished ? serverTimestamp() : null,
    createdBy: input.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateUpdateNote(id: string, input: UpdateInput): Promise<void> {
  const payload: Record<string, unknown> = { updatedAt: serverTimestamp() };
  if (input.title !== undefined) payload.title = input.title.trim();
  if (input.userBody !== undefined) payload.userBody = input.userBody;
  if (input.devBody !== undefined) payload.devBody = input.devBody.trim() || null;
  if (input.version !== undefined) payload.version = input.version.trim() || null;
  if (input.isPublished !== undefined) {
    payload.isPublished = input.isPublished;
    if (input.isPublished) payload.publishedAt = serverTimestamp();
  }
  await updateDoc(doc(db, updateNoteDocPath(id)), payload);
}

/** 구버전 호환 — userBody가 비어있으면 legacy body를 사용. */
export function resolveUserBody(note: { userBody?: string; body?: string }): string {
  return note.userBody?.trim() ? note.userBody : note.body ?? '';
}

export async function deleteUpdateNote(id: string): Promise<void> {
  await deleteDoc(doc(db, updateNoteDocPath(id)));
}

/** 관리자용 — 게시 여부와 무관하게 전체 노트, 최신순. */
export function useAllUpdateNotes() {
  const [notes, setNotes] = useState<UpdateNote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, updateNotesPath()), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setNotes(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as UpdateNote));
        setLoading(false);
      },
      (err) => {
        console.error('[update-notes] all snapshot error', err);
        setLoading(false);
      },
    );
    return unsub;
  }, []);

  return { notes, loading };
}

/** 공개용 — 게시된 노트만, publishedAt 최신순. max 지정 시 Firestore limit() 적용. */
export function usePublishedUpdateNotes(max?: number) {
  const [notes, setNotes] = useState<UpdateNote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const constraints: QueryConstraint[] = [
      where('isPublished', '==', true),
      orderBy('publishedAt', 'desc'),
    ];
    if (typeof max === 'number') constraints.push(fbLimit(max));
    const q = query(collection(db, updateNotesPath()), ...constraints);
    const unsub = onSnapshot(
      q,
      (snap) => {
        setNotes(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as UpdateNote));
        setLoading(false);
      },
      (err) => {
        console.error('[update-notes] published snapshot error', err);
        setLoading(false);
      },
    );
    return unsub;
  }, [max]);

  return { notes, loading };
}
