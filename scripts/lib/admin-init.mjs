import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

export const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'fadlet-reference';
export const COLLECTION_UPDATE_NOTES = 'updateNotes';

function findCredentials() {
  const envPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (envPath && existsSync(envPath)) return { path: envPath, source: 'env' };
  const candidates = [
    resolve(process.cwd(), 'fadlet-admin-key.json'),
    resolve(process.cwd(), '..', 'fadlet-admin-key.json'),
  ];
  for (const p of candidates) {
    if (existsSync(p)) return { path: p, source: 'fallback' };
  }
  return null;
}

/** firebase-admin 초기화 + Firestore 인스턴스 반환. 인증 실패 시 process.exit(1). */
export function initFirestore({ verbose = false } = {}) {
  if (getApps().length === 0) {
    const found = findCredentials();
    try {
      if (found) {
        initializeApp({ credential: cert(found.path), projectId: PROJECT_ID });
        if (verbose && found.source === 'fallback') {
          console.log(`✓ 인증 키 자동 발견: ${found.path}`);
        }
      } else {
        initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID });
      }
    } catch (err) {
      console.error('✗ firebase-admin 초기화 실패. ADC 설정을 확인하세요.');
      console.error('  → gcloud auth application-default login');
      console.error(`  → 또는 GOOGLE_APPLICATION_CREDENTIALS=<service-account.json> 환경 변수 지정`);
      console.error(`\n원본 오류: ${err?.message ?? err}`);
      process.exit(1);
    }
  }
  return getFirestore();
}
