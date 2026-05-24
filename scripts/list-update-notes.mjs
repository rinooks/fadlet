#!/usr/bin/env node
/**
 * 업데이트 노트 목록 조회 (개발용 — 게시/초안 상태 한눈에 확인)
 *   node scripts/list-update-notes.mjs
 */

import { COLLECTION_UPDATE_NOTES, initFirestore } from './lib/admin-init.mjs';

const db = initFirestore();
const snap = await db.collection(COLLECTION_UPDATE_NOTES).orderBy('createdAt', 'desc').get();

console.log(`\n총 ${snap.size}개 노트:\n`);
for (const d of snap.docs) {
  const n = d.data();
  const status = n.isPublished ? '[게시됨]' : '[초안]  ';
  const ver = n.version ? ` ${n.version}` : '';
  const hasUser = n.userBody?.trim() ? '✓' : ' ';
  const hasDev = n.devBody?.trim() ? '✓' : ' ';
  console.log(`${status}${ver}  ${n.title}`);
  console.log(`         id=${d.id}  사용자용:${hasUser}  개발자용:${hasDev}`);
}
process.exit(0);
