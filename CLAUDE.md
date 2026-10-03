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

There are no tests. `web`'s `lint` script calls `next lint`, which Next 16 removed, so it fails. `apps/web/.eslintrc.json` is also the legacy format that ESLint 9 ignores.

### Architecture

- `packages/ui` (`@repo/ui`): shared components written against `react-native` primitives. Built with tsup to `dist/` (CJS + ESM + types, `'use client'` banner). Consumers import `dist/`, not `src/`, so it must be built (or running `tsup --watch`) before `web` sees changes.
- `apps/web`: Next.js 16 App Router. `next.config.js` aliases `react-native` to `react-native-web` and prefers `.web.*` extensions, for both Turbopack and webpack. Keep both blocks in sync. Pages that render `@repo/ui` need `"use client"`.
- `apps/native`: Expo SDK 55 with expo-router (routes in `app/`, entry `index.js`). Metro uses Expo's default config, which auto-detects the monorepo. `react-native` version must match what the Expo SDK expects.
- `packages/typescript-config`: shared tsconfigs (`base`, `nextjs`, `react-native-library`). `native` extends `expo/tsconfig.base` instead.
- React is pinned to 19.2.0 across all workspaces. Keep versions identical to avoid duplicate React copies.
