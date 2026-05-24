import type { KanbanColumn, PostColor } from './types';

/** 새 컬럼 추가 시 회전 부여하는 기본 팔레트 (Tailwind 600-level, 채도 한 단계 낮춤) */
export const KANBAN_PALETTE: { color: string; postColor: PostColor }[] = [
  { color: '#475569', postColor: 'gray' },     // slate-600
  { color: '#0284C7', postColor: 'blue' },     // sky-600
  { color: '#059669', postColor: 'green' },    // emerald-600
  { color: '#D97706', postColor: 'yellow' },   // amber-600
  { color: '#DB2777', postColor: 'pink' },     // pink-600
  { color: '#7C3AED', postColor: 'purple' },   // violet-600
  { color: '#F43F5E', postColor: 'pink' },     // rose-500 (워밍 톤)
  { color: '#0D9488', postColor: 'green' },    // teal-600
  { color: '#EA580C', postColor: 'yellow' },   // orange-600
  { color: '#4F46E5', postColor: 'blue' },     // indigo-600
];

export const DEFAULT_KANBAN_COLUMNS: KanbanColumn[] = [
  { id: 'todo', label: '📝 할 일', headerColor: '#64748B', defaultPostColor: 'gray' },    // slate-500
  { id: 'doing', label: '🔄 진행 중', headerColor: '#0284C7', defaultPostColor: 'blue' }, // sky-600
  { id: 'done', label: '✅ 완료', headerColor: '#059669', defaultPostColor: 'green' },    // emerald-600
];

export const DEFAULT_CATEGORY_COLUMNS: KanbanColumn[] = [
  { id: 'cat-1', label: '카테고리 1', headerColor: '#0284C7', defaultPostColor: 'blue' },   // sky-600
  { id: 'cat-2', label: '카테고리 2', headerColor: '#059669', defaultPostColor: 'green' },  // emerald-600
  { id: 'cat-3', label: '카테고리 3', headerColor: '#D97706', defaultPostColor: 'yellow' }, // amber-600
];

export function genKanbanColumnId(): string {
  return `col-${Math.random().toString(36).slice(2, 10)}`;
}

export function nextPaletteEntry(existingCount: number) {
  return KANBAN_PALETTE[existingCount % KANBAN_PALETTE.length];
}
