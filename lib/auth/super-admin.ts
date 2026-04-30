/**
 * 최종(슈퍼) 관리자 이메일.
 *
 * 이 이메일로 로그인하면:
 * - operators 문서가 자동으로 allowed=true, isSuperAdmin=true 로 저장됨
 * - /admin 페이지 접근 + 다른 운영자 승인/거부 가능
 *
 * 그 외 운영자는 첫 로그인 시 allowed=false 로 등록되고 슈퍼관리자 승인을 기다림.
 *
 * 서버 차단도 firestore.rules의 isSuperAdmin()과 동기화 유지할 것.
 */
export const SUPER_ADMIN_EMAILS = ['rinooks@gmail.com'] as const;

export function isSuperAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return (SUPER_ADMIN_EMAILS as readonly string[]).includes(email.toLowerCase());
}
