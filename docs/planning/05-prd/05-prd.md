---
doc_type: prd
version: v0.1 (Draft)
status: Draft
author: yongtae.cho@bespinglobal.com
date: 2026-05-15
gate: B
related:
  R-ID: [R-F-01, R-F-02, R-F-03, R-F-04, R-F-05, R-F-06, R-F-07, R-F-08, R-F-09, R-F-10, R-F-11, R-F-12, R-F-13, R-F-14, R-F-15]
  F-ID: []
  supersedes: null
---

# Conduit (RealWorld) — PRD

## 변경 이력

| Version | Date | Author | Change |
|---|---|---|---|
| v0.1 | 2026-05-15 | yongtae.cho@bespinglobal.com | 초안 — SRS(04) R-ID를 F-ID로 묶고 MVP cut 결정 |

## 1. 제품 개요

**Conduit**는 RealWorld 명세를 준수하는 풀스택 블로깅 플랫폼이다. 작가는 글을 발행·관리하고 독자는 글을 읽고 즐겨찾기·팔로우·댓글로 상호작용한다. JWT 인증·REST API·React SPA를 기반으로, toolkit NEW_PROJECT 흐름의 reference implementation 역할도 겸한다.

본 PRD는 SRS(04)의 R-ID(R-F-01~15, R-N-01~05)를 사용자 가치 단위의 F-ID(F-01~F-09)로 묶고 MVP cut을 결정한다.

## 2. 사용자 가치

- **작가** — 즉시 발행 가능한 markdown 에디터, 자기 글 통계(즐겨찾기 카운트·댓글), 팔로워 확보로 독자층 형성.
- **독자** — Global Feed에서 발견 + Your Feed에서 큐레이션. 태그·작가별 탐색, 즐겨찾기·댓글로 참여.
- **비회원 방문자** — 가입 없이 둘러보고 마음에 들면 회원가입(즐겨찾기·댓글·팔로우 시도 시 유도).
- **toolkit 사용자(내부)** — 게이트 A~C, WBS, sprint-bootstrap, /implement, AI 게이트, 휴먼 게이트의 end-to-end 검증 reference.

## 3. 기능

### F-01: 인증 (회원가입·로그인·현재 사용자·계정 수정)

- **MVP Cut** 포함 ✅
- **우선순위** P0
- **사용자 스토리** As a 새 사용자, I want 이메일과 비밀번호로 가입·로그인하기, so that 내 글을 작성하고 즐겨찾기·팔로우 같은 회원 전용 기능을 쓸 수 있다.
- **Acceptance** Given `/register` 또는 `/login` 진입 When 유효 입력 후 제출 Then JWT를 받아 localStorage에 저장하고 `/`로 이동, navbar가 인증 상태로 갱신된다.
- **R-ID 매핑** R-F-01, R-F-02, R-F-03, R-F-04, R-N-01.
- **테스트 시나리오** 가입→자동 로그인, 로그인→홈, 토큰 만료→로그아웃 유도, /settings 부분 수정.
  - 단위: ✅ (검증·해시·JWT)
  - 통합: ✅ (DB + 미들웨어)
  - E2E: ✅ (`/register`, `/login`, `/settings`)
- **Happy path (정상)** 신규 가입 → 자동 로그인 → /에서 navbar 사용자명 노출.
- **Failure path (실패)** 중복 이메일/username, 잘못된 자격 증명 → 422 **에러** 폼별 노출. 만료 토큰 → 자동 `/login`.

### F-02: 프로필 (조회·팔로우·아바타·bio)

- **MVP Cut** 포함 ✅
- **우선순위** P0
- **사용자 스토리** As a 독자, I want 작가의 프로필을 보고 follow 토글하기, so that 마음에 드는 작가의 글만 모아 본다.
- **Acceptance** Given `/profile/:username` 진입 When 페이지 로드 Then 사용자 정보·avatar·bio·follow 버튼이 표시되고, follow 토글이 즉시 반영된다.
- **R-ID 매핑** R-F-05, R-F-06.
- **테스트 시나리오** 비로그인 프로필 조회, 로그인 후 follow 토글, 자기 자신 프로필(Follow 버튼 미노출/Edit 노출).
  - 단위: ✅
  - 통합: ✅
  - E2E: ✅
- **Happy path (정상)** Follow 클릭 → following:true → Your Feed에 해당 작가 글 노출.
- **Failure path (실패)** 미존재 username → 404 안내. 자기 자신 follow 시도 → 버튼 비노출, 직접 호출은 422 **에러**.

### F-03: 글 작성·편집·삭제 (Editor)

- **MVP Cut** 포함 ✅
- **우선순위** P0
- **사용자 스토리** As a 작가, I want 제목·요약·markdown 본문·tagList로 글을 발행·편집·삭제하기, so that 내 글을 게시하고 관리한다.
- **Acceptance** Given `/editor` 또는 `/editor/:slug` 진입 When Publish 클릭 Then 201/200 + `/article/:slug` 리다이렉트. Delete 클릭 시 204 + `/`.
- **R-ID 매핑** R-F-10, R-F-11, R-F-12.
- **테스트 시나리오** 새 글 발행, 기존 글 편집, 자기 글 삭제, 비작성자 편집 시도 차단.
  - 단위: ✅ (slug 알고리즘, 부분 업데이트 병합)
  - 통합: ✅ (작성자 검증, cascade)
  - E2E: ✅ (`/editor`, `/editor/:slug`)
- **Happy path (정상)** 발행 → 글 상세 노출 → 편집 → 갱신 → 삭제 → `/` 복귀.
- **Failure path (실패)** 비작성자가 편집 URL 접근 → 403 **에러**. title/body 누락 → 422.

### F-04: 글 탐색 (Global Feed·태그·작가별)

- **MVP Cut** 포함 ✅
- **우선순위** P0
- **사용자 스토리** As a 독자/방문자, I want Global Feed에서 둘러보고 sidebar 인기 태그나 작가별 필터로 탐색하기, so that 관심 글을 빠르게 찾는다.
- **Acceptance** Given `/` 진입 When 탭/태그/페이지를 선택 Then `GET /api/articles?...`이 호출되고 articles + articlesCount로 페이지네이션이 동작한다.
- **R-ID 매핑** R-F-07, R-F-15.
- **테스트 시나리오** Global Feed 기본 로드, 태그 클릭 시 탭 추가·필터링, 페이지네이션 다음/이전, 작가별 필터(`/profile/:username` My Articles).
  - 단위: ✅ (쿼리 빌더)
  - 통합: ✅ (필터 조합·articlesCount)
  - E2E: ✅ (Home + sidebar + Profile My Articles)
- **Happy path (정상)** Global Feed → 20개 → 페이지 이동 → 다음 페이지.
- **Failure path (실패)** limit 초과 / 잘못된 정수 → 422 **에러**. 빈 결과 → 빈 상태 메시지.

### F-05: 개인 피드 (Your Feed)

- **MVP Cut** 포함 ✅
- **우선순위** P0
- **사용자 스토리** As a 로그인 독자, I want follow한 작가의 글만 모은 피드를 보기, so that 큐레이션된 글에 집중한다.
- **Acceptance** Given 로그인 + follow ≥ 1 When `/`에서 "Your Feed" 탭 선택 Then `GET /api/articles/feed`가 호출되고 follow된 작가의 글만 노출.
- **R-ID 매핑** R-F-08.
- **테스트 시나리오** follow 1명 + 글 ≥ 1 → 노출, follow 0명 → 빈 상태 CTA.
  - 단위: ✅
  - 통합: ✅
  - E2E: ✅
- **Happy path (정상)** follow된 작가의 글이 시간순 노출.
- **Failure path (실패)** 미인증으로 직접 호출 → 401. follow 0명 → 200 + 빈 배열(에러 아님, UX는 CTA 노출).

### F-06: 댓글

- **MVP Cut** 포함 ✅
- **우선순위** P0
- **사용자 스토리** As a 독자, I want 글에 댓글을 달고 본인 댓글을 삭제하기, so that 작가와 대화한다.
- **Acceptance** Given 로그인 + 글 상세 진입 When body 입력 후 Submit Then 201 + 목록 갱신. 본인 댓글 삭제 클릭 시 204 + 목록 제거.
- **R-ID 매핑** R-F-13.
- **테스트 시나리오** 작성, 조회(비로그인 포함), 본인 댓글 삭제, 타인 댓글 삭제 시도 차단.
  - 단위: ✅
  - 통합: ✅
  - E2E: ✅
- **Happy path (정상)** 작성 → 노출, 삭제 → 사라짐.
- **Failure path (실패)** 빈 body → 422 **에러**, 타인 댓글 삭제 → 403, 비로그인은 폼 미노출.

### F-07: 즐겨찾기 (Favorite)

- **MVP Cut** 포함 ✅
- **우선순위** P0
- **사용자 스토리** As a 독자, I want 좋아하는 글을 ♥로 표시하기, so that 나중에 다시 찾고 작가에게 호응을 보낸다.
- **Acceptance** Given 로그인 + Home/Article의 ♥ 버튼 When 클릭 Then favorited 토글 + favoritesCount ±1 + `/profile/:me/favorites` 탭 반영.
- **R-ID 매핑** R-F-14.
- **테스트 시나리오** 토글 add/remove, 카운트 정합, Profile favorites 탭, 비로그인 → /login.
  - 단위: ✅
  - 통합: ✅
  - E2E: ✅
- **Happy path (정상)** 토글 → 카운트 갱신.
- **Failure path (실패)** 미인증 클릭 → 401 또는 클라이언트 가드로 /login. 미존재 slug → 404 **에러**.

### F-08: 태그 (Popular Tags sidebar + tag-filtered feed)

- **MVP Cut** 포함 ✅
- **우선순위** P1
- **사용자 스토리** As a 방문자, I want 인기 태그를 sidebar에서 보고 클릭으로 필터링하기, so that 관심 주제 글만 본다.
- **Acceptance** Given `/` 진입 When sidebar Popular Tags 클릭 Then 탭 추가 + `GET /api/articles?tag=…` 결과 노출.
- **R-ID 매핑** R-F-15, R-F-07.
- **테스트 시나리오** GET /api/tags 정렬, sidebar 클릭 → tag tab, 필터 결과.
  - 단위: ✅
  - 통합: ✅
  - E2E: ✅
- **Happy path (정상)** 태그 클릭 → 필터 결과.
- **Failure path (실패)** GET /api/tags 500 → sidebar 빈 상태 + 토스트 **에러**.

### F-09: 비기능 (인증·성능·보안·3 profile 배포·데이터 일관성)

- **MVP Cut** 포함 ✅
- **우선순위** P0
- **사용자 스토리** As a 운영자, I want JWT·성능·보안·3 profile 부팅·데이터 일관성을 보장하기, so that 사용자가 신뢰하고 toolkit AI 게이트가 통과한다.
- **Acceptance** Given PR 머지 시점 When AI 게이트 6축 실행 Then 모두 PASS. dev/stg/prod 부팅 검증 PASS.
- **R-ID 매핑** R-N-01, R-N-02, R-N-03, R-N-04, R-N-05.
- **테스트 시나리오** 인증 미들웨어 동작, 부하 테스트, /cso 점검, 3 profile CI 매트릭스, cascade 검증.
  - 단위: ✅ (보안·해시 유틸)
  - 통합: ✅ (부하·인증·cascade)
  - E2E: ✅ (3 profile에서 /login → / 통과)
- **Happy path (정상)** 6축 모두 PASS → 머지 가능.
- **Failure path (실패)** 어느 축이라도 미통과 → AI 게이트 BLOCK. **에러** 시 PR 생성 금지(ADR-0037).

## 4. MVP Cut 요약

<!-- MVP Cut: RealWorld 명세 충실 구현이 본 프로젝트의 가치이므로 9개 F 전부 포함. 명세 외 확장(이미지 업로드, OAuth 등)은 비목표로 명시되어 표에서 제외. -->

| F-ID | MVP | 비고 |
| --- | --- | --- |
| F-01 | ✅ 포함 | RealWorld 명세 필수(Auth) — Sprint 1 |
| F-02 | ✅ 포함 | Profile + Follow — Sprint 1 |
| F-03 | ✅ 포함 | Article CRUD — Sprint 2 |
| F-04 | ✅ 포함 | Global Feed + 필터 — Sprint 2 |
| F-05 | ✅ 포함 | Your Feed — Sprint 3 |
| F-06 | ✅ 포함 | 댓글 — Sprint 3 |
| F-07 | ✅ 포함 | Favorite — Sprint 3 |
| F-08 | ✅ 포함 | 태그 sidebar + 필터 — Sprint 2 |
| F-09 | ✅ 포함 | NFR 묶음(인증·성능·보안·3 profile·일관성) — 매 Sprint |

## 5. UX 원칙 / 화면 구성 큰 그림

**UX 원칙**

- **명세 외관 충실** — Bootstrap 4 conduit theme의 헤더·feed 탭·sidebar 구성을 보존.
- **즉시 피드백** — favorite·follow 토글은 낙관적 업데이트 + 실패 시 롤백.
- **회원가입 유도** — 비회원의 회원 전용 동작은 차단 대신 `/login`·`/register` 유도.
- **에러 형식 통일** — 422는 폼 필드별, 401은 자동 로그아웃, 404는 별도 페이지.

**화면 (9 route, 7 page)**

- `/` Home (Your Feed | Global Feed | tag-filtered tabs + Popular Tags sidebar)
- `/login` 로그인 폼
- `/register` 회원가입 폼
- `/settings` 계정 설정
- `/editor` 새 글 작성
- `/editor/:slug` 글 편집
- `/article/:slug` 글 상세 + 댓글
- `/profile/:username` 프로필 + My Articles 탭
- `/profile/:username/favorites` 프로필 + Favorited Articles 탭

## 6. 의존성 / 외부 시스템

- **외부 의존** — 없음(이미지·이메일·OAuth·analytics 미사용).
- **개발 의존** — Node 20+, PostgreSQL 16, Docker(선택). 게이트 C HLD에서 lockfile·`.env.*.example`·migration 확정.
- **표준** — RealWorld 명세 (https://realworld-docs.netlify.app), Postman collection(`gothinkster/realworld`).
- **theme** — Bootstrap 4 conduit-bootstrap-template (https://github.com/gothinkster/conduit-bootstrap-template). ADR-0038(styling 솔루션) 매핑은 게이트 C에서 확정.

## 7. Open Questions

- 페이지네이션 default limit / max limit 정책 (예: default 20, max 100)?
- slug 충돌 정책 (suffix `-2`, `-3` vs 거부 vs 사용자 입력)?
- "Your Feed" follow 0명 빈 상태 — CTA로 추천 작가 노출 여부?
- tag 정규화 (소문자 강제·공백 트림·길이 제한)?
- 비회원이 favorite·follow 클릭 시 — 인라인 메시지 vs `/login` 라우팅 vs 모달?
- 글 title 변경 시 slug 재생성 + 리다이렉트 vs slug 고정?
