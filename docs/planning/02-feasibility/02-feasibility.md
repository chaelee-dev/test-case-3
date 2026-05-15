---
doc_type: feasibility
version: v0.1 (Draft)
status: Draft
author: yongtae.cho@bespinglobal.com
date: 2026-05-15
gate: A
related:
  R-ID: []
  F-ID: []
  supersedes: null
---

# Conduit (RealWorld) — Feasibility

## 변경 이력

| Version | Date | Author | Change |
|---|---|---|---|
| v0.1 | 2026-05-15 | yongtae.cho@bespinglobal.com | 초안 — Brief(01) 기반 타당성 검토 |

## 1. 시장·환경 검토

- **RealWorld 명세 안정성** — `gothinkster/realworld` GitHub 18k+ star, 150+ 구현 (codebase.show/projects/realworld). 명세 변경 거의 없음(2018 안정화). reference·테스트 자산 풍부.
- **외부 의존 0** — 호스팅 데모 API + Postman collection이 공개되어 별도 API key·계정 없이 검증 가능.
- **경쟁/대체** — 본 프로젝트는 상업적 경쟁이 아닌 reference implementation. 차별점은 toolkit NEW_PROJECT 흐름과의 통합 검증(D-06 1·2단, 3 profile 부팅 검증, AI 게이트 6축).

## 2. 기술 타당성

본 단계에서는 *후보*만 제시한다. 게이트 C(`/implementation-planner --mode=hld`)에서 확정한다.

- **Frontend 후보** — React 18 + TypeScript + Vite + Tailwind(또는 Bootstrap 4 conduit theme), TanStack Query(서버 상태), React Router. JWT는 localStorage(명세 명시).
- **Backend 후보** — Node 20 + Express + Prisma + PostgreSQL 16, JWT(jsonwebtoken), bcrypt(비밀번호 해시), Zod(입력 검증).
- **인프라 후보** — Docker Compose(dev), Fly.io / Render / Vercel(stg·prod 후보). RDB 1 인스턴스로 충분.
- **검증** — 모든 후보 스택은 RealWorld 구현 다수 존재(예: Node+Express+Sequelize, Node+Express+Prisma) → 기술 미지수 ≈ 0.

## 3. 비용·리소스 추정

- **인원** — developer 1~2명 (toolkit `/implement` 자동화 가정).
- **개발 기간** — ~6주 (3 sprint, Brief §6).
- **인프라 비용** — dev/stg/prod 합쳐 < $20/월 (PostgreSQL hobby tier + 정적 호스팅 + Node API 1 인스턴스).
- **외부 서비스 비용** — 0 (이미지·이메일 외부 서비스 미사용).
- **toolkit/AI 비용** — D-06 1단(AI 게이트) 토큰 비용은 sprint당 < $5 추정.

## 4. 기대 효과

- **toolkit 자체 검증** — 게이트 A·B·C → WBS → sprint-bootstrap → /implement → AI 게이트 → 휴먼 게이트의 end-to-end가 실제 코드로 동작함을 입증.
- **온보딩 자산** — 신규 개발자가 풀스택 표준 패턴(Auth·CRUD·관계·페이지네이션)을 한 저장소에서 학습.
- **벤치마크 베이스** — 차후 다른 스택(Go, Django 등) 비교 / 성능 측정 시 출발점.
- **외부 호환성** — RealWorld 명세 준수로 다른 RealWorld frontend·backend와 mix-and-match 가능 (예: 본 backend + 외부 React frontend).

## 5. 검토된 대안

- **A. RealWorld 명세 그대로 구현 (REST + JWT + RDB)** — 추천. 명세 충실, reference 풍부, 검증 자산 즉시 사용.
- **B. GraphQL로 변형** — RealWorld 명세는 REST 정본. GraphQL은 외부 호환성·Postman 검증 자산 무력화 → 기각.
- **C. Headless CMS(Strapi 등) 기반 가공** — 명세 endpoint 완전 충족 어려움(예: `/api/articles/feed` 인증된 follow 그래프), 학습 가치 ↓ → 기각.
- **D. BaaS(Firebase·Supabase)** — JWT envelope과 다른 인증 모델, 명세 endpoint 충족을 위한 추가 어댑터 필요 → 기각.
- **E. SSR(Next.js) 우선** — 비목표(SEO/SSR) 위배, 초기 복잡도 증가 → 기각. CSR(Vite) 채택.

## 6. 추천

**A 안 채택** — RealWorld 명세 그대로 REST + JWT + PostgreSQL + React SPA. 위험 낮고 reference 풍부하며 toolkit 흐름 검증 목적에 정합.

게이트 C(`/flow-design`)에서 구체 스택과 라이브러리 버전, 그리고 Brief §7 RISK들(N+1, slug 정책, JWT 만료, Bootstrap theme ↔ ADR-0038 매핑)에 대한 결정을 ADR로 기록한다.
