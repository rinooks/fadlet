'use client';

import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { operatorDocPath } from '@/lib/firebase/collections';
import { isSuperAdminEmail } from '@/lib/auth/super-admin';
import { fetchAppSettings } from '@/lib/firebase/settings';
import type { Operator } from '@/lib/types';

/** Google 로그인 후 operators/{uid} 문서를 보장. 없으면 생성, 있으면 lastLoginAt 갱신. */
export async function ensureOperatorDoc(params: {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}): Promise<void> {
  const ref = doc(db, operatorDocPath(params.uid));
  const snap = await getDoc(ref);
  const isSuper = isSuperAdminEmail(params.email);

  if (!snap.exists()) {
    // 기본 정책: 자동 승인. 관리자가 승인 절차를 켠 경우(requireOperatorApproval=true)에만 대기 상태로 생성.
    let requireApproval = false;
    if (!isSuper) {
      try {
        const settings = await fetchAppSettings();
        requireApproval = settings?.requireOperatorApproval === true;
      } catch {
        requireApproval = false; // 설정을 못 읽으면 자동 승인(기본 정책)
      }
    }
    const allowed = isSuper || !requireApproval;
    const base = {
      uid: params.uid,
      email: (params.email ?? '').toLowerCase(),
      displayName: params.displayName ?? params.email ?? '',
      ...(params.photoURL ? { photoURL: params.photoURL } : {}),
      isSuperAdmin: isSuper,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    };
    try {
      await setDoc(ref, { ...base, allowed });
    } catch (err) {
      // 승인 절차가 켜져 있는데 클라이언트가 설정을 못 읽어 allowed=true로 시도한 경우,
      // 보안 규칙이 거부한다 → 대기 상태(false)로 다시 생성.
      if (allowed && !isSuper) {
        await setDoc(ref, { ...base, allowed: false });
      } else {
        throw err;
      }
    }
    return;
  }

  // 메타 갱신 (allowed/isSuperAdmin은 슈퍼관리자만 변경 가능, 여기선 안 건드림)
  await updateDoc(ref, {
    email: (params.email ?? '').toLowerCase(),
    displayName: params.displayName ?? params.email ?? '',
    ...(params.photoURL ? { photoURL: params.photoURL } : {}),
    lastLoginAt: serverTimestamp(),
  });
}

export async function fetchOperator(uid: string): Promise<Operator | null> {
  const snap = await getDoc(doc(db, operatorDocPath(uid)));
  if (!snap.exists()) return null;
  return snap.data() as Operator;
}

/** 슈퍼관리자가 다른 운영자를 승인/거부 토글. */
export async function setOperatorAllowed(params: {
  targetUid: string;
  allowed: boolean;
  reviewerUid: string;
}): Promise<void> {
  await updateDoc(doc(db, operatorDocPath(params.targetUid)), {
    allowed: params.allowed,
    reviewedAt: serverTimestamp(),
    reviewedBy: params.reviewerUid,
  });
}
