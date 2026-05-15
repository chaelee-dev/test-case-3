---
doc_type: brief
version: v0.1 (Draft)
status: Draft
author: yongtae.cho@bespinglobal.com
date: 2026-05-15
gate: A
related:
  R-ID: []
  F-ID: []
  supersedes: null
---

# Conduit (RealWorld) — Project Brief

## 변경 이력

| Version | Date | Author | Change |
|---|---|---|---|
| v0.1 | 2026-05-15 | yongtae.cho@bespinglobal.com | 초안 — RealWorld 명세(https://realworld-docs.netlify.app/introduction/) 기반 신규 생성 |

## 1. 한 줄 정의

**Conduit** — RealWorld 명세를 준수하는 풀스택 Medium 클론. 회원가입/로그인(JWT), 글(article) CRUD, 태그, 즐겨찾기(favorite), 팔로우(follow), 댓글, 글로벌·개인 피드를 제공하는 블로깅 플랫폼.

## 2. 배경 / 문제 정의

RealWorld 프로젝트(gothinkster)는 "todo 데모를 넘어선 실제 애플리케이션 아키텍처"를 학습·검증하기 위한 표준 명세이며, 150개 이상의 언어/프레임워크 구현이 존재한다. 본 프로젝트는 다음을 동시에 해결한다.

- **toolkit NEW_PROJECT 흐름 reference implementation** — 게이트 A·B·C → WBS → sprint-bootstrap → /implement 사이클을 end-to-end 실제 코드로 검증한다.
- **풀스택 온보딩 자료** — Auth·CRUD·관계 모델·페이지네이션·페이지 라우팅 등 실제 SaaS의 핵심 패턴을 한 저장소에 압축한다.
- **재현 가능한 명세** — 모든 구현이 같은 API/UI 계약을 따르므로, AI 게이트(D-06 1단)와 휴먼 게이트(D-06 2단) 양쪽 모두 외부 reference(Postman collection, 호스팅 데모 API)로 객관적으로 검증 가능하다.

## 3. 핵심 사용자 / 이해관계자

- **작가(Writer)** — 글을 작성·편집·삭제하고 태그를 부여한다.
- **독자(Reader)** — 글을 읽고, 즐겨찾기·댓글·작가 팔로우를 수행한다.
- **비회원 방문자(Visitor)** — 글로벌 피드·글 상세·작가 프로필을 조회하지만 작성 작업은 회원가입을 유도받는다.
- **toolkit 사용자(내부)** — 본 reference implementation을 검토·확장하며 toolkit 결함을 발견하는 내부 이해관계자.

## 4. 목표 (성공 정의)

<!-- KPI는 검증 가능한 외부 기준(RealWorld Postman collection, route coverage) + toolkit 진입점(`./devkit`) 충족 여부 -->

| KPI | 측정 방법 | 목표값 | 달성 시점 |
| --- | --- | --- | --- |
| API spec 준수율 | RealWorld Postman collection (`gothinkster/realworld`) 통과 케이스 / 전체 케이스 | 100% | Sprint 3 종료 |
| Frontend route coverage | 명세 9개 route(/, /login, /register, /settings, /editor, /editor/:slug, /article/:slug, /profile/:username, /profile/:username/favorites) 구현 / 전체 | 100% | Sprint 3 종료 |
| E2E happy-path 통과 | 7개 핵심 페이지의 golden-path E2E 시나리오 통과 / 전체 | 100% | Sprint 3 종료 |
| 3 profile 부팅 검증 | `./devkit dev` dev/stg/prod 각각 ready 신호 + 에러 0건 | PASS | 매 PR (ADR-0037) |

## 5. 비목표 (Out of Scope)

- 모바일 네이티브 앱(iOS/Android) — 웹 SPA만 제공.
- 실시간 알림 / WebSocket / 푸시.
- 다국어(i18n) — 영어 단일.
- SSR/SEO 최적화 — CSR(SPA) 우선.
- 결제·구독·수익화·광고.
- 이미지 업로드 — 명세대로 외부 URL 입력만 허용.
- OAuth/소셜 로그인 — email/password JWT만.
- 관리자(admin) 백오피스 — 명세 외 기능.

## 6. 일정 (대략)

- **Sprint 1 (2주)** — Auth(R-F-01·02·03·04), Profile 조회/팔로우(R-F-05·06), Settings 화면, dev 부팅 자산 정비.
- **Sprint 2 (2주)** — Articles CRUD(R-F-07~12), Tags(R-F-15), Editor 화면, Home/Article 화면.
- **Sprint 3 (2주)** — Comments(R-F-13), Favorites(R-F-14), Feed(글로벌/Your Feed), Profile 즐겨찾기 탭, 통합 E2E.

총 약 6주(3 sprint). 인원: developer 1~2명(toolkit 자동화 의존).

## 7. 리스크 (초기 식별)

- **RISK-01** API 명세 모호 영역 — tag 정규화(소문자/공백 처리), slug 충돌 정책, pagination 기본/최대값 — 명세에 명시 없음 → 게이트 C HLD에서 결정 + ADR 기록.
- **RISK-02** N+1 쿼리 — `Article.favorited`·`Profile.following`은 현재 사용자 기준 boolean 필드라 글 목록 시 사용자×글 row마다 lookup 필요 → 게이트 C에서 join/in-memory cache 결정.
- **RISK-03** JWT 만료/리프레시 — 명세는 단일 토큰만 정의, 만료 정책 명시 없음 → ADR로 만료 시간·로그아웃 동작 확정.
- **RISK-04** Bootstrap 4 conduit theme 그대로 사용 — 디자인 토큰 결정과 충돌 가능(ADR-0038 styling 솔루션 강제) → 게이트 C에서 매핑 정리.

## 8. Open Questions

- 페이지네이션 default limit / max limit (RealWorld는 명시 없음, 데모 API는 limit=20 기본)?
- 슬러그 충돌 시 정책 — suffix(-2, -3) vs 거부 vs 사용자 입력?
- "Your Feed"에 follow 0명일 때 빈 상태 UX — CTA(추천 작가) 노출?
- 글 발행 후 title 수정 시 slug 재생성 + 리다이렉트 vs 고정?
