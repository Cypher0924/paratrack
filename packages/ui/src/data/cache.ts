import { useEffect, useState } from "react";

const store = new Map<string, Promise<unknown>>();

/** Loads once per key for the life of the module. Failures are not kept. */
export const loadOnce = <T>(key: string, load: () => Promise<T>): Promise<T> => {
  let p = store.get(key) as Promise<T> | undefined;
  if (!p) {
    p = load().catch((e) => {
      store.delete(key);
      throw e;
    });
    store.set(key, p);
  }
  return p;
};

export const useCached = <T>(key: string, load: () => Promise<T>) => {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  useEffect(() => {
    let live = true;
    loadOnce(key, load).then(
      (d) => live && setData(d),
      (e) => live && setError(e as Error),
    );
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return { data, error, loading: data === null && error === null };
};
