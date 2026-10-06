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
    // Integration files share one database: online test vehicles and announcement fan-out leak between files.
    fileParallelism: false,
  },
}));
