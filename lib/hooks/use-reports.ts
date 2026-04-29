'use client';

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase/client';
import { reportsPath } from '@/lib/firebase/collections';
import type { Report, ReportTarget } from '@/lib/types';

export function useReports(boardId: string, enabled: boolean) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState<boolean>(() => enabled);

  useEffect(() => {
    if (!enabled) return;
    const q = query(collection(db, reportsPath(boardId)), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setReports(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Report));
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
  }, [boardId, enabled]);

  async function resolveReport(reportId: string, resolverId: string) {
    await updateDoc(doc(db, reportsPath(boardId), reportId), {
      status: 'resolved',
      resolvedById: resolverId,
      resolvedAt: serverTimestamp(),
    });
  }

  async function deleteReport(reportId: string) {
    await deleteDoc(doc(db, reportsPath(boardId), reportId));
  }

  return { reports, loading, resolveReport, deleteReport };
}

export async function submitReport(
  boardId: string,
  params: {
    targetType: ReportTarget;
    targetId: string;
    targetSnapshot: string;
    reporterId: string;
    reporterName: string;
    reason: string;
  },
): Promise<void> {
  await addDoc(collection(db, reportsPath(boardId)), {
    ...params,
    targetSnapshot: params.targetSnapshot.slice(0, 500),
    reason: params.reason.slice(0, 500),
    status: 'open',
    createdAt: serverTimestamp(),
  });
}
