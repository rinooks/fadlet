import ExcelJS from 'exceljs';
import { getActivity, isLiveActivity } from '@/lib/activities';
import { getTemplate } from '@/lib/templates';
import type {
  Board,
  BoardTemplate,
  KanbanColumn,
  Message,
  PollResponse,
  Post,
  QnaQuestion,
  Stage,
  WordcloudEntry,
} from '@/lib/types';

export interface BoardExcelData {
  board: Board;
  posts: Post[];
  messages: Message[];
  pollResponses: PollResponse[];
  wordcloudEntries: WordcloudEntry[];
  qnaQuestions: QnaQuestion[];
  isWorkshop: boolean;
}

function fmtDate(ts?: { toDate?: () => Date } | null): string {
  const d = ts?.toDate?.();
  if (!d) return '';
  return d.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** columnId → 사람이 읽을 수 있는 라벨. 커스텀 컬럼(board.kanbanColumns) 우선, 없으면 템플릿 기본 컬럼. */
function makeColumnLabeler(template: BoardTemplate, kanbanColumns?: KanbanColumn[]) {
  const map = new Map<string, string>();
  for (const c of getTemplate(template).columns ?? []) map.set(c.id, c.label);
  for (const c of kanbanColumns ?? []) map.set(c.id, c.label);
  return (columnId?: string) => (columnId ? map.get(columnId) ?? columnId : '');
}

function styleHeader(row: ExcelJS.Row) {
  row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  row.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
    cell.alignment = { vertical: 'middle' };
  });
}

function autoSize(sheet: ExcelJS.Worksheet, widths: number[]) {
  widths.forEach((w, i) => {
    sheet.getColumn(i + 1).width = w;
  });
  sheet.eachRow((row) => {
    row.alignment = { ...row.alignment, vertical: 'top', wrapText: true };
  });
}

/** 보드 데이터로 .xlsx 워크북을 만들어 Blob으로 반환한다. */
export async function buildBoardWorkbook(data: BoardExcelData): Promise<Blob> {
  const { board, posts, messages, pollResponses, wordcloudEntries, qnaQuestions, isWorkshop } = data;
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Fadlet';
  wb.created = new Date();

  const sortedStages: Stage[] = [...(board.stages ?? [])].sort((a, b) => a.order - b.order);
  const template = getTemplate(board.template);

  // 1) 요약 시트
  {
    const ws = wb.addWorksheet('요약');
    ws.addRow(['항목', '내용']);
    styleHeader(ws.getRow(1));
    ws.addRow(['제목', board.title]);
    ws.addRow(['보드 코드', board.boardCode]);
    ws.addRow([
      '유형',
      isWorkshop ? `워크숍 · 단계 ${sortedStages.length}개` : `${template.emoji} ${template.label}`,
    ]);
    ws.addRow(['포스트 수', posts.length]);
    ws.addRow(['메시지 수', messages.length]);
    ws.addRow(['출력일', fmtDate({ toDate: () => new Date() })]);

    if (isWorkshop && sortedStages.length > 0) {
      ws.addRow([]);
      const head = ws.addRow(['단계', '제목', '활동', '시간']);
      styleHeader(head);
      sortedStages.forEach((s, i) => {
        const def = s.activityType ? getActivity(s.activityType) : null;
        ws.addRow([
          i + 1,
          s.title,
          def ? `${def.emoji} ${def.label}` : '',
          s.durationSec === 0 ? '제한없음' : `${Math.round(s.durationSec / 60)}분`,
        ]);
      });
    }
    autoSize(ws, [16, 50, 22, 12]);
  }

  // 2) 포스트 시트
  if (posts.length > 0) {
    const ws = wb.addWorksheet('포스트');
    ws.addRow(['단계', '활동', '영역', '작성자', '제목', '내용', '작성시각']);
    styleHeader(ws.getRow(1));

    const stageById = new Map(sortedStages.map((s) => [s.id, s]));
    // 단계 순서 → 작성 시각 순으로 정렬
    const stageOrder = new Map(sortedStages.map((s, i) => [s.id, i]));
    const ordered = [...posts].sort((a, b) => {
      const sa = stageOrder.get(a.stageId ?? '') ?? -1;
      const sb = stageOrder.get(b.stageId ?? '') ?? -1;
      if (sa !== sb) return sa - sb;
      return (a.createdAt?.toMillis?.() ?? 0) - (b.createdAt?.toMillis?.() ?? 0);
    });

    for (const p of ordered) {
      const stage = p.stageId ? stageById.get(p.stageId) : undefined;
      const activityType = isWorkshop ? stage?.activityType : board.template;
      const def = activityType ? getActivity(activityType) : null;
      const colLabel =
        isWorkshop && stage?.activityType && !isLiveActivity(stage.activityType)
          ? makeColumnLabeler(stage.activityType as BoardTemplate, board.kanbanColumns)(p.columnId)
          : !isWorkshop
            ? makeColumnLabeler(board.template, board.kanbanColumns)(p.columnId)
            : '';
      ws.addRow([
        isWorkshop ? (stage ? `${(stageOrder.get(stage.id) ?? 0) + 1}. ${stage.title}` : '') : '',
        def ? `${def.emoji} ${def.label}` : '',
        colLabel,
        p.authorName,
        p.title ?? '',
        p.content || (p.imageUrl ? '[이미지]' : p.fileName ? `[파일] ${p.fileName}` : ''),
        fmtDate(p.createdAt),
      ]);
    }
    autoSize(ws, [20, 18, 16, 16, 24, 60, 18]);
  }

  // 3) 채팅 시트
  if (messages.length > 0) {
    const ws = wb.addWorksheet('채팅');
    ws.addRow(['작성자', '구분', '시각', '유형', '내용']);
    styleHeader(ws.getRow(1));
    const ordered = [...messages].sort(
      (a, b) => (a.createdAt?.toMillis?.() ?? 0) - (b.createdAt?.toMillis?.() ?? 0),
    );
    for (const m of ordered) {
      const content =
        m.type === 'image'
          ? `[이미지]${m.content ? ' ' + m.content : ''}`
          : m.type === 'file'
            ? `[파일] ${m.fileName ?? ''}`
            : m.content;
      ws.addRow([
        m.authorName,
        m.role === 'host' ? '퍼실리테이터' : '참여자',
        fmtDate(m.createdAt),
        m.type,
        content,
      ]);
    }
    autoSize(ws, [18, 14, 18, 10, 70]);
  }

  // 4) 워크숍 라이브 활동 시트
  if (isWorkshop) {
    const pollStages = sortedStages.filter((s) => s.activityType === 'poll');
    const wcStages = sortedStages.filter((s) => s.activityType === 'wordcloud');
    const qnaStages = sortedStages.filter((s) => s.activityType === 'qna');

    // 폴
    if (pollStages.length > 0) {
      const ws = wb.addWorksheet('폴 결과');
      ws.addRow(['단계', '질문', '선택지', '응답수', '비율(%)']);
      styleHeader(ws.getRow(1));
      pollStages.forEach((stage) => {
        const cfg = stage.activityConfig?.poll;
        if (!cfg) return;
        const responses = pollResponses.filter((r) => r.stageId === stage.id);
        const counts = cfg.options.map(() => 0);
        const respondents = new Set<string>();
        for (const r of responses) {
          respondents.add(r.userId);
          for (const idx of r.optionIndexes) {
            if (idx >= 0 && idx < counts.length) counts[idx] += 1;
          }
        }
        const total = respondents.size;
        const order = (sortedStages.findIndex((s) => s.id === stage.id)) + 1;
        cfg.options.forEach((opt, idx) => {
          const c = counts[idx] ?? 0;
          ws.addRow([
            `${order}. ${stage.title}`,
            cfg.question,
            opt,
            c,
            total > 0 ? Math.round((c / total) * 100) : 0,
          ]);
        });
        ws.addRow([`${order}. ${stage.title}`, cfg.question, '총 응답자', total, 100]);
      });
      autoSize(ws, [20, 40, 30, 10, 10]);
    }

    // 워드클라우드
    if (wcStages.length > 0) {
      const ws = wb.addWorksheet('워드클라우드');
      ws.addRow(['단계', '프롬프트', '단어', '빈도']);
      styleHeader(ws.getRow(1));
      wcStages.forEach((stage) => {
        const cfg = stage.activityConfig?.wordcloud;
        const entries = wordcloudEntries.filter((e) => e.stageId === stage.id);
        const counts = new Map<string, { text: string; count: number }>();
        for (const e of entries) {
          const key = e.text.trim().toLowerCase();
          if (!key) continue;
          const ex = counts.get(key);
          if (ex) ex.count += 1;
          else counts.set(key, { text: e.text.trim(), count: 1 });
        }
        const sorted = Array.from(counts.values()).sort((a, b) => b.count - a.count);
        const order = sortedStages.findIndex((s) => s.id === stage.id) + 1;
        sorted.forEach((s) => {
          ws.addRow([`${order}. ${stage.title}`, cfg?.prompt ?? '', s.text, s.count]);
        });
      });
      autoSize(ws, [20, 40, 30, 10]);
    }

    // Q&A
    if (qnaStages.length > 0) {
      const ws = wb.addWorksheet('Q&A');
      ws.addRow(['단계', '질문', '작성자', '추천수', '답변여부', '답변']);
      styleHeader(ws.getRow(1));
      qnaStages.forEach((stage) => {
        const questions = qnaQuestions.filter((q) => q.stageId === stage.id);
        const sorted = [...questions].sort((a, b) => {
          const ua = a.upvotes?.length ?? 0;
          const ub = b.upvotes?.length ?? 0;
          if (ub !== ua) return ub - ua;
          return (a.createdAt?.toMillis?.() ?? 0) - (b.createdAt?.toMillis?.() ?? 0);
        });
        const order = sortedStages.findIndex((s) => s.id === stage.id) + 1;
        sorted.forEach((q) => {
          ws.addRow([
            `${order}. ${stage.title}`,
            q.text,
            q.authorName,
            q.upvotes?.length ?? 0,
            q.answered ? '답변완료' : '미답변',
            q.answer ?? '',
          ]);
        });
      });
      autoSize(ws, [20, 45, 16, 10, 12, 45]);
    }
  }

  const buffer = await wb.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

/** 파일명으로 안전한 문자열 변환 */
function safeFileName(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, '_').slice(0, 80) || 'board';
}

/** 보드 엑셀을 생성해 즉시 다운로드한다. */
export async function downloadBoardExcel(data: BoardExcelData): Promise<void> {
  const blob = await buildBoardWorkbook(data);
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${safeFileName(data.board.title)}_${stamp}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // revoke는 클릭 직후 바로 하면 일부 브라우저에서 다운로드가 취소될 수 있어 약간 지연
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
