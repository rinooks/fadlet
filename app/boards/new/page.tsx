'use client';

import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { db } from '@/lib/firebase/client';
import { boardsPath } from '@/lib/firebase/collections';
import { useOperatorAuth } from '@/lib/hooks/use-operator-auth';
import { generateBoardCode } from '@/lib/utils/generate-board-code';

export default function NewBoardPage() {
  const router = useRouter();
  const { user, isOperator, loading, signInWithGoogle } = useOperatorAuth();
  const [title, setTitle] = useState('');
  const [creating, setCreating] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !title.trim()) return;

    setCreating(true);
    try {
      const boardCode = await generateBoardCode();
      const docRef = await addDoc(collection(db, boardsPath()), {
        title: title.trim(),
        boardCode,
        template: 'free',
        ownerId: user.uid,
        workspaceId: 'default',
        settings: {
          allowChat: true,
          retainChatLog: true,
          lockedAt: null,
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const displayName = user.displayName?.split(' ')[0] ?? '운영자';
      sessionStorage.setItem(`board-role-${docRef.id}`, 'host');
      sessionStorage.setItem(`board-nickname-${docRef.id}`, displayName);
      router.push(`/boards/${docRef.id}?code=${boardCode}`);
    } catch (err) {
      toast.error('보드 생성에 실패했습니다. 다시 시도해 주세요.');
      console.error(err);
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-400">로딩 중...</p>
      </div>
    );
  }

  if (!isOperator) {
    return (
      <main className="flex items-center justify-center min-h-screen bg-blue-50 px-4">
        <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-sm text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-2">로그인이 필요합니다</h1>
          <p className="text-gray-400 text-sm mb-6">보드를 만들려면 운영자 계정으로 로그인하세요.</p>
          <Button
            onClick={signInWithGoogle}
            variant="outline"
            className="w-full h-12 font-semibold"
          >
            Google로 로그인
          </Button>
          <p className="text-xs text-gray-400 mt-4">
            참여자라면{' '}
            <Link href="/boards/join" className="text-blue-600 hover:underline">코드로 입장</Link>
            하세요.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex items-center justify-center min-h-screen bg-blue-50 px-4">
      <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-md">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold text-gray-900">새 보드 만들기</h1>
          <Link href="/dashboard" className="text-xs text-blue-600 hover:underline">
            내 보드 목록
          </Link>
        </div>
        <p className="text-gray-400 text-sm mb-6">보드 제목을 입력하면 6자리 코드가 자동으로 발급됩니다.</p>
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <Input
            placeholder="예: Q1 회고 워크숍"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={60}
            required
            autoFocus
            className="text-base"
          />
          <Button
            type="submit"
            disabled={creating || !title.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold h-12"
          >
            {creating ? '생성 중...' : '보드 만들기'}
          </Button>
        </form>
      </div>
    </main>
  );
}
