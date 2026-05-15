---
doc_type: test-design
version: v0.1 (Draft)
status: Draft
author: yongtae.cho@bespinglobal.com
date: 2026-05-15
gate: C
related:
  R-ID: []
  F-ID: []
  supersedes: null
---

# 03-regression Regression Test Policy — test-design

## 변경 이력

| Version | Date | Author | Change |
|---|---|---|---|
| v0.1 | 2026-05-15 | yongtae.cho@bespinglobal.com | 초안 — 매 PR 전수 회귀 + nightly 정책 |

## 1. 회귀 범위

- **PR마다 전수** — 단위 + 통합 + E2E happy path 12개 + RealWorld Postman collection 100%. CI가 BLOCKER.
- **추가 nightly (선택)** — failure path E2E + cross-browser(firefox, webkit) smoke. 결과는 Slack/issue 알림만, 머지 차단 없음.
- **포함 항목**
  - 모든 단위·통합 테스트 suite (Vitest)
  - E2E golden path 12종 (UC-01~UC-12)
  - Newman으로 RealWorld Postman collection 실행
  - typecheck (`tsc --noEmit`) + ESLint + Prettier check
  - 3 profile 부팅 smoke (ADR-0037 6번째 축)
- **제외 항목**
  - 부하 테스트(R-N-02) — 변경 영향 있을 때만 ad-hoc
  - 보안 점검 `/cso` — 의존성 변경 또는 nightly

## 2. 자동화 정책

- **CI** — GitHub Actions. `pull_request`·`push` 트리거.
- **워크플로 단계** — install → lint → typecheck → test (vitest) → build → e2e (playwright) → 3 profile boot smoke → newman.
- **병렬화** — vitest matrix(node 환경) + playwright workers 4. CI 총 < 15분 목표.
- **fail-fast** — lint/typecheck 실패 시 후속 단계 스킵하여 신호 빨리.
- **재시도** — flaky 가드: e2e 최대 1회 재시도, 그 외 0회. flaky 시 issue 생성 자동화.
- **artifact** — 실패 시 playwright report·screenshot·trace 업로드. coverage lcov는 항상.

## 3. 회귀 트리거

- **자동** — PR open/synchronize, main push, scheduled nightly(03:00 KST).
- **수동 trigger 조건**
  - 의존성 upgrade(`pnpm-lock.yaml` 변경) → 전수 회귀 + npm audit 강제
  - schema.prisma 변경 → migration test + cascade test 추가 강제
  - `.env.*.example` 변경 → 3 profile 부팅 smoke
  - feature flag/ADR 추가 → 회귀 범위 재평가 (ADR 본문에 명시)
- **회귀 실패 시** — `status:blocked` 라벨 + 작성자 멘션. 추측 진행 금지(CLAUDE.md 규칙 8 `/careful`).
