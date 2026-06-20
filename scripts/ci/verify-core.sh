#!/usr/bin/env bash
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$DIR"
if [ "${CI:-}" != "true" ]; then
  export PATH="$DIR/bin:$PATH"
fi
corepack pnpm install --frozen-lockfile
corepack pnpm sync:scam-rules
git diff --exit-code -- ml/heuristics/rules.json
corepack pnpm run quality:check
corepack pnpm test
git diff --exit-code
