import { useLocalSearchParams, useRouter } from "expo-router";

export function useNav() {
  const router = useRouter();
  return {
    push: (path: string) => router.push(path as never),
    replace: (path: string) => router.replace(path as never),
    back: () => router.back(),
  };
}

export function useParams<T extends Record<string, string | string[]>>() {
  return useLocalSearchParams() as unknown as T;
}
