#!/usr/bin/env bash
# scripts/check-local-md-sync.sh
# Verifies LOCAL.md ↔ 12-scaffolding/typescript.md §7 부팅 자산 동기 (ADR-0040).
#
# 호출: pnpm exec bash scripts/check-local-md-sync.sh
# CI: .github/workflows/ci.yml local-md-sync job
#
# Exit codes:
#   0 = 동기 OK
#   1 = 누락 발견 (BLOCKER)

set -euo pipefail

LOCAL_MD="LOCAL.md"
SCAFFOLD_MD="docs/planning/12-scaffolding/typescript.md"

[[ ! -f "$LOCAL_MD" ]] && { echo "ERROR: $LOCAL_MD not found"; exit 1; }
[[ ! -f "$SCAFFOLD_MD" ]] && { echo "ERROR: $SCAFFOLD_MD not found"; exit 1; }

fail=0

# 1. 3 profile env templates referenced
for p in dev stg prod; do
  if ! grep -q ".env.${p}.example" "$LOCAL_MD"; then
    echo "[FAIL] $LOCAL_MD missing reference to .env.${p}.example"
    fail=1
  fi
  if ! grep -q ".env.${p}.example" "$SCAFFOLD_MD"; then
    echo "[FAIL] $SCAFFOLD_MD §7 missing reference to .env.${p}.example"
    fail=1
  fi
  if [[ ! -f ".env.${p}.example" ]]; then
    echo "[FAIL] .env.${p}.example file does not exist"
    fail=1
  fi
done

# 2. Boot command references appear in both
if ! grep -q "devkit dev backend\|pnpm.*dev:backend" "$LOCAL_MD"; then
  echo "[FAIL] $LOCAL_MD missing backend dev boot command"
  fail=1
fi
if ! grep -q "pnpm.*start:prod\|node backend/dist/server.js" "$LOCAL_MD"; then
  echo "[FAIL] $LOCAL_MD missing prod boot command"
  fail=1
fi

# 3. migrations / lockfile / docker-compose referenced
for asset in "prisma/migrations" "pnpm-lock.yaml" "docker-compose"; do
  if ! grep -q "$asset" "$LOCAL_MD"; then
    echo "[WARN] $LOCAL_MD does not reference '$asset'"
  fi
done

if [[ $fail -eq 0 ]]; then
  echo "✅ LOCAL.md ↔ 12-scaffolding §7 동기 OK"
  exit 0
fi
echo "❌ $fail mismatch(es) found — fix LOCAL.md and/or $SCAFFOLD_MD §7"
exit 1
