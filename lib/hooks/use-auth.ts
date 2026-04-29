'use client';

import { signInAnonymously } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase/client';

export function useAuth() {
  const [uid, setUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUid(user.uid);
        setLoading(false);
      } else {
        try {
          const cred = await signInAnonymously(auth);
          setUid(cred.user.uid);
        } catch {
          // 인증 실패 시 uid는 null 유지
        } finally {
          setLoading(false);
        }
      }
    });
    return unsub;
  }, []);

  return { uid, loading };
}
