'use client';

import { doc, getDoc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase/client';
import { settingsDocPath } from '@/lib/firebase/collections';
import type { AppSettings } from '@/lib/types';

export const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const unsub = onSnapshot(
      doc(db, settingsDocPath()),
      (snap) => {
        setSettings(snap.exists() ? (snap.data() as AppSettings) : null);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setSettings(null);
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

export async function saveGeminiSettings(params: {
  uid: string;
  apiKey?: string;
  model?: string;
}): Promise<void> {
  const ref = doc(db, settingsDocPath());
  const payload: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
    updatedBy: params.uid,
  };
  if (params.apiKey !== undefined) payload.geminiApiKey = params.apiKey;
  if (params.model !== undefined) payload.geminiModel = params.model;
  await setDoc(ref, payload, { merge: true });
}
