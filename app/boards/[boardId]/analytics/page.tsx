'use client';

import Link from 'next/link';
import { use, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MessageSquare, StickyNote, Users, Clock } from 'lucide-react';
import { useBoard } from '@/lib/hooks/use-board';
import { useMessages } from '@/lib/hooks/use-messages';
import { useOperatorAuth } from '@/lib/hooks/use-operator-auth';
import { useParticipants } from '@/lib/hooks/use-participants';
import { usePosts } from '@/lib/hooks/use-posts';
import { getTemplate, isColumnEditableTemplate } from '@/lib/templates';
import type { Message, Post } from '@/lib/types';

interface PageProps {
  params: Promise<{ boardId: string }>;
}

interface CounterCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  hint?: string;
}

function CounterCard({ icon, label, value, hint }: CounterCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-500 font-medium">{label}</span>
        <span className="text-indigo-600">{icon}</span>
      </div>
      <span className="text-2xl font-bold text-gray-900 tabular-nums">{value.toLocaleString('ko-KR')}</span>
      {hint && <span className="text-[11px] text-gray-400 mt-1">{hint}</span>}
    </div>
  );
}

interface BarRowProps {
  label: string;
  count: number;
  max: number;
  highlight?: boolean;
}

function BarRow({ label, count, max, highlight }: BarRowProps) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-700 font-medium w-24 truncate flex-shrink-0">{label}</span>
      <div className="flex-1 h-5 bg-gray-100 rounded relative overflow-hidden">
        <div
          className={`h-full ${highlight ? 'bg-indigo-600' : 'bg-indigo-400'}`}
          style={{ width: `${pct}%` }}
        />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-gray-700 tabular-nums">
          {count}
        </span>
      </div>
    </div>
  );
}

function topByAuthor<T extends { authorId: string; authorName: string }>(items: T[], n: number) {
  const map = new Map<string, { name: string; count: number }>();
  for (const item of items) {
    const cur = map.get(item.authorId);
    if (cur) cur.count += 1;
    else map.set(item.authorId, { name: item.authorName, count: 1 });
  }
  return [...map.values()].sort((a, b) => b.count - a.count).slice(0, n);
}

function hourBuckets(items: Array<Post | Message>) {
  const buckets = new Array(24).fill(0) as number[];
  for (const item of items) {
    const d = item.createdAt?.toDate?.();
    if (!d) continue;
    buckets[d.getHours()] += 1;
  }
  return buckets;
}

export default function AnalyticsPage({ params }: PageProps) {
  const { boardId } = use(params);
  const router = useRouter();
  const { user, isOperator, loading: authLoading } = useOperatorAuth();
  const { board, loading: boardLoading } = useBoard(boardId);
  const { posts, loading: postsLoading } = usePosts(boardId);
  const { messages, loading: msgsLoading } = useMessages(boardId);
  const { participants } = useParticipants(boardId, { subscribe: true });

  const isAuthorized = !!user && !!board && board.ownerId === user.uid;

  useEffect(() => {
    if (!authLoading && !isOperator) router.replace('/login');
  }, [authLoading, isOperator, router]);

  const template = useMemo(() => getTemplate(board?.template ?? 'free'), [board?.template]);

  // 카테고리·칸반은 운영자가 컬럼을 직접 정의(board.kanbanColumns)하므로 템플릿 기본 컬럼 대신 그걸 사용한다.
  // (기본 템플릿 컬럼만 쓰면 추가한 카테고리가 분석에서 누락된다)
  const effectiveColumns = useMemo(() => {
    if (
      board &&
      isColumnEditableTemplate(board.template) &&
      board.kanbanColumns &&
      board.kanbanColumns.length > 0
    ) {
      return board.kanbanColumns.map((c) => ({ id: c.id, label: c.label }));
    }
    return (template.columns ?? []).map((c) => ({ id: c.id, label: c.label }));
  }, [board, template.columns]);

  const stats = useMemo(() => {
    const onlineCount = participants.filter((p) => p.isOnline).length;
    const totalParticipants = participants.length;

    const totalPosts = posts.length;
    const totalMessages = messages.length;
    const hostMessages = messages.filter((m) => m.role === 'host').length;
    const memberMessages = totalMessages - hostMessages;

    const avgPostLen = totalPosts > 0
      ? Math.round(posts.reduce((s, p) => s + (p.content?.length ?? 0), 0) / totalPosts)
      : 0;

    const topPostAuthors = topByAuthor(posts, 5);
    const topMsgAuthors = topByAuthor(messages, 5);

    const postsByColumn = effectiveColumns.map((c) => ({
      label: c.label,
      count: posts.filter((p) => p.columnId === c.id).length,
    }));

    const postHours = hourBuckets(posts);
    const msgHours = hourBuckets(messages);
    const totalCombined = postHours.map((p, i) => p + msgHours[i]);

    return {
      onlineCount,
      totalParticipants,
      totalPosts,
      totalMessages,
      hostMessages,
      memberMessages,
      avgPostLen,
      topPostAuthors,
      topMsgAuthors,
      postsByColumn,
      postHours,
      msgHours,
      totalCombined,
    };
  }, [participants, posts, messages, effectiveColumns]);

  if (authLoading || boardLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-400">로딩 중...</p>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <p className="text-gray-700 font-semibold mb-1">접근 권한이 없습니다</p>
        <p className="text-sm text-gray-500 mb-4">이 보드의 퍼실리테이터만 분석을 볼 수 있습니다.</p>
        <Link href="/dashboard" className="text-sm text-indigo-600 hover:underline">내 워크스페이스로</Link>
      </div>
    );
  }

  const dataLoading = postsLoading || msgsLoading;
  const maxHourCombined = Math.max(1, ...stats.totalCombined);
  const maxColCount = Math.max(1, ...stats.postsByColumn.map((c) => c.count));
  const maxAuthorPost = Math.max(1, ...stats.topPostAuthors.map((a) => a.count));
  const maxAuthorMsg = Math.max(1, ...stats.topMsgAuthors.map((a) => a.count));

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/" className="relative text-indigo-600 font-bold text-base hover:text-indigo-700 transition-colors flex-shrink-0">
            Fadlet
            <span className="absolute -top-1 -right-4 text-[10px] font-semibold text-indigo-400 leading-none">beta</span>
          </Link>
          <span className="text-gray-300">|</span>
          <Link href={`/boards/${boardId}`} className="text-indigo-600 hover:underline flex items-center gap-1 text-xs flex-shrink-0">
            <ArrowLeft size={12} /> 보드로
          </Link>
          <span className="text-gray-300 hidden sm:inline">|</span>
          <h1 className="text-sm font-semibold text-gray-900 truncate hidden sm:inline">{board?.title}</h1>
          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full hidden md:inline">
            {template.emoji} {template.label}
          </span>
        </div>
        <span className="text-xs text-gray-400">📊 분석</span>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-6 space-y-6">
        {dataLoading && <p className="text-xs text-gray-400 text-center py-2">데이터 집계 중...</p>}

        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <CounterCard
            icon={<Users size={14} />}
            label="누적 참여자"
            value={stats.totalParticipants}
            hint={`현재 온라인 ${stats.onlineCount}명`}
          />
          <CounterCard
            icon={<StickyNote size={14} />}
            label="포스트"
            value={stats.totalPosts}
            hint={stats.avgPostLen > 0 ? `평균 ${stats.avgPostLen}자` : undefined}
          />
          <CounterCard
            icon={<MessageSquare size={14} />}
            label="메시지"
            value={stats.totalMessages}
            hint={`퍼실리테이터 ${stats.hostMessages} · 참여자 ${stats.memberMessages}`}
          />
          <CounterCard
            icon={<Clock size={14} />}
            label="활동 정점"
            value={(() => {
              const peak = stats.totalCombined.reduce((iMax, v, i, arr) => v > arr[iMax] ? i : iMax, 0);
              return stats.totalCombined[peak] > 0 ? peak : 0;
            })()}
            hint="시 (가장 활동량 많은 시간)"
          />
        </section>

        {effectiveColumns.length > 0 && (
          <section className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-3">
              {board && board.template === 'categories' ? '카테고리별 포스트 분포' : '컬럼별 포스트 분포'}
            </h3>
            <div className="space-y-2">
              {stats.postsByColumn.map((c) => (
                <BarRow key={c.label} label={c.label} count={c.count} max={maxColCount} />
              ))}
            </div>
          </section>
        )}

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-3">상위 포스트 작성자</h3>
            {stats.topPostAuthors.length === 0 ? (
              <p className="text-xs text-gray-400">데이터 없음</p>
            ) : (
              <div className="space-y-2">
                {stats.topPostAuthors.map((a, i) => (
                  <BarRow key={`${a.name}-${i}`} label={a.name} count={a.count} max={maxAuthorPost} highlight={i === 0} />
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-3">상위 채팅 발화자</h3>
            {stats.topMsgAuthors.length === 0 ? (
              <p className="text-xs text-gray-400">데이터 없음</p>
            ) : (
              <div className="space-y-2">
                {stats.topMsgAuthors.map((a, i) => (
                  <BarRow key={`${a.name}-${i}`} label={a.name} count={a.count} max={maxAuthorMsg} highlight={i === 0} />
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-3">시간대별 활동 (포스트 + 메시지)</h3>
          <div className="grid grid-cols-12 sm:grid-cols-24 gap-0.5 items-end h-32">
            {stats.totalCombined.map((v, i) => {
              const h = maxHourCombined > 0 ? (v / maxHourCombined) * 100 : 0;
              return (
                <div key={i} className="flex flex-col items-center gap-0.5 h-full" title={`${i}시: ${v}건`}>
                  <div className="flex-1 w-full flex items-end">
                    <div
                      className="w-full rounded-sm bg-indigo-500"
                      style={{ height: `${h}%`, minHeight: v > 0 ? '2px' : 0 }}
                    />
                  </div>
                  <span className="text-[9px] text-gray-400">{i}</span>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
