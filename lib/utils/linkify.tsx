import { Fragment } from 'react';

const URL_REGEX = /(https?:\/\/[^\s<>"']+)/g;

/**
 * 문자열에 포함된 http(s) URL을 클릭 가능한 a 태그로 변환.
 * 카드 등 클릭 가능한 부모 안에 들어갈 때 링크 클릭이 부모로 propagate 되지 않도록 stopPropagation 처리.
 */
export function linkify(text: string): React.ReactNode {
  if (!text) return text;
  const parts = text.split(URL_REGEX);
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-indigo-600 hover:text-indigo-800 underline decoration-indigo-300 hover:decoration-indigo-600 break-all"
        >
          {part}
        </a>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}
