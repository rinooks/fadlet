'use client';

import Link from 'next/link';
import { ArrowRight, Megaphone } from 'lucide-react';
import { resolveUserBody, usePublishedUpdateNotes } from '@/lib/firebase/update-notes';

export function UpdateNotesSection() {
  const { notes, loading } = usePublishedUpdateNotes(3);

  if (loading || notes.length === 0) return null;

  return (
    <section className="w-full max-w-4xl mt-20 text-left">
      <div className="text-center mb-10">
        <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-3">
          What&apos;s New
        </p>
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
          꾸준히 다듬고 있어요
        </h2>
        <p className="text-sm sm:text-base text-gray-600 mt-4 max-w-2xl mx-auto leading-relaxed">
          최근 추가된 기능과 개선 사항입니다.
        </p>
      </div>

      <ul className="space-y-3">
        {notes.map((note) => (
          <li
            key={note.id}
            className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-5 hover:border-indigo-300 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Megaphone size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  {note.version && (
                    <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                      {note.version}
                    </span>
                  )}
                  <h3 className="text-base font-semibold text-gray-900">{note.title}</h3>
                  <span className="text-[11px] text-gray-400 ml-auto flex-shrink-0">
                    {note.publishedAt?.toDate?.().toLocaleDateString('ko-KR') ?? ''}
                  </span>
                </div>
                <p className="text-sm text-gray-600 whitespace-pre-wrap break-words leading-relaxed">
                  {resolveUserBody(note)}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="text-center mt-6">
        <Link
          href="/updates"
          className="inline-flex items-center gap-1.5 h-10 px-5 rounded-xl border border-gray-300 bg-white/80 backdrop-blur-sm hover:bg-white hover:border-indigo-400 text-sm font-semibold text-gray-700 hover:text-indigo-600 transition-all"
        >
          더보기
          <ArrowRight size={14} />
        </Link>
      </div>
    </section>
  );
}
