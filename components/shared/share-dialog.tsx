'use client';

import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
  boardCode: string;
  boardTitle: string;
}

export function ShareDialog({ open, onClose, boardCode, boardTitle }: ShareDialogProps) {
  const [codeCopied, setCodeCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const joinUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/boards/join?code=${boardCode}`
      : `/boards/join?code=${boardCode}`;

  async function copyCode() {
    await navigator.clipboard.writeText(boardCode);
    setCodeCopied(true);
    toast.success('코드가 복사됐습니다!');
    setTimeout(() => setCodeCopied(false), 2000);
  }

  async function copyLink() {
    await navigator.clipboard.writeText(joinUrl);
    setLinkCopied(true);
    toast.success('링크가 복사됐습니다!');
    setTimeout(() => setLinkCopied(false), 2000);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>보드 공유</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-5 py-2">
          <p className="text-sm text-gray-500 text-center">
            <span className="font-semibold text-gray-900">{boardTitle}</span>에 참여할 수 있도록<br />
            아래 코드 또는 QR 코드를 공유하세요.
          </p>

          {/* 6자리 코드 */}
          <div className="flex flex-col items-center gap-2 w-full">
            <div className="flex items-center gap-3 bg-blue-50 rounded-xl px-6 py-4 w-full justify-center">
              <span className="text-4xl font-bold font-mono tracking-widest text-blue-600">
                {boardCode}
              </span>
            </div>
            <Button
              onClick={copyCode}
              variant="outline"
              size="sm"
              className="w-full font-semibold"
            >
              {codeCopied ? '✓ 복사됨' : '코드 복사'}
            </Button>
          </div>

          {/* QR 코드 */}
          <div className="flex flex-col items-center gap-2">
            <div className="p-3 bg-white border border-gray-200 rounded-xl shadow-sm">
              <QRCodeSVG value={joinUrl} size={160} />
            </div>
            <p className="text-xs text-gray-400">QR 코드로 즉시 입장</p>
          </div>

          {/* 링크 복사 */}
          <Button
            onClick={copyLink}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
          >
            {linkCopied ? '✓ 링크 복사됨' : '입장 링크 복사'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
