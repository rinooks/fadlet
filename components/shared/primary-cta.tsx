'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { DemoButton } from '@/components/shared/demo-button';

export function PrimaryCTA() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    if (!auth) {
      setAuthReady(true);
      return;
    }
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u && !u.isAnonymous ? u : null);
      setAuthReady(true);
    });
    return unsub;
  }, []);

  if (authReady && user) {
    return (
      <div className="flex flex-col items-center gap-2 mb-4">
        <Link
          href="/dashboard"
          className="group inline-flex items-center justify-center h-14 px-10 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-base transition-all shadow-lg shadow-indigo-600/25 hover:shadow-xl hover:shadow-indigo-600/35 hover:-translate-y-0.5"
        >
          내 워크스페이스로
          <span className="ml-2 transition-transform group-hover:translate-x-0.5">→</span>
        </Link>
        <p className="text-xs text-gray-400">
          {user.displayName ?? user.email} 님으로 로그인됨
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2 mb-4">
      <DemoButton />
      <p className="text-xs text-gray-400">구글 로그인만으로 바로 시작 · 신용카드 불필요</p>
    </div>
  );
}
