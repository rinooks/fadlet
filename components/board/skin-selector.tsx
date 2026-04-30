'use client';

import type { BoardSkin } from '@/lib/types';
import { SKINS } from '@/lib/skins';

interface SkinSelectorProps {
  value: BoardSkin;
  onChange: (skin: BoardSkin) => void;
}

export function SkinSelector({ value, onChange }: SkinSelectorProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {SKINS.map((skin) => {
        const active = value === skin.id;
        return (
          <button
            key={skin.id}
            type="button"
            onClick={() => onChange(skin.id)}
            className={`flex flex-col items-start gap-2 rounded-xl border-2 p-3 text-left transition-colors ${
              active
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
            aria-pressed={active}
          >
            <div className="flex items-center gap-1">
              {skin.swatch.map((color, idx) => (
                <span
                  key={idx}
                  className="block w-5 h-5 rounded-md border border-black/10"
                  style={{ background: color }}
                  aria-hidden
                />
              ))}
            </div>
            <span className="text-sm font-semibold text-gray-900">{skin.label}</span>
            <span className="text-xs text-gray-500 leading-relaxed">{skin.description}</span>
          </button>
        );
      })}
    </div>
  );
}
