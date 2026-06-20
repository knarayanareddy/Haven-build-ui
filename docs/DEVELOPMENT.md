# HAVEN Development Guide

## Prerequisites

Required for full local backend execution:

- Node.js 20+
- Corepack enabled
- pnpm 9+
- Supabase CLI
- Docker

Optional for app development:

- Expo CLI / EAS CLI
- Xcode for iOS simulator/device builds
- Android Studio for Android emulator/device builds

## Install

```bash
corepack pnpm install --frozen-lockfile
```

## Validate repository

```bash
corepack pnpm run validate:suite
```

## Run tests

```bash
corepack pnpm test
```

## Run quality gate

```bash
corepack pnpm run quality:check
```

## Preview static surfaces

```bash
corepack pnpm run preview:iphone
corepack pnpm run preview:family
```

## Run local Supabase

```bash
corepack pnpm run verify:supabase:local
```

## Elder app typecheck

```bash
corepack pnpm run typecheck:elder
```

## Family app

```bash
corepack pnpm run build:family
```

## Adding a new feature

1. Add or update migration.
2. Add Edge Function if needed.
3. Add contract/types.
4. Add app surface or schema entry.
5. Add tests.
6. Update feature matrix.
7. Run `corepack pnpm test`.

## Definition of done

- Feature is represented in `FEATURE_IMPLEMENTATION_MATRIX.json`.
- Data access is RLS/consent safe.
- Edge Function validates input.
- Sensitive data is not logged.
- English and Dutch copy are present where user-facing.
- Tests pass.
