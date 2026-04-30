'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface BoardRenameDialogProps {
  open: boolean;
  initialTitle: string;
  onClose: () => void;
  onSubmit: (title: string) => Promise<void> | void;
}

export function BoardRenameDialog({ open, initialTitle, onClose, onSubmit }: BoardRenameDialogProps) {
  const [title, setTitle] = useState(initialTitle);
  const [busy, setBusy] = useState(false);

  // 외부에서 다이얼로그가 새 보드로 열릴 때 인풋을 동기화. 의도된 setState in effect.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (open) {
      setTitle(initialTitle);
      setBusy(false);
    }
  }, [open, initialTitle]);
  /* eslint-enable react-hooks/set-state-in-effect */

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next = title.trim();
    if (!next || next === initialTitle || busy) {
      onClose();
      return;
    }
    setBusy(true);
    try {
      await onSubmit(next);
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>보드 이름 변경</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={60}
            autoFocus
            placeholder="보드 이름"
            className="text-base"
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
              취소
            </Button>
            <Button
              type="submit"
              disabled={busy || !title.trim() || title.trim() === initialTitle}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {busy ? '저장 중...' : '저장'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
