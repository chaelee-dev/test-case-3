---
doc_type: screen-design
version: v0.1 (Draft)
status: Draft
author: yongtae.cho@bespinglobal.com
date: 2026-05-15
gate: C
related:
  R-ID: [R-F-01, R-F-02, R-F-03, R-F-04, R-F-05, R-F-06, R-F-07, R-F-08, R-F-09, R-F-10, R-F-11, R-F-12, R-F-13, R-F-14, R-F-15]
  F-ID: []
  supersedes: null
---

# Conduit (RealWorld) — Screen Design (LLD — UI)

## 변경 이력

| Version | Date | Author | Change |
|---|---|---|---|
| v0.1 | 2026-05-15 | yongtae.cho@bespinglobal.com | 초안 — RealWorld 9 route → S-01~S-10 화면 인벤토리, Bootstrap 4 conduit 토큰 채용 |

## 1. 화면 인벤토리

| ID | 화면명 | 진입 트리거 | F-ID 매핑 |
| --- | --- | --- | --- |
| S-01 | Home (Global / Your / Tag feed) | `/` 진입, navbar Home 클릭 | F-04, F-05, F-08 |
| S-02 | Sign In | navbar "Sign in" 클릭, 401 인터셉터 리다이렉트 | F-01 |
| S-03 | Sign Up | navbar "Sign up" 클릭, 비회원 favorite/follow 유도 | F-01 |
| S-04 | Settings | navbar "Settings" 클릭 (로그인 필요) | F-01 |
| S-05 | Editor — New | navbar "New Article" 클릭 (로그인 필요) | F-03 |
| S-06 | Editor — Edit | Article 상세에서 "Edit Article" 클릭 (작성자) | F-03 |
| S-07 | Article Detail | Home·Profile feed 카드 클릭, 직접 URL | F-03, F-06, F-07, F-02 |
| S-08 | Profile — My Articles | navbar 사용자명 클릭, Article 작가 클릭 | F-02, F-04 |
| S-09 | Profile — Favorited | Profile에서 "Favorited Articles" 탭 클릭 | F-02, F-07 |
| S-10 | 404 Not Found | 미존재 URL, 404 응답 | F-09 |

## 2. 화면 상세

### S-01: Home

- **목적** 글을 발견하고 큐레이션 — Global Feed, Your Feed(로그인 시), Tag-filtered feed.
- **상태** loading / empty(0건) / loaded / error(500 토스트). 인증 상태에 따라 "Your Feed" 탭 표시 여부.
- **레이아웃** 헤더(banner: Conduit + "A place to share your knowledge") → 2-column: 본문(feed tabs + article preview 목록 + 페이지네이션) + sidebar(Popular Tags).
- **F-ID 매핑** F-04, F-05, F-08.
- **인터랙션** 탭 전환 시 query string `?tab=feed|global|tag&tag=...`. ♥ 토글은 낙관적 업데이트.

### S-02: Sign In

- **목적** email/password 인증 → JWT 발급 → /.
- **상태** idle / submitting / error(422 폼 상단).
- **레이아웃** 가운데 폼: title "Sign in", "Need an account?" 링크, email·password input, [Sign in] 버튼. 422 에러는 빨간 박스 + 필드별 메시지.
- **F-ID 매핑** F-01.

### S-03: Sign Up

- **목적** 회원가입 → 자동 로그인 → /.
- **상태** idle / submitting / error(422).
- **레이아웃** S-02와 유사, username·email·password 3 input + [Sign up] 버튼.
- **F-ID 매핑** F-01.

### S-04: Settings

- **목적** 프로필 이미지 URL·bio·username·email·password 부분 수정.
- **상태** idle / loading(GET /api/user) / submitting / error(422) / success.
- **레이아웃** 가운데 폼: avatar URL, username, bio(textarea), email, new password(빈 칸 = 변경 안 함). 하단에 [Update Settings] + 가로선 + [Click here to logout].
- **F-ID 매핑** F-01.

### S-05: Editor — New

- **목적** 새 글 작성.
- **상태** idle / submitting / error(422).
- **레이아웃** 폼: title, "What's this article about?"(description), body(markdown textarea), tagList(comma/enter 입력, chip 표시 + remove). 하단 [Publish Article].
- **F-ID 매핑** F-03.

### S-06: Editor — Edit

- **목적** 기존 글 편집.
- **상태** loading prefill / submitting / 403/404 안내.
- **레이아웃** S-05 동일, 폼에 기존 값 prefill. URL `/editor/:slug`.
- **F-ID 매핑** F-03.

### S-07: Article Detail

- **목적** 글 본문 + 작가 정보 + 댓글.
- **상태** loading / 200(렌더) / 404. 본인 글: Edit/Delete 노출. 비본인 글: Follow + ♥ 노출.
- **레이아웃** 배너(title, 작가 메타: avatar·이름·날짜, action 버튼), markdown 본문, tag list, 가로선, 댓글 섹션(폼 + comment cards).
- **F-ID 매핑** F-03, F-06, F-07, F-02.

### S-08: Profile — My Articles

- **목적** 사용자 정보 + 그 사용자가 작성한 글 목록.
- **상태** loading / loaded / 404.
- **레이아웃** 배너(avatar·username·bio·Follow 버튼 또는 Edit Profile Settings), 본문에 탭(My Articles | Favorited Articles) + article preview 목록 + 페이지네이션.
- **F-ID 매핑** F-02, F-04.

### S-09: Profile — Favorited

- **목적** 그 사용자가 ♥한 글 목록.
- **상태** S-08과 동일.
- **레이아웃** S-08 동일, 탭만 "Favorited Articles" 활성.
- **F-ID 매핑** F-02, F-07.

### S-10: 404 Not Found

- **목적** 미존재 리소스 안내 + Home 복귀.
- **상태** static.
- **레이아웃** 가운데 "404 — Not Found" + [Back to Home] 버튼.
- **F-ID 매핑** F-09.

## 3. 디자인 시스템 / 토큰

> ADR-0038 — 본 §3의 토큰이 12-scaffolding §8 styling 솔루션(Tailwind)의 정본. Bootstrap 4 conduit theme의 색·서체를 Tailwind config로 매핑한다.

### Color

- **primary** `#5cb85c` (conduit green — banner, primary CTA Button)
- **secondary** `#373a3c` (dark text, navbar)
- **neutral**
  - `#f3f3f3` (page background)
  - `#ffffff` (card background)
  - `#bbb` (muted text, divider)
- **semantic** danger `#b85c5c` (Delete, 422 error box), success `#5cb85c` (favorited), info `#357edd`(link).

### Typography

- **font-family** `'Source Sans Pro', sans-serif` (본문 + UI), `'Titillium Web', sans-serif` (Conduit 로고).
- **scale**
  - `display` 3.5rem (Home banner title "Conduit")
  - `h1` 2.0rem (페이지 제목, Article title)
  - `h2` 1.5rem (섹션 제목, Sign in 폼 제목)
  - `body` 1.0rem (본문)
  - `caption` 0.875rem (작가 메타, 댓글 시간)

### Spacing

- `xs` 4px, `sm` 8px, `md` 16px, `lg` 24px, `xl` 48px.
- container 최대 너비 1140px (Bootstrap 4 `container` 호환).

### Component primitives

- **Button**
  - variants: `primary`(green filled), `outline-primary`, `danger`(red), `outline-secondary`(navbar Sign in).
  - states: default / hover / disabled / loading(spinner inline).
- **Input**
  - variants: `text`, `password`, `textarea`, `tag-input`(chip).
  - states: default / focused / error(빨간 border + helper text) / disabled.
- **Card / ArticlePreview**
  - 영역: meta row(avatar + 이름 + 날짜 + ♥ 버튼+count), title(h1), description(body), "Read more..." link + tag pill 우측 정렬.
  - states: default / hover(약한 shadow) / loading-skeleton.

## 4. 접근성

- **키보드 내비게이션** — 모든 인터랙티브 요소는 Tab 순회 가능. focus ring은 `outline: 2px solid #5cb85c`.
- **명도 대비** — 본문 텍스트와 배경 4.5:1 이상(`#373a3c` on `#ffffff` = 11.5:1 통과).
- **ARIA** — Feed tabs는 `role="tablist"`, 각 탭 `role="tab"` + `aria-selected`. 댓글 폼 textarea는 `aria-label`.
- **이미지** — avatar `<img alt="<username> avatar">`. 빈 alt 금지.
- **라이브 영역** — favorite 토글 카운트 변경 시 `aria-live="polite"`로 스크린 리더 알림.

## 5. Open Questions

- 다크 모드 지원 여부 — 명세 무관, Brief §5 비목표에 미포함. 별 ADR로 결정 가능.
- 모바일 반응형 끝점 — Bootstrap 4 기본(`sm: 576, md: 768, lg: 992, xl: 1200`) 그대로 채용 권고. 별도 결정 필요?
- Editor markdown 미리보기 toggle — 명세는 단순 textarea만 명시. preview는 P2.
