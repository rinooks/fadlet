'use client';

import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { MessageSquarePlus, Send } from 'lucide-react';
import { useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { auth, db } from '@/lib/firebase/client';
import { feedbackPath } from '@/lib/firebase/collections';

interface Props {
  /** 보드/워크스페이스 컨텍스트가 있다면 전달. 자동 첨부됨. */
  boardId?: string;
  /** 헤더에 텍스트 라벨 표시 여부 (기본 false: 아이콘만) */
  showLabel?: boolean;
  className?: string;
}

export function FeedbackButton({ boardId, showLabel = false, className }: Props) {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return unsub;
  }, []);

  async function handleSubmit() {
    const trimmed = message.trim();
    if (!trimmed) {
      toast.error('피드백 내용을 입력해 주세요.');
      return;
    }
    if (!user) {
      toast.error('로그인 상태를 확인해 주세요.');
      return;
    }
    setSubmitting(true);
    try {
      await addDoc(collection(db, feedbackPath()), {
        uid: user.uid,
        ...(user.email ? { email: user.email } : {}),
        ...(user.displayName ? { displayName: user.displayName } : {}),
        message: trimmed,
        ...(boardId ? { boardId } : {}),
        ...(typeof window !== 'undefined'
          ? { url: window.location.href, userAgent: navigator.userAgent.slice(0, 200) }
          : {}),
        createdAt: serverTimestamp(),
      });
      toast.success('피드백을 보냈습니다. 감사합니다!');
      setMessage('');
      setOpen(false);
    } catch (err) {
      console.error('[feedback] submit failed', err);
      toast.error('전송에 실패했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className
          ?? 'inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-indigo-600 transition-colors'
        }
        aria-label="피드백 보내기"
        title="피드백 보내기"
      >
        <MessageSquarePlus size={14} />
        {showLabel && <span>피드백</span>}
      </button>

      <Dialog open={open} onOpenChange={(v) => { if (!submitting) setOpen(v); }}>
        <DialogContent className="sm:max-w-md p-6">
          <DialogHeader>
            <DialogTitle>💬 피드백 보내기</DialogTitle>
            <DialogDescription className="text-xs text-gray-500 mt-1">
              버그 · 개선 아이디어 · 사용 중 불편한 점 — 무엇이든 환영합니다.
              현재 페이지 정보가 함께 전달됩니다.
            </DialogDescription>
          </DialogHeader>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="자세히 적어주실수록 빠르게 반영됩니다."
            rows={6}
            disabled={submitting}
            className="mt-3 w-full px-3 py-2 rounded-md border border-gray-200 text-sm focus:outline-none focus:border-indigo-400 resize-y min-h-[120px]"
            autoFocus
          />

          <div className="flex items-center justify-between mt-3 gap-2">
            <p className="text-[11px] text-gray-400 flex-1 truncate">
              {user?.email ? `보낸 사람: ${user.email}` : '익명 세션'}
            </p>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting} className="text-xs">
              취소
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || !message.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
            >
              <Send size={12} className="mr-1" />
              {submitting ? '보내는 중…' : '보내기'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
