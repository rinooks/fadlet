'use client';

import { collection, onSnapshot } from 'firebase/firestore';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useBoard } from '@/lib/hooks/use-board';
import { useMessages } from '@/lib/hooks/use-messages';
import { usePosts } from '@/lib/hooks/use-posts';
import { db } from '@/lib/firebase/client';
import {
  pollResponsesPath,
  qnaQuestionsPath,
  wordcloudEntriesPath,
} from '@/lib/firebase/collections';
import { getActivity, isLiveActivity } from '@/lib/activities';
import { getTemplate } from '@/lib/templates';
import type {
  ActivityType,
  BoardTemplate,
  Message,
  PollResponse,
  Post,
  PostColor,
  QnaQuestion,
  Stage,
  WordcloudEntry,
} from '@/lib/types';

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

export function formatDate(d?: Date): string {
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
          {isHost && ' (퍼실리테이터)'}
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

function PostsForStage({ posts, activityType }: { posts: Post[]; activityType?: ActivityType }) {
  if (posts.length === 0) {
    return <p className="text-[11px] text-gray-400 italic">결과 없음</p>;
  }
  const tmpl = activityType && !isLiveActivity(activityType)
    ? getTemplate(activityType as BoardTemplate)
    : null;
  const isFree = !tmpl || tmpl.columns === null;
  if (isFree) {
    return (
      <div className="grid grid-cols-2 gap-2">
        {posts.map((p) => <PostBlock key={p.id} post={p} />)}
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {(tmpl.columns ?? []).map((col) => {
        const colPosts = posts.filter((p) => p.columnId === col.id);
        return (
          <div key={col.id} className="break-inside-avoid">
            <h4 className="text-xs font-bold text-gray-700 mb-1.5 pb-0.5 border-b border-gray-200">
              {col.label} ({colPosts.length})
            </h4>
            {colPosts.length === 0 ? (
              <p className="text-[11px] text-gray-400 italic">비어 있음</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {colPosts.map((p) => <PostBlock key={p.id} post={p} />)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function PollResultBlock({ stage, responses }: { stage: Stage; responses: PollResponse[] }) {
  const config = stage.activityConfig?.poll;
  if (!config) return <p className="text-[11px] text-gray-400 italic">설정 누락</p>;
  const counts = config.options.map(() => 0);
  const respondents = new Set<string>();
  for (const r of responses) {
    respondents.add(r.userId);
    for (const idx of r.optionIndexes) {
      if (idx >= 0 && idx < counts.length) counts[idx] += 1;
    }
  }
  const total = respondents.size;
  const max = Math.max(1, ...counts);
  return (
    <div className="break-inside-avoid">
      <p className="text-[13px] font-semibold text-gray-900 mb-2">{config.question}</p>
      <div className="space-y-1.5">
        {config.options.map((option, idx) => {
          const count = counts[idx] ?? 0;
          const widthPct = Math.round((count / max) * 100);
          const sharePct = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <div key={idx} className="relative border border-gray-200 rounded-md px-3 py-1.5 overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-indigo-100"
                style={{ width: `${widthPct}%` }}
                aria-hidden
              />
              <div className="relative flex items-center justify-between text-[12px]">
                <span className="font-semibold text-gray-900">{option}</span>
                <span className="font-mono text-indigo-700 tabular-nums">{count}명 · {sharePct}%</span>
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-gray-500 mt-2">총 응답자 {total}명</p>
    </div>
  );
}

function WordcloudResultBlock({ stage, entries }: { stage: Stage; entries: WordcloudEntry[] }) {
  const config = stage.activityConfig?.wordcloud;
  if (!config) return <p className="text-[11px] text-gray-400 italic">설정 누락</p>;
  const counts = new Map<string, { text: string; count: number }>();
  for (const e of entries) {
    const key = e.text.trim().toLowerCase();
    if (!key) continue;
    const existing = counts.get(key);
    if (existing) existing.count += 1;
    else counts.set(key, { text: e.text.trim(), count: 1 });
  }
  const sorted = Array.from(counts.values()).sort((a, b) => b.count - a.count);
  const max = Math.max(1, ...sorted.map((s) => s.count));
  return (
    <div className="break-inside-avoid">
      <p className="text-[13px] font-semibold text-gray-900 mb-2">{config.prompt}</p>
      {sorted.length === 0 ? (
        <p className="text-[11px] text-gray-400 italic">결과 없음</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-x-3 gap-y-1 items-baseline mb-2 leading-tight">
            {sorted.map((s) => {
              const ratio = s.count / max;
              const sizeRem = (0.875 + (1.875 - 0.875) * ratio).toFixed(2);
              return (
                <span
                  key={s.text}
                  style={{ fontSize: `${sizeRem}rem` }}
                  className="font-bold text-indigo-700"
                >
                  {s.text}
                  {s.count > 1 && <span className="text-[10px] text-gray-400 font-mono"> ×{s.count}</span>}
                </span>
              );
            })}
          </div>
          <p className="text-[10px] text-gray-500">총 응답 {entries.length}개 · 고유 {sorted.length}개</p>
        </>
      )}
    </div>
  );
}

function QnaResultBlock({ stage, questions }: { stage: Stage; questions: QnaQuestion[] }) {
  const config = stage.activityConfig?.qna;
  if (!config) return <p className="text-[11px] text-gray-400 italic">설정 누락</p>;
  const sorted = [...questions].sort((a, b) => {
    const ua = a.upvotes?.length ?? 0;
    const ub = b.upvotes?.length ?? 0;
    if (ub !== ua) return ub - ua;
    return (a.createdAt?.toMillis?.() ?? 0) - (b.createdAt?.toMillis?.() ?? 0);
  });
  return (
    <div>
      <p className="text-[13px] font-semibold text-gray-900 mb-2">{config.prompt}</p>
      {sorted.length === 0 ? (
        <p className="text-[11px] text-gray-400 italic">결과 없음</p>
      ) : (
        <ul className="space-y-2">
          {sorted.map((q) => (
            <li key={q.id} className="break-inside-avoid border border-gray-200 rounded-md p-2.5">
              <div className="flex items-baseline justify-between gap-2 mb-1">
                <p className="text-[13px] text-gray-900 leading-snug flex-1">{q.text}</p>
                <span className="text-[11px] font-bold text-indigo-700 tabular-nums flex-shrink-0">
                  ▲ {q.upvotes?.length ?? 0}
                </span>
              </div>
              <div className="text-[10px] text-gray-500 mb-1">{q.authorName}</div>
              {q.answered && q.answer && (
                <div className="mt-1 px-2 py-1.5 bg-green-50 border border-green-200 rounded">
                  <p className="text-[10px] uppercase font-bold text-green-700 mb-0.5">답변</p>
                  <p className="text-[12px] text-gray-800 whitespace-pre-wrap">{q.answer}</p>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StageReportBlock({
  stage,
  index,
  posts,
  pollResponses,
  wordcloudEntries,
  qnaQuestions,
}: {
  stage: Stage;
  index: number;
  posts: Post[];
  pollResponses: PollResponse[];
  wordcloudEntries: WordcloudEntry[];
  qnaQuestions: QnaQuestion[];
}) {
  const def = stage.activityType ? getActivity(stage.activityType) : null;
  const minutes = Math.round(stage.durationSec / 60);
  return (
    <section className={`mb-6 ${index > 0 ? 'page-break pt-6' : ''}`}>
      <header className="mb-3 pb-2 border-b border-gray-300">
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
            단계 {index + 1}
          </span>
          {def && <span className="text-xs text-gray-500">{def.emoji} {def.label}</span>}
          {minutes > 0 && <span className="text-xs text-gray-400">· {minutes}분</span>}
        </div>
        <h2 className="text-base font-bold text-gray-900 mt-1">{stage.title}</h2>
      </header>
      {def?.kind === 'live' && stage.activityType === 'poll' && (
        <PollResultBlock stage={stage} responses={pollResponses.filter((r) => r.stageId === stage.id)} />
      )}
      {def?.kind === 'live' && stage.activityType === 'wordcloud' && (
        <WordcloudResultBlock stage={stage} entries={wordcloudEntries.filter((e) => e.stageId === stage.id)} />
      )}
      {def?.kind === 'live' && stage.activityType === 'qna' && (
        <QnaResultBlock stage={stage} questions={qnaQuestions.filter((q) => q.stageId === stage.id)} />
      )}
      {def?.kind === 'board' && (
        <PostsForStage
          posts={posts.filter((p) => p.stageId === stage.id)}
          activityType={stage.activityType}
        />
      )}
      {!def && (
        <p className="text-[11px] text-gray-400 italic">활동이 지정되지 않은 단계입니다.</p>
      )}
    </section>
  );
}

function useCollectionAll<T>(path: string | null) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!path) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = onSnapshot(
      collection(db, path),
      (snap) => {
        setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T));
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
  }, [path]);
  return { items, loading };
}

export type BoardExportType = 'board' | 'chat' | 'both' | 'workshop' | 'auto';
export type BoardExportVariant = 'standalone' | 'section';

interface BoardExportContentProps {
  boardId: string;
  type: BoardExportType;
  variant?: BoardExportVariant;
  index?: number;
  total?: number;
  pageBreakBefore?: boolean;
  onReady?: () => void;
}

export function BoardExportContent({
  boardId,
  type,
  variant = 'standalone',
  index,
  total,
  pageBreakBefore = false,
  onReady,
}: BoardExportContentProps) {
  const { board, loading: boardLoading } = useBoard(boardId);
  const { posts, loading: postsLoading } = usePosts(boardId);
  const { messages, loading: msgsLoading } = useMessages(boardId);

  const effectiveType: 'board' | 'chat' | 'both' | 'workshop' = useMemo(() => {
    if (type !== 'auto') return type;
    return board?.mode === 'workshop' ? 'workshop' : 'both';
  }, [type, board?.mode]);

  const isWorkshop = effectiveType === 'workshop';

  const { items: pollResponses, loading: pollLoading } = useCollectionAll<PollResponse>(
    isWorkshop ? pollResponsesPath(boardId) : null,
  );
  const { items: wordcloudEntries, loading: wcLoading } = useCollectionAll<WordcloudEntry>(
    isWorkshop ? wordcloudEntriesPath(boardId) : null,
  );
  const { items: qnaQuestions, loading: qnaLoading } = useCollectionAll<QnaQuestion>(
    isWorkshop ? qnaQuestionsPath(boardId) : null,
  );

  const ready =
    !boardLoading &&
    !postsLoading &&
    !msgsLoading &&
    !!board &&
    (!isWorkshop || (!pollLoading && !wcLoading && !qnaLoading));

  const calledRef = useRef(false);
  useEffect(() => {
    if (ready && !calledRef.current) {
      calledRef.current = true;
      onReady?.();
    }
  }, [ready, onReady]);

  const template = useMemo(() => getTemplate(board?.template ?? 'free'), [board?.template]);
  const sortedStages = useMemo(
    () => [...(board?.stages ?? [])].sort((a, b) => a.order - b.order),
    [board?.stages],
  );

  if (!ready || !board) {
    if (variant === 'standalone') {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-gray-400 text-sm">불러오는 중...</p>
        </div>
      );
    }
    return (
      <section className={pageBreakBefore ? 'page-break pt-6' : ''}>
        <p className="text-[11px] text-gray-400 italic">불러오는 중...</p>
      </section>
    );
  }

  const showBoard = effectiveType === 'board' || effectiveType === 'both';
  const showChat =
    effectiveType === 'chat' || effectiveType === 'both' || effectiveType === 'workshop';
  const isFree = template.columns === null;
  const isSection = variant === 'section';

  return (
    <div className={pageBreakBefore ? 'page-break pt-6' : ''}>
      {isSection ? (
        <header className="mb-5 pb-3 border-b-2 border-indigo-200">
          {index != null && total != null && (
            <p className="text-[10px] uppercase tracking-widest font-bold text-indigo-600 mb-1">
              보드 {index + 1} / {total}
            </p>
          )}
          <div className="flex items-baseline justify-between gap-2 mb-1">
            <h2 className="text-lg font-bold text-gray-900 truncate">{board.title}</h2>
            <span className="text-xs text-gray-400 font-mono flex-shrink-0">{board.boardCode}</span>
          </div>
          <p className="text-xs text-gray-500">
            {isWorkshop
              ? `🎬 워크숍 리포트 · 단계 ${sortedStages.length}개`
              : `${template.emoji} ${template.label}`}
            {' · '}포스트 {posts.length}개 · 메시지 {messages.length}개
          </p>
        </header>
      ) : (
        <header className="mb-6 pb-4 border-b border-gray-200">
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-indigo-600 font-bold">Fadlet</span>
            <span className="text-xs text-gray-400 font-mono">{board.boardCode}</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-1">{board.title}</h1>
          <p className="text-xs text-gray-500">
            {isWorkshop
              ? `🎬 워크숍 리포트 · 단계 ${sortedStages.length}개 · 출력일: ${formatDate(new Date())}`
              : `${template.emoji} ${template.label} · 출력일: ${formatDate(new Date())}`}
          </p>
        </header>
      )}

      {isWorkshop && (
        <>
          {sortedStages.length === 0 ? (
            <p className="text-xs text-gray-400 mb-6">단계가 없는 워크숍입니다.</p>
          ) : (
            sortedStages.map((stage, idx) => (
              <StageReportBlock
                key={stage.id}
                stage={stage}
                index={idx}
                posts={posts}
                pollResponses={pollResponses}
                wordcloudEntries={wordcloudEntries}
                qnaQuestions={qnaQuestions}
              />
            ))
          )}
        </>
      )}

      {!isWorkshop && showBoard && (
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
        <section className={(showBoard || isWorkshop) && messages.length > 0 ? 'page-break pt-6' : ''}>
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
    </div>
  );
}
