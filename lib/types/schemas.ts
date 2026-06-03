import { z } from 'zod';

/**
 * Firestore 문서·외부 응답 검증용 zod 스키마.
 *
 * Firestore `data()`는 타입이 보장되지 않으므로(악성·구버전 클라이언트가 형식이 다른 필드를 쓸 수 있음),
 * 집계·렌더링에서 실제로 사용하는 필드만 검증하고 나머지(Timestamp 등)는 통과시킨다(looseObject).
 * safeParse 실패 문서는 호출 측에서 건너뛴다.
 */

// 라이브 폴 응답 — optionIndexes가 비배열이면 집계가 깨지므로 핵심 검증 대상.
export const pollResponseSchema = z.looseObject({
  stageId: z.string(),
  userId: z.string(),
  optionIndexes: z.array(z.number()),
});

// 워드클라우드 입력
export const wordcloudEntrySchema = z.looseObject({
  stageId: z.string(),
  userId: z.string(),
  text: z.string(),
});

// 라이브 Q&A 질문
export const qnaQuestionSchema = z.looseObject({
  stageId: z.string(),
  authorId: z.string(),
  authorName: z.string(),
  text: z.string(),
  upvotes: z.array(z.string()),
  answered: z.boolean(),
});

// og-preview API 응답(외부 페이지 메타데이터 — 신뢰 불가 경계)
export const linkPreviewSchema = z.object({
  url: z.string(),
  title: z.string(),
  description: z.string(),
  image: z.string(),
  siteName: z.string(),
});

/** Firestore 스냅샷 문서들을 스키마로 검증하고, 실패 문서는 건너뛴 뒤 id를 합쳐 반환. */
export function safeParseDocs<T>(
  docs: readonly { id: string; data: () => unknown }[],
  schema: z.ZodType,
  label: string,
): T[] {
  const out: T[] = [];
  for (const d of docs) {
    const r = schema.safeParse(d.data());
    if (r.success) {
      out.push({ id: d.id, ...(r.data as object) } as T);
    } else {
      console.warn(`[${label}] 스키마 불일치 문서 건너뜀: ${d.id}`);
    }
  }
  return out;
}
