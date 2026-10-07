import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { acceptPrimer, declinePrimer, subscribePrimer } from "../lib/push-toggle";
import { Button } from "./Button";

/** Figma 29 Notification primer. Mount once per app root. Phones get a bottom sheet, desktop a centered dialog. */
export function PushPrimer() {
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => subscribePrimer(setToken), []);
  if (!token) return null;
  return (
    <View className="absolute inset-0 z-50 justify-end md:items-center md:justify-center">
      <Pressable aria-label="Close" onPress={declinePrimer} className="absolute inset-0 bg-foreground/40" />
      <View
        role="dialog"
        aria-modal
        aria-label="Get alerts before your ride comes"
        className="gap-4 rounded-t-surface bg-surface px-4 pb-safe pt-4 shadow-sheet md:w-[440px] md:rounded-panel md:p-6"
      >
        <View className="h-[5px] w-[40px] self-center rounded-pill bg-border md:hidden" />
        <Text role="heading" className="font-display text-title-lg text-foreground">
          Get alerts before your ride comes
        </Text>
        <Text className="font-sans text-body-md text-text-secondary">
          We tell you when your ride is 2 min away and when a route changes. Turn alerts off anytime in Account.
        </Text>
        <View className="gap-3 pb-4">
          <Button label="Turn on alerts" onPress={() => acceptPrimer(token)} />
          <Button label="Not now" variant="secondary" onPress={declinePrimer} />
        </View>
      </View>
    </View>
  );
}
