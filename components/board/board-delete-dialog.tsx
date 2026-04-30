'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface BoardDeleteDialogProps {
  open: boolean;
  boardTitle: string;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}

export function BoardDeleteDialog({ open, boardTitle, onClose, onConfirm }: BoardDeleteDialogProps) {
  const [busy, setBusy] = useState(false);

  async function handleConfirm() {
    if (busy) return;
    setBusy(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && !busy && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-600">
              <Trash2 size={16} />
            </span>
            보드 삭제
          </DialogTitle>
          <DialogDescription>
            <span className="font-semibold text-gray-900">&ldquo;{boardTitle}&rdquo;</span> 보드를 삭제할까요?
            <br />
            이 작업은 되돌릴 수 없으며, 보드의 모든 포스트와 채팅이 함께 사라집니다.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
            취소
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={busy}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {busy ? '삭제 중...' : '삭제'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
