# Spike S1: Shared UI on web

**Question:** Can `@repo/ui`, consumed from source, render a React Native Reusables component styled by NativeWind, a phosphor icon, and a Reanimated 4 transition inside Next.js 16 with Turbopack?

**Answer: yes.** No Babel plugin needed anywhere (Turbopack, SWC only).

## Evidence
- `npm run build` passes (Turbopack). `npx turbo run lint --filter=web` passes. `npx tsc --noEmit -p apps/native` passes.
- `curl /spike` HTML contains `data-testid="spike-card"`, `bg-accent` classes, the phosphor `bus-fill` svg, and the generated CSS contains the Tailwind utilities.
- Headless Chromium (Playwright) on `/spike`: computed style before click `rgb(21,101,192)` / `80px`, 100 ms after click `rgb(43,133,218)` / `119.7px` (mid-transition), 900 ms after `rgb(66,165,245)` / `160px`. `transition: background-color 0.4s, height 0.4s`. Animation runs on every toggle, not only the first render.

## Versions
nativewind 4.2.7, react-native-css-interop 0.2.7, react-native-reanimated 4.2.1, react-native-worklets 0.7.4, react-native-web 0.21.3, phosphor-react-native 3.0.6, react-native-svg 15.15.3, tailwindcss 3.4.19 (NativeWind 4 needs Tailwind 3, not 4), react-native 0.83.10, react 19.2.0 (single copy). Reanimated 4.2.1, worklets 0.7.4 and svg 15.15.3 are pinned exactly (no caret) in `apps/web/package.json` to match Expo SDK 55 (same as S2 `expo install`; `react-native-gesture-handler` ~2.30.0 is not used by this spike and was not added). They are the `bundledNativeModules.json` values (npm latest is 4.7.1 and wants RN 0.86+).

## Config changes and why
- `packages/ui/package.json`: `main`/`types` -> `src/index.tsx`, removed tsup build/dev scripts and `tsup.config.ts` (no dist). New deps: class-variance-authority, clsx, tailwind-merge, @rn-primitives/slot.
- `apps/web/package.json`: added nativewind, reanimated, worklets, svg, phosphor, tailwindcss@3, postcss, autoprefixer, and `react-native@0.83.10`. The last is required: reanimated's peer `react-native@*` otherwise makes npm resolve RN 0.87 with react ^19.2.3 (ERESOLVE, would split React).
- `apps/web/next.config.js`:
  - `transpilePackages`: @repo/ui, nativewind, react-native-css-interop, reanimated, worklets, svg, phosphor, @rn-primitives/slot.
  - `compiler.define.__DEV__`: SSR crashed with `ReferenceError: __DEV__ is not defined` otherwise.
  - Alias `react-native-safe-area-context` to `stubs/empty.js` in both Turbopack and webpack blocks. css-interop `try { require("react-native-safe-area-context") }`, and Turbopack still bundles it, hitting `react-native/Libraries/...` Flow source: `Expected ',', got '{'` on `import type {HostComponent}`. The stub makes the try/catch no-op.
- `apps/web/tsconfig.json`: `jsxImportSource: "nativewind"` (SWC reads it, no Babel) and `nativewind-env.d.ts` for `className` types.
- `apps/web/tailwind.config.js` (nativewind preset, content includes `../../packages/ui/src`, colors accent/live/foreground), `postcss.config.js`, `app/spike/spike.css` (directives). Tailwind CSS is imported only in the spike page so preflight does not touch the rest of the app.
- `packages/ui/src/index.tsx` has `/// <reference types="nativewind/types" />` so the native `tsc` in CI sees `className`.
- Existing `Button` API changed (Reusables style: `onPress`, children). `apps/web/app/page.tsx` and `apps/native/app/index.tsx` updated to match.

## Gotchas
- Reanimated components are not wrapped by NativeWind automatically: `className` was dropped on `Animated.View`. Fix: `const AnimatedView = Animated.createAnimatedComponent(View); cssInterop(AnimatedView, { className: "style" })`.
- Reanimated CSS transitions (`transitionProperty`, `transitionDuration` in `style`) work on web without any worklets Babel plugin. `useAnimatedStyle` / worklets were not tested.
- Dev-only hydration warning: reanimated's `nativeID` counter (`id="1"` vs `"3"`) differs between server and client. Cosmetic.
- Reusables CLI was not used (app-oriented, interactive). Button copied by hand and adapted: cva + `cn` + `TextClassContext` + `Text`.
- Native (Expo/Metro) was not set up for NativeWind here (needs metro `withNativewind`, babel preset, `global.css`). Spike S4 joins that. Native `Button` now renders without styling until then.
- npm: Windows build and lint each take about 1-2 min. `npm i` timed out at the 2 min tool limit once, the install itself was fine.

## Phase 2+ should copy
`next.config.js` (transpilePackages, `__DEV__` define, safe-area stub in both bundlers), tsconfig `jsxImportSource`, tailwind config and preset, `lib.ts` (`cn`), `text.tsx` (TextClassContext), `button.tsx`, and the `cssInterop(createAnimatedComponent(...))` pattern. Pin Expo SDK versions of reanimated, worklets and svg.
