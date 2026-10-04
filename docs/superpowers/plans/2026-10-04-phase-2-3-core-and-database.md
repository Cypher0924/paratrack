# Phase 2 + 3: Core Logic and Database Implementation Plan

> **For agentic workers:** Three tasks run in parallel, each in its own worktree under `D:/Files/Coding/Github Repo/worktrees/paratrack/`, on its own branch from `phase-1`. The controller reviews each in the main session and merges them into branch `phase-2-3`. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Pure TypeScript logic for fares, ETAs, alerts and copy (`@repo/core`), plus the Supabase schema, security rules, server functions and Tarlac City seed that every screen builds on.

**Architecture:** `packages/core` holds dependency-light functions shared by the web app, the native app and the API routes. Postgres holds the data and enforces who can change what (RLS plus `security definer` functions). Both sides use the contracts below, so the client-side ETA matches the server-side alert checks.

**Tech Stack:** TypeScript, Vitest, zod, Supabase Postgres 17 + PostGIS + pg_cron, Supabase CLI migrations.

**Spec:** `plan.md` (Database, APIs, How the app works, Notifications, Testing, Phase 1 results)

## Global Constraints

- Development and tests use `paratrack-dev` (`tityifunqdrmwpgbcnvw`). Never touch production `paratrack` (`psbudkdqhgumuecpmmtz`).
- No Docker locally. The full database suite runs in GitHub Actions against the local stack `supabase start` brings up. Local integration runs hit `paratrack-dev`.
- The repo is public. No secrets in git. The seed's operator codes are dev-only demo values. Production codes get seeded from a gitignored file in Phase 10.
- Money is computed in integer centavos. Display formats use two decimals.
- Times shown to users use the `Asia/Manila` time zone and the `9:48 AM` format.
- Commit messages: sentence-case subject, short body, `Claude-Session: https://claude.ai/code/session_018R2boTZgvdq868jZ7PnZPd`, no co-author line. Use `git commit -F <file>`.
- Do not add dependencies beyond the ones named in a task.

## Shared contracts

| Concept | Definition |
|---|---|
| Route geometry | One `LineString` per route, drawn as a loop: out and back, start point == end point. `length_m` = its length in meters |
| `offset_m` | Distance in meters from the route start to the stop, along the line, in `0 <= offset_m < length_m`. Stops on the return leg have larger offsets than stops on the outbound leg |
| `progress_m` | The vehicle's distance along the line, same scale as `offset_m` |
| Distance ahead | `ahead(from, to, length) = ((to - from) % length + length) % length` |
| ETA seconds | `ahead(progress_m, offset_m, length_m) / max(speed_mps, 3)` |
| Vehicle types | `jeep`, `ejeep`, `bus`, `shuttle` |
| Fare types | `regular`, `student`, `senior`, `pwd` (the last three get 20% off) |
| Fare params per route | `base_fare` (PHP), `base_km`, `per_km` (PHP per km after `base_km`) |
| Seat status | `full` if `marked_full` or `capacity - seats_taken <= 0`. `filling` if seats left `<= 5`. Otherwise `available` |

---

### Task 2: `@repo/core` (branch `phase-2-core`)

**Files:**
- Create: `packages/core/package.json` (`"name": "@repo/core"`, `"private": true`, `"main": "./src/index.ts"`, `"types": "./src/index.ts"`, dependency `zod`), `packages/core/tsconfig.json` (extends `@repo/typescript-config/base.json`)
- Create: `packages/core/src/{geo,fare,eta,seats,alerts,phone,time,copy,schemas,index}.ts` and a `*.test.ts` beside each logic file
- Modify: `package-lock.json`

**Interfaces (exported from `src/index.ts`):**
```ts
// geo.ts
export const ahead: (from: number, to: number, length: number) => number;
export const haversineM: (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => number;
// fare.ts
export type FareType = "regular" | "student" | "senior" | "pwd";
export type FareParams = { baseFare: number; baseKm: number; perKm: number };
export type FareBreakdown = { baseCentavos: number; extraKm: number; extraCentavos: number; discountCentavos: number; roundingCentavos: number; totalCentavos: number };
export const fare: (params: FareParams, distanceKm: number, fareType: FareType) => FareBreakdown;
export const formatPeso: (centavos: number) => string; // 1700 -> "₱17.00", -423 -> "-₱4.23"
// eta.ts
export const MIN_SPEED_MPS = 3;
export const etaSeconds: (v: { progressM: number; speedMps: number }, stopOffsetM: number, routeLengthM: number) => number;
// seats.ts
export type SeatStatus = "available" | "filling" | "full";
export const seatStatus: (v: { capacity: number; seatsTaken: number; markedFull: boolean }) => { status: SeatStatus; seatsLeft: number };
// alerts.ts
export const shouldSendArrival: (t: { status: "tracking" | "onboard" | "ended"; arrivalAlert: boolean; arrivalSentAt: string | null; alertMinutes: number }, etaSec: number) => boolean;
export const shouldSendPara: (t: { status: "tracking" | "onboard" | "ended"; paraAlert: boolean; paraSentAt: string | null }, progressM: number, prevStopOffsetM: number, alightOffsetM: number, routeLengthM: number) => boolean;
export const becameFull: (before: { status: SeatStatus }, after: { status: SeatStatus }) => boolean;
// phone.ts
export const parsePhMobile: (input: string) => string | null; // E.164 "+639XXXXXXXXX" or null
// time.ts
export const clockTime: (date: Date) => string; // "9:48 AM", Asia/Manila
export const updatedAgo: (updatedAt: Date, now: Date) => string;
// copy.ts
export type NotificationCopy = { title: string; body: string };
export const arrivalCopy: (a: { vehicleLabel: string; minutes: number; stopName: string; arrivesAt: Date; seatsLeft: number }) => NotificationCopy;
export const paraCopy: (a: { stopName: string }) => NotificationCopy;
export const fullCopy: (a: { vehicleLabel: string; routeName: string; nextLabel: string | null; stopName: string; nextMinutes: number | null }) => NotificationCopy;
export const stoppedSharingCopy: (a: { vehicleLabel: string; routeName: string }) => NotificationCopy;
// schemas.ts (zod)
export const pingSchema, seatsSchema, pushSubscriptionSchema;
```

**Required test cases (TDD: write each failing test, then the code):**
- `ahead`: `(100, 300, 1000) = 200`, `(900, 100, 1000) = 200` (wrap), `(500, 500, 1000) = 0`.
- `haversineM`: Tarlac Capitol (15.4869, 120.5917) to SM City Tarlac (15.4755, 120.5963) is between 1300 and 1450 m.
- `fare`:
  - Figma example: params `{15, 4, 2.2}`, 6.8 km, student gives base 1500, extraKm 2.8, extra 616, discount 423, rounding +7, total 1700.
  - Regular 6.8 km gives total 2125 (21.16 rounded to the nearest 0.25).
  - 3 km student: base only, discount 300, total 1200.
  - `senior` and `pwd` equal `student`.
  - Distance 0 or negative: base fare, no extra.
- `formatPeso`: `1700 -> "₱17.00"`, `616 -> "₱6.16"`, `-423 -> "-₱4.23"`.
- `etaSeconds`:
  - Progress 100, stop 700, length 1000, speed 6 gives 100.
  - Stopped vehicle (speed 0) uses 3 m/s: progress 0, stop 300 gives 100.
  - Wrap: progress 900, stop 100, length 1000, speed 10 gives 20.
- `seatStatus`: 20/3 gives available, 17; 20/15 gives filling, 5; 20/20 gives full, 0; 20/5 with `markedFull` gives full, 0 (seatsLeft forced to 0); seatsTaken over capacity gives full, 0.
- `shouldSendArrival`:
  - True when tracking, alerts on, not sent, ETA 120 with 2 min.
  - False when ETA 121, when already sent, when status onboard, or when alerts off.
- `shouldSendPara`:
  - True when onboard, alert on, not sent, and progress is past the previous stop but before the alight stop: prev 400, alight 600, progress 450, length 1000.
  - False at progress 350.
  - Wrap case: prev 950, alight 50, progress 980, length 1000 gives true.
  - False when already sent or when status tracking.
- `becameFull`: available to full true, filling to full true, full to full false, full to available false.
- `parsePhMobile`: `"0917 482 1093"`, `"917-482-1093"`, `"+63 917 482 1093"`, `"639174821093"` all give `"+639174821093"`. `"0817 482 1093"`, `"0917 482 109"`, `"hello"` and `""` give null.
- `clockTime`: `2026-10-04T01:48:00Z` gives `"9:48 AM"`.
- `updatedAgo`: 2 s ago gives `"updated just now"`, 10 s gives `"updated 10 sec ago"`, 125 s gives `"updated 2 min ago"`, 2 h gives `"updated 2 hr ago"`.
- `arrivalCopy`: the Figma showcase example gives title `"E-jeep 18 is 2 min away"` and body `"Head to Rizal Ave. It arrives at 9:48 AM with 3 seats left."`. With 1 seat the body says `"with 1 seat left."`.
- `paraCopy`: `"Your stop is next"` / `"Get ready to say \"Para po\" at SM City."` (Figma 12 banner).
- `fullCopy`: `"E-jeep 18 is full"` / `"Downtown-SM. The next E-jeep with seats reaches Rizal Ave in 9 min."`. With no next vehicle: `"Downtown-SM. No other E-jeep with seats is on the way yet."`. The type word comes from the next vehicle's label prefix (text before the number).
- `stoppedSharingCopy`: `"E-jeep 18 stopped sharing"` / `"The driver went offline. Check other vehicles on Downtown-SM."`.
- `pingSchema`: accepts `{lat:15.47,lng:120.59,speed:null,heading:null,accuracy:12}`, rejects lat 91, lng -181, accuracy -1, speed 70 (m/s), and extra keys (strict).
- `seatsSchema`: accepts `{count:3}`, `{full:true}`, `{count:3,full:false}`. Rejects `{}`, `{count:-1}`, `{count:2.5}`.
- `pushSubscriptionSchema`: web `{kind:"web", endpoint:"https://...", keys:{p256dh,auth}}` ok, `http://` endpoint rejected. Expo `{kind:"expo", token:"ExponentPushToken[abc]"}` ok, other token shapes rejected.

**Steps:** for each module write the tests, run `npx vitest run packages/core` and watch them fail, implement, re-run green. Then `npx tsc --noEmit -p packages/core`, `npm test` (whole suite; the auth tests need the env files copied into the worktree), commit per module or in 2-3 logical commits, and `git push -u origin phase-2-core`.

---

### Task 3A: Schema, RLS, server functions (branch `phase-3-schema`)

**Files:**
- Create: one migration via `npx supabase migration new init_schema` (`supabase/migrations/<ts>_init_schema.sql`)
- Create: `apps/web/tests/integration/db/{fixtures,rls,driver,cron}.test.ts` (or similar split)
- Modify: `.github/workflows/ci.yml` only if the stack needs a different `-x` exclude list (pg_cron and PostGIS ship in the local image)

**Schema (exact):**
- Extensions: `postgis` (schema `extensions`), `pg_cron`.
- Enums: `vehicle_type`, `fare_type`, `trip_status` (`tracking`,`onboard`,`ended`), `notification_kind` (`arrival`,`service`).
- `profiles(id uuid pk references auth.users on delete cascade, display_name text, fare_type default 'regular', arrival_alerts bool default true, service_updates bool default true, alert_minutes smallint default 2 check 1..15, created_at)`. A trigger on `auth.users` insert creates the row, including for anonymous users.
- `operators(id uuid pk default gen_random_uuid(), name text, code text unique not null)`.
- `routes(id uuid pk, name text unique, vehicle_type, color text, geom geometry(LineString,4326) not null, length_m double precision not null, headway_min smallint, base_fare numeric(6,2), base_km numeric(5,2), per_km numeric(5,2), active bool default true)`. A trigger sets `length_m = ST_Length(geom::geography)` on insert/update.
- `stops(id uuid pk, name text, geom geometry(Point,4326))` with a GiST index.
- `route_stops(route_id, stop_id, seq smallint, offset_m double precision, primary key(route_id, seq), unique(route_id, stop_id))`. `offset_m` is supplied by the seed, which knows the leg. Check `0 <= offset_m`.
- `vehicles(id uuid pk, operator_id references operators, route_id references routes, label text, plate text unique, capacity smallint check > 0)`.
- `drivers(user_id uuid pk references auth.users, operator_id, vehicle_id unique references vehicles, verified_at timestamptz)`.
- `driver_verify_attempts(id bigint identity pk, user_id, created_at default now())`.
- `vehicle_live(vehicle_id pk references vehicles, driver_id references auth.users, online bool default false, lat, lng double precision, heading real, accuracy real, progress_m double precision default 0, speed_mps real default 0, seats_taken smallint default 0, marked_full bool default false, updated_at timestamptz default now())`.
- `trips(id uuid pk default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users on delete cascade, vehicle_id, board_stop_id, alight_stop_id, status trip_status default 'tracking', arrival_alert bool default true, para_alert bool default true, arrival_sent_at, para_sent_at, full_sent_at timestamptz, created_at)`. A trigger rejects stops that are not on the vehicle's route.
- `notifications(id bigint identity pk, user_id not null, kind notification_kind, title text, body text, data jsonb default '{}', read_at timestamptz, created_at default now())`, index `(user_id, created_at desc)`.
- `announcements(id bigint identity pk, route_id nullable references routes, title, body, created_at)`.
- `saved_places(id uuid pk, user_id default auth.uid(), label text, stop_id)`, `saved_routes(user_id default auth.uid(), route_id, primary key(user_id, route_id))`.
- `push_subscriptions(id uuid pk, user_id default auth.uid(), kind text check in ('web','expo'), token text not null, keys jsonb, created_at, unique(user_id, token))`.
- Realtime publication `supabase_realtime` includes `vehicle_live` and `notifications`.

**RLS (enable on every table; write the policies exactly to this matrix):**

| Table | anon | authenticated (owner) | authenticated (other rows) |
|---|---|---|---|
| routes, stops, route_stops, announcements | select | select | select |
| vehicles | select (`id, route_id, label, plate, capacity` only, via column grants) | same | same |
| vehicle_live | select where `online` | select where `online` | no writes |
| profiles | none | select, update own | none |
| trips, saved_places, saved_routes, push_subscriptions | none | full CRUD on own | none |
| notifications | none | select own, update `read_at` only | none |
| drivers | none | select own | none |
| operators, driver_verify_attempts | none | none | none |

**Server functions** (`security definer`, `set search_path = ''`, fully qualified names, `revoke execute ... from public, anon`, `grant execute ... to authenticated`). Errors use `raise exception '<code>'` with these exact codes:
- `verify_driver(p_operator_code text, p_plate text) returns jsonb`. Rejects anonymous users (`auth.jwt()->>'is_anonymous' = 'true'`) with `phone_required`. Five or more failed attempts in the last hour gives `too_many_attempts`. Plates compare upper-cased with spaces and dashes removed. Wrong code or plate records an attempt and gives `invalid_code_or_plate`. Success upserts `drivers` and returns `{vehicle_id, label, plate, capacity, route_id, route_name}`.
- `start_shift() returns jsonb`. `not_a_driver` if there is no `drivers` row. `vehicle_in_use` if another driver has the vehicle online with `updated_at` in the last 5 minutes. Otherwise upserts `vehicle_live` (online, driver_id, seats_taken 0, marked_full false, updated_at now()) and returns it.
- `driver_ping(p_lat double precision, p_lng double precision, p_speed real, p_heading real, p_accuracy real) returns jsonb`. `not_online` unless the caller is the online driver of a vehicle. `invalid_point` for out-of-range lat/lng.
  - Projects the point onto the route with a forward window. Locate the point on the slice from the current `progress_m` to `progress_m + 2000` m (wrapping past the end). If that slice is more than 200 m from the point, fall back to locating on the whole line. If the whole line is also more than 200 m away, keep `progress_m` and set `on_route false`.
  - Speed: `speed_mps = 0.7 * old + 0.3 * coalesce(p_speed, implied speed from the progress change / seconds since updated_at)`, clamped to 0..40.
  - Updates lat, lng, heading, accuracy and updated_at. Returns `{vehicle_id, route_id, route_length_m, progress_m, speed_mps, on_route}`.
  - Mark it in SQL as `-- ponytail: 2 km forward window, tune if loops cross themselves`.
- `driver_set_seats(p_count int default null, p_full boolean default null) returns jsonb`. `not_online` as above. Clamps the count to `0..capacity`. Returns `{seats_taken, capacity, marked_full, was_full, is_full}`, where full means `marked_full or seats_taken >= capacity`.
- `end_shift() returns jsonb`: sets offline and returns `{vehicle_id, trackers}`.
- `tracking_count(p_vehicle_id uuid) returns int`: counts trips with status `tracking` or `onboard`. Callable by authenticated users.
- pg_cron job `stale-vehicles`, every minute: `online = false` where `updated_at < now() - interval '5 minutes'`.

**Integration tests (Vitest, `apps/web/tests/integration/db/`):**
- Fixtures: create them with the secret-key admin client (`SUPABASE_SECRET_KEY`): one operator with a random code, one 1 km test route near (15.47, 120.59), 3 stops, one vehicle. Delete them in `afterAll`.
- Users: anonymous commuter via `signInAnonymously`, driver A `+639000000003`, driver B `+639000000004` via the test OTP.
- Cover every row of the RLS matrix, including that anon reads only online vehicles and that `vehicles.operator_id` is not selectable.
- Cover every error code above. For the rate limit, insert 5 attempts for driver A with the admin client, then call `verify_driver` with the valid code and expect `too_many_attempts`. Clean the attempts up after.
- Happy path: verify, start, ping (progress increases along the line), seats clamp (count 99 gives capacity) and `is_full`, end, `tracking_count`.
- The trip trigger rejects a stop that is not on the route.
- Cron: assert the job exists in `cron.job`. Running it needs no waiting: call the job's SQL through an admin RPC or check the definition.

**Verification:** `npx supabase db lint` (if available in the CLI), the test files type-check, push the branch and watch CI (`supabase start` applies the migration, then the tests run). Then apply to dev with `npx supabase db push` (dev only, confirm `project-ref` first) and run `npm test` locally against dev.

---

### Task 3B: Tarlac City seed (branch `phase-3-seed`)

**Files:**
- Create: `supabase/seed.sql`
- Create: `supabase/seed/README.md` (data sources and how the coordinates were made)
- Create: `scripts/check-seed.mjs` (Node, no new dependencies), which parses `seed.sql` coordinates and checks the rules below

**Content (fixed UUIDs, every statement `on conflict do nothing`, so it can rerun safely):**
- 3 operators: Tarlac Transport Cooperative `TPC-0412` (e-jeeps and jeeps), Tarlac-Clark Bus Lines `TCB-2001` (bus), Campus Shuttle Services `CSS-1001` (shuttle). These are dev-only demo codes.
- 5 routes on real Tarlac City streets, each a loop LineString in `[lng, lat]` order:
  1. **Downtown-SM**, e-jeep, `{15, 4, 2.2}`, headway 8.
  2. **Capitol-SM**, e-jeep, `{15, 4, 2.2}`, headway 10.
  3. **San Nicolas-Downtown**, traditional jeep, `{13, 4, 1.8}`, headway 12.
  4. **Tarlac-Clark**, bus, `{25, 5, 2.2}`, headway 30. Use only the Tarlac City portion of the line, ending where it leaves the city along MacArthur Hwy.
  5. **Campus Loop**, shuttle, `{10, 0, 0}` (flat fare), headway 15.
- Stops named after the Figma copy where they exist: Rizal Ave, SM City, Capitol, Zamora St, Main Gate, Romulo Blvd, MacArthur Hwy, Metrotown, plus the others the routes need. 3 to 8 stops per route, with `seq` and `offset_m` per route, and return-leg stops after outbound stops.
- 8 vehicles matching the Figma labels and plates where shown: E-jeep 18 `NBC 4821` cap 20 and E-jeep 07 `NAK 2290` cap 20 on Downtown-SM, E-jeep 12 on Capitol-SM, Jeep 03 and Jeep 05 (cap 16) on San Nicolas-Downtown, Bus 2 (cap 45) on Tarlac-Clark, Shuttle 04 and Shuttle 01 (cap 14) on Campus Loop.
- `vehicle_live` rows for all 8, offline.
- One announcement: "Campus Loop paused from 12:00 to 1:00 PM" / "No shuttles during the lunch break. E-jeeps on Romulo Blvd still run." on Campus Loop.
- No `auth.users`, drivers or trips. The simulator (Phase 9) verifies its drivers through `verify_driver`.

**How to get real geometry:** use OpenStreetMap data through the Overpass API (`https://overpass-api.de/api/interpreter`) or Nominatim for named places. Pull the ways of the named roads, stitch them in order, and simplify to roughly 20-80 points per route. Write the sources and the query you used into the seed README. Do not invent coordinates that don't follow streets.

**`check-seed.mjs` must assert:**
- Every coordinate is inside Tarlac City's bounding box (lat 15.40-15.56, lng 120.52-120.68), except the Tarlac-Clark line, which may end at the city edge.
- Each route's first and last point are equal.
- Each stop lies within 60 m of its route line, and its `offset_m` is within 60 m of the stop's projected distance along the line, computed on the correct leg.
- Offsets increase with `seq`.
- Plates are unique, and labels match the list above.

**Verification:** `node scripts/check-seed.mjs` passes. The seed is SQL-checked in CI once Task 3A's migration is merged (the controller does that merge). Commit and `git push -u origin phase-3-seed`.

---

## Integration (controller)

1. Review each branch in the main session. Merge `phase-2-core`, `phase-3-schema` and `phase-3-seed` into `phase-2-3`.
2. CI on `phase-2-3` must pass: `supabase start` applies the migration plus the seed, then all tests run.
3. Apply to dev: `npx supabase db push --include-seed` (dev only).
4. Generate database types into `packages/core/src/database.types.ts` with `npx supabase gen types typescript --linked`.
5. Open a PR to `main`.
