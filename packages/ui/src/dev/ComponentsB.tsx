import { useState, type ReactNode } from "react";
import { ShareNetworkIcon } from "phosphor-react-native/src/icons/ShareNetwork";
import { GraduationCapIcon } from "phosphor-react-native/src/icons/GraduationCap";
import { UserCircleIcon } from "phosphor-react-native/src/icons/UserCircle";
import { BellIcon } from "phosphor-react-native/src/icons/Bell";
import { ScrollView, Text, View } from "react-native";
import type { SeatStatus } from "@repo/core";
import { AlertItem } from "../components/AlertItem";
import { AppBar } from "../components/AppBar";
import { ArrivalRow } from "../components/ArrivalRow";
import { AppIcon, Logo } from "../components/Brand";
import { RadioCard } from "../components/RadioCard";
import { SearchBar } from "../components/SearchBar";
import { SettingsRow } from "../components/SettingsRow";
import { LineItem } from "../components/LineItem";
import { MapCallout } from "../components/MapCallout";
import { Sheet } from "../components/Sheet";
import { StopMarker } from "../components/StopMarker";
import { TabBar } from "../components/TabBar";
import { TimelineRow } from "../components/TimelineRow";
import { VehicleMarker, vehicleKinds, type VehicleType } from "../components/VehicleMarker";
import { YouMarker } from "../components/YouMarker";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="gap-3">
      <Text className="font-sans-medium text-title-sm text-foreground">{title}</Text>
      {children}
    </View>
  );
}

const types = Object.keys(vehicleKinds) as VehicleType[];
const states: { status: SeatStatus; seatsLeft: number; selected?: boolean }[] = [
  { status: "available", seatsLeft: 8 },
  { status: "filling", seatsLeft: 3 },
  { status: "full", seatsLeft: 0 },
  { status: "available", seatsLeft: 8, selected: true },
];

/** Dev gallery for Task 3a components, routed at /dev/components-b. */
export default function ComponentsB() {
  const [notify, setNotify] = useState(true);
  const [who, setWho] = useState<"commuter" | "driver">("commuter");
  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-5 px-4 py-5">
      <Text className="font-sans-medium text-title-md text-foreground">Components B</Text>

      <Section title="Tab bar">
        <TabBar active="map" unread={2} />
        <TabBar active="alerts" unread={2} />
        <TabBar active="account" unread={2} />
        <TabBar variant="driver" active="drive" unread={2} />
        <TabBar variant="driver" active="alerts" unread={2} />
        <TabBar variant="driver" active="account" unread={2} />
      </Section>

      <Section title="Sheet">
        <View className="h-[320px] justify-end overflow-hidden rounded-md bg-surface-muted">
          <Sheet heights={[140, 300]}>
            <View className="px-4 pt-1">
              <Text className="font-sans-medium text-title-md text-foreground">Nearby now</Text>
              <Text className="font-sans text-body-sm text-text-muted">Tap the handle to expand or collapse.</Text>
            </View>
          </Sheet>
        </View>
      </Section>

      <Section title="Timeline row">
        <View>
          <TimelineRow state="passed" stop="Tarlac City Hall" meta="9:38 AM" lineAbove={false} />
          <TimelineRow state="vehicle" stop="Rizal Ave" meta="Now" />
          <TimelineRow state="upcoming" stop="Romulo Blvd" meta="9:45 AM" />
          <TimelineRow state="yours" stop="Capitol" meta="9:48 AM · Your stop" />
          <TimelineRow state="destination" stop="SM City Tarlac" meta="9:56 AM" lineBelow={false} />
        </View>
      </Section>

      <Section title="Line item">
        <View>
          <LineItem label="Base fare, first 4 km" amount="₱15.00" />
          <LineItem label="2.8 km after that" amount="₱6.16" />
          <LineItem kind="discount" label="Student discount (20%)" amount="−₱4.23" />
          <LineItem label="Rounded to the nearest ₱0.25" amount="₱0.07" />
          <LineItem kind="total" label="Total" amount="₱17.00" />
        </View>
      </Section>

      <Section title="Vehicle marker">
        {types.map((type) => (
          <View key={type} className="flex-row gap-3 pt-1">
            {states.map((s, i) => (
              <VehicleMarker key={i} type={type} {...s} />
            ))}
          </View>
        ))}
      </Section>

      <Section title="Stop, you and callout">
        <View className="flex-row items-center gap-3 rounded-md bg-map-land p-3">
          <StopMarker name="Rizal Ave" />
          <StopMarker kind="yours" name="Capitol" />
          <StopMarker kind="destination" name="SM City Tarlac" />
          <YouMarker />
          <MapCallout name="E-jeep 18" eta="7 min" />
        </View>
      </Section>

      <Section title="Arrival row">
        <View>
          <ArrivalRow vehicleType="ejeep" route="Downtown-SM" meta="E-jeep from Rizal Ave · 3 min walk" badge={{ tone: "warning", label: "3 seats left" }} eta="7 min" time="9:43 AM" />
          <ArrivalRow vehicleType="shuttle" route="Capitol Loop" meta="Shuttle from Romulo Blvd · 5 min walk" badge={{ tone: "success", label: "12 seats" }} eta="12 min" time="9:48 AM" />
        </View>
      </Section>

      <Section title="Settings row">
        <View>
          <SettingsRow icon={GraduationCapIcon} title="Student fare" description="20 percent off every trip" />
          <SettingsRow icon={BellIcon} title="Arrival alerts" description="Tell me before my stop" trailing="switch" checked={notify} onCheckedChange={setNotify} />
          <SettingsRow icon={GraduationCapIcon} title="Language" description="Used across the app" trailing="value" value="English" />
          <SettingsRow icon={GraduationCapIcon} title="Version" description="ParaTrack for Tarlac City" trailing="none" />
        </View>
      </Section>

      <Section title="Radio card">
        <RadioCard icon={UserCircleIcon} title="I ride" description="Find a vehicle and track it" selected={who === "commuter"} onPress={() => setWho("commuter")} />
        <RadioCard icon={UserCircleIcon} title="I drive a route" description="Share my vehicle on the map" selected={who === "driver"} onPress={() => setWho("driver")} />
      </Section>

      <Section title="Alert item">
        <View>
          <AlertItem title="Alert title" body="What happened and what it means for your trip." time="2 min ago" unread />
          <AlertItem tone="warning" title="Delay on Downtown-SM" body="Traffic near Capitol adds about 5 minutes." time="1 hr ago" />
        </View>
      </Section>

      <Section title="App bar">
        <AppBar title="Title" />
        <AppBar title="Title" action={{ icon: ShareNetworkIcon, label: "Share trip" }} />
      </Section>

      <Section title="Search bar">
        <SearchBar />
      </Section>

      <Section title="Brand">
        <View className="flex-row items-center gap-5">
          <AppIcon />
          <Logo />
        </View>
      </Section>
    </ScrollView>
  );
}
