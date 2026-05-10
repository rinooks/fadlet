'use client';

import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { use, useCallback, useEffect, useState } from 'react';
import { db } from '@/lib/firebase/client';
import { boardsPath } from '@/lib/firebase/collections';
import { useWorkspace } from '@/lib/hooks/use-workspaces';
import {
  BoardExportContent,
  formatDate,
} from '@/components/export/board-export-content';
import type { Board } from '@/lib/types';

interface PageProps {
  params: Promise<{ wsId: string }>;
}

export default function WorkspaceExportPage({ params }: PageProps) {
  const { wsId } = use(params);
  const { workspace } = useWorkspace(wsId);
  const [boards, setBoards] = useState<Board[]>([]);
  const [boardsLoading, setBoardsLoading] = useState(true);
  const [readyIds, setReadyIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const q = query(collection(db, boardsPath()), where('workspaceId', '==', wsId));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Board);
        list.sort((a, b) => {
          const ta = a.createdAt?.toMillis?.() ?? 0;
          const tb = b.createdAt?.toMillis?.() ?? 0;
          return ta - tb;
        });
        setBoards(list);
        setBoardsLoading(false);
      },
      (err) => {
        console.error('[ws-export] boards snapshot error', err);
        setBoardsLoading(false);
      },
    );
    return unsub;
  }, [wsId]);

  const handleBoardReady = useCallback((boardId: string) => {
    setReadyIds((prev) => {
      if (prev.has(boardId)) return prev;
      const next = new Set(prev);
      next.add(boardId);
      return next;
    });
  }, []);

  const allReady =
    !boardsLoading && boards.length > 0 && readyIds.size === boards.length;

  useEffect(() => {
    if (!allReady) return;
    const t = setTimeout(() => window.print(), 800);
    return () => clearTimeout(t);
  }, [allReady]);

  return (
    <div className="export-root bg-white text-gray-900">
      <style>{`
        @page { size: A4; margin: 12mm; }
        body { background: white; }
        @media print {
          .no-print { display: none !important; }
          .page-break { page-break-before: always; }
          .break-inside-avoid { break-inside: avoid; page-break-inside: avoid; }
        }
        .break-inside-avoid { break-inside: avoid; page-break-inside: avoid; }
      `}</style>

      <div className="no-print sticky top-0 z-10 flex items-center justify-between bg-indigo-50 border-b border-indigo-200 px-4 py-2">
        <span className="text-xs text-indigo-800">
          {allReady
            ? '워크스페이스 PDF 미리보기 — 모든 보드를 불러왔습니다.'
            : `워크스페이스 PDF 미리보기 — 보드 불러오는 중 ${readyIds.size}/${boards.length}`}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            disabled={!allReady}
            className="text-xs bg-indigo-600 text-white px-3 py-1 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            인쇄·저장
          </button>
          <button
            type="button"
            onClick={() => window.close()}
            className="text-xs text-gray-600 hover:text-gray-900 px-2"
          >
            닫기
          </button>
        </div>
      </div>

      <div className="max-w-[800px] mx-auto p-6">
        {!workspace || boardsLoading ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-gray-400 text-sm">불러오는 중...</p>
          </div>
        ) : (
          <>
            <header className="mb-6 pb-4 border-b border-gray-200">
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-indigo-600 font-bold">Fadlet</span>
                <span className="text-xs text-gray-400 font-mono">{workspace.workspaceCode}</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">{workspace.name}</h1>
              <p className="text-xs text-gray-500">
                📦 워크스페이스 통합 리포트 · 보드 {boards.length}개 · 출력일: {formatDate(new Date())}
              </p>
              {boards.length > 0 && (
                <ol className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-700 list-decimal list-inside">
                  {boards.map((b) => (
                    <li key={b.id} className="truncate">
                      {b.title}{' '}
                      <span className="font-mono text-[10px] text-gray-400">({b.boardCode})</span>
                    </li>
                  ))}
                </ol>
              )}
            </header>

            {boards.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-12">보드가 없습니다.</p>
            ) : (
              boards.map((b, i) => (
                <BoardExportContent
                  key={b.id}
                  boardId={b.id}
                  type="auto"
                  variant="section"
                  index={i}
                  total={boards.length}
                  pageBreakBefore={i > 0}
                  onReady={() => handleBoardReady(b.id)}
                />
              ))
            )}

            <footer className="mt-8 pt-4 border-t border-gray-200 text-[10px] text-gray-400 text-center">
              © 2026 REFERENCE HRD. All Rights Reserved.
            </footer>
          </>
        )}
      </div>
    </div>
  );
}
