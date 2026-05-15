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

# 05-delivery-format Customer Delivery Format — test-design

## 변경 이력

| Version | Date | Author | Change |
|---|---|---|---|
| v0.1 | 2026-05-15 | yongtae.cho@bespinglobal.com | 초안 — 시나리오 ID 채번(TC-/IT-/E2E-) + 전달 시점 정의 |

## 1. 산출 범위 (단위·통합·E2E 시나리오)

- **단위** — Vitest run report (HTML) + lcov 커버리지.
- **통합** — Vitest + supertest run report. R-F-01~15 endpoint별 시나리오 표.
- **E2E** — Playwright HTML report + 12 UC 시나리오 PASS/FAIL + 실패 시 trace.zip.
- **API spec 호환** — Newman HTML 리포트 (RealWorld Postman collection 전체).
- **부하·보안** — k6/autocannon summary + `/cso` 점검 리포트(sprint 종료 시 1회).

## 2. 포맷·도구 (HTML/XLSX/Allure 등)

- **HTML** — Vitest UI / Playwright Report / Newman HTML. CI artifact로 첨부, PR 코멘트에 링크.
- **lcov + coveragerc** — codecov 또는 GitHub Actions report.
- **XLSX (고객 납품용)** — sprint 종료 시 회귀 결과 요약 시트(시나리오 ID·결과·증빙링크·기간). `scripts/export-xlsx.ts`로 생성.
- **Allure** — 미채택(과잉). 필요해지면 ADR로 추가.

## 3. 시나리오 ID 채번 규칙

> ADR-0034 — 시나리오 ID 채번이 필수. 고객 납품 시 본 prefix가 식별자 정본.

- **TC-NNN** — 일반 테스트 케이스(혼합). 사용 안 함(아래 3종 우선).
- **UT-NNN** — 단위 테스트 (Unit). 예: `UT-001 slugGenerator(빈 title)`.
- **IT-NNN** — 통합 테스트 (Integration). 예: `IT-014 POST /favorite favoritesCount 갱신`.
- **E2E-NNN** — E2E 시나리오. 예: `E2E-003 새 글 발행 → 글 상세 → 편집 → 삭제`.
- **UC-NN** (이미 03 User Scenarios에서 채번) — E2E 시나리오의 *소스*. 매핑 시 `E2E-003 ↔ UC-04`.
- **R-ID/F-ID** — 04 SRS / 05 PRD에서 채번된 요구 ID. 시나리오 표의 trace 열에 인용.

채번 매핑: 본 §3의 ID는 02-catalog의 subsection을 1:1 매핑한다. 새 시나리오 추가 시 가장 큰 번호 +1.

## 4. 전달 시점 (스프린트 종료·릴리스·고객 요청)

- **스프린트 종료** — 매 sprint 마지막 PR 머지 후 24h 내. 단위·통합 HTML + E2E + 회귀 결과(XLSX) 묶어서 `docs/features/_sprint-N/test-report/`에 보관.
- **릴리스** — `v1.X.Y` 태그 시점에 누적 회귀 리포트(XLSX) + Newman compliance(HTML) 첨부하여 GitHub Release에 게시.
- **고객 요청** — 임의 시점 요청 시 본 §3의 ID 체계로 검색·필터 → XLSX 추출. 시점은 SLA로 별도 협의(미정의 시 영업일 기준 2d).
- **CI 자동 게시** — 매 PR 머지마다 latest report URL을 PR 본문에 코멘트(별 자동화 PR로 추가, 초기 sprint에는 수동).
