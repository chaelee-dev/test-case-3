---
doc_type: architecture
version: v0.1 (Draft)
status: Draft
author: yongtae.cho@bespinglobal.com
date: 2026-05-15
gate: C
related:
  R-ID: [R-N-01, R-N-02, R-N-03, R-N-04, R-N-05]
  F-ID: []
  supersedes: null
---

# Conduit (RealWorld) — System Architecture

## 변경 이력

| Version | Date | Author | Change |
|---|---|---|---|
| v0.1 | 2026-05-15 | yongtae.cho@bespinglobal.com | 초안 — Brief(01)·Feasibility(02)·SRS(04) 입력으로 Stack 결정 및 컨테이너 구조 확정 |

## Stack Decision

> ADR-0031 — 06은 Architecture 본체. 모듈 분해는 07 HLD §1로 이전한다. 본 표는 언어·프레임워크 결정만 BLOCK 강제.

| 항목 | 결정 | 근거 |
| --- | --- | --- |
| 언어 | TypeScript 5.x (frontend + backend 동일) | 02 §2 후보 채택, 단일 언어로 onboarding·리뷰 비용 ↓, RealWorld JS 구현 reference 다수 |
| 프레임워크 | Frontend: React 18 + Vite 5 / Backend: Express 4 + Prisma 5 | RealWorld 명세 reference 다수, ecosystem 성숙. SSR 비목표(Brief §5)이므로 Vite SPA 채택 |
| 런타임 | Node.js 20 LTS | TS5 + Prisma5 호환, devtoolkit.config.yaml 기본값 일부 override |
| DB | PostgreSQL 16 | RDB 1 인스턴스로 충분(02 §3), Prisma 1급 지원 |
| 인증 | JWT (`jsonwebtoken`) + bcrypt | RealWorld 명세 정본 (Authorization: Token), 외부 IdP 비목표 |
| 검증 | Zod (요청 검증) | TS native, 에러 → 422 envelope으로 매핑 용이 |
| Styling | Tailwind CSS 3 + Bootstrap 4 conduit 토큰 매핑 | 10 §3 디자인 토큰과 12 §8 매핑 (ADR-0038) |
| 테스트 | Vitest(단위·통합) + Playwright(E2E) | 02 후보, 11·13에서 도구·룰셋 확정 |
| 빌드/Dev | pnpm 9 workspace (`frontend/`·`backend/`) | 단일 lockfile, 12 §1 트리와 정합 |
| 배포 | dev/stg/prod 3 profile (ADR-0037 v1.1) | R-N-04 강제, 12 §6·§7 표가 정본 |

## 1. 시스템 컨텍스트

```
                       ┌────────────────────┐
                       │  Browser (SPA)     │
                       │  React + Vite      │
                       │  JWT in localStorage│
                       └────────┬───────────┘
                                │ HTTPS  JSON
                                ▼
                       ┌────────────────────┐
                       │  Conduit API       │
                       │  Node 20 + Express │
                       │  Prisma ORM        │
                       └────────┬───────────┘
                                │ TCP 5432
                                ▼
                       ┌────────────────────┐
                       │  PostgreSQL 16     │
                       └────────────────────┘
```

- **Actor** — Writer / Reader / Visitor (03 페르소나), toolkit 내부 검증자.
- **Trust boundary** — Browser ↔ API 간 JWT 검증. API ↔ DB 간 내부망(VPC 또는 동일 호스트).
- **No external 3rd-party** — 이미지·이메일·OAuth·analytics 미사용(Brief §5).

## 2. 컨테이너 구조

총 3개 컨테이너(개념). 모두 단일 저장소(monorepo) 내에 위치.

- **C1 frontend** (`frontend/`) — React 18 SPA, Vite dev server (5173) / prod 정적 번들. 책임: 9 route 렌더링, JWT localStorage 관리, API 호출.
- **C2 backend** (`backend/`) — Node 20 + Express HTTP API (3000). 책임: RealWorld 19 endpoint, JWT sign/verify, Zod 검증, Prisma DAO.
- **C3 database** (`docker-compose`) — PostgreSQL 16 (5432). 책임: User·Profile·Article·Comment·Tag·Favorite·Follow 영속화. dev profile은 docker-compose, stg/prod는 managed 인스턴스.

**상호작용**

- C1 → C2 — `fetch`/TanStack Query. Authorization 헤더는 `Token <jwt>`(RealWorld 정본).
- C2 → C3 — Prisma client, pool 사이즈는 12 §6 env로 분리.
- C2 → C2(내부) — 미들웨어 체인: requestLogger → cors → jsonParser → auth(optional) → router → errorHandler.

**Profile 매핑 (R-N-04)**

- **dev** — C1: vite dev, C2: tsx watch, C3: docker-compose postgres
- **stg** — C1: built static + node serve, C2: built bundle, C3: managed PG
- **prod** — C1·C2·C3 모두 stg와 동일 구성, 시크릿/도메인/리소스만 분리

## 3. 외부 시스템 / 경계

- **외부 의존** — 없음.
- **명세 reference** — RealWorld Postman collection(`gothinkster/realworld`)이 외부 검증 자산. AI 게이트(D-06 1단)와 CI에서 실행.
- **theme reference** — Bootstrap 4 conduit-bootstrap-template은 디자인 토큰 출처(10 §3에 인용). 런타임 의존 아님.
