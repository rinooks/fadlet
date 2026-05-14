'use client';

import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { userDocPath } from '@/lib/firebase/collections';
import type { UserProfile } from '@/lib/types/user-profile';

export interface UseUserProfileResult {
  profile: UserProfile | null;
  loading: boolean;
  isComplete: boolean;
}

/**
 * users/{uid} 문서를 실시간으로 구독.
 * uid가 null이면 로딩 false, profile null 반환.
 */
export function useUserProfile(uid: string | null): UseUserProfileResult {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(!!uid);

  useEffect(() => {
    if (!uid || !db) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = onSnapshot(
      doc(db, userDocPath(uid)),
      (snap) => {
        if (snap.exists()) {
          setProfile({ uid, ...(snap.data() as Omit<UserProfile, 'uid'>) });
        } else {
          setProfile(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error('[useUserProfile]', err);
        setLoading(false);
      },
    );
    return unsub;
  }, [uid]);

  const isComplete = !!profile?.profileCompletedAt;

  return { profile, loading, isComplete };
}
