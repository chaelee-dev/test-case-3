# test-case-3 — 로컬에서 켜기

> **목적**: 이 저장소를 처음 clone한 사람이 *이 파일 1개*만 따라 하면 dev/stg/prod 3 profile 모두 로컬에서 부팅 가능하도록 한다.
> **정본 위치**: 이 파일은 newProject 루트의 *유저 facing* 정본. 부팅 자산 *정의*의 SoT는 `docs/planning/12-scaffolding/12-scaffolding.md` §7. 두 문서는 매 PR에서 동기 갱신된다(ADR-0037 v1.1 + ADR-0040).
> **진화 규칙**: 부팅 자산(`.env.{dev,stg,prod}.example`·migrations·lockfile·setup scripts·부팅 명령)이 변경되면 본 파일도 같은 PR에서 갱신. AI 게이트 6번째 축이 동기 누락을 BLOCK한다.

---

## 변경 이력

| Version | Date | Author | Change |
|---|---|---|---|
| v0.1 | 2026-05-15 | 이채 | 초안 — install.sh가 LOCAL.template.md를 카피해 생성. 첫 채움은 12-scaffolding §7 작성 직후. |

---

## 1. 사전 요구사항

> 본 절은 12-scaffolding §1 디렉토리 트리 + §2 패키지 명명 규칙에서 도출.

- **언어/런타임**: {{예: Node.js 20 LTS, Python 3.12, Java 21, ...}}
- **패키지 매니저**: {{예: pnpm 9, uv, gradle wrapper, ...}}
- **컨테이너 (선택)**: {{Docker 24+, docker-compose v2, ...}}
- **DB**: {{PostgreSQL 16, MySQL 8, SQLite, ...}}
- **OS 가정**: {{macOS / Linux / WSL2}}

---

## 2. 처음 한 번 셋업 (Initial Setup)

```bash
# 1) clone
git clone <repo-url>
cd <repo-name>

# 2) 의존성 설치
{{설치 명령 — 예: pnpm install}}

# 3) 환경 변수 파일 준비 — profile별로 1벌씩
cp .env.dev.example .env.dev
cp .env.stg.example .env.stg
cp .env.prod.example .env.prod
# .env.{dev,stg,prod} 안의 시크릿(JWT_SECRET·DB_PASSWORD 등)을 실제 값으로 채움
# 각 profile별로 다른 값 사용 권장

# 4) DB 마이그레이션 (dev profile 기준)
{{마이그레이션 명령 — 예: pnpm prisma:migrate}}

# 5) seed 데이터 (dev profile)
{{seed 명령 — 예: pnpm seed:dev}}
```

---

## 3. Profile별 부팅 명령

> **profile 3분기 강제 (ADR-0037 v1.1)** — 매 PR에서 3 profile 모두 부팅 검증된다. 본 절의 명령이 그대로 AI 게이트 6번째 축에서 실행된다.

### 3.1 dev profile (로컬 개발)

```bash
{{dev 부팅 명령 — 예: pnpm dev:local}}
```

- 기대 출력: `{{ready 신호 — 예: :3000 listening}}`
- 환경 변수 출처: `.env.dev`
- DB: `{{dev DB 위치 — 예: localhost:5432/myapp_dev}}`
- Hot reload: {{O / X}}

### 3.2 stg profile (스테이징 — 로컬에서 stg 환경 흉내)

```bash
{{stg 부팅 명령 — 예: pnpm dev:stg}}
```

- 기대 출력: `{{ready 신호}}`
- 환경 변수 출처: `.env.stg`
- DB: `{{stg DB 위치 — 또는 'dev DB 공유' 명시}}`
- Hot reload: 보통 X (빌드 산출물 기반)
- **단일 환경 운영 시**: 본 절을 "N/A — stg=prod 공유 운영"으로 표기

### 3.3 prod profile (로컬에서 prod 환경 흉내)

```bash
{{prod 부팅 명령 — 예: pnpm start:prod}}
```

- 기대 출력: `{{ready 신호}}`
- 환경 변수 출처: `.env.prod`
- DB: `{{prod DB 위치 — 보통 별 인스턴스 권장}}`
- Hot reload: X (빌드 산출물)
- **단일 환경 운영 시**: N/A 표기

---

## 4. 부팅 자산 (Runnability Assets)

> 본 표는 `docs/planning/12-scaffolding/12-scaffolding.md` §7과 동기. 자산이 변경되면 양쪽 모두 갱신.

| 자산 | 경로 | 변경 trigger | 갱신 책임 |
|---|---|---|---|
| 환경 변수 템플릿 | `.env.{dev,stg,prod}.example` | 새 환경 변수 추가 | 변수를 도입한 이슈 |
| DB migrations | `{{prisma/migrations 등}}` | 스키마 변경 | 모델 변경 이슈 |
| lockfile | `{{pnpm-lock.yaml 등}}` | 의존성 추가/변경 | 의존성 도입 이슈 |
| 설치/seed scripts | `package.json scripts.{setup,migrate,seed,seed:dev,seed:stg,seed:prod}` | seed 데이터 변경 | seed 변경 이슈 |
| 부팅 명령 | 본 LOCAL.md §3 + `package.json scripts.dev:*` | 명령 변경 | 명령 변경 이슈 |
| 컨테이너 정의 (선택) | `Dockerfile`·`docker-compose.{dev,stg,prod}.yml` | infra 변경 | infra 이슈 |

---

## 5. 자주 발생하는 문제 (Troubleshooting)

> newProject 도입 후 부팅 시 발견되는 문제를 *이슈 단위*로 본 절에 누적. AI 게이트 6번째 축이 부팅 실패를 BLOCK하지만, *해결 방법*은 본 절이 정본.

### 5.1 포트 충돌 (`EADDRINUSE`)

```bash
{{포트 사용 중 프로세스 확인 명령 — 예: lsof -i :3000}}
```

### 5.2 환경 변수 누락 (`X is required`)

해당 변수가 `.env.{dev,stg,prod}.example` 3 벌 모두에 정의됐는지 확인. profile 동기 누락이 가장 흔한 패턴.

### 5.3 DB 연결 실패

- DB 컨테이너 실행 여부: `docker compose ps`
- profile별 DB URL 일치 여부: `.env.{dev,stg,prod}` 안의 `DATABASE_URL`

### 5.4 (newProject별 추가 — 발견 시점에 본 절에 누적)

---

## 6. 외부 의존 (선택)

> 외부 서비스(Auth0·Stripe·S3 등) 또는 컨테이너 의존이 있으면 본 절에 셋업 절차 명시.

- {{서비스명}}: {{셋업 절차 또는 mock 사용 방법}}

---

## 7. 본 문서 갱신 책임 (메타)

- **누가**: 부팅 자산을 변경하는 이슈의 PR 작성자(에이전트 또는 사람)
- **언제**: 같은 PR 안에서 갱신. 별 hotfix PR로 미루지 않음 (ADR-0037 §2.3)
- **검증**: AI 게이트 6번째 축이 (a) 부팅 자산 diff 여부, (b) 본 LOCAL.md 갱신 여부를 동시 확인. 한쪽만 변경 시 BLOCK
- **상위 SoT 동기**: 본 절차가 12-scaffolding §7과 다르면 `/docs-update`가 정합 검수에서 WARN. 양쪽 동기가 우선
