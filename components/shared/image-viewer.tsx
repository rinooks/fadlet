'use client';

import { X } from 'lucide-react';
import { useEffect } from 'react';

interface ImageViewerProps {
  /** 표시할 이미지 URL. null이면 뷰어를 닫는다. */
  src: string | null;
  alt?: string;
  onClose: () => void;
}

/**
 * 첨부 이미지를 화면 전체에 크게 띄워 보여주는 라이트박스.
 * 이미지를 잘리지 않게(object-contain) 전체가 보이도록 표시한다.
 * 배경 클릭·닫기 버튼·Esc로 닫는다.
 */
export function ImageViewer({ src, alt, onClose }: ImageViewerProps) {
  // Esc로 닫기 + 열려 있는 동안 배경 스크롤 잠금
  useEffect(() => {
    if (!src) return;
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
  }, [src, onClose]);

  if (!src) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 sm:p-8"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="이미지 확대 보기"
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/30 hover:bg-black/50 rounded-full p-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white transition-colors"
        aria-label="닫기"
      >
        <X size={22} />
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt ?? '확대 이미지'}
        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}
