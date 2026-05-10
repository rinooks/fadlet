'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

const STORAGE_KEY = 'fadlet-host-onboarded-v1';

interface Step {
  emoji: string;
  title: string;
  description: string;
}

const STEPS: Step[] = [
  {
    emoji: '🎛',
    title: '퍼실리테이터 패널이 핵심입니다',
    description:
      '헤더의 🎛 환경설정 버튼을 누르면 단계 + 타이머, 공지 고정, 키워드 필터, 분석 대시보드까지 한 곳에서 관리할 수 있습니다.',
  },
  {
    emoji: '⏱',
    title: '단계 타이머로 진행 속도를 잡으세요',
    description:
      '단계 제목과 시간을 등록한 뒤 시작/정지/다음 단계로 흐름을 통제할 수 있습니다. 참여자에게는 남은 시간이 실시간 표시됩니다.',
  },
  {
    emoji: '🚩',
    title: '신고·모더레이션과 PDF 내보내기',
    description:
      '문제가 되는 메시지는 신고 패널에서 즉시 삭제 처리할 수 있습니다. 워크숍이 끝나면 헤더 “내보내기”에서 보드와 채팅을 PDF로 저장하세요.',
  },
];

interface HostOnboardingProps {
  enabled: boolean;
}

export function HostOnboarding({ enabled }: HostOnboardingProps) {
  const [step, setStep] = useState(0);
  const [dismissed, setDismissed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem(STORAGE_KEY) === '1';
  });

  function complete() {
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, '1');
    setDismissed(true);
  }

  if (!enabled || dismissed) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="퍼실리테이터 가이드"
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold text-indigo-600 uppercase">
            퍼실리테이터 가이드 {step + 1}/{STEPS.length}
          </span>
          <button
            onClick={complete}
            className="text-xs text-gray-400 hover:text-gray-700"
            aria-label="가이드 건너뛰기"
          >
            건너뛰기
          </button>
        </div>

        <div className="text-5xl mb-3" aria-hidden>{current.emoji}</div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">{current.title}</h2>
        <p className="text-sm text-gray-600 leading-relaxed mb-6">{current.description}</p>

        <div className="flex items-center justify-between">
          <Link
            href="/help"
            target="_blank"
            className="text-xs text-indigo-600 hover:underline"
          >
            전체 가이드 보기 →
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              {STEPS.map((_, i) => (
                <span
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full ${i === step ? 'bg-indigo-600' : 'bg-gray-300'}`}
                  aria-hidden
                />
              ))}
            </div>
            {isLast ? (
              <Button
                size="sm"
                onClick={complete}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
              >
                시작하기
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => setStep((s) => Math.min(s + 1, STEPS.length - 1))}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
              >
                다음
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
