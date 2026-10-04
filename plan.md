# ParaTrack working prototype plan

## Context

ParaTrack is a live map of PUVs (traditional and modern jeepneys, buses, campus shuttles) in Tarlac City. Commuters, mainly students and employees, see where each vehicle is, its ETA, its seats left, and the LTFRB fare before boarding. Drivers share their location and passenger count from their phone. Source: client concept paper plus 25 Figma app screens and 3 notification showcase screens (file `46EIhMGyMDUB4712Nqp1au`, pages "Screens (redesign)" and "Components (redesign)"). The repo is still the Turborepo starter: an empty Next.js app, an empty Expo app and a stub `@repo/ui`.

Goal: a live prototype on three surfaces. iOS uses the web app installed to the Home Screen (PWA). The same web app also works as a normal website. Android gets an APK built from the Expo app.

Screen work waits for the Figma flow the user is finishing. Phases 0 to 4 do not depend on it.

## Decisions made

| Topic | Decision |
|---|---|
| Web + iOS | Next.js `apps/web` as a PWA |
| Android | Expo `apps/native` built to an APK with EAS Build (cloud, free tier) |
| Shared UI | Screens written once in `@repo/ui` with React Native primitives. Web renders them through react-native-web. Components come from React Native Reusables (shadcn for React Native). Animation uses Reanimated 4 |
| Web-only pages | Arc, shadcn and Motion, for pages that exist only on the web: public landing page, Terms, Privacy. They render HTML, so the shared app screens can't use them |
| Backend | Supabase: Postgres + PostGIS, phone OTP auth, anonymous sign-in, Realtime, RLS |
| Server code | Next.js API routes (Node on Vercel) for anything that sends push |
| SMS codes | Supabase test numbers with fixed codes. Semaphore may replace this later (saved to memory) |
| Discounts | Self-declared fare type. Driver checks the physical ID. Copy "Student ID verified" becomes "Student fare" |
| City | Tarlac City only. Map may expand later (saved to memory). No city hardcoded except the default map center |
| Demo data | `npm run simulate` drives demo vehicles through the real driver API. Real drivers work at the same time |
| Tests | Vitest + Playwright. The full suite runs in GitHub Actions. No Docker on this PC |
| Supabase projects | `paratrack-dev` for development and local test runs. `paratrack` is production only |

Why CI-only: Vitest and Playwright need a running Postgres, Auth and Realtime to test against. GitHub Actions runners have Docker, so CI starts a fresh Supabase (`supabase start`), loads the seed and runs every test. The repo is public, so Actions minutes are free. On this PC, the app and quick test runs use `paratrack-dev`, a second free cloud project.

`.env.local` files, `supabase link` and the `.mcp.json` Supabase server all point at `paratrack-dev`, so nothing during development can write to production. Production gets migrations only through `npx supabase db push` after relinking to it, in Phase 10 and on later releases.

## Tech stack

| Layer | Choice |
|---|---|
| Web | Next.js 16 App Router, react-native-web, PWA via `app/manifest.ts` + hand-written `public/sw.js` |
| Android | Expo SDK 55, expo-router, dev build (no Expo Go, native modules needed) |
| Map | MapLibre on both: `maplibre-gl` (web), `@maplibre/maplibre-react-native` (Android). OpenFreeMap tiles (free, no key). One style JSON recolored with the Figma map tokens |
| Icons / font | `phosphor-react-native` (Figma uses Phosphor names), Inter |
| Components | React Native Reusables copied into `@repo/ui` with its CLI, styled with NativeWind (Tailwind for React Native) using the Figma tokens |
| Animation | Reanimated 4 (ships with Expo SDK 55). Its CSS-style transitions and entering/exiting animations work on Android and web. Moti only if Reanimated's API falls short |
| Brand | `assets/brand/app-icon.svg` and `assets/brand/logo.svg`, exported from Figma (`Brand/App icon`, `Brand/Logo`). Source for the favicon, PWA icons and the Android icon and splash |
| Location | Web: `navigator.geolocation` + Wake Lock. Android: `expo-location` + `expo-task-manager` background task |
| Push | Web: Web Push (VAPID, `web-push`). Android: `expo-notifications` + Expo Push (needs a free Firebase project for FCM) |
| Validation | `zod` at every API boundary |
| Hosting | Vercel Hobby (web + API), Supabase free project, EAS Build free tier |
| CI | GitHub Actions: typecheck, lint, Vitest, Playwright |

Inside the shared screens, React Native Reusables stands in for shadcn and Reanimated for Motion, because the screens also run on Android.

## Repo layout

```
apps/web        route files wrapping shared screens, API routes, manifest, sw.js, Playwright tests, simulate script
apps/native     route files wrapping shared screens, background location task, EAS config, app name/package
packages/ui     shared screens + components. Consumed from source (tsup build removed, Next uses transpilePackages)
packages/core   pure TS, no React Native: fare, ETA, alert rules, seat status, search, phone parsing, zod schemas, DB types
supabase/       migrations, seed.sql (Tarlac City), config.toml (test OTP numbers, anonymous sign-in on)
.github/workflows/ci.yml
```

Platform differences live in `.web.tsx` / `.native.tsx` files inside `packages/ui`. Both bundlers already resolve these extensions. Five files differ: Map, location, push, nav (next/navigation vs expo-router, same URL paths in both apps), session storage (localStorage vs AsyncStorage). Each app's route file is a one-line re-export of the shared screen. `CLAUDE.md` gets updated where it says `@repo/ui` builds to `dist/` and that there are no tests.

## Database

```
profiles          id = auth uid, display_name, fare_type (regular|student|senior|pwd), arrival_alerts, service_updates, alert_minutes default 2
operators         id, name, code (clients can never read it)
routes            id, name, vehicle_type (jeep|ejeep|bus|shuttle), geom LineString (drawn as a loop: out and back), length_m, headway_min, base_fare, base_km, per_km
stops             id, name, geom Point
route_stops       route_id, stop_id, seq, offset_m (distance along the route line)
vehicles          id, operator_id, route_id, label ("E-jeep 18"), plate, capacity
drivers           user_id, operator_id, vehicle_id, verified_at
driver_verify_attempts  user_id, created_at
vehicle_live      vehicle_id PK, driver_id, online, lat, lng, heading, progress_m, speed_mps, seats_taken, marked_full, updated_at   (Realtime on)
trips             id, user_id, vehicle_id, board_stop_id, alight_stop_id, status (tracking|onboard|ended), arrival_alert, para_alert, arrival_sent_at, para_sent_at, full_sent_at
notifications     id, user_id, kind (arrival|service), title, body, data jsonb, read_at, created_at   (Realtime on)
announcements     id, route_id nullable, title, body, created_at   (entered in the Supabase dashboard)
saved_places      id, user_id, label, stop_id
saved_routes      user_id, route_id
push_subscriptions id, user_id, kind (web|expo), token, keys jsonb
```

RLS:
- Everyone (anon included) reads routes, stops, route_stops, vehicles (no operator data) and online `vehicle_live` rows.
- Owner-only read/write: profiles, trips, saved_places, saved_routes, push_subscriptions. Notifications: owner reads and sets `read_at` only.
- No client access: operators, driver_verify_attempts. `vehicle_live` has no client write policy. Writes go only through the RPCs below.

RPCs (`security definer`, check `auth.uid()`):
- `verify_driver(operator_code, plate)`: needs a phone-verified (non-anonymous) user, max 5 attempts per hour, links the driver to the vehicle and the operator's route.
- `start_shift()`: sets the vehicle online. Fails if another driver already has it online.
- `driver_ping(lat, lng, speed, heading, accuracy)`: caller must be the vehicle's online driver. Projects the point onto the route with `ST_LineLocatePoint` to get `progress_m`, smooths speed, updates `vehicle_live`. Points over 200 m off the route update position but not progress.
- `driver_set_seats(count, full)`: clamps 0..capacity, returns whether the vehicle just became full.
- `end_shift()`, `tracking_count(vehicle_id)` (returns a number only, trips stay private).
- pg_cron every minute: vehicles silent for 5 min go offline. Clients show "updated N sec ago" and the stale banner after 60 s.

## APIs

Client to Supabase directly (supabase-js, RLS does the checks): all reads above, Realtime on `vehicle_live` and own `notifications`, own profile/saved places/saved routes/trips writes, and the `verify_driver`, `start_shift`, `tracking_count` RPCs.

Next.js API routes. Each one verifies `Authorization: Bearer <Supabase access token>` with `auth.getClaims()`, validates the body with zod, and calls RPCs with the caller's token so `auth.uid()` applies. The service-role client is used only to write notifications for other users and read their push subscriptions.

| Route | Caller | Does |
|---|---|---|
| `POST /api/driver/ping` | driver app every 5 s | `driver_ping`, then checks that vehicle's trips for arrival and Para alerts, sends push |
| `POST /api/driver/seats` | driver app | `driver_set_seats`, alerts trackers when the vehicle becomes full |
| `POST /api/driver/offline` | driver app | `end_shift`, tells trackers the vehicle stopped sharing |
| `POST` / `DELETE /api/push/subscribe` | both apps | save or remove a web or Expo push target |
| `POST /api/hooks/announcement` | Supabase DB webhook, shared secret | fans an announcement out to notifications + push |
| `POST /api/hooks/sms` (only if needed) | Supabase Send SMS hook, signed | rejects non-test numbers now. Semaphore goes here later |

Push sending lives in `apps/web/lib/push.ts`. Dead targets (410 or DeviceNotRegistered) get deleted.

## How the app works

Commuter
- Welcome, then location permission (02). "Choose my stop instead" opens a stop picker. The commuter's location never leaves the device, which keeps the "Drivers never see it" copy true. Nearby sorting and search run on the client over the small Tarlac stop list.
- Every visitor gets an anonymous Supabase session, so tracking and alerts work as a guest. The phone number links to that session (`updateUser({ phone })` + OTP). Exactly when the number is asked follows the final Figma flow.
- Home (06) lists online vehicles by ETA to the nearest stop on their route, filtered by type. Markers show a seat tag plus ring color: green, yellow (5 or fewer seats left), red (full).
- Search (07) matches stops by name. Results are routes serving both stops in the right order, with the next vehicle that still has seats.
- Route (08), Vehicle (09), Fare breakdown (10), Tracking (11), On board (12) with a stop timeline and the Para alert.
- Alerts inbox (13) with All / Arrivals / Service and mark all read. Account (14) holds fare type, saved places and routes, alert toggles, switch to driver mode, log out.

Driver
- "I drive a route" or Account, then phone OTP, then verify vehicle (05) with operator code + plate. The operator assigns the route.
- Start shift (15), Online (16): +/- passengers, Mark as full with Undo toast (18), auto-full at capacity (19), Go offline confirm with tracker count (17).
- Location: Android uses a background task with a foreground-service notification, so it keeps working with the screen off. Web/iOS drivers must keep the app open. Wake Lock keeps the screen on.

ETA and fare (`packages/core`)
- ETA = distance along the route to the stop (wrapping the loop) / smoothed speed, min 3 m/s.
  `ponytail: no traffic model, add historical segment speeds if ETAs drift`
- Fare = base fare for the first `base_km` + `per_km` after that, minus 20% for student/senior/PWD, rounded to the nearest ₱0.25. Rates are stored per route. Figma check: 6.8 km e-jeep, student = ₱15.00 + ₱6.16 − ₱4.23 + ₱0.07 = ₱17.00. Seeded rates get checked against the current LTFRB matrix before the demo.

Notifications

| Trigger | Who | Channel |
|---|---|---|
| Tracked vehicle ETA to my stop ≤ my alert minutes (default 2) | commuter tracking it, arrival alerts on | push + inbox (Arrivals) |
| On board, vehicle passes the stop before my stop | commuter with Para alert on | push + inbox |
| Tracked vehicle becomes full | trackers not yet on board | push + inbox (Service), names the next vehicle with seats |
| Driver goes offline | trackers | push + inbox + banner (23). Stale vehicles show the banner only |
| Announcement added in the dashboard | users with service updates on | push + inbox (Service) |

How notifications look follows the Figma Showcase screens (26 lock screen, 27 home-screen badge, 28 home-screen banner):
- **Copy.** Arrival title: "{vehicle} is {N} min away". Body: "Head to {stop}. It arrives at {time} with {seats} seats left." The other kinds follow the same pattern (what happened, then what to do). One copy builder in `packages/core` produces every title and body, so push and the in-app inbox match.
- **Icon.** Each notification shows the app icon. Android also needs a white monochrome small icon made from the brand mark.
- **Badge.** The app icon shows the unread alert count. It updates on every push and when alerts are read. The installed web app uses the Badging API (`navigator.setAppBadge` from the service worker). Android uses `expo-notifications` badge counts, which depend on the launcher.

Each alert fires once per trip (`*_sent_at` set with a conditional update). iOS push only works once the app is installed to the Home Screen (iOS 16.4+) and permission is asked from a tap. So Safari users see an "Add to Home Screen" hint when they turn on an alert. Trips end automatically after the vehicle passes the alight stop.

States: loading (21), no vehicles (20), offline (22, from network status + Realtime channel status), stopped sharing (23), phone error (24), wrong code (25). The service worker caches the app shell so the installed app opens offline.

Motion: the app should feel live, not static. Animations show cause and effect:
- Vehicle markers glide between GPS pings instead of jumping.
- Seat counts and ETAs tick to their new value. The capacity bar fills smoothly.
- Sheets slide between heights. List rows animate in and out as vehicles come and go.
- Alerts and banners slide in. Buttons and the driver's +/- buttons respond to presses.
- Every animation has a reduced-motion branch that respects the system setting.

Realtime uses `postgres_changes`. `ponytail: fine at prototype scale, switch to Broadcast if subscribers pass ~100`

## Demo data and simulator

- `supabase/seed.sql`: Tarlac City routes drawn on real streets (Downtown-SM e-jeep, Capitol-SM, a traditional jeep route, Tarlac-Clark bus, Campus Loop shuttle), their stops, operators with codes, 8 vehicles, demo driver and commuter test numbers.
- `npm run simulate` (Node 24 runs the `.ts` file directly). Logs in as the demo drivers with test OTPs, starts shifts, posts pings along each route line every 4 s through `/api/driver/ping`, and changes seat counts at stops. `SIM_BASE_URL` selects local or production. Real drivers use their own vehicles alongside it.
  `ponytail: run only during demos, about 7k API calls/hour against Vercel Hobby's 1M/month`

## Testing

- Unit (Vitest, `packages/core`): fare (Figma example + every fare type + rounding), ETA (loop wrap, stopped vehicle, at stop), alert rules (arrival threshold, Para "passed previous stop", full transition, fire once), seat status colors, search ordering, PH phone parsing (`09…` / `+639…`), "updated N sec ago", notification copy (the Figma arrival example renders exactly as designed).
- Integration (Vitest): full run in CI against the throwaway Supabase. Local runs hit `paratrack-dev`, so each test creates and deletes its own users and rows. Covers the RLS matrix for anon, commuter, driver and another driver on every table. RPC rules: verify rate limit, anonymous user blocked, shift conflict, ping projection, seat clamp. API route handlers called with real `Request` objects, push sender stubbed at the network edge.
- E2E (Playwright on the Next.js web app, runs in CI against the seeded throwaway Supabase, iPhone 13 + Pixel 7 emulation, mocked geolocation):
  1. Guest onboarding to Home with vehicles.
  2. Phone login with a test number, plus the wrong-code and bad-number states.
  3. Search, route, vehicle, fare (student = ₱17.00), track, on board, end trip.
  4. Driver: verify (bad code, then good), start shift, +/-, mark full, undo, go offline confirm.
  5. Two browser contexts: the driver marks full and the commuter sees Full plus an inbox alert within 5 s.
  6. Offline (`context.setOffline`), no vehicles, and stopped-sharing states.
- Regression: CI runs typecheck, lint, Vitest and Playwright on every push and PR. Playwright screenshots (`toHaveScreenshot`) cover all 25 Figma states with a frozen clock, reduced motion turned on, and the map canvas masked. Baselines are made on Linux in CI (font rendering differs on Windows). Every bug fix starts with a failing test that reproduces it.
- Android: shared screens are covered by the web e2e. Native-only code (map, background location, Expo push) gets a manual checklist on each APK. Skipped: Maestro/Detox, add if Android-only bugs repeat.

## Phases

| # | Phase | Needs final Figma flow |
|---|---|---|
| 0 | Setup: create `paratrack-dev` and point `.env.local`, `supabase link` and `.mcp.json` at it, `supabase init`, EAS init + app name/package + `google-services.json`, phone auth with test numbers, CI skeleton (Actions with `supabase start`), Vitest + Playwright config. Already done: memories, `plan.md`, accounts, Firebase Android app | no |
| 1 | Spikes, throwaway code: (a) MapLibre RN on Expo 55 in an EAS dev build. Fallback `react-native-maps` + Google key. (b) `@repo/ui` from source in Next 16 Turbopack with react-native-svg icons, NativeWind, one React Native Reusables component and one Reanimated animation, all rendering on web and Android. Fallback: serve the app's web build from Expo Router and keep Next.js for the API routes and web-only pages. (c) Web Push reaching an installed PWA from Vercel. (d) Android background location posting with the screen off | no |
| 2 | `packages/core` with TDD | no |
| 3 | Migrations, RLS, RPCs, cron, Tarlac seed, integration tests | no |
| 4 | Tokens from Figma variables (colors, radii, spacing, Inter text styles, elevation) into the NativeWind theme. React Native Reusables components restyled to match the Components page, plus the shared animation presets | no |
| 5 | Onboarding + auth (01 to 05, 24, 25) | yes |
| 6 | Commuter screens (06 to 14, 20 to 23) with Realtime | yes |
| 7 | Driver screens (15 to 19) + location sharing | yes |
| 8 | Notifications: push subscribe, dispatch, copy builder, app icon badge count, inbox, announcement webhook | yes |
| 9 | Simulator | no |
| 10 | PWA (manifest, sw.js, iOS install hint), favicon, PWA and Android icons plus splash and the monochrome notification icon from `assets/brand`, web-only pages (landing, Terms, Privacy) with Arc + shadcn + Motion, Vercel deploy, migrations to production `paratrack`, EAS preview APK | no |
| 11 | Hardening: full e2e + visual pass, real-device checks, fix bugs, impeccable audit of the build against Figma | yes |
| 12 | Security review | no |

## Workflow rules

- Before each phase, `superpowers:writing-plans` turns it into task-level steps. `test-driven-development` for core, SQL and API work.
- Screens are built from Figma with the figma-design-to-code guidance + `get_design_context` per frame, reusing the Phase 4 components.
- Any bug: `systematic-debugging`, failing test first, root-cause fix, test stays. Fixed right away, not deferred.
- A phase is done only with test output as evidence (`verification-before-completion`), then `requesting-code-review`.
- Commits per task on a feature branch, no co-author line (CLAUDE.md). Nothing beyond the requested scope.

## Security review (Phase 12)

Run the `/security-review` skill on the branch, then check:
- RLS enabled on every table (Supabase security advisor + the RLS integration tests).
- Service-role key, VAPID private key and webhook secrets only in Vercel server env. Never `NEXT_PUBLIC_` / `EXPO_PUBLIC_`.
- Every API route verifies the JWT and validates input. Drivers can only change their own vehicle (enforced in SQL).
- Operator-code brute force limit. Driver mode needs a phone-verified user. OTP and anonymous sign-in rate limits on.
- Commuter location never sent to the server. Driver location public only while online.
- Webhook secret compared in constant time. Security headers + CSP in `next.config.js` (Supabase + OpenFreeMap origins only).
- `npm audit` with no high/critical issues, no secrets in git, `.env*` ignored.
- APK: EAS-signed, HTTPS only, only location + notification permissions.

## Prerequisites

Free accounts: Supabase, Vercel, Expo (EAS), Firebase (FCM for Android push). An Android phone for the APK. This PC has no Android SDK, and RN 0.83 needs JDK 17 while JDK 25 is installed, so APKs build in EAS cloud.

iOS push and install can only be verified on a real iPhone (iOS 16.4+). You don't have one, so borrow one (client or classmate) for one check in Phase 11.

## Open items (defaults used unless you say otherwise)

- Figma's filter (All / Shuttle / E-jeep / Bus) lacks traditional jeepneys, which the concept paper names. Default: add a "Jeep" tab.
- Screens Figma implies but doesn't draw: edit profile (name), saved places and routes lists, stop picker, driver route/vehicle change, Terms and Privacy pages. Built from existing components in the same style.
- Sheets animate between two heights with Reanimated. Dragging uses `react-native-gesture-handler` if the Phase 1 spike shows it works on web. Otherwise tapping the handle expands the sheet.
- Operators, vehicles, routes and announcements are managed in the Supabase dashboard. No admin UI.
- Android package id `com.paratrack.app` and display name "ParaTrack" replace the starter's `com.turbo.example` / "native".

## Verification

1. GitHub Actions: `supabase start` loads the seed, then Vitest (unit + integration) and Playwright pass.
2. Locally: `npm run test` passes, with integration tests running against `paratrack-dev`.
3. `npm run dev` + `npm run simulate`: vehicles move on the web map, seats change, a tracked vehicle's arrival alert lands in the inbox.
4. Vercel preview on an Android phone and on a borrowed iPhone, installed to the Home Screen: location, live map, push alert, offline launch.
5. EAS preview APK on an Android phone: map, driver shift with the screen off for 5 min (location keeps updating), Expo push received.
6. Phase 12 checklist with no open findings.
