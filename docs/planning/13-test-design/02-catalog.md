---
doc_type: test-design
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

# 02-catalog Test Scenario Catalog (단위·통합·E2E 별 묶음) — test-design

## 변경 이력

| Version | Date | Author | Change |
|---|---|---|---|
| v0.1 | 2026-05-15 | yongtae.cho@bespinglobal.com | 초안 — 04 SRS R-ID + 05 PRD F-ID 시나리오 fan-in. §1~§3는 각 레벨에서 *대표* 시나리오. §4 매트릭스가 전수 결정 |

> 각 R-/F-ID subsection은 04 SRS 또는 05 PRD의 "테스트 시나리오" 항목을 인용한다. 본 카탈로그는 ADR-0036 레벨 그룹핑을 따른다 — §1 단위, §2 통합, §3 E2E. 한 ID가 여러 레벨에 적용되면 가장 *대표적인* 레벨 1곳에 subsection을 두고, §4 매트릭스에 전체 분포를 기록.

## 1. 단위 테스트 카탈로그

### R-F-01: 회원가입 — 비밀번호 해시·JWT 발급 유틸 단위

- **출처** 04#R-F-01
- **테스트 레벨** 단위 (+ 통합·E2E는 §2·§3·§4 참조)
- **대상** `passwordHasher.hash/compare`, `jwtSigner.sign/verify`.
- **시나리오** (Happy) 비밀번호 해시 round-trip 검증, JWT payload `{sub, exp}` 정합. (Failure) 잘못된 cost 값 → 예외.

### R-F-10: 글 생성 — slug 생성 알고리즘 단위

- **출처** 04#R-F-10
- **테스트 레벨** 단위
- **대상** `slugGenerator(title)`.
- **시나리오** (Happy) "Hello World!" → "hello-world", 한글·이모지 제거. (Failure) 빈 title → throw, 충돌 시 `-2`·`-3` suffix.

### R-F-15: 태그 정규화 단위

- **출처** 04#R-F-15
- **테스트 레벨** 단위
- **대상** `tagNormalizer(input)`.
- **시나리오** (Happy) 대문자→소문자, 공백 트림, 중복 제거. (Failure) 길이 초과 → 예외.

### R-N-01: JWT sign/verify 유틸 단위

- **출처** 04#R-N-01
- **테스트 레벨** 단위
- **대상** `jwtSigner`.
- **시나리오** (Happy) sign→verify round-trip, exp 검증. (Failure) 위조 토큰 → throw, 만료 토큰 → throw.

### F-01: AuthContext reducer 단위 (frontend)

- **출처** 05#F-01
- **테스트 레벨** 단위 (frontend RTL)
- **대상** `useAuth` reducer + `authStorage`.
- **시나리오** (Happy) login → state.user 갱신 + localStorage 저장. logout → state.user null + 토큰 제거. (Failure) 만료 401 → 자동 logout.

## 2. 통합 테스트 카탈로그

### R-F-02: 로그인 — supertest 통합

- **출처** 04#R-F-02
- **테스트 레벨** 통합
- **대상** `POST /api/users/login` (M-AUTH + M-DB).
- **시나리오** (Happy) 유효 자격 증명 → 200 + token, DB user row 조회 일치. (Failure) 잘못된 비밀번호 → 422.

### R-F-06: 팔로우 — 자기 자신 거부 통합

- **출처** 04#R-F-06
- **테스트 레벨** 통합
- **대상** `POST /api/profiles/:username/follow`.
- **시나리오** (Happy) 다른 사용자 follow → 200 + following:true. (Failure) 자기 자신 → 422 SELF_FOLLOW, 미인증 → 401.

### R-F-07: 글 목록 필터 — query 조합 통합

- **출처** 04#R-F-07
- **테스트 레벨** 통합
- **대상** `GET /api/articles?tag=&author=&favorited=&limit=&offset=`.
- **시나리오** (Happy) 태그 필터·작가 필터·페이지네이션 조합 → 정확한 articlesCount. (Failure) limit > 100 → 422.

### R-F-12: 글 삭제 — cascade 통합

- **출처** 04#R-F-12
- **테스트 레벨** 통합
- **대상** `DELETE /api/articles/:slug` + DB 트랜잭션.
- **시나리오** (Happy) 작성자 삭제 → 204 + comments·favorites·articleTags 모두 0건. (Failure) 비작성자 → 403, 미존재 slug → 404.

### R-F-14: 즐겨찾기 — favoritesCount 정합 통합

- **출처** 04#R-F-14
- **테스트 레벨** 통합
- **대상** `POST/DELETE /api/articles/:slug/favorite`.
- **시나리오** (Happy) 토글 add → count +1, remove → -1. (Failure) 중복 add 무해(idempotent), 미인증 → 401.

### R-N-03: 보안 — 평문 비밀번호 거부 통합

- **출처** 04#R-N-03
- **테스트 레벨** 통합
- **대상** Zod schema + M-AUTH.
- **시나리오** (Happy) 정상 비밀번호 정책 통과 + 해시 저장. (Failure) 평문 로그 0건, weak 비밀번호 → 422.

### R-N-05: 데이터 일관성 — cascade 통합

- **출처** 04#R-N-05
- **테스트 레벨** 통합
- **대상** Prisma migration + cascade 정책.
- **시나리오** (Happy) 글 + 댓글 N + favorite M 생성 후 글 삭제 → 모두 0건. (Failure) cascade 누락 발견 시 마이그레이션 BLOCK.

## 3. E2E 테스트 카탈로그

### F-01: 회원가입 → 자동 로그인 → Home E2E

- **출처** 05#F-01 (UC-01)
- **테스트 레벨** E2E
- **대상** `/register` → `/`.
- **시나리오** (Happy) 신규 가입 후 navbar 사용자명 노출 + Your Feed 탭 가시. (Failure) 중복 이메일 → 422 폼 에러 표시.

### F-03: 새 글 발행 → 글 상세 → 편집 → 삭제 E2E

- **출처** 05#F-03 (UC-04/05/06)
- **테스트 레벨** E2E
- **대상** `/editor` → `/article/:slug` → `/editor/:slug` → `/`.
- **시나리오** (Happy) 발행 → URL 변경 + 본문 노출 → 편집 후 저장 → 삭제 후 Home 복귀. (Failure) 비작성자 `/editor/:slug` 직접 진입 → 403 페이지.

### F-04: Home Global Feed + Tag 필터 E2E

- **출처** 05#F-04 (UC-10)
- **테스트 레벨** E2E
- **대상** `/` 진입.
- **시나리오** (Happy) Popular Tags 클릭 → 탭 추가 + 필터 결과 노출 + 페이지네이션 정상. (Failure) 빈 결과 → "No articles are here..." 메시지.

### F-05: Your Feed (follow 후) E2E

- **출처** 05#F-05 (UC-09 + UC-11)
- **테스트 레벨** E2E
- **대상** `/profile/<author>` follow → `/` Your Feed.
- **시나리오** (Happy) follow한 작가의 글이 Your Feed에 노출. (Failure) follow 0명 → 빈 상태 메시지.

### F-06: 댓글 작성·삭제 E2E

- **출처** 05#F-06 (UC-07)
- **테스트 레벨** E2E
- **대상** 글 상세 댓글 흐름.
- **시나리오** (Happy) 작성 → 목록 갱신, 본인 댓글 삭제 → 사라짐. (Failure) 빈 body submit → 폼 에러, 타인 댓글 삭제 버튼 미노출.

### F-07: 즐겨찾기 토글 E2E

- **출처** 05#F-07 (UC-08)
- **테스트 레벨** E2E
- **대상** Home/Article ♥ 버튼 + Profile favorites 탭.
- **시나리오** (Happy) 토글 add → 카운트 +1 + Profile favorites 탭 노출. (Failure) 비로그인 클릭 → /login 리다이렉트.

## 4. 레벨 매트릭스 (단위·통합·E2E)

> ADR-0023 + ADR-0036 — ❌(미작성) 금지. ✅ 또는 N/A만 허용.

| ID(R-/F-) | 단위 | 통합 | E2E | 비고 |
| --- | --- | --- | --- | --- |
| R-F-01 등록 | ✅ | ✅ | ✅ | 04#R-F-01 |
| R-F-02 로그인 | ✅ | ✅ | ✅ | 04#R-F-02 |
| R-F-03 현재 사용자 | ✅ | ✅ | ✅ | 04#R-F-03 |
| R-F-04 계정 수정 | ✅ | ✅ | ✅ | 04#R-F-04 |
| R-F-05 프로필 조회 | ✅ | ✅ | ✅ | 04#R-F-05 |
| R-F-06 팔로우/언팔로우 | ✅ | ✅ | ✅ | 04#R-F-06 |
| R-F-07 글 목록 | ✅ | ✅ | ✅ | 04#R-F-07 |
| R-F-08 Your Feed | ✅ | ✅ | ✅ | 04#R-F-08 |
| R-F-09 글 단건 조회 | ✅ | ✅ | ✅ | 04#R-F-09 |
| R-F-10 글 생성 | ✅ | ✅ | ✅ | 04#R-F-10 |
| R-F-11 글 수정 | ✅ | ✅ | ✅ | 04#R-F-11 |
| R-F-12 글 삭제 | ✅ | ✅ | ✅ | 04#R-F-12 |
| R-F-13 댓글 | ✅ | ✅ | ✅ | 04#R-F-13 |
| R-F-14 즐겨찾기 | ✅ | ✅ | ✅ | 04#R-F-14 |
| R-F-15 태그 목록 | ✅ | ✅ | ✅ | 04#R-F-15 |
| R-N-01 JWT 인증 | ✅ | ✅ | ✅ | 04#R-N-01 |
| R-N-02 성능 | N/A | ✅ | N/A | 04#R-N-02 — 부하 도구만 |
| R-N-03 보안 | ✅ | ✅ | N/A | 04#R-N-03 — /cso는 별도 |
| R-N-04 3 profile 배포 | N/A | ✅ | ✅ | 04#R-N-04 — CI 매트릭스 + smoke |
| R-N-05 데이터 일관성 | N/A | ✅ | ✅ | 04#R-N-05 |
| F-01 Auth | ✅ | ✅ | ✅ | 05#F-01 |
| F-02 Profile | ✅ | ✅ | ✅ | 05#F-02 |
| F-03 Article CRUD | ✅ | ✅ | ✅ | 05#F-03 |
| F-04 Global Feed | ✅ | ✅ | ✅ | 05#F-04 |
| F-05 Your Feed | ✅ | ✅ | ✅ | 05#F-05 |
| F-06 댓글 | ✅ | ✅ | ✅ | 05#F-06 |
| F-07 즐겨찾기 | ✅ | ✅ | ✅ | 05#F-07 |
| F-08 태그 | ✅ | ✅ | ✅ | 05#F-08 |
| F-09 NFR 묶음 | ✅ | ✅ | ✅ | 05#F-09 |
