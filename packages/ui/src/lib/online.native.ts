import NetInfo from "@react-native-community/netinfo";
import { useEffect, useState } from "react";

export const useOnline = (): boolean => {
  const [online, setOnline] = useState(true);
  useEffect(
    () => NetInfo.addEventListener((s) => setOnline(s.isConnected !== false && s.isInternetReachable !== false)),
    [],
  );
  return online;
};
