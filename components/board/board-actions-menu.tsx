'use client';

import { useEffect, useRef, useState } from 'react';
import { MoreVertical, Pencil, Trash2 } from 'lucide-react';

interface BoardActionsMenuProps {
  onRename: () => void;
  onDelete: () => void;
}

export function BoardActionsMenu({ onRename, onDelete }: BoardActionsMenuProps) {
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
    return (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      setOpen(false);
      fn();
    };
  }

  return (
    <div ref={ref} className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setOpen((v) => !v);
        }}
        className="flex items-center justify-center w-7 h-7 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 focus-visible:outline focus-visible:outline-2"
        aria-label="보드 메뉴"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <MoreVertical size={16} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1 w-36 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1"
        >
          <button
            type="button"
            role="menuitem"
            onClick={pick(onRename)}
            className="w-full flex items-center gap-2 text-left text-sm px-3 py-2 hover:bg-gray-50 text-gray-700"
          >
            <Pencil size={13} /> 이름 변경
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={pick(onDelete)}
            className="w-full flex items-center gap-2 text-left text-sm px-3 py-2 hover:bg-red-50 text-red-600"
          >
            <Trash2 size={13} /> 삭제
          </button>
        </div>
      )}
    </div>
  );
}
