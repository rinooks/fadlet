'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[app-error]', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6 py-16">
      <div className="max-w-md w-full text-center">
        <div className="text-5xl">⚠️</div>
        <h1 className="mt-6 text-2xl font-bold text-gray-900">문제가 발생했어요</h1>
        <p className="mt-3 text-sm text-gray-600 leading-relaxed">
          일시적인 오류로 페이지를 표시하지 못했습니다.<br />
          다시 시도하거나, 문제가 계속되면 아래 이메일로 알려주세요.
        </p>
        {error?.digest ? (
          <p className="mt-2 text-xs text-gray-400 font-mono">오류 코드: {error.digest}</p>
        ) : null}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-11 items-center justify-center rounded-full bg-indigo-600 px-6 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors w-full sm:w-auto"
          >
            다시 시도
          </button>
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-full border border-gray-300 bg-white px-6 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors w-full sm:w-auto"
          >
            홈으로 가기
          </Link>
        </div>
        <p className="mt-6 text-xs text-gray-500">
          문의: <a href="mailto:help@referencehrd.com" className="text-indigo-600 hover:underline">help@referencehrd.com</a>
        </p>
      </div>
    </div>
  );
}
