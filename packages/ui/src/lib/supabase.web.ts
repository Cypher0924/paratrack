import { createClient } from "@supabase/supabase-js";
import type { Database } from "@repo/core";

export const supabase = createClient<Database>(
  // @ts-ignore tsup dts build runs without node types
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://missing-env.invalid", // placeholder keeps imports from throwing when env is absent (CI build)
  // @ts-ignore tsup dts build runs without node types
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "missing-env",
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } },
);
