import type { AppNotification, Client } from "./types";
import { must } from "./types";

export const fetchNotifications = async (client: Client): Promise<AppNotification[]> =>
  must(await client.from("notifications").select("*").order("created_at", { ascending: false }).limit(100));

export const markAllRead = async (client: Client): Promise<void> => {
  must(await client.from("notifications").update({ read_at: new Date().toISOString() }).is("read_at", null).select("id"));
};

export const unreadCount = (rows: AppNotification[]): number => rows.filter((n) => n.read_at === null).length;
