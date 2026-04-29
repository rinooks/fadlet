# Deployment Guide

> Fadlet의 개발 환경 셋업부터 프로덕션 배포까지 전 과정. **Phase 1 시작 전에 이 문서대로 환경을 구축**한다.

---

## 🛠 사전 준비

### 필수 계정
- [ ] GitHub 계정
- [ ] Vercel 계정 (GitHub 연동)
- [ ] Firebase 계정 (Google 계정으로 로그인)
- [ ] 토스페이먼츠 계정 (Phase 3에서)

### 로컬 환경
- [ ] Node.js 20+ (LTS)
- [ ] pnpm 9+ (`npm install -g pnpm`)
- [ ] Firebase CLI (`npm install -g firebase-tools`)
- [ ] Git

---

## 1️⃣ Firebase 프로젝트 셋업

### 프로젝트 생성
1. [Firebase Console](https://console.firebase.google.com) 접속
2. "프로젝트 추가" → 이름: `fadlet-prod` (또는 원하는 이름)
3. Google Analytics: **비활성화** (Phase 3에서 Vercel Analytics 사용)

### 서비스 활성화

#### Firestore
1. 좌측 메뉴 "Firestore Database" → "데이터베이스 만들기"
2. **프로덕션 모드** 선택
3. 위치: `asia-northeast3` (서울)
4. 보안 규칙은 임시로 모두 차단된 상태로 시작

#### Authentication
1. 좌측 메뉴 "Authentication" → "시작하기"
2. 로그인 방법 활성화:
   - **익명** ✅ (Phase 1)
   - **Google** ✅ (Phase 1, 운영자 로그인)
   - 이메일/비밀번호 (Phase 2 이후 필요 시)

#### Storage (Phase 2부터)
1. "Storage" → "시작하기"
2. 위치: `asia-northeast3`

### 웹 앱 등록
1. 프로젝트 설정 (⚙️ 아이콘) → "내 앱" → "웹 앱 추가" (`</>`)
2. 앱 닉네임: `Fadlet Web`
3. **Firebase Hosting 설정 체크 해제** (Vercel 사용)
4. 다음 정보를 메모해 둔다:
   ```
   apiKey
   authDomain
   projectId
   storageBucket
   messagingSenderId
   appId
   ```

### Firebase CLI 로그인
```bash
firebase login
firebase use --add
# 프로젝트 선택 → alias: default
```

---

## 2️⃣ GitHub 저장소 셋업

### 저장소 생성
```bash
# GitHub에서 저장소 생성 (예: github.com/[username]/fadlet)
# Visibility: Private 권장

# 로컬에서
mkdir fadlet && cd fadlet
git init
git remote add origin https://github.com/[username]/fadlet.git
```

### 브랜치 전략
```
main      → 프로덕션 (Vercel 자동 배포)
develop   → 개발 메인
feature/* → 기능 개발
fix/*     → 버그 수정
```

### `.gitignore`
```gitignore
# 의존성
node_modules/
.pnpm-store/

# Next.js
.next/
out/
build/

# 환경변수 (절대 커밋 금지)
.env
.env.local
.env*.local

# 에디터
.vscode/
.idea/
*.swp

# 로그
*.log
npm-debug.log*
pnpm-debug.log*

# OS
.DS_Store
Thumbs.db

# Firebase
.firebase/
firebase-debug.log

# 빌드 산출물
dist/
*.tsbuildinfo
next-env.d.ts
```

---

## 3️⃣ Next.js 프로젝트 초기화

### 프로젝트 생성
```bash
pnpm create next-app@latest fadlet --typescript --tailwind --app --src-dir=false --import-alias="@/*"
cd fadlet
```

### 핵심 의존성 설치
```bash
# Firebase
pnpm add firebase

# UI
pnpm add lucide-react
pnpm add class-variance-authority clsx tailwind-merge
pnpm add @radix-ui/react-dialog @radix-ui/react-dropdown-menu

# 상태·검증
pnpm add zustand zod @tanstack/react-query

# 개발 의존성
pnpm add -D @types/node @types/react @types/react-dom
```

### shadcn/ui 셋업
```bash
pnpm dlx shadcn@latest init
# Style: Default
# Color: Slate (또는 Custom)
# CSS variables: Yes
```

### Pretendard 폰트 (Tailwind 통합)
`app/layout.tsx`에 추가:
```tsx
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }) {
  return (
    <html lang="ko" className={inter.className}>
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

`tailwind.config.ts`:
```typescript
fontFamily: {
  sans: ['Pretendard Variable', 'Pretendard', 'Inter', 'sans-serif'],
},
```

---

## 4️⃣ 환경변수 설정

### `.env.example` 작성 (커밋 OK)
```bash
# Firebase Client
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin (Server Actions, Phase 3+)
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=
FIREBASE_ADMIN_PROJECT_ID=

# 토스페이먼츠 (Phase 3+)
TOSS_CLIENT_KEY=
TOSS_SECRET_KEY=
TOSS_WEBHOOK_SECRET=

# 기타
NEXT_PUBLIC_SITE_URL=https://fadlet.io
```

### `.env.local` 작성 (커밋 절대 금지)
실제 값을 입력. Firebase Console에서 복사.

### `lib/firebase/client.ts`
```typescript
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
```

---

## 5️⃣ Firebase 보안 규칙 배포

### 디렉토리 구조
```
fadlet/
├─ firebase.json
├─ firestore.rules
├─ firestore.indexes.json
└─ storage.rules
```

### `firebase.json`
```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "storage": {
    "rules": "storage.rules"
  }
}
```

### 보안 규칙 작성
- `firestore.rules`: [`docs/data-schema.md`](./data-schema.md) 참조
- `storage.rules`: [`docs/data-schema.md`](./data-schema.md) 참조

### 배포
```bash
# Firestore 규칙·인덱스 배포
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes

# Storage 규칙 배포
firebase deploy --only storage
```

---

## 6️⃣ Vercel 배포

### 저장소 연결
1. [Vercel Dashboard](https://vercel.com/dashboard) → "Add New" → "Project"
2. GitHub 저장소 import → `fadlet` 선택
3. Framework Preset: **Next.js** (자동 감지)
4. Root Directory: `./` (기본값)

### 환경 변수 설정
Vercel 프로젝트 설정 → Environment Variables:

```
NEXT_PUBLIC_FIREBASE_API_KEY              [값 입력]
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN          [값 입력]
NEXT_PUBLIC_FIREBASE_PROJECT_ID           [값 입력]
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET       [값 입력]
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID  [값 입력]
NEXT_PUBLIC_FIREBASE_APP_ID               [값 입력]
NEXT_PUBLIC_SITE_URL                      https://fadlet.vercel.app
```

**환경 분리**:
- `Production`: main 브랜치 → 실제 Firebase 프로덕션
- `Preview`: 모든 PR → 동일 Firebase 또는 별도 dev 프로젝트
- `Development`: 로컬 (`vercel env pull` 사용 가능)

### 배포 트리거
- `main` 푸시 → 프로덕션 자동 배포
- PR 생성 → 프리뷰 URL 자동 생성

### 도메인 연결 (선택)
1. Vercel 프로젝트 → Domains → 커스텀 도메인 추가 (예: `fadlet.io`)
2. DNS A 레코드: `76.76.21.21`
3. CNAME: `cname.vercel-dns.com`

### Firebase Auth 도메인 추가
프로덕션 도메인 사용 시:
1. Firebase Console → Authentication → Settings → Authorized domains
2. 도메인 추가: `fadlet.vercel.app`, `fadlet.io`

---

## 7️⃣ 로컬 개발 환경

### 첫 실행
```bash
# 1. 환경변수 복사
cp .env.example .env.local
# .env.local 파일에 실제 값 입력

# 2. 의존성 설치
pnpm install

# 3. 개발 서버 실행
pnpm dev
# http://localhost:3000
```

### Firebase 에뮬레이터 (옵션)
로컬에서 안전하게 개발하고 싶을 때:
```bash
firebase init emulators
# Firestore, Auth, Storage 선택

firebase emulators:start
# Firestore: http://localhost:8080
# Auth: http://localhost:9099
# Emulator UI: http://localhost:4000
```

`lib/firebase/client.ts`에 에뮬레이터 연결 추가:
```typescript
if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_EMULATORS === 'true') {
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectStorageEmulator(storage, 'localhost', 9199);
}
```

---

## 8️⃣ CI/CD 워크플로우

### GitHub Actions (선택)
`.github/workflows/checks.yml`:
```yaml
name: Quality Checks

on:
  pull_request:
    branches: [main, develop]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm type-check
      - run: pnpm test  # Phase 2+
```

### 자동 배포
Vercel이 GitHub 연동을 통해 자동 처리. 별도 설정 불필요.

---

## 9️⃣ 모니터링 (Phase 3에서)

### Sentry 설치
```bash
pnpm add @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

### Vercel Analytics
```bash
pnpm add @vercel/analytics
```

`app/layout.tsx`:
```tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

---

## 🔧 트러블슈팅

### "Firebase: Error (auth/unauthorized-domain)"
→ Firebase Console → Authentication → Authorized domains에 도메인 추가

### "Missing or insufficient permissions"
→ Firestore 규칙이 차단 중. `firestore.rules` 확인 후 재배포:
```bash
firebase deploy --only firestore:rules
```

### Vercel 빌드 실패
→ 로그 확인:
1. 환경변수 누락 여부
2. TypeScript 에러
3. 의존성 lock 파일 충돌

### "Firestore index required"
→ 콘솔 에러 메시지의 링크 클릭 → 자동 인덱스 생성

---

## 📋 셋업 완료 체크리스트

### 환경
- [ ] Firebase 프로젝트 생성 (Firestore, Auth 활성화)
- [ ] 웹 앱 등록 + API 키 확보
- [ ] GitHub 저장소 생성 + 첫 커밋
- [ ] Vercel 연결 + 환경변수 설정
- [ ] 로컬 개발 서버 정상 실행

### 코드
- [ ] Next.js 14 프로젝트 초기화
- [ ] Tailwind + shadcn/ui 설정
- [ ] Pretendard 폰트 적용
- [ ] Firebase 클라이언트 설정 (`lib/firebase/client.ts`)
- [ ] `.env.example` 작성

### 보안
- [ ] `firestore.rules` 작성 및 배포
- [ ] `storage.rules` 작성 (Phase 2+)
- [ ] `.env.local`이 `.gitignore`에 포함
- [ ] Vercel 환경변수에 모든 키 입력

### 배포
- [ ] main 푸시 → Vercel 프로덕션 배포 성공
- [ ] PR 생성 → 프리뷰 URL 작동
- [ ] 프로덕션에서 Firebase 연결 확인

---

## 🎯 다음 단계

배포 환경이 준비되었다면, [`docs/01-phase1-mvp.md`](./01-phase1-mvp.md)로 가서 첫 기능 개발을 시작한다.
