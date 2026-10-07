---
name: ship-update
description: Ship a finished branch to production. PR, CI, merge, Vercel deploy, then an Android OTA update or a new APK.
disable-model-invocation: true
---

# Ship update

Run from the repo root. Stop and report at the first failure.

1. **PR.** Push the branch, open a PR with `gh pr create`. Commit messages use `git commit -F` with the `Claude-Session:` line and no co-author.
2. **CI.** `gh pr checks <n> --watch --interval 30`. On failure, read `gh run view <id> --log-failed`, fix, push, watch again. If Playwright screenshots changed on purpose, regenerate Linux baselines: delete the PNGs, push, then `gh run download <id> -n playwright-e2e` and commit them.
3. **Merge.** `gh pr merge <n> --merge --delete-branch`, then `git checkout main && git pull`.
4. **Web.** Vercel deploys `main` on its own. Wait for the production deployment to be Ready (Vercel MCP `list_deployments`), then `curl -sI https://paratrack-tau.vercel.app` returns 200.
5. **Android.** Use `npx -y eas-cli@latest` for every EAS command: plain `npx eas` resolves eas-cli 22, and `eas.json` requires 24 or newer. Decide by what changed under `apps/native` and the native deps:
   - **JS only** (screens, `@repo/ui`, `@repo/core`): from `apps/native` run
     `npx -y eas-cli@latest update --branch preview --environment preview --non-interactive --message "<summary>" > <scratchpad>/eas-update.txt 2>&1`, then grep it for the update group id.
   - **Native change** (new native module, `app.json` plugins or permissions, icons, splash, Expo SDK bump): OTA cannot ship it, because the runtime is `appVersion`. Bump `version` in `apps/native/app.json`, commit, then `npx eas build -p android --profile preview --non-interactive`. Upload the APK as `paratrack.apk` to a new GitHub release `v<version>-preview.<n>` so `releases/latest/download/paratrack.apk` keeps working. Old installs need the new APK.
   - `EXPO_PUBLIC_*` values are inlined at bundle time. If an update or build breaks sign-in, check `npx eas env:list --environment preview > <scratchpad>/env.txt` for missing names (never print values).
6. **Report.** PR number, merge commit, Vercel deployment URL, and the update group id or release URL.

Never print secrets. Production database or auth config changes are out of scope for this skill and need the user's OK.
