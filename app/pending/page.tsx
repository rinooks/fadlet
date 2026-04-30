'use client';

export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useOperatorAuth } from '@/lib/hooks/use-operator-auth';

export default function PendingApprovalPage() {
  const router = useRouter();
  const { user, isOperator, isPending, loading, logout } = useOperatorAuth();

  useEffect(() => {
    if (loading) return;
    if (isOperator) {
      router.replace('/dashboard');
    } else if (!user) {
      router.replace('/login');
    }
  }, [isOperator, user, loading, router]);

  if (loading || isOperator || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-400">로딩 중...</p>
      </div>
    );
  }

  return (
    <main className="relative flex items-center justify-center min-h-screen bg-indigo-50 px-4">
      <Link
        href="/"
        className="absolute top-4 left-4 inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 font-semibold transition-colors"
      >
        ← 홈
      </Link>
      <div className="bg-white rounded-2xl shadow-md p-7 w-full max-w-md text-center">
        <div className="text-4xl mb-3">⏳</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">관리자 승인 대기 중</h1>
        <p className="text-sm text-gray-500 mb-1 leading-relaxed">
          {user.email}
        </p>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          {isPending
            ? '운영자 권한이 승인되면 자동으로 대시보드로 이동합니다.'
            : '운영자 등록 정보를 확인 중입니다.'}
        </p>
        <div className="flex flex-col gap-2">
          <Button
            onClick={() => location.reload()}
            variant="outline"
            className="w-full"
          >
            새로고침
          </Button>
          <Button
            onClick={async () => {
              await logout();
              router.push('/');
            }}
            variant="outline"
            className="w-full text-gray-600"
          >
            로그아웃
          </Button>
        </div>
      </div>
    </main>
  );
}
