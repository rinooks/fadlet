# Fadlet TODO

> 워크숍 OS 비전을 향한 작업 체크리스트. 완료 항목은 [커밋 해시](https://github.com/rinooks/fadlet/commits/master) + 파일 링크.

---

## ✅ 완료

### 🧹 코드 정리 / 인프라
- [x] **simplify 1차** — 디버그 로그 7개 제거, [`toggleReaction`](lib/hooks/use-messages.ts) ref 패턴 전환, [`formatFileSize`](lib/utils/format-file-size.ts) 유틸 추출, [`SkinSelector`](components/board/skin-selector.tsx) compact prop, [`useParticipants`](lib/hooks/use-participants.ts) subscribe 옵션, WHAT-only 주석 정리, `DroppablePanel` 인라인화 — [`eb4fbc9`](https://github.com/rinooks/fadlet/commit/eb4fbc9)

### 🎨 UI / 디자인
- [x] **박스 라운드 미세 조정** — [`globals.css`](app/globals.css)의 `--radius` 0.625 → 0.5rem로 전체 비례 축소 — [`eb4fbc9`](https://github.com/rinooks/fadlet/commit/eb4fbc9)
- [x] **포스트/보드 라운드 한 단계 더 깎기** — [`post-card.tsx`](components/board/post-card.tsx), [`column-board.tsx`](components/board/column-board.tsx), [`pros-cons-board.tsx`](components/board/pros-cons-board.tsx) — [`eb4fbc9`](https://github.com/rinooks/fadlet/commit/eb4fbc9)
- [x] **brutal 스킨 라운드 0 통합** — [`skins.css`](app/skins.css)에서 단일 `[class*="rounded"]` 셀렉터로 방향/모서리 변형 모두 직각화 — [`eb4fbc9`](https://github.com/rinooks/fadlet/commit/eb4fbc9)
- [x] **캔버스 도트 그리드 강화** — [`canvas-board.tsx`](components/board/canvas-board.tsx) 24px 미세 + 120px 가이드 도트 두 겹, 다이어그램 도구 느낌 — [`09e4d55`](https://github.com/rinooks/fadlet/commit/09e4d55)

### 🗂 정보 구조
- [x] **옵션 A — 대시보드 = 워크스페이스 허브** — [`/dashboard`](app/dashboard/page.tsx) 카드 그리드 + 보드 미리보기, [`/workspaces`](app/workspaces/page.tsx) 인덱스 리다이렉트, [`/workspaces/[wsId]`](app/workspaces/[wsId]/page.tsx)는 보드+멤버 — [`f02e6c0`](https://github.com/rinooks/fadlet/commit/f02e6c0)
- [x] **빵부스러기 + 라벨 통일** — `Fadlet › 내 워크스페이스 › [이름]`, "대시보드"→"내 워크스페이스" 일관 — [`f02e6c0`](https://github.com/rinooks/fadlet/commit/f02e6c0)

### 🎬 Phase 1 — 워크숍 모드 (단계 = 액티비티 시퀀스)
- [x] 데이터 모델 — [`Board.mode`, `Stage.activityType`, `Post.stageId`](lib/types/index.ts) — [`3e369d0`](https://github.com/rinooks/fadlet/commit/3e369d0)
- [x] [`/boards/new`](app/boards/new/page.tsx) 모드 선택 step (🎯 단일 / 🎬 워크숍)
- [x] [운영자 패널](components/board/facilitator-panel.tsx) — workshop 모드일 때 활동 종류 드롭다운
- [x] [단계 시작](components/board/stage-banner.tsx) → 자동 타이머 + 모든 참여자 화면 자동 전환 ([`use-timer.ts`](lib/hooks/use-timer.ts))
- [x] 포스트 stageId 격리, 단계 전환 토스트, 시간 종료 알림 — [`boards/[boardId]/page.tsx`](app/boards/[boardId]/page.tsx)

### 📊 Phase 2 — 라이브 액티비티
- [x] **인프라 (PR-1)** — [`ActivityKind`](lib/activities.ts) 분류, [타입(Poll/Wordcloud/ActivityState)](lib/types/index.ts), [Firestore 컬렉션](lib/firebase/collections.ts) + [보안 규칙](firestore.rules), 훅 3개 ([`use-poll`](lib/hooks/use-poll.ts), [`use-wordcloud`](lib/hooks/use-wordcloud.ts), [`use-activity-state`](lib/hooks/use-activity-state.ts)) — [`308e3f9`](https://github.com/rinooks/fadlet/commit/308e3f9)
- [x] **라이브 폴 (PR-2)** — [`LiveActivityShell`](components/activities/live-activity-shell.tsx) 공통 레이아웃, [`PollBoard`](components/activities/poll-board.tsx) (응답 폼 + CSS 막대 차트), 운영자 결과 공개·마감 토글 — [`5993570`](https://github.com/rinooks/fadlet/commit/5993570)
- [x] **워드클라우드 (PR-3)** — [`WordcloudBoard`](components/activities/wordcloud-board.tsx) (입력 폼 + font-size 비례 클라우드), 본인/운영자 삭제 — [`91806d8`](https://github.com/rinooks/fadlet/commit/91806d8)
- [x] **라이브 Q&A** — [`QnaBoard`](components/activities/qna-board.tsx) slido 스타일 (질문 + 좋아요 정렬 + 운영자 답변/완료/재오픈), [`use-qna`](lib/hooks/use-qna.ts) — [`fa7f533`](https://github.com/rinooks/fadlet/commit/fa7f533)

### 🎯 템플릿 정비 (의도/UI 일치)
- [x] **칸반 템플릿 추가** — [`templates.ts`](lib/templates.ts) 9가지로 확장 — [`eb4fbc9`](https://github.com/rinooks/fadlet/commit/eb4fbc9)
- [x] **자유형 제거** — 브레인스토밍과 중복, [`templates.ts`](lib/templates.ts)에서 빼고 [`BoardTemplate union`](lib/types/index.ts)은 호환 유지 — [`714b484`](https://github.com/rinooks/fadlet/commit/714b484)
- [x] **4F 흐름감** — `showFlow` 플래그 + [`column-board.tsx`](components/board/column-board.tsx) 컬럼 사이 → 화살표 + 시간감 색상 (slate→amber→orange→indigo) — [`714b484`](https://github.com/rinooks/fadlet/commit/714b484)
- [x] **9칸 윈도우 TRIZ화** — "영역 1~9" → "과거·상위, 현재·시스템(🎯 핵심)…" 시간×레벨 매트릭스 — [`714b484`](https://github.com/rinooks/fadlet/commit/714b484)
- [x] **Q&A 라이브화** — 보드형 제거, 라이브 액티비티로 이관 — [`fa7f533`](https://github.com/rinooks/fadlet/commit/fa7f533)

### 📝 Phase 3 — 워크숍 통합 리포트
- [x] **워크숍 PDF 리포트** — [`export/page.tsx`](app/boards/[boardId]/export/page.tsx) 단계별 결과(보드형 + 폴/워드클라우드/Q&A)를 한 PDF로, 단계당 한 페이지. [`ExportMenu`](components/shared/export-menu.tsx)에 워크숍 모드 옵션 — [`e8525b5`](https://github.com/rinooks/fadlet/commit/e8525b5)

### 📓 운영
- [x] **노션 페이지 신설** — [🗂️ Fadlet](https://www.notion.so/354b1787a688816583c3f9e2348a3f71) + 개발일지 5월 3·4일 누적 기록

### ✏️ UI 후속 정비
- [x] **새 포스트 다이얼로그 사이즈** — [`new-post-dialog.tsx`](components/board/new-post-dialog.tsx) 폭 좁게(`max-w-xs`), 본문 textarea 위아래 크게(rows 10 + min-h 280px)
- [x] **보드 배경 선택** — [`backgrounds.ts`](lib/backgrounds.ts) 7가지 옵션, [`BackgroundSelector`](components/board/background-selector.tsx), 운영자 패널 🖼️ 섹션

---

## 🚧 진행 중

_(없음)_

---

## ⏳ 다음 (워크숍 OS 1.0 출시 직전)

### 🎯 출시 정합성
- [ ] **랜딩 카피 "워크숍 OS" 정렬** — [`app/page.tsx`](app/page.tsx) 히어로 헤드라인 "포스트잇은 끝났다" → "워크숍의 처음부터 끝까지, Fadlet 하나로"
- [ ] **서브 카피·메타** — "보드형 7가지 + 라이브 3가지 + 단계 시퀀스 + 통합 리포트" 비전 반영
- [ ] OG 이미지 / 메타 ([`og:image`](app/layout.tsx)) 갱신 (현재 `/fadlet.jpg` 그대로)

### 🧪 검증
- [ ] **본인 시나리오 테스트** — 워크숍 보드 1개 만들어 5분 흐름 (워드클라우드 → 브레인스토밍 → 폴 → Q&A) → PDF 리포트까지 출력
- [ ] 발견사항 todo.md에 추가 + 우선순위 정리
- [ ] **외부 테스터 1-2명 초대** — HRD 담당자 베타 링크 + 피드백 양식

### 📚 사용자 가이드
- [ ] [`/help`](app/help/page.tsx) 페이지 워크숍 모드 섹션 추가 (현재는 `📋 운영자 패널`까지만)
- [ ] 운영자용 짧은 영상 또는 이미지 가이드 (단계 만들기 → 시작 → 리포트)
- [ ] 데모 보드([`demo-button.tsx`](components/shared/demo-button.tsx))에 워크숍 모드 옵션 추가? (현재 single만)

### 💬 피드백 채널
- [ ] 디스코드 또는 구글폼 등 피드백 받을 곳
- [ ] [`/help`](app/help/page.tsx) 또는 푸터에 피드백 링크

---

## 🌱 Phase 2.x (라이브 액티비티 확장)

- [ ] 다중 선택 폴 ([`PollConfig.allowMultiple`](lib/types/index.ts) UI 노출)
- [ ] 슬라이더 폴 (1-10 척도)
- [ ] 순위 매기기 폴 (드래그로 옵션 정렬)
- [ ] 폴/워드클라우드 결과 **CSV 내보내기**
- [ ] 워드클라우드 한국어 형태소 분석 (mecab 등) — 우선순위 낮음
- [ ] Q&A 답변 좋아요 (참여자가 답변에도 반응)
- [ ] 액티비티별 운영자 빠른 가이드 (첫 사용 시 툴팁)

---

## 🚀 Phase 4 (출시 후)

### 결제 / 가격
- [ ] 토스페이먼츠 연동 ([CLAUDE.md](CLAUDE.md) 명시: Phase 3)
- [ ] 가격 책정 — 월정액 vs 워크숍당
- [ ] Free / Pro 플랜 분기 (보드 수, 참여자 수, 보관 기간 등)

### 워크숍 라이브러리
- [ ] **워크숍 템플릿 보관** — 단계 구성을 템플릿으로 저장/복제 (예: "팀 비전 정렬 90분", "회고 60분")
- [ ] 다른 운영자에게 워크숍 템플릿 공유

### 운영자 도구 강화
- [ ] 단계 편집 — 활동 설정(폴 옵션 등) 사후 수정 (현재는 추가 시점만) — [`facilitator-panel.tsx`](components/board/facilitator-panel.tsx)
- [ ] 단계 복제 / 정렬 / 일시 중단 후 재개
- [ ] 워크숍 일시정지 / 휴식 단계
- [ ] 분석 대시보드([`analytics/page.tsx`](app/boards/[boardId]/analytics/page.tsx))에 단계별 참여도 추가

### 인프라
- [ ] Vitest 단위 테스트 ([CLAUDE.md](CLAUDE.md): Phase 2)
- [ ] Playwright E2E ([CLAUDE.md](CLAUDE.md): Phase 3)
- [ ] Vercel Analytics 또는 Posthog 도입

---

## 📌 메모

- **`free` 템플릿**: [`templates.ts`](lib/templates.ts)에서 빠졌지만 [`BoardTemplate union`](lib/types/index.ts)은 유지. 기존 free 보드 호환 목적 — 나중에 union에서 제거할 때 마이그레이션 필요
- **기존 보드형 Q&A 보드**: Q&A를 라이브화하면서 보드형으로 만든 기존 보드의 posts(columnId='question'/'answer')는 라이브 데이터와 매핑 안 됨. 베타라 깨끗하게 갔지만, 출시 후엔 단방향 마이그레이션 스크립트 필요할 수 있음
- **단계별 활동 설정 사후 편집 미지원**: 현재 단계 추가 시점에만 폴 질문/옵션 입력 가능. 단계 만든 뒤 수정하려면 단계 삭제 후 재생성. Phase 2.x에서 개선

---

## 🔗 주요 문서

- [CLAUDE.md](CLAUDE.md) — 프로젝트 컨벤션
- [docs/](docs/) — Phase별 PRD
- [노션 페이지](https://www.notion.so/354b1787a688816583c3f9e2348a3f71) — 개발일지
- [GitHub 저장소](https://github.com/rinooks/fadlet)
- [Vercel 배포](https://fadlet.vercel.app)
