'use client';

import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  type Auth,
  type UserCredential,
} from 'firebase/auth';

/**
 * 구글 로그인 결과 타입.
 *
 * - `silent: true`인 경우 사용자에게 토스트를 띄우지 않는다 (예: 사용자가 팝업을 닫음).
 */
export class GoogleSignInError extends Error {
  code: string;
  silent: boolean;
  constructor(code: string, message: string, silent = false) {
    super(message);
    this.name = 'GoogleSignInError';
    this.code = code;
    this.silent = silent;
  }
}

/**
 * 구글 팝업 로그인.
 *
 * 호출 전에 익명 세션이 있으면 정리한다. 보드 참여로 익명 로그인된 상태에서
 * 그대로 `signInWithPopup`을 부르면 일부 환경(특히 모바일 사파리)에서 세션 교체가
 * 깔끔하지 않아 실패하는 케이스가 있어 명시적으로 끊는다.
 */
export async function signInWithGooglePopup(auth: Auth): Promise<UserCredential> {
  if (auth.currentUser?.isAnonymous) {
    try {
      await signOut(auth);
    } catch {
      /* 익명 세션 정리 실패는 무시하고 진행 */
    }
  }
  try {
    const provider = new GoogleAuthProvider();
    return await signInWithPopup(auth, provider);
  } catch (err: unknown) {
    const code =
      err && typeof err === 'object' && 'code' in err
        ? String((err as { code: unknown }).code)
        : 'unknown';
    const rawMessage = err instanceof Error ? err.message : '';
    console.error('[google-sign-in]', code, rawMessage, err);

    if (
      code === 'auth/popup-closed-by-user'
      || code === 'auth/cancelled-popup-request'
      || code === 'auth/user-cancelled'
    ) {
      throw new GoogleSignInError(code, '로그인이 취소되었습니다.', true);
    }
    if (code === 'auth/popup-blocked') {
      throw new GoogleSignInError(
        code,
        '브라우저가 팝업을 차단했습니다. 팝업 차단을 해제하고 다시 시도해 주세요.',
      );
    }
    if (code === 'auth/unauthorized-domain') {
      throw new GoogleSignInError(
        code,
        '이 도메인은 Firebase 인증이 허용되지 않았습니다. 운영자에게 문의해 주세요.',
      );
    }
    if (code === 'auth/network-request-failed') {
      throw new GoogleSignInError(
        code,
        '네트워크 오류로 로그인에 실패했습니다. 연결 상태를 확인해 주세요.',
      );
    }
    if (code === 'auth/operation-not-supported-in-this-environment') {
      throw new GoogleSignInError(
        code,
        '현재 환경에서는 팝업 로그인이 지원되지 않습니다.',
      );
    }
    if (code === 'auth/credential-already-in-use' || code === 'auth/account-exists-with-different-credential') {
      throw new GoogleSignInError(
        code,
        '이미 다른 계정에 연결된 자격 증명입니다. 기존 계정으로 로그인해 주세요.',
      );
    }
    throw new GoogleSignInError(code, `로그인 실패 (${code})`);
  }
}
