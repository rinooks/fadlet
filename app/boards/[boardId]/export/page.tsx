'use client';

import { use, useEffect, useState } from 'react';
import {
  BoardExportContent,
  type BoardExportType,
} from '@/components/export/board-export-content';

interface PageProps {
  params: Promise<{ boardId: string }>;
  searchParams: Promise<{ type?: BoardExportType }>;
}

export default function ExportPage({ params, searchParams }: PageProps) {
  const { boardId } = use(params);
  const { type = 'both' } = use(searchParams);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => window.print(), 500);
    return () => clearTimeout(t);
  }, [ready]);

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
          PDF 내보내기 미리보기 — 브라우저 인쇄 다이얼로그에서 “PDF로 저장”을 선택하세요.
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="text-xs bg-indigo-600 text-white px-3 py-1 rounded-md hover:bg-indigo-700"
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
        <BoardExportContent
          boardId={boardId}
          type={type}
          variant="standalone"
          onReady={() => setReady(true)}
        />
        <footer className="mt-8 pt-4 border-t border-gray-200 text-[10px] text-gray-400 text-center">
          © 2026 REFERENCE HRD. All Rights Reserved.
        </footer>
      </div>
    </div>
  );
}
