#!/usr/bin/env node
/**
 * Fadlet 업데이트 노트 추가 CLI
 *
 * 사용 예 (두 본문 분리):
 *   node scripts/add-update-note.mjs \
 *     --title="칸반 컬럼 편집 UX 개선" \
 *     --version="v0.6.1" \
 *     --user-body="- 칸반 보드에서 컬럼 이름과 색상을 바로 바꿀 수 있어요" \
 *     --dev-body="- KanbanColumnEditor 인라인화 (components/board/kanban-column-editor.tsx)" \
 *     --published=false
 *
 * - --user-body : 사용자에게 노출될 본문 (랜딩/updates 페이지) — 필수
 * - --dev-body  : 관리자에게만 노출될 기술 메모 — 선택
 * - --published : 기본 false. 초안으로 저장 후 /admin에서 게시
 *
 * 인증 (둘 중 하나):
 *   1) 서비스 계정 키 파일을 D:/vibe/fadlet-admin-key.json 에 두면 자동 인식
 *   2) GOOGLE_APPLICATION_CREDENTIALS 환경 변수로 경로 지정
 *   3) gcloud auth application-default login (1회 설정)
 */

import { parseArgs } from 'node:util';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { cert, getApps, initializeApp, applicationDefault } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'fadlet-reference';
const SUPER_ADMIN_UID = process.env.FADLET_SUPER_ADMIN_UID || 'cli-script';

function parseBool(v) {
  if (typeof v !== 'string') return false;
  const lower = v.toLowerCase();
  return lower === 'true' || lower === '1' || lower === 'y' || lower === 'yes';
}

const { values } = parseArgs({
  options: {
    title: { type: 'string' },
    'user-body': { type: 'string' },
    'dev-body': { type: 'string' },
    body: { type: 'string' }, // deprecated alias → user-body
    version: { type: 'string' },
    published: { type: 'string', default: 'false' },
    help: { type: 'boolean', short: 'h' },
  },
});

if (values.help) {
  console.log(`Usage:
  node scripts/add-update-note.mjs --title="제목" --user-body="사용자용" [--dev-body="개발자용"] [--version=v0.6.1] [--published=true|false]

옵션:
  --title       (필수) 노트 제목
  --user-body   (필수) 사용자용 본문 — 랜딩/updates 페이지에 노출
  --dev-body    (선택) 개발자용 본문 — 관리자에게만 보이는 기술 메모
  --version     (선택) 표시용 버전 라벨 (예: v0.6.0)
  --published   (선택) 기본 false — 초안 저장. /admin에서 게시 토글
  --body        (deprecated) --user-body 의 별칭. 단독 사용 시 사용자용으로 적용
`);
  process.exit(0);
}

const rawUserBody = values['user-body'] ?? values.body;

if (!values.title || !rawUserBody) {
  console.error('✗ --title 과 --user-body 는 필수입니다. --help 참고.');
  process.exit(1);
}

function findCredentials() {
  // 1순위: 환경 변수
  const envPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (envPath && existsSync(envPath)) return { path: envPath, source: 'env' };

  // 2순위: 표준 경로 (프로젝트 루트 또는 부모 디렉토리)
  const candidates = [
    resolve(process.cwd(), 'fadlet-admin-key.json'),
    resolve(process.cwd(), '..', 'fadlet-admin-key.json'),
  ];
  for (const p of candidates) {
    if (existsSync(p)) return { path: p, source: 'fallback' };
  }
  return null;
}

function initAdmin() {
  if (getApps().length > 0) return;
  const found = findCredentials();
  if (found) {
    initializeApp({ credential: cert(found.path), projectId: PROJECT_ID });
    if (found.source === 'fallback') {
      console.log(`✓ 인증 키 자동 발견: ${found.path}`);
    }
  } else {
    // ADC fallback — gcloud auth application-default login
    initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID });
  }
}

try {
  initAdmin();
} catch (err) {
  console.error('✗ firebase-admin 초기화 실패. ADC 설정을 확인하세요.');
  console.error('  → gcloud auth application-default login');
  console.error(`  → 또는 GOOGLE_APPLICATION_CREDENTIALS=<service-account.json> 환경 변수 지정`);
  console.error(`\n원본 오류: ${err?.message ?? err}`);
  process.exit(1);
}

const db = getFirestore();
const isPublished = parseBool(values.published);
const userBody = String(rawUserBody).replace(/\\n/g, '\n');
const devBodyRaw = values['dev-body'];
const devBody = devBodyRaw ? String(devBodyRaw).replace(/\\n/g, '\n').trim() : null;

const payload = {
  title: String(values.title).trim(),
  userBody,
  devBody: devBody || null,
  version: values.version ? String(values.version).trim() : null,
  isPublished,
  publishedAt: isPublished ? FieldValue.serverTimestamp() : null,
  createdBy: SUPER_ADMIN_UID,
  createdAt: FieldValue.serverTimestamp(),
  updatedAt: FieldValue.serverTimestamp(),
};

try {
  const ref = await db.collection('updateNotes').add(payload);
  console.log(`✓ 업데이트 노트 추가됨 — id=${ref.id} (${isPublished ? '게시됨' : '초안'})`);
  console.log(`  제목: ${payload.title}`);
  if (payload.version) console.log(`  버전: ${payload.version}`);
  if (!isPublished) console.log('  /admin → 업데이트 노트 탭에서 [게시] 버튼으로 공개 전환하세요.');
  process.exit(0);
} catch (err) {
  console.error('✗ Firestore 쓰기 실패:', err?.message ?? err);
  process.exit(1);
}
