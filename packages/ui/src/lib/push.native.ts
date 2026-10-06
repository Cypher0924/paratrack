import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export type PushResult = "on" | "denied" | "unsupported" | "needs-install";

/** Only iOS Safari needs the Home Screen install. Native builds never do. */
export const needsInstall = (): boolean => false;

/** Asks permission, gets the Expo push token and saves it with the API. */
export async function enablePush(accessToken: string): Promise<PushResult> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "ParaTrack alerts",
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
  let { status } = await Notifications.getPermissionsAsync();
  if (status !== "granted") status = (await Notifications.requestPermissionsAsync()).status;
  if (status !== "granted") return "denied";

  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) return "unsupported";
  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });

  const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/push/subscribe`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ kind: "expo", token }),
  });
  return res.ok ? "on" : "unsupported";
}
