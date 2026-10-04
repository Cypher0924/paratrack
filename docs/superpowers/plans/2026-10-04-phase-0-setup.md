# Phase 0 Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Supabase auth config, test runners, CI and EAS linking in place so Phases 1 to 4 can build on them.

**Architecture:** `supabase/config.toml` is the source of truth for auth settings and gets pushed to `paratrack-dev` with `supabase config push`. Vitest runs from the repo root (unit + integration against `paratrack-dev` locally). Playwright lives in `apps/web`. GitHub Actions runs everything against a throwaway Supabase started on the runner.

**Tech Stack:** Supabase CLI (root devDependency), Vitest, Playwright, GitHub Actions, EAS CLI (via npx), Node 24, npm 11.

**Spec:** `plan.md` (Phase 0 row, Decisions, Testing, Security review)

## Global Constraints

- Development and local tests use `paratrack-dev` (`tityifunqdrmwpgbcnvw`). Nothing in this phase writes to production `paratrack` (`psbudkdqhgumuecpmmtz`).
- No Docker on this PC. Integration tests run locally against `paratrack-dev`. The full suite runs in GitHub Actions.
- The repo is public. Secrets never go in git. `supabase/config.toml` references secrets only through `env()`.
- Test phone numbers: `+639000000001` to `+639000000010`. All share one code from `SUPABASE_AUTH_TEST_OTP`.
- Commit messages: sentence-case subject, short body, `Claude-Session: https://claude.ai/code/session_018R2boTZgvdq868jZ7PnZPd`, no co-author line.
- Work on branch `project-setup`. Push it to GitHub after each task and keep it there.

## Review Focus

1. **Test OTP code in the public repo.** If the code were committed, anyone could log in as a demo driver and move vehicles during a demo. Expected: `config.toml` holds only `env(SUPABASE_AUTH_TEST_OTP)`. Pinned by `tests/repo-config.test.ts` (Task 2).
2. **Real SMS to a stranger.** Once Semaphore is wired in, the "non-test number" test would text a real person. Expected: that test uses `+639000000099` (unassigned `0900` prefix). Pinned in `auth.test.ts` (Task 2).
3. **Missing local env.** If `apps/web/.env.local` or the root `.env` is missing, tests must fail with the variable's name, not a vague network error. Pinned by the `requireEnv` guard in `auth.test.ts` (Task 2).
4. **Package id drift.** If `app.json`'s package and `google-services.json` disagree, Android push silently never arrives. Pinned by `tests/repo-config.test.ts` (Task 2).
5. **CI touching real projects.** CI must only use the throwaway local stack, never GitHub secrets or cloud keys. Checked in Task 4 review: the workflow references no `secrets.*`.

---

### Task 1: Supabase project config and auth settings

**Files:**
- Modify: `.gitignore` (add `.env`)
- Modify: `package.json`, `package-lock.json` (add `supabase` devDependency)
- Create: `supabase/config.toml` (via `supabase init`), `supabase/.gitignore`
- Modify: `.mcp.json` (already edited to `paratrack-dev`, uncommitted)
- User creates: `.env` at repo root (gitignored)

**Interfaces:**
- Produces: auth on `paratrack-dev` with anonymous sign-in on, phone sign-up on, test numbers `+639000000001..10` mapped to `SUPABASE_AUTH_TEST_OTP`, OTP resend interval 5 s.

- [ ] **Step 1: Commit the pending `.mcp.json` switch**

```bash
git add .mcp.json
git commit -F- <<'EOF'
Point the Supabase MCP server at paratrack-dev

Development tools only touch the dev project. Production changes go
through migrations.

Claude-Session: https://claude.ai/code/session_018R2boTZgvdq868jZ7PnZPd
EOF
```

- [ ] **Step 2: Ignore root `.env` and pin the Supabase CLI**

Add one line under `# local env files` in `.gitignore`:
```
.env
```
Then:
```bash
npm i -D supabase
git check-ignore -v .env   # expect: .gitignore:<n>:.env
```

- [ ] **Step 3: Create the config**

```bash
npx supabase init
```
Expected: `supabase/config.toml` and `supabase/.gitignore` created. `supabase/.temp` stays ignored.

- [ ] **Step 4: Set project id and auth settings in `supabase/config.toml`**

Set `project_id = "paratrack"`. In `[auth]` set `enable_anonymous_sign_ins = true`. In `[auth.sms]` set:
```toml
enable_signup = true
enable_confirmations = false
max_frequency = "5s"
```
Replace the commented `[auth.sms.test_otp]` block with:
```toml
[auth.sms.test_otp]
639000000001 = "env(SUPABASE_AUTH_TEST_OTP)"
639000000002 = "env(SUPABASE_AUTH_TEST_OTP)"
639000000003 = "env(SUPABASE_AUTH_TEST_OTP)"
639000000004 = "env(SUPABASE_AUTH_TEST_OTP)"
639000000005 = "env(SUPABASE_AUTH_TEST_OTP)"
639000000006 = "env(SUPABASE_AUTH_TEST_OTP)"
639000000007 = "env(SUPABASE_AUTH_TEST_OTP)"
639000000008 = "env(SUPABASE_AUTH_TEST_OTP)"
639000000009 = "env(SUPABASE_AUTH_TEST_OTP)"
639000000010 = "env(SUPABASE_AUTH_TEST_OTP)"
```
Leave every SMS provider disabled. Non-test numbers then fail to get a code, which is the intended prototype behavior.

- [ ] **Step 5: User adds the test code**

The user creates `.env` at the repo root with a 6-digit code they choose:
```
SUPABASE_AUTH_TEST_OTP=<6 digits>
```

- [ ] **Step 6: Preview the change against paratrack-dev**

```bash
cat supabase/.temp/project-ref      # expect: tityifunqdrmwpgbcnvw
npx supabase config diff
```
Expected: only auth changes (anonymous sign-ins, phone, SMS test OTPs, max frequency, site URL). If it lists `[db]`, `[api]` or other sections with values that differ from the dashboard, stop and review those before pushing.

Fallback if the diff or push rejects phone sign-up without a provider: enable `[auth.sms.twilio]` with `enabled = true`, `account_sid = "AC00000000000000000000000000000000"`, `message_service_sid = "MG00000000000000000000000000000000"`, `auth_token = "env(SUPABASE_AUTH_SMS_TWILIO_AUTH_TOKEN)"` and a dummy token in `.env`. Mark it `# ponytail: dummy Twilio so only test numbers log in. Semaphore SMS hook replaces it.`

- [ ] **Step 7: Push to paratrack-dev**

```bash
npx supabase config push --yes
npx supabase config diff   # expect: no differences
```

- [ ] **Step 8: Commit and push the branch**

```bash
git add .gitignore package.json package-lock.json supabase/config.toml supabase/.gitignore
git commit -F- <<'EOF'
Add Supabase config with phone and anonymous auth

Test numbers +639000000001 to 10 log in with a code from the
gitignored root .env, so the code never reaches the public repo.
Providers stay off, so other numbers cannot get a code yet.

Claude-Session: https://claude.ai/code/session_018R2boTZgvdq868jZ7PnZPd
EOF
git push -u origin project-setup
```

---

### Task 2: Vitest with auth integration and repo config tests

**Files:**
- Create: `vitest.config.ts`
- Create: `apps/web/tests/integration/auth.test.ts`
- Create: `tests/repo-config.test.ts`
- Modify: `package.json` (devDependency `vitest`, script `test`), `apps/web/package.json` (dependency `@supabase/supabase-js`), `package-lock.json`

**Interfaces:**
- Consumes: Task 1 auth settings and test numbers.
- Produces: `npm test` runs `packages/*/src/**/*.test.ts`, `apps/web/tests/integration/**/*.test.ts` and `tests/**/*.test.ts`. Env comes from `apps/web/.env*` and root `.env*`.

- [ ] **Step 1: Install**

```bash
npm i -D vitest
npm i @supabase/supabase-js -w web
```
Add to root `package.json` scripts: `"test": "vitest run"`.

- [ ] **Step 2: Write `vitest.config.ts`**

```ts
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

export default defineConfig(({ mode }) => ({
  test: {
    include: [
      "packages/*/src/**/*.test.ts",
      "apps/web/tests/integration/**/*.test.ts",
      "tests/**/*.test.ts",
    ],
    env: { ...loadEnv(mode, "apps/web", ""), ...loadEnv(mode, ".", "SUPABASE_") },
    testTimeout: 20_000,
  },
}));
```

- [ ] **Step 3: Write the failing repo config test**

`tests/repo-config.test.ts`:
```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

describe("repo config", () => {
  it("keeps test OTP codes out of git", () => {
    const block = read("supabase/config.toml").split("[auth.sms.test_otp]")[1]!.split("\n[")[0]!;
    const values = [...block.matchAll(/^\s*\d+\s*=\s*"([^"]*)"/gm)].map((m) => m[1]);
    expect(values).toHaveLength(10);
    for (const v of values) expect(v).toBe("env(SUPABASE_AUTH_TEST_OTP)");
  });

  it("matches the Android package to the Firebase config", () => {
    const app = JSON.parse(read("apps/native/app.json")).expo;
    const gs = JSON.parse(read("apps/native/google-services.json"));
    const packages = gs.client.map((c: any) => c.client_info.android_client_info.package_name);
    expect(packages).toContain(app.android.package);
    expect(app.android.googleServicesFile).toBe("./google-services.json");
  });
});
```

- [ ] **Step 4: Write the auth integration test**

`apps/web/tests/integration/auth.test.ts`:
```ts
import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

const requireEnv = (name: string) => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}. Set it in apps/web/.env.local or the root .env`);
  return value;
};

const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
const key = requireEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
const otp = requireEnv("SUPABASE_AUTH_TEST_OTP");
const client = () =>
  createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

describe("auth", () => {
  it("gives a guest an anonymous session", async () => {
    const { data, error } = await client().auth.signInAnonymously();
    expect(error).toBeNull();
    expect(data.user?.is_anonymous).toBe(true);
  });

  it("logs in a test number with the fixed code", async () => {
    const sb = client();
    const phone = "+639000000001";
    expect((await sb.auth.signInWithOtp({ phone })).error).toBeNull();
    const { data, error } = await sb.auth.verifyOtp({ phone, token: otp, type: "sms" });
    expect(error).toBeNull();
    expect(data.user?.phone).toBe("639000000001");
  });

  it("rejects a wrong code", async () => {
    const sb = client();
    const phone = "+639000000002";
    expect((await sb.auth.signInWithOtp({ phone })).error).toBeNull();
    const wrong = otp === "000000" ? "111111" : "000000";
    const { error } = await sb.auth.verifyOtp({ phone, token: wrong, type: "sms" });
    expect(error).not.toBeNull();
  });

  it("sends no code to numbers outside the test list", async () => {
    // 0900 prefix is unassigned, so this never texts a real person once SMS is enabled.
    const { error } = await client().auth.signInWithOtp({ phone: "+639000000099" });
    expect(error).not.toBeNull();
  });
});
```

- [ ] **Step 5: Run**

```bash
npm test
```
Expected: 6 tests pass. If the anonymous test fails with "Anonymous sign-ins are disabled", Task 1 Step 7 did not apply. If "rejects a wrong code" or "logs in" fails with a rate-limit message, wait 5 s and rerun.

- [ ] **Step 6: Commit and push**

```bash
git add vitest.config.ts tests apps/web/tests package.json apps/web/package.json package-lock.json
git commit -F- <<'EOF'
Add Vitest with auth integration and repo config tests

Auth tests cover guest sessions, test-number login, wrong codes and
non-test numbers against the linked project. Config tests keep the test
OTP out of git and the Android package in sync with Firebase.

Claude-Session: https://claude.ai/code/session_018R2boTZgvdq868jZ7PnZPd
EOF
git push
```

---

### Task 3: Playwright config and smoke test

**Files:**
- Create: `apps/web/playwright.config.ts`, `apps/web/e2e/smoke.spec.ts`
- Modify: `apps/web/package.json` (devDependency `@playwright/test`), `package-lock.json`, `apps/web/.gitignore`

**Interfaces:**
- Produces: `npx playwright test -c apps/web` with projects `iphone` (WebKit, iPhone 13) and `pixel` (Chromium, Pixel 7). Test files live in `apps/web/e2e/*.spec.ts`.

- [ ] **Step 1: Install**

```bash
npm i -D @playwright/test -w web
```
Append to `apps/web/.gitignore`:
```
/test-results/
/playwright-report/
```

- [ ] **Step 2: Write `apps/web/playwright.config.ts`**

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: { baseURL: "http://localhost:3000", trace: "retain-on-failure" },
  projects: [
    { name: "iphone", use: { ...devices["iPhone 13"] } },
    { name: "pixel", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: process.env.CI ? "npm run start" : "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

- [ ] **Step 3: Write the smoke test**

`apps/web/e2e/smoke.spec.ts`:
```ts
import { expect, test } from "@playwright/test";

test("home page loads without console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));
  const response = await page.goto("/");
  expect(response?.ok()).toBe(true);
  await page.waitForLoadState("networkidle");
  expect(errors).toEqual([]);
});
```

- [ ] **Step 4: Verify discovery locally (browsers run in CI only)**

```bash
npx playwright test -c apps/web --list
```
Expected: 2 tests listed (`[iphone]` and `[pixel]`). Then confirm lint and typecheck still pass:
```bash
npx turbo run lint --filter=web
npm run build
```

- [ ] **Step 5: Commit and push**

```bash
git add apps/web/playwright.config.ts apps/web/e2e apps/web/.gitignore apps/web/package.json package-lock.json
git commit -F- <<'EOF'
Add Playwright with iPhone 13 and Pixel 7 smoke test

The smoke test fails on any console error or failed page load. Browsers
run in CI, since this PC runs Playwright only to list tests.

Claude-Session: https://claude.ai/code/session_018R2boTZgvdq868jZ7PnZPd
EOF
git push
```

---

### Task 4: GitHub Actions CI

**Files:**
- Create: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: `npm test` (Task 2), Playwright config (Task 3), `supabase/config.toml` (Task 1).
- Produces: a `ci` workflow on every push and pull request.

- [ ] **Step 1: Write `.github/workflows/ci.yml`**

```yaml
name: ci

on:
  push:
  pull_request:

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 25
    env:
      CI: true
      SUPABASE_AUTH_TEST_OTP: "123456"
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - name: Typecheck native
        run: npx tsc --noEmit -p apps/native
      - name: Lint and build
        run: npx turbo run lint build
      - name: Start Supabase
        run: npx supabase start -x studio,imgproxy,storage-api,edge-runtime,logflare,vector,supavisor,postgres-meta
      - name: Write local env
        run: >
          npx supabase status -o env
          --override-name api.url=NEXT_PUBLIC_SUPABASE_URL
          --override-name auth.publishable_key=NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
          --override-name auth.secret_key=SUPABASE_SECRET_KEY
          > apps/web/.env.local
      - name: Vitest
        run: npm test
      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium webkit
      - name: Playwright
        run: npx playwright test -c apps/web
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: apps/web/playwright-report
          retention-days: 7
```

- [ ] **Step 2: Check for secrets references**

```bash
grep -n "secrets\." .github/workflows/ci.yml || echo "no secrets referenced"
```
Expected: `no secrets referenced`.

- [ ] **Step 3: Commit, push, watch**

```bash
git add .github/workflows/ci.yml
git commit -F- <<'EOF'
Add CI running build, lint, Vitest and Playwright

Each run starts a throwaway Supabase on the runner, so CI never needs
cloud keys or GitHub secrets.

Claude-Session: https://claude.ai/code/session_018R2boTZgvdq868jZ7PnZPd
EOF
git push
gh run watch --exit-status $(gh run list --branch project-setup --workflow ci --limit 1 --json databaseId -q '.[0].databaseId')
```
Expected: green. If `Write local env` produces an empty URL or key, run `npx supabase status -o json` in a debug step, use the printed key names in `--override-name`, push again.

---

### Task 5: EAS project link and APK build profile

**Files:**
- Modify: `apps/native/app.json` (EAS adds `extra.eas.projectId` and `owner`)
- Create: `apps/native/eas.json`

**Interfaces:**
- Produces: EAS project linked to the user's chosen Expo account, `preview` profile that builds an installable APK. Phase 1 adds a `development` profile together with `expo-dev-client`.

- [ ] **Step 1: Link the project** (run in `apps/native`)

```bash
npx -y eas-cli@latest init --non-interactive --force --account cyph0924s-team
```

- [ ] **Step 2: Write `apps/native/eas.json`**

```json
{
  "cli": { "version": ">= 24.0.0", "appVersionSource": "remote" },
  "build": {
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" }
    }
  }
}
```

- [ ] **Step 3: Verify**

```bash
npx expo config --json | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const j=JSON.parse(s);console.log(j.owner,j.extra.eas.projectId,j.android.package)})"
npx -y eas-cli@latest config --platform android --profile preview --non-interactive
npx expo-doctor
npm test
```
Expected: owner and a UUID printed, the preview profile resolves, `expo-doctor` passes, the repo config test still passes.

- [ ] **Step 4: Commit and push**

```bash
git add apps/native/app.json apps/native/eas.json
git commit -F- <<'EOF'
Link the native app to EAS with an APK preview profile

Claude-Session: https://claude.ai/code/session_018R2boTZgvdq868jZ7PnZPd
EOF
git push
```

---

### Task 6: Update CLAUDE.md commands

**Files:**
- Modify: `CLAUDE.md` (Commands section)

- [ ] **Step 1: Replace the "There are no tests." sentence**

Replace `There are no tests. Lint exists only in \`web\` ...` with:
```markdown
- `npm test`: Vitest (unit, integration, repo config). Integration tests hit `paratrack-dev` using `apps/web/.env.local` and the root `.env`.
- `npx playwright test -c apps/web`: e2e on iPhone 13 and Pixel 7 emulation. CI runs it. Locally it needs `npx playwright install`.
- CI (`.github/workflows/ci.yml`) runs build, lint, native typecheck, Vitest and Playwright against a throwaway Supabase on the runner.
- Supabase CLI is linked to `paratrack-dev`. Auth settings live in `supabase/config.toml` and reach the project with `npx supabase config push`. The root `.env` only holds values that `config.toml` reads through `env()`.

Lint exists only in `web` (`npx turbo run lint --filter=web`), using the ESLint CLI with flat config `apps/web/eslint.config.mjs`. Next 16 removed `next lint`.
```

- [ ] **Step 2: Commit and push**

```bash
git add CLAUDE.md
git commit -F- <<'EOF'
Document test, CI and Supabase commands in CLAUDE.md

Claude-Session: https://claude.ai/code/session_018R2boTZgvdq868jZ7PnZPd
EOF
git push
```
