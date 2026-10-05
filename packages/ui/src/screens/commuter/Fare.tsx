import { InfoIcon } from "phosphor-react-native/src/icons/Info";
import { ScrollView, Text, View } from "react-native";
import { formatPeso } from "@repo/core";
import type { FareType } from "@repo/core";
import { AppBar } from "../../components/AppBar";
import { Banner } from "../../components/Banner";
import { LineItem } from "../../components/LineItem";
import { SegmentedControl } from "../../components/SegmentedControl";
import { vehicleKinds } from "../../components/VehicleMarker";
import { useFare, useProfile, useRoutes, useStops } from "../../data/hooks";
import { useNav, useQuery } from "../../lib/nav";
import colors from "../../theme/colors";

const options = [
  { value: "regular", label: "Regular" },
  { value: "student", label: "Student" },
  { value: "senior", label: "Senior" },
  { value: "pwd", label: "PWD" },
] as const;

const discountName = { student: "Student", senior: "Senior", pwd: "PWD", regular: "" } as const;
const fleet = { ejeep: "modern e-jeeps", jeep: "jeepneys", bus: "buses", shuttle: "shuttles" } as const;

/** Figma 10 Fare breakdown. The fare type is saved to the profile. */
export default function Fare() {
  const nav = useNav();
  const q = useQuery();
  const routeId = q.route ?? "";
  const fromId = q.from ?? "";
  const toId = q.to ?? "";
  const { profile, update } = useProfile();
  const fareType: FareType = profile?.fare_type ?? "regular";
  const { data: routes } = useRoutes();
  const { data: stops } = useStops();
  const route = routes?.find((r) => r.id === routeId);
  const res = useFare(routeId, fromId, toId, fareType);
  const name = (id: string) => stops?.find((s) => s.id === id)?.name ?? "";
  const b = res?.breakdown;
  const kind = route ? vehicleKinds[route.vehicle_type ?? "ejeep"] : null;
  const percent = fareType === "regular" ? 0 : 20;

  return (
    <View className="flex-1 bg-background">
      <AppBar title="Fare breakdown" onBack={() => nav.back()} />
      <ScrollView contentContainerClassName="gap-6 px-4 pb-8 pt-4">
        {kind && route && (
          <View className="flex-row items-center gap-3">
            <kind.Icon size={24} color={colors.foreground} />
            <View className="flex-1 gap-[2px]">
              <Text className="font-sans-medium text-title-sm text-foreground">{`${name(fromId)} to ${name(toId)}`}</Text>
              <Text className="font-sans text-body-sm text-text-muted">
                {`${route.name} ${kind.label.toLowerCase()}${res ? `, ${res.distanceKm.toFixed(1)} km` : ""}`}
              </Text>
            </View>
          </View>
        )}
        <View className="gap-2">
          <Text className="font-sans-medium text-body-sm text-foreground">Fare type</Text>
          <SegmentedControl options={options} value={fareType} onChange={(v) => update({ fare_type: v })} />
        </View>
        {percent > 0 && (
          <Banner tone="success" title={`${discountName[fareType]} fare`} body={`${percent}% off applies. Show your ID to the driver when you pay.`} />
        )}
        {b && route ? (
          <View>
            <LineItem label={`Base fare, first ${route.base_km} km`} amount={formatPeso(b.baseCentavos)} />
            {b.extraKm > 0 && (
              <LineItem
                label={`Next ${b.extraKm.toFixed(1)} km at ${formatPeso(Math.round((route.per_km ?? 0) * 100))} per km`}
                amount={formatPeso(b.extraCentavos)}
              />
            )}
            {b.discountCentavos > 0 && (
              <LineItem kind="discount" label={`${discountName[fareType]} discount, ${percent}%`} amount={`−${formatPeso(b.discountCentavos)}`} />
            )}
            {b.roundingCentavos !== 0 && (
              <LineItem
                label="Rounded to the nearest ₱0.25"
                amount={`${b.roundingCentavos > 0 ? "+" : "−"}${formatPeso(Math.abs(b.roundingCentavos))}`}
              />
            )}
            <LineItem kind="total" label="You pay" amount={formatPeso(b.totalCentavos)} />
          </View>
        ) : (
          routes && <Text className="font-sans text-body-md text-text-secondary">This trip has no fare.</Text>
        )}
        {route && (
          <View className="flex-row items-start gap-2">
            <InfoIcon size={16} color={colors["text-muted"]} />
            <Text className="flex-1 font-sans text-body-sm text-text-muted">
              {`Based on the LTFRB fare matrix for ${fleet[route.vehicle_type ?? "ejeep"]}. Pay the driver in cash.`}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
