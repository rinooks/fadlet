'use client';

export const dynamic = 'force-dynamic';

import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/firebase/client';
import { boardsPath } from '@/lib/firebase/collections';
import { useOperatorAuth } from '@/lib/hooks/use-operator-auth';
import type { Board } from '@/lib/types';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isOperator, loading, logout } = useOperatorAuth();
  const [boards, setBoards] = useState<Board[]>([]);
  const [boardsLoading, setBoardsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !isOperator) router.replace('/login');
  }, [isOperator, loading, router]);

  useEffect(() => {
    if (!user || !isOperator) return;
    const q = query(
      collection(db, boardsPath()),
      where('ownerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setBoards(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Board));
      setBoardsLoading(false);
    });
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
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-blue-600 font-bold text-xl">Fadlet</span>
          <span className="text-gray-300">|</span>
          <span className="text-sm text-gray-600 font-medium">내 보드</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/workspaces"
            className="text-xs text-blue-600 hover:underline font-semibold"
          >
            👥 워크스페이스
          </Link>
          <Link
            href="/help"
            className="text-xs text-blue-600 hover:underline font-semibold"
          >
            📖 가이드
          </Link>
          <span className="text-gray-300">|</span>
          <span className="text-sm text-gray-500">{user?.displayName ?? user?.email}</span>
          <Button variant="outline" size="sm" onClick={logout} className="text-xs">
            로그아웃
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900">내 보드 목록</h2>
          <Button
            onClick={() => router.push('/boards/new')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
          >
            + 새 보드 만들기
          </Button>
        </div>

        {boardsLoading ? (
          <p className="text-gray-400 text-sm text-center py-16">불러오는 중...</p>
        ) : boards.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-sm mb-4">아직 만든 보드가 없습니다.</p>
            <Button
              onClick={() => router.push('/boards/new')}
              variant="outline"
            >
              첫 번째 보드 만들기
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {boards.map((board) => (
              <Link
                key={board.id}
                href={`/boards/${board.id}`}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {board.title}
                  </h3>
                  {board.settings?.lockedAt && (
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full ml-2 flex-shrink-0">
                      잠김
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    {board.boardCode}
                  </span>
                  <span className="text-xs text-gray-400">
                    {board.createdAt?.toDate?.().toLocaleDateString('ko-KR') ?? ''}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
