# Phase 2 — 상품성 확보 (Week 2-4)

> **목표**: 외부 고객사에 유료로 판매 가능한 수준의 기능 확장.
> **원칙**: Phase 1의 단단한 베이스 위에 가치를 더한다. 새 기능 추가보다 기존 흐름의 완성도를 우선.

---

## 🎯 Phase 2 완료 정의

다음이 가능하면 Phase 2 완료:

> 운영자가 KPT 템플릿을 선택해 회고 워크숍을 만든다 → 참여자들이 텍스트와 이미지를 함께 포스팅한다 → 동료의 포스트에 👍 이모지로 반응하고 댓글로 토론한다 → 채팅에서는 파일을 공유하고 링크 미리보기로 빠르게 자료를 본다 → 워크숍이 끝나면 보드와 채팅 기록을 PDF로 저장한다.

---

## 📋 기능 범위

### 추가되는 기능
- [x] 이미지 업로드 (Firebase Storage)
- [x] 댓글 기능 (포스트별)
- [x] 이모지 반응 (5종: 👍 ❤️ 🎉 💡 🤔)
- [x] 채팅 이미지·파일 첨부
- [x] 채팅 링크 미리보기 (OG 메타데이터)
- [x] 채팅 검색·스크롤 위치 기억
- [x] 템플릿: 자유 보드, 브레인스토밍, KPT
- [x] 템플릿: 4F (Fact/Feeling/Finding/Future)
- [x] 템플릿: Q&A, 9 Window
- [x] 드래그&드롭 정렬
- [x] PDF·이미지 내보내기
- [x] 채팅 기록 PDF 내보내기

### 여전히 OUT (Phase 3에서)
- ❌ 운영자 모드 (타이머, 단계 진행)
- ❌ 채팅 모더레이션 (메시지 삭제·신고)
- ❌ 워크스페이스 (관리자 페이지)
- ❌ 결제

---

## 📅 주별 작업 계획

### Week 2 — 미디어 + 반응
**목표**: 텍스트 일색에서 풍부한 콘텐츠로

- **Day 8-9** 이미지 업로드
  - [ ] Firebase Storage 설정 + 보안 규칙
  - [ ] 포스트 작성 시 이미지 첨부 (드래그&드롭)
  - [ ] 이미지 압축·리사이징 (브라우저 사이드)
  - [ ] Lightbox 뷰어 (`yet-another-react-lightbox` 또는 자체)

- **Day 10-11** 댓글 + 이모지 반응
  - [ ] 포스트 클릭 시 상세 모달
  - [ ] 댓글 작성·수정·삭제
  - [ ] 이모지 반응 토글 (사용자당 1개씩)
  - [ ] 반응 수 표시 + 누가 눌렀는지 호버 툴팁

- **Day 12-13** 채팅 첨부 + 링크 미리보기
  - [ ] 채팅 이미지·파일 업로드
  - [ ] 파일 타입별 아이콘·다운로드 버튼
  - [ ] URL 자동 감지 → Edge Function으로 OG 메타데이터 추출
  - [ ] 링크 미리보기 카드 (제목·설명·이미지·사이트명)

- **Day 14** 폴리싱 + 알파 테스트
  - [ ] 자체 워크숍 1회 알파 테스트
  - [ ] 버그 픽스, UI 다듬기

### Week 3 — HRD 템플릿
**목표**: 한국 워크숍 표준 흐름을 빠르게 적용

- **Day 15-16** 템플릿 시스템 설계
  - [ ] 템플릿 데이터 구조 (`lib/templates/`)
  - [ ] 템플릿 선택 UI (보드 생성 시)
  - [ ] 컬럼 기반 보드 렌더러 (`components/board/column-board.tsx`)

- **Day 17** 자유 보드 + 브레인스토밍
  - [ ] 자유 보드: 그리드 자동 정렬
  - [ ] 브레인스토밍: 단일 컬럼, 색상 다양

- **Day 18** KPT
  - [ ] 3컬럼: Keep / Problem / Try
  - [ ] 컬럼별 안내 텍스트
  - [ ] 익명 모드 토글 (옵션)

- **Day 19** 4F (Fact/Feeling/Finding/Future)
  - [ ] 4컬럼 또는 4사분면 레이아웃
  - [ ] 각 영역별 가이드 질문

- **Day 20** Q&A + 9 Window
  - [ ] Q&A: 질문·답변 묶음, 좋아요 정렬
  - [ ] 9 Window: 3x3 그리드, TRIZ 사고 프레임

- **Day 21** 템플릿 통합 테스트

### Week 4 — 정렬 + 내보내기 + 베타
**목표**: 워크숍 산출물 완성 + 외부 고객사 베타

- **Day 22-23** 드래그&드롭
  - [ ] `@dnd-kit/core` 도입
  - [ ] 자유 보드: 자유 위치 이동
  - [ ] 컬럼 보드: 컬럼 간 이동
  - [ ] 위치 정보 Firestore 저장

- **Day 24-25** PDF 내보내기
  - [ ] `react-pdf` 또는 서버사이드 PDF 생성
  - [ ] 보드 → PDF (각 포스트 포함)
  - [ ] 채팅 기록 → PDF (시간·작성자 포함)
  - [ ] 통합 PDF (보드 + 채팅) 옵션

- **Day 26** 검색 + 스크롤 기억
  - [ ] 채팅 검색 (메시지·작성자)
  - [ ] 마지막 읽은 위치 기억 (localStorage)

- **Day 27** 베타 출시 준비
  - [ ] 랜딩페이지 → 실제 가입 플로우 연결
  - [ ] 사용자 피드백 폼
  - [ ] 운영자 헬프 문서 (간단 매뉴얼)

- **Day 28** 베타 출시
  - [ ] 레퍼런스HRD 주요 고객사 5곳 베타 제공
  - [ ] 슬랙·이메일로 피드백 수집 채널 오픈

---

## 🧱 새로 추가되는 핵심 컴포넌트

### `components/board/post-detail-modal.tsx`
포스트 클릭 시 열리는 상세 모달. 댓글·반응 표시.

### `components/board/template-selector.tsx`
보드 생성 시 템플릿 선택 그리드. 미리보기 이미지 + 설명.

### `components/board/column-board.tsx`
컬럼 기반 보드 렌더러. KPT, 4F 등 템플릿이 사용.

### `components/chat/message-attachment.tsx`
채팅 메시지의 이미지·파일·링크 미리보기 렌더러.

### `lib/templates/index.ts`
템플릿 정의 모음.
```typescript
export const TEMPLATES = {
  free: { /* ... */ },
  brainstorming: { /* ... */ },
  kpt: {
    name: "KPT 회고",
    columns: [
      { id: "keep", title: "Keep", description: "잘하고 있는 것" },
      { id: "problem", title: "Problem", description: "개선이 필요한 것" },
      { id: "try", title: "Try", description: "다음에 시도할 것" },
    ],
    defaultColors: ["green", "yellow", "blue"],
  },
  // 4f, qna, nineWindow ...
};
```

### `lib/pdf/board-to-pdf.ts`
보드 데이터를 PDF로 렌더링.

---

## 🔑 새 데이터 구조

### 댓글
```typescript
// /posts/{postId}/comments/{commentId}
{
  authorId: "userUidXXX",
  authorName: "박지영",
  content: "이 의견 정말 좋네요!",
  createdAt: serverTimestamp(),
}
```

### 반응
```typescript
// /posts/{postId}/reactions/{reactionId}
{
  userId: "userUidXXX",
  emoji: "thumbsup",   // thumbsup | heart | party | bulb | thinking
  createdAt: serverTimestamp(),
}
```

### 메시지 확장
```typescript
// /messages/{messageId}
{
  authorId, authorName, role, createdAt,  // 기존 필드
  type: "text" | "image" | "file" | "link",
  content: "메시지 내용 또는 링크 URL",
  fileUrl?: "https://...",
  fileName?: "report.pdf",
  fileSize?: 123456,
  linkPreview?: {
    url: "https://example.com",
    title: "페이지 제목",
    description: "페이지 설명",
    image: "https://example.com/og.png",
    siteName: "Example",
  },
}
```

### 보드 템플릿 확장
```typescript
// /boards/{boardId}
{
  // ... 기존 필드
  template: "free" | "brainstorming" | "kpt" | "4f" | "qna" | "nineWindow",
  templateConfig?: {
    // 템플릿별 추가 설정 (예: 4F 사용 시 가이드 질문 커스터마이징)
  },
}
```

상세 스키마: [`docs/data-schema.md`](./data-schema.md)

---

## 🌐 Vercel Edge Function: OG 메타데이터 추출

채팅 메시지에 URL 입력 시 자동으로 미리보기 카드 생성.

### `app/api/og-preview/route.ts`
```typescript
// 1. URL 입력 받기
// 2. fetch로 HTML 가져오기 (timeout 5초)
// 3. cheerio 또는 기본 정규식으로 og:title, og:description, og:image 추출
// 4. Firestore의 messages/{messageId}.linkPreview 필드 업데이트
// 5. 결과를 클라이언트에 즉시 반환

// 캐싱: Vercel KV 또는 Edge Cache로 동일 URL 1시간 캐시
```

---

## 📦 새 의존성

```bash
pnpm add @dnd-kit/core @dnd-kit/sortable        # 드래그&드롭
pnpm add yet-another-react-lightbox             # 이미지 뷰어
pnpm add react-pdf @react-pdf/renderer          # PDF 생성 (또는 서버사이드)
pnpm add lucide-react                           # 아이콘
pnpm add date-fns                               # 날짜 포맷
pnpm add cheerio                                # OG 메타데이터 파싱
```

---

## ✅ Phase 2 완료 체크리스트

### 기능
- [ ] 이미지를 포스트와 채팅에 업로드할 수 있다
- [ ] 포스트에 댓글과 이모지 반응을 남길 수 있다
- [ ] 채팅에서 파일을 공유하고 링크가 미리보기로 표시된다
- [ ] 6가지 템플릿(자유·브레인스토밍·KPT·4F·Q&A·9Window) 사용 가능
- [ ] 포스트를 드래그&드롭으로 정렬할 수 있다
- [ ] 보드와 채팅을 PDF로 내보낼 수 있다

### 비기능
- [ ] Storage 보안 규칙 적용 (보드별 격리)
- [ ] 이미지 업로드 시 자동 압축
- [ ] 베타 고객사 5곳에 제공
- [ ] 피드백 수집 채널 운영

### KPI
- [ ] 베타 고객사 5곳
- [ ] 월간 활성 보드 100개+
- [ ] 베타 사용자 NPS 측정 시작
- [ ] 보드당 평균 30+ 채팅 메시지

---

## 🚀 다음 Phase

Phase 2 완료 후 [`docs/03-phase3-saas.md`](./03-phase3-saas.md)으로 진행.
