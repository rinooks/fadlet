import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
};

// 브라우저에서 필수 환경변수 누락 시 경고 (무증상 장애 방지)
if (typeof window !== 'undefined') {
  if (!firebaseConfig.apiKey) {
    console.error('[firebase] NEXT_PUBLIC_FIREBASE_API_KEY가 없습니다. Firebase가 초기화되지 않습니다.');
  } else if (!firebaseConfig.databaseURL) {
    console.error('[firebase] NEXT_PUBLIC_FIREBASE_DATABASE_URL이 없습니다. 실시간 접속자 수가 동작하지 않습니다.');
  }
}

// apiKey가 없으면(빌드 타임 SSR) 초기화 건너뜀
const app = firebaseConfig.apiKey
  ? getApps().length ? getApp() : initializeApp(firebaseConfig)
  : null;

export const auth = app ? getAuth(app) : (null as unknown as ReturnType<typeof getAuth>);
export const db = app ? getFirestore(app) : (null as unknown as ReturnType<typeof getFirestore>);
export const storage = app ? getStorage(app) : (null as unknown as ReturnType<typeof getStorage>);
export const rtdb = app && firebaseConfig.databaseURL
  ? getDatabase(app)
  : (null as unknown as ReturnType<typeof getDatabase>);
