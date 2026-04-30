'use client';

export const dynamic = 'force-dynamic';

import { collection, onSnapshot, query, where } from 'firebase/firestore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';
import { Copy, LogOut, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/firebase/client';
import { boardsPath } from '@/lib/firebase/collections';
import { useOperatorAuth } from '@/lib/hooks/use-operator-auth';
import { leaveWorkspace, useWorkspace, useWorkspaceMembers } from '@/lib/hooks/use-workspaces';
import type { Board } from '@/lib/types';

interface PageProps {
  params: Promise<{ wsId: string }>;
}

export default function WorkspaceDetailPage({ params }: PageProps) {
  const { wsId } = use(params);
  const router = useRouter();
  const { user, isOperator, loading } = useOperatorAuth();
  const { workspace } = useWorkspace(wsId);
  const { members } = useWorkspaceMembers(wsId);
  const [boards, setBoards] = useState<Board[]>([]);
  const [boardsLoading, setBoardsLoading] = useState(true);

  const isOwner = !!user && !!workspace && workspace.ownerUid === user.uid;
  const isMember = !!user && members.some((m) => m.uid === user.uid);

  useEffect(() => {
    if (!loading && !isOperator) router.replace('/login');
  }, [isOperator, loading, router]);

  useEffect(() => {
    const q = query(
      collection(db, boardsPath()),
      where('workspaceId', '==', wsId),
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
        console.error('[workspace] boards snapshot error', err);
        setBoardsLoading(false);
      },
    );
    return unsub;
  }, [wsId]);

  function copyCode() {
    if (!workspace) return;
    navigator.clipboard.writeText(workspace.workspaceCode);
    toast.success('코드를 복사했습니다.');
  }

  async function handleLeave() {
    if (!user || isOwner) return;
    if (!confirm('정말 워크스페이스를 떠나시겠습니까?')) return;
    try {
      await leaveWorkspace(wsId, user.uid);
      toast.success('워크스페이스를 떠났습니다.');
      router.push('/workspaces');
    } catch {
      toast.error('탈퇴에 실패했습니다.');
    }
  }

  async function handleRemoveMember(memberUid: string) {
    if (!isOwner) return;
    if (!confirm('이 멤버를 워크스페이스에서 제외하시겠습니까?')) return;
    try {
      await leaveWorkspace(wsId, memberUid);
      toast.success('멤버를 제외했습니다.');
    } catch {
      toast.error('제외 실패');
    }
  }

  if (loading || !isOperator) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-400">로딩 중...</p>
      </div>
    );
  }

  if (workspace === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-gray-500 mb-3">워크스페이스를 찾을 수 없습니다.</p>
        <Link href="/workspaces" className="text-sm text-indigo-600 hover:underline">목록으로</Link>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-400">불러오는 중...</p>
      </div>
    );
  }

  if (!isMember) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <p className="text-gray-700 font-semibold mb-1">{workspace.name}</p>
        <p className="text-sm text-gray-500 mb-4">멤버만 접근할 수 있습니다.</p>
        <Link href="/workspaces" className="text-sm text-indigo-600 hover:underline">목록으로</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/" className="text-indigo-600 font-bold text-lg hover:text-indigo-700 transition-colors">Fadlet</Link>
          <span className="text-gray-300">|</span>
          <h1 className="text-sm font-semibold text-gray-900 truncate">{workspace.name}</h1>
          <button
            onClick={copyCode}
            className="flex items-center gap-1 font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded hover:bg-indigo-100"
            aria-label="코드 복사"
          >
            {workspace.workspaceCode}
            <Copy size={10} />
          </button>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {!isOwner && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleLeave}
              className="text-xs h-7"
            >
              <LogOut size={12} className="mr-1" /> 떠나기
            </Button>
          )}
          <Link href="/workspaces" className="text-xs text-gray-500 hover:underline">
            ← 목록
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 보드 */}
        <section className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-900">📋 보드 ({boards.length})</h2>
            <Button
              size="sm"
              onClick={() => router.push(`/boards/new?workspaceId=${wsId}`)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-7 px-3"
            >
              + 새 보드
            </Button>
          </div>
          {boardsLoading ? (
            <p className="text-gray-400 text-sm text-center py-12">불러오는 중...</p>
          ) : boards.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
              <p className="text-sm text-gray-500">이 워크스페이스에 보드가 없습니다.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {boards.map((board) => (
                <Link
                  key={board.id}
                  href={`/boards/${board.id}`}
                  className="bg-white rounded-xl border border-gray-200 p-4 hover:border-indigo-300 hover:shadow-sm transition-all group"
                >
                  <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 line-clamp-2 mb-2">
                    {board.title}
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      {board.boardCode}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {board.createdAt?.toDate?.().toLocaleDateString('ko-KR') ?? ''}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* 멤버 */}
        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3">👥 멤버 ({members.length})</h2>
          <ul className="space-y-2">
            {members.map((m) => (
              <li
                key={m.uid}
                className="bg-white border border-gray-200 rounded-lg p-3 flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                  {m.displayName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{m.displayName}</p>
                  {m.email && <p className="text-[11px] text-gray-500 truncate">{m.email}</p>}
                </div>
                {m.role === 'admin' && (
                  <span className="text-[10px] uppercase font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded flex-shrink-0">
                    관리자
                  </span>
                )}
                {isOwner && m.uid !== user?.uid && (
                  <button
                    onClick={() => handleRemoveMember(m.uid)}
                    className="text-gray-300 hover:text-red-500 p-1 flex-shrink-0"
                    aria-label="멤버 제외"
                    title="멤버 제외"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
