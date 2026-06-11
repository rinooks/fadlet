'use client';

import { doc, getDoc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase/client';
import { settingsDocPath } from '@/lib/firebase/collections';
import type { AppSettings } from '@/lib/types';

export const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';

/** 기본 프로필 임계치 — 본인이 만든 보드가 이 수치 이상일 때 모달 노출. */
export const DEFAULT_PROFILE_PROMPT_THRESHOLD = 2;

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    setLoading(true);
    const unsub = onSnapshot(
      doc(db, settingsDocPath()),
      (snap) => {
        setSettings(snap.exists() ? (snap.data() as AppSettings) : null);
        setLoading(false);
      },
      (err) => {
        // 일시적 오류 시 기존 설정을 유지(null로 비우지 않음) — 의존 UI 깜빡임 방지.
        console.error('[useAppSettings] snapshot error', err);
        setError(err.message);
        setLoading(false);
      },
    );
    return unsub;
  }, []);

  return { settings, loading, error };
}

/** 1회성 fetch — onSnapshot 구독 없이 현재 값만 필요할 때. */
export async function fetchAppSettings(): Promise<AppSettings | null> {
  const snap = await getDoc(doc(db, settingsDocPath()));
  return snap.exists() ? (snap.data() as AppSettings) : null;
}

/**
 * Gemini 모델 선택 저장. API 키는 Firestore에 저장하지 않고 서버 환경변수(GEMINI_API_KEY)로만 다룬다.
 */
export async function saveGeminiSettings(params: {
  uid: string;
  model: string;
}): Promise<void> {
  const ref = doc(db, settingsDocPath());
  await setDoc(
    ref,
    {
      geminiModel: params.model,
      updatedAt: serverTimestamp(),
      updatedBy: params.uid,
    },
    { merge: true },
  );
}

export async function saveProfilePromptThreshold(params: {
  uid: string;
  threshold: number;
}): Promise<void> {
  const ref = doc(db, settingsDocPath());
  await setDoc(
    ref,
    {
      profilePromptThresholdBoards: Math.max(0, Math.floor(params.threshold)),
      updatedAt: serverTimestamp(),
      updatedBy: params.uid,
    },
    { merge: true },
  );
}

/** 신규 운영자 가입 승인 절차 on/off. off(false)면 가입 즉시 자동 승인된다. */
export async function saveRequireOperatorApproval(params: {
  uid: string;
  required: boolean;
}): Promise<void> {
  const ref = doc(db, settingsDocPath());
  await setDoc(
    ref,
    {
      requireOperatorApproval: params.required,
      updatedAt: serverTimestamp(),
      updatedBy: params.uid,
    },
    { merge: true },
  );
}
