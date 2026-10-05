import { useParams as useNextParams, useRouter } from "next/navigation";

export function useNav() {
  const router = useRouter();
  return {
    push: (path: string) => router.push(path),
    replace: (path: string) => router.replace(path),
    back: () => router.back(),
  };
}

export function useParams<T extends Record<string, string | string[]>>() {
  return useNextParams() as unknown as T;
}
