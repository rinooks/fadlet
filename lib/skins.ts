import type { BoardSkin } from '@/lib/types';

export interface SkinMeta {
  id: BoardSkin;
  label: string;
  description: string;
  swatch: string[];
}

export const SKINS: SkinMeta[] = [
  {
    id: 'standard',
    label: 'Standard',
    description: 'Linear 절제 톤. 무채색 베이스 + 인디고 액센트.',
    swatch: ['#FAFAF9', '#FFFFFF', '#6366F1'],
  },
  {
    id: 'dense',
    label: 'Compact',
    description: '여백을 줄이고 보더를 살린 고밀도 화면.',
    swatch: ['#F4F4F5', '#FFFFFF', '#4F46E5'],
  },
  {
    id: 'glass',
    label: 'Glass',
    description: '반투명 패널과 인디고~퍼플 그라데이션 액센트.',
    swatch: ['#F6F5FA', '#A855F7', '#6366F1'],
  },
  {
    id: 'brutal',
    label: 'Brutal',
    description: '굵은 보더와 하드 그림자, 비비드 컬러.',
    swatch: ['#FACC15', '#F472B6', '#0A0A0A'],
  },
];

export function getSkinMeta(id?: BoardSkin | null): SkinMeta {
  return SKINS.find((s) => s.id === id) ?? SKINS[0];
}
