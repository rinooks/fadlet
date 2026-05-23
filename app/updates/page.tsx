'use client';

export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { ArrowLeft, Megaphone } from 'lucide-react';
import { SiteFooter } from '@/components/shared/site-footer';
import { resolveUserBody, usePublishedUpdateNotes } from '@/lib/firebase/update-notes';

export default function UpdatesPage() {
  const { notes, loading } = usePublishedUpdateNotes();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-50/30 via-white to-purple-50/30">
      <header className="px-6 py-4 border-b border-gray-100 bg-white/70 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-indigo-600 font-bold text-xl tracking-tight">
            Fadlet
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft size={12} /> 홈으로
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-12 sm:py-16">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 bg-white border border-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full mb-4 shadow-sm">
            <Megaphone size={12} />
            업데이트 노트
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
            Fadlet의 변화
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-3 max-w-xl mx-auto leading-relaxed">
            새로운 기능과 개선 사항을 모아두었어요.
          </p>
        </div>

        {loading ? (
          <p className="text-center text-sm text-gray-400 py-12">불러오는 중...</p>
        ) : notes.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-10 text-center">
            <Megaphone size={28} className="text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">아직 등록된 업데이트 노트가 없습니다.</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {notes.map((note) => (
              <li key={note.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:border-indigo-300 transition-colors">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  {note.version && (
                    <span className="text-[11px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      {note.version}
                    </span>
                  )}
                  <h2 className="text-lg font-bold text-gray-900">{note.title}</h2>
                  <span className="text-[11px] text-gray-400 ml-auto">
                    {note.publishedAt?.toDate?.().toLocaleDateString('ko-KR') ?? ''}
                  </span>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap break-words leading-relaxed">
                  {resolveUserBody(note)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
