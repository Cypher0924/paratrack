import type { Client, Profile, ProfilePatch } from "./types";
import { must } from "./types";

export const sendCode = async (client: Client, e164: string) => (await client.auth.signInWithOtp({ phone: e164 })).error;

export const checkCode = async (client: Client, e164: string, code: string) => {
  const { data, error } = await client.auth.verifyOtp({ phone: e164, token: code, type: "sms" });
  return { session: data.session, error };
};

export const fetchProfile = async (client: Client, userId: string): Promise<Profile> =>
  must(await client.from("profiles").select("*").eq("id", userId).single());

export const updateProfile = async (client: Client, userId: string, patch: ProfilePatch): Promise<Profile> =>
  must(await client.from("profiles").update(patch).eq("id", userId).select("*").single());
