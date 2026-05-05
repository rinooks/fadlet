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
  {
    id: 'swiss',
    label: 'Swiss',
    description: '스위스 스타일. 그리드, 강한 활자, 레드 액센트.',
    swatch: ['#FFFFFF', '#DA291C', '#0A0A0A'],
  },
  {
    id: 'glassmorphism',
    label: 'Glassmorphism',
    description: '진한 블러와 반투명 패널, 비비드 그라데이션 배경.',
    swatch: ['#F472B6', '#22D3EE', '#A855F7'],
  },
  {
    id: 'skeuomorphism',
    label: 'Skeuomorphism',
    description: '리넨 텍스처와 광택 버튼. 사실적인 입체감과 베벨.',
    swatch: ['#D7D2C8', '#5B95E5', '#FFF8E8'],
  },
  {
    id: 'terminal',
    label: 'Terminal',
    description: '레트로 CRT 터미널. 인광 그린, 모노스페이스, 글로우.',
    swatch: ['#0A0E0A', '#4AFF4A', '#FFB000'],
  },
];

export function getSkinMeta(id?: BoardSkin | null): SkinMeta {
  return SKINS.find((s) => s.id === id) ?? SKINS[0];
}
