# CLAUDE.md

> 이 문서는 Claude Code가 Fadlet 프로젝트 작업 시 **모든 세션에서 가장 먼저 읽어야 할 컨벤션**을 정의한다. Phase별 상세 사양은 `docs/` 폴더 참조.

---

## 🎯 프로젝트 정체성

**Fadlet = Facilitator-friendly Padlet**
- 한 문장 정의: "워크숍 운영자를 위한 협업 보드 SaaS"
- 핵심 차별화: **운영자 관점**의 기능 (타이머, 단계 진행, 채팅 모더레이션)
- 타겟 시장: 한국 기업교육 HRD 부서

이 정체성과 충돌하는 결정을 내리지 말 것. 모든 기능 결정은 "운영자에게 도움이 되는가?"를 먼저 묻는다.

---

## 🛠 기술 스택 (고정)

```
Framework      Next.js 14 (App Router) + TypeScript
Styling        Tailwind CSS + shadcn/ui
State          React Server Components + Zustand (클라이언트 상태)
Database       Firebase Firestore
Auth           Firebase Authentication (Anonymous Auth 중심)
Storage        Firebase Storage
Hosting        Vercel
VCS            GitHub
Payment        토스페이먼츠 (Phase 3)
```

**의존성 추가 시 원칙**: 가급적 위 스택 안에서 해결. 새 라이브러리 추가는 명확한 사유가 있을 때만.

---

## 📁 폴더 구조 (기준)

```
fadlet/
├── app/                     # Next.js App Router
│   ├── (marketing)/         # 랜딩페이지
│   ├── boards/              # 보드 관련 라우트
│   │   ├── new/             # 보드 생성
│   │   ├── join/            # 보드 입장 (코드 입력)
│   │   └── [boardId]/       # 보드 화면
│   ├── api/                 # API Routes
│   ├── layout.tsx
│   └── globals.css
├── components/              # 재사용 컴포넌트
│   ├── board/               # 보드 캔버스 관련
│   ├── chat/                # 채팅 패널 관련
│   ├── ui/                  # shadcn/ui 베이스
│   └── shared/              # 공통
├── lib/
│   ├── firebase/            # Firebase 클라이언트·서버 설정
│   ├── hooks/               # 커스텀 훅 (useBoard, useChat 등)
│   ├── types/               # TypeScript 타입 정의
│   └── utils/               # 유틸 함수
├── docs/                    # 이 PRD 문서
├── public/
├── firebase.json            # Firebase 설정
├── firestore.rules          # Firestore 보안 규칙
├── storage.rules            # Storage 보안 규칙
├── tailwind.config.ts
└── next.config.mjs
```

---

## 🎨 디자인 시스템

### 컬러 팔레트
```
Primary    Blue 600   #2563eb   (CTA, 운영자 표시, 활성 상태)
Hover      Blue 700   #1d4ed8
Light      Blue 50    #eff6ff   (배경, 하이라이트)
Accent     Blue 400   #60a5fa   (포커스, 호버)
Warning    Red 600    #dc2626   (삭제, 라이브, 새 메시지 배지)
Neutral    Gray 400   #9ca3af   (보조 텍스트)
```

### 타이포그래피
- **한글**: Pretendard Variable (CDN: jsdelivr)
- **영문**: Inter
- **코드**: JetBrains Mono
- **위계**: Regular(400) → Medium(500) → SemiBold(600) → Bold(700)

### 컴포넌트 원칙
- shadcn/ui를 우선 사용. 커스터마이징은 `components/ui/` 안에서
- 모든 인터랙티브 요소는 키보드 접근 가능 (focus-visible 지원)
- 모바일 우선 (워크숍 참여자 60% 모바일 접속 가정)

---

## 📐 코딩 컨벤션

### TypeScript
- **strict mode 필수**. `any` 사용 금지 (`unknown` 활용)
- 타입은 `lib/types/` 폴더에서 중앙 관리
- 컴포넌트 props는 `interface ComponentNameProps` 형태
- API 응답은 zod 스키마로 검증

### React
- 서버 컴포넌트가 기본. 클라이언트 컴포넌트는 `"use client"` 명시 + 필요한 곳에만
- 상태 관리: 로컬 → useState, 글로벌 → Zustand. **Redux 사용 금지**
- 비동기 작업은 React Query (TanStack Query) 또는 Server Actions
- Hook 이름은 `use` 접두사 (예: `useBoard`, `useRealtimeChat`)

### Firestore
- 모든 컬렉션은 `lib/firebase/collections.ts`에 상수로 정의
- 실시간 구독은 `useEffect` 내부 또는 커스텀 훅에서. **컴포넌트 unmount 시 반드시 unsubscribe**
- 보안 규칙은 `firestore.rules`에 작성하고 PR에 포함

### 네이밍
- 변수·함수: camelCase
- 컴포넌트·타입: PascalCase
- 상수: SCREAMING_SNAKE_CASE
- 파일: kebab-case (예: `board-canvas.tsx`)
- Firestore 필드: camelCase (예: `boardCode`, `createdAt`)

---

## 🌏 한국어 우선

- **모든 UI 텍스트는 한국어**가 기본. 영어 메뉴 절대 금지
- 사용자에게 보이는 에러 메시지도 한국어
- 코드 주석은 한국어 또는 영어 자유. 단 **공개 라이브러리에 영향 주는 부분은 영어**
- 날짜·통화·숫자 포맷은 한국 기준 (`ko-KR`, `KRW`)

---

## 🔒 보안 원칙

1. **Firebase Security Rules는 필수**. 클라이언트만 믿지 않는다
2. **API 키는 환경변수**로만. `.env.local`은 절대 커밋하지 않는다
3. **사용자 입력은 검증**. zod 스키마로 클라이언트·서버 양쪽
4. **익명 사용자도 권한 체크**. UID 기반 본인 확인
5. **보드 코드는 6자리 영숫자**. brute force 방어 위해 rate limiting 고려

---

## 🧪 테스트 정책

- Phase 1: 핵심 기능 수동 테스트로 시작 (속도 우선)
- Phase 2: 주요 훅·유틸 함수에 단위 테스트 (Vitest)
- Phase 3: E2E 테스트 추가 (Playwright)

---

## 🔄 Git 워크플로우

### 브랜치
- `main` — 프로덕션 (Vercel 자동 배포)
- `develop` — 개발 메인
- `feature/[기능명]` — 기능 개발
- `fix/[이슈]` — 버그 수정

### 커밋 메시지
Conventional Commits 형식:
```
feat: 보드 생성 시 6자리 코드 자동 발급
fix: 채팅 메시지 중복 표시 문제 수정
docs: README에 환경변수 설명 추가
style: 보드 카드 호버 인터랙션 개선
refactor: useBoard 훅 분리
```

### PR 원칙
- PR은 작게, 자주
- 제목은 한국어 또는 영어. 본문은 변경 의도와 테스트 방법 명시
- 자동 배포되는 Vercel 프리뷰 URL로 직접 확인 후 머지

---

## 🚦 작업 시작 전 체크리스트

새 작업 시작 시 Claude Code는 항상 다음을 확인:

- [ ] 현재 작업이 어느 Phase인가? `docs/0X-phaseX-*.md` 읽기
- [ ] 데이터 모델 변경이 필요한가? `docs/data-schema.md` 확인
- [ ] 새 환경변수 필요한가? `.env.example`에 반드시 추가
- [ ] 보안 규칙 변경 필요한가? `firestore.rules` 함께 수정
- [ ] 한국어 UI인가?
- [ ] 모바일에서 잘 보이는가?

---

## ❌ 절대 하지 말 것

1. **localStorage·sessionStorage에 민감 정보 저장 금지** (보드 코드, 닉네임 정도만)
2. **Firebase Admin SDK를 클라이언트에 노출 금지**
3. **사용자 데이터를 외부 분석 도구에 무차별 전송 금지**
4. **운영자 권한 체크 우회 금지** (보안 규칙 통과해도 클라이언트도 검증)
5. **하드코딩된 시크릿 키 커밋 금지** (`.env.local` 사용)

---

## 📞 컨택 & 레퍼런스

- 운영자: REFERENCE HRD (pjh@referencehrd.com)
- 슬로건: "고객의 물음표를 느낌표로!"
- 푸터 표기: `© 2026 REFERENCE HRD. All Rights Reserved.`

---

**마지막 업데이트**: 2026.04.29
