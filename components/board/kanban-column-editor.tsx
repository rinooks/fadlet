'use client';

import { useState } from 'react';
import { ArrowDown, ArrowUp, Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DEFAULT_KANBAN_COLUMNS,
  KANBAN_PALETTE,
  genKanbanColumnId,
  nextPaletteEntry,
} from '@/lib/kanban-colors';
import type { KanbanColumn, PostColor } from '@/lib/types';

interface KanbanColumnEditorProps {
  columns?: KanbanColumn[];
  /** columns가 undefined일 때 화면에 표시할 기본 컬럼 (저장은 아직 안 됨) */
  defaultColumns?: KanbanColumn[];
  onChange: (columns: KanbanColumn[]) => Promise<void>;
}

export function KanbanColumnEditor({ columns, defaultColumns, onChange }: KanbanColumnEditorProps) {
  const list = columns ?? defaultColumns ?? DEFAULT_KANBAN_COLUMNS;
  const [busy, setBusy] = useState(false);
  const [colorOpenId, setColorOpenId] = useState<string | null>(null);

  async function commit(next: KanbanColumn[]) {
    setBusy(true);
    try {
      await onChange(next);
    } finally {
      setBusy(false);
    }
  }

  async function addColumn() {
    const palette = nextPaletteEntry(list.length);
    const newCol: KanbanColumn = {
      id: genKanbanColumnId(),
      label: `새 컬럼`,
      headerColor: palette.color,
      defaultPostColor: palette.postColor,
    };
    await commit([...list, newCol]);
  }

  async function updateLabel(id: string, label: string) {
    await commit(list.map((c) => (c.id === id ? { ...c, label } : c)));
  }

  async function updateColor(id: string, headerColor: string, defaultPostColor?: PostColor) {
    await commit(list.map((c) => (c.id === id ? { ...c, headerColor, ...(defaultPostColor ? { defaultPostColor } : {}) } : c)));
  }

  async function move(id: string, dir: -1 | 1) {
    const idx = list.findIndex((c) => c.id === id);
    if (idx < 0) return;
    const swap = idx + dir;
    if (swap < 0 || swap >= list.length) return;
    const next = [...list];
    [next[idx], next[swap]] = [next[swap], next[idx]];
    await commit(next);
  }

  async function remove(id: string) {
    if (list.length <= 1) return;
    await commit(list.filter((c) => c.id !== id));
  }

  return (
    <div className="flex flex-col gap-2">
      {!columns && (
        <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
          기본 3컬럼을 사용 중입니다. 편집하면 보드에 사용자 컬럼이 저장됩니다.
        </p>
      )}
      <ul className="flex flex-col gap-1.5">
        {list.map((col, idx) => (
          <li key={col.id} className="relative flex items-center gap-1.5 p-1.5 bg-white border border-gray-200 rounded-md">
            <button
              type="button"
              onClick={() => setColorOpenId(colorOpenId === col.id ? null : col.id)}
              aria-label="색상 선택"
              className="w-6 h-6 rounded border-2 border-white shadow flex-shrink-0 ring-1 ring-gray-200"
              style={{ backgroundColor: col.headerColor }}
            />
            <Input
              value={col.label}
              onChange={(e) => updateLabel(col.id, e.target.value)}
              disabled={busy}
              maxLength={20}
              className="text-sm h-7 flex-1 min-w-0"
            />
            <button
              type="button"
              onClick={() => move(col.id, -1)}
              disabled={busy || idx === 0}
              aria-label="위로"
              className="text-gray-400 hover:text-gray-700 disabled:opacity-30 p-0.5 flex-shrink-0"
            >
              <ArrowUp size={12} />
            </button>
            <button
              type="button"
              onClick={() => move(col.id, 1)}
              disabled={busy || idx === list.length - 1}
              aria-label="아래로"
              className="text-gray-400 hover:text-gray-700 disabled:opacity-30 p-0.5 flex-shrink-0"
            >
              <ArrowDown size={12} />
            </button>
            <button
              type="button"
              onClick={() => remove(col.id)}
              disabled={busy || list.length <= 1}
              aria-label="삭제"
              className="text-gray-400 hover:text-red-500 disabled:opacity-30 p-0.5 flex-shrink-0"
            >
              <Trash2 size={12} />
            </button>

            {colorOpenId === col.id && (
              <div className="absolute left-0 top-full mt-1 z-20 w-64 p-2 bg-white border border-gray-200 rounded-md shadow-lg">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">색상</span>
                  <button
                    type="button"
                    onClick={() => setColorOpenId(null)}
                    aria-label="닫기"
                    className="text-gray-400 hover:text-gray-700"
                  >
                    <X size={12} />
                  </button>
                </div>
                <div className="grid grid-cols-5 gap-1.5 mb-2">
                  {KANBAN_PALETTE.map((p) => (
                    <button
                      key={p.color}
                      type="button"
                      onClick={() => { updateColor(col.id, p.color, p.postColor); setColorOpenId(null); }}
                      aria-label={`색상 ${p.color}`}
                      className={`w-full h-7 rounded border-2 ${col.headerColor === p.color ? 'border-indigo-600 ring-2 ring-indigo-300' : 'border-white ring-1 ring-gray-200'}`}
                      style={{ backgroundColor: p.color }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                  <label className="text-[11px] font-semibold text-gray-700 flex-shrink-0">커스텀</label>
                  <input
                    type="color"
                    value={col.headerColor}
                    onChange={(e) => updateColor(col.id, e.target.value)}
                    className="w-8 h-7 rounded border border-gray-300 cursor-pointer bg-white"
                    aria-label="커스텀 색상"
                  />
                  <input
                    type="text"
                    value={col.headerColor}
                    onChange={(e) => {
                      const v = e.target.value.trim();
                      if (/^#[0-9a-fA-F]{6}$/.test(v) || /^#[0-9a-fA-F]{3}$/.test(v)) {
                        updateColor(col.id, v);
                      }
                    }}
                    maxLength={7}
                    className="flex-1 h-7 px-2 text-xs font-mono uppercase rounded border border-gray-300 bg-white focus:outline-none focus:border-indigo-400"
                  />
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
      <Button
        type="button"
        onClick={addColumn}
        disabled={busy}
        size="sm"
        variant="outline"
        className="w-full text-xs h-7"
      >
        <Plus size={12} /> 컬럼 추가
      </Button>
    </div>
  );
}
