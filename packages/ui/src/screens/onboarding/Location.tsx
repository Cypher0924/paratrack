import { Text, View } from "react-native";
import { useState } from "react";
import { Button } from "../../components/Button";
import { MapPreview } from "../../components/MapPreview";
import { YouMarker } from "../../components/YouMarker";
import { useNav } from "../../lib/nav";
import { useIsWide } from "../../lib/responsive";
import { OnboardingFrame } from "./OnboardingFrame";
import { requestLocation } from "../../lib/location";
import { setOriginStop } from "../../data/origin";

/** Figma 02 Location. No route line on this screen; the permission copy is the point. */
export default function Location() {
  const { push } = useNav();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const wide = useIsWide();

  const panel = (
    <>
      <View className="gap-4">
        <Text role="heading" className="font-display text-title-lg text-foreground">See rides near you</Text>
        <Text className="font-sans text-body-md text-text-secondary">
          ParaTrack uses your location to show nearby stops and arrival times. Drivers never see it.
        </Text>
      </View>
      <View className="mt-auto gap-3 pt-8">
        <Button
          label="Allow location"
          loading={busy}
          onPress={async () => {
            setBusy(true);
            const position = await requestLocation();
            setBusy(false);
            // Denied or unavailable: stay here so the stop picker is still offered.
            if (position) push("/login");
            else setFailed(true);
          }}
        />
        <Button
          variant="secondary"
          label="Choose my stop instead"
          onPress={async () => {
            // The stop picker is Task 6. Clearing the origin makes it open on first login.
            await setOriginStop(null);
            push("/login");
          }}
        />
      </View>
      <Text className="pt-3 font-sans text-body-sm text-text-muted">
        {failed
          ? "Location is off. Turn it back on in Settings, or choose a stop instead."
          : "Your position never leaves this device."}
      </Text>
    </>
  );

  if (wide) {
    return (
      <OnboardingFrame>
        {panel}
      </OnboardingFrame>
    );
  }
  return (
    <View className="h-full w-full flex-1 bg-background">
      <MapPreview offsetX={-337} offsetY={-580} className="h-[480px] w-full">
        <View className="absolute" style={{ left: 161, top: 171 }}>
          <View className="h-[14px] w-[14px] rounded-pill border-[3px] border-foreground bg-surface" />
        </View>
        {/* Filling e-jeep, 3 seats */}
        <View className="absolute h-[44px] w-[44px] items-center justify-center" style={{ left: 296, top: 174 }}>
          <View className="absolute h-[40px] w-[40px] rounded-pill bg-warning" />
          <View className="h-[36px] w-[36px] items-center justify-center rounded-pill border-[3px] border-warning bg-surface shadow-raised" />
          <View className="absolute left-[26px] top-[-4px] h-[16px] items-center justify-center rounded-pill bg-warning px-[4px]">
            <Text className="font-sans-medium text-caption text-on-warning">3</Text>
          </View>
        </View>
        {/* Available e-jeep, 12 seats */}
        <View className="absolute h-[44px] w-[44px] items-center justify-center" style={{ left: 36, top: 166 }}>
          <View className="h-[36px] w-[36px] items-center justify-center rounded-pill border-[3px] border-success bg-surface shadow-raised" />
          <View className="absolute left-[26px] top-[-4px] h-[16px] items-center justify-center rounded-pill bg-success-subtle px-[4px]">
            <Text className="font-sans-medium text-caption text-success-text">12</Text>
          </View>
        </View>
        {/* Full bus */}
        <View className="absolute h-[44px] w-[44px] items-center justify-center" style={{ left: 96, top: 38 }}>
          <View className="h-[36px] w-[36px] items-center justify-center rounded-pill border-[3px] border-danger bg-surface shadow-raised" />
          <View className="absolute left-[26px] top-[-4px] h-[16px] items-center justify-center rounded-pill bg-danger-subtle px-[4px]">
            <Text className="font-sans-medium text-caption text-danger-text">Full</Text>
          </View>
        </View>
        <View className="absolute" style={{ left: 181, top: 210 }}>
          <YouMarker />
        </View>
      </MapPreview>

      <View className="-mt-[404px] flex-1 justify-end rounded-t-surface bg-surface px-6 pb-[50px] pt-8 shadow-sheet">
        {panel}
      </View>
    </View>
  );
}