'use client';

import { useState } from 'react';
import { ArrowRightLeft, Loader2, X } from 'lucide-react';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { db } from '@/lib/firebase/client';
import { boardsPath } from '@/lib/firebase/collections';
import { useMyWorkspaces } from '@/lib/hooks/use-workspaces';
import { Button } from '@/components/ui/button';

interface MoveBoardDialogProps {
  open: boolean;
  boardId: string;
  boardTitle: string;
  currentWorkspaceId: string;
  currentUid: string;
  onClose: () => void;
}

export function MoveBoardDialog({
  open,
  boardId,
  boardTitle,
  currentWorkspaceId,
  currentUid,
  onClose,
}: MoveBoardDialogProps) {
  const { workspaces, loading } = useMyWorkspaces(open ? currentUid : null);
  const [moving, setMoving] = useState(false);

  if (!open) return null;

  const targets = workspaces.filter(
    (w) => w.id !== currentWorkspaceId && w.id !== 'default' && w.id !== 'demo',
  );

  async function handleMove(targetWsId: string, targetWsName: string) {
    if (moving) return;
    if (!confirm(`"${boardTitle}" 보드를 "${targetWsName}" 워크스페이스로 이동합니다. 계속하시겠습니까?`)) {
      return;
    }
    setMoving(true);
    try {
      await updateDoc(doc(db, boardsPath(), boardId), {
        workspaceId: targetWsId,
        updatedAt: serverTimestamp(),
      });
      toast.success('보드를 이동했습니다.');
      onClose();
    } catch (err) {
      console.error('[move-board]', err);
      toast.error('이동에 실패했습니다. 권한과 워크스페이스 멤버십을 확인해 주세요.');
    } finally {
      setMoving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !moving) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <ArrowRightLeft size={18} className="text-indigo-600" /> 워크스페이스 이동
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={moving}
            className="text-gray-400 hover:text-gray-700 p-1 rounded focus-visible:outline focus-visible:outline-2"
            aria-label="닫기"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4 overflow-y-auto">
          <p className="text-xs text-gray-500 mb-3">
            <strong className="text-gray-800">{boardTitle}</strong> 보드를 다른 워크스페이스로 이동합니다.
            포스트·댓글·이모지 반응은 모두 그대로 유지됩니다.
          </p>

          {loading ? (
            <p className="text-xs text-gray-400 text-center py-8">
              <Loader2 size={14} className="inline animate-spin mr-1" /> 워크스페이스 목록 불러오는 중...
            </p>
          ) : targets.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8">
              이동할 수 있는 다른 워크스페이스가 없습니다.
              <br />
              <span className="text-[11px] text-gray-400">
                내가 멤버로 등록된 다른 워크스페이스가 필요합니다.
              </span>
            </p>
          ) : (
            <ul className="space-y-1.5">
              {targets.map((w) => (
                <li key={w.id}>
                  <button
                    type="button"
                    onClick={() => handleMove(w.id, w.name)}
                    disabled={moving}
                    className="w-full text-left rounded-lg border border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 px-3 py-2.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{w.name}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5 font-mono">코드 {w.workspaceCode}</p>
                    </div>
                    {moving && <Loader2 size={14} className="animate-spin text-indigo-500" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-5 py-3">
          <Button onClick={onClose} disabled={moving} variant="ghost" size="sm">
            취소
          </Button>
        </div>
      </div>
    </div>
  );
}
