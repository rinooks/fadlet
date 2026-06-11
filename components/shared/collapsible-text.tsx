'use client';

import { useState } from 'react';
import { CHAT_PREVIEW_THRESHOLD } from '@/lib/types';
import { TextViewer } from './text-viewer';

interface CollapsibleTextProps {
  content: string;
  /** 텍스트 <p>에 적용할 클래스 */
  className?: string;
  /** 채팅 말풍선 색상에 맞춰 "전체 내용 보기" 버튼 색을 조정 */
  isMine?: boolean;
  /** 전체 보기 모달 헤더 제목 (작성자 이름 등) */
  viewerTitle?: string;
}

/**
 * 길면 말줄임(line-clamp)으로 줄이고 "전체 내용 보기" 버튼으로 전체를 모달에 띄운다.
 * 짧으면 그대로 표시한다.
 */
export function CollapsibleText({ content, className, isMine, viewerTitle }: CollapsibleTextProps) {
  const [open, setOpen] = useState(false);
  const isLong = content.length > CHAT_PREVIEW_THRESHOLD;

  if (!isLong) {
    return <p className={className}>{content}</p>;
  }

  return (
    <>
      <p className={`${className ?? ''} line-clamp-[8]`}>{content}</p>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        className={`mt-1 text-xs font-semibold underline underline-offset-2 focus-visible:outline focus-visible:outline-2 rounded ${
          isMine ? 'text-indigo-100 hover:text-white' : 'text-indigo-600 hover:text-indigo-700'
        }`}
      >
        전체 내용 보기
      </button>
      <TextViewer open={open} content={content} title={viewerTitle} onClose={() => setOpen(false)} />
    </>
  );
}
