# Fadlet

> **Facilitator-friendly Padlet** — 워크숍 운영자를 위한 협업 보드 SaaS

한국 기업교육 워크숍에 최적화된 실시간 협업 보드 플랫폼. 패들렛이 채우지 못한 운영자(Facilitator) 관점의 자리를 정확히 메우는 도구.

---

## 🎯 한 줄 요약

가입 없이 6자리 코드로 즉시 합류, 보드와 채팅을 한 화면에서 관리, KPT·4F·9 Window 등 한국 HRD 표준 템플릿 내장.

---

## 📂 문서 구조

| 파일 | 내용 | 언제 읽을지 |
|---|---|---|
| [`CLAUDE.md`](./CLAUDE.md) | Claude Code 작업 시 항상 참조할 컨벤션·원칙 | **모든 세션 시작 시** |
| [`docs/00-overview.md`](./docs/00-overview.md) | 제품 비전·페르소나·차별화·기술 스택 | 컨텍스트 잡을 때 |
| [`docs/01-phase1-mvp.md`](./docs/01-phase1-mvp.md) | **Phase 1 (1주차)** — MVP 최소 기능 | Phase 1 작업 시 |
| [`docs/02-phase2-expansion.md`](./docs/02-phase2-expansion.md) | **Phase 2 (2-4주차)** — 상품성 확보 | Phase 2 작업 시 |
| [`docs/03-phase3-saas.md`](./docs/03-phase3-saas.md) | **Phase 3 (5-8주차)** — SaaS 인프라 | Phase 3 작업 시 |
| [`docs/data-schema.md`](./docs/data-schema.md) | Firestore 데이터 구조·보안 규칙 | DB 설계·수정 시 |
| [`docs/deployment.md`](./docs/deployment.md) | GitHub·Vercel·Firebase 배포 가이드 | 배포 작업 시 |

---

## 🏗 기술 스택 요약

| 계층 | 도구 |
|---|---|
| 프론트엔드 | Next.js 14 (App Router) + TypeScript |
| 스타일링 | Tailwind CSS + shadcn/ui |
| DB·인증·스토리지 | Firebase (Firestore + Auth + Storage) |
| 호스팅 | Vercel |
| 저장소 | GitHub |
| 결제 (Phase 3) | 토스페이먼츠 |

---

## 🚀 빠른 시작

```bash
# 1. 저장소 클론
git clone https://github.com/[username]/fadlet.git
cd fadlet

# 2. 의존성 설치
pnpm install

# 3. 환경 변수 설정
cp .env.example .env.local
# Firebase 프로젝트 키 입력

# 4. 개발 서버 실행
pnpm dev
```

자세한 셋업은 [`docs/deployment.md`](./docs/deployment.md) 참조.

---

## 📅 개발 일정

| Phase | 기간 | 핵심 산출물 |
|---|---|---|
| **Phase 1** | Week 1 | 보드 + 텍스트 포스트 + 익명 로그인 + 기본 채팅 |
| **Phase 2** | Week 2-4 | 이미지·파일·반응·HRD 템플릿 4종 |
| **Phase 3** | Week 5-8 | 운영자 모드·결제·워크스페이스·런칭 |

---

## 📝 라이센스 / 운영

© 2026 REFERENCE HRD. All Rights Reserved.

문의: pjh@referencehrd.com
