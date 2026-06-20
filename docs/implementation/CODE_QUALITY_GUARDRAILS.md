# HAVEN Code Quality Guardrails

Last updated: 2026-06-20

## Enforced checks

The repository now defines the following quality gates:

- `corepack pnpm run lint`
- `corepack pnpm run typecheck`
- `corepack pnpm run build:family`
- `corepack pnpm test`

Convenience orchestration scripts are also available:

```bash
corepack pnpm run quality:check
corepack pnpm run verify:core
corepack pnpm run verify:browser
corepack pnpm run verify:supabase:local
```

## ESLint guardrails

Configured in `eslint.config.mjs`.

Current enforced rules focus on low-noise, high-signal failures:

- no `alert`
- no `debugger`
- no `eval` / implied `eval`
- no `var`
- prefer `const`
- `eqeqeq`

The lint layer is intentionally lightweight so it can be enforced consistently without generating large volumes of churn.

## Typecheck coverage

TypeScript coverage currently includes:

- shared packages (`tsconfig.packages.json`)
- Expo elder app (`apps/elder/tsconfig.json`)
- Expo grandchild app (`apps/grandchild/tsconfig.json`)

The Next.js family app is validated through its production build, which already runs the framework's TypeScript pass.

## CI failure policy

The production checks workflow fails if any of the following fail:

- reproducible install from lockfile
- scam-rule sync drift
- lint
- typecheck
- family production build
- main automated test suite
- browser E2E workflow

## Known limitation

Browser E2E depends on Playwright system dependencies. The local Arena sandbox may not always provide the same shared libraries as GitHub Actions, so browser E2E is treated as CI-backed coverage rather than a guaranteed local invariant in every sandbox.
