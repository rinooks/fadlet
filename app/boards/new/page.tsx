'use client';

export const dynamic = 'force-dynamic';

import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TemplateSelector } from '@/components/board/template-selector';
import { SkinSelector } from '@/components/board/skin-selector';
import { db } from '@/lib/firebase/client';
import { boardsPath } from '@/lib/firebase/collections';
import { useOperatorAuth } from '@/lib/hooks/use-operator-auth';
import { useMyWorkspaces } from '@/lib/hooks/use-workspaces';
import { generateBoardCode } from '@/lib/utils/generate-board-code';
import { getSkinMeta } from '@/lib/skins';
import type { BoardSkin, BoardTemplate } from '@/lib/types';

export default function NewBoardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isOperator, loading, signInWithGoogle } = useOperatorAuth();
  const { workspaces } = useMyWorkspaces(isOperator ? user?.uid ?? null : null);
  const [title, setTitle] = useState('');
  const [template, setTemplate] = useState<BoardTemplate>('free');
  const [skin, setSkin] = useState<BoardSkin>('standard');
  const [allowChat, setAllowChat] = useState(true);
  const [workspaceId, setWorkspaceId] = useState<string>(searchParams.get('workspaceId') ?? 'default');
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
        skin,
        ownerId: user.uid,
        workspaceId,
        settings: {
          allowChat,
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
              {workspaces.length > 0 && (
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-gray-700">워크스페이스</label>
                  <select
                    value={workspaceId}
                    onChange={(e) => setWorkspaceId(e.target.value)}
                    className="h-10 px-3 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:border-blue-400"
                  >
                    <option value="default">개인 (워크스페이스 없음)</option>
                    {workspaces.map((ws) => (
                      <option key={ws.id} value={ws.id}>
                        {ws.name} ({ws.workspaceCode})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">템플릿 선택</label>
                <TemplateSelector value={template} onChange={setTemplate} />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">스킨 선택</label>
                <SkinSelector value={skin} onChange={setSkin} />
              </div>
              <div className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-gray-800">실시간 채팅</p>
                  <p className="text-xs text-gray-400">참여자들이 보드 옆에서 채팅할 수 있습니다.</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={allowChat}
                  onClick={() => setAllowChat((v) => !v)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 ${
                    allowChat ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform ${
                      allowChat ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
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
              <div className="rounded-xl border border-gray-200 px-4 py-4 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400 uppercase tracking-wide">스킨</span>
                  <button onClick={() => setStep(1)} className="text-xs text-blue-600 hover:underline">변경</button>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {getSkinMeta(skin).swatch.map((c, i) => (
                      <span key={i} className="block w-4 h-4 rounded border border-black/10" style={{ background: c }} aria-hidden />
                    ))}
                  </div>
                  <span className="font-semibold text-gray-900">{getSkinMeta(skin).label}</span>
                </div>
              </div>
              <div className="rounded-xl border border-gray-200 px-4 py-4 flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-400 uppercase tracking-wide block mb-1">채팅</span>
                  <p className="font-semibold text-gray-900">{allowChat ? '사용' : '사용 안 함'}</p>
                </div>
                <button onClick={() => setStep(1)} className="text-xs text-blue-600 hover:underline">변경</button>
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
