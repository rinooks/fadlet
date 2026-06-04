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

// 워드클라우드 가상 좌표계(viewBox) — 충돌 계산을 이 공간에서 하고 SVG가 반응형으로 스케일.
const VW = 1000;
const VH = 600;
const MIN_FONT = 26;
const MAX_FONT = 96;
const GAP = 7; // 단어 간 최소 간격(가상 단위)
const MAX_WORDS = 120;
// 브랜드 톤 색상 hue (인디고·바이올렛·퍼플·핑크·블루·틸)
const HUES = [245, 262, 284, 330, 212, 188];

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  }
  return h >>> 0;
}

// 텍스트 폭 측정(캔버스). SSR 등 캔버스 미가용 시 글자 종류 기반 추정으로 폴백.
let _measureCtx: CanvasRenderingContext2D | null = null;
function measureWidth(text: string, fontPx: number): number {
  if (typeof document !== 'undefined') {
    if (!_measureCtx) _measureCtx = document.createElement('canvas').getContext('2d');
    if (_measureCtx) {
      _measureCtx.font = `800 ${fontPx}px "Pretendard Variable", Pretendard, sans-serif`;
      return _measureCtx.measureText(text).width;
    }
  }
  let w = 0;
  for (const ch of text) {
    w += /[ᄀ-ᇿ㄰-㆏가-힣　-〿＀-￯]/.test(ch) ? fontPx : fontPx * 0.56;
  }
  return w;
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
    const words = aggregated.slice(0, MAX_WORDS);
    if (words.length === 0) return [];

    // 가장 큰 단어가 가로폭을 넘지 않도록 최대 폰트를 보정
    const top = words[0];
    const topLabel = top.count > 1 ? `${top.text} ×${top.count}` : top.text;
    const topW = measureWidth(topLabel, MAX_FONT);
    const maxFont = topW > VW - 60 ? (MAX_FONT * (VW - 60)) / topW : MAX_FONT;
    const minFont = Math.min(MIN_FONT, maxFont * 0.5);
    const fontPxFor = (count: number) =>
      minFont + (maxFont - minFont) * Math.pow(count / maxCount, 0.8);

    const cx0 = VW / 2;
    const cy0 = VH / 2;
    const placed: { x: number; y: number; hw: number; hh: number }[] = [];

    return words.map((a, i) => {
      const fontPx = fontPxFor(a.count);
      const label = a.count > 1 ? `${a.text} ×${a.count}` : a.text;
      const textW = measureWidth(label, fontPx);
      const textH = fontPx * 0.92;
      // 가장 큰 단어(첫 번째)는 정렬, 나머지는 ±17° 살짝 회전
      const rot = i === 0 ? 0 : (((hashString(a.text) >> 20) & 0x3ff) / 0x3ff - 0.5) * 34;
      const rad = Math.abs((rot * Math.PI) / 180);
      // 회전한 사각형의 축정렬 바운딩박스 반폭/반높이
      const halfW = (Math.abs(textW * Math.cos(rad)) + Math.abs(textH * Math.sin(rad))) / 2 + GAP;
      const halfH = (Math.abs(textW * Math.sin(rad)) + Math.abs(textH * Math.cos(rad))) / 2 + GAP;

      let x = cx0;
      let y = cy0;
      if (i > 0) {
        // 아르키메데스 나선을 따라 충돌이 없는 첫 위치 탐색 (세로 압축 → 가로로 풍성)
        const startAngle = ((hashString(a.text) & 0x3ff) / 0x3ff) * Math.PI * 2;
        let angle = startAngle;
        for (let step = 0; step < 5000; step++) {
          const r = 3.2 * (angle - startAngle);
          const nx = cx0 + r * Math.cos(angle);
          const ny = cy0 + r * Math.sin(angle) * 0.62;
          angle += 0.22;
          x = nx;
          y = ny;
          if (nx - halfW < 0 || nx + halfW > VW || ny - halfH < 0 || ny + halfH > VH) continue;
          let hit = false;
          for (const b of placed) {
            if (Math.abs(nx - b.x) < halfW + b.hw && Math.abs(ny - b.y) < halfH + b.hh) {
              hit = true;
              break;
            }
          }
          if (!hit) break;
        }
      }
      placed.push({ x, y, hw: halfW, hh: halfH });

      const ratio = a.count / maxCount;
      const hue = HUES[hashString(a.text) % HUES.length];
      // 빈도 높을수록 진하고 채도 높게
      const color = `hsl(${hue} ${(58 + ratio * 18).toFixed(0)}% ${(60 - ratio * 28).toFixed(0)}%)`;

      return {
        ...a,
        x,
        y,
        rot,
        fontPx,
        color,
        weight: ratio >= 0.5 ? 800 : 700,
        halfTextW: textW / 2,
        halfTextH: textH / 2,
      };
    });
  }, [aggregated, maxCount]);

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
                className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-50/60 via-white to-purple-50/50 ring-1 ring-indigo-100/70 shadow-inner"
                style={{ aspectRatio: '5 / 3', minHeight: 320 }}
              >
                <svg
                  viewBox={`0 0 ${VW} ${VH}`}
                  width="100%"
                  height="100%"
                  preserveAspectRatio="xMidYMid meet"
                  className="block"
                  role="img"
                  aria-label="워드클라우드 결과"
                >
                  <style>{`.wc-word{animation:wcfade .4s ease-out both}@keyframes wcfade{from{opacity:0}to{opacity:1}}`}</style>
                  {positionedWords.map((a, idx) => {
                    const hx = a.x + a.halfTextW + 6;
                    const hy = a.y - a.halfTextH;
                    return (
                      <g
                        key={a.text}
                        className="group"
                        transform={`rotate(${a.rot.toFixed(2)} ${a.x.toFixed(1)} ${a.y.toFixed(1)})`}
                      >
                        <text
                          x={a.x}
                          y={a.y}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontSize={a.fontPx}
                          fontWeight={a.weight}
                          fill={a.color}
                          className="wc-word select-none"
                          style={{
                            fontFamily: '"Pretendard Variable", Pretendard, sans-serif',
                            animationDelay: `${Math.min(idx * 20, 600)}ms`,
                          }}
                        >
                          <title>{`${a.count}회`}</title>
                          {a.text}
                          {a.count > 1 && (
                            <tspan dx={a.fontPx * 0.16} fontSize={a.fontPx * 0.52} fontWeight={600} fillOpacity={0.55}>
                              ×{a.count}
                            </tspan>
                          )}
                        </text>
                        {isHost && (
                          <g
                            className="cursor-pointer opacity-0 transition-opacity group-hover:opacity-100"
                            onClick={() => a.ids.forEach((entry) => removeEntry(entry.id))}
                          >
                            <title>{`${a.text} 모두 제거`}</title>
                            <circle cx={hx} cy={hy} r={15} fill="#fff" stroke="#fca5a5" strokeWidth={1.5} />
                            <path
                              d={`M ${hx - 5} ${hy - 5} l 10 10 M ${hx + 5} ${hy - 5} l -10 10`}
                              stroke="#ef4444"
                              strokeWidth={2}
                              strokeLinecap="round"
                            />
                          </g>
                        )}
                      </g>
                    );
                  })}
                </svg>
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
