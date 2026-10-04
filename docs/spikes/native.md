# Spike S2: native map and background location

Branch `spike-native`. Throwaway code. Screens: `apps/native/app/spike-map.tsx`, `spike-location.tsx`, linked from `app/index.tsx`.

## Questions and current answers

| Question | Answer |
| --- | --- |
| A. Does `@maplibre/maplibre-react-native` run on Expo SDK 55 (new architecture) with OpenFreeMap tiles? | Pending device check. Installs cleanly, peer deps satisfied (`expo >=54`, `react-native >=0.80`, `react >=19.1`), config plugin applies, JS bundles. Rendering unproven. |
| B. Does an `expo-location` background task keep recording and reaching the network every ~5 s with the screen off for 5+ minutes? | Pending device check. Config and permissions verified by prebuild. |

## What bundling proved

- `npx expo-doctor`: 20/20 checks passed.
- `npx tsc --noEmit -p apps/native`: clean.
- `npx expo export -p android`: bundles (Hermes, 2.9 MB). Output deleted.
- `npx expo prebuild -p android --no-install` (output deleted): manifest has ACCESS_BACKGROUND_LOCATION, ACCESS_FINE/COARSE_LOCATION, FOREGROUND_SERVICE, FOREGROUND_SERVICE_LOCATION, INTERNET. Native build not run (no Android SDK, JDK 25).
- `npm ls react`: single 19.2.0.
- Not proven: native compile, map rendering, task behavior.

## Installed versions

react-native 0.83.10, expo 55.0.31, @maplibre/maplibre-react-native 11.4.1, expo-location 55.1.14, expo-task-manager 55.0.20, expo-dev-client 55.0.40, react-native-reanimated 4.2.1, react-native-worklets 0.7.4, react-native-svg 15.15.3, react-native-gesture-handler 2.30.0, @react-native-async-storage/async-storage 2.2.0 (for the log).

## Config plugins (`apps/native/app.json`)

- `@maplibre/maplibre-react-native`: defaults (OpenGL variant, default location engine). Not needed to override.
- `expo-location`:
  - `isAndroidBackgroundLocationEnabled: true` adds ACCESS_BACKGROUND_LOCATION.
  - `isAndroidForegroundServiceEnabled: true` adds FOREGROUND_SERVICE and FOREGROUND_SERVICE_LOCATION, required for a background task on Android 14+.
  - `isIosBackgroundLocationEnabled: true` adds the iOS `location` background mode.
  - `locationAlwaysAndWhenInUsePermission`, `locationAlwaysPermission`, `locationWhenInUsePermission`: iOS usage strings.

## EAS

`apps/native/eas.json` profile `spike`: internal distribution, Android apk, `env` has the public paratrack-dev `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Standalone build with embedded JS, no dev client needed. No build started. `expo-dev-client` is installed, which only affects `development` profiles.

## Gotchas

- MapLibre v11 API: `Map`, `Camera initialViewState`, `ViewAnnotation` (as the marker). `lngLat`/`center` are `[lng, lat]`, opposite of the plan's "(15.4755, 120.5963)".
- `TaskManager.defineTask` is at module scope in `spike-location.tsx`. It must run when the headless task starts, so Phase 2 must define it in a module loaded at app entry, not only in a screen.
- Android requires foreground permission before background permission. The code requests them in sequence. On Android 11+ the background grant is made in system settings ("Allow all the time").
- The health fetch runs once per task invocation (one per batch of locations), not per location.
- Battery optimization on the phone may throttle the task. If gaps show up, set the app to "Unrestricted" battery use and retest.
- Expo CLI prettier-reformats `app.json` and `eas.json` (arrays expanded).

## Device test steps (Step S5)

- Install the spike APK.
- Map screen shows Tarlac City tiles and the marker.
- Location: tap Start, grant location ("Allow all the time") and notification permissions, lock the phone for 5+ minutes, unlock, tap Refresh. The log shows no gap much larger than 5 s and non-200 health is 0. Note the largest gap shown.
- If the log is empty or gaps are large, retry with battery set to Unrestricted and report both results.

## What Phase 2+ should copy

- The plugin config above and the module-scope `defineTask` pattern, once the device check passes.
