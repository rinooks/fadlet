'use client';

export const dynamic = 'force-dynamic';

import { collection, onSnapshot, query, where } from 'firebase/firestore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { KeyRound, Plus, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { db } from '@/lib/firebase/client';
import { boardsPath } from '@/lib/firebase/collections';
import { useOperatorAuth } from '@/lib/hooks/use-operator-auth';
import {
  createWorkspace,
  joinWorkspaceByCode,
  useMyWorkspaces,
} from '@/lib/hooks/use-workspaces';
import type { Board } from '@/lib/types';

const PREVIEW_BOARDS_PER_WORKSPACE = 3;

export default function DashboardPage() {
  const router = useRouter();
  const { user, isOperator, isPending, isSuperAdmin, loading, logout } = useOperatorAuth();
  const { workspaces, loading: wsLoading } = useMyWorkspaces(isOperator ? user?.uid ?? null : null);
  const [boards, setBoards] = useState<Board[]>([]);
  const [boardsLoading, setBoardsLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user || user.isAnonymous) router.replace('/login?redirect=/dashboard');
    else if (isPending) router.replace('/pending');
  }, [user, isPending, loading, router]);

  useEffect(() => {
    if (!user || !isOperator) return;
    const q = query(collection(db, boardsPath()), where('ownerId', '==', user.uid));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Board);
        list.sort((a, b) => {
          const ta = a.createdAt?.toMillis?.() ?? 0;
          const tb = b.createdAt?.toMillis?.() ?? 0;
          return tb - ta;
        });
        setBoards(list);
        setBoardsLoading(false);
      },
      (err) => {
        console.error('[dashboard] boards snapshot error', err);
        setBoardsLoading(false);
      },
    );
    return unsub;
  }, [user, isOperator]);

  const boardsByWorkspace = useMemo(() => {
    const map = new Map<string, Board[]>();
    for (const b of boards) {
      const key = b.workspaceId || 'default';
      const list = map.get(key) ?? [];
      list.push(b);
      map.set(key, list);
    }
    return map;
  }, [boards]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !newName.trim() || busy) return;
    setBusy(true);
    try {
      const wsId = await createWorkspace({
        name: newName,
        ownerUid: user.uid,
        ownerName: user.displayName ?? user.email ?? '운영자',
        ownerEmail: user.email ?? undefined,
      });
      toast.success('워크스페이스를 만들었습니다.');
      setNewName('');
      setCreateOpen(false);
      router.push(`/workspaces/${wsId}`);
    } catch {
      toast.error('워크스페이스 생성에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !joinCode.trim() || busy) return;
    setBusy(true);
    try {
      const wsId = await joinWorkspaceByCode({
        code: joinCode,
        uid: user.uid,
        displayName: user.displayName ?? user.email ?? '운영자',
        email: user.email ?? undefined,
      });
      toast.success('워크스페이스에 가입했습니다.');
      setJoinCode('');
      setJoinOpen(false);
      router.push(`/workspaces/${wsId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '가입에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  }

  if (loading || !isOperator) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-400">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Link href="/" className="text-indigo-600 font-bold text-lg sm:text-xl hover:text-indigo-700 transition-colors">Fadlet</Link>
          <span className="text-gray-300 hidden sm:inline">|</span>
          <span className="text-sm text-gray-600 font-medium hidden sm:inline">내 워크스페이스</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <Link href="/help" className="text-xs text-indigo-600 hover:underline font-semibold" aria-label="가이드">
            <span className="sm:hidden">📖</span>
            <span className="hidden sm:inline">📖 가이드</span>
          </Link>
          {isSuperAdmin && (
            <Link href="/admin" className="text-xs text-amber-700 hover:underline font-semibold" aria-label="관리자">
              <span className="sm:hidden">🛡</span>
              <span className="hidden sm:inline">🛡 관리자</span>
            </Link>
          )}
          <span className="text-gray-300 hidden lg:inline">|</span>
          <span className="text-sm text-gray-500 hidden lg:inline truncate max-w-[180px]">
            {user?.displayName ?? user?.email}
          </span>
          <Button variant="outline" size="sm" onClick={logout} className="text-xs">로그아웃</Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex items-center justify-between mb-5 sm:mb-6 gap-3">
          <h2 className="text-base sm:text-lg font-bold text-gray-900">내 워크스페이스</h2>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setJoinOpen(true)}
              variant="outline"
              size="sm"
              className="font-semibold"
            >
              <KeyRound size={14} className="mr-1" />
              <span className="hidden sm:inline">코드로 가입</span>
              <span className="sm:hidden">가입</span>
            </Button>
            <Button
              onClick={() => setCreateOpen(true)}
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
            >
              <Plus size={14} className="mr-1" />
              <span className="hidden sm:inline">새 워크스페이스</span>
              <span className="sm:hidden">생성</span>
            </Button>
          </div>
        </div>

        {(wsLoading || boardsLoading) ? (
          <p className="text-gray-400 text-sm text-center py-16">불러오는 중...</p>
        ) : workspaces.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-md p-10 text-center">
            <Users size={32} className="text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-600 mb-1 font-semibold">아직 워크스페이스가 없습니다.</p>
            <p className="text-xs text-gray-500 mb-4">
              팀 워크스페이스를 만들거나 초대 코드로 참여해 보세요.
            </p>
            <div className="flex items-center justify-center gap-2">
              <Button onClick={() => setCreateOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">
                <Plus size={14} className="mr-1" />
                새 워크스페이스
              </Button>
              <Button onClick={() => setJoinOpen(true)} variant="outline">
                <KeyRound size={14} className="mr-1" />
                코드로 가입
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {workspaces.map((ws) => {
              const wsBoards = boardsByWorkspace.get(ws.id) ?? [];
              const preview = wsBoards.slice(0, PREVIEW_BOARDS_PER_WORKSPACE);
              const more = wsBoards.length - preview.length;
              const isOwner = ws.ownerUid === user?.uid;
              return (
                <Link
                  key={ws.id}
                  href={`/workspaces/${ws.id}`}
                  className="bg-white rounded-md border border-gray-200 p-4 hover:border-indigo-300 hover:shadow-md transition-all group flex flex-col"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2 flex-1 min-w-0">
                      {ws.name}
                    </h3>
                    {isOwner && (
                      <span className="text-[10px] uppercase font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded flex-shrink-0">
                        관리자
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="font-mono text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      {ws.workspaceCode}
                    </span>
                    <span className="text-xs text-gray-400">보드 {wsBoards.length}개</span>
                  </div>

                  <div className="border-t border-gray-100 pt-2.5 flex-1 min-h-[80px]">
                    {preview.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-4">아직 보드가 없습니다.</p>
                    ) : (
                      <ul className="flex flex-col gap-1">
                        {preview.map((b) => (
                          <li
                            key={b.id}
                            className="text-xs text-gray-700 truncate flex items-center gap-1.5"
                          >
                            <span className="text-gray-300">·</span>
                            <span className="truncate">{b.title}</span>
                          </li>
                        ))}
                        {more > 0 && (
                          <li className="text-[11px] text-gray-400 mt-1">+{more}개 더보기</li>
                        )}
                      </ul>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>새 워크스페이스 만들기</DialogTitle>
            <DialogDescription>
              팀 이름을 입력하면 6자리 초대 코드가 자동 발급됩니다.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="flex flex-col gap-3 mt-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="예: 인사팀"
              maxLength={40}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} disabled={busy}>
                취소
              </Button>
              <Button
                type="submit"
                disabled={busy || !newName.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
              >
                만들기
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>워크스페이스 가입</DialogTitle>
            <DialogDescription>
              초대받은 6자리 코드를 입력하세요.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleJoin} className="flex flex-col gap-3 mt-2">
            <Input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="예: K3F2X9"
              maxLength={6}
              className="font-mono uppercase tracking-widest text-center"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setJoinOpen(false)} disabled={busy}>
                취소
              </Button>
              <Button
                type="submit"
                disabled={busy || joinCode.trim().length !== 6}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
              >
                가입
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
