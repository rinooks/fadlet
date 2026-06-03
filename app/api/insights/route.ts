import { NextRequest, NextResponse } from 'next/server';
import { generateInsights, type InsightInput } from '@/lib/ai/gemini';

// Gemini 키를 서버에서만 사용하므로 Node 런타임에서 실행.
export const runtime = 'nodejs';

const DEFAULT_MODEL = 'gemini-2.5-flash';

/** Firebase ID 토큰을 Identity Toolkit REST로 검증 — 인증된 사용자만 호출 허용(쿼터 남용 방지). */
async function verifyIdToken(idToken: string): Promise<boolean> {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) return false;
  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ idToken }),
        signal: AbortSignal.timeout(5000),
      },
    );
    if (!res.ok) return false;
    const data = (await res.json()) as { users?: unknown[] };
    return Array.isArray(data.users) && data.users.length > 0;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: '서버에 Gemini API 키(GEMINI_API_KEY)가 설정되지 않았습니다.' },
      { status: 503 },
    );
  }

  // 인증: Authorization: Bearer <Firebase ID 토큰>
  const authHeader = req.headers.get('authorization') ?? '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!idToken || !(await verifyIdToken(idToken))) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  let body: Partial<Omit<InsightInput, 'apiKey'>>;
  try {
    body = (await req.json()) as Partial<Omit<InsightInput, 'apiKey'>>;
  } catch {
    return NextResponse.json({ error: '잘못된 요청 본문입니다.' }, { status: 400 });
  }

  if (!body.board || typeof body.board.title !== 'string') {
    return NextResponse.json({ error: '보드 정보가 필요합니다.' }, { status: 400 });
  }

  try {
    const result = await generateInsights({
      apiKey,
      model: typeof body.model === 'string' && body.model ? body.model : DEFAULT_MODEL,
      board: body.board,
      posts: body.posts ?? [],
      messages: body.messages ?? [],
      pollResponses: body.pollResponses ?? [],
      wordcloudEntries: body.wordcloudEntries ?? [],
      qnaQuestions: body.qnaQuestions ?? [],
    });
    return NextResponse.json(result);
  } catch (err) {
    console.error('[api/insights]', err);
    const msg = err instanceof Error ? err.message : '인사이트 생성 실패';
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
