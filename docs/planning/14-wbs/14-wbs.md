---
doc_type: wbs
version: v0.1 (Draft)
status: Draft
author: yongtae.cho@bespinglobal.com
date: 2026-05-15
gate: operations
related:
  R-ID: [R-F-01, R-F-02, R-F-03, R-F-04, R-F-05, R-F-06, R-F-07, R-F-08, R-F-09, R-F-10, R-F-11, R-F-12, R-F-13, R-F-14, R-F-15, R-N-01, R-N-02, R-N-03, R-N-04, R-N-05]
  F-ID: []
  supersedes: null
---

# Conduit (RealWorld) — WBS

## 변경 이력

| Version | Date | Author | Change |
|---|---|---|---|
| v0.1 | 2026-05-15 | yongtae.cho@bespinglobal.com | 초안 — 3 sprint × 18 이슈 분해. 04·05·15 입력 fan-in |

## 0. 개요

본 WBS는 Conduit(RealWorld) MVP를 3 sprint × 2주 = 6주에 18개 이슈로 분해한다. 각 이슈는 1~3 working days 이내, dev 1~2명 가정. SRS R-F-01~15·R-N-01~05·PRD F-01~F-09 100% 매핑.

- **단위** — issue = 1~3d, sprint = 2주.
- **흐름** — Sprint 1 (Foundation + Auth + Profile) → Sprint 2 (Articles + Editor + Home + Tags) → Sprint 3 (Comments + Favorites + Feed + Compliance).
- **사후 처리** — Sprint 종료 시 retro + 다음 Sprint 재평가.

## 1. 스프린트 일람

| Sprint | 기간 | 목표(Outcome) | 주요 R-ID/F-ID | 이슈 수 |
| --- | --- | --- | --- | --- |
| Sprint 1 | 2026-05-18 ~ 2026-05-29 | 인프라 + Auth + Profile end-to-end 작동, 3 profile 부팅 CI | R-F-01~06, R-N-01·03·04, F-01·F-02 | 6 |
| Sprint 2 | 2026-06-01 ~ 2026-06-12 | Article CRUD + Editor + Home(Global) + Tags + slug 정책 ADR | R-F-07·09~12·15, F-03·F-04·F-08 | 6 |
| Sprint 3 | 2026-06-15 ~ 2026-06-26 | Comments + Favorites + Your Feed + compliance(Newman/cso/k6) 100% | R-F-08·13·14, R-N-02·03·05, F-05·F-06·F-07·F-09 | 6 |

## 2. 스프린트 상세

### Sprint 1 — Foundation + Auth + Profile (2026-05-18 ~ 2026-05-29)

##### Issue: setup/workspace-scaffold

- **유형** chore
- **영역** infra
- **우선순위** P0
- **Estimated Effort** 2d
- **R-ID 매핑** R-N-04
- **F-ID 매핑** F-09
- **Acceptance Criteria** Given 빈 저장소 When `pnpm install && ./devkit dev backend && ./devkit dev frontend` Then backend :3000 + frontend :5173 ready 신호 출력 + 에러 0건.
- **Contract Before** monorepo 자산 없음(루트 README만), Vite·Express·Prisma 미설치.
- **Contract After** pnpm workspace(`frontend`·`backend`) + tsconfig.base + Vite + Express + Prisma init + `.env.{dev,stg,prod}.example` 3종 + Tailwind 셋업 + docker-compose postgres(dev) + LOCAL.md 첫 채움 PR로 완료.
- **DoD Checklist** [x] 12 §1 트리 일치 [x] 12 §6·§7 ↔ LOCAL.md 동기 [x] CI lint/typecheck/test green [x] 3 profile boot smoke PASS

##### Issue: backend/auth-endpoints

- **유형** feature
- **영역** backend
- **우선순위** P0
- **Estimated Effort** 3d
- **R-ID 매핑** R-F-01, R-F-02, R-F-03, R-F-04, R-N-01, R-N-03
- **F-ID 매핑** F-01
- **Acceptance Criteria** Given Prisma migrate 적용 후 When `POST /api/users` / `POST /api/users/login` / `GET /api/user` / `PUT /api/user`를 호출 Then 09 §3 명시한 status·envelope·token 응답 그대로 + Postman Auth 4 케이스 통과.
- **Contract Before** Express skeleton만 존재, Prisma User 모델·JWT·bcrypt 미구현.
- **Contract After** `backend/src/modules/auth/*` + Prisma `User` 모델 + JWT/bcrypt 유틸 + 4 endpoint + Zod 검증 + 422 envelope.
- **DoD Checklist** [x] Vitest unit ≥ 90% [x] supertest 통합 happy+failure [x] /cso pass [x] gitleaks pass [x] Newman Auth 4건 100%

##### Issue: frontend/auth-pages

- **유형** feature
- **영역** frontend
- **우선순위** P0
- **Estimated Effort** 3d
- **R-ID 매핑** R-F-01, R-F-02, R-F-03, R-F-04, R-N-01
- **F-ID 매핑** F-01
- **Acceptance Criteria** Given backend Auth API 가동 When 사용자가 `/register` / `/login` / `/settings` 사용 Then 가입→자동 로그인→설정 갱신 흐름이 동작하고 navbar에 사용자명이 즉시 갱신, 401 인터셉터가 토큰 제거 + /login 리다이렉트.
- **Contract Before** 프론트 라우터·AuthContext 미구현, S-02·S-03·S-04 화면 없음.
- **Contract After** `frontend/src/auth/*` (AuthContext, useAuth, storage, apiClient interceptor) + S-02·S-03·S-04 페이지 + Tailwind 토큰 적용 + Playwright register/login/settings 시나리오.
- **DoD Checklist** [x] Vitest+RTL ≥ 85% [x] Playwright E2E 3건 통과 [x] /qa 스크린샷 첨부 [x] 401 인터셉터 단위 테스트

##### Issue: backend/profile-follow

- **유형** feature
- **영역** backend
- **우선순위** P0
- **Estimated Effort** 2d
- **R-ID 매핑** R-F-05, R-F-06
- **F-ID 매핑** F-02
- **Acceptance Criteria** Given 로그인 사용자 When `GET /api/profiles/:username` / `POST /api/profiles/:username/follow` / `DELETE` 호출 Then `following` 필드 정확히 토글, 자기 자신 follow 422 SELF_FOLLOW.
- **Contract Before** Profile·Follow 모델 미구현, endpoint 없음.
- **Contract After** Prisma `Follow` 모델 + `backend/src/modules/profile/*` + 3 endpoint + `following` 직렬화.
- **DoD Checklist** [x] Vitest 단위 [x] supertest 통합 (self-follow 422) [x] Newman Profile 3건 100%

##### Issue: frontend/profile-page

- **유형** feature
- **영역** frontend
- **우선순위** P0
- **Estimated Effort** 2d
- **R-ID 매핑** R-F-05, R-F-06
- **F-ID 매핑** F-02
- **Acceptance Criteria** Given `/profile/:username` 진입 When Follow/Unfollow 클릭 Then 버튼 상태 즉시 토글 + 다음 API 응답으로 확정. 자기 자신 프로필은 Edit Profile Settings 버튼만 노출.
- **Contract Before** 프로필 페이지 미구현.
- **Contract After** S-08·S-09 페이지 + Follow 버튼 + 탭 (My Articles/Favorited — 빈 placeholder OK, S-09는 데이터 fan-in 후 채움) + Playwright follow toggle.
- **DoD Checklist** [x] Vitest [x] Playwright [x] /qa 스크린샷 [x] 토큰 적용 확인

##### Issue: infra/3-profile-ci-smoke

- **유형** chore
- **영역** infra
- **우선순위** P0
- **Estimated Effort** 1d
- **R-ID 매핑** R-N-04
- **F-ID 매핑** F-09
- **Acceptance Criteria** Given GitHub Actions matrix(dev/stg/prod) When PR 트리거 Then 각 profile에서 backend boot ready 신호 + Playwright smoke `/login` → `/` 통과. `.env.*.example` ↔ LOCAL.md 동기 lint도 같이 추가.
- **Contract Before** CI는 lint/test만, 부팅 검증 없음.
- **Contract After** `.github/workflows/ci.yml`에 boot smoke matrix job + LOCAL.md 동기 lint 스크립트.
- **DoD Checklist** [x] CI matrix 3 profile 통과 [x] LOCAL.md sync lint [x] AI 게이트 6번째 축 PASS

### Sprint 2 — Articles + Editor + Home + Tags (2026-06-01 ~ 2026-06-12)

##### Issue: backend/article-crud

- **유형** feature
- **영역** backend
- **우선순위** P0
- **Estimated Effort** 3d
- **R-ID 매핑** R-F-07, R-F-09, R-F-10, R-F-11, R-F-12, R-N-05
- **F-ID 매핑** F-03, F-04
- **Acceptance Criteria** Given Auth 통과 When `GET /api/articles?(...)` / `GET /:slug` / `POST` / `PUT/:slug` / `DELETE /:slug` 호출 Then 09 §3 envelope 그대로, 글 삭제 시 댓글·favorite·articleTag cascade 0건.
- **Contract Before** Article 모델·endpoint 없음.
- **Contract After** Prisma `Article·Tag·ArticleTag·Favorite` 모델 + slug 생성기(임시 정책) + 5 endpoint + Zod + cascade 정책.
- **DoD Checklist** [x] Vitest ≥ 90% [x] supertest happy+failure 전수 [x] Newman Articles 5건 100% [x] cascade 통합 테스트 PASS

##### Issue: backend/tag-list-normalizer

- **유형** feature
- **영역** backend
- **우선순위** P1
- **Estimated Effort** 1d
- **R-ID 매핑** R-F-15
- **F-ID 매핑** F-08
- **Acceptance Criteria** Given 다양한 tag 입력 When `tagNormalizer(input)` 호출 Then 소문자·트림·중복 제거. `GET /api/tags` Then 빈도 desc 정렬 + 200 + `{tags:[]}`.
- **Contract Before** Tag 정규화 없음, GET /api/tags 없음.
- **Contract After** `tagNormalizer.ts` + endpoint + 빈도 집계 쿼리.
- **DoD Checklist** [x] Vitest unit (정규화) [x] 통합 (집계) [x] Newman Tag 1건 100%

##### Issue: frontend/editor-pages

- **유형** feature
- **영역** frontend
- **우선순위** P0
- **Estimated Effort** 2d
- **R-ID 매핑** R-F-10, R-F-11, R-F-12
- **F-ID 매핑** F-03
- **Acceptance Criteria** Given 로그인 사용자 When `/editor` 또는 `/editor/:slug` 사용 Then Publish 시 발행/수정 결과로 `/article/:slug` 리다이렉트, tag chip 입력/제거 정상.
- **Contract Before** Editor 페이지 미구현.
- **Contract After** S-05·S-06 페이지 + tag chip 컴포넌트 + Playwright create/edit/delete.
- **DoD Checklist** [x] Vitest+RTL [x] Playwright E2E 3건 [x] /qa 스크린샷 [x] 토큰 적용

##### Issue: frontend/home-feed-tags

- **유형** feature
- **영역** frontend
- **우선순위** P0
- **Estimated Effort** 3d
- **R-ID 매핑** R-F-07, R-F-15
- **F-ID 매핑** F-04, F-08
- **Acceptance Criteria** Given `/` 진입 When Global Feed / 태그 클릭 / 페이지네이션 사용 Then Tab 활성/필터/페이지 결과가 articlesCount와 정합, sidebar Popular Tags 클릭이 새 tab으로 추가.
- **Contract Before** Home 페이지 미구현.
- **Contract After** S-01 페이지 + FeedTabs + ArticlePreview + Pagination + PopularTags 사이드바.
- **DoD Checklist** [x] Vitest+RTL [x] Playwright E2E 2건 [x] /qa 스크린샷 [x] 빈 결과 UX

##### Issue: frontend/article-detail-page

- **유형** feature
- **영역** frontend
- **우선순위** P0
- **Estimated Effort** 2d
- **R-ID 매핑** R-F-09
- **F-ID 매핑** F-03
- **Acceptance Criteria** Given `/article/:slug` 진입 When 본인 글이면 Edit/Delete 노출 / 비본인이면 Follow + ♥ 노출 Then 각 action 정상 동작, 미존재 slug → 404 페이지.
- **Contract Before** Article 상세 페이지 미구현(댓글은 Sprint 3).
- **Contract After** S-07 페이지 (댓글 섹션은 placeholder) + 마크다운 렌더링.
- **DoD Checklist** [x] Vitest+RTL [x] Playwright E2E 1건 [x] 404 페이지 [x] /qa 스크린샷

##### Issue: chore/slug-policy-adr

- **유형** chore
- **영역** backend
- **우선순위** P1
- **Estimated Effort** 1d
- **R-ID 매핑** R-F-10, R-F-11
- **F-ID 매핑** F-03
- **Acceptance Criteria** Given 동일 title When 발행 반복 Then 자동으로 `-2`, `-3` suffix가 부여되어 unique 보장. ADR 0NNN로 정책 기록.
- **Contract Before** slug 충돌 시 422 에러로 발행 실패.
- **Contract After** `slugGenerator.ts`에 suffix 로직 + ADR-0NNN(slug 충돌 정책) + 단위 테스트.
- **DoD Checklist** [x] ADR 작성 [x] Vitest unit 10건+ [x] backend/article-crud 통합 회귀 PASS

### Sprint 3 — Comments + Favorites + Feed + Compliance (2026-06-15 ~ 2026-06-26)

##### Issue: backend/comment-crud

- **유형** feature
- **영역** backend
- **우선순위** P0
- **Estimated Effort** 2d
- **R-ID 매핑** R-F-13
- **F-ID 매핑** F-06
- **Acceptance Criteria** Given 로그인 사용자 + 글 존재 When `POST/GET/DELETE /api/articles/:slug/comments[/:id]` Then 09 §3 envelope. 빈 body → 422, 타인 댓글 삭제 → 403, 미존재 slug → 404.
- **Contract Before** Comment 모델·endpoint 없음.
- **Contract After** Prisma `Comment` 모델 + endpoint + 권한 검증 + 직렬화.
- **DoD Checklist** [x] Vitest unit [x] supertest 통합 (3 endpoint) [x] Newman Comments 3건 100%

##### Issue: frontend/comments-section

- **유형** feature
- **영역** frontend
- **우선순위** P0
- **Estimated Effort** 1d
- **R-ID 매핑** R-F-13
- **F-ID 매핑** F-06
- **Acceptance Criteria** Given `/article/:slug` 진입 When 로그인 사용자가 댓글 입력 후 submit Then 목록 갱신, 본인 댓글 우측 X 클릭 시 삭제 + 사라짐. 비로그인은 폼 미노출.
- **Contract Before** S-07에 댓글 placeholder만 있음.
- **Contract After** S-07 댓글 섹션 + CommentForm + CommentCard + Playwright 시나리오.
- **DoD Checklist** [x] Vitest+RTL [x] Playwright E2E 1건 [x] /qa 스크린샷 [x] 403 처리

##### Issue: backend/favorite-toggle

- **유형** feature
- **영역** backend
- **우선순위** P0
- **Estimated Effort** 2d
- **R-ID 매핑** R-F-14, R-N-05
- **F-ID 매핑** F-07
- **Acceptance Criteria** Given 로그인 + 글 존재 When `POST/DELETE /api/articles/:slug/favorite` 호출 Then favoritesCount ±1과 favorited toggle. 중복 add 멱등, 미존재 slug → 404.
- **Contract Before** favorite endpoint 없음, favoritesCount 컬럼 비활성.
- **Contract After** 2 endpoint + tx(favorite + article.favoritesCount) + 멱등 처리.
- **DoD Checklist** [x] Vitest unit [x] supertest 통합 (멱등) [x] Newman Favorite 2건 100% [x] tx 정합 검증

##### Issue: frontend/favorite-button

- **유형** feature
- **영역** frontend
- **우선순위** P0
- **Estimated Effort** 2d
- **R-ID 매핑** R-F-14
- **F-ID 매핑** F-07
- **Acceptance Criteria** Given Home/Article ♥ 버튼 When 클릭 Then 낙관적 업데이트 후 서버 응답으로 확정. `/profile/:me/favorites` 탭에 글이 반영. 실패 시 롤백.
- **Contract Before** ♥ 버튼 미구현, S-09 placeholder.
- **Contract After** ArticlePreview·ArticleDetail의 ♥ 버튼 + 낙관적 mutation + S-09 채움 + Playwright.
- **DoD Checklist** [x] Vitest+RTL [x] Playwright E2E 2건 [x] /qa 스크린샷 [x] 비로그인 처리

##### Issue: fullstack/your-feed

- **유형** feature
- **영역** frontend
- **우선순위** P0
- **Estimated Effort** 2d
- **R-ID 매핑** R-F-08
- **F-ID 매핑** F-05
- **Acceptance Criteria** Given 로그인 + follow ≥ 1명 When `/` Your Feed 탭 선택 Then `GET /api/articles/feed` 호출 후 follow된 작가의 글이 노출. follow 0명이면 빈 상태 CTA.
- **Contract Before** Your Feed 탭/endpoint 미구현. Home은 Global만.
- **Contract After** backend `GET /api/articles/feed` + frontend 탭 활성 + CTA + Playwright.
- **DoD Checklist** [x] Vitest+RTL [x] supertest 통합 [x] Playwright E2E [x] Newman Feed 1건 100%

##### Issue: test/compliance-perf-sec

- **유형** test
- **영역** backend
- **우선순위** P0
- **Estimated Effort** 2d
- **R-ID 매핑** R-N-02, R-N-03
- **F-ID 매핑** F-09
- **Acceptance Criteria** Given Sprint 3 종료 시점 When `newman + autocannon + /cso` 실행 Then RealWorld Postman 100%, P95 < 500ms (`/articles`·`/feed`·`/:slug`), /cso high 0건.
- **Contract Before** 정기 compliance·부하·보안 점검 자동화 미설정.
- **Contract After** `ci/compliance.yml` (Sprint 종료 시 실행) + autocannon 스크립트 4종 + /cso 매 PR 호출.
- **DoD Checklist** [x] Newman 100% [x] autocannon P95 < 500ms [x] /cso high 0 [x] coverage ≥ 85%

## 3. 의존성 그래프

```
setup/workspace-scaffold  (S1)
   │
   ├──▶ backend/auth-endpoints (S1)
   │     ├──▶ frontend/auth-pages (S1)
   │     ├──▶ backend/profile-follow (S1)
   │     └──▶ backend/article-crud (S2)
   │
   ├──▶ infra/3-profile-ci-smoke (S1)
   │
   ├──▶ backend/profile-follow (S1) ──▶ frontend/profile-page (S1)
   │
   ├──▶ backend/article-crud (S2)
   │     ├──▶ frontend/editor-pages (S2)
   │     ├──▶ frontend/home-feed-tags (S2)
   │     ├──▶ frontend/article-detail-page (S2)
   │     ├──▶ chore/slug-policy-adr (S2)
   │     ├──▶ backend/comment-crud (S3)
   │     ├──▶ backend/favorite-toggle (S3)
   │     └──▶ fullstack/your-feed (S3)
   │
   ├──▶ backend/tag-list-normalizer (S2) ──▶ frontend/home-feed-tags (S2)
   │
   ├──▶ backend/comment-crud (S3) ──▶ frontend/comments-section (S3)
   ├──▶ backend/favorite-toggle (S3) ──▶ frontend/favorite-button (S3)
   │
   └──▶ test/compliance-perf-sec (S3)  ◀── 전 이슈 합본
```

DAG 순환 없음. Sprint 간 의존도 명시 (S1 → S2/S3).

## 4. 추적성 매트릭스

> SRS R-ID(20종) + PRD F-ID(9종)이 모두 1개 이상 이슈에 매핑됨. 100% 커버.

| R-ID | F-ID | Sprint | Issue Slug |
| --- | --- | --- | --- |
| R-F-01 | F-01 | Sprint 1 | backend/auth-endpoints, frontend/auth-pages |
| R-F-02 | F-01 | Sprint 1 | backend/auth-endpoints, frontend/auth-pages |
| R-F-03 | F-01 | Sprint 1 | backend/auth-endpoints, frontend/auth-pages |
| R-F-04 | F-01 | Sprint 1 | backend/auth-endpoints, frontend/auth-pages |
| R-F-05 | F-02 | Sprint 1 | backend/profile-follow, frontend/profile-page |
| R-F-06 | F-02 | Sprint 1 | backend/profile-follow, frontend/profile-page |
| R-F-07 | F-04 | Sprint 2 | backend/article-crud, frontend/home-feed-tags |
| R-F-08 | F-05 | Sprint 3 | fullstack/your-feed |
| R-F-09 | F-03 | Sprint 2 | backend/article-crud, frontend/article-detail-page |
| R-F-10 | F-03 | Sprint 2 | backend/article-crud, frontend/editor-pages, chore/slug-policy-adr |
| R-F-11 | F-03 | Sprint 2 | backend/article-crud, frontend/editor-pages, chore/slug-policy-adr |
| R-F-12 | F-03 | Sprint 2 | backend/article-crud, frontend/editor-pages |
| R-F-13 | F-06 | Sprint 3 | backend/comment-crud, frontend/comments-section |
| R-F-14 | F-07 | Sprint 3 | backend/favorite-toggle, frontend/favorite-button |
| R-F-15 | F-08 | Sprint 2 | backend/tag-list-normalizer, frontend/home-feed-tags |
| R-N-01 | F-01 | Sprint 1 | backend/auth-endpoints, frontend/auth-pages |
| R-N-02 | F-09 | Sprint 3 | test/compliance-perf-sec |
| R-N-03 | F-09 | Sprint 1·3 | backend/auth-endpoints, test/compliance-perf-sec |
| R-N-04 | F-09 | Sprint 1 | setup/workspace-scaffold, infra/3-profile-ci-smoke |
| R-N-05 | F-09 | Sprint 2·3 | backend/article-crud, backend/favorite-toggle |

## 5. 리스크 매핑

| 15-risk Risk-ID | 영향 받는 Sprint/Issue | 대응 이슈 |
| --- | --- | --- |
| RISK-01 (N+1) | Sprint 2 Issue backend/article-crud; Sprint 3 fullstack/your-feed, backend/favorite-toggle | backend/article-crud (인덱스), test/compliance-perf-sec (부하 측정) |
| RISK-02 (slug 충돌) | Sprint 2 backend/article-crud | chore/slug-policy-adr |
| RISK-03 (JWT 만료) | Sprint 1 backend/auth-endpoints | backend/auth-endpoints (ADR + 7d 만료 구현) |
| RISK-04 (토큰 매핑) | Sprint 1·2 모든 frontend Issue | frontend/auth-pages, frontend/home-feed-tags, frontend/article-detail-page |
| RISK-05 (Postman compliance) | Sprint 3 test/compliance-perf-sec; 매 Sprint CI | test/compliance-perf-sec (정본), 매 PR CI Newman |
| RISK-06 (3 profile 동기) | 전 sprint 전 이슈 | setup/workspace-scaffold, infra/3-profile-ci-smoke (lint + CI matrix) |
| RISK-07 (시크릿) | Sprint 1 backend/auth-endpoints; Sprint 3 test/compliance-perf-sec | backend/auth-endpoints (bcrypt·gitleaks), test/compliance-perf-sec (/cso) |
| RISK-08 (일정) | 전 sprint | 매 sprint 종료 retro; P0 우선, P1은 재평가 |

## 6. 일정

- **Sprint 1** 2026-05-18(월) ~ 2026-05-29(금) — 2주, 6 이슈, ~12d work
- **Sprint 2** 2026-06-01(월) ~ 2026-06-12(금) — 2주, 6 이슈, ~12d work
- **Sprint 3** 2026-06-15(월) ~ 2026-06-26(금) — 2주, 6 이슈, ~11d work
- **버퍼** 각 sprint 마지막 0.5~1d는 retro·compliance·문서 갱신용.
- **휴일** 한국 공휴일은 sprint 일정에서 제외(필요 시 +1일 연장).

## 7. sprint-bootstrap 입력

```yaml
project:
  name: "Conduit (RealWorld) — toolkit reference implementation"
  repo: "test-case-3"
  default_branch: "main"
  labels:
    - { name: "status:todo", color: "ededed" }
    - { name: "status:in-progress", color: "fbca04" }
    - { name: "status:in-review", color: "1d76db" }
    - { name: "status:blocked", color: "b60205" }
    - { name: "area:backend", color: "0e8a16" }
    - { name: "area:frontend", color: "5319e7" }
    - { name: "area:infra", color: "c5def5" }
    - { name: "type:feature", color: "1d76db" }
    - { name: "type:chore", color: "bfd4f2" }
    - { name: "type:test", color: "d4c5f9" }
    - { name: "priority:P0", color: "b60205" }
    - { name: "priority:P1", color: "d93f0b" }

sprints:
  - name: "Sprint 1"
    milestone: "Sprint 1"
    title: "Sprint 1 — Foundation + Auth + Profile"
    start: "2026-05-18"
    due: "2026-05-29"
    issues:
      - slug: "setup/workspace-scaffold"
        title: "chore(infra): pnpm workspace + Vite + Express + Prisma + 3 profile env"
        labels: ["type:chore", "area:infra", "priority:P0"]
        effort: "2d"
        r_ids: ["R-N-04"]
        f_ids: ["F-09"]
        blocks: ["backend/auth-endpoints", "infra/3-profile-ci-smoke"]
        body: |
          See WBS §2 Sprint 1 — `setup/workspace-scaffold`.

          - **Type** chore | **Area** infra | **Priority** P0 | **Effort** 2d
          - **R-ID** R-N-04 | **F-ID** F-09
          - **Acceptance Criteria** Given 빈 저장소 When `pnpm install && ./devkit dev backend && ./devkit dev frontend` Then backend :3000 + frontend :5173 ready 신호 + 에러 0건.
          - **Contract Before** monorepo 자산 없음 (루트 README만), Vite·Express·Prisma 미설치.
          - **Contract After** pnpm workspace(`frontend`·`backend`) + tsconfig.base + Vite + Express + Prisma init + `.env.{dev,stg,prod}.example` 3종 + Tailwind 셋업 + docker-compose postgres(dev) + LOCAL.md 첫 채움.
          - **DoD Checklist** 12 §1 트리 일치 · 12 §6·§7 ↔ LOCAL.md 동기 · CI lint/typecheck/test green · 3 profile boot smoke PASS
      - slug: "backend/auth-endpoints"
        title: "feat(auth): POST /api/users · /login · GET·PUT /api/user"
        labels: ["type:feature", "area:backend", "priority:P0"]
        effort: "3d"
        r_ids: ["R-F-01", "R-F-02", "R-F-03", "R-F-04", "R-N-01", "R-N-03"]
        f_ids: ["F-01"]
        blocked_by: ["setup/workspace-scaffold"]
        blocks: ["frontend/auth-pages", "backend/profile-follow", "backend/article-crud"]
        body: |
          See WBS §2 Sprint 1 — `backend/auth-endpoints`.

          - **Type** feature | **Area** backend | **Priority** P0 | **Effort** 3d
          - **R-ID** R-F-01·02·03·04, R-N-01·03 | **F-ID** F-01
          - **Acceptance Criteria** Given Prisma migrate 적용 후 When `POST /api/users` / `POST /api/users/login` / `GET /api/user` / `PUT /api/user` 호출 Then 09 §3 명시한 status·envelope·token 그대로 + Postman Auth 4 케이스 100%.
          - **Contract Before** Express skeleton만 존재, Prisma User 모델·JWT·bcrypt 미구현.
          - **Contract After** `backend/src/modules/auth/*` + Prisma `User` 모델 + JWT/bcrypt 유틸 + 4 endpoint + Zod 검증 + 422 envelope.
          - **DoD Checklist** Vitest unit ≥ 90% · supertest 통합 happy+failure · /cso pass · gitleaks pass · Newman Auth 4건 100%
      - slug: "frontend/auth-pages"
        title: "feat(fe): /login · /register · /settings + AuthContext"
        labels: ["type:feature", "area:frontend", "priority:P0"]
        effort: "3d"
        r_ids: ["R-F-01", "R-F-02", "R-F-03", "R-F-04", "R-N-01"]
        f_ids: ["F-01"]
        blocked_by: ["backend/auth-endpoints"]
        body: |
          See WBS §2 Sprint 1 — `frontend/auth-pages`.

          - **Type** feature | **Area** frontend | **Priority** P0 | **Effort** 3d
          - **R-ID** R-F-01·02·03·04, R-N-01 | **F-ID** F-01
          - **Acceptance Criteria** Given backend Auth API 가동 When 사용자가 `/register` / `/login` / `/settings` 사용 Then 가입→자동 로그인→설정 갱신 흐름 동작 + navbar 즉시 갱신 + 401 인터셉터 토큰 제거 + /login 리다이렉트.
          - **Contract Before** 프론트 라우터·AuthContext 미구현, S-02·S-03·S-04 화면 없음.
          - **Contract After** `frontend/src/auth/*` + S-02·S-03·S-04 페이지 + Tailwind 토큰 적용 + Playwright 3 시나리오.
          - **DoD Checklist** Vitest+RTL ≥ 85% · Playwright E2E 3건 통과 · /qa 스크린샷 첨부 · 401 인터셉터 단위 테스트
      - slug: "backend/profile-follow"
        title: "feat(profile): GET /api/profiles/:username + follow/unfollow"
        labels: ["type:feature", "area:backend", "priority:P0"]
        effort: "2d"
        r_ids: ["R-F-05", "R-F-06"]
        f_ids: ["F-02"]
        blocked_by: ["backend/auth-endpoints"]
        blocks: ["frontend/profile-page", "fullstack/your-feed"]
        body: |
          See WBS §2 Sprint 1 — `backend/profile-follow`.

          - **Type** feature | **Area** backend | **Priority** P0 | **Effort** 2d
          - **R-ID** R-F-05·06 | **F-ID** F-02
          - **Acceptance Criteria** Given 로그인 사용자 When `GET /api/profiles/:username` / `POST·DELETE /follow` 호출 Then `following` 필드 정확히 토글, 자기 자신 follow → 422 SELF_FOLLOW.
          - **Contract Before** Profile·Follow 모델 미구현, endpoint 없음.
          - **Contract After** Prisma `Follow` 모델 + `backend/src/modules/profile/*` + 3 endpoint + `following` 직렬화.
          - **DoD Checklist** Vitest 단위 · supertest 통합 (self-follow 422) · Newman Profile 3건 100%
      - slug: "frontend/profile-page"
        title: "feat(fe): /profile/:username 헤더 + Follow toggle"
        labels: ["type:feature", "area:frontend", "priority:P0"]
        effort: "2d"
        r_ids: ["R-F-05", "R-F-06"]
        f_ids: ["F-02"]
        blocked_by: ["backend/profile-follow", "frontend/auth-pages"]
        body: |
          See WBS §2 Sprint 1 — `frontend/profile-page`.

          - **Type** feature | **Area** frontend | **Priority** P0 | **Effort** 2d
          - **R-ID** R-F-05·06 | **F-ID** F-02
          - **Acceptance Criteria** Given `/profile/:username` 진입 When Follow/Unfollow 클릭 Then 버튼 상태 즉시 토글 + 다음 API 응답으로 확정. 자기 자신 프로필은 Edit Profile Settings 버튼만 노출.
          - **Contract Before** 프로필 페이지 미구현.
          - **Contract After** S-08·S-09 페이지 + Follow 버튼 + 탭(My Articles/Favorited placeholder) + Playwright follow toggle.
          - **DoD Checklist** Vitest · Playwright · /qa 스크린샷 · 토큰 적용 확인
      - slug: "infra/3-profile-ci-smoke"
        title: "chore(infra): CI matrix 3 profile boot smoke + LOCAL.md sync lint"
        labels: ["type:chore", "area:infra", "priority:P0"]
        effort: "1d"
        r_ids: ["R-N-04"]
        f_ids: ["F-09"]
        blocked_by: ["setup/workspace-scaffold"]
        body: |
          See WBS §2 Sprint 1 — `infra/3-profile-ci-smoke`.

          - **Type** chore | **Area** infra | **Priority** P0 | **Effort** 1d
          - **R-ID** R-N-04 | **F-ID** F-09
          - **Acceptance Criteria** Given GitHub Actions matrix(dev/stg/prod) When PR 트리거 Then 각 profile에서 backend boot ready + Playwright smoke `/login` → `/` 통과. `.env.*.example` ↔ LOCAL.md 동기 lint 추가.
          - **Contract Before** CI는 lint/test만, 부팅 검증 없음.
          - **Contract After** `.github/workflows/ci.yml`에 boot smoke matrix job + LOCAL.md 동기 lint 스크립트.
          - **DoD Checklist** CI matrix 3 profile 통과 · LOCAL.md sync lint · AI 게이트 6번째 축 PASS

  - name: "Sprint 2"
    milestone: "Sprint 2"
    title: "Sprint 2 — Articles + Editor + Home + Tags"
    start: "2026-06-01"
    due: "2026-06-12"
    issues:
      - slug: "backend/article-crud"
        title: "feat(article): GET/POST/PUT/DELETE /api/articles + cascade"
        labels: ["type:feature", "area:backend", "priority:P0"]
        effort: "3d"
        r_ids: ["R-F-07", "R-F-09", "R-F-10", "R-F-11", "R-F-12", "R-N-05"]
        f_ids: ["F-03", "F-04"]
        blocked_by: ["backend/auth-endpoints"]
        blocks: ["frontend/editor-pages", "frontend/home-feed-tags", "frontend/article-detail-page", "chore/slug-policy-adr", "backend/comment-crud", "backend/favorite-toggle", "fullstack/your-feed"]
        body: |
          See WBS §2 Sprint 2 — `backend/article-crud`.

          - **Type** feature | **Area** backend | **Priority** P0 | **Effort** 3d
          - **R-ID** R-F-07·09·10·11·12, R-N-05 | **F-ID** F-03, F-04
          - **Acceptance Criteria** Given Auth 통과 When `GET /api/articles?(...)` / `GET /:slug` / `POST` / `PUT/:slug` / `DELETE /:slug` 호출 Then 09 §3 envelope 그대로, 글 삭제 시 댓글·favorite·articleTag cascade 0건.
          - **Contract Before** Article 모델·endpoint 없음.
          - **Contract After** Prisma `Article·Tag·ArticleTag·Favorite` 모델 + slug 생성기(임시 정책) + 5 endpoint + Zod + cascade 정책.
          - **DoD Checklist** Vitest ≥ 90% · supertest happy+failure 전수 · Newman Articles 5건 100% · cascade 통합 PASS
      - slug: "backend/tag-list-normalizer"
        title: "feat(tag): GET /api/tags + tagNormalizer + 정규화"
        labels: ["type:feature", "area:backend", "priority:P1"]
        effort: "1d"
        r_ids: ["R-F-15"]
        f_ids: ["F-08"]
        blocks: ["frontend/home-feed-tags"]
        body: |
          See WBS §2 Sprint 2 — `backend/tag-list-normalizer`.

          - **Type** feature | **Area** backend | **Priority** P1 | **Effort** 1d
          - **R-ID** R-F-15 | **F-ID** F-08
          - **Acceptance Criteria** Given 다양한 tag 입력 When `tagNormalizer(input)` 호출 Then 소문자·트림·중복 제거. `GET /api/tags` Then 빈도 desc + 200 + `{tags:[]}`.
          - **Contract Before** Tag 정규화 없음, GET /api/tags 없음.
          - **Contract After** `tagNormalizer.ts` + endpoint + 빈도 집계 쿼리.
          - **DoD Checklist** Vitest unit (정규화) · 통합 (집계) · Newman Tag 1건 100%
      - slug: "frontend/editor-pages"
        title: "feat(fe): /editor + /editor/:slug"
        labels: ["type:feature", "area:frontend", "priority:P0"]
        effort: "2d"
        r_ids: ["R-F-10", "R-F-11", "R-F-12"]
        f_ids: ["F-03"]
        blocked_by: ["backend/article-crud", "frontend/auth-pages"]
        body: |
          See WBS §2 Sprint 2 — `frontend/editor-pages`.

          - **Type** feature | **Area** frontend | **Priority** P0 | **Effort** 2d
          - **R-ID** R-F-10·11·12 | **F-ID** F-03
          - **Acceptance Criteria** Given 로그인 사용자 When `/editor` 또는 `/editor/:slug` 사용 Then Publish 시 발행/수정 결과로 `/article/:slug` 리다이렉트, tag chip 입력/제거 정상.
          - **Contract Before** Editor 페이지 미구현.
          - **Contract After** S-05·S-06 + tag chip 컴포넌트 + Playwright create/edit/delete.
          - **DoD Checklist** Vitest+RTL · Playwright E2E 3건 · /qa 스크린샷 · 토큰 적용
      - slug: "frontend/home-feed-tags"
        title: "feat(fe): / Home Global feed + Popular Tags + pagination"
        labels: ["type:feature", "area:frontend", "priority:P0"]
        effort: "3d"
        r_ids: ["R-F-07", "R-F-15"]
        f_ids: ["F-04", "F-08"]
        blocked_by: ["backend/article-crud", "backend/tag-list-normalizer"]
        body: |
          See WBS §2 Sprint 2 — `frontend/home-feed-tags`.

          - **Type** feature | **Area** frontend | **Priority** P0 | **Effort** 3d
          - **R-ID** R-F-07·15 | **F-ID** F-04, F-08
          - **Acceptance Criteria** Given `/` 진입 When Global Feed / 태그 클릭 / 페이지네이션 사용 Then Tab 활성/필터/페이지 결과가 articlesCount와 정합, sidebar Popular Tags 클릭이 새 tab으로 추가.
          - **Contract Before** Home 페이지 미구현.
          - **Contract After** S-01 + FeedTabs + ArticlePreview + Pagination + PopularTags sidebar.
          - **DoD Checklist** Vitest+RTL · Playwright E2E 2건 · /qa 스크린샷 · 빈 결과 UX
      - slug: "frontend/article-detail-page"
        title: "feat(fe): /article/:slug 본문 + 404 페이지"
        labels: ["type:feature", "area:frontend", "priority:P0"]
        effort: "2d"
        r_ids: ["R-F-09"]
        f_ids: ["F-03"]
        blocked_by: ["backend/article-crud"]
        body: |
          See WBS §2 Sprint 2 — `frontend/article-detail-page`.

          - **Type** feature | **Area** frontend | **Priority** P0 | **Effort** 2d
          - **R-ID** R-F-09 | **F-ID** F-03
          - **Acceptance Criteria** Given `/article/:slug` 진입 When 본인 글이면 Edit/Delete 노출 / 비본인이면 Follow + ♥ 노출 Then 각 action 정상, 미존재 slug → 404 페이지.
          - **Contract Before** Article 상세 페이지 미구현(댓글은 Sprint 3).
          - **Contract After** S-07 페이지 (댓글 섹션은 placeholder) + 마크다운 렌더링.
          - **DoD Checklist** Vitest+RTL · Playwright E2E 1건 · 404 페이지 · /qa 스크린샷
      - slug: "chore/slug-policy-adr"
        title: "chore(adr): slug 충돌 정책 ADR + suffix 구현"
        labels: ["type:chore", "area:backend", "priority:P1"]
        effort: "1d"
        r_ids: ["R-F-10", "R-F-11"]
        f_ids: ["F-03"]
        blocked_by: ["backend/article-crud"]
        body: |
          See WBS §2 Sprint 2 — `chore/slug-policy-adr`. 대응 RISK-02.

          - **Type** chore | **Area** backend | **Priority** P1 | **Effort** 1d
          - **R-ID** R-F-10·11 | **F-ID** F-03
          - **Acceptance Criteria** Given 동일 title When 발행 반복 Then 자동 `-2`, `-3` suffix 부여, ADR 0NNN로 정책 기록.
          - **Contract Before** slug 충돌 시 422 (CONFLICT)로 발행 실패.
          - **Contract After** `slugGenerator.ts`에 suffix 로직 + ADR-0NNN + 단위 테스트.
          - **DoD Checklist** ADR 작성 · Vitest unit 10건+ · backend/article-crud 통합 회귀 PASS

  - name: "Sprint 3"
    milestone: "Sprint 3"
    title: "Sprint 3 — Comments + Favorites + Feed + Compliance"
    start: "2026-06-15"
    due: "2026-06-26"
    issues:
      - slug: "backend/comment-crud"
        title: "feat(comment): POST·GET·DELETE /api/articles/:slug/comments"
        labels: ["type:feature", "area:backend", "priority:P0"]
        effort: "2d"
        r_ids: ["R-F-13"]
        f_ids: ["F-06"]
        blocked_by: ["backend/article-crud"]
        blocks: ["frontend/comments-section"]
        body: |
          See WBS §2 Sprint 3 — `backend/comment-crud`.

          - **Type** feature | **Area** backend | **Priority** P0 | **Effort** 2d
          - **R-ID** R-F-13 | **F-ID** F-06
          - **Acceptance Criteria** Given 로그인 사용자 + 글 존재 When `POST/GET/DELETE /api/articles/:slug/comments[/:id]` Then 09 §3 envelope. 빈 body → 422, 타인 댓글 삭제 → 403, 미존재 slug → 404.
          - **Contract Before** Comment 모델·endpoint 없음.
          - **Contract After** Prisma `Comment` 모델 + endpoint + 권한 검증 + 직렬화.
          - **DoD Checklist** Vitest unit · supertest 통합 (3 endpoint) · Newman Comments 3건 100%
      - slug: "frontend/comments-section"
        title: "feat(fe): /article/:slug 댓글 섹션 + 폼"
        labels: ["type:feature", "area:frontend", "priority:P0"]
        effort: "1d"
        r_ids: ["R-F-13"]
        f_ids: ["F-06"]
        blocked_by: ["backend/comment-crud", "frontend/article-detail-page"]
        body: |
          See WBS §2 Sprint 3 — `frontend/comments-section`.

          - **Type** feature | **Area** frontend | **Priority** P0 | **Effort** 1d
          - **R-ID** R-F-13 | **F-ID** F-06
          - **Acceptance Criteria** Given `/article/:slug` 진입 When 로그인 사용자가 댓글 입력 후 submit Then 목록 갱신, 본인 댓글 우측 X 클릭 시 삭제 + 사라짐. 비로그인은 폼 미노출.
          - **Contract Before** S-07에 댓글 placeholder만 있음.
          - **Contract After** S-07 댓글 섹션 + CommentForm + CommentCard + Playwright 시나리오.
          - **DoD Checklist** Vitest+RTL · Playwright E2E 1건 · /qa 스크린샷 · 403 처리
      - slug: "backend/favorite-toggle"
        title: "feat(favorite): POST·DELETE /api/articles/:slug/favorite"
        labels: ["type:feature", "area:backend", "priority:P0"]
        effort: "2d"
        r_ids: ["R-F-14", "R-N-05"]
        f_ids: ["F-07"]
        blocked_by: ["backend/article-crud"]
        blocks: ["frontend/favorite-button"]
        body: |
          See WBS §2 Sprint 3 — `backend/favorite-toggle`.

          - **Type** feature | **Area** backend | **Priority** P0 | **Effort** 2d
          - **R-ID** R-F-14, R-N-05 | **F-ID** F-07
          - **Acceptance Criteria** Given 로그인 + 글 존재 When `POST/DELETE /api/articles/:slug/favorite` 호출 Then favoritesCount ±1과 favorited toggle. 중복 add 멱등, 미존재 slug → 404.
          - **Contract Before** favorite endpoint 없음, favoritesCount 컬럼 비활성.
          - **Contract After** 2 endpoint + tx(favorite + article.favoritesCount) + 멱등 처리.
          - **DoD Checklist** Vitest unit · supertest 통합 (멱등) · Newman Favorite 2건 100% · tx 정합 검증
      - slug: "frontend/favorite-button"
        title: "feat(fe): heart 버튼 + 낙관적 업데이트 + Profile favorites 탭"
        labels: ["type:feature", "area:frontend", "priority:P0"]
        effort: "2d"
        r_ids: ["R-F-14"]
        f_ids: ["F-07"]
        blocked_by: ["backend/favorite-toggle", "frontend/profile-page"]
        body: |
          See WBS §2 Sprint 3 — `frontend/favorite-button`.

          - **Type** feature | **Area** frontend | **Priority** P0 | **Effort** 2d
          - **R-ID** R-F-14 | **F-ID** F-07
          - **Acceptance Criteria** Given Home/Article heart 버튼 When 클릭 Then 낙관적 업데이트 후 서버 응답으로 확정. `/profile/:me/favorites` 탭에 반영. 실패 시 롤백.
          - **Contract Before** heart 버튼 미구현, S-09 placeholder.
          - **Contract After** ArticlePreview·ArticleDetail의 heart 버튼 + 낙관적 mutation + S-09 채움 + Playwright.
          - **DoD Checklist** Vitest+RTL · Playwright E2E 2건 · /qa 스크린샷 · 비로그인 처리
      - slug: "fullstack/your-feed"
        title: "feat(feed): GET /api/articles/feed + Home Your Feed tab"
        labels: ["type:feature", "area:frontend", "priority:P0"]
        effort: "2d"
        r_ids: ["R-F-08"]
        f_ids: ["F-05"]
        blocked_by: ["backend/article-crud", "backend/profile-follow", "frontend/home-feed-tags"]
        body: |
          See WBS §2 Sprint 3 — `fullstack/your-feed`.

          - **Type** feature | **Area** frontend (+ backend feed endpoint) | **Priority** P0 | **Effort** 2d
          - **R-ID** R-F-08 | **F-ID** F-05
          - **Acceptance Criteria** Given 로그인 + follow ≥ 1명 When `/` Your Feed 탭 선택 Then `GET /api/articles/feed` 호출 후 follow된 작가의 글이 노출. follow 0명이면 빈 상태 CTA.
          - **Contract Before** Your Feed 탭/endpoint 미구현. Home은 Global만.
          - **Contract After** backend `GET /api/articles/feed` + frontend 탭 활성 + CTA + Playwright.
          - **DoD Checklist** Vitest+RTL · supertest 통합 · Playwright E2E · Newman Feed 1건 100%
      - slug: "test/compliance-perf-sec"
        title: "test(backend): Newman 100% + autocannon P95 + /cso high 0"
        labels: ["type:test", "area:backend", "priority:P0"]
        effort: "2d"
        r_ids: ["R-N-02", "R-N-03"]
        f_ids: ["F-09"]
        blocked_by: ["backend/comment-crud", "backend/favorite-toggle", "fullstack/your-feed", "backend/tag-list-normalizer"]
        body: |
          See WBS §2 Sprint 3 — `test/compliance-perf-sec`. 대응 RISK-01·05·07.

          - **Type** test | **Area** backend | **Priority** P0 | **Effort** 2d
          - **R-ID** R-N-02·03 | **F-ID** F-09
          - **Acceptance Criteria** Given Sprint 3 종료 시점 When `newman + autocannon + /cso` 실행 Then RealWorld Postman 100%, P95 < 500ms (`/articles`·`/feed`·`/:slug`), /cso high 0건.
          - **Contract Before** 정기 compliance·부하·보안 점검 자동화 미설정.
          - **Contract After** `ci/compliance.yml` (Sprint 종료 시 실행) + autocannon 스크립트 4종 + /cso 매 PR 호출.
          - **DoD Checklist** Newman 100% · autocannon P95 < 500ms · /cso high 0 · coverage ≥ 85%
```

## 8. Open Questions

- **dev 인원 수** — 실제 1명/2명 여부에 따라 일정 재평가 (지금은 1~2명 가정).
- **버퍼 비율** — 각 sprint 0.5~1d 버퍼면 충분한지(Newman/cso 디버깅 시간 변동성).
- **Sprint 4 가능성** — P1(R-F-15 정렬·F-08 sidebar 폴리시) 이월 시 추가 sprint 정의 필요.
- **외부 디자이너 검수** — Bootstrap 4 ↔ Tailwind 매핑(RISK-04) 검수 자원 필요 여부.
