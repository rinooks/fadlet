'use client';

import type { BoardSkin } from '@/lib/types';
import { SKINS } from '@/lib/skins';

interface SkinSelectorProps {
  value: BoardSkin;
  onChange: (skin: BoardSkin) => void;
  compact?: boolean;
}

export function SkinSelector({ value, onChange, compact = false }: SkinSelectorProps) {
  const gridClass = compact ? 'grid grid-cols-2 gap-2' : 'grid grid-cols-2 sm:grid-cols-4 gap-2';
  const swatchSize = compact ? 'w-4 h-4' : 'w-5 h-5';
  const labelSize = compact ? 'text-xs' : 'text-sm';
  return (
    <div className={gridClass}>
      {SKINS.map((skin) => {
        const active = value === skin.id;
        return (
          <button
            key={skin.id}
            type="button"
            onClick={() => onChange(skin.id)}
            className={`flex flex-col items-start gap-2 rounded-xl border-2 p-3 text-left transition-colors ${
              active
                ? 'border-indigo-600 bg-indigo-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
            aria-pressed={active}
          >
            <div className="flex items-center gap-1">
              {skin.swatch.map((color, idx) => (
                <span
                  key={idx}
                  className={`block ${swatchSize} rounded-md border border-black/10`}
                  style={{ background: color }}
                  aria-hidden
                />
              ))}
            </div>
            <span className={`${labelSize} font-semibold text-gray-900`}>{skin.label}</span>
            {!compact && (
              <span className="text-xs text-gray-500 leading-relaxed">{skin.description}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
