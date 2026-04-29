'use client';

export const dynamic = 'force-dynamic';

import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TemplateSelector } from '@/components/board/template-selector';
import { db } from '@/lib/firebase/client';
import { boardsPath } from '@/lib/firebase/collections';
import { useOperatorAuth } from '@/lib/hooks/use-operator-auth';
import { generateBoardCode } from '@/lib/utils/generate-board-code';
import type { BoardTemplate } from '@/lib/types';

export default function NewBoardPage() {
  const router = useRouter();
  const { user, isOperator, loading, signInWithGoogle } = useOperatorAuth();
  const [title, setTitle] = useState('');
  const [template, setTemplate] = useState<BoardTemplate>('free');
  const [step, setStep] = useState<1 | 2>(1);
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
        template,
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
    <main className="flex items-center justify-center min-h-screen bg-blue-50 px-4 py-8">
      <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-2xl">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold text-gray-900">새 보드 만들기</h1>
          <Link href="/dashboard" className="text-xs text-blue-600 hover:underline">
            내 보드 목록
          </Link>
        </div>

        {step === 1 && (
          <>
            <p className="text-gray-400 text-sm mb-6">보드 제목을 입력하고 템플릿을 선택하세요.</p>
            <form
              onSubmit={(e) => { e.preventDefault(); if (title.trim()) setStep(2); }}
              className="flex flex-col gap-6"
            >
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">보드 제목</label>
                <Input
                  placeholder="예: Q1 회고 워크숍"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={60}
                  required
                  autoFocus
                  className="text-base"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">템플릿 선택</label>
                <TemplateSelector value={template} onChange={setTemplate} />
              </div>
              <Button
                type="submit"
                disabled={!title.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold h-12"
              >
                다음 →
              </Button>
            </form>
          </>
        )}

        {step === 2 && (
          <>
            <p className="text-gray-400 text-sm mb-6">내용을 확인하고 보드를 생성하세요.</p>
            <div className="flex flex-col gap-4">
              <div className="rounded-xl border border-gray-200 px-4 py-4 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400 uppercase tracking-wide">보드 제목</span>
                  <button
                    onClick={() => setStep(1)}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    수정
                  </button>
                </div>
                <p className="font-semibold text-gray-900">{title}</p>
              </div>
              <div className="rounded-xl border border-gray-200 px-4 py-4 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400 uppercase tracking-wide">템플릿</span>
                  <button
                    onClick={() => setStep(1)}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    변경
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">
                    {['✏️','💡','⚖️','🔄','📋','❓','🔲'][
                      ['free','brainstorming','proscons','kpt','4f','qna','nineWindow'].indexOf(template)
                    ]}
                  </span>
                  <span className="font-semibold text-gray-900">
                    {['자유형','브레인스토밍','찬성 / 반대','KPT 회고','4F 회고','Q&A','9칸 윈도우'][
                      ['free','brainstorming','proscons','kpt','4f','qna','nineWindow'].indexOf(template)
                    ]}
                  </span>
                </div>
              </div>
              <form onSubmit={handleCreate}>
                <Button
                  type="submit"
                  disabled={creating}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold h-12"
                >
                  {creating ? '생성 중...' : '보드 만들기'}
                </Button>
              </form>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
