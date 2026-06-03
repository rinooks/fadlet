'use client';

import { signInAnonymously } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase/client';

export function useAuth() {
  const [uid, setUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      // Firebase 미초기화(환경변수 누락 등) 시 런타임 크래시 방지
      console.error('[useAuth] Firebase Auth가 초기화되지 않았습니다. 환경변수를 확인하세요.');
      setLoading(false);
      return;
    }
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
