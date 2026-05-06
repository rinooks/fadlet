import { toast } from 'sonner';

export const FREE_TIER_WORKSPACE_LIMIT = 1;
export const FREE_TIER_BOARDS_PER_WORKSPACE = 3;
export const UPGRADE_CONTACT_EMAIL = 'pjh@referencehrd.com';

type LimitReason = 'workspace' | 'board';

export function showUpgradeMessage(reason: LimitReason) {
  const limitText =
    reason === 'workspace'
      ? `무료 플랜에서는 워크스페이스를 ${FREE_TIER_WORKSPACE_LIMIT}개까지 만들 수 있어요.`
      : `무료 플랜에서는 워크스페이스당 보드 ${FREE_TIER_BOARDS_PER_WORKSPACE}개까지 만들 수 있어요.`;

  toast.message('유료 서비스 모델 준비중이에요', {
    description: `${limitText} 추가로 사용을 원하시면 ${UPGRADE_CONTACT_EMAIL} 으로 문의주세요.`,
    duration: 8000,
    action: {
      label: '메일 문의',
      onClick: () => {
        window.location.href = `mailto:${UPGRADE_CONTACT_EMAIL}?subject=Fadlet%20%EC%9C%A0%EB%A3%8C%20%EC%83%81%EB%8B%B4%20%EB%AC%B8%EC%9D%98`;
      },
    },
  });
}
