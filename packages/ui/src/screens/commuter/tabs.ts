import type { Tab } from "../../components/TabBar";

// Task 7 builds /home. The tabs call replace() with these paths.
export const tabPath: Record<Tab, string> = { map: "/home", drive: "/driver", alerts: "/alerts", account: "/account" };
