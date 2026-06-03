import { collection, getDocs, query, where } from 'firebase/firestore';
import { toast } from 'sonner';
import { db } from '@/lib/firebase/client';
import { boardsPath } from '@/lib/firebase/collections';

export const FREE_TIER_WORKSPACE_LIMIT = 1;
export const FREE_TIER_BOARDS_PER_WORKSPACE = 3;
export const UPGRADE_CONTACT_EMAIL = 'pjh@referencehrd.com';

/** 무료 한도 초과로 보드 생성/복제가 거부될 때 throw하는 에러 코드. */
export const FREE_TIER_LIMIT_CODE = 'FREE_TIER_LIMIT';

/**
 * 워크스페이스의 보드 수가 무료 한도 이상인지 확인.
 * 주의: 클라이언트 측 best-effort 체크다. 동시 생성(TOCTOU)을 완전히 막으려면
 * 서버(Cloud Function 카운터 + 규칙) 강제가 필요하다.
 */
export async function isBoardQuotaReached(workspaceId: string): Promise<boolean> {
  const snap = await getDocs(
    query(collection(db, boardsPath()), where('workspaceId', '==', workspaceId)),
  );
  return snap.size >= FREE_TIER_BOARDS_PER_WORKSPACE;
}

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
