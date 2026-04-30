'use client';

export const dynamic = 'force-dynamic';

import { collection, getDocs, query, where } from 'firebase/firestore';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { db } from '@/lib/firebase/client';
import { boardsPath } from '@/lib/firebase/collections';
import { useAuth } from '@/lib/hooks/use-auth';
import { useParticipants } from '@/lib/hooks/use-participants';

function JoinForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { uid } = useAuth();
  const [step, setStep] = useState<'code' | 'nickname'>('code');
  const [code, setCode] = useState(() => searchParams.get('code')?.toUpperCase() ?? '');
  const [nickname, setNickname] = useState('');
  const [boardId, setBoardId] = useState('');
  const [loading, setLoading] = useState(false);

  const { joinBoard } = useParticipants(boardId);

  async function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const q = query(
        collection(db, boardsPath()),
        where('boardCode', '==', code.toUpperCase())
      );
      const snap = await getDocs(q);
      if (snap.empty) {
        toast.error('보드를 찾을 수 없습니다. 코드를 다시 확인해 주세요.');
        return;
      }
      setBoardId(snap.docs[0].id);
      setStep('nickname');
    } catch {
      toast.error('오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  }

  async function handleNicknameSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!uid || !boardId) return;
    setLoading(true);
    try {
      await joinBoard({ userId: uid, nickname: nickname.trim(), role: 'member' });
      sessionStorage.setItem(`board-role-${boardId}`, 'member');
      sessionStorage.setItem(`board-nickname-${boardId}`, nickname.trim());
      router.push(`/boards/${boardId}`);
    } catch {
      toast.error('입장에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex items-center justify-center min-h-screen bg-indigo-50 px-4">
      <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-md">
        {step === 'code' ? (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">보드 입장</h1>
            <p className="text-gray-400 text-sm mb-6">운영자에게 받은 6자리 코드를 입력하세요.</p>
            <form onSubmit={handleCodeSubmit} className="flex flex-col gap-4">
              <Input
                placeholder="예: K3F2X9"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                maxLength={6}
                required
                autoFocus
                className="text-base tracking-widest text-center font-mono uppercase"
              />
              <Button
                type="submit"
                disabled={loading || code.length !== 6}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold h-12"
              >
                {loading ? '확인 중...' : '다음'}
              </Button>
            </form>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">닉네임 입력</h1>
            <p className="text-gray-400 text-sm mb-6">보드에서 표시될 이름을 입력하세요. (2~12자)</p>
            <form onSubmit={handleNicknameSubmit} className="flex flex-col gap-4">
              <Input
                placeholder="예: 박지영"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                minLength={2}
                maxLength={12}
                required
                autoFocus
                className="text-base"
              />
              <Button
                type="submit"
                disabled={loading || nickname.trim().length < 2}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold h-12"
              >
                {loading ? '입장 중...' : '보드 입장하기'}
              </Button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}

export default function JoinPage() {
  return (
    <Suspense>
      <JoinForm />
    </Suspense>
  );
}
