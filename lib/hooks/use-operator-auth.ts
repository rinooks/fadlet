'use client';

import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase/client';
import { isAllowedOperatorEmail } from '@/lib/auth/allowlist';

export class OperatorNotAllowedError extends Error {
  constructor(public attemptedEmail: string | null) {
    super('이 계정은 운영자 권한이 없습니다.');
    this.name = 'OperatorNotAllowedError';
  }
}

export function useOperatorAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      // 로그인된 비익명 사용자가 화이트리스트에 없으면 즉시 로그아웃
      if (u && !u.isAnonymous && !isAllowedOperatorEmail(u.email)) {
        try {
          await signOut(auth);
        } catch {
          // ignore
        }
        setUser(null);
        setLoading(false);
        return;
      }
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  async function signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    if (!isAllowedOperatorEmail(cred.user.email)) {
      const attempted = cred.user.email;
      try {
        await signOut(auth);
      } catch {
        // ignore
      }
      throw new OperatorNotAllowedError(attempted);
    }
  }

  async function logout() {
    await signOut(auth);
  }

  const isOperator = !!user && !user.isAnonymous && isAllowedOperatorEmail(user.email);

  return { user, loading, isOperator, signInWithGoogle, logout };
}
