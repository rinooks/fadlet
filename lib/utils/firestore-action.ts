import { toast } from 'sonner';

/**
 * Firestore 쓰기 작업을 try/catch로 감싸 사용자에게 토스트로 알리는 헬퍼.
 *
 * 실패 시:
 * - console.error 로 원본 오류 로깅
 * - toast.error 로 사용자 안내 (한국어 메시지)
 * - 원본 오류를 re-throw 하여 호출자의 추가 처리(롤백 등) 보존
 *
 * 사용 예:
 *   await runFirestore('포스트 작성에 실패했습니다.', () =>
 *     addDoc(collection(db, postsPath(boardId)), data),
 *   );
 */
export async function runFirestore<T>(
  userMessage: string,
  op: () => Promise<T>,
): Promise<T> {
  try {
    return await op();
  } catch (err) {
    console.error(`[firestore-action] ${userMessage}`, err);
    toast.error(userMessage);
    throw err;
  }
}
