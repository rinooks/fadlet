'use client';

import {
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase/client';
import {
  workspaceDocPath,
  workspaceMembersPath,
  workspacesCollectionPath,
} from '@/lib/firebase/collections';
import { generateWorkspaceCode } from '@/lib/utils/generate-workspace-code';
import type { Workspace, WorkspaceMember } from '@/lib/types';

export function useMyWorkspaces(uid: string | null) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState<boolean>(() => !!uid);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (!uid) {
      setWorkspaces([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    /* eslint-enable react-hooks/set-state-in-effect */
    let cancelled = false;
    let unsub: (() => void) | undefined;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let attempts = 0;

    function subscribe() {
      const q = query(collectionGroup(db, 'members'), where('uid', '==', uid));
      unsub = onSnapshot(
        q,
        async (snap) => {
          attempts = 0; // 성공 시 재시도 카운트 리셋
          const wsIds = snap.docs
            .map((d) => d.ref.parent.parent?.id)
            .filter((v): v is string => !!v);
          if (wsIds.length === 0) {
            if (cancelled) return;
            setWorkspaces([]);
            setLoading(false);
            return;
          }
          try {
            const docs = await Promise.all(
              wsIds.map((wsId) => getDoc(doc(db, workspaceDocPath(wsId)))),
            );
            if (cancelled) return; // 구독 해제/uid 변경 후 늦게 도착한 응답 무시
            const list: Workspace[] = docs
              .filter((d) => d.exists())
              .map((d) => ({ id: d.id, ...d.data() }) as Workspace);
            list.sort((a, b) => (a.createdAt?.toMillis?.() ?? 0) - (b.createdAt?.toMillis?.() ?? 0));
            setWorkspaces(list);
          } catch (err) {
            if (!cancelled) console.error('[useMyWorkspaces] 워크스페이스 문서 로드 실패', err);
          } finally {
            if (!cancelled) setLoading(false);
          }
        },
        (err) => {
          if (cancelled) return;
          // 로그인 직후 인증 토큰 전파 지연으로 인한 일시적 permission-denied는 재시도.
          // 기존 목록은 비우지 않아 화면 깜빡임을 막는다.
          const code = (err as { code?: string }).code;
          if ((code === 'permission-denied' || code === 'unavailable') && attempts < 5) {
            attempts += 1;
            unsub?.();
            retryTimer = setTimeout(() => {
              if (!cancelled) subscribe();
            }, 500 * attempts);
            return;
          }
          console.error('[useMyWorkspaces] members 구독 실패', err);
          setLoading(false);
        },
      );
    }
    subscribe();

    return () => {
      cancelled = true;
      unsub?.();
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [uid]);

  return { workspaces, loading };
}

export function useWorkspace(wsId: string | null) {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState<boolean>(() => !!wsId);

  useEffect(() => {
    if (!wsId) return;
    const ref = doc(db, workspaceDocPath(wsId));
    const unsub = onSnapshot(
      ref,
      (snap) => {
        setWorkspace(snap.exists() ? ({ id: snap.id, ...snap.data() } as Workspace) : null);
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
  }, [wsId]);

  return { workspace, loading };
}

export function useWorkspaceMembers(wsId: string | null) {
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState<boolean>(() => !!wsId);

  useEffect(() => {
    if (!wsId) return;
    const q = collection(db, workspaceMembersPath(wsId));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ uid: d.id, ...d.data() }) as WorkspaceMember);
        list.sort((a, b) => (a.joinedAt?.toMillis?.() ?? 0) - (b.joinedAt?.toMillis?.() ?? 0));
        setMembers(list);
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
  }, [wsId]);

  return { members, loading };
}

export async function createWorkspace(params: {
  name: string;
  ownerUid: string;
  ownerName: string;
  ownerEmail?: string;
}): Promise<string> {
  const wsId = `ws-${Math.random().toString(36).slice(2, 10)}`;
  const code = await generateWorkspaceCode();
  await setDoc(doc(db, workspaceDocPath(wsId)), {
    name: params.name.trim(),
    workspaceCode: code,
    ownerUid: params.ownerUid,
    createdAt: serverTimestamp(),
  });
  await setDoc(doc(db, workspaceMembersPath(wsId), params.ownerUid), {
    uid: params.ownerUid,
    role: 'admin',
    displayName: params.ownerName,
    email: params.ownerEmail ?? '',
    joinedAt: serverTimestamp(),
  });
  return wsId;
}

export async function renameWorkspace(wsId: string, name: string): Promise<void> {
  const next = name.trim();
  if (!next) throw new Error('워크스페이스 이름을 입력해주세요.');
  await updateDoc(doc(db, workspaceDocPath(wsId)), { name: next });
}

export async function joinWorkspaceByCode(params: {
  code: string;
  uid: string;
  displayName: string;
  email?: string;
}): Promise<string> {
  const code = params.code.trim().toUpperCase();
  if (!code) throw new Error('코드를 입력해주세요.');
  const q = query(collection(db, workspacesCollectionPath()), where('workspaceCode', '==', code));
  const snap = await getDocs(q);
  if (snap.empty) throw new Error('해당 코드의 워크스페이스를 찾을 수 없습니다.');
  const wsDoc = snap.docs[0];
  const wsId = wsDoc.id;

  const memberRef = doc(db, workspaceMembersPath(wsId), params.uid);
  const existing = await getDoc(memberRef);
  if (existing.exists()) return wsId;

  await setDoc(memberRef, {
    uid: params.uid,
    role: 'member',
    displayName: params.displayName,
    email: params.email ?? '',
    joinedAt: serverTimestamp(),
  });
  return wsId;
}

export async function leaveWorkspace(wsId: string, uid: string): Promise<void> {
  await deleteDoc(doc(db, workspaceMembersPath(wsId), uid));
}
