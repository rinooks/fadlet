'use client';

export const dynamic = 'force-dynamic';

import { collection, deleteDoc, doc, onSnapshot, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { BoardActionsMenu } from '@/components/board/board-actions-menu';
import { BoardDeleteDialog } from '@/components/board/board-delete-dialog';
import { BoardRenameDialog } from '@/components/board/board-rename-dialog';
import { db } from '@/lib/firebase/client';
import { boardsPath } from '@/lib/firebase/collections';
import { useOperatorAuth } from '@/lib/hooks/use-operator-auth';
import { useMyWorkspaces } from '@/lib/hooks/use-workspaces';
import type { Board } from '@/lib/types';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isOperator, isPending, isSuperAdmin, loading, logout } = useOperatorAuth();
  const { workspaces, loading: wsLoading } = useMyWorkspaces(isOperator ? user?.uid ?? null : null);
  const [boards, setBoards] = useState<Board[]>([]);
  const [boardsLoading, setBoardsLoading] = useState(true);
  const [renameTarget, setRenameTarget] = useState<Board | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Board | null>(null);
  const hasWorkspace = workspaces.length > 0;

  async function submitRename(nextTitle: string) {
    if (!renameTarget) return;
    try {
      await updateDoc(doc(db, boardsPath(), renameTarget.id), {
        title: nextTitle,
        updatedAt: serverTimestamp(),
      });
      toast.success('보드 이름을 변경했습니다.');
    } catch {
      toast.error('이름 변경에 실패했습니다.');
    }
  }

  async function submitDelete() {
    if (!deleteTarget) return;
    try {
      await deleteDoc(doc(db, boardsPath(), deleteTarget.id));
      toast.success('보드를 삭제했습니다.');
    } catch {
      toast.error('삭제에 실패했습니다.');
    }
  }

  // 보드를 워크스페이스별로 그룹핑 (사용자의 워크스페이스 순서 + 그 외 + 개인)
  const groupedBoards = useMemo(() => {
    const groups: { id: string; label: string; code?: string; boards: Board[] }[] = [];
    const wsMap = new Map(workspaces.map((w) => [w.id, w]));
    const seen = new Set<string>();

    // 1) 사용자가 멤버인 워크스페이스 순서대로
    for (const ws of workspaces) {
      const list = boards.filter((b) => b.workspaceId === ws.id);
      if (list.length === 0) continue;
      groups.push({ id: ws.id, label: ws.name, code: ws.workspaceCode, boards: list });
      seen.add(ws.id);
    }

    // 2) 'default' 또는 알 수 없는 워크스페이스의 보드를 묶음
    const orphan = boards.filter(
      (b) => !b.workspaceId || b.workspaceId === 'default' || (!seen.has(b.workspaceId) && !wsMap.has(b.workspaceId)),
    );
    if (orphan.length > 0) {
      groups.push({ id: '__orphan__', label: '기타 / 개인', boards: orphan });
    }

    return groups;
  }, [boards, workspaces]);

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace('/login?redirect=/dashboard');
    else if (isPending) router.replace('/pending');
  }, [user, isPending, loading, router]);

  useEffect(() => {
    if (!user || !isOperator) return;
    const q = query(
      collection(db, boardsPath()),
      where('ownerId', '==', user.uid)
    );
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
      }
    );
    return unsub;
  }, [user, isOperator]);

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
          <span className="text-sm text-gray-600 font-medium hidden sm:inline">내 보드</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <Link
            href="/workspaces"
            className="text-xs text-indigo-600 hover:underline font-semibold"
            aria-label="워크스페이스"
          >
            <span className="sm:hidden">👥</span>
            <span className="hidden sm:inline">👥 워크스페이스</span>
          </Link>
          <Link
            href="/help"
            className="text-xs text-indigo-600 hover:underline font-semibold"
            aria-label="가이드"
          >
            <span className="sm:hidden">📖</span>
            <span className="hidden sm:inline">📖 가이드</span>
          </Link>
          {isSuperAdmin && (
            <Link
              href="/admin"
              className="text-xs text-amber-700 hover:underline font-semibold"
              aria-label="관리자"
            >
              <span className="sm:hidden">🛡</span>
              <span className="hidden sm:inline">🛡 관리자</span>
            </Link>
          )}
          <span className="text-gray-300 hidden lg:inline">|</span>
          <span className="text-sm text-gray-500 hidden lg:inline truncate max-w-[180px]">
            {user?.displayName ?? user?.email}
          </span>
          <Button variant="outline" size="sm" onClick={logout} className="text-xs">
            로그아웃
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex items-center justify-between mb-5 sm:mb-6 gap-3">
          <h2 className="text-base sm:text-lg font-bold text-gray-900">내 보드 목록</h2>
          <Button
            onClick={() => router.push(hasWorkspace ? '/boards/new' : '/workspaces')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex-shrink-0"
          >
            <span className="sm:hidden">{hasWorkspace ? '+ 새 보드' : '+ 워크스페이스'}</span>
            <span className="hidden sm:inline">{hasWorkspace ? '+ 새 보드 만들기' : '+ 워크스페이스 만들기'}</span>
          </Button>
        </div>

        {!hasWorkspace && (
          <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 mb-5 flex items-start gap-3">
            <span className="text-xl">💡</span>
            <div className="text-sm text-indigo-900 leading-relaxed">
              보드는 워크스페이스 안에서만 만들 수 있습니다. 먼저{' '}
              <Link href="/workspaces" className="underline font-semibold">워크스페이스</Link>를
              만들거나 초대 코드로 참여하세요.
            </div>
          </div>
        )}

        {(boardsLoading || wsLoading) ? (
          <p className="text-gray-400 text-sm text-center py-16">불러오는 중...</p>
        ) : boards.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-sm mb-4">아직 만든 보드가 없습니다.</p>
            <Button
              onClick={() => router.push(hasWorkspace ? '/boards/new' : '/workspaces')}
              variant="outline"
            >
              {hasWorkspace ? '첫 번째 보드 만들기' : '워크스페이스 먼저 만들기'}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {groupedBoards.map((group) => (
              <section key={group.id}>
                <div className="flex items-baseline gap-2 mb-3">
                  <h3 className="text-sm font-bold text-gray-900">
                    {group.id === '__orphan__' ? '🗂 ' : '👥 '}
                    {group.label}
                  </h3>
                  {group.code && (
                    <Link
                      href={`/workspaces/${group.id}`}
                      className="font-mono text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded hover:bg-indigo-100"
                    >
                      {group.code}
                    </Link>
                  )}
                  <span className="text-xs text-gray-400">{group.boards.length}개</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.boards.map((board) => (
                    <Link
                      key={board.id}
                      href={`/boards/${board.id}`}
                      className="relative bg-white rounded-xl border border-gray-200 p-5 hover:border-indigo-300 hover:shadow-md transition-all group block"
                    >
                      <div className="flex items-start justify-between mb-3 gap-2">
                        <h4 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2 flex-1 min-w-0">
                          {board.title}
                        </h4>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {board.settings?.lockedAt && (
                            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                              잠김
                            </span>
                          )}
                          <BoardActionsMenu
                            onRename={() => setRenameTarget(board)}
                            onDelete={() => setDeleteTarget(board)}
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-sm font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                          {board.boardCode}
                        </span>
                        <span className="text-xs text-gray-400">
                          {board.createdAt?.toDate?.().toLocaleDateString('ko-KR') ?? ''}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      <BoardRenameDialog
        open={!!renameTarget}
        initialTitle={renameTarget?.title ?? ''}
        onClose={() => setRenameTarget(null)}
        onSubmit={submitRename}
      />
      <BoardDeleteDialog
        open={!!deleteTarget}
        boardTitle={deleteTarget?.title ?? ''}
        onClose={() => setDeleteTarget(null)}
        onConfirm={submitDelete}
      />
    </div>
  );
}
