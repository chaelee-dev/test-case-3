# test-case-3 (Conduit / RealWorld) — 로컬에서 켜기

> **목적**: 이 저장소를 처음 clone한 사람이 *이 파일 1개*만 따라 하면 dev/stg/prod 3 profile 모두 로컬에서 부팅 가능하도록 한다.
> **정본 위치**: 이 파일은 newProject 루트의 *유저 facing* 정본. 부팅 자산 *정의*의 SoT는 `docs/planning/12-scaffolding/typescript.md` §7. 두 문서는 매 PR에서 동기 갱신된다(ADR-0037 v1.1 + ADR-0040).
> **진화 규칙**: 부팅 자산(`.env.{dev,stg,prod}.example`·migrations·lockfile·setup scripts·부팅 명령)이 변경되면 본 파일도 같은 PR에서 갱신. AI 게이트 6번째 축이 동기 누락을 BLOCK한다.

---

## 변경 이력

| Version | Date | Author | Change |
|---|---|---|---|
| v0.1 | 2026-05-15 | yongtae.cho@bespinglobal.com | 초안 — 12-scaffolding/typescript.md §7 작성과 함께 첫 채움 (ADR-0040) |
| v0.2 | 2026-05-16 | yongtae.cho@bespinglobal.com | §2 단계 5 prisma:push:dev, §3.1~3.3 dotenv-cli 동치, §4 표 + §5.3 troubleshooting 갱신 (PR #37 후속 hotfix) |

---

## 1. 사전 요구사항

> 본 절은 12-scaffolding/typescript.md §1 디렉토리 트리 + §2 패키지 명명 규칙에서 도출.

- **언어/런타임**: Node.js 20 LTS (TypeScript 5.x)
- **패키지 매니저**: pnpm 9 (corepack enable 또는 `npm i -g pnpm@9`)
- **컨테이너 (선택)**: Docker 24+ + docker-compose v2 — dev profile DB용
- **DB**: PostgreSQL 16 (dev는 docker-compose, stg/prod는 managed 인스턴스)
- **OS 가정**: macOS / Linux / WSL2

---

## 2. 처음 한 번 셋업 (Initial Setup)

```bash
# 1) clone
git clone <repo-url> test-case-3
cd test-case-3

# 2) 의존성 설치 (pnpm workspace)
pnpm install

# 3) 환경 변수 파일 준비 — profile별로 1벌씩
cp .env.dev.example .env.dev
cp .env.stg.example .env.stg
cp .env.prod.example .env.prod
# .env.{dev,stg,prod} 안의 시크릿(JWT_SECRET·DB_PASSWORD 등)을 실제 값으로 채움
# 각 profile별로 다른 값 사용 권장 (dev만 example 값 그대로 OK)

# 4) dev DB 부팅 (docker-compose)
docker compose up -d postgres
# → localhost:5432/conduit_dev 가동

# 5) DB 스키마 적용 (dev profile, 최초 1회)
pnpm prisma:push:dev
# → schema.prisma → DB로 push (migration 파일 불필요, dev iteration용)
# 정식 migration 흐름을 원하면: pnpm migrate:init  (init migration 생성 + 적용)
# stg/prod에선 pnpm migrate (migrate deploy)로 기존 migration 파일만 적용

# 6) seed 데이터 (dev profile)
pnpm seed:dev
```

---

## 3. Profile별 부팅 명령

> **profile 3분기 강제 (ADR-0037 v1.1)** — 매 PR에서 3 profile 모두 부팅 검증된다. 본 절의 명령이 그대로 AI 게이트 6번째 축에서 실행된다.

### 3.1 dev profile (로컬 개발)

```bash
# backend (3000)
pnpm dev:backend
# 동치: pnpm --filter @conduit/backend dev
#       → dotenv-cli가 ../.env.dev 로드 후 tsx watch src/server.ts
# (./devkit dev backend 도 동일 — devtoolkit.config.yaml commands.backend.run이 위 명령으로 매핑)

# frontend (5173, 별 터미널)
pnpm dev:frontend
# 동치: pnpm --filter @conduit/frontend dev    # vite (.env.dev의 VITE_API_BASE_URL 사용)
```

- 기대 출력: `:3000 listening` (backend), `Local: http://localhost:5173/` (frontend)
- 환경 변수 출처: `.env.dev`
- DB: `localhost:5432/conduit_dev`
- Hot reload: O (backend tsx watch, frontend vite HMR)

### 3.2 stg profile (스테이징 — 로컬에서 stg 환경 흉내)

```bash
# 빌드 → 실행
pnpm build
pnpm start:stg
# 동치:
#   pnpm --filter @conduit/backend start:stg    # dotenv -e ../.env.stg -- node dist/server.js
#   pnpm --filter @conduit/frontend exec vite preview --port 4173   # frontend 정적 (4173)
```

- 기대 출력: `:3000 listening` (backend), `Accepting connections at http://localhost:4173` (frontend)
- 환경 변수 출처: `.env.stg`
- DB: `.env.stg` 의 `DATABASE_URL` (별 PG 인스턴스 권장, 로컬에서 흉내 시 `conduit_stg` 별 DB로 분리)
- Hot reload: X (빌드 산출물 기반)

### 3.3 prod profile (로컬에서 prod 환경 흉내)

```bash
pnpm build
pnpm start:prod
# 동치:
#   pnpm --filter @conduit/backend start:prod   # dotenv -e ../.env.prod -- node dist/server.js
#   pnpm --filter @conduit/frontend exec vite preview --port 4173
```

- 기대 출력: `:3000 listening`, `Accepting connections at http://localhost:4173`
- 환경 변수 출처: `.env.prod`
- DB: `.env.prod` 의 `DATABASE_URL` (반드시 별 PG 인스턴스, 시크릿은 실제 값)
- Hot reload: X

---

## 4. 부팅 자산 (Runnability Assets)

> 본 표는 `docs/planning/12-scaffolding/typescript.md` §7과 동기. 자산이 변경되면 양쪽 모두 같은 PR에서 갱신.

| 자산 | 경로 | 변경 trigger | 갱신 책임 |
|---|---|---|---|
| 환경 변수 템플릿 | `.env.dev.example`·`.env.stg.example`·`.env.prod.example` (root) | 새 env 키 추가 또는 값 분리 | 변수를 도입한 이슈 |
| 스키마 push (dev) | `backend/package.json scripts.prisma:push:dev` (dotenv-cli + `prisma db push`) | `backend/prisma/schema.prisma` 변경 | 모델 변경 이슈 |
| DB migrations (stg/prod) | `backend/prisma/migrations/` (정식 흐름 시 `pnpm migrate:init`로 최초 생성) | 운영 환경 release 직전 | 운영 release 이슈 |
| lockfile | `pnpm-lock.yaml` | 의존성 추가/upgrade | 의존성 도입 이슈 |
| 설치/seed scripts | `package.json scripts.{setup,prisma:push:dev,migrate,migrate:init,seed:dev,seed:stg,seed:prod}` + `backend/prisma/seed.ts` (모두 dotenv-cli로 profile env 로드) | seed/스크립트 변경 | seed 변경 이슈 |
| 부팅 명령 | 본 LOCAL.md §3 + `package.json scripts.{dev:*,start:*}` | 명령·시그널·포트 변경 | 명령 변경 이슈 |
| 컨테이너 정의 | `docker-compose.yml`(dev DB), `backend/Dockerfile`, `frontend/Dockerfile` | infra 변경 | infra 이슈 |

---

## 5. 자주 발생하는 문제 (Troubleshooting)

> newProject 도입 후 부팅 시 발견되는 문제를 *이슈 단위*로 본 절에 누적. AI 게이트 6번째 축이 부팅 실패를 BLOCK하지만, *해결 방법*은 본 절이 정본.

### 5.1 포트 충돌 (`EADDRINUSE`)

```bash
lsof -i :3000          # backend
lsof -i :5173          # frontend dev
lsof -i :5432          # postgres
# 해당 프로세스 kill 후 재실행
```

### 5.2 환경 변수 누락 (`X is required`)

해당 변수가 `.env.dev.example`·`.env.stg.example`·`.env.prod.example` 3 벌 모두에 정의됐는지 확인. profile 동기 누락이 가장 흔한 패턴.

### 5.3 DB 연결 실패

- DB 컨테이너 실행 여부: `docker compose ps`
- profile별 DB URL 일치 여부: `.env.{dev,stg,prod}` 안의 `DATABASE_URL`
- 스키마 미적용 (dev): `pnpm prisma:push:dev` (또는 정식 흐름 `pnpm migrate:init` — 최초 1회)
- stg/prod 미적용: `pnpm migrate` (= `prisma migrate deploy`, 기존 migration 파일만 적용)
- 모든 스크립트가 dotenv-cli로 root `.env.{profile}`을 로드하므로 backend cwd에서 직접 `npx prisma`를 호출하면 `DATABASE_URL` 누락 에러가 납니다. 항상 `pnpm <script>` 형태로 호출하세요.

### 5.4 JWT 검증 실패 (401 무한 루프)

- `.env.{dev,stg,prod}` 의 `JWT_SECRET`이 backend가 토큰을 발급한 시점과 동일한지 확인.
- localStorage의 `conduit.jwt` 삭제 후 재로그인.

---

## 6. 외부 의존 (선택)

> 외부 서비스(Auth0·Stripe·S3 등) 또는 컨테이너 의존이 있으면 본 절에 셋업 절차 명시.

- 본 프로젝트는 **외부 의존 없음** (06 §3). 이미지·이메일·OAuth·analytics 미사용.
- dev DB는 `docker-compose.yml`의 `postgres` 서비스로 충당.

---

## 7. 본 문서 갱신 책임 (메타)

- **누가**: 부팅 자산을 변경하는 이슈의 PR 작성자(에이전트 또는 사람)
- **언제**: 같은 PR 안에서 갱신. 별 hotfix PR로 미루지 않음 (ADR-0037 §2.3)
- **검증**: AI 게이트 6번째 축이 (a) 부팅 자산 diff 여부, (b) 본 LOCAL.md 갱신 여부를 동시 확인. 한쪽만 변경 시 BLOCK
- **상위 SoT 동기**: 본 절차가 12-scaffolding/typescript.md §7과 다르면 `/docs-update`가 정합 검수에서 WARN. 양쪽 동기가 우선
