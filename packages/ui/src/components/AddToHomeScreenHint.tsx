import { ShareNetwork } from "phosphor-react-native";
import { useEffect, useState } from "react";
import { needsInstall } from "../lib/push";
import { Banner } from "./Banner";

/** Shown on iPhone Safari only. Web Push there works once the app is on the Home Screen. */
export function AddToHomeScreenHint({ className }: { className?: string }) {
  const [show, setShow] = useState(false);
  useEffect(() => setShow(needsInstall()), []);
  if (!show) return null;
  return (
    <Banner
      tone="info"
      icon={ShareNetwork}
      className={className}
      title="Add ParaTrack to your Home Screen"
      body="Tap Share, then Add to Home Screen. Alerts on iPhone only work from the installed app."
    />
  );
}
