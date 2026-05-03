'use client';

import type { BoardBackground } from '@/lib/types';
import { BACKGROUNDS } from '@/lib/backgrounds';

interface BackgroundSelectorProps {
  value: BoardBackground;
  onChange: (bg: BoardBackground) => void;
}

export function BackgroundSelector({ value, onChange }: BackgroundSelectorProps) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {BACKGROUNDS.map((bg) => {
        const active = value === bg.id;
        return (
          <button
            key={bg.id}
            type="button"
            onClick={() => onChange(bg.id)}
            aria-pressed={active}
            className={`flex flex-col items-stretch gap-1 rounded-md border-2 p-1.5 transition-colors ${
              active ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <span
              className="block w-full h-10 rounded border border-black/5"
              style={bg.preview}
              aria-hidden
            />
            <span className={`text-[11px] font-semibold text-center ${active ? 'text-indigo-700' : 'text-gray-700'}`}>
              {bg.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
