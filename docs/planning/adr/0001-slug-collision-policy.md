---
adr_id: ADR-0001
title: Article slug 충돌 정책 — suffix `-2`, `-3`, ...
status: Accepted
date: 2026-05-15
deciders: yongtae.cho@bespinglobal.com
related:
  R-ID: [R-F-10, R-F-11]
  F-ID: [F-03]
  RISK-ID: [RISK-02]
issue: 12
---

# ADR-0001 — Article slug 충돌 정책

## 컨텍스트

RealWorld 명세는 `/api/articles`의 응답 객체에 `slug` 필드를 포함시키며, 글 단건 조회·수정·삭제는 모두 `slug`를 path parameter로 사용한다(`GET/PUT/DELETE /api/articles/:slug`). 그러나 명세에는 **slug 생성 방식**과 **slug 충돌 시 정책**이 명시되어 있지 않다.

본 프로젝트에서는 다음 두 결정이 필요했다.
1. slug 생성 방식 — title을 어떻게 URL-safe 식별자로 변환할 것인가?
2. 동일 title로 발행할 때 발생하는 slug 충돌을 어떻게 처리할 것인가?

15-risk.md `RISK-02`(slug 충돌 정책 미정, Medium)의 직접 대응이다.

## 결정

### slug 생성 규칙 (`slugify(title)`)

- 입력 title을 NFKD 정규화 후 결합 발음 부호(combining marks) 제거.
- ASCII `[a-z0-9]` 외의 모든 문자는 `-`로 치환, 연속된 `-`는 1개로 축소, 양끝 `-`는 트림.
- 최대 80자로 절단 (DB 인덱스·URL 길이 안정성).
- 결과가 빈 문자열이면 `"article"`로 대체.

### slug 충돌 시 suffix 정책

동일 base slug가 이미 존재할 경우:

```
hello-world         (base)
hello-world-2       (1st collision)
hello-world-3       (2nd collision)
...
hello-world-999     (마지막 안전선)
```

- 첫 충돌부터 `-2`로 시작한다(`-1`은 사용 안 함, `base`가 첫 번째이므로).
- 최대 998회 검사 후에도 모두 충돌하면 예외를 던진다(현실적으로 불가, 안전선).
- 검사 단위는 `prisma.article.findUnique({ where: { slug } })` 1회 쿼리당 1슬러그. 트랜잭션 외부에서 candidate를 결정한 뒤 `INSERT`. 동시성 race condition은 unique constraint + 재시도로 처리(현재 미구현, P2).

### 글 수정(PUT) 시 slug 변경 정책

- **slug는 발행 시점에 고정**. 이후 title 수정 시 slug를 *재생성하지 않는다*.
- 사유: 외부 링크가 깨지지 않게 하고(RealWorld 명세도 `:slug`만 식별자로 사용), 작성자 의도 외의 의도치 않은 변경을 방지한다.
- 차후 별도 endpoint(예: `POST /api/articles/:slug/rename`)로 명시적으로 변경하는 옵션은 본 ADR 외 결정.

## 결과

- **이슈 #7** (`backend/article-crud`)에서 `backend/src/modules/article/slug.ts`에 `slugify()` + `generateUniqueSlug()` 구현.
- **이슈 #12** (본 ADR)에서 정책 문서화.
- 8개 단위 테스트가 정책을 검증한다 — lowercase·hyphenate, non-ASCII strip, empty fallback, 80-char truncation, `-2`/`-3` suffix.

## 대안 검토

| 대안 | 채택 여부 | 사유 |
| --- | --- | --- |
| **A. suffix `-2`, `-3` 자동 (본 결정)** | ✅ | 사용자 친화 + 충돌 투명, RealWorld 다수 구현이 채택 |
| B. 409 Conflict 반환 후 사용자가 title 변경 | ❌ | UX 저하 (작성자가 비결정적 충돌 처리 부담) |
| C. UUID/hash suffix | ❌ | slug 가독성 손실, SEO 비목표여도 가독성은 가치 |
| D. title 변경 시 slug 재생성 | ❌ | 외부 링크 파괴, 캐시 무효화 비용 |

## 상태 변화

- DRAFT(이슈 #7 작성 시) → Accepted(본 ADR 머지).
- 재검토 트리거: pagination·SEO 비목표 변경, 또는 사용자 보고된 slug 충돌 사고 발생.
