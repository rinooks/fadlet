'use client';

import { useEffect, useRef, useState } from 'react';
import { MoreVertical } from 'lucide-react';

interface HostActionsMenuProps {
  isLocked: boolean;
  openReportCount: number;
  onOpenReports: () => void;
  onOpenFacilitator: () => void;
  onToggleLock: () => void;
  onOpenShare: () => void;
}

export function HostActionsMenu({
  isLocked,
  openReportCount,
  onOpenReports,
  onOpenFacilitator,
  onToggleLock,
  onOpenShare,
}: HostActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  function pick(fn: () => void) {
    return () => {
      fn();
      setOpen(false);
    };
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex items-center justify-center w-9 h-9 text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 rounded-md transition-colors focus-visible:outline focus-visible:outline-2"
        aria-label="퍼실리테이터 메뉴"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <MoreVertical size={16} />
        {openReportCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
            {openReportCount > 99 ? '99+' : openReportCount}
          </span>
        )}
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1"
        >
          <button
            type="button"
            role="menuitem"
            onClick={pick(onOpenReports)}
            className="w-full flex items-center justify-between text-left text-sm px-3 py-2.5 hover:bg-gray-50"
          >
            <span>🚩 신고 관리</span>
            {openReportCount > 0 && (
              <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
                {openReportCount > 99 ? '99+' : openReportCount}
              </span>
            )}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={pick(onOpenFacilitator)}
            className="w-full text-left text-sm px-3 py-2.5 hover:bg-gray-50"
          >
            🎛 환경설정
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={pick(onToggleLock)}
            className="w-full text-left text-sm px-3 py-2.5 hover:bg-gray-50"
          >
            {isLocked ? '🔓 잠금 해제' : '🔒 보드 잠금'}
          </button>
          <div className="my-1 h-px bg-gray-100" aria-hidden />
          <button
            type="button"
            role="menuitem"
            onClick={pick(onOpenShare)}
            className="w-full text-left text-sm px-3 py-2.5 hover:bg-gray-50 text-indigo-600 font-semibold"
          >
            📤 공유하기
          </button>
        </div>
      )}
    </div>
  );
}
