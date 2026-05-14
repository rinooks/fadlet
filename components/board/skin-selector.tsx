'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { BoardSkin } from '@/lib/types';
import { SKINS, getSkinMeta } from '@/lib/skins';

interface SkinSelectorProps {
  value: BoardSkin;
  onChange: (skin: BoardSkin) => void;
  compact?: boolean;
  variant?: 'grid' | 'select';
}

export function SkinSelector({ value, onChange, compact = false, variant = 'grid' }: SkinSelectorProps) {
  if (variant === 'select') {
    return <SkinSelect value={value} onChange={onChange} />;
  }

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
            <span className={`${labelSize} font-semibold text-gray-900 truncate w-full`}>{skin.label}</span>
            {!compact && (
              <span className="text-xs text-gray-500 leading-relaxed">{skin.description}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function SkinSwatch({ colors, size = 'sm' }: { colors: string[]; size?: 'sm' | 'md' }) {
  const swatchSize = size === 'md' ? 'w-5 h-5' : 'w-4 h-4';
  return (
    <div className="flex items-center gap-0.5 flex-shrink-0">
      {colors.map((color, idx) => (
        <span
          key={idx}
          className={`block ${swatchSize} rounded-sm border border-black/10`}
          style={{ background: color }}
          aria-hidden
        />
      ))}
    </div>
  );
}

function SkinSelect({ value, onChange }: { value: BoardSkin; onChange: (skin: BoardSkin) => void }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const current = getSkinMeta(value);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  return (
    <div ref={wrapperRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-left transition-colors hover:border-indigo-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <SkinSwatch colors={current.swatch} />
          <span className="text-sm font-semibold text-gray-900 truncate">{current.label}</span>
        </div>
        <ChevronDown size={16} className={`flex-shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-full mt-1 z-50 max-h-72 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg"
        >
          {SKINS.map((skin) => {
            const active = value === skin.id;
            return (
              <button
                key={skin.id}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  onChange(skin.id);
                  setOpen(false);
                }}
                className={`flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors ${
                  active ? 'bg-indigo-50' : 'hover:bg-gray-50'
                }`}
              >
                <SkinSwatch colors={skin.swatch} />
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-semibold truncate ${active ? 'text-indigo-700' : 'text-gray-900'}`}>
                    {skin.label}
                  </p>
                  <p className="text-xs text-gray-500 leading-relaxed mt-0.5">{skin.description}</p>
                </div>
                {active && <span className="flex-shrink-0 text-indigo-600 text-sm font-bold mt-0.5">✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
