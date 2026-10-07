import { useEffect, useState } from "react";

let message: string | null = null;
const listeners = new Set<(m: string | null) => void>();

/** Shows a message on whichever screen renders `useToast()` next. It clears itself after 4 seconds. */
export const showToast = (m: string) => {
  message = m;
  listeners.forEach((l) => l(m));
  setTimeout(() => {
    if (message === m) {
      message = null;
      listeners.forEach((l) => l(null));
    }
  }, 4000);
};

export const useToast = () => {
  const [m, setM] = useState(message);
  useEffect(() => {
    listeners.add(setM);
    setM(message);
    return () => void listeners.delete(setM);
  }, []);
  return m;
};
