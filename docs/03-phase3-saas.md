# Phase 3 — SaaS 운영 인프라 (Week 5-8)

> **목표**: 기업 고객 대상 본격 SaaS 운영을 위한 핵심 인프라 + 정식 런칭.
> **원칙**: 운영자 가치를 극대화하는 운영자 모드, 그리고 매출을 만드는 결제 시스템.

---

## 🎯 Phase 3 완료 정의

다음이 가능하면 Phase 3 완료:

> 기업 고객사가 워크스페이스를 만들고 결제한다 → 여러 명의 운영자가 함께 사용한다 → 워크숍 진행 시 운영자 모드로 단계별 타이머를 가동하고, 부적절한 메시지를 즉시 삭제한다 → 워크숍 후 분석 대시보드에서 참여도를 확인한다 → 회사로 세금계산서가 자동 발행된다.

---

## 📋 기능 범위

### 추가되는 기능
- [x] 워크숍 운영자(Facilitator) 모드
- [x] 단계별 진행 + 타이머
- [x] 채팅 운영자 공지 (상단 고정)
- [x] 채팅 메시지 모더레이션 (삭제·신고)
- [x] 기업 워크스페이스 + 멤버 관리
- [x] 운영자 권한 관리 (host/co-host/viewer)
- [x] 토스페이먼츠 결제·구독 연동
- [x] 세금계산서 자동 발행
- [x] 참여도·활동량 분석 대시보드
- [x] API · Webhook (엔터프라이즈)
- [x] 화이트라벨링 (엔터프라이즈)

---

## 📅 주별 작업 계획

### Week 5 — 운영자 모드 핵심
**목표**: Facilitator를 위한 진정한 차별화 구현

- **Day 29-30** Facilitator 패널
  - [ ] 운영자만 보이는 우측 컨트롤 패널
  - [ ] 보드 정보 (참여자, 포스트 수, 채팅 수)
  - [ ] 빠른 액션: 보드 잠금, 채팅 비활성화

- **Day 31-32** 단계별 진행 + 타이머
  - [ ] 단계 정의 (제목 + 안내 + 시간)
  - [ ] 타이머 시작·일시정지·재시작
  - [ ] 모든 참여자에게 현재 단계 표시
  - [ ] 단계 완료 시 자동 알림

- **Day 33-34** 모더레이션 + 공지
  - [ ] 메시지·포스트 삭제 (운영자만)
  - [ ] 신고 기능 (참여자가 신고 → 운영자 알림)
  - [ ] 채팅 공지 고정 (상단 영역)
  - [ ] 부적절 키워드 자동 필터 (옵션)

- **Day 35** 운영자 모드 통합 테스트

### Week 6 — 워크스페이스 + 결제
**목표**: B2B SaaS 인프라 구축

- **Day 36-37** 워크스페이스
  - [ ] 워크스페이스 생성·설정
  - [ ] 멤버 초대 (이메일)
  - [ ] 역할 관리 (admin / member / viewer)
  - [ ] 워크스페이스 단위 보드 격리

- **Day 38-39** 토스페이먼츠 연동
  - [ ] 토스페이먼츠 SDK 통합
  - [ ] 정기결제 등록·해지
  - [ ] 결제 실패 처리·재시도
  - [ ] 환불 정책 + 처리 플로우

- **Day 40** 요금제 적용
  - [ ] 플랜별 기능 제한 (보드 수, 참여자 수, 채팅 메시지)
  - [ ] 사용량 추적·표시
  - [ ] 한도 도달 시 업그레이드 유도

- **Day 41-42** 세금계산서 + 영수증
  - [ ] 토스페이먼츠 세금계산서 API
  - [ ] 사업자 정보 입력·저장
  - [ ] 자동 발행 + 이메일 전송
  - [ ] 영수증 다운로드

### Week 7 — 분석 + 엔터프라이즈
**목표**: 도구를 넘어 인사이트로

- **Day 43-44** 분석 대시보드
  - [ ] 워크스페이스 단위 통계 (월간 보드 수·참여자 수)
  - [ ] 보드별 참여도 (포스트·반응·메시지 수)
  - [ ] 시간대별 활동량 차트
  - [ ] CSV/Excel 내보내기

- **Day 45-46** 엔터프라이즈 기능
  - [ ] SSO (SAML/OAuth) 옵션
  - [ ] 화이트라벨링 (로고·컬러·도메인)
  - [ ] API 키 발급·관리
  - [ ] Webhook (보드 생성·완료 이벤트)

- **Day 47-48** 보안 강화
  - [ ] 감사 로그 (audit log)
  - [ ] 데이터 보존 정책 설정
  - [ ] 2FA 옵션 (운영자 계정)
  - [ ] ISMS 인증 준비 자료

- **Day 49** 통합 QA

### Week 8 — 런칭
**목표**: 정식 출시 + 첫 매출

- **Day 50-51** 마케팅 자산
  - [ ] 랜딩페이지 최종 폴리싱
  - [ ] 데모 영상 제작
  - [ ] 블로그 포스트 (사례·튜토리얼)
  - [ ] 사용 가이드 문서

- **Day 52** 베타 → 정식 전환
  - [ ] 베타 사용자에게 정식 안내
  - [ ] 무료 → 유료 전환 프로모션
  - [ ] 결제 시스템 라이브 가동

- **Day 53-54** 런칭 발표
  - [ ] 자사 채널 (블로그, 뉴스레터, 링크드인)
  - [ ] 보도자료 배포
  - [ ] 기존 고객사 사장님 직접 안내

- **Day 55-56** 모니터링 + 빠른 대응
  - [ ] 24시간 장애 대응 체계
  - [ ] 사용자 문의 채널 운영
  - [ ] 데이터·KPI 일일 리뷰

---

## 🧱 새로 추가되는 핵심 컴포넌트

### `components/facilitator/control-panel.tsx`
운영자 전용 컨트롤 패널. 단계 관리·타이머·참여자 모니터링.

### `components/facilitator/timer.tsx`
보드 상단 또는 사이드에 표시되는 타이머. 모든 참여자가 같은 시간 본다.

### `components/facilitator/stage-manager.tsx`
워크숍 단계 정의·진행 관리.

### `app/dashboard/[workspaceId]/page.tsx`
워크스페이스 관리자 대시보드.

### `app/billing/page.tsx`
결제·구독 관리 페이지.

### `lib/billing/toss.ts`
토스페이먼츠 클라이언트 래퍼.

### `lib/analytics/board-stats.ts`
보드별 통계 계산 로직.

---

## 🔑 새 데이터 구조

### 워크스페이스
```typescript
// /workspaces/{wsId}
{
  name: "주식회사 레퍼런스HRD",
  ownerId: "userUidXXX",
  plan: "business" | "team" | "free" | "enterprise",
  billing: {
    customerId: "toss_customer_id",
    subscriptionId: "toss_subscription_id",
    status: "active" | "past_due" | "canceled",
    nextBillingAt: timestamp,
  },
  businessInfo: {
    companyName: "주식회사 레퍼런스HRD",
    businessNumber: "123-45-67890",
    representativeName: "박정현",
    address: "...",
    email: "pjh@referencehrd.com",
  },
  limits: {
    maxBoards: 50,
    maxParticipantsPerBoard: 100,
    maxStorageGB: 10,
  },
  usage: {
    activeBoards: 12,
    storageUsedMB: 230,
    monthlyMessages: 1234,
  },
  settings: {
    branding: {
      logoUrl: null,
      primaryColor: "#2563eb",
      customDomain: null,
    },
    sso: {
      enabled: false,
      provider: null,
      config: {},
    },
  },
  createdAt, updatedAt,
}
```

### 워크스페이스 멤버
```typescript
// /workspaces/{wsId}/members/{userId}
{
  email: "user@example.com",
  name: "홍길동",
  role: "admin" | "member" | "viewer",
  joinedAt: timestamp,
  invitedBy: "userUidXXX",
}
```

### 보드 단계 (Phase 3 추가)
```typescript
// /boards/{boardId}.stages (배열 필드)
[
  {
    id: "stage_1",
    title: "Keep — 잘하고 있는 것 작성",
    description: "5분 동안 자유롭게 작성하세요",
    durationSec: 300,
    startedAt: null,
    completedAt: null,
  },
  // ...
]
```

### 신고
```typescript
// /workspaces/{wsId}/boards/{boardId}/reports/{reportId}
{
  reportedBy: "userUidXXX",
  targetType: "post" | "message",
  targetId: "messageId or postId",
  reason: "spam" | "abusive" | "off-topic" | "other",
  description: "신고 사유 상세",
  status: "pending" | "resolved" | "dismissed",
  createdAt: timestamp,
}
```

### 사용량 로그
```typescript
// /workspaces/{wsId}/usage-logs/{logId}
{
  type: "board-created" | "message-sent" | "file-uploaded",
  userId: "userUidXXX",
  resourceId: "boardId",
  metadata: { /* type별 다름 */ },
  createdAt: timestamp,
}
```

상세 스키마: [`docs/data-schema.md`](./data-schema.md)

---

## 💳 토스페이먼츠 통합 흐름

### 1. 결제 등록 (구독)
```
1. 사용자가 Pricing 페이지에서 "TEAM 플랜 시작" 클릭
2. Next.js 페이지 → 토스 결제창 SDK 호출
3. 사용자가 카드 정보 입력 → 토스가 처리
4. successUrl로 리다이렉트 → /api/billing/confirm 호출
5. 서버에서 paymentKey 검증 → Firestore에 customerId/subscriptionId 저장
6. workspace.plan 업데이트 → 즉시 사용 가능
```

### 2. 정기결제
```
- 토스 빌링키 발급 → 매월 자동 결제
- 결제 성공 시: 사용량 카운터 리셋, 세금계산서 자동 발행
- 결제 실패 시: 3회 재시도 → 실패 시 plan 다운그레이드 (free) + 알림
```

### 3. 환불·취소
```
- 사용자가 "구독 취소" 클릭 → 다음 결제일까지 사용 가능
- 부분 환불 요청은 운영자가 토스 콘솔에서 처리
- 취소 시점부터 신규 보드 생성 제한 (기존 보드는 read-only)
```

### 환경 변수
```bash
TOSS_CLIENT_KEY=test_ck_...        # 클라이언트
TOSS_SECRET_KEY=test_sk_...        # 서버
TOSS_WEBHOOK_SECRET=...            # Webhook 검증
```

---

## 📊 분석 대시보드 핵심 지표

### 워크스페이스 레벨
- 월간 활성 보드 수
- 누적 참여자 수 (unique)
- 총 포스트 수, 총 메시지 수
- 평균 보드 참여 시간

### 보드별
- 참여자 수 (활성 / 전체)
- 포스트 수, 댓글 수, 반응 수
- 채팅 메시지 수
- 시간대별 활동 그래프
- TOP 기여자

### 운영자용 인사이트
- "이번 주 가장 활발했던 보드 TOP 5"
- "참여도가 가장 높았던 시간대"
- "재참여율 (이전 워크숍 참여자 비율)"

---

## 🏢 엔터프라이즈 기능 (옵션)

### SSO (Single Sign-On)
- SAML 2.0 (Okta, Azure AD)
- OAuth (Google Workspace)
- 별도 계약 시 활성화

### 화이트라벨링
- 도메인 커스터마이징 (`fadlet.referencehrd.com` 등)
- 로고·컬러 변경
- 이메일 템플릿 커스터마이징
- 푸터 회사명 노출

### API · Webhook
```
POST /api/v1/boards               보드 생성
GET  /api/v1/boards/{id}          보드 조회
POST /api/v1/webhooks/subscribe   이벤트 구독

이벤트:
- board.created
- board.completed
- participant.joined
```

---

## 📦 새 의존성

```bash
pnpm add @tosspayments/payment-sdk          # 토스페이먼츠
pnpm add recharts                           # 분석 차트
pnpm add @sentry/nextjs                     # 에러 모니터링
pnpm add resend                             # 이메일 발송
```

---

## ✅ Phase 3 완료 체크리스트

### 기능
- [ ] 운영자가 단계별 타이머로 워크숍을 진행할 수 있다
- [ ] 부적절한 메시지를 즉시 삭제할 수 있다
- [ ] 워크스페이스에 여러 운영자를 초대할 수 있다
- [ ] 토스페이먼츠로 정기결제가 정상 작동한다
- [ ] 세금계산서가 자동 발행된다
- [ ] 분석 대시보드에서 참여도를 확인할 수 있다

### 비기능
- [ ] Sentry 에러 모니터링 설치
- [ ] 24시간 장애 대응 체계 구축
- [ ] 사용자 가이드 문서 완성
- [ ] 보안 점검 완료
- [ ] ISMS 인증 준비 자료 정리 (실제 인증은 사용자 규모 큰 후)

### KPI
- [ ] 정식 런칭 완료
- [ ] 베타 → 유료 전환 2곳+
- [ ] 월간 활성 보드 100개+
- [ ] 첫 결제 매출 발생

---

## 🌟 Phase 3 이후

### Month 3+
- 엔터프라이즈 기능 고도화 (SSO, 화이트라벨링)
- 첫 대기업 계약 목표 (현대·기아·LG 등 기존 고객사)
- 패들렛 마이그레이션 도구 (1-클릭 임포트)
- 모바일 앱 (React Native)

### 1년 목표
- 유료 기업 고객 30곳+
- 월 매출 3,000만원+
- 엔터프라이즈 계약 3곳+
- 월간 활성 사용자 5,000명+

---

## 🎯 결론

Phase 3는 단순히 "기능을 더 추가하는 것"이 아니다. **Fadlet을 진짜 SaaS 비즈니스로 전환**하는 단계다. 운영자 모드는 차별화의 정점, 결제 시스템은 매출의 시작, 분석은 고객 유지의 열쇠다.

이 단계에서 가장 중요한 건 **고객의 목소리를 빠르게 반영**하는 것. Phase 1, 2와 달리 이미 외부 고객이 사용 중이므로, 변경은 신중하되 학습은 빨라야 한다.
