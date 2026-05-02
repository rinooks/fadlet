'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInAnonymously } from 'firebase/auth';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import { auth, db } from '@/lib/firebase/client';
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
  const router = useRouter();

  async function handleCreate() {
    setCreating(true);
    try {
      let user = auth.currentUser;
      if (!user) {
        const cred = await signInAnonymously(auth);
        user = cred.user;
      }

      const boardCode = await generateBoardCode();
      const docRef = await addDoc(collection(db, boardsPath()), {
        title: '데모 보드',
        boardCode,
        template,
        skin,
        ownerId: user.uid,
        workspaceId: 'demo',
        isDemo: true,
        maxParticipants: 50,
        settings: {
          allowChat: true,
          retainChatLog: false,
          lockedAt: null,
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      sessionStorage.setItem(`board-role-${docRef.id}`, 'host');
      sessionStorage.setItem(`board-nickname-${docRef.id}`, '운영자');

      router.push(`/boards/${docRef.id}?code=${boardCode}`);
    } catch (err) {
      console.error('[demo]', err);
      toast.error('데모 보드 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.');
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

      <Dialog open={open} onOpenChange={(v) => { if (!creating) setOpen(v); }}>
        <DialogContent className="w-[95vw] max-h-[90vh] overflow-y-auto p-6 sm:p-8 sm:max-w-5xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-bold">데모 보드 설정</DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              템플릿과 스킨을 선택하면 바로 시작할 수 있습니다. 가입 불필요 · 최대 50명 참여.
            </DialogDescription>
          </DialogHeader>

          {/* PC: 좌(템플릿) + 우(스킨 + 버튼) 2단 레이아웃 */}
          <div className="flex flex-col lg:flex-row gap-8">
            {/* 템플릿 — 좌측 넓은 영역 */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-700 mb-3">템플릿</p>
              <TemplateSelector value={template} onChange={setTemplate} />
            </div>

            {/* 스킨 + 시작 버튼 — 우측 고정 폭 */}
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
                  '데모 시작하기 →'
                )}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
