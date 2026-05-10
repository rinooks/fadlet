'use client';

export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { GoogleSignInError } from '@/lib/auth/google-sign-in';
import { useOperatorAuth } from '@/lib/hooks/use-operator-auth';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') ?? '/dashboard';
  const { isOperator, isPending, loading, signInWithGoogle } = useOperatorAuth();

  useEffect(() => {
    if (loading) return;
    if (isOperator) router.replace(redirect);
    else if (isPending) router.replace('/pending');
  }, [isOperator, isPending, loading, router, redirect]);

  async function handleGoogle() {
    try {
      await signInWithGoogle();
      // 이후 위 useEffect가 isOperator/isPending 보고 라우팅
    } catch (err) {
      if (err instanceof GoogleSignInError) {
        if (!err.silent) toast.error(err.message);
      } else {
        console.error('[login] google sign in', err);
        toast.error('구글 로그인에 실패했습니다. 다시 시도해 주세요.');
      }
    }
  }

  if (loading) {
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
      <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-sm text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">운영자 로그인</h1>
        <p className="text-gray-400 text-sm mb-8">보드를 만들고 관리하려면 로그인하세요.</p>

        <Button
          onClick={handleGoogle}
          variant="outline"
          className="w-full h-12 font-semibold flex items-center gap-3 justify-center"
        >
          <GoogleIcon />
          Google로 로그인
        </Button>

        <p className="text-xs text-gray-400 mt-6">
          참여자는 로그인 없이{' '}
          <Link href="/boards/join" className="text-indigo-600 hover:underline">코드로 입장</Link>
          하세요.
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><p className="text-gray-400">로딩 중...</p></div>}>
      <LoginForm />
    </Suspense>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
    </svg>
  );
}
