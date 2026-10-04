import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@repo/core";

export const supabase = createClient<Database>(
  // @ts-ignore tsup dts build runs without node types
  process.env.EXPO_PUBLIC_SUPABASE_URL as string,
  // @ts-ignore tsup dts build runs without node types
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY as string,
  { auth: { storage: AsyncStorage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } },
);
