import type { Icon } from "phosphor-react-native";
import { BusIcon } from "phosphor-react-native/src/icons/Bus";
import { JeepIcon } from "phosphor-react-native/src/icons/Jeep";
import { Text, View } from "react-native";
import { Logo } from "../../components/Brand";
import { Button } from "../../components/Button";
import { MapPreview } from "../../components/MapPreview";
import { YouMarker } from "../../components/YouMarker";
import { useNav } from "../../lib/nav";
import { useIsWide } from "../../lib/responsive";
import { OnboardingFrame } from "./OnboardingFrame";
import colors from "../../theme/colors";

/** The welcome route in viewport px. Figma draws an open L, not a loop. */
const route = "M120 480 L120 208 L360 208";

type Kind = "available" | "filling" | "full";
const ring: Record<Kind, string> = {
  available: "border-success",
  filling: "border-warning",
  full: "border-danger",
};
const tag: Record<Kind, string> = {
  available: "bg-success-subtle",
  filling: "bg-warning",
  full: "bg-danger-subtle",
};
const tagText: Record<Kind, string> = {
  available: "text-success-text",
  filling: "text-on-warning",
  full: "text-danger-text",
};

/** Illustration marker for the welcome map. The live one is `VehicleMarker` (Task 7). */
function Pin({
  Glyph,
  kind,
  seats,
  left,
  top,
}: {
  Glyph: Icon;
  kind: Kind;
  seats: string;
  left: number;
  top: number;
}) {
  return (
    <View className="absolute h-[44px] w-[44px] items-center justify-center" style={{ left, top }}>
      {kind === "filling" && <View className="absolute h-[40px] w-[40px] rounded-pill bg-warning" />}
      <View
        className={`h-[36px] w-[36px] items-center justify-center rounded-pill border-[3px] bg-surface shadow-raised ${ring[kind]}`}
      >
        <Glyph size={18} weight="fill" color={colors.foreground} />
      </View>
      <View
        className={`absolute left-[26px] top-[-4px] h-[16px] items-center justify-center rounded-pill px-[4px] ${tag[kind]}`}
      >
        <Text className={`font-sans-medium text-caption ${tagText[kind]}`}>{seats}</Text>
      </View>
    </View>
  );
}

function Dot({ left, top, kind }: { left: number; top: number; kind: "stop" | "yours" }) {
  return (
    <View className="absolute" style={{ left, top }}>
      {kind === "stop" ? (
        <View className="h-[14px] w-[14px] rounded-pill border-[3px] border-foreground bg-surface" />
      ) : (
        <View className="h-[24px] w-[24px] rounded-pill border-[6px] border-accent bg-surface shadow-raised" />
      )}
    </View>
  );
}

/** Figma 01 Welcome: illustration map, then the brand, headline and the two ways in. From `md` up it is a card over a live map. */
export default function Welcome() {
  const { push } = useNav();
  const wide = useIsWide();
  const copy = (
    <View className="gap-4">
      <Logo height={36} />
      <Text role="heading" className="font-display text-display-lg text-foreground">Know where your ride is</Text>
      <Text className="font-sans text-body-md text-text-secondary">
        Live shuttles, e-jeeps, and buses near you, with seats left and the fare before you board.
      </Text>
    </View>
  );
  const actions = (
    <>
      <Button label="Find rides near me" onPress={() => push("/location")} />
      <Button variant="secondary" label="I'm a driver" onPress={() => push("/login?role=driver")} />
    </>
  );

  if (wide) {
    return (
      <OnboardingFrame>
        <View className="p-7">
          {copy}
          <View className="gap-3 pt-8">{actions}</View>
        </View>
      </OnboardingFrame>
    );
  }
  return (
    <View className="h-full w-full flex-1 bg-background">
      <MapPreview routePath={route} className="h-[480px] w-full">
        <Dot left={288} top={154} kind="stop" />
        <Dot left={168} top={151} kind="yours" />
        <Dot left={117} top={248} kind="stop" />
        <Pin Glyph={JeepIcon} kind="filling" seats="3" left={336} top={156} />
        <Pin Glyph={JeepIcon} kind="available" seats="12" left={124} top={338} />
        <Pin Glyph={BusIcon} kind="full" seats="Full" left={110} top={38} />
        <View className="absolute" style={{ left: 188, top: 196 }}>
          <YouMarker />
        </View>
      </MapPreview>

      {/* The panel overlaps the bottom of the map band, as in Figma. */}
      <View className="-mt-[404px] flex-1 justify-end rounded-t-surface bg-surface px-6 pb-[50px] pt-8 shadow-sheet">
        {copy}
        <View className="mt-auto gap-3 pt-8">{actions}</View>
      </View>
    </View>
  );
}
