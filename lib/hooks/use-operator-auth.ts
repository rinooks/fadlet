'use client';

import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase/client';
import { operatorDocPath } from '@/lib/firebase/collections';
import { ensureOperatorDoc } from '@/lib/firebase/operators';
import { isSuperAdminEmail } from '@/lib/auth/super-admin';
import { signInWithGooglePopup } from '@/lib/auth/google-sign-in';
import type { Operator } from '@/lib/types';

export function useOperatorAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [operator, setOperator] = useState<Operator | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let opUnsub: (() => void) | undefined;

    const unsub = onAuthStateChanged(auth, async (u) => {
      // 이전 operator 구독 해제
      if (opUnsub) {
        opUnsub();
        opUnsub = undefined;
      }

      if (!u || u.isAnonymous) {
        setUser(u);
        setOperator(null);
        setLoading(false);
        return;
      }

      // Google 로그인 상태: operator 문서 보장 후 실시간 구독 시작
      try {
        await ensureOperatorDoc({
          uid: u.uid,
          email: u.email,
          displayName: u.displayName,
          photoURL: u.photoURL,
        });
      } catch (err) {
        console.error('[useOperatorAuth] ensureOperatorDoc failed', err);
      }

      setUser(u);
      opUnsub = onSnapshot(
        doc(db, operatorDocPath(u.uid)),
        (snap) => {
          setOperator(snap.exists() ? (snap.data() as Operator) : null);
          setLoading(false);
        },
        (err) => {
          console.error('[useOperatorAuth] operator snapshot error', err);
          setOperator(null);
          setLoading(false);
        },
      );
    });

    return () => {
      unsub();
      if (opUnsub) opUnsub();
    };
  }, []);

  async function signInWithGoogle() {
    await signInWithGooglePopup(auth);
    // 이후 onAuthStateChanged가 ensureOperatorDoc 호출
  }

  async function logout() {
    await signOut(auth);
  }

  const isLoggedIn = !!user && !user.isAnonymous;
  const isSuperAdmin = isLoggedIn && (operator?.isSuperAdmin === true || isSuperAdminEmail(user?.email));
  const isAllowed = isLoggedIn && operator?.allowed === true;
  const isPending = isLoggedIn && operator !== null && operator.allowed === false;
  // 운영자 권한 = 승인된 상태(슈퍼관리자 포함)
  const isOperator = isAllowed;

  return {
    user,
    operator,
    loading,
    isOperator,
    isSuperAdmin,
    isPending,
    signInWithGoogle,
    logout,
  };
}
