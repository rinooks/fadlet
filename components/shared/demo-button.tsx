'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import { auth, db } from '@/lib/firebase/client';
import { GoogleSignInError, signInWithGooglePopup } from '@/lib/auth/google-sign-in';
import { boardsPath } from '@/lib/firebase/collections';
import { generateBoardCode } from '@/lib/utils/generate-board-code';
import { SkinSelector } from '@/components/board/skin-selector';
import { TemplateSelector } from '@/components/board/template-selector';
import { ProfileCompletionModal } from '@/components/profile/profile-completion-modal';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useUserProfile } from '@/lib/hooks/use-user-profile';
import type { BoardMode, BoardSkin, BoardTemplate, Stage } from '@/lib/types';

type DemoMode = 'single' | 'workshop';

function genStageId() {
  return Math.random().toString(36).slice(2, 10);
}

function buildDemoWorkshopStages(): Stage[] {
  return [
    {
      id: genStageId(),
      title: '오늘 기분을 한 단어로',
      durationSec: 180,
      order: 0,
      activityType: 'wordcloud',
      activityConfig: { wordcloud: { prompt: '오늘 기분을 한 단어로 표현해 보세요', maxLength: 20 } },
    },
    {
      id: genStageId(),
      title: '잘하고 있는 것 / 바꾸고 싶은 것',
      durationSec: 600,
      order: 1,
      activityType: 'kpt',
    },
    {
      id: genStageId(),
      title: '다음 분기 우선순위 투표',
      durationSec: 240,
      order: 2,
      activityType: 'poll',
      activityConfig: {
        poll: {
          question: '다음 분기 가장 집중해야 할 영역은?',
          options: ['프로덕트 품질', '신규 고객 확보', '기존 고객 retention', '내부 프로세스 개선'],
          allowMultiple: false,
        },
      },
    },
  ];
}

export function DemoButton() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<DemoMode>('single');
  const [template, setTemplate] = useState<BoardTemplate>('brainstorming');
  const [skin, setSkin] = useState<BoardSkin>('standard');
  const [creating, setCreating] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [pendingNav, setPendingNav] = useState<{ id: string; code: string } | null>(null);
  const router = useRouter();
  const { profile } = useUserProfile(user?.uid ?? null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u && !u.isAnonymous ? u : null);
    });
    return unsub;
  }, []);

  async function handleGoogleSignIn() {
    setSigningIn(true);
    try {
      await signInWithGooglePopup(auth);
    } catch (err) {
      if (err instanceof GoogleSignInError) {
        if (!err.silent) toast.error(err.message);
      } else {
        console.error('[demo] google sign in', err);
        toast.error('구글 로그인에 실패했습니다. 다시 시도해 주세요.');
      }
    } finally {
      setSigningIn(false);
    }
  }

  async function handleCreate() {
    if (!user) return;
    setCreating(true);
    try {
      const boardCode = await generateBoardCode();
      const isWorkshop = mode === 'workshop';
      const stages = isWorkshop ? buildDemoWorkshopStages() : [];
      const docRef = await addDoc(collection(db, boardsPath()), {
        title: isWorkshop ? '체험 워크숍' : '체험 보드',
        boardCode,
        template: isWorkshop ? 'free' : template,
        mode: (isWorkshop ? 'workshop' : 'single') as BoardMode,
        skin,
        ownerId: user.uid,
        workspaceId: 'demo',
        isDemo: true,
        settings: {
          allowChat: true,
          retainChatLog: true,
          lockedAt: null,
        },
        ...(stages.length ? { stages } : {}),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      sessionStorage.setItem(`board-role-${docRef.id}`, 'host');
      sessionStorage.setItem(`board-nickname-${docRef.id}`, user.displayName ?? '퍼실리테이터');

      // 프로필 미완성이면 모달 → 닫히면 이동
      if (!profile?.profileCompletedAt) {
        setOpen(false);
        setPendingNav({ id: docRef.id, code: boardCode });
        setProfileModalOpen(true);
        setCreating(false);
        return;
      }

      router.push(`/boards/${docRef.id}?code=${boardCode}`);
    } catch (err) {
      console.error('[demo]', err);
      toast.error('보드 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.');
      setCreating(false);
    }
  }

  function handleProfileModalClose() {
    setProfileModalOpen(false);
    if (pendingNav) {
      const nav = pendingNav;
      setPendingNav(null);
      router.push(`/boards/${nav.id}?code=${nav.code}`);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="group inline-flex items-center justify-center h-14 px-10 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-base transition-all shadow-lg shadow-indigo-600/25 hover:shadow-xl hover:shadow-indigo-600/35 hover:-translate-y-0.5"
      >
        무료로 시작하기
        <span className="ml-2 transition-transform group-hover:translate-x-0.5">→</span>
      </button>

      <Dialog open={open} onOpenChange={(v) => { if (!creating && !signingIn) setOpen(v); }}>
        <DialogContent
          className={
            user
              ? 'w-[95vw] max-h-[90vh] overflow-y-auto p-6 sm:p-8 sm:max-w-5xl'
              : 'w-[92vw] max-h-[90vh] overflow-y-auto p-6 sm:p-8 sm:max-w-md'
          }
        >
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-bold">
              {user ? '새 보드 만들기' : 'Fadlet 시작하기'}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              {user
                ? '템플릿과 스킨을 선택하면 바로 시작할 수 있습니다.'
                : '구글 계정으로 로그인하면 바로 시작할 수 있어요.'}
            </DialogDescription>
          </DialogHeader>

          {!user ? (
            <div className="flex flex-col items-center justify-center py-8 gap-5">
              <button
                onClick={handleGoogleSignIn}
                disabled={signingIn}
                className="flex items-center gap-3 h-12 px-6 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-medium text-sm transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {signingIn ? (
                  <svg className="animate-spin h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-5 w-5" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                )}
                {signingIn ? '로그인 중…' : 'Google로 계속하기'}
              </button>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-5 p-3 bg-green-50 rounded-lg border border-green-100">
                  {user.photoURL && (
                    <img src={user.photoURL} alt="" className="w-7 h-7 rounded-full" />
                  )}
                  <span className="text-sm text-green-700 font-medium">
                    {user.displayName ?? user.email} 님으로 로그인됨
                  </span>
                </div>
                <p className="text-sm font-semibold text-gray-700 mb-3">유형</p>
                <div className="grid grid-cols-2 gap-2 mb-5">
                  <button
                    type="button"
                    onClick={() => setMode('single')}
                    className={`flex flex-col items-start gap-2 rounded-md border-2 p-3 text-left transition-colors ${
                      mode === 'single'
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/40'
                    }`}
                  >
                    <span className="text-2xl">🎯</span>
                    <div>
                      <p className="text-sm font-bold text-gray-900">단일 보드</p>
                      <p className="text-[11px] text-gray-500">한 가지 템플릿 빠른 시작</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('workshop')}
                    className={`flex flex-col items-start gap-2 rounded-md border-2 p-3 text-left transition-colors ${
                      mode === 'workshop'
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/40'
                    }`}
                  >
                    <span className="text-2xl">🎬</span>
                    <div>
                      <p className="text-sm font-bold text-gray-900">워크숍</p>
                      <p className="text-[11px] text-gray-500">3단계 시퀀스 자동 구성</p>
                    </div>
                  </button>
                </div>

                {mode === 'single' ? (
                  <>
                    <p className="text-sm font-semibold text-gray-700 mb-3">템플릿</p>
                    <TemplateSelector value={template} onChange={setTemplate} />
                  </>
                ) : (
                  <div className="rounded-lg bg-indigo-50/60 border border-indigo-100 p-4">
                    <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wider mb-3">
                      포함된 단계
                    </p>
                    <ol className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-baseline gap-2">
                        <span className="text-xs font-mono text-indigo-500 flex-shrink-0">1.</span>
                        <span>☁️ 워드클라우드 — 오늘 기분을 한 단어로 (3분)</span>
                      </li>
                      <li className="flex items-baseline gap-2">
                        <span className="text-xs font-mono text-indigo-500 flex-shrink-0">2.</span>
                        <span>🔄 KPT 회고 — 잘하고 있는 것 / 바꾸고 싶은 것 (10분)</span>
                      </li>
                      <li className="flex items-baseline gap-2">
                        <span className="text-xs font-mono text-indigo-500 flex-shrink-0">3.</span>
                        <span>📊 라이브 폴 — 다음 분기 우선순위 투표 (4분)</span>
                      </li>
                    </ol>
                    <p className="text-[11px] text-gray-500 mt-3">
                      만든 후 보드 안에서 단계·시간·내용 모두 자유롭게 수정할 수 있습니다.
                    </p>
                  </div>
                )}
              </div>

              <div className="lg:w-64 flex flex-col gap-4 flex-shrink-0">
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-3">스킨</p>
                  <SkinSelector value={skin} onChange={setSkin} compact />
                </div>

                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-auto"
                >
                  {creating ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      보드 생성 중…
                    </>
                  ) : (
                    '시작하기 →'
                  )}
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {user && (
        <ProfileCompletionModal
          open={profileModalOpen}
          onClose={handleProfileModalClose}
          user={user}
          existingProfile={profile}
        />
      )}
    </>
  );
}
