#!/usr/bin/env node
/**
 * 업데이트 노트 목록 조회 (개발용 — 게시/초안 상태 한눈에 확인)
 *   node scripts/list-update-notes.mjs
 */

import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { cert, getApps, initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'fadlet-reference';

function findCredentials() {
  const envPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (envPath && existsSync(envPath)) return envPath;
  const candidates = [
    resolve(process.cwd(), 'fadlet-admin-key.json'),
    resolve(process.cwd(), '..', 'fadlet-admin-key.json'),
  ];
  for (const p of candidates) if (existsSync(p)) return p;
  return null;
}

if (getApps().length === 0) {
  const credPath = findCredentials();
  if (credPath) initializeApp({ credential: cert(credPath), projectId: PROJECT_ID });
  else initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID });
}

const snap = await getFirestore().collection('updateNotes').orderBy('createdAt', 'desc').get();
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
