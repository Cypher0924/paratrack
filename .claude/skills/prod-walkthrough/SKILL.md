---
name: prod-walkthrough
description: Click through the deployed ParaTrack app end to end (commuter and driver) with Playwright at phone and desktop sizes, saving a screenshot per step. Use after a deploy or to reproduce a reported flow bug.
---

# Prod walkthrough

```
node .claude/skills/prod-walkthrough/walk.mjs [wide] [outDir]
```

- No argument: Pixel 7 emulation, test number +639000000001. `wide`: 1440x900, +639000000003. Run both after layout changes.
- `WALK_BASE` picks the target (default `https://paratrack-tau.vercel.app`). Use `http://localhost:3000` for `npm run dev`.
- `outDir` defaults to `<os tmp>/paratrack-walk`. Each step prints `OK` or `FAIL`, the URL it ended on, and new console errors. Open the `m-NN-*.png` / `w-NN-*.png` screenshots to check layout.
- The OTP comes from `SUPABASE_AUTH_TEST_OTP` in the root `.env`. The script never prints it.
- Driver steps use seeded vehicles the simulator never touches: `TMB 5930` (phone) and `TGR 9017` (wide), both under operator `TMP-5826` (set `WALK_OPERATOR_CODE` if the operator code changes). Run `npm run simulate` separately if you need moving vehicles. The simulator uses other test numbers and vehicles, so they don't collide.
- The run leaves the test account logged out and in commuter mode.

When a step fails, read its screenshot first, then fix the flow, not the script, unless the UI copy changed on purpose.
