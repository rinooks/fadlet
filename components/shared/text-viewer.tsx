'use client';

import { X } from 'lucide-react';
import { useEffect } from 'react';

interface TextViewerProps {
  open: boolean;
  content: string;
  /** 헤더에 표시할 제목 (예: 작성자 이름). 없으면 "전체 내용". */
  title?: string;
  onClose: () => void;
}

/**
 * 긴 텍스트(채팅 메시지 등)의 전체 내용을 스크롤 가능한 모달로 보여준다.
 * 배경 클릭 · 닫기 버튼 · Esc로 닫는다.
 */
export function TextViewer({ open, content, title, onClose }: TextViewerProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="전체 내용 보기"
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-gray-100 flex-shrink-0">
          <h3 className="font-semibold text-gray-900 text-sm truncate">{title ?? '전체 내용'}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 flex-shrink-0 focus-visible:outline focus-visible:outline-2 rounded"
            aria-label="닫기"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-4 overflow-y-auto">
          <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">{content}</p>
        </div>
      </div>
    </div>
  );
}
