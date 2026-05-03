'use client';

import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { boardsPath } from '@/lib/firebase/collections';
import type { ActivityConfig, ActivityType, Stage } from '@/lib/types';

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

export function useStages(boardId: string) {
  async function setStages(stages: Stage[]) {
    await updateDoc(doc(db, boardsPath(), boardId), {
      stages,
      updatedAt: serverTimestamp(),
    });
  }

  async function addStage(
    current: Stage[],
    title: string,
    durationSec: number,
    activityType?: ActivityType,
    activityConfig?: ActivityConfig,
  ) {
    const next: Stage = {
      id: genId(),
      title: title.trim() || `단계 ${current.length + 1}`,
      durationSec: Math.max(0, Math.floor(durationSec)),
      order: current.length,
      ...(activityType ? { activityType } : {}),
      ...(activityConfig ? { activityConfig } : {}),
    };
    await setStages([...current, next]);
    return next;
  }

  async function updateStage(current: Stage[], id: string, patch: Partial<Pick<Stage, 'title' | 'durationSec' | 'activityType' | 'activityConfig'>>) {
    const next = current.map((s) => (s.id === id ? { ...s, ...patch } : s));
    await setStages(next);
  }

  async function removeStage(current: Stage[], id: string) {
    const next = current
      .filter((s) => s.id !== id)
      .map((s, idx) => ({ ...s, order: idx }));
    await setStages(next);
  }

  async function moveStage(current: Stage[], id: string, direction: -1 | 1) {
    const list = [...current].sort((a, b) => a.order - b.order);
    const idx = list.findIndex((s) => s.id === id);
    if (idx < 0) return;
    const swapIdx = idx + direction;
    if (swapIdx < 0 || swapIdx >= list.length) return;
    [list[idx], list[swapIdx]] = [list[swapIdx], list[idx]];
    const next = list.map((s, i) => ({ ...s, order: i }));
    await setStages(next);
  }

  return { setStages, addStage, updateStage, removeStage, moveStage };
}
