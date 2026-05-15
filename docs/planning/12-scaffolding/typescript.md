---
doc_type: scaffolding
version: v0.1 (Draft)
status: Draft
author: yongtae.cho@bespinglobal.com
date: 2026-05-15
gate: C
related:
  R-ID: [R-N-01, R-N-03, R-N-04, R-N-05]
  F-ID: []
  supersedes: null
---

# Conduit (RealWorld) — Scaffolding

> 본 파일은 TypeScript 단일 언어 산출 (06 Stack). frontend·backend 모두 동일 언어이므로 1개 파일에 합본.

## 변경 이력

| Version | Date | Author | Change |
|---|---|---|---|
| v0.1 | 2026-05-15 | yongtae.cho@bespinglobal.com | 초안 — 06/07/08 입력으로 pnpm workspace 트리, 3 profile env, 부팅 자산, Tailwind 매핑 확정 |

## 1. 디렉토리 트리

```
test-case-3/
├── package.json                 # workspace root, scripts 진입점
├── pnpm-workspace.yaml          # frontend, backend
├── pnpm-lock.yaml               # 단일 lockfile
├── tsconfig.base.json           # 공유 strict 옵션
├── .env.dev.example             # 3 profile 템플릿
├── .env.stg.example
├── .env.prod.example
├── .editorconfig
├── .eslintrc.cjs                # flat config 또는 cjs
├── .prettierrc.json
├── LOCAL.md                     # 루트 부팅 가이드 (ADR-0040)
├── devkit                       # ADR-0028 단일 진입점
├── devtoolkit.config.yaml       # commands.* 정본
├── docker-compose.yml           # dev profile DB
├── docs/
│   ├── planning/                # 01~15 산출
│   └── features/                # 이슈 단위 산출
├── frontend/                    # C1 (React SPA)
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── postcss.config.cjs
│   ├── index.html
│   └── src/
│       ├── main.tsx             # entry — stylesheet import 위치 (ADR-0038)
│       ├── App.tsx
│       ├── styles/
│       │   └── tailwind.css     # @tailwind base; components; utilities
│       ├── pages/               # M-FE-PAGES
│       │   ├── Home/
│       │   ├── Login/
│       │   ├── Register/
│       │   ├── Settings/
│       │   ├── Editor/
│       │   ├── Article/
│       │   ├── Profile/
│       │   └── NotFound/
│       ├── components/          # M-FE-UI 공용
│       ├── api/                 # M-FE-API (TanStack Query)
│       │   ├── client.ts
│       │   ├── articles.ts
│       │   ├── auth.ts
│       │   ├── profile.ts
│       │   ├── comments.ts
│       │   └── tags.ts
│       ├── auth/                # M-FE-AUTH
│       │   ├── AuthContext.tsx
│       │   ├── useAuth.ts
│       │   └── storage.ts
│       └── lib/
└── backend/                     # C2 (Express)
    ├── package.json
    ├── tsconfig.json
    ├── prisma/
    │   ├── schema.prisma
    │   ├── migrations/
    │   └── seed.ts
    └── src/
        ├── server.ts            # entry — M-HTTP 부팅
        ├── app.ts               # express app + 미들웨어
        ├── modules/             # 08 LLD 모듈별 폴더 (M-AUTH, M-ARTICLE, ...)
        │   ├── auth/
        │   │   ├── auth.routes.ts
        │   │   ├── auth.service.ts
        │   │   ├── auth.schemas.ts   # Zod (M-VALID)
        │   │   ├── password.ts       # bcrypt 유틸
        │   │   └── jwt.ts
        │   ├── profile/
        │   ├── article/
        │   ├── comment/
        │   ├── favorite/
        │   └── tag/
        ├── middleware/          # M-HTTP
        │   ├── cors.ts
        │   ├── auth.ts          # Authorization: Token <jwt> 파싱
        │   ├── error-handler.ts # M-ERR 매핑
        │   └── request-logger.ts
        ├── db/                  # M-DB
        │   ├── client.ts        # PrismaClient 단일 인스턴스
        │   └── tx.ts            # 트랜잭션 헬퍼
        ├── errors/              # M-ERR
        │   ├── AppError.ts
        │   └── mapper.ts
        └── tests/               # vitest 통합·supertest
```

## 2. 패키지 명명 규칙

- **workspace root** — `conduit` (단일 production package 미배포, internal name).
- **frontend 패키지** — `@conduit/frontend` (workspace internal).
- **backend 패키지** — `@conduit/backend`.
- **모듈 디렉토리** — kebab-case 자원명 단수 (`auth`, `article`, `profile`). Prisma model은 PascalCase 단수.
- **publish 금지** — 외부 NPM 배포 없음, `"private": true`.

## 3. 디자인 패턴 결정

- **선택 패턴** — Backend: Layered (route → service → repository(Prisma)). Frontend: Atomic + Feature folder (pages/Feature와 components/ 공용 분리).
- **이유**
  - Backend Layered — Express + Prisma 조합에 표준이며 RealWorld 구현 다수가 채택. 모듈 경계(08 LLD)와 1:1 매핑이 쉬워 trace 명확.
  - Frontend Atomic + Feature — 9 route뿐인 작은 SPA에 적합. `pages/<Route>`는 feature folder, `components/`는 atomic 공용 컴포넌트(Button/Input 등). FSD/Hexagonal은 과잉 abstraction.
- **DDD/MVC/Hexagonal 미채택 사유** — 도메인 복잡도가 낮고(7 도메인 모델, 19 endpoint) bounded context가 1개. 추가 추상화의 비용 > 이익.

## 4. 모듈 경계 (08-lld-module-spec와 fan-out)

| 08 모듈 | 12 위치 (디렉토리/파일) | 비고 |
| --- | --- | --- |
| M-AUTH | `backend/src/modules/auth/` | service + jwt.ts + password.ts |
| M-PROFILE | `backend/src/modules/profile/` | follow 관계 포함 |
| M-ARTICLE | `backend/src/modules/article/` | feedQuery·slugGenerator 분리 |
| M-COMMENT | `backend/src/modules/comment/` | |
| M-FAVORITE | `backend/src/modules/favorite/` | |
| M-TAG | `backend/src/modules/tag/` | |
| M-DB | `backend/src/db/` | client.ts + tx.ts |
| M-HTTP | `backend/src/app.ts`, `backend/src/middleware/` | server.ts에서 부팅 |
| M-VALID | 각 모듈 안 `<module>.schemas.ts` | 모듈별 분산 (cohesion) |
| M-ERR | `backend/src/errors/` | AppError + mapper |
| M-FE-AUTH | `frontend/src/auth/` | AuthContext + useAuth + storage |
| M-FE-API | `frontend/src/api/` | TanStack Query 정의 |
| M-FE-PAGES | `frontend/src/pages/` | 9 route 폴더 |
| M-FE-UI | `frontend/src/components/` | 디자인 토큰 적용 |

## 5. 빌드·실행

> 단일 진입점은 루트 `./devkit` (ADR-0028). 정본은 `devtoolkit.config.yaml` `commands.*`.

```
# install (전체)
./devkit install all
# 동치: pnpm install

# build
./devkit build all
# 동치: pnpm -r build      (frontend → tsc + vite build / backend → tsc)

# test (단위·통합)
./devkit test all
# 동치: pnpm -r test       (vitest run + supertest)

# E2E
./devkit e2e
# 동치: pnpm --filter @conduit/frontend exec playwright test

# dev server
./devkit dev frontend      # → pnpm --filter @conduit/frontend dev (vite, :5173)
./devkit dev backend       # → pnpm --filter @conduit/backend dev (tsx watch, :3000)
```

## 6. 환경 변수 / 설정 분리

> ADR-0037 v1.1 — 3 profile 분기 강제. profile별 .env.* 1벌씩, 시크릿은 git ignore.

| 키 | dev | stg | prod | 노출 위치 |
| --- | --- | --- | --- | --- |
| `NODE_ENV` | `development` | `staging` | `production` | backend, frontend build |
| `PORT` | `3000` | `3000` | `3000` | backend |
| `DATABASE_URL` | `postgresql://conduit:conduit@localhost:5432/conduit_dev` | `postgresql://...stg-host/conduit_stg` | `postgresql://...prod-host/conduit_prod` | backend (M-DB) |
| `JWT_SECRET` | `dev-secret-do-not-use-in-prod` | `<32-byte random>` | `<32-byte random>` | backend (M-AUTH) |
| `JWT_EXPIRES_IN` | `7d` | `7d` | `7d` | backend (M-AUTH) |
| `BCRYPT_COST` | `10` | `12` | `12` | backend (R-N-03) |
| `CORS_ORIGIN` | `http://localhost:5173` | `https://stg.conduit.example.com` | `https://conduit.example.com` | backend (M-HTTP) |
| `LOG_LEVEL` | `debug` | `info` | `warn` | backend |
| `RATE_LIMIT_PER_MIN` | `0` (off) | `60` | `60` | backend |
| `VITE_API_BASE_URL` | `http://localhost:3000` | `https://stg-api.conduit.example.com` | `https://api.conduit.example.com` | frontend build-time |

## 7. 부팅 자산 (Runnability Assets)

> ADR-0037 v1.1 + ADR-0040 — 본 표가 부팅 자산의 SoT. LOCAL.md §4가 미러. 매 PR 동기.

| 자산 | 경로 (profile별) | 변경 trigger 이슈 유형 | 갱신 책임 |
| --- | --- | --- | --- |
| 환경 변수 템플릿 | `.env.dev.example`·`.env.stg.example`·`.env.prod.example` | 새 env 키 추가 또는 값 분리 | 변수를 도입한 이슈 |
| DB migrations | `backend/prisma/migrations/` (3 profile 공유) | schema.prisma 변경 | 모델 변경 이슈 |
| lockfile | `pnpm-lock.yaml` (단일) | dependency 추가/upgrade | 의존성 이슈 |
| 설치/seed scripts | `package.json scripts.{setup,migrate,seed:dev,seed:stg,seed:prod}` + `backend/prisma/seed.ts` | seed 데이터 변경 | seed 변경 이슈 |
| 부팅 명령 | dev: `./devkit dev backend` + `./devkit dev frontend` / stg: `pnpm start:stg` / prod: `pnpm start:prod` (NODE_ENV·.env.* 전환) | 명령·시그널·포트 변경 | 명령 변경 이슈 |
| 컨테이너 정의 | `docker-compose.yml`(dev DB), `Dockerfile`(stg·prod build) | infra 변경 | infra 이슈 |
| LOCAL.md (루트 가이드) | `LOCAL.md` | 위 자산 어느 하나라도 변경되면 동기 갱신 | 자산 변경 이슈 (ADR-0040) |

## 8. 스타일링 솔루션

> ADR-0038 — frontend가 있으므로 1종 이상 선택 강제. 10 §3 디자인 토큰을 Tailwind config로 매핑.

| 항목 | 결정 |
| --- | --- |
| 솔루션 | **Tailwind CSS 3** (utility-first) + Bootstrap 4 conduit theme 토큰을 `tailwind.config.ts`로 매핑 |
| 이유 | (1) 10 §3 토큰을 config 1곳에서 표현 가능, (2) RealWorld bootstrap class와의 비주얼 호환을 유지하면서 React 컴포넌트와 자연스럽게 결합, (3) PurgeCSS로 prod 번들 작음 |
| 의존성 | `frontend/package.json` devDependencies: `tailwindcss@3`, `postcss@8`, `autoprefixer@10`, `@tailwindcss/forms`(폼 베이스), `@tailwindcss/typography`(article markdown) |
| entrypoint 적용 | `frontend/src/main.tsx`에서 `import './styles/tailwind.css'` (파일 내용: `@tailwind base; @tailwind components; @tailwind utilities;`). PR마다 stylesheet import 존재 검증(AI 게이트 5번째 축) |
| 디자인 토큰 매핑 | 10 §3 → `tailwind.config.ts` `theme.extend`: `colors.primary = '#5cb85c'`, `colors.danger = '#b85c5c'`, `fontFamily.body = ['Source Sans Pro', 'sans-serif']`, `spacing.xs = '4px'` 등. Component primitives(Button/Input/Card)는 `@apply` 또는 React 컴포넌트의 className prop으로 제공 |
