import type { BoardTemplate, PostColor } from './types';

export interface TemplateColumn {
  id: string;
  label: string;
  headerClass: string;
  defaultColor: PostColor;
}

export interface TemplateDefinition {
  id: BoardTemplate;
  label: string;
  description: string;
  emoji: string;
  columns: TemplateColumn[] | null;
  gridCols?: number;
  showFlow?: boolean;
}

export const TEMPLATES: TemplateDefinition[] = [
  {
    id: 'brainstorming',
    label: '브레인스토밍',
    description: '제약 없이 아이디어를 자유롭게 쏟아냅니다.',
    emoji: '💡',
    columns: null,
  },
  {
    id: 'canvas',
    label: '캔버스',
    description: '포스트를 원하는 위치에 자유롭게 배치합니다.',
    emoji: '🗺️',
    columns: null,
  },
  {
    id: 'proscons',
    label: '찬성 / 반대',
    description: '주제에 대한 찬성과 반대 의견을 나눕니다.',
    emoji: '⚖️',
    columns: [
      { id: 'pros', label: '👍 찬성', headerClass: 'bg-green-500 text-white', defaultColor: 'green' },
      { id: 'cons', label: '👎 반대', headerClass: 'bg-red-500 text-white', defaultColor: 'pink' },
    ],
  },
  {
    id: 'kanban',
    label: '칸반',
    description: '할 일 · 진행 중 · 완료로 작업 흐름을 시각화합니다.',
    emoji: '🗂️',
    columns: [
      { id: 'todo', label: '📝 할 일', headerClass: 'bg-gray-500 text-white', defaultColor: 'gray' },
      { id: 'doing', label: '🔄 진행 중', headerClass: 'bg-blue-500 text-white', defaultColor: 'blue' },
      { id: 'done', label: '✅ 완료', headerClass: 'bg-green-500 text-white', defaultColor: 'green' },
    ],
  },
  {
    id: 'kpt',
    label: 'KPT 회고',
    description: 'Keep · Problem · Try 세 가지로 팀을 돌아봅니다.',
    emoji: '🔄',
    columns: [
      { id: 'keep', label: '💚 Keep', headerClass: 'bg-green-500 text-white', defaultColor: 'green' },
      { id: 'problem', label: '🔴 Problem', headerClass: 'bg-red-500 text-white', defaultColor: 'pink' },
      { id: 'try', label: '🔵 Try', headerClass: 'bg-indigo-500 text-white', defaultColor: 'blue' },
    ],
  },
  {
    id: '4f',
    label: '4F 회고',
    description: '관찰 → 감정 → 발견 → 액션의 시간 흐름으로 경험을 회고합니다.',
    emoji: '📋',
    showFlow: true,
    columns: [
      { id: 'fact', label: '📌 Fact (사실)', headerClass: 'bg-slate-500 text-white', defaultColor: 'gray' },
      { id: 'feeling', label: '💛 Feeling (감정)', headerClass: 'bg-amber-500 text-white', defaultColor: 'yellow' },
      { id: 'finding', label: '💡 Finding (발견)', headerClass: 'bg-orange-500 text-white', defaultColor: 'purple' },
      { id: 'future', label: '🚀 Future (액션)', headerClass: 'bg-indigo-600 text-white', defaultColor: 'blue' },
    ],
  },
  {
    id: 'qna',
    label: 'Q&A',
    description: '질문과 답변을 나란히 모읍니다.',
    emoji: '❓',
    columns: [
      { id: 'question', label: '❓ 질문', headerClass: 'bg-purple-500 text-white', defaultColor: 'purple' },
      { id: 'answer', label: '✅ 답변', headerClass: 'bg-green-500 text-white', defaultColor: 'green' },
    ],
  },
  {
    id: 'nineWindow',
    label: '9칸 윈도우 (TRIZ)',
    description: '시간(과거·현재·미래) × 레벨(상위·시스템·하위)로 9개 영역을 탐색합니다.',
    emoji: '🔲',
    columns: [
      { id: 'cell-1', label: '과거 · 상위', headerClass: 'bg-indigo-50 text-indigo-700 border border-indigo-200', defaultColor: 'blue' },
      { id: 'cell-2', label: '현재 · 상위', headerClass: 'bg-indigo-50 text-indigo-700 border border-indigo-200', defaultColor: 'blue' },
      { id: 'cell-3', label: '미래 · 상위', headerClass: 'bg-indigo-50 text-indigo-700 border border-indigo-200', defaultColor: 'blue' },
      { id: 'cell-4', label: '과거 · 시스템', headerClass: 'bg-indigo-50 text-indigo-700 border border-indigo-200', defaultColor: 'blue' },
      { id: 'center', label: '🎯 현재 · 시스템', headerClass: 'bg-indigo-600 text-white', defaultColor: 'blue' },
      { id: 'cell-6', label: '미래 · 시스템', headerClass: 'bg-indigo-50 text-indigo-700 border border-indigo-200', defaultColor: 'blue' },
      { id: 'cell-7', label: '과거 · 하위', headerClass: 'bg-indigo-50 text-indigo-700 border border-indigo-200', defaultColor: 'blue' },
      { id: 'cell-8', label: '현재 · 하위', headerClass: 'bg-indigo-50 text-indigo-700 border border-indigo-200', defaultColor: 'blue' },
      { id: 'cell-9', label: '미래 · 하위', headerClass: 'bg-indigo-50 text-indigo-700 border border-indigo-200', defaultColor: 'blue' },
    ],
    gridCols: 3,
  },
];

export function getTemplate(id: BoardTemplate): TemplateDefinition {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}
