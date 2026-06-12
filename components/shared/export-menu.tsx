'use client';

import { useEffect, useRef, useState } from 'react';
import { Download, ChevronDown } from 'lucide-react';

interface ExportMenuProps {
  boardId: string;
  isWorkshop?: boolean;
}

export function ExportMenu({ boardId, isWorkshop = false }: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  function openExport(type: 'board' | 'chat' | 'both' | 'workshop') {
    window.open(`/boards/${boardId}/export?type=${type}`, '_blank', 'noopener');
    setOpen(false);
  }

  function openExcel() {
    const type = isWorkshop ? 'workshop' : 'both';
    window.open(`/boards/${boardId}/export?type=${type}&format=xlsx`, '_blank', 'noopener');
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-xs text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 px-3 h-7 rounded-md transition-colors focus-visible:outline focus-visible:outline-2"
        aria-label="내보내기"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Download size={13} />
        <span className="hidden sm:inline">내보내기</span>
        <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1"
        >
          {isWorkshop && (
            <>
              <button
                type="button"
                role="menuitem"
                onClick={() => openExport('workshop')}
                className="w-full text-left text-xs px-3 py-2 hover:bg-indigo-50 font-semibold text-indigo-700"
              >
                🎬 워크숍 리포트
              </button>
              <div className="my-1 border-t border-gray-100" />
            </>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={() => openExport('board')}
            className="w-full text-left text-xs px-3 py-2 hover:bg-gray-50"
          >
            보드 PDF
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => openExport('chat')}
            className="w-full text-left text-xs px-3 py-2 hover:bg-gray-50"
          >
            채팅 기록 PDF
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => openExport('both')}
            className="w-full text-left text-xs px-3 py-2 hover:bg-gray-50"
          >
            보드 + 채팅 통합
          </button>
          <div className="my-1 border-t border-gray-100" />
          <button
            type="button"
            role="menuitem"
            onClick={openExcel}
            className="w-full text-left text-xs px-3 py-2 hover:bg-emerald-50 font-semibold text-emerald-700"
          >
            📊 Excel (.xlsx)
          </button>
        </div>
      )}
    </div>
  );
}
