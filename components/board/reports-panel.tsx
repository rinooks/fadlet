'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { CheckCircle2, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useReports } from '@/lib/hooks/use-reports';
import type { Report } from '@/lib/types';

interface ReportsPanelProps {
  open: boolean;
  onClose: () => void;
  boardId: string;
  currentUid: string;
  onDeleteMessage: (messageId: string) => Promise<void>;
  onDeletePost: (postId: string) => Promise<void>;
}

type Filter = 'open' | 'all';

export function ReportsPanel({ open, onClose, boardId, currentUid, onDeleteMessage, onDeletePost }: ReportsPanelProps) {
  const { reports, loading, resolveReport, deleteReport } = useReports(boardId, open);
  const [filter, setFilter] = useState<Filter>('open');

  if (!open) return null;

  const visible = filter === 'open' ? reports.filter((r) => r.status === 'open') : reports;
  const openCount = reports.filter((r) => r.status === 'open').length;

  async function handleDeleteTarget(report: Report) {
    try {
      if (report.targetType === 'message') {
        await onDeleteMessage(report.targetId);
      } else {
        const postId = report.targetId.split('/')[0];
        await onDeletePost(postId);
      }
      await resolveReport(report.id, currentUid);
      toast.success('대상을 삭제하고 신고를 해결 처리했습니다.');
    } catch {
      toast.error('처리 실패. 권한을 확인해주세요.');
    }
  }

  async function handleResolve(report: Report) {
    try {
      await resolveReport(report.id, currentUid);
      toast.success('신고를 해결 처리했습니다.');
    } catch {
      toast.error('처리 실패');
    }
  }

  async function handleDelete(report: Report) {
    try {
      await deleteReport(report.id);
    } catch {
      toast.error('삭제 실패');
    }
  }

  function formatTime(ts?: Report['createdAt']) {
    if (!ts?.toDate) return '';
    return formatDistanceToNow(ts.toDate(), { addSuffix: true, locale: ko });
  }

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="flex-1 bg-black/30" onClick={onClose} aria-hidden />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="신고 관리"
        className="w-full max-w-md bg-white shadow-xl flex flex-col h-full overflow-hidden"
      >
        <header className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-900">🚩 신고 관리</h2>
            <p className="text-xs text-gray-500">참여자가 신고한 내용을 확인합니다.</p>
          </div>
          <button
            onClick={onClose}
            aria-label="닫기"
            className="text-gray-400 hover:text-gray-700 p-1 focus-visible:outline focus-visible:outline-2"
          >
            <X size={18} />
          </button>
        </header>

        <div className="flex items-center gap-1 px-5 py-2 border-b border-gray-100">
          <button
            onClick={() => setFilter('open')}
            className={`px-3 py-1 text-xs rounded-md font-semibold ${
              filter === 'open' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            미처리 {openCount > 0 && <span className={filter === 'open' ? 'text-white' : 'text-red-500'}>({openCount})</span>}
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 text-xs rounded-md font-semibold ${
              filter === 'all' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            전체 ({reports.length})
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {loading && <p className="text-xs text-gray-400 text-center py-6">불러오는 중…</p>}
          {!loading && visible.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-8">
              {filter === 'open' ? '미처리 신고가 없습니다.' : '신고가 없습니다.'}
            </p>
          )}
          {visible.map((report) => (
            <div
              key={report.id}
              className={`border rounded-lg p-3 ${
                report.status === 'resolved' ? 'bg-gray-50 border-gray-200 opacity-70' : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                    report.targetType === 'message' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {report.targetType === 'message' ? '메시지' : '포스트'}
                  </span>
                  {report.status === 'resolved' && (
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-green-100 text-green-700">
                      해결
                    </span>
                  )}
                  <span className="text-[10px] text-gray-400">{formatTime(report.createdAt)}</span>
                </div>
                <button
                  onClick={() => handleDelete(report)}
                  className="text-gray-300 hover:text-red-500 p-0.5"
                  aria-label="신고 기록 삭제"
                  title="신고 기록 삭제"
                >
                  <Trash2 size={12} />
                </button>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded px-2.5 py-1.5 mb-2">
                <p className="text-xs text-gray-700 whitespace-pre-wrap break-words line-clamp-4">
                  {report.targetSnapshot || '(내용 없음)'}
                </p>
              </div>

              <div className="text-xs text-gray-600 mb-1">
                <span className="font-semibold">{report.reporterName}</span>
                <span className="text-gray-400"> 님이 신고</span>
              </div>
              <p className="text-xs text-gray-700 mb-3 whitespace-pre-wrap break-words">
                <span className="text-gray-400">사유: </span>
                {report.reason}
              </p>

              {report.status === 'open' && (
                <div className="flex gap-1.5">
                  <Button
                    size="sm"
                    onClick={() => handleDeleteTarget(report)}
                    className="bg-red-600 hover:bg-red-700 text-white text-xs h-7 flex-1"
                  >
                    <Trash2 size={11} />
                    <span className="ml-1">대상 삭제 + 해결</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleResolve(report)}
                    className="text-xs h-7"
                  >
                    <CheckCircle2 size={11} />
                    <span className="ml-1">해결만</span>
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
