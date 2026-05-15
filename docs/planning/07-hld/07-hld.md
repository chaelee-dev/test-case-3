---
doc_type: hld
version: v0.1 (Draft)
status: Draft
author: yongtae.cho@bespinglobal.com
date: 2026-05-15
gate: C
related:
  R-ID: [R-F-01, R-F-02, R-F-03, R-F-04, R-F-05, R-F-06, R-F-07, R-F-08, R-F-09, R-F-10, R-F-11, R-F-12, R-F-13, R-F-14, R-F-15, R-N-01, R-N-02, R-N-03, R-N-04, R-N-05]
  F-ID: []
  supersedes: null
---

# Conduit (RealWorld) — High-Level Design (HLD)

## 변경 이력

| Version | Date | Author | Change |
|---|---|---|---|
| v0.1 | 2026-05-15 | yongtae.cho@bespinglobal.com | 초안 — 06 Stack 결정을 받아 §1 모듈 분해 + §2 데이터 흐름 + §3 비기능 대응 작성 (ADR-0031) |

## 1. 핵심 모듈 / 컴포넌트

> ADR-0031 — 본 표가 시스템 모듈 분해의 SoT. 08 Module Spec(LLD)이 각 행을 fan-out한다.

| 모듈 | 책임 | 의존 | 08에서 상세 |
| --- | --- | --- | --- |
| M-AUTH | 회원가입·로그인·현재 사용자·계정 수정, JWT sign/verify, bcrypt 해시 | M-DB(User), M-VALID, M-ERR | 08 §M-AUTH |
| M-PROFILE | 프로필 조회, 팔로우/언팔로우 관계 관리 | M-DB(User·Follow), M-AUTH, M-ERR | 08 §M-PROFILE |
| M-ARTICLE | 글 CRUD, slug 생성·충돌 처리, 글 목록 필터·페이지네이션, Your Feed | M-DB(Article·Tag·Favorite·Follow), M-AUTH, M-TAG, M-ERR | 08 §M-ARTICLE |
| M-COMMENT | 글당 댓글 CRUD, 본인 댓글 권한 검증 | M-DB(Comment), M-AUTH, M-ERR | 08 §M-COMMENT |
| M-FAVORITE | 즐겨찾기 토글, favoritesCount 갱신, profile favorites 탭 | M-DB(Favorite·Article), M-AUTH | 08 §M-FAVORITE |
| M-TAG | 태그 정규화·upsert, GET /api/tags 집계 | M-DB(Tag·ArticleTag) | 08 §M-TAG |
| M-DB | Prisma client, migrations, transaction helper, cascade 정책 | PostgreSQL | 08 §M-DB |
| M-HTTP | Express app 부팅, 미들웨어(cors·json·auth·errorHandler), router 조립 | 전 모듈 | 08 §M-HTTP |
| M-VALID | Zod schema 정의(요청 본문 + 쿼리), 422 envelope 변환 | M-ERR | 08 §M-VALID |
| M-ERR | 도메인 에러 → HTTP status·envelope 매핑(401·403·404·422·500) | — | 08 §M-ERR |
| M-FE-AUTH | localStorage JWT 관리, 인증 컨텍스트, 라우트 가드 | M-FE-API | 08 §M-FE-AUTH |
| M-FE-API | fetch wrapper, TanStack Query 정의, 19 endpoint 클라이언트 | M-FE-AUTH | 08 §M-FE-API |
| M-FE-PAGES | 9 route 페이지 컴포넌트(Home·Login·Register·Settings·Editor·Article·Profile·Profile favorites + 404) | M-FE-API, M-FE-UI | 08 §M-FE-PAGES |
| M-FE-UI | 디자인 토큰 적용 공용 컴포넌트(Button·Input·ArticlePreview·TagList·Pagination 등) | Tailwind | 08 §M-FE-UI |

## 2. 모듈 간 데이터 흐름

**시나리오 A — 글 발행 (UC-04, R-F-10)**

```
Browser /editor
  M-FE-PAGES(Editor) → M-FE-API(createArticle)
    → POST /api/articles + JWT
       M-HTTP(auth) → M-VALID(zod: title/body 필수)
         → M-ARTICLE.create(authorId, payload)
            → M-TAG.upsertMany(tagList)
            → M-DB.transaction { article.create, articleTag.createMany }
         ← article(slug)
       ← 201 + envelope
    ← article
  → router push /article/:slug
  → M-FE-PAGES(ArticlePage) → M-FE-API(getArticle)
```

**시나리오 B — Your Feed (UC-11, R-F-08)**

```
Browser /
  M-FE-PAGES(Home) → M-FE-API(getFeed)
    → GET /api/articles/feed + JWT
       M-HTTP(auth) → M-ARTICLE.feed(userId, limit, offset)
         → M-DB.query (join: follow + article, order by createdAt desc)
       ← articles[]
    ← envelope
  → 카드 리스트 렌더
```

**시나리오 C — 글 삭제 + cascade (UC-06, R-F-12, R-N-05)**

```
Browser article 상세 [Delete]
  M-FE-API(deleteArticle) → DELETE /api/articles/:slug + JWT
    M-HTTP(auth) → M-ARTICLE.delete(slug, requesterId)
      → 권한 검증(authorId==requesterId) → 미일치 시 M-ERR(FORBIDDEN)
      → M-DB.transaction { comment.deleteMany, favorite.deleteMany, articleTag.deleteMany, article.delete }
    ← 204
  → router push /
```

## 3. 비기능 대응

| 비기능 R-ID | 대응 전략 | 상세 |
| --- | --- | --- |
| R-N-01 (인증·JWT) | M-AUTH가 JWT 발급·검증, M-HTTP의 auth 미들웨어가 `Authorization: Token` 파싱 | 만료 7d 권고, 위조 토큰 → 401. 클라이언트는 M-FE-AUTH가 401 인터셉터로 토큰 제거 후 /login |
| R-N-02 (성능) | DB 인덱스(article(authorId), articleTag(tagId), follow(followerId)), favoritesCount 비정규화 컬럼 | 부하 측정은 13 §6 + autocannon k6. P95 < 500ms 목표 |
| R-N-03 (보안) | bcrypt(cost ≥ 10), Zod 입력 검증, helmet, cors allowlist, 시크릿 환경변수 분리 | 평문 로그 금지, /cso 점검. 의존 보안은 npm audit + GitHub Dependabot |
| R-N-04 (3 profile 배포) | `.env.{dev,stg,prod}.example` 3종 + profile별 부팅 명령 + LOCAL.md 동기 | AI 게이트 6번째 축이 3 profile 부팅 검증. 12 §6·§7 표가 SoT |
| R-N-05 (데이터 일관성) | M-DB transaction helper + Prisma cascade(`onDelete: Cascade`), migration 정책 | 글 삭제 시 댓글·favorite·articleTag 함께 정리 (시나리오 C) |

## 4. 외부 인터페이스 윤곽

- **북향(north) — Browser ↔ Backend** — RealWorld 19 endpoint(09 §2 표 정본). JSON envelope, JWT 헤더, 422 에러 형식.
- **남향(south) — Backend ↔ DB** — Prisma client(09 외부 인터페이스에 미포함, 08 M-DB §외부 인터페이스 참조). migrations는 12 §7 부팅 자산 표에서 추적.
- **외부 시스템** — 없음(06 §3).
