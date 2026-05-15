---
doc_type: user-scenarios
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

# Conduit (RealWorld) — 사용자 시나리오

## 변경 이력

| Version | Date | Author | Change |
|---|---|---|---|
| v0.1 | 2026-05-15 | yongtae.cho@bespinglobal.com | 초안 — Brief(01)·Feasibility(02) 기반 |

## 1. 페르소나

| 페르소나 | 역할 | 환경 / 컨텍스트 | 주요 목표 |
| --- | --- | --- | --- |
| Alex (새 작가) | Writer | 데스크탑 Chrome, 평일 야간, 글쓰기 입문 1~3개월 | 자기 글을 발행하고 피드백(댓글·즐겨찾기)을 받는다 |
| Riley (정기 독자) | Reader | 모바일 Safari + 데스크탑 Firefox, 출퇴근/점심, 매일 접속 | 관심 작가·태그를 follow하고 Your Feed에서 좋은 글만 본다 |
| Sam (비회원 방문자) | Visitor | 데스크탑 Edge, 검색 유입 1회성 | Global Feed로 둘러보고 좋으면 회원가입한다 |
| Jordan (활성 작가) | Writer + Reader | 데스크탑 Chrome, 주 3회 발행 | 자기 글 관리(편집/삭제), 다른 작가와 상호작용 |

## 2. 사용자 여정 (큰 그림)

**비회원 → 신규 가입 흐름**

```
Sam (Global Feed 도착)
  → 글 미리보기 클릭 → 글 상세 읽기
  → 즐겨찾기 버튼 클릭 → "회원가입 필요" 안내 → /register
  → 등록 성공(자동 로그인) → /
```

**작가 발행 흐름**

```
Alex 로그인 → / (Your Feed 비어 있음, Global Feed 노출)
  → /editor → 제목·요약·본문(markdown)·tagList 입력 → Publish
  → /article/:slug (자기 글 상세, Edit·Delete 노출)
  → /profile/alex ("My Articles"에 노출 확인)
```

**독자 큐레이션 흐름**

```
Riley 로그인 → / → Global Feed 또는 sidebar Popular Tags 클릭
  → 글 상세 → 작가 프로필 클릭 → /profile/<author>
  → Follow 버튼 → / → "Your Feed" 탭 활성 → follow한 작가의 글만 노출
```

**상호작용 흐름**

```
Riley → 글 상세에서 favorite 토글 → 작가 표시 카운터 +1
  → 댓글 작성 → 본인 댓글은 삭제 버튼 노출
  → /profile/riley/favorites 탭에서 즐겨찾은 글 목록 확인
```

## 3. Use Case

### UC-01: 회원가입 및 자동 로그인

- **주체** Sam(비회원)
- **선행** 비로그인 상태, /register 진입
- **흐름** username·email·password 입력 → Sign up 클릭 → 서버 검증 통과 → JWT 발급 → localStorage 저장 → / 리다이렉트, 네비게이션 인증 상태 갱신.
- **예외** 중복 username/email, 비밀번호 정책 위반 → 422 errors envelope을 폼 필드별 메시지로 노출.
- **R-ID** R-F-01

### UC-02: 로그인

- **주체** Alex, Riley, Jordan
- **선행** 회원 계정 존재, /login 진입
- **흐름** email·password 입력 → Sign in → JWT 발급 → localStorage 저장 → / 리다이렉트.
- **예외** 자격 증명 불일치 → 422, 폼 상단 에러 메시지.
- **R-ID** R-F-02

### UC-03: 프로필/계정 수정 (Settings)

- **주체** Alex
- **선행** 로그인, /settings 진입
- **흐름** 이미지 URL·username·bio·email·password 중 일부 수정 → Update Settings → 200 + 갱신된 user 반환 → navbar 표시 갱신.
- **예외** username/email 충돌, 비밀번호 정책 위반 → 422.
- **R-ID** R-F-04

### UC-04: 새 글 작성

- **주체** Alex
- **선행** 로그인, /editor 진입
- **흐름** title·description·body(markdown)·tagList 입력 → Publish → 201 + article(slug 포함) → /article/:slug 리다이렉트.
- **예외** title 누락, body 누락 → 422 폼 검증.
- **R-ID** R-F-10

### UC-05: 기존 글 편집

- **주체** Alex(글 작성자)
- **선행** 자기 글 상세, Edit Article 클릭 → /editor/:slug
- **흐름** 폼에 기존 값 prefill → 수정 → Publish → 200 + 갱신 article.
- **예외** 비작성자 접근 → 403 / 권한 없는 경우 라우터 가드로 차단.
- **R-ID** R-F-11

### UC-06: 글 삭제

- **주체** Alex(글 작성자)
- **선행** 자기 글 상세
- **흐름** Delete Article 클릭 → 확인 → DELETE → 204 → / 리다이렉트.
- **예외** 비작성자 → 403.
- **R-ID** R-F-12

### UC-07: 댓글 작성/조회/삭제

- **주체** Riley, Alex
- **흐름** 글 상세 하단 댓글 폼 → 작성 → 목록 갱신. 본인 댓글은 삭제 아이콘 노출 → 삭제.
- **예외** 비로그인 상태 댓글 폼 미노출(또는 disabled). 타인 댓글 삭제 시도 → 403.
- **R-ID** R-F-13

### UC-08: 글 즐겨찾기 추가/해제

- **주체** Riley
- **흐름** 글 미리보기/상세의 ♥ 카운터 클릭 → POST/DELETE /favorite → 카운터 갱신, /profile/riley/favorites 탭에 반영.
- **예외** 비로그인 → /login 유도.
- **R-ID** R-F-14

### UC-09: 사용자 팔로우/언팔로우

- **주체** Riley
- **흐름** 작가 프로필 또는 글 상세의 Follow 버튼 클릭 → POST/DELETE /follow → 버튼 상태 토글 → / 의 Your Feed가 follow된 작가의 글로 갱신.
- **예외** 비로그인 → /login 유도. 자기 자신 follow 시도 → 버튼 미노출.
- **R-ID** R-F-06

### UC-10: 태그·작가별 글 탐색

- **주체** Sam, Riley
- **흐름** / 의 sidebar Popular Tags 클릭 → tag-filtered feed 탭 활성 → GET /articles?tag=… 결과 노출. 작가 프로필의 My Articles 탭은 GET /articles?author=…
- **R-ID** R-F-07, R-F-15

### UC-11: 개인 피드(Your Feed)

- **주체** Riley
- **선행** 로그인, follow한 작가 ≥ 1명
- **흐름** / → "Your Feed" 탭 → GET /articles/feed → follow된 작가의 최신 글 노출.
- **예외** follow 0명 → 빈 상태 메시지("Follow more users…") 노출.
- **R-ID** R-F-08

### UC-12: 글 상세 조회 (비회원 포함)

- **주체** Sam, Riley
- **흐름** /article/:slug → GET /articles/:slug → 글·작가 정보·댓글 표시. 비회원은 favorite/follow 버튼 클릭 시 /login 유도.
- **R-ID** R-F-09

## 4. 비기능 시나리오

- **성능** — 핵심 페이지(Home, Article) 응답 P95 < 500ms (warm cache 기준). 본격 측정은 게이트 C 이후.
- **신뢰성** — JWT 만료 토큰으로 보호 라우트 접근 시 401 → 자동 /login 리다이렉트 + 토큰 제거.
- **보안** — 비밀번호는 bcrypt 해시 저장, 평문 로그 금지. 입력 검증은 Zod 등으로 서버에서 강제(클라이언트 의존 금지).
- **호환성** — 최신 Chrome/Firefox/Safari 2개 메이저 버전 지원. IE 미지원.
- **장애 처리** — 네트워크 단절 시 토스트/배너로 사용자 알림, 작성 중 글의 폼 상태는 유지(로컬 보존은 P2).

## 5. Open Questions

- 비회원이 favorite/follow 클릭 시 행동 — 모달 vs /login 라우팅 vs 인라인 메시지?
- 댓글 페이지네이션 필요 여부 (현재 명세는 단순 전체 반환).
- 작가 본인이 자기 글 ♥ 가능 여부 (명세에 명시 없음).
