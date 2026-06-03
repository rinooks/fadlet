// 서버 전용 모듈 — Gemini API 키는 서버 환경변수로만 다루고 클라이언트에 노출하지 않는다.
import type {
  Board,
  Message,
  PollResponse,
  Post,
  QnaQuestion,
  Stage,
  WordcloudEntry,
} from '@/lib/types';

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

export interface InsightInput {
  apiKey: string;
  model: string;
  board: Pick<Board, 'title' | 'mode' | 'stages'>;
  posts: Post[];
  messages: Message[];
  pollResponses: PollResponse[];
  wordcloudEntries: WordcloudEntry[];
  qnaQuestions: QnaQuestion[];
}

export interface InsightOutput {
  summary: string;
  insights: string[];
  nextSteps: string[];
}

function describeStage(stage: Stage, idx: number): string {
  const minutes = Math.round(stage.durationSec / 60);
  const activity = stage.activityType ?? '미지정';
  return `단계 ${idx + 1} [${activity}] "${stage.title}" (${minutes}분)`;
}

function buildContext(input: Omit<InsightInput, 'apiKey' | 'model'>): string {
  const stages = (input.board.stages ?? []).slice().sort((a, b) => a.order - b.order);

  const lines: string[] = [];
  lines.push(`# 워크숍: ${input.board.title}`);
  lines.push(`모드: ${input.board.mode ?? 'single'}`);
  if (stages.length) {
    lines.push('\n## 단계 구성');
    stages.forEach((s, i) => lines.push(`- ${describeStage(s, i)}`));
  }

  // 단계별 결과
  if (stages.length) {
    lines.push('\n## 단계별 결과');
    stages.forEach((s, i) => {
      lines.push(`\n### 단계 ${i + 1}: ${s.title} (${s.activityType ?? '미지정'})`);
      const stagePosts = input.posts.filter((p) => p.stageId === s.id);
      const stagePolls = input.pollResponses.filter((p) => p.stageId === s.id);
      const stageWords = input.wordcloudEntries.filter((w) => w.stageId === s.id);
      const stageQna = input.qnaQuestions.filter((q) => q.stageId === s.id);

      if (s.activityType === 'poll') {
        const cfg = s.activityConfig?.poll;
        if (cfg) {
          lines.push(`질문: ${cfg.question}`);
          const counts = cfg.options.map(() => 0);
          for (const r of stagePolls) {
            for (const idx of r.optionIndexes) {
              if (idx >= 0 && idx < counts.length) counts[idx] += 1;
            }
          }
          cfg.options.forEach((opt, idx) =>
            lines.push(`- ${opt}: ${counts[idx]}표`),
          );
        }
      } else if (s.activityType === 'wordcloud') {
        const cfg = s.activityConfig?.wordcloud;
        if (cfg) lines.push(`프롬프트: ${cfg.prompt}`);
        const freq = new Map<string, number>();
        for (const e of stageWords) {
          const key = e.text.trim().toLowerCase();
          if (!key) continue;
          freq.set(key, (freq.get(key) ?? 0) + 1);
        }
        const sorted = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 30);
        if (sorted.length) {
          lines.push('빈도순 응답: ' + sorted.map(([k, v]) => `${k}(${v})`).join(', '));
        }
      } else if (s.activityType === 'qna') {
        const cfg = s.activityConfig?.qna;
        if (cfg) lines.push(`프롬프트: ${cfg.prompt}`);
        const ranked = [...stageQna].sort(
          (a, b) => (b.upvotes?.length ?? 0) - (a.upvotes?.length ?? 0),
        );
        ranked.slice(0, 20).forEach((q) => {
          lines.push(`- (▲${q.upvotes?.length ?? 0}) ${q.text}${q.answered && q.answer ? ` → 답변: ${q.answer}` : ''}`);
        });
      } else if (stagePosts.length) {
        stagePosts.slice(0, 30).forEach((p) => {
          if (p.content) lines.push(`- ${p.content}`);
        });
      } else {
        lines.push('(응답 없음)');
      }
    });
  } else {
    // single 모드
    if (input.posts.length) {
      lines.push('\n## 보드 포스트');
      input.posts.slice(0, 60).forEach((p) => {
        if (p.content) lines.push(`- ${p.content}`);
      });
    }
  }

  // 채팅 일부
  if (input.messages.length) {
    lines.push('\n## 주요 채팅 (최근 20개)');
    input.messages.slice(-20).forEach((m) => {
      if (m.type === 'text' && m.content) {
        lines.push(`- ${m.authorName}${m.role === 'host' ? '(퍼실리테이터)' : ''}: ${m.content}`);
      }
    });
  }

  return lines.join('\n');
}

const SYSTEM_INSTRUCTION = `당신은 워크숍 퍼실리테이터를 돕는 분석가입니다.
참가자들이 만든 보드/채팅/라이브 응답을 바탕으로:
1) 워크숍 한 줄 요약 (summary)
2) 핵심 인사이트 3개 (insights) — 발견한 패턴, 합의점, 갈등 지점, 의외의 발견 등을 구체적으로
3) 다음 단계 제안 2개 (nextSteps) — 이 워크숍 결과를 받은 퍼실리테이터/팀이 즉시 시도할 만한 실행 단계
를 한국어로 작성하세요. 추측은 피하고, 데이터가 부족하면 "데이터 부족" 명시.

반드시 다음 JSON 형식으로만 응답:
{"summary": "한 줄", "insights": ["...", "...", "..."], "nextSteps": ["...", "..."]}`;

export async function generateInsights(input: InsightInput): Promise<InsightOutput> {
  const context = buildContext(input);

  const url = `${GEMINI_BASE}/${encodeURIComponent(input.model)}:generateContent?key=${encodeURIComponent(input.apiKey)}`;
  const body = {
    systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
    contents: [{ role: 'user', parts: [{ text: context }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.4,
      maxOutputTokens: 2048,
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Gemini API ${res.status}: ${errBody.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini 응답이 비어 있습니다.');

  let parsed: Partial<InsightOutput>;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Gemini 응답을 JSON으로 파싱할 수 없습니다.');
  }

  return {
    summary: typeof parsed.summary === 'string' ? parsed.summary : '',
    insights: Array.isArray(parsed.insights) ? parsed.insights.filter((s) => typeof s === 'string') : [],
    nextSteps: Array.isArray(parsed.nextSteps) ? parsed.nextSteps.filter((s) => typeof s === 'string') : [],
  };
}
