/**
 * 운영자(최종관리자) 이메일 화이트리스트.
 *
 * 베타 기간엔 이 목록에 있는 이메일만 운영자 로그인 가능.
 * 새 테스터는 이 배열에 이메일 추가 후 배포.
 *
 * 서버 차단도 firestore.rules의 isAllowedOperator()와 동기화 유지할 것.
 */
export const ALLOWED_OPERATOR_EMAILS = [
  'rinooks@gmail.com',
] as const;

export function isAllowedOperatorEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return (ALLOWED_OPERATOR_EMAILS as readonly string[]).includes(email.toLowerCase());
}
