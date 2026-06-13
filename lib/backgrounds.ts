import type { BoardBackground } from './types';

export interface BackgroundDefinition {
  id: BoardBackground;
  label: string;
  /** 보드 메인 영역에 적용되는 인라인 스타일 */
  style: React.CSSProperties;
  /** 작은 미리보기 스와치용 스타일 */
  preview: React.CSSProperties;
}

const DOT_PATTERN: React.CSSProperties = {
  backgroundImage: 'radial-gradient(circle, rgba(15,23,42,0.12) 1px, transparent 1px)',
  backgroundSize: '20px 20px',
};

const GRID_PATTERN: React.CSSProperties = {
  backgroundImage:
    'linear-gradient(rgba(15,23,42,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.06) 1px, transparent 1px)',
  backgroundSize: '24px 24px',
};

const PAPER_PATTERN: React.CSSProperties = {
  backgroundColor: '#f4ecd8',
  backgroundImage:
    'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.4) 0%, transparent 40%), radial-gradient(circle at 80% 70%, rgba(0,0,0,0.04) 0%, transparent 50%)',
};

export const DEFAULT_CUSTOM_COLOR = '#FDE68A';

export const BACKGROUNDS: BackgroundDefinition[] = [
  {
    id: 'plain',
    label: '기본',
    style: { backgroundColor: '#F9FAFB' },
    preview: { backgroundColor: '#F9FAFB' },
  },
  {
    id: 'dots',
    label: '도트',
    style: { backgroundColor: '#FAFAFB', ...DOT_PATTERN },
    preview: { backgroundColor: '#FAFAFB', ...DOT_PATTERN, backgroundSize: '8px 8px' },
  },
  {
    id: 'grid',
    label: '격자',
    style: { backgroundColor: '#FAFAFB', ...GRID_PATTERN },
    preview: { backgroundColor: '#FAFAFB', ...GRID_PATTERN, backgroundSize: '8px 8px' },
  },
  {
    id: 'paper',
    label: '종이',
    style: PAPER_PATTERN,
    preview: PAPER_PATTERN,
  },
  {
    id: 'mint',
    label: '민트',
    // backgroundImage: 'none' — 스킨(glass/brutal 등)이 .skin-root에 칠한 배경 이미지를 덮어 단색이 보이게 한다.
    style: { backgroundColor: '#E8F5F0', backgroundImage: 'none' },
    preview: { backgroundColor: '#E8F5F0' },
  },
  {
    id: 'lavender',
    label: '라벤더',
    style: { backgroundColor: '#EFEAF7', backgroundImage: 'none' },
    preview: { backgroundColor: '#EFEAF7' },
  },
  {
    id: 'cream',
    label: '크림',
    style: { backgroundColor: '#FFF8EC', backgroundImage: 'none' },
    preview: { backgroundColor: '#FFF8EC' },
  },
  {
    id: 'custom',
    label: '커스텀',
    style: { backgroundColor: DEFAULT_CUSTOM_COLOR, backgroundImage: 'none' },
    preview: { backgroundColor: DEFAULT_CUSTOM_COLOR },
  },
];

export function getBackground(id: BoardBackground | undefined, customColor?: string): BackgroundDefinition {
  const def = BACKGROUNDS.find((b) => b.id === id) ?? BACKGROUNDS[0];
  if (def.id === 'custom' && customColor) {
    return {
      ...def,
      style: { backgroundColor: customColor, backgroundImage: 'none' },
      preview: { backgroundColor: customColor },
    };
  }
  return def;
}
