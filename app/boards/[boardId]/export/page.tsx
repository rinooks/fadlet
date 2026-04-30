'use client';

import { use, useEffect, useMemo } from 'react';
import { useBoard } from '@/lib/hooks/use-board';
import { useMessages } from '@/lib/hooks/use-messages';
import { usePosts } from '@/lib/hooks/use-posts';
import { getTemplate } from '@/lib/templates';
import type { Message, Post, PostColor } from '@/lib/types';

interface PageProps {
  params: Promise<{ boardId: string }>;
  searchParams: Promise<{ type?: 'board' | 'chat' | 'both' }>;
}

const COLOR_BG: Record<PostColor, string> = {
  yellow: '#fef9c3',
  blue: '#dbeafe',
  pink: '#fce7f3',
  green: '#dcfce7',
  purple: '#f3e8ff',
  gray: '#f3f4f6',
};

const COLOR_BORDER: Record<PostColor, string> = {
  yellow: '#fde047',
  blue: '#93c5fd',
  pink: '#f9a8d4',
  green: '#86efac',
  purple: '#d8b4fe',
  gray: '#d1d5db',
};

function formatDate(d?: Date): string {
  if (!d) return '';
  return d.toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function PostBlock({ post }: { post: Post }) {
  return (
    <div
      style={{
        backgroundColor: COLOR_BG[post.color],
        border: `2px solid ${COLOR_BORDER[post.color]}`,
      }}
      className="rounded-lg p-3 break-inside-avoid mb-2"
    >
      {post.imageUrl && (
        <img
          src={post.imageUrl}
          alt=""
          className="w-full max-h-48 object-cover rounded-md mb-2"
          crossOrigin="anonymous"
        />
      )}
      {post.content && (
        <p className="text-[13px] text-gray-800 whitespace-pre-wrap break-words mb-2">{post.content}</p>
      )}
      <div className="text-[10px] text-gray-500 flex justify-between">
        <span>{post.authorName}</span>
        <span>{formatDate(post.createdAt?.toDate?.())}</span>
      </div>
    </div>
  );
}

function MessageBlock({ msg }: { msg: Message }) {
  const isHost = msg.role === 'host';
  return (
    <div className="flex flex-col break-inside-avoid mb-3 pb-2 border-b border-gray-100">
      <div className="flex items-baseline justify-between mb-1">
        <span className={`text-xs font-semibold ${isHost ? 'text-indigo-600' : 'text-gray-700'}`}>
          {msg.authorName}
          {isHost && ' (운영자)'}
        </span>
        <span className="text-[10px] text-gray-400">{formatDate(msg.createdAt?.toDate?.())}</span>
      </div>
      {msg.type === 'image' && msg.fileUrl && (
        <img src={msg.fileUrl} alt="" className="max-h-48 object-contain rounded-md mb-1" crossOrigin="anonymous" />
      )}
      {msg.type === 'file' && msg.fileName && (
        <span className="text-xs text-gray-500">📎 {msg.fileName}</span>
      )}
      {msg.content && <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">{msg.content}</p>}
    </div>
  );
}

export default function ExportPage({ params, searchParams }: PageProps) {
  const { boardId } = use(params);
  const { type = 'both' } = use(searchParams);
  const { board, loading: boardLoading } = useBoard(boardId);
  const { posts, loading: postsLoading } = usePosts(boardId);
  const { messages, loading: msgsLoading } = useMessages(boardId);

  const ready = !boardLoading && !postsLoading && !msgsLoading && board;

  const template = useMemo(() => getTemplate(board?.template ?? 'free'), [board?.template]);

  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => window.print(), 500);
    return () => clearTimeout(t);
  }, [ready]);

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-400 text-sm">불러오는 중...</p>
      </div>
    );
  }

  const showBoard = type === 'board' || type === 'both';
  const showChat = type === 'chat' || type === 'both';
  const isFree = template.columns === null;

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
        <header className="mb-6 pb-4 border-b border-gray-200">
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-indigo-600 font-bold">Fadlet</span>
            <span className="text-xs text-gray-400 font-mono">{board.boardCode}</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-1">{board.title}</h1>
          <p className="text-xs text-gray-500">
            {template.emoji} {template.label} · 출력일: {formatDate(new Date())}
          </p>
        </header>

        {showBoard && (
          <section className="mb-8">
            <h2 className="text-sm font-bold text-gray-900 mb-3">📋 보드 ({posts.length})</h2>
            {posts.length === 0 ? (
              <p className="text-xs text-gray-400">포스트가 없습니다.</p>
            ) : isFree ? (
              <div className="grid grid-cols-2 gap-2">
                {posts.map((p) => (
                  <PostBlock key={p.id} post={p} />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {(template.columns ?? []).map((col) => {
                  const colPosts = posts.filter((p) => p.columnId === col.id);
                  return (
                    <div key={col.id} className="break-inside-avoid">
                      <h3 className="text-xs font-bold text-gray-700 mb-2 pb-1 border-b border-gray-200">
                        {col.label} ({colPosts.length})
                      </h3>
                      {colPosts.length === 0 ? (
                        <p className="text-[11px] text-gray-400 italic">비어 있음</p>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          {colPosts.map((p) => (
                            <PostBlock key={p.id} post={p} />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {showChat && (
          <section className={showBoard ? 'page-break pt-6' : ''}>
            <h2 className="text-sm font-bold text-gray-900 mb-3">💬 채팅 기록 ({messages.length})</h2>
            {messages.length === 0 ? (
              <p className="text-xs text-gray-400">메시지가 없습니다.</p>
            ) : (
              <div>
                {messages.map((m) => (
                  <MessageBlock key={m.id} msg={m} />
                ))}
              </div>
            )}
          </section>
        )}

        <footer className="mt-8 pt-4 border-t border-gray-200 text-[10px] text-gray-400 text-center">
          © 2026 REFERENCE HRD. All Rights Reserved.
        </footer>
      </div>
    </div>
  );
}
