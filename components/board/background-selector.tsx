'use client';

import type { BoardBackground } from '@/lib/types';
import { BACKGROUNDS, DEFAULT_CUSTOM_COLOR, getBackground } from '@/lib/backgrounds';

interface BackgroundSelectorProps {
  value: BoardBackground;
  customColor?: string;
  onChange: (bg: BoardBackground) => void;
  onCustomColorChange?: (color: string) => void;
}

export function BackgroundSelector({ value, customColor, onChange, onCustomColorChange }: BackgroundSelectorProps) {
  const currentColor = customColor || DEFAULT_CUSTOM_COLOR;
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-4 gap-2">
        {BACKGROUNDS.map((bg) => {
          const active = value === bg.id;
          const def = bg.id === 'custom' ? getBackground('custom', currentColor) : bg;
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
                style={def.preview}
                aria-hidden
              />
              <span className={`text-[11px] font-semibold text-center ${active ? 'text-indigo-700' : 'text-gray-700'}`}>
                {bg.label}
              </span>
            </button>
          );
        })}
      </div>

      {value === 'custom' && onCustomColorChange && (
        <div className="flex items-center gap-2 p-2 rounded-md border border-indigo-200 bg-indigo-50/50">
          <label htmlFor="custom-bg-color" className="text-[11px] font-semibold text-gray-700 flex-shrink-0">
            색상 선택
          </label>
          <input
            id="custom-bg-color"
            type="color"
            value={currentColor}
            onChange={(e) => onCustomColorChange(e.target.value)}
            className="w-10 h-8 rounded border border-gray-300 cursor-pointer bg-white"
            aria-label="커스텀 배경색"
          />
          <input
            type="text"
            value={currentColor}
            onChange={(e) => {
              const v = e.target.value.trim();
              if (/^#[0-9a-fA-F]{6}$/.test(v) || /^#[0-9a-fA-F]{3}$/.test(v)) {
                onCustomColorChange(v);
              }
            }}
            placeholder="#FDE68A"
            maxLength={7}
            className="flex-1 h-8 px-2 text-xs font-mono uppercase rounded border border-gray-300 bg-white focus:outline-none focus:border-indigo-400"
          />
        </div>
      )}
    </div>
  );
}
