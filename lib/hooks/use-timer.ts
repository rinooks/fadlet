'use client';

import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase/client';
import { boardsPath } from '@/lib/firebase/collections';
import type { TimerState } from '@/lib/types';
import { runFirestore } from '@/lib/utils/firestore-action';

const IDLE: TimerState = {
  stageId: null,
  status: 'idle',
  startedAt: null,
  pausedAt: null,
  accumulatedMs: 0,
};

export function useTimer(boardId: string, timer?: TimerState) {
  const ref = doc(db, boardsPath(), boardId);

  async function selectStage(stageId: string) {
    const next: TimerState = { ...IDLE, stageId };
    await runFirestore('단계를 변경하지 못했습니다.', () =>
      updateDoc(ref, { timer: next, updatedAt: serverTimestamp() }),
    );
  }

  async function startTimer(stageId: string) {
    const next: TimerState = {
      stageId,
      status: 'running',
      startedAt: Date.now(),
      pausedAt: null,
      accumulatedMs: 0,
    };
    await runFirestore('타이머를 시작하지 못했습니다.', () =>
      updateDoc(ref, { timer: next, updatedAt: serverTimestamp() }),
    );
  }

  async function pauseTimer() {
    if (!timer || timer.status !== 'running') return;
    const now = Date.now();
    const elapsed = timer.startedAt ? now - timer.startedAt : 0;
    const next: TimerState = {
      ...timer,
      status: 'paused',
      pausedAt: now,
      accumulatedMs: timer.accumulatedMs + elapsed,
    };
    await runFirestore('타이머를 일시정지하지 못했습니다.', () =>
      updateDoc(ref, { timer: next, updatedAt: serverTimestamp() }),
    );
  }

  async function resumeTimer() {
    if (!timer || timer.status !== 'paused') return;
    const next: TimerState = {
      ...timer,
      status: 'running',
      startedAt: Date.now(),
      pausedAt: null,
    };
    await runFirestore('타이머를 재개하지 못했습니다.', () =>
      updateDoc(ref, { timer: next, updatedAt: serverTimestamp() }),
    );
  }

  async function stopTimer() {
    await runFirestore('타이머를 정지하지 못했습니다.', () =>
      updateDoc(ref, { timer: IDLE, updatedAt: serverTimestamp() }),
    );
  }

  return { selectStage, startTimer, pauseTimer, resumeTimer, stopTimer };
}

export function elapsedMs(timer?: TimerState): number {
  if (!timer || timer.status === 'idle') return 0;
  if (timer.status === 'paused') return timer.accumulatedMs;
  if (timer.status === 'running' && timer.startedAt) {
    return timer.accumulatedMs + (Date.now() - timer.startedAt);
  }
  return timer.accumulatedMs;
}

export function useTickingElapsed(timer?: TimerState, intervalMs = 500): number {
  const [now, setNow] = useState(() => Date.now());
  const running = timer?.status === 'running';

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [running, intervalMs]);

  if (!timer || timer.status === 'idle') return 0;
  if (timer.status === 'paused') return timer.accumulatedMs;
  if (timer.status === 'running' && timer.startedAt) {
    return timer.accumulatedMs + (now - timer.startedAt);
  }
  return timer.accumulatedMs;
}
