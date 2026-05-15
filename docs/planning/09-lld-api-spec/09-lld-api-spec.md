---
doc_type: api-spec
version: v0.1 (Draft)
status: Draft
author: yongtae.cho@bespinglobal.com
date: 2026-05-15
gate: C
related:
  R-ID: [R-F-01, R-F-02, R-F-03, R-F-04, R-F-05, R-F-06, R-F-07, R-F-08, R-F-09, R-F-10, R-F-11, R-F-12, R-F-13, R-F-14, R-F-15, R-N-01, R-N-03]
  F-ID: []
  supersedes: null
---

# Conduit (RealWorld) — API Spec (LLD — 외부 인터페이스)

## 변경 이력

| Version | Date | Author | Change |
|---|---|---|---|
| v0.1 | 2026-05-15 | yongtae.cho@bespinglobal.com | 초안 — RealWorld 19 endpoint 명세를 LLD로 확정 (https://realworld-docs.netlify.app/specifications/backend/endpoints/) |

## 1. 개요

- **Base URL** — `http://localhost:3000` (dev), profile별 분기 (12 §6).
- **모든 요청·응답은 JSON envelope** — 자원 키(`user`/`profile`/`article`/`comment`)로 감싼 객체.
- **인증 헤더** — `Authorization: Token <jwt>` (RealWorld 정본, Bearer 아님 — R-N-01).
- **에러 envelope** — 422 시 `{ "errors": { "<field>": ["<message>"] } }`. 401/403/404는 표준 HTTP + JSON body 가능.
- **시간** — ISO 8601 (UTC `Z` suffix).
- **페이지네이션** — `limit` (default 20, max 100), `offset` (default 0).

## 2. 엔드포인트 목록

| 메서드 | 경로 | 목적 | F-ID | R-ID |
| --- | --- | --- | --- | --- |
| POST | /api/users | 회원가입 + JWT 발급 | F-01 | R-F-01 |
| POST | /api/users/login | 로그인 + JWT 발급 | F-01 | R-F-02 |
| GET | /api/user | 현재 사용자 조회 | F-01 | R-F-03 |
| PUT | /api/user | 계정 부분 수정 | F-01 | R-F-04 |
| GET | /api/profiles/:username | 프로필 조회 | F-02 | R-F-05 |
| POST | /api/profiles/:username/follow | 팔로우 | F-02 | R-F-06 |
| DELETE | /api/profiles/:username/follow | 언팔로우 | F-02 | R-F-06 |
| GET | /api/articles | 글 목록 (필터·페이지네이션) | F-04 | R-F-07 |
| GET | /api/articles/feed | Your Feed | F-05 | R-F-08 |
| GET | /api/articles/:slug | 글 단건 조회 | F-03 | R-F-09 |
| POST | /api/articles | 글 생성 | F-03 | R-F-10 |
| PUT | /api/articles/:slug | 글 수정 | F-03 | R-F-11 |
| DELETE | /api/articles/:slug | 글 삭제 | F-03 | R-F-12 |
| POST | /api/articles/:slug/comments | 댓글 작성 | F-06 | R-F-13 |
| GET | /api/articles/:slug/comments | 댓글 조회 | F-06 | R-F-13 |
| DELETE | /api/articles/:slug/comments/:id | 댓글 삭제 | F-06 | R-F-13 |
| POST | /api/articles/:slug/favorite | 즐겨찾기 추가 | F-07 | R-F-14 |
| DELETE | /api/articles/:slug/favorite | 즐겨찾기 해제 | F-07 | R-F-14 |
| GET | /api/tags | 태그 목록 | F-08 | R-F-15 |

## 3. 엔드포인트 상세

### POST /api/users

- **Request** `{ "user": { "username": "alex", "email": "a@b.com", "password": "secret123" } }` (no auth)
- **Response 200** 201 `{ "user": { "email", "username", "bio": null, "image": null, "token": "<jwt>" } }`
- **Response 4xx/5xx**

| Status | Body | 조건 |
| --- | --- | --- |
| 422 | `{"errors":{"email":["has already been taken"]}}` | 중복 email/username |
| 422 | `{"errors":{"password":["is too short"]}}` | 정책 위반 |

- **테스트 시나리오** 04 R-F-01 (Happy: 201+token, Failure: 422 중복).

### POST /api/users/login

- **Request** `{ "user": { "email", "password" } }` (no auth)
- **Response 200** `{ "user": {..., "token"} }`
- **Response 4xx/5xx**

| Status | Body | 조건 |
| --- | --- | --- |
| 422 | `{"errors":{"email or password":["is invalid"]}}` | 자격 증명 불일치 |

- **테스트 시나리오** 04 R-F-02.

### GET /api/user

- **Request** Authorization: `Token <jwt>` (auth required)
- **Response 200** `{ "user": {..., "token"} }`
- **Response 4xx/5xx**

| Status | Body | 조건 |
| --- | --- | --- |
| 401 | `{"errors":{"auth":["token expired"]}}` | 만료/위조 |

- **테스트 시나리오** 04 R-F-03.

### PUT /api/user

- **Request** `{ "user": { "email"?, "username"?, "password"?, "image"?, "bio"? } }` + JWT
- **Response 200** `{ "user": {...갱신} }`
- **Response 4xx/5xx**

| Status | Body | 조건 |
| --- | --- | --- |
| 422 | `{"errors":{"username":["has already been taken"]}}` | 충돌 |
| 401 | — | 토큰 부재 |

- **테스트 시나리오** 04 R-F-04.

### GET /api/profiles/:username

- **Request** optional auth(인증 시 `following` 계산)
- **Response 200** `{ "profile": { "username", "bio", "image", "following": false } }`
- **Response 4xx/5xx**

| Status | Body | 조건 |
| --- | --- | --- |
| 404 | `{"errors":{"profile":["not found"]}}` | 미존재 username |

- **테스트 시나리오** 04 R-F-05.

### POST /api/profiles/:username/follow

- **Request** empty body + JWT
- **Response 200** `{ "profile": {..., "following": true } }`
- **Response 4xx/5xx**

| Status | Body | 조건 |
| --- | --- | --- |
| 401 | — | 토큰 부재 |
| 404 | — | 미존재 username |
| 422 | `{"errors":{"follow":["cannot follow yourself"]}}` | 자기 자신 |

- **테스트 시나리오** 04 R-F-06 Happy.

### DELETE /api/profiles/:username/follow

- **Request** JWT
- **Response 200** `{ "profile": {..., "following": false } }`
- **Response 4xx/5xx**

| Status | Body | 조건 |
| --- | --- | --- |
| 401 / 404 | — | 인증/리소스 |

- **테스트 시나리오** 04 R-F-06 Failure.

### GET /api/articles

- **Request** query `tag`·`author`·`favorited`·`limit`(default 20, max 100)·`offset`(default 0); optional auth
- **Response 200** `{ "articles": [...], "articlesCount": <int> }`
- **Response 4xx/5xx**

| Status | Body | 조건 |
| --- | --- | --- |
| 422 | `{"errors":{"limit":["must be ≤ 100"]}}` | invalid query |

- **테스트 시나리오** 04 R-F-07.

### GET /api/articles/feed

- **Request** JWT, query `limit`·`offset`
- **Response 200** `{ "articles": [...], "articlesCount" }`
- **Response 4xx/5xx**

| Status | Body | 조건 |
| --- | --- | --- |
| 401 | — | 토큰 부재 |

- **테스트 시나리오** 04 R-F-08.

### GET /api/articles/:slug

- **Request** optional auth
- **Response 200** `{ "article": { "slug","title","description","body","tagList","createdAt","updatedAt","favorited","favoritesCount","author":{"username","bio","image","following"} } }`
- **Response 4xx/5xx**

| Status | Body | 조건 |
| --- | --- | --- |
| 404 | — | 미존재 slug |

- **테스트 시나리오** 04 R-F-09.

### POST /api/articles

- **Request** `{ "article": { "title","description","body","tagList"? } }` + JWT
- **Response 200** 201 `{ "article": {..., "slug"} }`
- **Response 4xx/5xx**

| Status | Body | 조건 |
| --- | --- | --- |
| 422 | `{"errors":{"title":["can't be blank"]}}` | 누락 |
| 401 | — | 토큰 부재 |

- **테스트 시나리오** 04 R-F-10.

### PUT /api/articles/:slug

- **Request** `{ "article": { "title"?, "description"?, "body"? } }` + JWT
- **Response 200** `{ "article": {...갱신} }`
- **Response 4xx/5xx**

| Status | Body | 조건 |
| --- | --- | --- |
| 403 | `{"errors":{"auth":["forbidden"]}}` | 비작성자 |
| 404 | — | 미존재 slug |
| 422 | — | 검증 실패 |

- **테스트 시나리오** 04 R-F-11.

### DELETE /api/articles/:slug

- **Request** JWT
- **Response 200** 204 (no body)
- **Response 4xx/5xx**

| Status | Body | 조건 |
| --- | --- | --- |
| 403 | — | 비작성자 |
| 404 | — | 미존재 |

- **테스트 시나리오** 04 R-F-12.

### POST /api/articles/:slug/comments

- **Request** `{ "comment": { "body" } }` + JWT
- **Response 200** 201 `{ "comment": { "id","createdAt","updatedAt","body","author":{...} } }`
- **Response 4xx/5xx**

| Status | Body | 조건 |
| --- | --- | --- |
| 422 | `{"errors":{"body":["can't be blank"]}}` | 빈 body |
| 401 | — | 토큰 부재 |
| 404 | — | 미존재 slug |

- **테스트 시나리오** 04 R-F-13.

### GET /api/articles/:slug/comments

- **Request** optional auth
- **Response 200** `{ "comments": [...] }`
- **Response 4xx/5xx**

| Status | Body | 조건 |
| --- | --- | --- |
| 404 | — | 미존재 slug |

- **테스트 시나리오** 04 R-F-13.

### DELETE /api/articles/:slug/comments/:id

- **Request** JWT
- **Response 200** 204
- **Response 4xx/5xx**

| Status | Body | 조건 |
| --- | --- | --- |
| 403 | — | 비작성자 |
| 404 | — | 미존재 comment/slug |
| 401 | — | 토큰 부재 |

- **테스트 시나리오** 04 R-F-13.

### POST /api/articles/:slug/favorite

- **Request** empty body + JWT
- **Response 200** `{ "article": {..., "favorited": true, "favoritesCount": N } }`
- **Response 4xx/5xx**

| Status | Body | 조건 |
| --- | --- | --- |
| 401 | — | 토큰 부재 |
| 404 | — | 미존재 slug |

- **테스트 시나리오** 04 R-F-14 Happy.

### DELETE /api/articles/:slug/favorite

- **Request** JWT
- **Response 200** `{ "article": {..., "favorited": false } }`
- **Response 4xx/5xx**

| Status | Body | 조건 |
| --- | --- | --- |
| 401 / 404 | — | 인증/리소스 |

- **테스트 시나리오** 04 R-F-14 Failure.

### GET /api/tags

- **Request** none
- **Response 200** `{ "tags": ["ai","web",...] }`
- **Response 4xx/5xx**

| Status | Body | 조건 |
| --- | --- | --- |
| 500 | — | DB 장애 |

- **테스트 시나리오** 04 R-F-15.

## 4. Webhook / 콜백

- N/A — 외부 시스템 없음(06 §3).

## 5. Rate Limit / Quota

- **dev/stg** — 미설정. 자유 호출 허용.
- **prod 권고** — IP 기준 60 req/min, JWT 기준 600 req/min (Express middleware로 적용). 정확한 값은 운영 단계에서 ADR로 결정.
- **남용 패턴** — 동일 username/email로 1초 내 register 반복 → 5 req/min throttle 권고.
