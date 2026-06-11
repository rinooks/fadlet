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
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    const unsub = onAuthStateChanged(auth, async (u) => {
      // 이전 operator 구독/재시도 해제
      if (opUnsub) {
        opUnsub();
        opUnsub = undefined;
      }
      if (retryTimer) {
        clearTimeout(retryTimer);
        retryTimer = undefined;
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

      let attempts = 0;
      const subscribeOperator = () => {
        opUnsub = onSnapshot(
          doc(db, operatorDocPath(u.uid)),
          (snap) => {
            attempts = 0; // 성공 시 재시도 카운트 리셋
            setOperator(snap.exists() ? (snap.data() as Operator) : null);
            setLoading(false);
          },
          (err) => {
            console.error('[useOperatorAuth] operator snapshot error', err);
            setLoading(false);
            // 로그인 직후 토큰 전파 지연으로 인한 일시적 permission-denied는 재시도.
            // operator를 null로 만들지 않아 isOperator 깜빡임(워크스페이스 사라짐)을 막는다.
            const code = (err as { code?: string }).code;
            if (code === 'permission-denied' || code === 'unavailable') {
              if (attempts < 5) {
                attempts += 1;
                opUnsub?.();
                retryTimer = setTimeout(subscribeOperator, 500 * attempts);
              }
              return;
            }
            setOperator(null);
          },
        );
      };
      subscribeOperator();
    });

    return () => {
      unsub();
      if (opUnsub) opUnsub();
      if (retryTimer) clearTimeout(retryTimer);
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
