// 워크스페이스 컨텍스트 밴드(제목 위 색깔 띠) 테마 프리셋.
// Firestore에는 키(id)만 저장하고, 렌더 시 from/to HEX로 그라데이션을 구성한다.
// Tailwind 동적 클래스는 빌드 타임에 알 수 없으므로 인라인 스타일(linear-gradient)로 적용한다.

export interface WorkspaceTheme {
  id: string;
  label: string;
  /** 그라데이션 시작색 (왼쪽) */
  from: string;
  /** 그라데이션 끝색 (오른쪽) */
  to: string;
}

export const WORKSPACE_THEMES: WorkspaceTheme[] = [
  { id: 'indigo', label: '인디고', from: '#4f46e5', to: '#7c3aed' },
  { id: 'purple', label: '퍼플', from: '#9333ea', to: '#7e22ce' },
  { id: 'blue', label: '블루', from: '#2563eb', to: '#0891b2' },
  { id: 'sky', label: '스카이', from: '#0284c7', to: '#0ea5e9' },
  { id: 'teal', label: '틸', from: '#0d9488', to: '#10b981' },
  { id: 'green', label: '그린', from: '#16a34a', to: '#65a30d' },
  { id: 'amber', label: '앰버', from: '#d97706', to: '#f59e0b' },
  { id: 'orange', label: '오렌지', from: '#ea580c', to: '#f97316' },
  { id: 'rose', label: '로즈', from: '#e11d48', to: '#f43f5e' },
  { id: 'fuchsia', label: '푸시아', from: '#c026d3', to: '#db2777' },
];

export const DEFAULT_WORKSPACE_THEME_ID = 'indigo';

export function getWorkspaceTheme(id?: string): WorkspaceTheme {
  return (
    WORKSPACE_THEMES.find((t) => t.id === id) ??
    WORKSPACE_THEMES.find((t) => t.id === DEFAULT_WORKSPACE_THEME_ID) ??
    WORKSPACE_THEMES[0]
  );
}

/** 밴드 배경에 적용할 인라인 그라데이션 스타일 */
export function workspaceThemeGradient(theme: WorkspaceTheme): string {
  return `linear-gradient(to right, ${theme.from}, ${theme.to})`;
}

/** themeColor가 프리셋 키가 아니라 사용자가 직접 지정한 HEX 색상인지 판별 */
export function isCustomColor(value?: string): value is string {
  return typeof value === 'string' && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value);
}

/** HEX 색상을 amount(0~1)만큼 어둡게 — 커스텀 단색에서 그라데이션 끝색을 만들 때 사용 */
function darkenHex(hex: string, amount: number): string {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const num = parseInt(h, 16);
  const f = 1 - amount;
  const r = Math.round(((num >> 16) & 0xff) * f);
  const g = Math.round(((num >> 8) & 0xff) * f);
  const b = Math.round((num & 0xff) * f);
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

/** 사용자 지정 단색을 살짝 어두워지는 그라데이션으로 변환 */
export function customColorGradient(hex: string): string {
  return `linear-gradient(to right, ${hex}, ${darkenHex(hex, 0.18)})`;
}

/** themeColor(프리셋 키 또는 커스텀 HEX)를 밴드 배경 CSS로 해석 */
export function workspaceBandBackground(themeColor?: string): string {
  if (isCustomColor(themeColor)) return customColorGradient(themeColor);
  return workspaceThemeGradient(getWorkspaceTheme(themeColor));
}
