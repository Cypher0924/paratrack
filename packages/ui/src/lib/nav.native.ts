import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback } from "react";

export function useNav() {
  const router = useRouter();
  // Stable identities: screens put these in effect dependency lists.
  const push = useCallback((path: string) => router.push(path as never), [router]);
  const replace = useCallback((path: string) => router.replace(path as never), [router]);
  const back = useCallback(() => router.back(), [router]);
  return { push, replace, back };
}

export function useParams<T extends Record<string, string | string[]>>() {
  return useLocalSearchParams() as unknown as T;
}

/** expo-router keeps the query on the route, so the local search params are the query. */
export function useQuery(): Record<string, string> {
  const params = useLocalSearchParams();
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") out[key] = value;
    else if (Array.isArray(value) && value.length) out[key] = value[0];
  }
  return out;
}
