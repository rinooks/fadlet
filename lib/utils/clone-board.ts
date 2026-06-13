'use client';

import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { boardsPath } from '@/lib/firebase/collections';
import { FREE_TIER_LIMIT_CODE, isBoardQuotaReached } from '@/lib/free-tier';
import { generateBoardCode } from '@/lib/utils/generate-board-code';
import type { Board, Stage } from '@/lib/types';

interface CloneBoardParams {
  source: Board;
  ownerUid: string;
  /** 새 보드를 둘 워크스페이스. 미지정 시 source.workspaceId 사용. */
  workspaceId?: string;
  /** 제목 prefix. 기본값: "[복제] " */
  titlePrefix?: string;
  /** 슈퍼관리자 등 무료 한도 면제 대상이면 true. */
  bypassLimit?: boolean;
}

/**
 * 보드 메타데이터(stages, activityConfig, skin, kanbanColumns 등)를 복사해 새 보드를 만든다.
 * 포스트·메시지·라이브 응답 등 인스턴스 데이터는 복사하지 않는다 (원본 워크숍 결과 보존).
 */
export async function cloneBoard(params: CloneBoardParams): Promise<{ id: string; boardCode: string }> {
  const { source, ownerUid, workspaceId, titlePrefix = '[복제] ', bypassLimit = false } = params;
  const targetWs = workspaceId ?? source.workspaceId;

  // 무료 한도 체크 — 복제로 제한 우회 방지.
  if (!bypassLimit && targetWs !== 'demo' && (await isBoardQuotaReached(targetWs))) {
    throw new Error(FREE_TIER_LIMIT_CODE);
  }

  const boardCode = await generateBoardCode();

  // stages는 id를 새로 발급 — 원본과 충돌 방지.
  const stages: Stage[] = (source.stages ?? []).map((s, idx) => ({
    ...s,
    id: Math.random().toString(36).slice(2, 10),
    order: idx,
  }));

  const payload: Record<string, unknown> = {
    title: `${titlePrefix}${source.title}`.slice(0, 60),
    boardCode,
    template: source.template,
    mode: source.mode ?? 'single',
    skin: source.skin ?? 'standard',
    background: source.background ?? 'plain',
    ...(source.customBackgroundColor ? { customBackgroundColor: source.customBackgroundColor } : {}),
    ...(source.kanbanColumns ? { kanbanColumns: source.kanbanColumns } : {}),
    ownerId: ownerUid,
    workspaceId: targetWs,
    settings: {
      allowChat: source.settings?.allowChat ?? true,
      retainChatLog: source.settings?.retainChatLog ?? true,
      lockedAt: null,
      ...(source.settings?.showPostReactionCounts !== undefined
        ? { showPostReactionCounts: source.settings.showPostReactionCounts }
        : {}),
      ...(source.settings?.showPostTitle !== undefined
        ? { showPostTitle: source.settings.showPostTitle }
        : {}),
    },
    ...(stages.length ? { stages } : {}),
    ...(source.bannedWords?.length ? { bannedWords: source.bannedWords } : {}),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, boardsPath()), payload);
  return { id: docRef.id, boardCode };
}
