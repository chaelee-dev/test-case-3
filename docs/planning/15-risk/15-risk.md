---
doc_type: risk
version: v0.1 (Draft)
status: Draft
author: yongtae.cho@bespinglobal.com
date: 2026-05-15
gate: operations
related:
  R-ID: [R-N-01, R-N-02, R-N-03, R-N-04, R-N-05, R-F-07, R-F-08, R-F-10, R-F-15]
  F-ID: []
  supersedes: null
---

# Conduit (RealWorld) — Risk Register

## 변경 이력

| Version | Date | Author | Change |
|---|---|---|---|
| v0.1 | 2026-05-15 | yongtae.cho@bespinglobal.com | 초안 — Brief §7 RISK + Gate C 산출에서 발견된 리스크를 8개 RISK-ID로 정리 |

## 1. 리스크 일람

> 영향/가능성 1~5 척도. 등급 = (영향 + 가능성) ≥ 8 High / 5~7 Medium / ≤ 4 Low.

| RISK-ID | 제목 | 영향(1~5) | 가능성(1~5) | 등급 | 영향 받는 Sprint/Issue | 대응 |
| --- | --- | --- | --- | --- | --- | --- |
| RISK-01 | N+1 쿼리 (favorited / following) | 4 | 4 | High | Sprint 2 Issue-7, Sprint 3 Issue-15·17 | 인덱스 + join + favoritesCount 비정규화 |
| RISK-02 | slug 충돌 정책 미정 | 3 | 3 | Medium | Sprint 2 Issue-7·Issue-12 | ADR로 suffix `-2`·`-3` 정책 확정 후 구현 |
| RISK-03 | JWT 만료/리프레시 정책 미정 | 3 | 3 | Medium | Sprint 1 Issue-2 | ADR: 단순 7d 만료, 리프레시 토큰 미도입 |
| RISK-04 | Bootstrap 4 ↔ Tailwind 토큰 매핑 | 3 | 4 | High | Sprint 1 Issue-3, Sprint 2 Issue-10·11 | 10 §3 토큰 SoT 고정 + 12 §8 매핑 표 작성 (ADR-0038) |
| RISK-05 | RealWorld Postman compliance 흔들림 | 4 | 3 | High | Sprint 3 Issue-18 | 매 Sprint 종료 시 Newman 실행, 100% 통과 BLOCK |
| RISK-06 | 3 profile 부팅 자산 동기 누락 (ADR-0037) | 4 | 4 | High | 매 Sprint 모든 Issue | AI 게이트 6번째 축 강제 + LOCAL.md ↔ 12 §7 동기 |
| RISK-07 | 시크릿/비밀번호 평문 노출 | 5 | 2 | High | Sprint 1 Issue-2, Sprint 3 Issue-18 | bcrypt cost≥10, gitleaks pre-commit, /cso 매 PR |
| RISK-08 | 6주 일정 압박 (3 sprint) | 3 | 4 | High | 전체 | MVP cut 우선순위 P0만 사수, P1은 sprint 종료 시 재평가 |

## 2. 리스크 상세

### RISK-01: N+1 쿼리 (favorited / following)

- **카테고리** 기술
- **설명** `GET /api/articles` 응답의 각 article마다 `favorited`·`author.following` 필드가 현재 사용자 기준 boolean — 단순 구현 시 글 1개당 favorite/follow lookup 2회 발생.
- **영향** 4 / 5 — Home·Profile 페이지 P95 응답시간이 limit 20 기준 500ms를 초과할 가능성 큼.
- **가능성** 4 / 5 — Prisma 기본 사용 시 매우 발생하기 쉬움.
- **현재 상태** 식별
- **트리거 신호** dev 환경에서 Prisma query log 노출 시 글 1개당 N+1 SELECT 관찰, autocannon P95 > 500ms.
- **완화 전략** Prisma `include` + join, `articleTag`·`favorite`·`follow`는 한 번에 사용자별 IN 쿼리, `favoritesCount`는 비정규화 컬럼. 적정성은 R-N-02 부하 테스트로 검증.
- **대응 이슈** Sprint 2 Issue-7 (Article CRUD), Sprint 3 Issue-18 (부하 측정).

### RISK-02: slug 충돌 정책 미정

- **카테고리** 기술
- **설명** 동일 title로 글 발행 시 slug(`slugify(title)`)가 충돌 — 명세에는 정책 명시 없음.
- **영향** 3 / 5 — 발행 실패 또는 데이터 무결성 깨짐.
- **가능성** 3 / 5 — Sprint 2 시점에 발생 가능.
- **현재 상태** 식별
- **트리거 신호** POST /api/articles 응답 422 (CONFLICT) 또는 unique constraint 위반 에러.
- **완화 전략** ADR로 정책 확정 — 동일 slug 존재 시 `-2`, `-3`, ... suffix 자동 부여. title 변경 시 slug 고정(리다이렉트 없음). M-ARTICLE.slugGenerator 단위 테스트로 검증.
- **대응 이슈** Sprint 2 Issue-12 (ADR + 구현), Issue-7 (통합 테스트).

### RISK-03: JWT 만료/리프레시 정책 미정

- **카테고리** 보안
- **설명** RealWorld 명세는 JWT 단일 토큰만 정의, 만료·리프레시 명시 없음.
- **영향** 3 / 5 — 만료 너무 짧으면 UX 저하, 너무 길면 보안 약화.
- **가능성** 3 / 5 — Sprint 1 시점에 결정 필요.
- **현재 상태** 식별
- **트리거 신호** 사용자 보고("자꾸 로그아웃됨") 또는 stg 모니터링에 401 다발.
- **완화 전략** ADR — `JWT_EXPIRES_IN=7d`, 리프레시 토큰 미도입. 만료 시 클라이언트가 토큰 제거 + /login. RealWorld 다수 구현이 동일.
- **대응 이슈** Sprint 1 Issue-2 (Auth backend).

### RISK-04: Bootstrap 4 ↔ Tailwind 토큰 매핑

- **카테고리** 기술
- **설명** 10 §3 토큰(Bootstrap 4 conduit theme 인용)을 12 §8 Tailwind config로 매핑할 때 정확도 부족 시 비주얼 회귀 발생.
- **영향** 3 / 5 — UI 일관성·페이지 비교 테스트 어려움.
- **가능성** 4 / 5 — Sprint 1 초기에 매핑 누락 가능.
- **현재 상태** 식별
- **트리거 신호** /qa 스크린샷 비교에서 차이, 디자인 토큰 미적용 영역 발견.
- **완화 전략** `tailwind.config.ts` `theme.extend`에 10 §3 토큰을 1:1로 코딩. 시각 회귀 테스트(선택)로 회귀 차단. UI 컴포넌트(Button/Input/Card)는 사전에 Storybook 또는 페이지 1개로 검증.
- **대응 이슈** Sprint 1 Issue-3 (Auth FE), Sprint 2 Issue-10·11 (Home·Article FE).

### RISK-05: RealWorld Postman compliance 흔들림

- **카테고리** 외부 의존
- **설명** RealWorld Postman collection이 외부 검증 기준(Brief §4 KPI 100%). 작은 응답 envelope 차이로 다수 fail.
- **영향** 4 / 5 — KPI 미달, MVP 정의 실패.
- **가능성** 3 / 5 — 명세 해석 차이로 자주 발생.
- **현재 상태** 식별
- **트리거 신호** Newman 실행 시 fail 케이스 1건 이상.
- **완화 전략** Sprint 1부터 Newman을 CI에 추가, 매 PR마다 실행. fail 시 PR BLOCK. 응답 envelope을 명세 문구 그대로 복사.
- **대응 이슈** Sprint 3 Issue-18 (compliance gate). Sprint 1·2에서도 매 PR CI로 조기 탐지.

### RISK-06: 3 profile 부팅 자산 동기 누락

- **카테고리** 운영
- **설명** ADR-0037 v1.1 — `.env.{dev,stg,prod}.example`·migrations·lockfile·LOCAL.md·12 §7이 동기되지 않으면 머지 BLOCK. 한쪽만 변경되면 다른 profile 부팅 깨짐.
- **영향** 4 / 5 — PR 거부 + 회복 시간 비용.
- **가능성** 4 / 5 — 매 PR 발생 가능.
- **현재 상태** 식별
- **트리거 신호** AI 게이트 6번째 축 FAIL, "LOCAL.md 미갱신" 또는 "stg .env.example 누락".
- **완화 전략** PR 템플릿에 체크리스트 추가, 자동 lint(예: 어느 env 파일 변경 시 다른 2개 + LOCAL.md 동기 검증 스크립트).
- **대응 이슈** Sprint 1 Issue-1·6 (infra/CI), 매 PR에 반영.

### RISK-07: 시크릿/비밀번호 평문 노출

- **카테고리** 보안
- **설명** JWT_SECRET·DB 비밀번호·bcrypt 해시·요청 본문 비밀번호가 로그·git·PR 본문에 노출되는 경우.
- **영향** 5 / 5 — 사고 시 전 사용자 자격 증명 노출, 법적 책임 가능.
- **가능성** 2 / 5 — toolkit/CLAUDE.md §보안 규칙 + pre-commit hook으로 낮음.
- **현재 상태** 모니터링
- **트리거 신호** gitleaks·GitHub secret scanning 알림, /cso high finding, npm audit critical.
- **완화 전략** (1) bcrypt cost ≥ 10, (2) JWT_SECRET 32B 이상, (3) gitleaks pre-commit, (4) 평문 비밀번호 로그 금지 lint, (5) /cso 매 PR, (6) Dependabot weekly. 사고 시 즉시 토큰 무효화 + DB 비밀번호 회전.
- **대응 이슈** Sprint 1 Issue-2 (Auth + 보안), Sprint 3 Issue-18 (/cso 통합).

### RISK-08: 6주 일정 압박

- **카테고리** 일정
- **설명** 3 sprint × 2주 = 6주에 18 이슈, 9 F-ID, 20 R-ID. dev 1~2명 가정.
- **영향** 3 / 5 — MVP cut 일부 P1이 다음 sprint로 밀릴 수 있음.
- **가능성** 4 / 5 — toolkit 자동화에도 검수·디버깅 시간 소모.
- **현재 상태** 식별
- **트리거 신호** Sprint 1 종료 시점에 burndown 25% 미달.
- **완화 전략** P0만 사수, P1(R-F-15 태그 정렬·F-08)은 sprint 마지막에 재평가하고 필요 시 Sprint 4로 이월. 매 Sprint 종료 시 회고로 estimation 보정.
- **대응 이슈** 매 Sprint Issue-6·12·18 (Sprint 종료 점검 / retro).

## 3. High 리스크 단계적 롤아웃

High 등급(RISK-01·04·05·06·07·08)은 다음 절차로 단계적 검증.

1. **선검증 (Sprint 1 초기, week 1)** — RISK-04(토큰 매핑)·RISK-06(3 profile 자산)·RISK-07(시크릿)을 인프라/Auth Issue 안에서 확인. /qa 스크린샷·CI 6번째 축·gitleaks 동작 확인.
2. **dev profile 부분 검증 (각 Sprint week 1)** — Issue별 단위·통합 테스트만 실행. fail 시 즉시 격리.
3. **stg profile 부하·보안 (Sprint 종료 시)** — RISK-01(N+1)을 autocannon으로 측정, RISK-05(compliance)를 Newman으로 100% 통과.
4. **prod 시뮬레이션 (Sprint 3 종료 직전)** — RealWorld Postman + Playwright 전수 + /cso. 임계 위반 시 다음 Sprint로 이월.
5. **롤백 trigger** — Newman fail 1건 이상, /cso high 1건 이상, P95 > 500ms — 어느 하나라도 발생 시 머지 BLOCK + 회복 이슈 신설.
6. **재발 방지** — 회복 후 retro에서 원인을 ADR로 기록, 본 RISK 카탈로그에 "현재 상태" → 모니터링/완화 진행으로 갱신.
