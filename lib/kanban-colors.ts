import type { KanbanColumn, PostColor } from './types';

/** 새 컬럼 추가 시 회전 부여하는 기본 팔레트 */
export const KANBAN_PALETTE: { color: string; postColor: PostColor }[] = [
  { color: '#6B7280', postColor: 'gray' },
  { color: '#3B82F6', postColor: 'blue' },
  { color: '#22C55E', postColor: 'green' },
  { color: '#F59E0B', postColor: 'yellow' },
  { color: '#EC4899', postColor: 'pink' },
  { color: '#8B5CF6', postColor: 'purple' },
  { color: '#EF4444', postColor: 'pink' },
  { color: '#14B8A6', postColor: 'green' },
  { color: '#F97316', postColor: 'yellow' },
  { color: '#6366F1', postColor: 'blue' },
];

export const DEFAULT_KANBAN_COLUMNS: KanbanColumn[] = [
  { id: 'todo', label: '📝 할 일', headerColor: '#6B7280', defaultPostColor: 'gray' },
  { id: 'doing', label: '🔄 진행 중', headerColor: '#3B82F6', defaultPostColor: 'blue' },
  { id: 'done', label: '✅ 완료', headerColor: '#22C55E', defaultPostColor: 'green' },
];

export const DEFAULT_CATEGORY_COLUMNS: KanbanColumn[] = [
  { id: 'cat-1', label: '🟦 카테고리 1', headerColor: '#3B82F6', defaultPostColor: 'blue' },
  { id: 'cat-2', label: '🟩 카테고리 2', headerColor: '#22C55E', defaultPostColor: 'green' },
  { id: 'cat-3', label: '🟧 카테고리 3', headerColor: '#F59E0B', defaultPostColor: 'yellow' },
];

export function genKanbanColumnId(): string {
  return `col-${Math.random().toString(36).slice(2, 10)}`;
}

export function nextPaletteEntry(existingCount: number) {
  return KANBAN_PALETTE[existingCount % KANBAN_PALETTE.length];
}
