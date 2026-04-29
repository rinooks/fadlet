'use client';

import { TEMPLATES } from '@/lib/templates';
import type { BoardTemplate } from '@/lib/types';

interface TemplateSelectorProps {
  value: BoardTemplate;
  onChange: (t: BoardTemplate) => void;
}

export function TemplateSelector({ value, onChange }: TemplateSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
      {TEMPLATES.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className={`flex flex-col items-start gap-1 rounded-xl border-2 px-3 py-3 text-left transition-all focus-visible:outline focus-visible:outline-2 ${
            value === t.id
              ? 'border-blue-600 bg-blue-50 shadow-sm'
              : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
          }`}
        >
          <span className="text-xl">{t.emoji}</span>
          <span className={`text-sm font-semibold ${value === t.id ? 'text-blue-700' : 'text-gray-900'}`}>
            {t.label}
          </span>
          <span className="text-xs text-gray-400 leading-snug">{t.description}</span>
        </button>
      ))}
    </div>
  );
}
