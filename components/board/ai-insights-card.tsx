'use client';

import { collection, doc, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore';
import { Sparkles, RefreshCw, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/firebase/client';
import {
  boardsPath,
  pollResponsesPath,
  qnaQuestionsPath,
  wordcloudEntriesPath,
} from '@/lib/firebase/collections';
import { DEFAULT_GEMINI_MODEL, fetchAppSettings } from '@/lib/firebase/settings';
import { generateInsights } from '@/lib/ai/gemini';
import type {
  Board,
  Message,
  PollResponse,
  Post,
  QnaQuestion,
  WordcloudEntry,
} from '@/lib/types';

interface Props {
  board: Board;
  posts: Post[];
  messages: Message[];
  isHost: boolean;
}

export function AiInsightsCard({ board, posts, messages, isHost }: Props) {
  const insights = board.aiInsights ?? null;
  const [generating, setGenerating] = useState(false);

  async function handleGenerate() {
    if (!isHost) return;
    setGenerating(true);
    try {
      const settings = await fetchAppSettings();
      if (!settings?.geminiApiKey) {
        toast.error('관리자 페이지에서 Gemini API 키를 먼저 설정해 주세요.');
        return;
      }

      const [polls, words, qnas] = await Promise.all([
        snapshotOnce<PollResponse>(pollResponsesPath(board.id)),
        snapshotOnce<WordcloudEntry>(wordcloudEntriesPath(board.id)),
        snapshotOnce<QnaQuestion>(qnaQuestionsPath(board.id)),
      ]);

      const result = await generateInsights({
        apiKey: settings.geminiApiKey,
        model: settings.geminiModel ?? DEFAULT_GEMINI_MODEL,
        board: { title: board.title, mode: board.mode, stages: board.stages },
        posts,
        messages,
        pollResponses: polls,
        wordcloudEntries: words,
        qnaQuestions: qnas,
      });

      await updateDoc(doc(db, boardsPath(), board.id), {
        aiInsights: {
          summary: result.summary,
          insights: result.insights,
          nextSteps: result.nextSteps,
          model: settings.geminiModel ?? DEFAULT_GEMINI_MODEL,
          generatedAt: serverTimestamp(),
          generatedBy: board.ownerId,
        },
        updatedAt: serverTimestamp(),
      });

      toast.success('AI 인사이트를 생성했습니다.');
    } catch (err) {
      console.error('[ai-insights]', err);
      const msg = err instanceof Error ? err.message : '생성 실패';
      toast.error(`인사이트 생성 실패: ${msg}`);
    } finally {
      setGenerating(false);
    }
  }

  async function handleClear() {
    if (!isHost) return;
    if (!confirm('AI 인사이트를 삭제하시겠습니까?')) return;
    try {
      await updateDoc(doc(db, boardsPath(), board.id), {
        aiInsights: null,
        updatedAt: serverTimestamp(),
      });
      toast.success('인사이트를 삭제했습니다.');
    } catch {
      toast.error('삭제 실패');
    }
  }

  if (!insights && !isHost) return null;

  return (
    <section className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/60 p-5 shadow-sm">
      <header className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-indigo-600" />
          <h3 className="text-base font-bold text-gray-900">AI 인사이트</h3>
          {insights?.model && (
            <span className="text-[10px] font-mono text-gray-400 bg-white border border-gray-200 px-1.5 py-0.5 rounded">
              {insights.model}
            </span>
          )}
        </div>
        {isHost && (
          <div className="flex gap-1.5">
            <Button
              size="sm"
              variant="outline"
              onClick={handleGenerate}
              disabled={generating}
              className="text-xs h-8"
            >
              <RefreshCw size={12} className={`mr-1 ${generating ? 'animate-spin' : ''}`} />
              {insights ? '다시 생성' : '인사이트 생성'}
            </Button>
            {insights && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleClear}
                className="text-xs h-8 text-red-600 border-red-200 hover:bg-red-50"
              >
                <Trash2 size={12} />
              </Button>
            )}
          </div>
        )}
      </header>

      {!insights && isHost && (
        <p className="text-sm text-gray-500 leading-relaxed">
          워크숍 진행 결과(보드 포스트·라이브 응답·채팅)를 바탕으로 핵심 인사이트와 다음 단계 제안을 만들어 드립니다.
        </p>
      )}

      {insights && (
        <div className="space-y-4">
          {insights.summary && (
            <p className="text-sm text-gray-800 leading-relaxed font-medium border-l-2 border-indigo-300 pl-3">
              {insights.summary}
            </p>
          )}

          {insights.insights.length > 0 && (
            <div>
              <p className="text-[11px] uppercase tracking-widest font-bold text-indigo-700 mb-2">
                핵심 인사이트
              </p>
              <ul className="space-y-1.5">
                {insights.insights.map((item, i) => (
                  <li key={i} className="text-sm text-gray-700 leading-relaxed flex gap-2">
                    <span className="font-bold text-indigo-600 flex-shrink-0">{i + 1}.</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {insights.nextSteps.length > 0 && (
            <div>
              <p className="text-[11px] uppercase tracking-widest font-bold text-purple-700 mb-2">
                다음 단계 제안
              </p>
              <ul className="space-y-1.5">
                {insights.nextSteps.map((item, i) => (
                  <li key={i} className="text-sm text-gray-700 leading-relaxed flex gap-2">
                    <span className="text-purple-500 flex-shrink-0">→</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {insights.generatedAt?.toDate && (
            <p className="text-[10px] text-gray-400 pt-1 border-t border-gray-100">
              생성: {insights.generatedAt.toDate().toLocaleString('ko-KR')}
            </p>
          )}
        </div>
      )}
    </section>
  );
}

async function snapshotOnce<T>(path: string): Promise<T[]> {
  return new Promise<T[]>((resolve, reject) => {
    const unsub = onSnapshot(
      collection(db, path),
      (snap) => {
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T);
        unsub();
        resolve(items);
      },
      (err) => {
        unsub();
        reject(err);
      },
    );
  });
}
