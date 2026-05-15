---
doc_type: coding-conventions
version: v0.1 (Draft)
status: Draft
author: yongtae.cho@bespinglobal.com
date: 2026-05-15
gate: C
related:
  R-ID: [R-N-03]
  F-ID: []
  supersedes: null
---

# Conduit (RealWorld) — Coding Conventions

## 변경 이력

| Version | Date | Author | Change |
|---|---|---|---|
| v0.1 | 2026-05-15 | yongtae.cho@bespinglobal.com | 초안 — TypeScript 단일 언어(06 Stack) 기준 규약. ESLint + Prettier 자동 강제 |

## 1. 명명 규칙

| 항목 | 규칙 | 예 |
| --- | --- | --- |
| 디렉토리 | kebab-case | `article-service`, `auth-middleware` |
| TS 파일 | kebab-case + `.ts` / React 컴포넌트 파일은 PascalCase + `.tsx` | `slug-generator.ts`, `ArticlePreview.tsx` |
| 함수·변수 | camelCase | `createArticle`, `userId` |
| 타입·인터페이스·클래스·React 컴포넌트 | PascalCase | `Article`, `UserService`, `<ArticlePreview/>` |
| 상수 (모듈 전역) | UPPER_SNAKE_CASE | `JWT_EXPIRY_DAYS`, `DEFAULT_LIMIT` |
| Zod schema | `<Entity>Schema` (PascalCase) | `CreateArticleSchema` |
| Prisma model | PascalCase 단수 | `User`, `Article`, `ArticleTag` |
| DB 컬럼 | snake_case (Prisma `@map` 사용) | `created_at`, `password_hash` |
| HTTP route 파일 | 자원명 복수 | `users.routes.ts`, `articles.routes.ts` |
| 테스트 파일 | `<source>.test.ts` / `<source>.spec.ts`(E2E) | `slug-generator.test.ts`, `editor.spec.ts` |
| Git branch | `<type>/<issue>-<slug>` | `feat/12-article-editor`, `fix/27-jwt-expiry` |
| Commit | Conventional Commits | `feat(article): add slug suffix on conflict` |

## 2. 에러 코드 PREFIX/SUFFIX

> 백엔드 `AppError.code` 값. M-ERR이 본 코드로 HTTP status·envelope에 매핑.

| 도메인 | PREFIX | 예 |
| --- | --- | --- |
| 공통 검증 | `VALID_` | `VALID_REQUIRED`, `VALID_FORMAT`, `VALID_TOO_LONG` |
| 인증 | `AUTH_` | `AUTH_TOKEN_MISSING`, `AUTH_TOKEN_EXPIRED`, `AUTH_FORBIDDEN` |
| 사용자/계정 | `USER_` | `USER_EMAIL_TAKEN`, `USER_USERNAME_TAKEN`, `USER_NOT_FOUND` |
| 프로필/팔로우 | `PROFILE_` | `PROFILE_NOT_FOUND`, `PROFILE_SELF_FOLLOW` |
| 글 | `ARTICLE_` | `ARTICLE_NOT_FOUND`, `ARTICLE_SLUG_CONFLICT`, `ARTICLE_FORBIDDEN` |
| 댓글 | `COMMENT_` | `COMMENT_NOT_FOUND`, `COMMENT_FORBIDDEN` |
| 즐겨찾기 | `FAVORITE_` | `FAVORITE_ALREADY` (멱등 처리), `FAVORITE_NOT_FOUND` |
| 태그 | `TAG_` | `TAG_TOO_LONG` |
| 시스템 | `SYS_` | `SYS_DB_ERROR`, `SYS_INTERNAL` |

매핑 규칙: `VALID_*`·`*_TAKEN`·`*_TOO_LONG`·`*_SLUG_CONFLICT`·`*_SELF_FOLLOW` → 422 / `AUTH_TOKEN_*` → 401 / `*_FORBIDDEN` → 403 / `*_NOT_FOUND` → 404 / `SYS_*` → 500.

## 3. 언어 관용구

- **TypeScript strict** — `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`. `any`·`as unknown as` 금지(불가피한 경우 PR 본문에 사유).
- **불변 우선** — `const`, `readonly`, `as const`. mutation은 service 경계 안에서만.
- **널/언디파인드** — Optional은 `T | undefined` 통일 (`null` 미사용, 단 Prisma model 결과는 예외).
- **에러 throwing** — 도메인 에러는 `AppError`(M-ERR) 인스턴스로 throw. 라이브러리 예외는 errorMapper에서 변환.
- **비동기** — `async/await` 전용. Promise 체이닝 지양. 병렬은 `Promise.all`.
- **React** — 함수 컴포넌트 + Hooks 전용. class 컴포넌트 금지. 부수 효과는 `useEffect` 의존 배열 정확히 채우기. 상태 관리는 TanStack Query(server state) + `useState`/`useReducer`(local UI state). 별도 client store 도입 시 ADR.
- **CSS** — Tailwind class 우선. inline style은 동적 계산이 필요한 경우만. `@apply`는 디자인 토큰 매핑(10 §3)에 한정.

## 4. 주석 정책

- **기본은 무주석** — 식별자 이름으로 *무엇*을 설명. 코드 = 정본.
- **주석 허용 케이스**
  - WHY가 비자명한 경우(숨은 제약, 외부 명세 의존, 회피 버그). 짧게 1줄.
  - RealWorld 명세 인용(예: `// RealWorld 명세: token type "Token" — Bearer 아님`).
  - ADR 참조(`// see ADR-0NNN`).
- **금지**
  - 변경 이력·"added for issue #N"·"TODO 나중에" 같은 작업 메모. PR/issue/CHANGELOG 정본.
  - JSDoc 다중 단락 docstring. 1줄 요약은 허용.
- **TODO/FIXME** — issue 번호를 동반(`// TODO(#42): slug 충돌 정책 ADR-0NN 적용 시 제거`). 미동반 TODO는 lint warning.

## 5. Lint·포맷

| 도구 | 룰셋 | 자동 강제 |
| --- | --- | --- |
| ESLint 9 (flat config) | `@typescript-eslint/recommended-type-checked`, `eslint-plugin-react`, `eslint-plugin-react-hooks`, `eslint-plugin-import`, custom (no `any`, no console in prod code) | pre-commit (husky + lint-staged), CI lint job |
| Prettier 3 | 80 col, single quote, trailing comma `all`, semi true | pre-commit + editor format-on-save |
| TypeScript 5 (tsc --noEmit) | `strict: true`, `noUncheckedIndexedAccess: true` | CI typecheck job |
| Stylelint (선택) | `stylelint-config-standard`, Tailwind plugin | pre-commit (CSS 파일이 있을 때만) |
| commitlint | `@commitlint/config-conventional` | commit-msg hook + CI |
| markdownlint | docs 파일 한정, `MD013` line-length 끔 | CI docs job |

## 6. Import 정책

- **순서** — (1) node 내장, (2) 외부 의존, (3) 내부 alias (`@/...`), (4) 상대 (`./..`).
- **그룹 사이 빈 줄 1줄**. ESLint `import/order` rule 적용.
- **순환 import 금지** — `import/no-cycle` rule.
- **default export 지양** — 컴포넌트는 named export 권장(refactor 안정성). 단, page route 컴포넌트는 default export 허용(React Router lazy).
- **path alias** — frontend `@/`, backend `~/` 사용. tsconfig `paths` + Vite/tsx resolve 동기.
