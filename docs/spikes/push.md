# Spike S3: Web Push to an installed web app

Status: pending device check

## Question
Does a Web Push notification from a Vercel function reach the installed web app on Android Chrome (later a borrowed iPhone) with the app closed or the phone locked, and can the service worker set and clear the app icon badge?

## Preview
- Alias: https://paratrack-git-spike-push-cyphs-projects-d241576c.vercel.app/spike/push
- Deployment: https://paratrack-f9oueqp6v-cyphs-projects-d241576c.vercel.app (READY, hnd1, commit f3d6ccd)
- Preview URLs sit behind Vercel login. The controller will make a shareable link.
- The preview needs `VAPID_PRIVATE_KEY` as a Preview env var for branch `spike-push`. Without it a redeploy is needed before sending works. `/spike/push` loads regardless.

## Versions
next 16.3.8, react 19.2.0, web-push 3.6.7, @types/web-push ^3.6.4, sharp (Next optional dep) for icons.

## How it works
- `apps/web/app/manifest.ts`: name ParaTrack, `display: standalone`, start_url `/spike/push`, icons `/icon-192.png`, `/icon-512.png` (rendered from `assets/brand/app-icon.svg` with sharp), `/icon.svg`.
- `apps/web/public/sw.js`: `push` shows the notification (icon-192) and calls `self.navigator.setAppBadge(payload.badge)` when supported. `notificationclick` closes it, calls `clearAppBadge()`, focuses an open window or opens `/spike/push`.
- `apps/web/app/spike/push/page.tsx`: registers `/sw.js`, shows standalone state, clears the badge on load, "Turn on alerts" asks permission from the tap and subscribes with `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, "Send test in 15 s" POSTs the subscription JSON.
- `apps/web/app/api/spike/push/route.ts`: Node runtime, `maxDuration = 30`. Shape check (https endpoint, keys.p256dh, keys.auth) returns 400 immediately on a bad body. Otherwise waits 15 s, then `webpush.sendNotification` with title "E-jeep 18 is 2 min away", body "Head to Rizal Ave. It arrives at 9:48 AM with 3 seats left.", badge 3.
- Env: `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT=mailto:spike@paratrack.invalid`. Local copy in gitignored `apps/web/.env.local`.

## Local checks
`npm run build` and `turbo run lint --filter=web` pass. Dev server: `/spike/push` 200, `/manifest.webmanifest` valid JSON with icons, malformed POST returns 400 in about 0.2 s.

## Gotchas
- `web-push` has no bundled types, `@types/web-push` is required or `next build` fails type check.
- The React lint rule `react-hooks/set-state-in-effect` rejects synchronous setState in effects, so the page defers with `queueMicrotask`.
- A 15 s wait inside the function needs `maxDuration` above 15.
- The badge only shows if the installed app has notification permission. iOS needs iOS 16.4+ and install to the Home Screen.
- Subscriptions are not stored. Each test uses the live subscription from the page.

## Device test steps (Step S5)
Open the push preview link on the Android phone:
1. Install the web app from Chrome (Add to Home screen / Install).
2. Open the installed app, tap "Turn on alerts", allow notifications.
3. Tap "Send test in 15 s", then close the app or lock the phone.
4. The notification arrives with the ParaTrack icon and the badge shows 3.
5. Open it. The badge clears.
6. Later: repeat on a borrowed iPhone (iOS 16.4+, installed to the Home Screen).

## Device findings
- Push arrived with the app closed. Copy and icon were correct.
- It was attributed to Chrome (Chrome label, UNSUBSCRIBE action) instead of the installed ParaTrack WebAPK. Cause: manifest had no scope, so scope defaulted to /spike/ while the service worker scope is /.
- Fix: manifest scope set to / (start_url unchanged).
- After the scope fix, notifications show under ParaTrack with the app icon and no Unsubscribe action.
- The status-bar icon was a generic bell until a monochrome `badge` image was added (`/badge-96.png`, from `assets/brand/notification-icon.svg`). Retest of the status-bar icon pending.

## Answer
Pending device results.
