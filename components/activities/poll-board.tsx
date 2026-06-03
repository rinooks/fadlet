'use client';

import { Check, Crown } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { LiveActivityShell } from './live-activity-shell';
import { useActivityState } from '@/lib/hooks/use-activity-state';
import { usePoll } from '@/lib/hooks/use-poll';
import type { PollConfig } from '@/lib/types';

function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const [displayed, setDisplayed] = useState(value);
  const prevRef = useRef(value);

  useEffect(() => {
    const start = prevRef.current;
    const target = value;
    if (start === target) return;
    const startTime = performance.now();
    const duration = 600;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - startTime) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplayed(Math.round(start + (target - start) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
      else prevRef.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return <span className={className}>{displayed}</span>;
}

interface PollBoardProps {
  boardId: string;
  stageId: string;
  stageTitle: string;
  config: PollConfig;
  currentUid: string;
  isHost: boolean;
}

export function PollBoard({
  boardId,
  stageId,
  stageTitle,
  config,
  currentUid,
  isHost,
}: PollBoardProps) {
  const { responses, loading, submitResponse } = usePoll(boardId, stageId);
  const { state, setResultsVisible, setClosed } = useActivityState(boardId, stageId);

  const myResponse = responses.find((r) => r.userId === currentUid);
  const myChosen = new Set(myResponse?.optionIndexes ?? []);
  const showResults = isHost || state.resultsVisible || state.closed;
  const allowMultiple = config.allowMultiple === true;

  const tally = useMemo(() => {
    const counts = config.options.map(() => 0);
    let totalRespondents = 0;
    for (const r of responses) {
      const idxs = Array.isArray(r.optionIndexes) ? r.optionIndexes : [];
      if (idxs.length > 0) totalRespondents += 1;
      for (const idx of idxs) {
        if (idx >= 0 && idx < counts.length) counts[idx] += 1;
      }
    }
    return { counts, totalRespondents };
  }, [responses, config.options]);

  const maxCount = Math.max(1, ...tally.counts);
  const topCount = Math.max(0, ...tally.counts);

  async function handleClick(idx: number) {
    if (state.closed && !isHost) return;
    let next: number[];
    if (allowMultiple) {
      const set = new Set(myChosen);
      if (set.has(idx)) set.delete(idx);
      else set.add(idx);
      next = Array.from(set).sort((a, b) => a - b);
    } else {
      next = myChosen.has(idx) ? [] : [idx];
    }
    await submitResponse(currentUid, next);
  }

  return (
    <LiveActivityShell
      emoji="📊"
      title={`라이브 폴 · ${stageTitle}`}
      prompt={config.question}
      isHost={isHost}
      resultsVisible={state.resultsVisible}
      closed={state.closed}
      onToggleResultsVisible={isHost ? setResultsVisible : undefined}
      onToggleClosed={isHost ? setClosed : undefined}
    >
      {loading ? (
        <p className="text-sm text-gray-400 text-center py-8">불러오는 중...</p>
      ) : (
        <div className="flex flex-col gap-2">
          {config.options.map((option, idx) => {
            const count = tally.counts[idx] ?? 0;
            const pct = showResults ? (count / maxCount) * 100 : 0;
            const sharePct = showResults && tally.totalRespondents > 0
              ? Math.round((count / tally.totalRespondents) * 100)
              : 0;
            const isChosen = myChosen.has(idx);
            const isLeader = showResults && topCount > 0 && count === topCount;
            const disabled = state.closed && !isHost;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleClick(idx)}
                disabled={disabled}
                aria-pressed={isChosen}
                className={`relative overflow-hidden text-left rounded-lg border-2 transition-all px-4 ${
                  showResults ? 'py-4' : 'py-3'
                } ${
                  isChosen
                    ? 'border-indigo-600 shadow-sm'
                    : isLeader
                      ? 'border-amber-300'
                      : 'border-gray-200 hover:border-indigo-300'
                } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'} bg-white`}
              >
                {showResults && (
                  <div
                    className={`absolute inset-y-0 left-0 ${
                      isChosen
                        ? 'bg-gradient-to-r from-indigo-300 via-indigo-400 to-indigo-500'
                        : isLeader
                          ? 'bg-gradient-to-r from-amber-100 via-amber-200 to-amber-300'
                          : 'bg-gradient-to-r from-indigo-50 via-indigo-100 to-indigo-200'
                    }`}
                    style={{
                      width: `${pct}%`,
                      transition: 'width 700ms cubic-bezier(0.22, 1, 0.36, 1)',
                    }}
                    aria-hidden
                  />
                )}
                <div className="relative flex items-center gap-3">
                  <span
                    className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isChosen ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-300 bg-white'
                    }`}
                    aria-hidden
                  >
                    {isChosen && <Check size={12} strokeWidth={3} />}
                  </span>
                  <span className="flex-1 text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                    {option}
                    {isLeader && (
                      <Crown size={14} className="text-amber-500 fill-amber-400" aria-label="1위" />
                    )}
                  </span>
                  {showResults && (
                    <div className="flex items-baseline gap-1.5 flex-shrink-0">
                      <AnimatedNumber
                        value={count}
                        className={`text-xl font-extrabold tabular-nums ${
                          isLeader ? 'text-amber-700' : 'text-indigo-700'
                        }`}
                      />
                      <span className="text-[10px] font-semibold text-gray-500">명</span>
                      <span className={`ml-1 text-xs font-mono font-bold tabular-nums ${
                        isLeader ? 'text-amber-600' : 'text-indigo-600'
                      }`}>
                        {sharePct}%
                      </span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}

          <div className="flex items-center justify-between pt-3 mt-1 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              {allowMultiple ? '여러 개 선택 가능' : '한 개만 선택'}
              {state.closed && <span className="ml-2 text-red-600 font-semibold">· 마감됨</span>}
              {!showResults && !isHost && (
                <span className="ml-2 text-gray-400">· 결과는 퍼실리테이터가 공개합니다</span>
              )}
            </p>
            {showResults && (
              <div className="flex items-baseline gap-1">
                <span className="text-xs text-gray-500">총 응답</span>
                <AnimatedNumber
                  value={tally.totalRespondents}
                  className="text-base font-extrabold text-indigo-700 tabular-nums"
                />
                <span className="text-xs text-gray-500">명</span>
              </div>
            )}
          </div>
        </div>
      )}
    </LiveActivityShell>
  );
}
