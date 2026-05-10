'use client';

import { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LiveActivityShell } from './live-activity-shell';
import { useActivityState } from '@/lib/hooks/use-activity-state';
import { useWordcloud } from '@/lib/hooks/use-wordcloud';
import type { WordcloudConfig } from '@/lib/types';

interface WordcloudBoardProps {
  boardId: string;
  stageId: string;
  stageTitle: string;
  config: WordcloudConfig;
  currentUid: string;
  isHost: boolean;
}

const MIN_FONT_REM = 0.85;
const MAX_FONT_REM = 3.6;

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  }
  return h >>> 0;
}

export function WordcloudBoard({
  boardId,
  stageId,
  stageTitle,
  config,
  currentUid,
  isHost,
}: WordcloudBoardProps) {
  const { entries, loading, addEntry, removeEntry } = useWordcloud(boardId, stageId);
  const { state, setResultsVisible, setClosed } = useActivityState(boardId, stageId);

  const [draft, setDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const maxLength = config.maxLength ?? 20;
  const showCloud = isHost || state.resultsVisible || state.closed;
  const canSubmit = !state.closed || isHost;

  const aggregated = useMemo(() => {
    const counts = new Map<string, { text: string; count: number; ids: { id: string; userId: string }[] }>();
    for (const e of entries) {
      const key = e.text.trim().toLowerCase();
      if (!key) continue;
      const existing = counts.get(key);
      if (existing) {
        existing.count += 1;
        existing.ids.push({ id: e.id, userId: e.userId });
      } else {
        counts.set(key, { text: e.text.trim(), count: 1, ids: [{ id: e.id, userId: e.userId }] });
      }
    }
    return Array.from(counts.values()).sort((a, b) => b.count - a.count);
  }, [entries]);

  const myEntries = entries.filter((e) => e.userId === currentUid);
  const maxCount = Math.max(1, ...aggregated.map((a) => a.count));

  const positionedWords = useMemo(() => {
    if (aggregated.length === 0) return [];

    const ringSlotCount = (r: number) => 6 + r * 4;
    const ringRadius = (r: number) => 22 + r * 13;

    let ringIdx = 0;
    let slotInRing = 0;

    return aggregated.map((a, idx) => {
      if (idx === 0) {
        return { ...a, x: 50, y: 50, rotation: 0 };
      }

      if (slotInRing >= ringSlotCount(ringIdx)) {
        ringIdx += 1;
        slotInRing = 0;
      }

      const slots = ringSlotCount(ringIdx);
      const baseAngle = (slotInRing / slots) * Math.PI * 2;
      const h = hashString(a.text);
      const angleJitter = ((h & 0x3ff) / 0x3ff - 0.5) * (Math.PI / slots) * 1.2;
      const radiusJitter = (((h >> 10) & 0x3ff) / 0x3ff - 0.5) * 8;
      const rotationDeg = (((h >> 20) & 0x3ff) / 0x3ff - 0.5) * 22;

      const angle = baseAngle + angleJitter + (ringIdx % 2 === 0 ? 0 : Math.PI / slots);
      const radius = ringRadius(ringIdx) + radiusJitter;

      const x = 50 + radius * Math.cos(angle) * 0.95;
      const y = 50 + radius * Math.sin(angle) * 0.78;

      slotInRing += 1;

      return { ...a, x, y, rotation: rotationDeg };
    });
  }, [aggregated]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || submitting || !canSubmit) return;
    setSubmitting(true);
    try {
      await addEntry(currentUid, text);
      setDraft('');
    } finally {
      setSubmitting(false);
    }
  }

  function fontSize(count: number): string {
    const ratio = count / maxCount;
    const rem = MIN_FONT_REM + (MAX_FONT_REM - MIN_FONT_REM) * ratio;
    return `${rem.toFixed(2)}rem`;
  }

  function colorClass(count: number): string {
    const ratio = count / maxCount;
    if (ratio >= 0.8) return 'text-indigo-700';
    if (ratio >= 0.5) return 'text-indigo-600';
    if (ratio >= 0.3) return 'text-indigo-500';
    return 'text-gray-600';
  }

  return (
    <LiveActivityShell
      emoji="☁️"
      title={`워드클라우드 · ${stageTitle}`}
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
              placeholder={canSubmit ? `한 단어/짧은 구문 (최대 ${maxLength}자)` : '응답이 마감되었습니다'}
              maxLength={maxLength}
              disabled={!canSubmit || submitting}
              className="text-sm"
            />
            <Button
              type="submit"
              disabled={!canSubmit || submitting || !draft.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex-shrink-0"
            >
              전송
            </Button>
          </form>

          {myEntries.length > 0 && (
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-[11px] uppercase font-bold text-gray-400 tracking-wider mr-1">
                내 응답
              </span>
              {myEntries.map((e) => (
                <span
                  key={e.id}
                  className="inline-flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full pl-2.5 pr-1 py-0.5"
                >
                  {e.text}
                  <button
                    type="button"
                    onClick={() => removeEntry(e.id)}
                    aria-label="삭제"
                    className="text-indigo-400 hover:text-indigo-700 p-0.5 rounded-full"
                  >
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="border-t border-gray-100 pt-5">
            {!showCloud ? (
              <p className="text-xs text-gray-400 text-center py-10">
                결과는 퍼실리테이터가 공개합니다.
              </p>
            ) : aggregated.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-10">
                아직 응답이 없습니다.
              </p>
            ) : (
              <div
                className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-50/40 via-white to-purple-50/30"
                style={{ aspectRatio: '5 / 3', minHeight: 320 }}
              >
                {positionedWords.map((a) => (
                  <span
                    key={a.text}
                    className={`group absolute whitespace-nowrap font-bold select-none ${colorClass(a.count)}`}
                    style={{
                      left: `${a.x}%`,
                      top: `${a.y}%`,
                      transform: `translate(-50%, -50%) rotate(${a.rotation}deg)`,
                      fontSize: fontSize(a.count),
                      zIndex: Math.round(a.count * 10),
                      transition: 'transform 200ms ease',
                    }}
                    title={`${a.count}회`}
                  >
                    <span className="inline-flex items-baseline gap-1">
                      {a.text}
                      {a.count > 1 && (
                        <span className="text-[10px] font-mono text-gray-400 align-baseline">
                          ×{a.count}
                        </span>
                      )}
                    </span>
                    {isHost && (
                      <button
                        type="button"
                        onClick={() => a.ids.forEach((entry) => removeEntry(entry.id))}
                        aria-label={`${a.text} 모두 제거`}
                        className="absolute -top-2 -right-3 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity bg-white rounded-full p-0.5 shadow-sm"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-1 text-xs text-gray-500">
            <span>
              총 응답 {entries.length}개
              {state.closed && <span className="ml-2 text-red-600 font-semibold">· 마감됨</span>}
            </span>
            {isHost && entries.length > 0 && (
              <span className="text-gray-400">단어에 hover하여 제거</span>
            )}
          </div>
        </div>
      )}
    </LiveActivityShell>
  );
}
