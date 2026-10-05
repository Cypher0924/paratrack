// Platform-neutral fallback so tsc and tsup resolve. Bundlers pick supabase.web.ts or supabase.native.ts first.
export { supabase } from "./supabase.web";
