---
doc_type: module-spec
version: v0.1 (Draft)
status: Draft
author: yongtae.cho@bespinglobal.com
date: 2026-05-15
gate: C
related:
  R-ID: [R-F-01, R-F-02, R-F-03, R-F-04, R-F-05, R-F-06, R-F-07, R-F-08, R-F-09, R-F-10, R-F-11, R-F-12, R-F-13, R-F-14, R-F-15, R-N-01, R-N-03, R-N-05]
  F-ID: []
  supersedes: null
---

# Conduit (RealWorld) — Module Spec (LLD — 모듈/통신)

## 변경 이력

| Version | Date | Author | Change |
|---|---|---|---|
| v0.1 | 2026-05-15 | yongtae.cho@bespinglobal.com | 초안 — 07 HLD §1 모듈 14종을 LLD로 fan-out (ADR-0031) |

## 1. 모듈 개요

> 본 LLD는 **07 HLD §1 참조** 의 14개 모듈을 각각 fan-out한다. 외부 인터페이스·내부 컴포넌트·에러·테스트 진입점은 §2~§8에 단일 표로 합본.

### 1.1 백엔드 모듈

- **모듈 ID** M-AUTH
- **책임** 회원가입(R-F-01), 로그인(R-F-02), 현재 사용자 조회(R-F-03), 계정 수정(R-F-04). JWT sign/verify, bcrypt 해시.
- **07 HLD §1 참조** — `M-AUTH` 행 (책임: 인증·계정)
- **R-ID 매핑** R-F-01, R-F-02, R-F-03, R-F-04, R-N-01, R-N-03
- **F-ID 매핑** F-01

- **모듈 ID** M-PROFILE
- **책임** 프로필 조회(R-F-05), 팔로우/언팔로우(R-F-06).
- **07 HLD §1 참조** — `M-PROFILE` 행
- **R-ID 매핑** R-F-05, R-F-06
- **F-ID 매핑** F-02

- **모듈 ID** M-ARTICLE
- **책임** 글 CRUD(R-F-09~12), 글 목록/필터/페이지네이션(R-F-07), Your Feed(R-F-08), slug 생성·충돌 처리.
- **07 HLD §1 참조** — `M-ARTICLE` 행
- **R-ID 매핑** R-F-07, R-F-08, R-F-09, R-F-10, R-F-11, R-F-12
- **F-ID 매핑** F-03, F-04, F-05

- **모듈 ID** M-COMMENT
- **책임** 댓글 작성/조회/삭제(R-F-13).
- **07 HLD §1 참조** — `M-COMMENT` 행
- **R-ID 매핑** R-F-13
- **F-ID 매핑** F-06

- **모듈 ID** M-FAVORITE
- **책임** 즐겨찾기 토글(R-F-14), favoritesCount 갱신.
- **07 HLD §1 참조** — `M-FAVORITE` 행
- **R-ID 매핑** R-F-14
- **F-ID 매핑** F-07

- **모듈 ID** M-TAG
- **책임** 태그 upsert·정규화, GET /api/tags(R-F-15).
- **07 HLD §1 참조** — `M-TAG` 행
- **R-ID 매핑** R-F-15
- **F-ID 매핑** F-08

- **모듈 ID** M-DB
- **책임** Prisma client + transaction helper + cascade(R-N-05).
- **07 HLD §1 참조** — `M-DB` 행
- **R-ID 매핑** R-N-05
- **F-ID 매핑** F-09

- **모듈 ID** M-HTTP
- **책임** Express app · 미들웨어 체인 · router 조립.
- **07 HLD §1 참조** — `M-HTTP` 행
- **R-ID 매핑** R-N-01, R-N-03
- **F-ID 매핑** F-09

- **모듈 ID** M-VALID
- **책임** Zod 스키마 + 422 envelope 변환.
- **07 HLD §1 참조** — `M-VALID` 행
- **R-ID 매핑** R-N-03
- **F-ID 매핑** F-09

- **모듈 ID** M-ERR
- **책임** 도메인 에러 → HTTP status·envelope 매핑(401/403/404/422/500).
- **07 HLD §1 참조** — `M-ERR` 행
- **R-ID 매핑** R-N-03
- **F-ID 매핑** F-09

### 1.2 프론트엔드 모듈

- **모듈 ID** M-FE-AUTH
- **책임** localStorage JWT, 인증 컨텍스트, 라우트 가드(401 인터셉터).
- **07 HLD §1 참조** — `M-FE-AUTH` 행
- **R-ID 매핑** R-F-01, R-F-02, R-F-03, R-N-01
- **F-ID 매핑** F-01

- **모듈 ID** M-FE-API
- **책임** fetch wrapper + TanStack Query, 19 endpoint 클라이언트.
- **07 HLD §1 참조** — `M-FE-API` 행
- **R-ID 매핑** R-F-01~15
- **F-ID 매핑** F-01~F-08

- **모듈 ID** M-FE-PAGES
- **책임** 9 route 페이지(Home/Login/Register/Settings/Editor 2종/Article/Profile 2종 + 404).
- **07 HLD §1 참조** — `M-FE-PAGES` 행
- **R-ID 매핑** R-F-01~15
- **F-ID 매핑** F-01~F-08

- **모듈 ID** M-FE-UI
- **책임** 디자인 토큰 적용 공용 컴포넌트(10 §3 토큰 → Tailwind class).
- **07 HLD §1 참조** — `M-FE-UI` 행
- **R-ID 매핑** R-N-03 (XSS 방지를 위한 안전한 렌더 등)
- **F-ID 매핑** F-01~F-08

## 2. 외부 인터페이스

> 백엔드 모듈은 HTTP endpoint(09 정본)와 함수 시그니처, 프론트엔드 모듈은 React 컴포넌트/hook을 외부 인터페이스로 본다.

| 인터페이스 | 입력 | 출력 | 에러 |
| --- | --- | --- | --- |
| M-AUTH.register(body) → M-HTTP `POST /api/users` | `{username,email,password}` | `{user:{...,token}}` | 422 중복/검증 |
| M-AUTH.login(body) → M-HTTP `POST /api/users/login` | `{email,password}` | `{user:{...,token}}` | 422 자격 증명 불일치 |
| M-AUTH.me(userId) → M-HTTP `GET /api/user` | JWT | `{user}` | 401 토큰 부재/만료 |
| M-AUTH.update(userId, body) → M-HTTP `PUT /api/user` | partial user | `{user}` | 422 충돌/검증, 401 |
| M-PROFILE.get(username, viewerId?) → M-HTTP `GET /api/profiles/:username` | username | `{profile}` | 404 |
| M-PROFILE.follow(username, viewerId) → POST/DELETE `/api/profiles/:username/follow` | JWT | `{profile}` | 401, 422(self-follow) |
| M-ARTICLE.list(query, viewerId?) → `GET /api/articles` | tag/author/favorited/limit/offset | `{articles, articlesCount}` | 422 invalid query |
| M-ARTICLE.feed(viewerId, limit, offset) → `GET /api/articles/feed` | JWT | `{articles, articlesCount}` | 401 |
| M-ARTICLE.get(slug, viewerId?) → `GET /api/articles/:slug` | slug | `{article}` | 404 |
| M-ARTICLE.create(authorId, body) → `POST /api/articles` | `{title,description,body,tagList?}` | `{article}` | 422, 401 |
| M-ARTICLE.update(slug, authorId, body) → `PUT /api/articles/:slug` | partial | `{article}` | 422, 403, 404, 401 |
| M-ARTICLE.delete(slug, authorId) → `DELETE /api/articles/:slug` | slug + JWT | 204 | 403, 404, 401 |
| M-COMMENT.create/list/delete → `/api/articles/:slug/comments[/:id]` | comment body | `{comment\|comments}` | 422, 403, 404, 401 |
| M-FAVORITE.toggle(slug, viewerId, op) → `POST/DELETE /api/articles/:slug/favorite` | JWT | `{article}` | 401, 404 |
| M-TAG.list() → `GET /api/tags` | — | `{tags: string[]}` | 500 |
| M-DB (`PrismaClient`) | model 메서드 호출 | row/array | `PrismaError` → M-ERR |
| M-FE-API.useArticles(query) (hook) | query object | `{data, isLoading, error}` | M-FE-AUTH 401 인터셉트 |
| M-FE-AUTH.useAuth() (hook) | — | `{user, login, logout, register}` | 401 → 자동 logout |
| M-FE-PAGES (route 컴포넌트) | URL 파라미터 + JWT 상태 | rendered page | 404·401·403 페이지 |
| M-FE-UI Button/Input/Card etc. | props | JSX | — |

## 3. 내부 컴포넌트

| 모듈 | 내부 컴포넌트 | 역할 |
| --- | --- | --- |
| M-AUTH | `passwordHasher`, `jwtSigner`, `userService` | bcrypt 해시·비교, JWT sign/verify, 비즈니스 로직 |
| M-PROFILE | `profileSerializer`, `followService` | 직렬화(following 계산), 관계 add/remove |
| M-ARTICLE | `slugGenerator`, `articleService`, `feedQuery` | slug 충돌 회피, CRUD 흐름, follow×article 조회 |
| M-COMMENT | `commentService` | 권한 검증 + CRUD |
| M-FAVORITE | `favoriteService` | 토글 + count 갱신 |
| M-TAG | `tagNormalizer`, `tagAggregator` | lowercase + trim, 빈도 집계 |
| M-DB | `prismaClient`, `tx` helper | 단일 client + 트랜잭션 래퍼 |
| M-HTTP | `app`, `middleware/{cors,auth,errorHandler,requestLogger}`, `routes/*` | Express 부팅 |
| M-VALID | `schemas/{auth,article,comment,profile}` | Zod 정의 |
| M-ERR | `AppError`, `errorMapper` | 도메인 에러 클래스 + HTTP 매핑 |
| M-FE-AUTH | `AuthContext`, `useAuth`, `authStorage`, `apiClient interceptor` | 토큰 lifecycle |
| M-FE-API | `apiClient`, `queries/{articles,auth,profile,comments,tags}` | TanStack Query 정의 |
| M-FE-PAGES | `pages/{Home,Login,Register,Settings,Editor,Article,Profile,ProfileFavorites,NotFound}` | route 컴포넌트 |
| M-FE-UI | `Button`, `Input`, `Textarea`, `ArticlePreview`, `TagList`, `Pagination`, `Avatar`, `FeedTabs`, `CommentCard` | 공용 UI |

## 4. 데이터 흐름

**요청 처리 표준 흐름 (백엔드)**

```
Express request
  → requestLogger
  → cors
  → jsonParser
  → auth (Authorization: Token <jwt>)
      ├─ public route → 통과
      └─ protected route → JWT verify → req.user 주입
  → router → controller
      → M-VALID.parse(body) → 422 if fail
      → service (M-AUTH/M-ARTICLE/...)
        → M-DB.tx(...)
      → response.json(envelope)
  → errorHandler (M-ERR.map)
```

**프론트엔드 데이터 흐름**

```
Route 진입
  → M-FE-PAGES 컴포넌트 mount
    → M-FE-API.useQuery(...) (TanStack Query)
      → M-FE-AUTH.apiClient(헤더에 JWT 자동 첨부)
        → fetch
      ← 응답 → cache
    ← {data, isLoading, error}
  → M-FE-UI 컴포넌트로 렌더
  → 사용자 액션 (favorite·follow·publish)
    → M-FE-API.useMutation → invalidate query → 재조회
```

## 5. 상태·라이프사이클

- **JWT** — 발급(register/login) → localStorage 저장 → 매 요청 attach → 401 응답 시 제거 + /login.
- **Article slug** — 생성 시 `slugify(title)` + 충돌 시 `-2`, `-3` suffix(ADR 결정). update 시 slug 고정(Brief Open Question 결론으로 ADR화).
- **favoritesCount** — Favorite row 변화 시 비정규화 컬럼 갱신(트랜잭션 안에서).

## 6. 에러 처리

| 에러 | 발생 조건 | 처리 |
| --- | --- | --- |
| `VALIDATION_ERROR` | Zod parse 실패 | 422 `{errors: {<field>: [msg]}}` |
| `UNAUTHORIZED` | JWT 부재·만료·위조 | 401, 클라이언트는 토큰 제거 + /login |
| `FORBIDDEN` | 작성자 검증 실패(글/댓글 수정·삭제) | 403 `{errors: {auth: ["forbidden"]}}` |
| `NOT_FOUND` | username/slug/commentId 부재 | 404 `{errors: {resource: ["not found"]}}` |
| `CONFLICT` | username/email/slug 중복 | 422 `{errors: {<field>: ["has already been taken"]}}` |
| `SELF_FOLLOW` | 자기 자신 follow 시도 | 422 `{errors: {follow: ["cannot follow yourself"]}}` |
| `INTERNAL_ERROR` | 미처리 예외 | 500, 로그에 traceId 기록, body는 일반 메시지 |

## 7. 동시성·트랜잭션

- **글 삭제** — M-DB.tx로 `comment·favorite·articleTag·article` 순차 삭제(또는 Prisma cascade).
- **즐겨찾기 토글** — `tx { favorite.upsert/delete; article.update(favoritesCount±1) }`.
- **글 생성 + tag upsert** — `tx { tag.upsertMany; article.create; articleTag.createMany }`.
- **낙관적 락 불요** — 본 명세는 동시성 충돌 가능성 낮음(개별 user 단위 작업).

## 8. 테스트 진입점

| 모듈 | 단위 진입점 | 통합 진입점 | E2E 진입점 |
| --- | --- | --- | --- |
| M-AUTH | `passwordHasher`, `jwtSigner` 함수 | supertest `POST /api/users`, `/login`, `GET/PUT /api/user` | `/register`·`/login`·`/settings` 시나리오 |
| M-PROFILE | `profileSerializer.following` 함수 | supertest `GET /api/profiles/:username`, `POST/DELETE /follow` | `/profile/:username` follow 토글 |
| M-ARTICLE | `slugGenerator`, `feedQuery` 빌더 | supertest `/api/articles*` 전부 | `/`, `/editor`, `/article/:slug` |
| M-COMMENT | `commentService.canDelete` | supertest `/comments` CRUD | 글 상세 댓글 흐름 |
| M-FAVORITE | `favoriteService.toggle` | supertest `/favorite` + favoritesCount 검증 | Home/Article의 ♥ |
| M-TAG | `tagNormalizer` | supertest `GET /api/tags` | sidebar Popular Tags |
| M-DB | `tx` 헬퍼 | migration 적용 + cascade 검증 | — |
| M-HTTP | 미들웨어 단위 | full middleware chain | — |
| M-VALID | Zod schema unit | 422 envelope 변환 | — |
| M-ERR | `errorMapper` | error → status 매핑 | — |
| M-FE-AUTH | `useAuth` reducer | TanStack Query + AuthContext | login flow |
| M-FE-API | `apiClient` unit | mocked server + hooks | 전 페이지 |
| M-FE-PAGES | component unit (Vitest + RTL) | page integration | Playwright 페이지 시나리오 |
| M-FE-UI | component unit | — | 시각 회귀(선택) |
