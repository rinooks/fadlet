'use client';

export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Plus, Users, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useOperatorAuth } from '@/lib/hooks/use-operator-auth';
import { createWorkspace, joinWorkspaceByCode, useMyWorkspaces } from '@/lib/hooks/use-workspaces';

export default function WorkspacesPage() {
  const router = useRouter();
  const { user, isOperator, loading } = useOperatorAuth();
  const { workspaces, loading: wsLoading } = useMyWorkspaces(isOperator ? user?.uid ?? null : null);

  const [newName, setNewName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !isOperator) router.replace('/login');
  }, [isOperator, loading, router]);

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
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-indigo-600 font-bold text-xl">Fadlet</Link>
          <span className="text-gray-300">|</span>
          <span className="text-sm text-gray-600 font-medium">워크스페이스</span>
        </div>
        <Link href="/dashboard" className="text-xs text-indigo-600 hover:underline">
          ← 대시보드로
        </Link>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* 새로 만들기 */}
          <form onSubmit={handleCreate} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-1">
              <Plus size={16} className="text-indigo-600" />
              <h3 className="font-semibold text-gray-900">새 워크스페이스</h3>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              팀 이름을 입력하면 6자리 코드가 자동 발급됩니다.
            </p>
            <div className="flex gap-2">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="예: 인사팀"
                maxLength={40}
                className="text-sm flex-1"
              />
              <Button
                type="submit"
                disabled={busy || !newName.trim()}
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
              >
                만들기
              </Button>
            </div>
          </form>

          {/* 코드로 가입 */}
          <form onSubmit={handleJoin} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-1">
              <KeyRound size={16} className="text-indigo-600" />
              <h3 className="font-semibold text-gray-900">코드로 가입</h3>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              초대받은 6자리 코드를 입력하세요.
            </p>
            <div className="flex gap-2">
              <Input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="예: K3F2X9"
                maxLength={6}
                className="text-sm flex-1 font-mono uppercase"
              />
              <Button
                type="submit"
                disabled={busy || joinCode.trim().length !== 6}
                size="sm"
                variant="outline"
                className="font-semibold"
              >
                가입
              </Button>
            </div>
          </form>
        </div>

        <h2 className="text-lg font-bold text-gray-900 mb-3">내 워크스페이스</h2>
        {wsLoading ? (
          <p className="text-gray-400 text-sm text-center py-12">불러오는 중...</p>
        ) : workspaces.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
            <Users size={28} className="text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">아직 가입한 워크스페이스가 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {workspaces.map((ws) => (
              <Link
                key={ws.id}
                href={`/workspaces/${ws.id}`}
                className="bg-white rounded-xl border border-gray-200 p-4 hover:border-indigo-300 hover:shadow-sm transition-all group"
              >
                <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 mb-2 truncate">
                  {ws.name}
                </h3>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                    {ws.workspaceCode}
                  </span>
                  {ws.ownerUid === user?.uid && (
                    <span className="text-[10px] uppercase font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                      관리자
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
