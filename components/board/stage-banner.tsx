'use client';

import { Pause, Play, Square, SkipForward } from 'lucide-react';
import { useTickingElapsed } from '@/lib/hooks/use-timer';
import type { Stage, TimerState } from '@/lib/types';

interface StageBannerProps {
  stages: Stage[];
  timer: TimerState;
  isHost: boolean;
  onStart: (stageId: string) => Promise<void>;
  onPause: () => Promise<void>;
  onResume: () => Promise<void>;
  onStop: () => Promise<void>;
  onSelect: (stageId: string) => Promise<void>;
}

function formatTime(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function StageBanner({ stages, timer, isHost, onStart, onPause, onResume, onStop, onSelect }: StageBannerProps) {
  const elapsed = useTickingElapsed(timer);
  const sorted = [...stages].sort((a, b) => a.order - b.order);
  const currentStage = sorted.find((s) => s.id === timer.stageId) ?? sorted[0] ?? null;
  if (!currentStage) return null;

  const totalMs = currentStage.durationSec * 1000;
  const remainingMs = totalMs > 0 ? Math.max(0, totalMs - elapsed) : 0;
  const overdue = totalMs > 0 && elapsed > totalMs;
  const progressPct = totalMs > 0 ? Math.min(100, (elapsed / totalMs) * 100) : 0;

  const idx = sorted.findIndex((s) => s.id === currentStage.id);
  const nextStage = sorted[idx + 1] ?? null;

  const status = timer.status;
  const showTimer = status !== 'idle';

  return (
    <div className={`relative border-b border-gray-100 ${overdue ? 'bg-red-50' : 'bg-indigo-50'}`}>
      <div className="flex items-center justify-between gap-3 px-4 py-2">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <span className="text-xs font-semibold text-indigo-700 bg-white border border-indigo-200 px-2 py-0.5 rounded-full flex-shrink-0">
            {idx + 1}/{sorted.length}
          </span>
          <span className="font-semibold text-sm text-gray-900 truncate">{currentStage.title}</span>
          {currentStage.durationSec > 0 && (
            <span className={`font-mono text-sm font-bold tabular-nums flex-shrink-0 ${overdue ? 'text-red-600' : 'text-indigo-700'}`}>
              {showTimer
                ? totalMs > 0
                  ? overdue
                    ? `+${formatTime(elapsed - totalMs)}`
                    : formatTime(remainingMs)
                  : formatTime(elapsed)
                : `${Math.floor(currentStage.durationSec / 60)}분`}
            </span>
          )}
          {status === 'paused' && (
            <span className="text-[10px] uppercase font-bold text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded flex-shrink-0">
              일시정지
            </span>
          )}
        </div>

        {isHost && (
          <div className="flex items-center gap-1 flex-shrink-0">
            {status === 'idle' && (
              <button
                onClick={() => onStart(currentStage.id)}
                className="flex items-center gap-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-2 py-1 rounded-md focus-visible:outline focus-visible:outline-2"
                aria-label="시작"
              >
                <Play size={12} /> 시작
              </button>
            )}
            {status === 'running' && (
              <button
                onClick={onPause}
                className="flex items-center gap-1 text-xs font-semibold text-orange-700 bg-orange-100 hover:bg-orange-200 px-2 py-1 rounded-md focus-visible:outline focus-visible:outline-2"
                aria-label="일시정지"
              >
                <Pause size={12} /> 정지
              </button>
            )}
            {status === 'paused' && (
              <button
                onClick={onResume}
                className="flex items-center gap-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-2 py-1 rounded-md focus-visible:outline focus-visible:outline-2"
                aria-label="재개"
              >
                <Play size={12} /> 재개
              </button>
            )}
            {status !== 'idle' && (
              <button
                onClick={onStop}
                className="flex items-center gap-1 text-xs text-gray-600 hover:bg-gray-100 px-1.5 py-1 rounded-md focus-visible:outline focus-visible:outline-2"
                aria-label="중지"
              >
                <Square size={12} />
              </button>
            )}
            {nextStage && (
              <button
                onClick={() => onSelect(nextStage.id)}
                className="flex items-center gap-1 text-xs text-indigo-700 hover:bg-indigo-100 px-2 py-1 rounded-md focus-visible:outline focus-visible:outline-2"
                aria-label={`다음 단계: ${nextStage.title}`}
                title={nextStage.title}
              >
                <SkipForward size={12} /> 다음
              </button>
            )}
          </div>
        )}
      </div>

      {showTimer && totalMs > 0 && (
        <div className="absolute left-0 bottom-0 right-0 h-0.5 bg-indigo-100">
          <div
            className={`h-full transition-all ${overdue ? 'bg-red-500' : 'bg-indigo-500'}`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      )}
    </div>
  );
}
