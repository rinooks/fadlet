'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { submitReport } from '@/lib/hooks/use-reports';
import type { ReportTarget } from '@/lib/types';

interface ReportDialogProps {
  open: boolean;
  onClose: () => void;
  boardId: string;
  targetType: ReportTarget;
  targetId: string;
  targetSnapshot: string;
  reporterId: string;
  reporterName: string;
}

const QUICK_REASONS: ReadonlyArray<string> = [
  '부적절한 언어',
  '주제와 무관',
  '광고·스팸',
  '개인정보 노출',
  '괴롭힘·차별',
];

export function ReportDialog({
  open,
  onClose,
  boardId,
  targetType,
  targetId,
  targetSnapshot,
  reporterId,
  reporterName,
}: ReportDialogProps) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  async function handleSubmit() {
    if (submitting) return;
    setSubmitting(true);
    try {
      await submitReport(boardId, {
        targetType,
        targetId,
        targetSnapshot,
        reporterId,
        reporterName,
        reason: reason.trim() || '사유 미기재',
      });
      toast.success('운영자에게 신고를 전달했습니다.');
      setReason('');
      onClose();
    } catch {
      toast.error('신고 전송 실패. 잠시 후 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${targetType === 'message' ? '메시지' : '포스트'} 신고`}
        className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-bold text-gray-900 mb-1">
          {targetType === 'message' ? '메시지' : '포스트'} 신고
        </h2>
        <p className="text-xs text-gray-500 mb-4">
          신고 내용은 운영자에게만 전달됩니다.
        </p>

        <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 mb-4 max-h-24 overflow-y-auto">
          <p className="text-xs text-gray-600 whitespace-pre-wrap break-words line-clamp-4">
            {targetSnapshot || '(내용 없음)'}
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {QUICK_REASONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setReason((cur) => (cur ? `${cur}, ${r}` : r))}
              className="text-[11px] px-2 py-1 bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-full transition-colors"
            >
              + {r}
            </button>
          ))}
        </div>

        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="추가 사유 (선택)"
          rows={3}
          maxLength={500}
          className="text-sm mb-4"
        />

        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={onClose} disabled={submitting}>
            취소
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold"
          >
            {submitting ? '전송 중…' : '신고 전송'}
          </Button>
        </div>
      </div>
    </div>
  );
}
