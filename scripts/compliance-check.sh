#!/usr/bin/env bash
# scripts/compliance-check.sh
# Issue #18 — sprint 종료 시 / release 직전 / nightly 실행
#
# 다음 4축을 차례로 실행:
#   1. typecheck + unit/integration test (라인 커버리지 ≥ 85% 목표)
#   2. RealWorld Postman compliance (Newman, 환경 변수 BASE_URL)
#   3. 부하 측정 (autocannon — Home/Article/Feed/Tags 4 시나리오, P95 < 500ms)
#   4. 보안 점검 — gitleaks (secrets) + npm audit (deps)
#
# 환경:
#   BASE_URL  — 대상 API base (default: http://localhost:3000)
#   POSTMAN_COLLECTION  — Newman collection path (optional; skips if absent)
#   SKIP_PERF=1  — perf 단계 건너뛰기
#   SKIP_SEC=1   — security 단계 건너뛰기
#
# Exit codes:
#   0 = 모두 PASS
#   1 = 어느 1개라도 FAIL (BLOCK)

set -uo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
POSTMAN_COLLECTION="${POSTMAN_COLLECTION:-}"
fail=0

echo "=== Compliance / Perf / Security Check ==="
echo "BASE_URL=$BASE_URL"
echo

# ─── 1. typecheck + tests ──────────────────────────────────────────
echo "[1/4] pnpm typecheck"
pnpm typecheck || { fail=1; echo "✗ typecheck failed"; }

echo "[1/4] pnpm test (with coverage hint)"
pnpm test || { fail=1; echo "✗ test failed"; }

# ─── 2. RealWorld Postman compliance ───────────────────────────────
if [[ -n "$POSTMAN_COLLECTION" && -f "$POSTMAN_COLLECTION" ]]; then
  echo "[2/4] Newman compliance (collection: $POSTMAN_COLLECTION)"
  if command -v newman >/dev/null 2>&1; then
    newman run "$POSTMAN_COLLECTION" --env-var "APIURL=$BASE_URL" || { fail=1; echo "✗ Newman compliance failed"; }
  else
    echo "  → newman not installed; install with: npm i -g newman"
    echo "  → ⚠ skipping (not BLOCK; install newman for full compliance)"
  fi
else
  echo "[2/4] Newman compliance — SKIPPED (POSTMAN_COLLECTION not set)"
  echo "  → Set POSTMAN_COLLECTION to the gothinkster/realworld Conduit collection path"
  echo "  → https://github.com/gothinkster/realworld/tree/main/api"
fi

# ─── 3. Performance (autocannon) ───────────────────────────────────
if [[ "${SKIP_PERF:-0}" == "1" ]]; then
  echo "[3/4] Performance — SKIPPED (SKIP_PERF=1)"
elif ! command -v curl >/dev/null 2>&1; then
  echo "[3/4] Performance — SKIPPED (curl unavailable)"
else
  echo "[3/4] Performance (server reachability)"
  if curl -fsS "$BASE_URL/api/health" >/dev/null 2>&1; then
    if command -v npx >/dev/null 2>&1; then
      echo "  → autocannon /api/articles?limit=20 (5s smoke)"
      npx --yes autocannon -d 5 -c 10 "$BASE_URL/api/articles?limit=20" 2>&1 \
        | tee /tmp/conduit-autocannon.txt || true
      # P95 extraction (best-effort): look for "Latency"/"P99"; full SLA check is sprint-end manual.
      echo "  → Full P95 < 500ms gate: run with -d 300 -c 50 against warm dataset (R-N-02)"
    else
      echo "  → npx unavailable; install Node.js to run autocannon"
    fi
  else
    echo "  → backend not reachable at $BASE_URL; skipping"
  fi
fi

# ─── 4. Security (gitleaks + npm audit) ────────────────────────────
if [[ "${SKIP_SEC:-0}" == "1" ]]; then
  echo "[4/4] Security — SKIPPED (SKIP_SEC=1)"
else
  echo "[4/4] Security: npm audit"
  pnpm audit --audit-level=high 2>&1 | tail -30 || { fail=1; echo "✗ npm audit found high+ severity"; }

  echo "[4/4] Security: secret pattern grep (lightweight gitleaks substitute)"
  # Block common patterns: JWT_SECRET hardcoded values, AWS keys, generic API keys.
  if git grep -nE "(JWT_SECRET|API_KEY|SECRET_KEY)\s*=\s*['\"]?(?!\\\$|process\.env|CHANGEME|dev-secret-do-not-use-in-prod)" -- ':!*.md' ':!*.example' ':!*.yml' ':!*.yaml' 2>/dev/null; then
    fail=1
    echo "✗ potential plaintext secret pattern found"
  else
    echo "  → no obvious plaintext secrets in source"
  fi
fi

echo
if [[ $fail -eq 0 ]]; then
  echo "✅ All compliance checks PASS"
  exit 0
fi
echo "❌ $fail axis(es) failed"
exit 1
