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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import type { BoardSkin, BoardTemplate } from '@/lib/types';

export function DemoButton() {
  const [open, setOpen] = useState(false);
  const [template, setTemplate] = useState<BoardTemplate>('brainstorming');
  const [skin, setSkin] = useState<BoardSkin>('standard');
  const [creating, setCreating] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

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
      const docRef = await addDoc(collection(db, boardsPath()), {
        title: '체험 보드',
        boardCode,
        template,
        mode: 'single',
        skin,
        ownerId: user.uid,
        workspaceId: 'demo',
        isDemo: true,
        settings: {
          allowChat: true,
          retainChatLog: true,
          lockedAt: null,
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      sessionStorage.setItem(`board-role-${docRef.id}`, 'host');
      sessionStorage.setItem(`board-nickname-${docRef.id}`, user.displayName ?? '퍼실리테이터');

      router.push(`/boards/${docRef.id}?code=${boardCode}`);
    } catch (err) {
      console.error('[demo]', err);
      toast.error('보드 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.');
      setCreating(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="group inline-flex items-center justify-center h-14 px-10 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-base transition-all shadow-lg shadow-indigo-600/25 hover:shadow-xl hover:shadow-indigo-600/35 hover:-translate-y-0.5"
      >
        지금 무료 체험하기
        <span className="ml-2 transition-transform group-hover:translate-x-0.5">→</span>
      </button>

      <Dialog open={open} onOpenChange={(v) => { if (!creating && !signingIn) setOpen(v); }}>
        <DialogContent className="w-[95vw] max-h-[90vh] overflow-y-auto p-6 sm:p-8 sm:max-w-5xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-bold">새 보드 만들기</DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              {user
                ? '템플릿과 스킨을 선택하면 바로 시작할 수 있습니다.'
                : '구글 계정으로 로그인하면 바로 시작할 수 있어요.'}
            </DialogDescription>
          </DialogHeader>

          {!user ? (
            <div className="flex flex-col items-center justify-center py-12 gap-5">
              <div className="text-center text-sm text-gray-500 leading-relaxed">
                구글 계정으로 로그인하면 바로 보드를 만들 수 있어요.
              </div>
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
                <p className="text-sm font-semibold text-gray-700 mb-3">템플릿</p>
                <TemplateSelector value={template} onChange={setTemplate} />
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
    </>
  );
}
