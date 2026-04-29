# Phase 1 — MVP (Week 1)

> **목표**: 사내 워크숍에서 실제로 사용 가능한 최소 기능 세트를 1주일 내 완성.
> **원칙**: 빠르게 만들고, 직접 써보고, 피드백을 받는다. 완벽함보다 동작.

---

## 🎯 Phase 1 완료 정의

다음 시나리오가 끝까지 동작하면 Phase 1 완료:

> 운영자가 보드를 만든다 → 6자리 코드를 받아 슬랙으로 공유한다 → 참여자 10명이 코드를 입력하고 닉네임을 적은 뒤 보드에 들어온다 → 각자 텍스트 포스트를 작성한다 → 채팅으로 질문을 주고받는다 → 30분 후 보드가 완성된다.

---

## 📋 기능 범위

### IN (Phase 1에서 구현)
- [x] 보드 생성 (운영자 로그인 후)
- [x] 6자리 보드 코드 자동 발급
- [x] 코드로 보드 입장 + 닉네임 설정
- [x] Firebase Anonymous Auth 익명 로그인
- [x] 텍스트 포스트 작성·수정·삭제
- [x] 6가지 색상 선택 (포스트잇 스타일)
- [x] 실시간 동기화 (`onSnapshot`)
- [x] 우측 채팅 패널 (텍스트 메시지만)
- [x] 접속자 수 실시간 표시
- [x] 자유 보드 템플릿 1종
- [x] 반응형 (PC + 모바일)

### OUT (Phase 1에서 제외, Phase 2 이후로)
- ❌ 이미지 업로드
- ❌ 댓글 기능
- ❌ 이모지 반응
- ❌ 채팅 파일 첨부
- ❌ HRD 템플릿 (KPT, 4F 등)
- ❌ 드래그&드롭
- ❌ 운영자 모드 (타이머, 단계 진행)
- ❌ 결제

---

## 📅 일별 작업 계획

### Day 1 — 환경 셋업
- [ ] Next.js 14 프로젝트 생성
- [ ] Tailwind CSS + shadcn/ui 설정
- [ ] Firebase 프로젝트 생성 (Firestore, Auth, Storage 활성화)
- [ ] GitHub 저장소 생성 + Vercel 연동
- [ ] `.env.example` 작성
- [ ] 기본 폴더 구조 생성 (`CLAUDE.md` 참조)

### Day 2 — 인증 + 보드 생성
- [ ] Firebase 클라이언트 설정 (`lib/firebase/client.ts`)
- [ ] Firebase Anonymous Auth 통합
- [ ] 운영자 로그인 (이메일 또는 Google) — 이건 Phase 2로 미뤄도 OK
- [ ] 보드 생성 페이지 (`app/boards/new`)
- [ ] 6자리 코드 생성 함수 (`lib/utils/generate-board-code.ts`)
- [ ] Firestore에 보드 문서 생성

### Day 3 — 보드 입장 + 익명 로그인
- [ ] 보드 입장 페이지 (`app/boards/join`)
- [ ] 코드 입력 → 보드 조회 → 닉네임 입력 플로우
- [ ] Anonymous Auth로 UID 발급
- [ ] participants 서브컬렉션에 사용자 등록
- [ ] 보드 화면 (`app/boards/[boardId]`) 기본 레이아웃

### Day 4 — 포스트 CRUD + 실시간 동기화
- [ ] 포스트 작성 모달 (텍스트 + 색상 선택)
- [ ] Firestore에 포스트 저장
- [ ] `onSnapshot`으로 실시간 구독
- [ ] 포스트 수정·삭제 (작성자만)
- [ ] 6가지 색상 디자인 (노랑·파랑·핑크·초록·보라·회색)

### Day 5 — 채팅 패널
- [ ] 우측 채팅 패널 컴포넌트 (`components/chat/chat-panel.tsx`)
- [ ] messages 서브컬렉션 실시간 구독
- [ ] 메시지 전송 (텍스트만)
- [ ] 운영자 메시지 시각적 강조 (좌측 파란 보더)
- [ ] 접속자 수 표시 (participants 카운트)

### Day 6 — 반응형 + 폴리싱
- [ ] 모바일 레이아웃 (보드/채팅 토글)
- [ ] Empty state, Loading state, Error state
- [ ] 보드 코드 복사·QR 코드 공유
- [ ] 보드 잠금 (운영자 토글)

### Day 7 — 자체 테스트 + 배포
- [ ] Vercel 프로덕션 배포
- [ ] Firestore 보안 규칙 작성·배포
- [ ] 사내 워크숍 1회 실제 사용 (알파 테스트)
- [ ] 피드백 정리 → Phase 2 우선순위 조정

---

## 🧱 핵심 컴포넌트

### 1. `app/boards/new/page.tsx` — 보드 생성
- 운영자 로그인 확인
- 보드 제목 입력 → "보드 만들기" 클릭
- 6자리 코드 발급 → `/boards/[boardId]?code=XXXXXX` 리다이렉트
- 운영자에게는 공유용 링크 + QR 코드 표시

### 2. `app/boards/join/page.tsx` — 보드 입장
- 6자리 코드 입력 (대문자 자동 변환)
- 코드 유효성 검증 (Firestore 조회)
- 닉네임 입력 (2-12자)
- Anonymous Auth로 UID 발급 → 보드 진입

### 3. `app/boards/[boardId]/page.tsx` — 보드 화면
- 좌측: 보드 캔버스 (포스트 그리드)
- 우측: 채팅 패널 (320px 고정)
- 모바일: 하단 토글 버튼으로 전환

### 4. `components/board/post-card.tsx` — 포스트 카드
- 색상 배경 + 작성자 닉네임 + 텍스트 + 시간
- 작성자만 수정·삭제 버튼 노출
- 운영자는 모든 포스트 수정·삭제 가능

### 5. `components/chat/chat-panel.tsx` — 채팅 패널
- 메시지 리스트 (스크롤 자동 하단)
- 입력창 (Enter 전송, Shift+Enter 줄바꿈)
- 운영자 메시지 강조

---

## 🔑 핵심 데이터 작업

### 보드 생성 시
```typescript
// /workspaces/{wsId}/boards/{boardId}
{
  title: "Q1 회고 워크숍",
  boardCode: "K3F2X9",       // 6자리 영숫자, 대문자
  template: "free",
  ownerId: "userUidXXX",
  workspaceId: "default",     // Phase 1은 default 워크스페이스 하나
  settings: {
    allowChat: true,
    retainChatLog: true,
    lockedAt: null,
  },
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
}
```

### 보드 코드 생성 규칙
- 6자리, 영문 대문자 + 숫자 (혼동 글자 제외: 0/O, 1/I/L)
- 사용 가능 문자: `ABCDEFGHJKMNPQRSTUVWXYZ23456789`
- 충돌 체크: 발급 시 Firestore 조회로 중복 확인 (최대 5회 재시도)

### 포스트 작성 시
```typescript
// /workspaces/{wsId}/boards/{boardId}/posts/{postId}
{
  authorId: "userUidYYY",
  authorName: "박지영",
  content: "새로운 협업 도구가 효율을 높였어요",
  color: "yellow",            // yellow|blue|pink|green|purple|gray
  position: { x: 0, y: 0 },   // 자유 배치 (Phase 2에서 정렬)
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
}
```

### 채팅 메시지
```typescript
// /workspaces/{wsId}/boards/{boardId}/messages/{messageId}
{
  authorId: "userUidYYY",
  authorName: "박지영",
  role: "member",             // host | member
  type: "text",               // Phase 1은 text만
  content: "템플릿 어떻게 추가하나요?",
  createdAt: serverTimestamp(),
}
```

상세 스키마: [`docs/data-schema.md`](./data-schema.md)

---

## 🔒 Firestore 보안 규칙 (Phase 1)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /workspaces/{wsId}/boards/{boardId} {
      // 보드 읽기: 누구나 (코드만 알면)
      allow read: if true;

      // 보드 생성: 인증된 사용자만
      allow create: if request.auth != null
        && request.resource.data.ownerId == request.auth.uid;

      // 보드 수정·삭제: 소유자만
      allow update, delete: if request.auth != null
        && resource.data.ownerId == request.auth.uid;

      match /posts/{postId} {
        allow read: if true;
        allow create: if request.auth != null
          && request.resource.data.authorId == request.auth.uid;
        allow update, delete: if request.auth != null
          && (resource.data.authorId == request.auth.uid
              || get(/databases/$(database)/documents/workspaces/$(wsId)/boards/$(boardId)).data.ownerId == request.auth.uid);
      }

      match /messages/{messageId} {
        allow read: if true;
        allow create: if request.auth != null
          && request.resource.data.authorId == request.auth.uid;
        allow update, delete: if request.auth != null
          && (resource.data.authorId == request.auth.uid
              || get(/databases/$(database)/documents/workspaces/$(wsId)/boards/$(boardId)).data.ownerId == request.auth.uid);
      }

      match /participants/{userId} {
        allow read: if true;
        allow write: if request.auth != null
          && request.auth.uid == userId;
      }
    }
  }
}
```

---

## 🎨 UI 와이어프레임 (텍스트)

### 데스크톱 (1280px+)
```
┌─────────────────────────────────────────────────────────┐
│  [Fadlet 로고]   제목: Q1 회고 워크숍   [코드: K3F2X9] [🔒]│
├──────────────────────────────────────┬──────────────────┤
│                                       │  실시간 채팅 ●12  │
│   [+] 새 포스트                       ├──────────────────┤
│                                       │                   │
│   ┌──────┐ ┌──────┐ ┌──────┐         │  ▌김매니저 (운영) │
│   │ 박지영│ │ 이수민│ │ 최영준│         │  10분 후 발표 시작│
│   │ ...  │ │ ...  │ │ ...  │         │                   │
│   └──────┘ └──────┘ └──────┘         │   박지영          │
│                                       │   템플릿 어떻게? │
│   ┌──────┐ ┌──────┐                  │                   │
│   │ ...  │ │ ...  │                  │   이수민          │
│   └──────┘ └──────┘                  │   상단 + 버튼!  │
│                                       │                   │
│                                       │ ─────────────── │
│                                       │ [메시지 입력...]  │
└──────────────────────────────────────┴──────────────────┘
```

### 모바일 (~768px)
- 보드 화면 풀스크린
- 하단 우측에 플로팅 버튼: 💬 (미확인 메시지 수 배지)
- 클릭 시 채팅 풀스크린 오버레이

---

## ✅ Phase 1 완료 체크리스트

### 기능
- [ ] 운영자가 보드를 생성하고 6자리 코드를 받는다
- [ ] 참여자가 코드+닉네임으로 즉시 입장한다
- [ ] 모든 참여자가 텍스트 포스트를 작성·수정·삭제한다
- [ ] 변경사항이 1초 이내 모든 화면에 반영된다
- [ ] 채팅 메시지가 실시간으로 전송·수신된다
- [ ] 운영자 메시지가 시각적으로 구분된다
- [ ] 접속자 수가 실시간으로 표시된다
- [ ] 모바일에서 PC와 동등한 경험을 제공한다

### 비기능
- [ ] Vercel 프로덕션 배포 완료
- [ ] Firestore 보안 규칙 적용
- [ ] `.env.example` 정비
- [ ] README에 빠른 시작 가이드 작성
- [ ] 자체 워크숍 1회 알파 테스트 완료
- [ ] 피드백 정리 문서 작성

### KPI
- [ ] 자체 워크숍 사용 3회
- [ ] 실 사용자 피드백 10명+
- [ ] 치명적 버그 0건
- [ ] 평균 응답 시간 < 1초

---

## 🚀 다음 Phase

Phase 1 완료 후 [`docs/02-phase2-expansion.md`](./02-phase2-expansion.md)으로 진행.
