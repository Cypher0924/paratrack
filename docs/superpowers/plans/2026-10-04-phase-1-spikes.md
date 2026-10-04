# Phase 1 Spikes Implementation Plan

> **For agentic workers:** Each spike runs in its own git worktree under `D:/Files/Coding/Github Repo/worktrees/paratrack/`, on its own branch from `origin/main`. Spike code is throwaway: branches get pushed and kept on GitHub, never merged. Only the findings land in `plan.md` on branch `phase-1`. The controller reviews each result in the main session.

**Goal:** Answer four feasibility questions before real building starts, each with a yes/no plus evidence.

**Architecture:** Three parallel spike branches (web UI, native, push). A fourth step joins the web UI spike into the native one for a single Android preview APK that the user tests on their phone.

**Tech Stack:** Next.js 16 (Turbopack), react-native-web, NativeWind 4, React Native Reusables, Reanimated 4 + react-native-worklets, phosphor-react-native, Expo SDK 55, @maplibre/maplibre-react-native, expo-location + expo-task-manager, web-push (VAPID), EAS Build.

**Spec:** `plan.md` (Phase 1 row, Tech stack, Motion, Notifications)

## Global Constraints

- Install native packages in `apps/native` only with `npx expo install <pkg>`, so versions match Expo SDK 55. `npm view` shows newer majors that do not fit SDK 55.
- Spike code is throwaway. No tests are required. Each spike ends with a findings file `docs/spikes/<name>.md`: question, answer (yes/no/partial), evidence, exact versions, gotchas, and what Phase 2+ should copy.
- Never commit secrets. VAPID private key and Supabase keys live only in Vercel env vars or gitignored `.env.local` files.
- Never touch production Supabase (`psbudkdqhgumuecpmmtz`). Spikes do not write to any database.
- Commit messages: sentence-case subject, short body, `Claude-Session: https://claude.ai/code/session_018R2boTZgvdq868jZ7PnZPd`, no co-author line. Use `git commit -F` with a message file.
- Windows: worktrees with `node_modules` hit the 260-character path limit on delete. Remove them with PowerShell `Remove-Item -LiteralPath "\\?\D:\..." -Recurse -Force`.

## Review Focus

1. **Web build passes but renders nothing.** NativeWind classes silently do nothing if the JSX transform is wrong. Evidence must be a rendered screenshot showing the styled colors, not just a passing build.
2. **Animation works only on the first render.** A Reanimated transition must be shown changing state after a tap, on web and on Android.
3. **Background location stops after a few minutes.** Android throttles background work. The log must show pings across at least 5 minutes with the screen off.
4. **Push arrives only while the page is open.** The test notification must arrive with the browser or installed app closed or the phone locked.
5. **The badge never clears.** Opening the app must reset the badge count.

---

### Spike S1: Shared UI on web (branch `spike-web-ui`)

**Question:** Can `@repo/ui`, consumed from source, render a React Native Reusables component styled by NativeWind, a phosphor icon, and a Reanimated 4 transition inside Next.js 16 with Turbopack?

**Steps:**
1. Make `@repo/ui` consumed from source: `package.json` `main`/`types` point at `src/index.tsx`, and Next's `transpilePackages` includes `@repo/ui` plus any React Native packages that need it. Keep `next.config.js` Turbopack and webpack aliases in sync.
2. Set up NativeWind 4 for web in `apps/web`: Tailwind config with the `nativewind/preset`, `jsxImportSource: "nativewind"` in the tsconfig that compiles `@repo/ui` (SWC reads it, so no Babel), and global CSS with the Tailwind directives. Add the Figma colors `accent #1565C0`, `live #42A5F5`, `foreground #0E1A2B` as theme colors.
3. Add one React Native Reusables component (`button`) to `packages/ui` using its CLI (`npx @react-native-reusables/cli@latest add button`), or by copying its documented source if the CLI does not support a monorepo package.
4. Add `react-native-svg` + `phosphor-react-native`, and render one icon (`Bus`) in the button.
5. Add Reanimated 4 + react-native-worklets. Build a `SpikeCard` in `@repo/ui` whose background color and height transition (Reanimated CSS-style `transitionProperty` / `transitionDuration` props) when the button toggles a state.
6. Render `SpikeCard` on a page `apps/web/app/spike/page.tsx` (`"use client"`).
7. Evidence: `npm run build` passes, and `npm run dev -w web` serves `/spike`. The controller screenshots it in the browser before and after the toggle. If Reanimated needs a Babel plugin on web, record the error and try the Reanimated "web without Babel" path. If that fails, record that the fallback (Expo Router web) is needed.

**Done when:** `docs/spikes/web-ui.md` says yes, partial or no, with exact versions, and the branch is pushed.

### Spike S2: Native map and background location (branch `spike-native`)

**Question A:** Does `@maplibre/maplibre-react-native` run on Expo SDK 55 (new architecture) in an EAS build, showing OpenFreeMap tiles?
**Question B:** Does an `expo-location` background task keep recording and reaching the network every ~5 s with the screen off for 5+ minutes?

**Steps:**
1. `npx expo install expo-dev-client @maplibre/maplibre-react-native expo-location expo-task-manager react-native-reanimated react-native-worklets react-native-svg react-native-gesture-handler`. Add the config plugins they document (MapLibre, expo-location with `isAndroidBackgroundLocationEnabled` and `isAndroidForegroundServiceEnabled`, and the background location permission strings).
2. Screen `app/spike-map.tsx`: a MapLibre map centered on Tarlac City (15.4755, 120.5963), zoom 13, style `https://tiles.openfreemap.org/styles/liberty`, with one marker.
3. Screen `app/spike-location.tsx`: Start/Stop buttons for a `TaskManager` background location task (`accuracy: Balanced`, `timeInterval: 5000`, foreground service notification "ParaTrack is sharing your location"). Each update appends `{time, lat, lng}` to a log in AsyncStorage (or `expo-file-system`). It also does one `fetch` to `${EXPO_PUBLIC_SUPABASE_URL}/auth/v1/health` with the publishable key and records the HTTP status. The screen lists the log entries and the largest gap between entries.
4. `app/index.tsx` links to both spike screens.
5. Add an EAS `spike` profile in `eas.json`: `distribution: internal`, Android `buildType: apk`, standalone (no dev client needed for the user). Set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for that profile to the `paratrack-dev` public values from `apps/native/.env.local`. They are public by design, so `eas.json` `env` is fine.
6. Do not start the EAS build yet. The controller starts it after S1 is joined in (S4).

**Done when:** `npx expo-doctor` passes, `npx expo export -p android` bundles without errors, and `docs/spikes/native.md` records the setup and versions. The branch is pushed.

### Spike S3: Web Push to an installed web app (branch `spike-push`)

**Question:** Does a Web Push notification from a Vercel function reach the installed web app on Android Chrome (and later on a borrowed iPhone), with the app closed or the phone locked, and can the service worker set and clear the app icon badge?

**Steps:**
1. `npm i web-push -w web`. Generate VAPID keys locally with `npx web-push generate-vapid-keys --json`. Put them into Vercel env vars for the **Preview** environment only (`NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT=mailto:spike@paratrack.invalid`) with the Vercel CLI (`npx vercel env add ... preview`). The controller can set them through the Vercel MCP if the CLI is not logged in. Also add them to `apps/web/.env.local` for local runs. Never commit them.
2. `apps/web/app/manifest.ts` (name ParaTrack, `display: standalone`, icons from `assets/brand/app-icon.svg` copied to `apps/web/public/icon.svg`, plus a 192 and 512 PNG rendered from it).
3. `apps/web/public/sw.js`: on `push`, show a notification with title and body from the payload, icon `/icon-192.png`, and call `self.navigator.setAppBadge(payload.badge)` when supported. On `notificationclick`, focus or open `/spike/push` and call `clearAppBadge()`.
4. `apps/web/app/spike/push/page.tsx` (`"use client"`): register the SW, a "Turn on alerts" button (permission requested from the tap), and a "Send test in 15 s" button that POSTs the subscription to `/api/spike/push`. Also show whether the page runs installed (`display-mode: standalone`) and clear the badge on load.
5. `apps/web/app/api/spike/push/route.ts` (Node runtime, `maxDuration = 30`): validate the body with a minimal shape check, wait 15 s, then `webpush.sendNotification` with the Figma arrival copy: title "E-jeep 18 is 2 min away", body "Head to Rizal Ave. It arrives at 9:48 AM with 3 seats left.", badge 3.
6. Push the branch. Vercel builds a preview. Record the preview URL in `docs/spikes/push.md`.

**Done when:** the preview deploys, `/spike/push` loads, and `docs/spikes/push.md` lists the device test steps. The device results come from the user.

### Step S4: Join and build (controller, after S1 and S2 pass review)

1. Merge `spike-web-ui` into `spike-native`, add `app/spike-ui.tsx` rendering `SpikeCard` from `@repo/ui` (NativeWind on native needs its Metro and Babel setup, so follow the NativeWind Expo guide), and link it from `app/index.tsx`.
2. `eas build -p android --profile spike --non-interactive` (account `cyph0924s-team`). Share the APK link with the user.

### Step S5: Device checks (user) and findings

The user installs the spike APK and opens the push preview link on their Android phone:
- Map screen shows Tarlac tiles and the marker.
- Location: Start, lock the phone for 5+ minutes, unlock. The log shows no gap much larger than 5 s and 200 health statuses.
- UI screen: the card animates on tap.
- Push: install the web app from Chrome, turn on alerts, tap "Send test in 15 s", close the app or lock the phone. The notification arrives with the ParaTrack icon and the badge shows 3. Opening it clears the badge.
- iPhone push gets checked later on a borrowed iPhone (iOS 16.4+, installed to the Home Screen).

The controller then writes a "Phase 1 results" section into `plan.md` on branch `phase-1`, updating any decision a spike changed, and opens a PR to `main`.
