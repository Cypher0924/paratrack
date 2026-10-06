import { supabase } from "./supabase";

// Web posts to its own origin. Android has no origin, so EXPO_PUBLIC_API_URL points at the deployed web app.
// Metro inlines EXPO_PUBLIC_*, and on web the variable is undefined, which keeps the URL relative.
const base = () => process.env.EXPO_PUBLIC_API_URL ?? "";

export type DriverPath = "ping" | "seats" | "offline";

/** POSTs to `/api/driver/<path>` with the current session's access token. Throws the server's error code. */
export async function postDriver<T = unknown>(path: DriverPath, body?: unknown): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("unauthorized");
  const res = await fetch(`${base()}/api/driver/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body ?? {}),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as { error?: string }).error ?? `http_${res.status}`);
  return json as T;
}
