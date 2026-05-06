'use client';

export const dynamic = 'force-dynamic';

import { addDoc, collection, getDocs, query, serverTimestamp, where } from 'firebase/firestore';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TemplateSelector } from '@/components/board/template-selector';
import { SkinSelector } from '@/components/board/skin-selector';
import { db } from '@/lib/firebase/client';
import { boardsPath } from '@/lib/firebase/collections';
import { FREE_TIER_BOARDS_PER_WORKSPACE, showUpgradeMessage } from '@/lib/free-tier';
import { useOperatorAuth } from '@/lib/hooks/use-operator-auth';
import { useMyWorkspaces } from '@/lib/hooks/use-workspaces';
import { generateBoardCode } from '@/lib/utils/generate-board-code';
import { getSkinMeta } from '@/lib/skins';
import { getTemplate } from '@/lib/templates';
import type { BoardMode, BoardSkin, BoardTemplate } from '@/lib/types';

function NewBoardForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isOperator, isSuperAdmin, loading, signInWithGoogle } = useOperatorAuth();
  const { workspaces, loading: wsLoading } = useMyWorkspaces(isOperator ? user?.uid ?? null : null);
  const queryWsId = searchParams.get('workspaceId');
  const [title, setTitle] = useState('');
  const [mode, setMode] = useState<BoardMode>('single');
  const [template, setTemplate] = useState<BoardTemplate>('free');
  const [skin, setSkin] = useState<BoardSkin>('standard');
  const [allowChat, setAllowChat] = useState(true);
  const [workspaceId, setWorkspaceId] = useState<string>(queryWsId ?? '');
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [creating, setCreating] = useState(false);

  // 워크스페이스 목록이 로드되면 기본값을 첫 번째로 세팅 (쿼리 파람이 우선)
  if (!workspaceId && workspaces.length > 0) {
    const fallback = queryWsId && workspaces.some((w) => w.id === queryWsId)
      ? queryWsId
      : workspaces[0].id;
    if (fallback !== workspaceId) {
      // 동기 렌더 중 setState는 React가 즉시 재렌더로 처리
      setWorkspaceId(fallback);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !title.trim()) return;
    if (!workspaceId || workspaceId === 'default') {
      toast.error('워크스페이스를 선택하세요.');
      return;
    }

    setCreating(true);
    try {
      if (!isSuperAdmin) {
        const boardCountSnap = await getDocs(
          query(collection(db, boardsPath()), where('workspaceId', '==', workspaceId)),
        );
        if (boardCountSnap.size >= FREE_TIER_BOARDS_PER_WORKSPACE) {
          showUpgradeMessage('board');
          setCreating(false);
          return;
        }
      }
      const boardCode = await generateBoardCode();
      const docRef = await addDoc(collection(db, boardsPath()), {
        title: title.trim(),
        boardCode,
        template: mode === 'workshop' ? 'free' : template,
        mode,
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

  if (loading || (isOperator && wsLoading)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-400">로딩 중...</p>
      </div>
    );
  }

  if (!isOperator) {
    return (
      <main className="relative flex items-center justify-center min-h-screen bg-indigo-50 px-4">
        <Link
          href="/"
          className="absolute top-4 left-4 inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 font-semibold transition-colors"
        >
          ← 홈
        </Link>
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
            <Link href="/boards/join" className="text-indigo-600 hover:underline">코드로 입장</Link>
            하세요.
          </p>
        </div>
      </main>
    );
  }

  if (workspaces.length === 0) {
    return (
      <main className="relative flex items-center justify-center min-h-screen bg-indigo-50 px-4 py-6">
        <Link
          href="/"
          className="absolute top-4 left-4 inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 font-semibold transition-colors"
        >
          ← 홈
        </Link>
        <div className="bg-white rounded-2xl shadow-md p-6 sm:p-8 w-full max-w-md text-center">
          <div className="text-4xl mb-4">👥</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">워크스페이스가 필요합니다</h1>
          <p className="text-gray-500 text-sm mb-6 leading-relaxed">
            보드는 워크스페이스 안에서만 만들 수 있습니다.<br />
            먼저 워크스페이스를 만들거나 초대 코드로 참여하세요.
          </p>
          <div className="flex flex-col gap-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center h-11 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-colors"
            >
              내 워크스페이스로
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center h-11 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-sm transition-colors"
            >
              홈
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative flex items-center justify-center min-h-screen bg-indigo-50 px-4 py-6 sm:py-8">
      <Link
        href="/dashboard"
        className="absolute top-4 left-4 inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 font-semibold transition-colors"
      >
        ← 워크스페이스로 돌아가기
      </Link>
      <div className="bg-white rounded-2xl shadow-md p-5 sm:p-8 w-full max-w-2xl">
        <div className="flex items-center justify-between mb-1 gap-2">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">새 보드 만들기</h1>
          <Link href="/dashboard" className="text-xs text-indigo-600 hover:underline flex-shrink-0">
            내 보드 목록
          </Link>
        </div>

        {step === 0 && (
          <>
            <p className="text-gray-400 text-sm mb-6">보드 유형을 선택하세요.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              <button
                type="button"
                onClick={() => { setMode('single'); setStep(1); }}
                className="flex flex-col items-start gap-3 rounded-md border-2 border-gray-200 hover:border-indigo-400 hover:bg-indigo-50/50 p-5 text-left transition-colors"
              >
                <span className="text-3xl">🎯</span>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">단일 보드</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    한 가지 템플릿으로 가볍게 작업합니다.<br />
                    브레인스토밍·회고·칸반·찬반 등.
                  </p>
                </div>
                <span className="text-[11px] text-gray-400 mt-auto">패들렛 스타일 · 빠른 시작</span>
              </button>
              <button
                type="button"
                onClick={() => { setMode('workshop'); setStep(1); }}
                className="flex flex-col items-start gap-3 rounded-md border-2 border-gray-200 hover:border-indigo-400 hover:bg-indigo-50/50 p-5 text-left transition-colors"
              >
                <span className="text-3xl">🎬</span>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">워크숍</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    여러 단계를 조합해 하나의 워크숍을 진행합니다.<br />
                    단계별로 활동/시간이 자동 전환됩니다.
                  </p>
                </div>
                <span className="text-[11px] text-gray-400 mt-auto">발산 → 정리 → 투표 등 시퀀스</span>
              </button>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <div className="flex items-center gap-2 mb-2">
              <button
                type="button"
                onClick={() => setStep(0)}
                className="text-xs text-indigo-600 hover:underline"
              >
                ← 유형 변경
              </button>
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs text-gray-500 font-semibold">
                {mode === 'workshop' ? '🎬 워크숍' : '🎯 단일 보드'}
              </span>
            </div>
            <p className="text-gray-400 text-sm mb-6">
              {mode === 'workshop'
                ? '제목과 스킨을 정하면 됩니다. 단계는 보드 안에서 직접 추가합니다.'
                : '보드 제목과 템플릿을 선택하세요.'}
            </p>
            <form
              onSubmit={(e) => { e.preventDefault(); if (title.trim()) setStep(2); }}
              className="flex flex-col gap-6"
            >
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">보드 제목</label>
                <Input
                  placeholder={mode === 'workshop' ? '예: Q1 팀 비전 정렬 워크숍' : '예: Q1 회고 보드'}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={60}
                  required
                  autoFocus
                  className="text-base"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">워크스페이스</label>
                <select
                  value={workspaceId}
                  onChange={(e) => setWorkspaceId(e.target.value)}
                  className="h-10 px-3 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:border-indigo-400"
                >
                  {workspaces.map((ws) => (
                    <option key={ws.id} value={ws.id}>
                      {ws.name} ({ws.workspaceCode})
                    </option>
                  ))}
                </select>
              </div>
              {mode === 'single' && (
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-gray-700">템플릿 선택</label>
                  <TemplateSelector value={template} onChange={setTemplate} />
                </div>
              )}
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
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600 ${
                    allowChat ? 'bg-indigo-600' : 'bg-gray-200'
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
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold h-12"
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
              <div className="rounded-md border border-gray-200 px-4 py-4 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400 uppercase tracking-wide">유형</span>
                  <button onClick={() => setStep(0)} className="text-xs text-indigo-600 hover:underline">변경</button>
                </div>
                <p className="font-semibold text-gray-900">
                  {mode === 'workshop' ? '🎬 워크숍 (단계 시퀀스)' : '🎯 단일 보드'}
                </p>
              </div>
              <div className="rounded-md border border-gray-200 px-4 py-4 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400 uppercase tracking-wide">보드 제목</span>
                  <button
                    onClick={() => setStep(1)}
                    className="text-xs text-indigo-600 hover:underline"
                  >
                    수정
                  </button>
                </div>
                <p className="font-semibold text-gray-900">{title}</p>
              </div>
              <div className="rounded-md border border-gray-200 px-4 py-4 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400 uppercase tracking-wide">워크스페이스</span>
                  <button onClick={() => setStep(1)} className="text-xs text-indigo-600 hover:underline">변경</button>
                </div>
                <p className="font-semibold text-gray-900">
                  {workspaces.find((w) => w.id === workspaceId)?.name ?? '—'}
                </p>
              </div>
              {mode === 'single' && (
                <div className="rounded-md border border-gray-200 px-4 py-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400 uppercase tracking-wide">템플릿</span>
                    <button
                      onClick={() => setStep(1)}
                      className="text-xs text-indigo-600 hover:underline"
                    >
                      변경
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{getTemplate(template).emoji}</span>
                    <span className="font-semibold text-gray-900">{getTemplate(template).label}</span>
                  </div>
                </div>
              )}
              <div className="rounded-xl border border-gray-200 px-4 py-4 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400 uppercase tracking-wide">스킨</span>
                  <button onClick={() => setStep(1)} className="text-xs text-indigo-600 hover:underline">변경</button>
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
                <button onClick={() => setStep(1)} className="text-xs text-indigo-600 hover:underline">변경</button>
              </div>
              <form onSubmit={handleCreate}>
                <Button
                  type="submit"
                  disabled={creating}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold h-12"
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

export default function NewBoardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-gray-400">로딩 중...</p>
        </div>
      }
    >
      <NewBoardForm />
    </Suspense>
  );
}
