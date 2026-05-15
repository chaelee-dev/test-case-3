---
doc_type: test-design
version: v0.1 (Draft)
status: Draft
author: yongtae.cho@bespinglobal.com
date: 2026-05-15
gate: C
related:
  R-ID: [R-N-02, R-N-03, R-N-04, R-N-05]
  F-ID: []
  supersedes: null
---

# 01-strategy Test Strategy — test-design

## 변경 이력

| Version | Date | Author | Change |
|---|---|---|---|
| v0.1 | 2026-05-15 | yongtae.cho@bespinglobal.com | 초안 — TDD/BDD 혼합, Vitest/supertest/Playwright, 단위 80% / 통합 80% / E2E 100% golden-path 명시 |

## 1. 방법론 (TDD/BDD)

본 프로젝트는 **TDD + BDD 혼합** 전략을 채택한다.

- **단위 테스트 = TDD** — 순수 함수(`slugGenerator`, `passwordHasher`, `tagNormalizer`, `jwtSigner`, `errorMapper` 등)는 *red → green → refactor* 사이클로 먼저 테스트를 작성한 뒤 구현한다. 입력→출력 결정적이므로 TDD 효과가 가장 크다.
- **통합 테스트 = TDD 또는 동시 작성** — supertest로 endpoint 시나리오를 작성 후 service 구현. 04 SRS의 Given/When/Then 절을 그대로 옮긴다.
- **E2E = BDD** — Playwright 시나리오는 03 User Scenarios UC-01~UC-12를 "Given a logged-in writer, When she publishes, Then …" 식으로 1:1 매핑.
- **NFR(R-N-02 성능·R-N-03 보안)** — 비-TDD. 도구 기반 측정(autocannon / `/cso` 점검)으로 게이트 충족 여부만 확인.

## 2. 도구 선택

| 레벨 | 도구 | 이유 |
| --- | --- | --- |
| 단위 (frontend) | Vitest + React Testing Library | Vite 환경 통합, jsdom 빠른 부팅 |
| 단위 (backend) | Vitest + node 환경 | 단일 테스트 러너로 onboarding ↓ |
| 통합 (backend) | Vitest + supertest + Prisma testcontainers(또는 ephemeral PG schema) | 실제 PG에 fixture 데이터로 검증 |
| E2E | Playwright (chromium 우선, firefox·webkit smoke) | 3 page object 패턴, MIT 라이선스 |
| 부하 | autocannon (간단) + k6(선택) | dev 머신에서 빠른 측정 |
| 보안 점검 | `/cso` (gstack) + npm audit + GitHub Dependabot | 의존성·시크릿·OWASP 점검 |
| 외부 호환 | Postman/Newman + RealWorld `gothinkster/realworld` Postman collection | API spec compliance 검증 (Brief §4 KPI) |
| 커버리지 | Vitest `--coverage` (c8/istanbul) | HTML + lcov 리포트 |

## 3. 커버리지 목표 (≥ 80%)

- **단위 + 통합 라인 커버리지 ≥ 85%** (목표), 최소 80%(BLOCK). 미달 시 PR 거부.
- **E2E** — 03 UC-01~UC-12 12개 시나리오의 happy path 100% 통과.
- **API spec compliance** — RealWorld Postman collection 100% (Brief §4 KPI).
- **레벨별 분배**
  - 단위: 핵심 순수 함수·serializer·hook — 90% 라인
  - 통합: 19 endpoint 각각 happy + 주요 failure — 85% 라인
  - E2E: 12 UC + 3 회귀 시나리오 — 통과율 100%

분야별 예외(예: M-FE-UI 시각만 다루는 컴포넌트)는 ADR로 결정. 본 문서가 정본인 한 80% 미만은 BLOCK.
