'use client';

export const dynamic = 'force-dynamic';

import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Shield, ShieldCheck, ShieldOff, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/firebase/client';
import { boardsPath, operatorsPath, workspacesCollectionPath } from '@/lib/firebase/collections';
import { setOperatorAllowed } from '@/lib/firebase/operators';
import { useOperatorAuth } from '@/lib/hooks/use-operator-auth';
import type { Board, Operator, Workspace } from '@/lib/types';

export default function AdminPage() {
  const router = useRouter();
  const { user, isSuperAdmin, loading } = useOperatorAuth();

  const [operators, setOperators] = useState<Operator[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [loadingOps, setLoadingOps] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace('/login');
    else if (!isSuperAdmin) router.replace('/dashboard');
  }, [user, isSuperAdmin, loading, router]);

  // operators 구독
  useEffect(() => {
    if (!isSuperAdmin) return;
    const q = query(collection(db, operatorsPath()), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setOperators(snap.docs.map((d) => d.data() as Operator));
        setLoadingOps(false);
      },
      (err) => {
        console.error('[admin] operators snapshot error', err);
        setLoadingOps(false);
      },
    );
    return unsub;
  }, [isSuperAdmin]);

  // 모든 워크스페이스 + 보드 구독 (모니터링용)
  useEffect(() => {
    if (!isSuperAdmin) return;
    const wsUnsub = onSnapshot(
      collection(db, workspacesCollectionPath()),
      (snap) => setWorkspaces(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Workspace)),
      () => {},
    );
    const bUnsub = onSnapshot(
      collection(db, boardsPath()),
      (snap) => setBoards(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Board)),
      () => {},
    );
    return () => {
      wsUnsub();
      bUnsub();
    };
  }, [isSuperAdmin]);

  const wsByOwner = useMemo(() => {
    const map = new Map<string, Workspace[]>();
    for (const ws of workspaces) {
      const list = map.get(ws.ownerUid) ?? [];
      list.push(ws);
      map.set(ws.ownerUid, list);
    }
    return map;
  }, [workspaces]);

  const boardsByOwner = useMemo(() => {
    const map = new Map<string, Board[]>();
    for (const b of boards) {
      const list = map.get(b.ownerId) ?? [];
      list.push(b);
      map.set(b.ownerId, list);
    }
    return map;
  }, [boards]);

  function toggleExpand(uid: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  }

  async function handleToggleAllow(op: Operator, allowed: boolean) {
    if (!user) return;
    if (op.uid === user.uid && !allowed) {
      toast.error('본인 권한은 해제할 수 없습니다.');
      return;
    }
    try {
      await setOperatorAllowed({ targetUid: op.uid, allowed, reviewerUid: user.uid });
      toast.success(allowed ? '승인했습니다.' : '권한을 해제했습니다.');
    } catch {
      toast.error('변경 실패');
    }
  }

  if (loading || !isSuperAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-400">로딩 중...</p>
      </div>
    );
  }

  const allowedCount = operators.filter((o) => o.allowed).length;
  const pendingCount = operators.filter((o) => !o.allowed).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Link href="/" className="text-indigo-600 font-bold text-lg sm:text-xl hover:text-indigo-700 transition-colors">
            Fadlet
          </Link>
          <span className="text-gray-300 hidden sm:inline">|</span>
          <span className="flex items-center gap-1 text-sm text-amber-700 font-semibold">
            <Shield size={14} /> 관리자
          </span>
        </div>
        <Link href="/dashboard" className="text-xs text-indigo-600 hover:underline">
          ← 대시보드
        </Link>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* 요약 카운터 */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <SummaryCard label="전체 운영자" value={operators.length} />
          <SummaryCard label="승인됨" value={allowedCount} accent="green" />
          <SummaryCard label="승인 대기" value={pendingCount} accent="amber" />
        </div>

        <h2 className="text-base font-bold text-gray-900 mb-3">운영자 목록</h2>

        {loadingOps ? (
          <p className="text-gray-400 text-sm text-center py-12">불러오는 중...</p>
        ) : operators.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
            <Users size={28} className="text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">아직 등록된 운영자가 없습니다.</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <ul>
              {operators.map((op) => {
                const isExpanded = expanded.has(op.uid);
                const opWorkspaces = wsByOwner.get(op.uid) ?? [];
                const opBoards = boardsByOwner.get(op.uid) ?? [];
                return (
                  <li key={op.uid} className="border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors">
                      <button
                        type="button"
                        onClick={() => toggleExpand(op.uid)}
                        className="flex-shrink-0 text-gray-400 hover:text-gray-700 p-0.5"
                        aria-label={isExpanded ? '접기' : '펼치기'}
                      >
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </button>
                      {op.photoURL ? (
                        <img
                          src={op.photoURL}
                          alt=""
                          className="w-9 h-9 rounded-full flex-shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                          {(op.displayName || op.email || '?').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900 text-sm truncate">{op.displayName}</p>
                          {op.isSuperAdmin && (
                            <span className="text-[10px] font-bold uppercase text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                              슈퍼
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 truncate">{op.email}</p>
                      </div>
                      <div className="hidden sm:flex flex-col items-end gap-0.5 text-[11px] text-gray-500 flex-shrink-0">
                        <span>WS {opWorkspaces.length} · 보드 {opBoards.length}</span>
                        <span>가입 {op.createdAt?.toDate?.().toLocaleDateString('ko-KR') ?? ''}</span>
                      </div>
                      {op.allowed ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleAllow(op, false)}
                          disabled={op.isSuperAdmin || op.uid === user?.uid}
                          className="text-xs flex items-center gap-1"
                        >
                          <ShieldOff size={12} /> 해제
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleToggleAllow(op, true)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs flex items-center gap-1"
                        >
                          <ShieldCheck size={12} /> 승인
                        </Button>
                      )}
                    </div>

                    {isExpanded && (
                      <div className="bg-gray-50 px-4 py-3 border-t border-gray-100">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <p className="text-[11px] uppercase font-bold text-gray-500 mb-1.5">
                              워크스페이스 ({opWorkspaces.length})
                            </p>
                            {opWorkspaces.length === 0 ? (
                              <p className="text-xs text-gray-400">없음</p>
                            ) : (
                              <ul className="space-y-1">
                                {opWorkspaces.map((ws) => (
                                  <li key={ws.id}>
                                    <Link
                                      href={`/workspaces/${ws.id}`}
                                      className="text-xs flex items-center justify-between bg-white px-2 py-1.5 rounded border border-gray-200 hover:border-indigo-300"
                                    >
                                      <span className="truncate">{ws.name}</span>
                                      <span className="font-mono text-[10px] text-indigo-600 flex-shrink-0 ml-2">
                                        {ws.workspaceCode}
                                      </span>
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                          <div>
                            <p className="text-[11px] uppercase font-bold text-gray-500 mb-1.5">
                              보드 ({opBoards.length})
                            </p>
                            {opBoards.length === 0 ? (
                              <p className="text-xs text-gray-400">없음</p>
                            ) : (
                              <ul className="space-y-1">
                                {opBoards.map((b) => (
                                  <li key={b.id}>
                                    <Link
                                      href={`/boards/${b.id}`}
                                      className="text-xs flex items-center justify-between bg-white px-2 py-1.5 rounded border border-gray-200 hover:border-indigo-300"
                                    >
                                      <span className="truncate">{b.title}</span>
                                      <span className="font-mono text-[10px] text-indigo-600 flex-shrink-0 ml-2">
                                        {b.boardCode}
                                      </span>
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: 'green' | 'amber';
}) {
  const accentClass =
    accent === 'green'
      ? 'text-emerald-600'
      : accent === 'amber'
      ? 'text-amber-600'
      : 'text-gray-900';
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-4 py-3">
      <p className="text-[11px] uppercase font-bold text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${accentClass}`}>{value}</p>
    </div>
  );
}
