---
doc_type: srs
version: v0.1 (Draft)
status: Draft
author: yongtae.cho@bespinglobal.com
date: 2026-05-15
gate: B
related:
  R-ID: []
  F-ID: []
  supersedes: null
---

# Conduit (RealWorld) — SRS

## 변경 이력

| Version | Date | Author | Change |
|---|---|---|---|
| v0.1 | 2026-05-15 | yongtae.cho@bespinglobal.com | 초안 — RealWorld 백엔드/프론트엔드 명세를 R-ID로 카탈로그화 |

## 1. 범위 / 가정

- **범위** — RealWorld 명세 (https://realworld-docs.netlify.app) 의 백엔드(`/api/...` 19 endpoint) + 프론트엔드(9 route, 7 page) 모두 구현한다.
- **가정**
  - JWT는 localStorage에 저장한다(명세 명시).
  - 모든 요청·응답 본문은 JSON envelope (`{ "user": {...} }`, `{ "article": {...} }`).
  - 비기능: dev/stg/prod 3 profile 부팅 검증(ADR-0037 v1.1), AI 게이트 6축(ADR-0011) 통과 후에만 머지.
  - 스택은 게이트 C(`/flow-design`)에서 확정. 본 SRS는 스택 중립.
- **비범위** — 모바일 앱, WebSocket, i18n, SSR, 결제, OAuth, 이미지 업로드, 관리자 백오피스.

## 2. 기능 요구사항

### R-F-01: 사용자 등록 (POST /api/users)

- **우선순위** P0
- **설명** username·email·password로 신규 계정을 생성하고 JWT를 반환한다.
- **Acceptance** Given 미가입 이메일 When `POST /api/users { user: { username, email, password } }` Then 201 + `{ user: { email, token, username, bio, image } }`.
- **테스트 시나리오**
  - 단위: ✅ (입력 검증, 비밀번호 해시, JWT 발급 유틸)
  - 통합: ✅ (DB 저장, 중복 username/email 거부)
  - E2E: ✅ (`/register` 폼 → / 리다이렉트 + navbar 갱신)
- **Happy path (정상)** 신규 이메일·username으로 가입 → 201 + token → 클라이언트가 localStorage 저장 후 자동 로그인.
- **Failure path (실패)** 중복 email/username, 비밀번호 정책 위반 → 422 `{ errors: { email: ["has already been taken"] } }`. **에러** 메시지는 폼 상단에 노출한다.

### R-F-02: 로그인 (POST /api/users/login)

- **우선순위** P0
- **설명** email·password로 인증하고 JWT를 반환한다.
- **Acceptance** Given 가입된 사용자 When `POST /api/users/login { user: { email, password } }` Then 200 + `{ user: { ..., token } }`.
- **테스트 시나리오**
  - 단위: ✅ (bcrypt 비교, JWT sign)
  - 통합: ✅ (DB 조회 + 인증 흐름)
  - E2E: ✅ (`/login` → /)
- **Happy path (정상)** 올바른 자격 증명 → 200 + token.
- **Failure path (실패)** 자격 증명 불일치 → 422 `{ errors: { "email or password": ["is invalid"] } }`. **에러** 표시 후 입력 유지.

### R-F-03: 현재 사용자 조회 (GET /api/user)

- **우선순위** P0
- **설명** JWT로 현재 사용자 정보를 조회한다.
- **Acceptance** Given 유효 토큰 When `GET /api/user` (Authorization: `Token <jwt>`) Then 200 + `{ user }`.
- **테스트 시나리오**
  - 단위: ✅ (토큰 파서)
  - 통합: ✅ (미들웨어 + DB 조회)
  - E2E: ✅ (앱 부팅 시 토큰으로 navbar 사용자 표시)
- **Happy path (정상)** 유효 토큰 → 200 + 현재 user.
- **Failure path (실패)** 토큰 누락/만료 → 401, 클라이언트는 토큰 제거 + `/login` 유도. **에러** 발생 시 UX 회복 경로 보장.

### R-F-04: 사용자 업데이트 (PUT /api/user)

- **우선순위** P0
- **설명** email·username·password·image·bio 중 일부를 부분 업데이트한다.
- **Acceptance** Given 로그인 사용자 When `PUT /api/user { user: { bio?, image?, ... } }` Then 200 + 갱신 user.
- **테스트 시나리오**
  - 단위: ✅ (부분 필드 병합, 비밀번호 변경 시 해시)
  - 통합: ✅ (충돌 username/email 거부)
  - E2E: ✅ (`/settings` 폼 → 저장 → navbar 갱신)
- **Happy path (정상)** 일부 필드 수정 → 200.
- **Failure path (실패)** 다른 사용자와 username/email 충돌 → 422. 비밀번호 정책 위반 시 **에러** 반환.

### R-F-05: 프로필 조회 (GET /api/profiles/:username)

- **우선순위** P0
- **설명** 사용자명으로 프로필을 조회한다. 인증 시 `following` 필드 포함.
- **Acceptance** Given 존재하는 username When `GET /api/profiles/:username` Then 200 + `{ profile: { username, bio, image, following } }`.
- **테스트 시나리오**
  - 단위: ✅ (직렬화 + following 계산)
  - 통합: ✅ (DB join: profile + follow 관계)
  - E2E: ✅ (`/profile/:username` 헤더 렌더링)
- **Happy path (정상)** 존재 username → 200.
- **Failure path (실패)** 미존재 username → 404. **에러** 시 404 페이지로 안내.

### R-F-06: 팔로우/언팔로우 (POST·DELETE /api/profiles/:username/follow)

- **우선순위** P0
- **설명** 사용자 간 follow 관계를 토글한다.
- **Acceptance** Given 로그인 사용자 When `POST /api/profiles/:username/follow` Then 200 + `{ profile: { ..., following: true } }`. DELETE는 following: false.
- **테스트 시나리오**
  - 단위: ✅ (관계 모델 add/remove)
  - 통합: ✅ (중복 follow 무해, 자기 자신 follow 거부)
  - E2E: ✅ (Follow 버튼 토글 + Your Feed 갱신)
- **Happy path (정상)** Follow → 200 following:true.
- **Failure path (실패)** 자기 자신 follow → 422. 미인증 → 401. 클라이언트는 **에러** 시 버튼 상태 롤백.

### R-F-07: 글 목록 (GET /api/articles)

- **우선순위** P0
- **설명** 글 목록을 `tag`, `author`, `favorited`, `limit`(default 20), `offset`(default 0)로 필터·페이지네이션한다.
- **Acceptance** Given 쿼리 파라미터 When `GET /api/articles?tag=ai&limit=10&offset=0` Then 200 + `{ articles: [...], articlesCount }`.
- **테스트 시나리오**
  - 단위: ✅ (쿼리 빌더, limit/offset 검증)
  - 통합: ✅ (필터 조합 동작, articlesCount 정확성)
  - E2E: ✅ (Home Global Feed + 태그 필터 + 페이지네이션)
- **Happy path (정상)** 필터/페이지 조합 → 200 + 페이지 결과.
- **Failure path (실패)** limit 범위 초과(예: 100 초과) → 422 또는 cap. 잘못된 정수 → **에러** 422.

### R-F-08: 글 피드 (GET /api/articles/feed)

- **우선순위** P0
- **설명** 현재 사용자가 follow한 작가들의 글만 페이지네이션 반환.
- **Acceptance** Given 로그인 + follow ≥ 1 When `GET /api/articles/feed?limit=10&offset=0` Then 200 + `{ articles, articlesCount }`.
- **테스트 시나리오**
  - 단위: ✅ (follow 그래프 조회)
  - 통합: ✅ (DB join: follow + article)
  - E2E: ✅ (Home "Your Feed" 탭 활성)
- **Happy path (정상)** follow 1명 + 글 ≥ 1 → 200 + 결과.
- **Failure path (실패)** 미인증 → 401. follow 0명 → 200 + 빈 배열(에러 아님), UX는 빈 상태 안내.

### R-F-09: 글 단건 조회 (GET /api/articles/:slug)

- **우선순위** P0
- **설명** slug로 단건 조회.
- **Acceptance** Given 존재 slug When `GET /api/articles/:slug` Then 200 + `{ article }`.
- **테스트 시나리오**
  - 단위: ✅ (직렬화: favoritesCount, author.following)
  - 통합: ✅ (favorited/following 사용자별 계산)
  - E2E: ✅ (`/article/:slug` 렌더)
- **Happy path (정상)** 존재 slug → 200.
- **Failure path (실패)** 미존재 slug → 404, 클라이언트 **에러** 404 페이지.

### R-F-10: 글 생성 (POST /api/articles)

- **우선순위** P0
- **설명** title·description·body(+tagList)로 글 생성, slug 자동 생성.
- **Acceptance** Given 로그인 When `POST /api/articles { article: { title, description, body, tagList? } }` Then 201 + `{ article }` with `slug`.
- **테스트 시나리오**
  - 단위: ✅ (slug 생성 알고리즘, 충돌 시 suffix)
  - 통합: ✅ (DB 저장 + tag upsert)
  - E2E: ✅ (`/editor` → Publish → `/article/:slug`)
- **Happy path (정상)** 모든 필드 유효 → 201.
- **Failure path (실패)** title/body 누락 → 422. 미인증 → 401. **에러** 메시지 폼별 노출.

### R-F-11: 글 수정 (PUT /api/articles/:slug)

- **우선순위** P0
- **설명** 작성자만 부분 업데이트 가능. title 변경 시 slug 재생성 정책은 ADR로 결정.
- **Acceptance** Given 작성자 로그인 When `PUT /api/articles/:slug { article: { title?, description?, body? } }` Then 200 + 갱신 article.
- **테스트 시나리오**
  - 단위: ✅ (부분 업데이트 병합)
  - 통합: ✅ (작성자 검증 + slug 정책)
  - E2E: ✅ (`/editor/:slug` 편집)
- **Happy path (정상)** 작성자 → 200.
- **Failure path (실패)** 비작성자 → 403. 미존재 slug → 404. 본문 검증 실패 → 422 **에러**.

### R-F-12: 글 삭제 (DELETE /api/articles/:slug)

- **우선순위** P0
- **설명** 작성자만 삭제 가능.
- **Acceptance** Given 작성자 When `DELETE /api/articles/:slug` Then 204.
- **테스트 시나리오**
  - 단위: ✅ (권한 가드)
  - 통합: ✅ (cascade: comments·favorites·article_tags)
  - E2E: ✅ (글 상세 Delete 버튼 → / 리다이렉트)
- **Happy path (정상)** 작성자 → 204.
- **Failure path (실패)** 비작성자 → 403 **에러**. 미존재 → 404.

### R-F-13: 댓글 작성/조회/삭제 (POST·GET·DELETE /api/articles/:slug/comments[/:id])

- **우선순위** P0
- **설명** 글당 댓글 CRUD. 본인 댓글만 삭제 가능.
- **Acceptance** Given 로그인 When `POST /api/articles/:slug/comments { comment: { body } }` Then 201 + `{ comment }`. GET은 200 + `{ comments }`. DELETE는 204(작성자만).
- **테스트 시나리오**
  - 단위: ✅ (직렬화)
  - 통합: ✅ (글 존재 검증 + 작성자 검증)
  - E2E: ✅ (글 상세 하단 댓글 흐름)
- **Happy path (정상)** 본인 댓글 작성 → 201, 삭제 → 204.
- **Failure path (실패)** 빈 body → 422. 타인 댓글 삭제 → 403 **에러**. 미존재 slug → 404.

### R-F-14: 즐겨찾기 추가/해제 (POST·DELETE /api/articles/:slug/favorite)

- **우선순위** P0
- **설명** 즐겨찾기 토글. `favoritesCount` 갱신.
- **Acceptance** Given 로그인 When `POST .../favorite` Then 200 + 갱신 article(favorited:true, favoritesCount++).
- **테스트 시나리오**
  - 단위: ✅ (관계 add/remove)
  - 통합: ✅ (중복 favorite 무해, 카운트 정합)
  - E2E: ✅ (Home/Article의 ♥ 버튼)
- **Happy path (정상)** 토글 → 200.
- **Failure path (실패)** 미인증 → 401. 미존재 slug → 404 **에러**.

### R-F-15: 태그 목록 (GET /api/tags)

- **우선순위** P1
- **설명** 모든 태그를 빈도 또는 등록순으로 반환(정렬 정책은 ADR).
- **Acceptance** Given 임의 요청 When `GET /api/tags` Then 200 + `{ tags: ["ai", "web", ...] }`.
- **테스트 시나리오**
  - 단위: ✅ (직렬화)
  - 통합: ✅ (DB 집계 정확성)
  - E2E: ✅ (Home sidebar Popular Tags 표시)
- **Happy path (정상)** 200 + 배열(빈 배열 허용).
- **Failure path (실패)** DB 장애 → 500, 클라이언트는 sidebar 빈 상태 + **에러** 토스트.

## 3. 비기능 요구사항

### R-N-01: 인증 (JWT)

- **우선순위** P0
- **설명** JWT는 `Authorization: Token <jwt>` 헤더(명세 명시), localStorage 저장, 만료 정책은 ADR에서 결정(초기 권고: 7d).
- **Acceptance** Given 유효 토큰 When 보호 endpoint 호출 Then 200. Given 만료 토큰 When 동일 호출 Then 401.
- **테스트 시나리오**
  - 단위: ✅ (JWT sign/verify)
  - 통합: ✅ (미들웨어 동작)
  - E2E: ✅ (만료 토큰 → /login 리다이렉트)
- **Happy path (정상)** 유효 토큰 흐름.
- **Failure path (실패)** 만료/위조 토큰 → 401 **에러** + 클라이언트 토큰 제거.

### R-N-02: 성능

- **우선순위** P1
- **설명** Home·Article 페이지의 핵심 API(GET /articles, /articles/:slug)는 P95 < 500ms (warm cache, dev 서버 단일 인스턴스 기준).
- **Acceptance** Given 1000 row seed When 50 RPS 5분 부하 Then P95 < 500ms.
- **테스트 시나리오**
  - 단위: N/A
  - 통합: ✅ (k6/autocannon 부하 스크립트)
  - E2E: N/A
- **Happy path (정상)** 목표 충족.
- **Failure path (실패)** 목표 미달 → N+1 진단, 인덱스 추가, 또는 정책 조정 후 재측정. **에러** 시 ADR로 기록.

### R-N-03: 보안

- **우선순위** P0
- **설명** 비밀번호는 bcrypt(cost ≥ 10), 입력은 서버에서 Zod 등으로 검증, CORS·Helmet 적용, 시크릿은 환경변수.
- **Acceptance** Given 보안 점검 체크리스트 When `/cso` 실행 Then 0 high finding.
- **테스트 시나리오**
  - 단위: ✅ (해시·검증 유틸)
  - 통합: ✅ (인증 미들웨어 우회 시도 거부)
  - E2E: N/A
- **Happy path (정상)** 모든 입력 검증·해시·CORS 정상.
- **Failure path (실패)** 평문 비밀번호 로그, 시크릿 노출 → BLOCK 머지 차단. **에러** 발견 시 hotfix.

### R-N-04: 배포 (3 profile)

- **우선순위** P0
- **설명** dev/stg/prod 3 profile 각각 fresh checkout 부팅 가능(ADR-0037 v1.1). `.env.{dev,stg,prod}.example`·migrations·lockfile·LOCAL.md 동기 갱신.
- **Acceptance** Given fresh clone When `./devkit dev` (각 profile) Then ready 신호 + 에러 0건.
- **테스트 시나리오**
  - 단위: N/A
  - 통합: ✅ (CI 매트릭스로 3 profile 부팅)
  - E2E: ✅ (각 profile에서 /login → / 통과)
- **Happy path (정상)** 3 profile 모두 ready.
- **Failure path (실패)** 한 profile 누락 → AI 게이트 6번째 축 BLOCK. **실패** PR 생성 금지(ADR-0037).

### R-N-05: 데이터 일관성

- **우선순위** P0
- **설명** 외래키·트랜잭션·cascade 정책으로 글 삭제 시 댓글·즐겨찾기·tag 관계가 일관되게 정리된다.
- **Acceptance** Given 글 + 댓글 N개 + favorite M개 When 글 삭제 Then 관련 row 0건.
- **테스트 시나리오**
  - 단위: N/A
  - 통합: ✅ (cascade migration + 삭제 후 카운트 0 검증)
  - E2E: ✅ (Delete 버튼 → / + 작가 프로필에서 사라짐)
- **Happy path (정상)** cascade 정상.
- **Failure path (실패)** orphan row 발견 → migration 수정 + 데이터 보정. **에러** 시 마이그레이션 롤백 절차 명시.

## 4. 인터페이스 요구사항

- **REST + JSON envelope** — 모든 요청·응답은 entity 키(`user`, `article`, `profile`, `comment`)로 감싼 JSON.
- **인증 헤더** — `Authorization: Token <jwt>` (명세 정본, Bearer 아님).
- **에러 형식** — 422 `{ "errors": { "<field>": ["<message>"] } }`. 401·403·404는 표준 HTTP semantics + JSON body 가능.
- **시간/날짜** — ISO 8601(예: `2026-05-15T10:00:00.000Z`).
- **페이지네이션** — `limit`(default 20, max 협의), `offset`(default 0).
- **CORS** — frontend origin 허용. preflight 통과.

## 5. 도메인 모델

- **User** — id, username(unique), email(unique), passwordHash, bio, image, createdAt, updatedAt.
- **Profile** — User의 public 투영(username, bio, image, following).
- **Article** — id, slug(unique), title, description, body, authorId, createdAt, updatedAt, favoritesCount.
- **Tag** — id, name(unique).
- **ArticleTag** — (articleId, tagId) many-to-many.
- **Favorite** — (userId, articleId) many-to-many.
- **Follow** — (followerId, followingId) self-referencing many-to-many.
- **Comment** — id, body, articleId, authorId, createdAt, updatedAt.

## 6. Open Questions

- JWT 만료 시간 (7d 권고, 리프레시 토큰 미지원).
- slug 충돌 시 정책 (suffix `-2`, `-3` vs 거부).
- 페이지네이션 limit 최대값 (예: 100 권고).
- 태그 정규화 규칙 (소문자 강제, 공백 트림, 최대 길이).
- `GET /api/tags` 정렬·중복 제거 정책.
