import type { AppNotification, Client } from "./types";
import { must } from "./types";
import type { Database } from "@repo/core";

export type Announcement = Database["public"]["Tables"]["announcements"]["Row"];

/** The announcement a service notification points at, or null when the id is unknown. */
export const fetchAnnouncement = async (client: Client, id: number): Promise<Announcement | null> =>
  must(await client.from("announcements").select("*").eq("id", id).maybeSingle());

/** The announcement id a service notification carries in its data. */
export const announcementIdOf = (n: AppNotification): number | null => {
  const d = n.data as { announcementId?: unknown } | null;
  return n.kind === "service" && typeof d?.announcementId === "number" ? d.announcementId : null;
};

export const markRead = async (client: Client, id: number): Promise<void> => {
  must(await client.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id).is("read_at", null).select("id"));
};

export const fetchNotifications = async (client: Client): Promise<AppNotification[]> =>
  must(await client.from("notifications").select("*").order("created_at", { ascending: false }).limit(100));

export const markAllRead = async (client: Client): Promise<void> => {
  must(await client.from("notifications").update({ read_at: new Date().toISOString() }).is("read_at", null).select("id"));
};

export const unreadCount = (rows: AppNotification[]): number => rows.filter((n) => n.read_at === null).length;
