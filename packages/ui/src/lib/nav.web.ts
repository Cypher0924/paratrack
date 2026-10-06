import { useParams as useNextParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export function useNav() {
  const router = useRouter();
  // Stable identities: screens put these in effect dependency lists.
  const push = useCallback((path: string) => router.push(path), [router]);
  const replace = useCallback((path: string) => router.replace(path), [router]);
  const back = useCallback(() => router.back(), [router]);
  return { push, replace, back };
}

export function useParams<T extends Record<string, string | string[]>>() {
  return useNextParams() as unknown as T;
}

/**
 * Query string for the current URL, read through the router so it is correct on the first client
 * render. The routes wrap the screens in `ScreenFrame`, which supplies the Suspense boundary this
 * hook needs while the page is prerendered.
 */
export function useQuery(): Record<string, string> {
  const params = useSearchParams();
  const out: Record<string, string> = {};
  params.forEach((value, key) => {
    out[key] = value;
  });
  return out;
}
