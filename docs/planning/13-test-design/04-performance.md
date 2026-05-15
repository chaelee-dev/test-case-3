---
doc_type: test-design
version: v0.1 (Draft)
status: Draft
author: yongtae.cho@bespinglobal.com
date: 2026-05-15
gate: C
related:
  R-ID: [R-N-02, R-N-03]
  F-ID: []
  supersedes: null
---

# 04-performance Performance & Security Tests — test-design

## 변경 이력

| Version | Date | Author | Change |
|---|---|---|---|
| v0.1 | 2026-05-15 | yongtae.cho@bespinglobal.com | 초안 — R-N-02 성능 + R-N-03 보안 측정 도구·시점 확정 |

## 1. 성능 테스트

- **대상 R-ID** R-N-02.
- **목표** Home·Article 핵심 API의 P95 < 500ms (dev 단일 인스턴스, warm cache, 1000-row seed).
- **시나리오**
  - S-P-01: `GET /api/articles` (Global Feed, limit=20) — 50 RPS / 5분
  - S-P-02: `GET /api/articles/feed` (인증, follow 10명) — 30 RPS / 5분
  - S-P-03: `GET /api/articles/:slug` 단건 — 50 RPS / 5분
  - S-P-04: `GET /api/tags` — 20 RPS / 1분
- **메트릭** P50/P95/P99 응답시간, RPS, 에러율 < 0.1%.
- **임계 위반** → N+1 진단(Prisma query log) → 인덱스 추가 또는 비정규화 조정 → 재측정.

## 2. 보안 테스트

- **대상 R-ID** R-N-03.
- **체크리스트** OWASP Top 10 기준 + RealWorld 명세 특이점.
  - **A01 Broken Access Control** — 비작성자 PUT/DELETE 글·댓글 → 403 강제 (통합 테스트 §2 R-F-12 인용).
  - **A02 Cryptographic Failures** — 비밀번호 bcrypt(cost ≥ 10) 적용, JWT_SECRET 32B 이상 강제(`/cso` 시 확인).
  - **A03 Injection** — Prisma parameterized query 사용, raw SQL 0건(`grep -r 'prisma.$queryRaw'` 결과 0).
  - **A05 Security Misconfiguration** — helmet, CORS allowlist, `NODE_ENV=production` 시 stack trace 노출 금지.
  - **A07 Identification/Authentication** — JWT 만료(7d) + 401 인터셉트 동작 확인.
  - **A09 Logging Failures** — 평문 비밀번호·토큰 로그 0건(grep "password" 로그 0).
  - **시크릿 스캔** — gitleaks/truffleHog pre-commit + GitHub secret scanning.
  - **의존성** — `npm audit --audit-level=high` 0건 + Dependabot weekly.

## 3. 도구·시점

| 종류 | 도구 | 시점 | R-ID |
| --- | --- | --- | --- |
| 부하 | autocannon (간단) | sprint 종료 직전 + 의심 변경 시 ad-hoc | R-N-02 |
| 부하 (정밀) | k6 — JS 스크립트, 시나리오 4종 | release 직전 + 주요 마이그레이션 후 | R-N-02 |
| 보안 점검 | `/cso` (gstack) | 매 PR (CI 또는 reviewer 호출) | R-N-03 |
| 의존성 | npm audit + GitHub Dependabot | PR + weekly | R-N-03 |
| 시크릿 스캔 | gitleaks (pre-commit) + GitHub secret scanning | 매 커밋 | R-N-03 |
| API 호환 | Newman + RealWorld Postman collection | 매 PR | R-F-01~15 |
