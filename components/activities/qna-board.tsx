'use client';

import { useMemo, useState } from 'react';
import { ArrowUp, RotateCcw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { LiveActivityShell } from './live-activity-shell';
import { useActivityState } from '@/lib/hooks/use-activity-state';
import { useQna } from '@/lib/hooks/use-qna';
import type { QnaConfig, QnaQuestion } from '@/lib/types';

interface QnaBoardProps {
  boardId: string;
  stageId: string;
  stageTitle: string;
  config: QnaConfig;
  currentUid: string;
  currentName: string;
  isHost: boolean;
}

type Filter = 'open' | 'answered' | 'all';

export function QnaBoard({
  boardId,
  stageId,
  stageTitle,
  config,
  currentUid,
  currentName,
  isHost,
}: QnaBoardProps) {
  const { questions, loading, addQuestion, toggleUpvote, setAnswer, reopenQuestion, deleteQuestion } = useQna(boardId, stageId);
  const { state, setResultsVisible, setClosed } = useActivityState(boardId, stageId);

  const [draft, setDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState<Filter>('open');
  const [answeringId, setAnsweringId] = useState<string | null>(null);
  const [answerDraft, setAnswerDraft] = useState('');

  const canSubmit = !state.closed || isHost;

  const filtered = useMemo(() => {
    const base = filter === 'open'
      ? questions.filter((q) => !q.answered)
      : filter === 'answered'
        ? questions.filter((q) => q.answered)
        : questions;
    return [...base].sort((a, b) => {
      const ua = a.upvotes?.length ?? 0;
      const ub = b.upvotes?.length ?? 0;
      if (ub !== ua) return ub - ua;
      const ta = a.createdAt?.toMillis?.() ?? 0;
      const tb = b.createdAt?.toMillis?.() ?? 0;
      return ta - tb;
    });
  }, [questions, filter]);

  const openCount = questions.filter((q) => !q.answered).length;
  const answeredCount = questions.length - openCount;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim() || submitting || !canSubmit) return;
    setSubmitting(true);
    try {
      await addQuestion(currentUid, currentName || '익명', draft);
      setDraft('');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAnswerSave(q: QnaQuestion) {
    if (!answerDraft.trim()) return;
    await setAnswer(q.id, answerDraft, currentUid);
    setAnsweringId(null);
    setAnswerDraft('');
  }

  return (
    <LiveActivityShell
      emoji="❓"
      title={`라이브 Q&A · ${stageTitle}`}
      prompt={config.prompt}
      isHost={isHost}
      resultsVisible={state.resultsVisible}
      closed={state.closed}
      onToggleResultsVisible={isHost ? setResultsVisible : undefined}
      onToggleClosed={isHost ? setClosed : undefined}
    >
      {loading ? (
        <p className="text-sm text-gray-400 text-center py-8">불러오는 중...</p>
      ) : (
        <div className="flex flex-col gap-5">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={canSubmit ? '질문을 입력하세요' : '응답이 마감되었습니다'}
              maxLength={300}
              disabled={!canSubmit || submitting}
              className="text-sm"
            />
            <Button
              type="submit"
              disabled={!canSubmit || submitting || !draft.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex-shrink-0"
            >
              질문하기
            </Button>
          </form>

          <div className="flex items-center gap-1 text-xs">
            <FilterChip active={filter === 'open'} onClick={() => setFilter('open')}>
              미답변 {openCount}
            </FilterChip>
            <FilterChip active={filter === 'answered'} onClick={() => setFilter('answered')}>
              답변됨 {answeredCount}
            </FilterChip>
            <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>
              전체 {questions.length}
            </FilterChip>
          </div>

          {filtered.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-10 border-t border-gray-100">
              {filter === 'open' && '아직 질문이 없습니다. 첫 질문을 남겨보세요.'}
              {filter === 'answered' && '아직 답변된 질문이 없습니다.'}
              {filter === 'all' && '질문이 없습니다.'}
            </p>
          ) : (
            <ul className="flex flex-col gap-2 border-t border-gray-100 pt-4">
              {filtered.map((q) => {
                const myUpvote = (q.upvotes ?? []).includes(currentUid);
                const upvotes = q.upvotes?.length ?? 0;
                const canDelete = q.authorId === currentUid || isHost;
                const isAnswering = answeringId === q.id;
                return (
                  <li
                    key={q.id}
                    className={`flex gap-3 p-3 rounded-md border ${
                      q.answered
                        ? 'border-green-200 bg-green-50/40'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleUpvote(q.id, currentUid, myUpvote)}
                      aria-pressed={myUpvote}
                      aria-label={myUpvote ? '좋아요 취소' : '좋아요'}
                      className={`flex-shrink-0 flex flex-col items-center justify-center w-12 h-14 rounded-md border-2 transition-colors ${
                        myUpvote
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 bg-white text-gray-500 hover:border-indigo-300'
                      }`}
                    >
                      <ArrowUp size={14} strokeWidth={2.5} />
                      <span className="text-sm font-bold tabular-nums">{upvotes}</span>
                    </button>

                    <div className="flex-1 min-w-0 flex flex-col gap-1">
                      <p className={`text-sm leading-relaxed break-words ${q.answered ? 'text-gray-700' : 'text-gray-900'}`}>
                        {q.text}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-gray-400">
                        <span>{q.authorName}</span>
                        {q.answered && (
                          <span className="text-green-700 font-semibold">✓ 답변됨</span>
                        )}
                      </div>

                      {q.answered && q.answer && (
                        <div className="mt-2 px-3 py-2 rounded-md bg-white border border-green-200">
                          <p className="text-[10px] uppercase font-bold text-green-700 mb-1">운영자 답변</p>
                          <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">{q.answer}</p>
                        </div>
                      )}

                      {isHost && isAnswering && (
                        <div className="mt-2 flex flex-col gap-2">
                          <Textarea
                            value={answerDraft}
                            onChange={(e) => setAnswerDraft(e.target.value)}
                            rows={3}
                            placeholder="답변을 입력하세요"
                            className="text-sm"
                            autoFocus
                          />
                          <div className="flex gap-2 justify-end">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => { setAnsweringId(null); setAnswerDraft(''); }}
                            >
                              취소
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => handleAnswerSave(q)}
                              disabled={!answerDraft.trim()}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white"
                            >
                              답변 등록
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    {(isHost || canDelete) && !isAnswering && (
                      <div className="flex flex-col gap-1 flex-shrink-0">
                        {isHost && !q.answered && (
                          <button
                            type="button"
                            onClick={() => { setAnsweringId(q.id); setAnswerDraft(q.answer ?? ''); }}
                            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold px-2 py-1 rounded"
                          >
                            답변
                          </button>
                        )}
                        {isHost && q.answered && (
                          <button
                            type="button"
                            onClick={() => reopenQuestion(q.id)}
                            className="text-xs text-gray-500 hover:text-gray-800 px-2 py-1 rounded inline-flex items-center gap-1"
                          >
                            <RotateCcw size={11} /> 재오픈
                          </button>
                        )}
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => deleteQuestion(q.id)}
                            aria-label="질문 삭제"
                            className="text-gray-300 hover:text-red-500 p-1 rounded"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          <div className="flex items-center justify-between pt-1 text-xs text-gray-500">
            <span>
              총 {questions.length}개의 질문
              {state.closed && <span className="ml-2 text-red-600 font-semibold">· 마감됨</span>}
            </span>
            <span className="text-gray-400">좋아요 많은 순으로 정렬</span>
          </div>
        </div>
      )}
    </LiveActivityShell>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2.5 py-1 rounded-full font-semibold transition-colors ${
        active
          ? 'bg-indigo-600 text-white'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {children}
    </button>
  );
}
