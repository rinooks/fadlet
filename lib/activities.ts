import type { ActivityType } from '@/lib/types';
import { TEMPLATES } from '@/lib/templates';

export type ActivityKind = 'board' | 'live';

export interface ActivityDefinition {
  id: ActivityType;
  kind: ActivityKind;
  emoji: string;
  label: string;
  description: string;
}

const LIVE_ACTIVITIES: ActivityDefinition[] = [
  {
    id: 'poll',
    kind: 'live',
    emoji: '📊',
    label: '라이브 폴',
    description: '객관식 질문에 실시간으로 응답을 모읍니다.',
  },
  {
    id: 'wordcloud',
    kind: 'live',
    emoji: '☁️',
    label: '워드클라우드',
    description: '한 단어/구문 응답을 모아 빈도수로 시각화합니다.',
  },
];

const BOARD_ACTIVITIES: ActivityDefinition[] = TEMPLATES.map((t) => ({
  id: t.id,
  kind: 'board' as const,
  emoji: t.emoji,
  label: t.label,
  description: t.description,
}));

export const ACTIVITIES: ActivityDefinition[] = [
  ...BOARD_ACTIVITIES,
  ...LIVE_ACTIVITIES,
];

export function getActivity(id: ActivityType): ActivityDefinition {
  return ACTIVITIES.find((a) => a.id === id) ?? ACTIVITIES[0];
}

export function isLiveActivity(id: ActivityType | undefined | null): boolean {
  if (!id) return false;
  return getActivity(id).kind === 'live';
}
