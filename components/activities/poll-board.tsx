'use client';

import { Check } from 'lucide-react';
import { useMemo } from 'react';
import { LiveActivityShell } from './live-activity-shell';
import { useActivityState } from '@/lib/hooks/use-activity-state';
import { usePoll } from '@/lib/hooks/use-poll';
import type { PollConfig } from '@/lib/types';

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
      if (r.optionIndexes.length > 0) totalRespondents += 1;
      for (const idx of r.optionIndexes) {
        if (idx >= 0 && idx < counts.length) counts[idx] += 1;
      }
    }
    return { counts, totalRespondents };
  }, [responses, config.options]);

  const maxCount = Math.max(1, ...tally.counts);

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
            const pct = showResults ? Math.round((count / maxCount) * 100) : 0;
            const sharePct = showResults && tally.totalRespondents > 0
              ? Math.round((count / tally.totalRespondents) * 100)
              : 0;
            const isChosen = myChosen.has(idx);
            const disabled = state.closed && !isHost;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleClick(idx)}
                disabled={disabled}
                aria-pressed={isChosen}
                className={`relative overflow-hidden text-left rounded-md border-2 transition-all px-4 py-3 ${
                  isChosen
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 bg-white hover:border-indigo-300'
                } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {showResults && (
                  <div
                    className={`absolute inset-y-0 left-0 ${isChosen ? 'bg-indigo-100/70' : 'bg-gray-100/70'} transition-all`}
                    style={{ width: `${pct}%` }}
                    aria-hidden
                  />
                )}
                <div className="relative flex items-center gap-2">
                  <span
                    className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isChosen ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-300 bg-white'
                    }`}
                    aria-hidden
                  >
                    {isChosen && <Check size={12} strokeWidth={3} />}
                  </span>
                  <span className="flex-1 text-sm font-semibold text-gray-900">{option}</span>
                  {showResults && (
                    <span className="text-xs font-mono font-bold text-indigo-700 tabular-nums flex-shrink-0">
                      {count}명 · {sharePct}%
                    </span>
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
                <span className="ml-2 text-gray-400">· 결과는 운영자가 공개합니다</span>
              )}
            </p>
            {showResults && (
              <p className="text-xs font-semibold text-gray-700">
                응답 {tally.totalRespondents}명
              </p>
            )}
          </div>
        </div>
      )}
    </LiveActivityShell>
  );
}
