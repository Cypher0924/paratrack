# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 1. Positive Patterns and Negative Patterns

Replicate the #### Positive Patterns as behavioral references. Avoid the #### Negative Patterns.

#### Positive Patterns

- I always see the last thing you write first. Place the most important information there.
- Use plain, specific language.
- State each fact once.
- Challenge incorrect assumptions directly and explain why.
- Optimize for clarity and engineering value, not quotability.
- Use the simplest domain terminology that compresses information.
- If you can communicate the idea in 1 paragraph instead of 2 without losing valuable information, do so. Same idea for 1 sentence vs 2 sentences.
- Don't use overloaded terms that could mean more than one thing. Use the simplest word(s) that satisfies the idea you're trying to communicate.
- Be concise with how you present anything to ME. Sacrifice Grammar for the sake of Concision.

#### Negative Patterns

- Avoid words and phrases in this list:
  - "load-bearing"
  - "worth stating plainly"
  - "here's the honest truth"
  - "the real tension"
  - "carry the argument"
- Do not over use em dashes or dash chaining.
- Do not flatter, praise, validate, or agree without reason.
- Do not use motivational language.
- Avoid semicolons, fragments, and non-standard punctuation.
- Do not repeat yourself. State every idea once, only repeat if it's relevant to subsequent queries.

## 2. Hard Operational Boundaries

- Deliver only what was requested at the intended scope.
- Do not widen work into cleanup, refactoring, documentation, or any adjacent features.
- Do not speculate on abstractions for future requirements.
- Do not claim completion without evidence.
- Never add a co-author to a commit message.
- For completed work, concisely restate it but do not overload with response detail.

## 3. Repository

Turborepo monorepo (from the `with-react-native-web` example) using npm workspaces. Node >=18, npm ^11.6.0, turbo 2.x.

@AGENTS.md

### Commands

Run from the repo root:

- `npm run dev`: all `dev` tasks (web Next.js server, native Expo web, `@repo/ui` tsup watch)
- `npm run build`: builds `@repo/ui` first (`dependsOn: ["^build"]`), then `web`
- `npm run format`: Prettier over the whole repo
- `npx turbo run dev --filter=web` (or `native`, `@repo/ui`): one workspace
- `npm run android -w native` / `npm run ios -w native`: native builds via Expo

- `npm test`: Vitest (unit, integration, repo config). Integration tests hit `paratrack-dev` using `apps/web/.env.local` and the root `.env`.
- `npx playwright test -c apps/web`: e2e on iPhone 13 and Pixel 7 emulation. CI runs it. Locally it needs `npx playwright install`.
- CI (`.github/workflows/ci.yml`) runs build, lint, native typecheck, Vitest and Playwright against a throwaway Supabase on the runner.
- Supabase CLI is linked to `paratrack-dev`. Auth settings live in `supabase/config.toml` and reach the project with `npx supabase config push`. The root `.env` only holds values that `config.toml` reads through `env()`.

Lint exists only in `web` (`npx turbo run lint --filter=web`), using the ESLint CLI with flat config `apps/web/eslint.config.mjs`. Next 16 removed `next lint`.

### Architecture

- `packages/ui` (`@repo/ui`): shared components written against `react-native` primitives. Built with tsup to `dist/` (CJS + ESM + types, `'use client'` banner). Consumers import `dist/`, not `src/`, so it must be built (or running `tsup --watch`) before `web` sees changes.
- `apps/web`: Next.js 16 App Router. `next.config.js` aliases `react-native` to `react-native-web` and prefers `.web.*` extensions, for both Turbopack and webpack. Keep both blocks in sync. Pages that render `@repo/ui` need `"use client"`. Web-only Arc UI components (uiarc.dev, shadcn registry) are copied into `components/arc/` via `apps/web/components.json`. Add more with `npx shadcn@latest add @uiarc/<name>` from `apps/web`. Tokens load from `components/arc/foundation.css` in `app/layout.tsx`. `@/*` maps to the `apps/web` root.
- `apps/native`: Expo SDK 55 with expo-router (routes in `app/`, entry `index.js`). Metro uses Expo's default config, which auto-detects the monorepo. `react-native` version must match what the Expo SDK expects.
- `packages/core` (`@repo/core`): pure TypeScript shared by web, native and API routes: fares, ETAs, alert rules, notification copy, PH phone parsing, zod schemas and the generated `Database` types. No React Native imports. Regenerate types with `npm run db:types` after a migration.
- `supabase/`: `migrations/` (schema, RLS, driver functions, cron) and `seed.sql` (Tarlac City routes, stops, vehicles). Clients select explicit `vehicles` columns, because `operator_id` is withheld by column grants.
- `packages/typescript-config`: shared tsconfigs (`base`, `nextjs`, `react-native-library`). `native` extends `expo/tsconfig.base` instead.
- React is pinned to 19.2.0 across all workspaces. Keep versions identical to avoid duplicate React copies.
