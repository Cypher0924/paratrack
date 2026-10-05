import { ArrowLeftIcon } from "phosphor-react-native/src/icons/ArrowLeft";
import { HouseIcon } from "phosphor-react-native/src/icons/House";
import { MagnifyingGlassIcon } from "phosphor-react-native/src/icons/MagnifyingGlass";
import { useState, type ReactNode } from "react";
import { ScrollView, Text, View } from "react-native";
import { Avatar } from "../components/Avatar";
import { Badge } from "../components/Badge";
import { Banner } from "../components/Banner";
import { Button, type ButtonVariant } from "../components/Button";
import { CapacityBar } from "../components/CapacityBar";
import { Checkbox } from "../components/Checkbox";
import { Chip } from "../components/Chip";
import { CountButton } from "../components/CountButton";
import { IconButton } from "../components/IconButton";
import { OtpCell } from "../components/OtpCell";
import { Plate } from "../components/Plate";
import { Radio } from "../components/Radio";
import { SegmentedControl } from "../components/SegmentedControl";
import { StatusDisc } from "../components/StatusDisc";
import { Switch } from "../components/Switch";
import { TextField } from "../components/TextField";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="gap-3">
      <Text role="heading" className="font-sans-medium text-title-sm text-foreground">
        {title}
      </Text>
      {children}
    </View>
  );
}

function Row({ children }: { children: ReactNode }) {
  return <View className="flex-row flex-wrap items-center gap-3">{children}</View>;
}

const variants: ButtonVariant[] = ["primary", "secondary", "ghost", "danger"];
const tones = ["accent", "success", "warning", "danger", "neutral"] as const;
const filters = [
  { value: "all", label: "All" },
  { value: "shuttle", label: "Shuttle" },
  { value: "e-jeep", label: "E-jeep" },
  { value: "bus", label: "Bus" },
  { value: "jeep", label: "Jeep" },
] as const;
type Filter = (typeof filters)[number]["value"];
const CAPACITY = 22;

/** Dev gallery of Figma Controls (2012:6) and Feedback (2013:16), at /dev/components-a. */
export default function ComponentsA() {
  const [unchecked, setUnchecked] = useState(false);
  const [checked, setChecked] = useState(true);
  const [fare, setFare] = useState("student");
  const [off, setOff] = useState(false);
  const [on, setOn] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [chips, setChips] = useState({ first: false, second: true });
  const [taken, setTaken] = useState(9);

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-5 p-4">
      <Text role="heading" className="font-sans-medium text-title-md text-foreground">
        Controls
      </Text>

      <Section title="Button">
        {variants.map((v) => (
          <View key={v} className="gap-2">
            <Row>
              <Button variant={v} label="Button label" />
              <Button variant={v} label="Button label" pressed />
              <Button variant={v} label="Button label" disabled />
            </Row>
            <Row>
              <Button variant={v} size="md" label="Button label" />
              <Button variant={v} size="md" label="Button label" pressed />
              <Button variant={v} size="md" label="Button label" disabled />
            </Row>
          </View>
        ))}
        <Row>
          <Button label="Search routes" icon={MagnifyingGlassIcon} />
          <Button label="Sending code" loading />
        </Row>
      </Section>

      <Section title="Icon button">
        <Row>
          <IconButton icon={ArrowLeftIcon} label="Back" />
          <IconButton icon={ArrowLeftIcon} label="Back" variant="surface" />
          <IconButton icon={ArrowLeftIcon} label="Back" variant="tonal" />
        </Row>
      </Section>

      <Section title="Text field">
        <TextField label="Label" placeholder="Value" helper="Helper text" />
        <TextField label="Label" defaultValue="Value" helper="Helper text" focused />
        <TextField label="Label" defaultValue="Value" helper="Helper text" />
        <TextField label="Label" defaultValue="Value" error="Helper text" />
        <TextField label="Label" placeholder="Value" helper="Helper text" disabled />
        <TextField label="Mobile number" prefix="+63" placeholder="912 345 6789" keyboardType="phone-pad" />
      </Section>

      <Section title="Checkbox, Radio, Switch">
        <Row>
          <Checkbox label="Unchecked example" checked={unchecked} onChange={setUnchecked} />
          <Checkbox label="Checked example" checked={checked} onChange={setChecked} />
          <Radio label="Regular fare" selected={fare === "regular"} onPress={() => setFare("regular")} />
          <Radio label="Student fare" selected={fare === "student"} onPress={() => setFare("student")} />
          <Switch label="Off example" value={off} onValueChange={setOff} />
          <Switch label="On example" value={on} onValueChange={setOn} />
        </Row>
      </Section>

      <Section title="Segmented control">
        <SegmentedControl options={filters} value={filter} onChange={setFilter} />
      </Section>

      <Section title="Chip">
        <Row>
          <Chip
            label="Chip"
            icon={HouseIcon}
            selected={chips.first}
            onPress={() => setChips((c) => ({ ...c, first: !c.first }))}
          />
          <Chip
            label="Chip"
            icon={HouseIcon}
            selected={chips.second}
            onPress={() => setChips((c) => ({ ...c, second: !c.second }))}
          />
        </Row>
      </Section>

      <Text role="heading" className="font-sans-medium text-title-md text-foreground">
        Feedback
      </Text>

      <Section title="Badge">
        <Row>
          <Badge tone="success" label="12 seats" />
          <Badge tone="warning" label="4 seats" />
          <Badge tone="danger" label="Full" />
          <Badge tone="info" label="Student fare" />
          <Badge tone="neutral" label="2 min ago" />
          <Badge tone="live" label="Live" />
        </Row>
      </Section>

      <Section title="Status disc">
        <Row>
          {tones.map((t) => (
            <StatusDisc key={t} tone={t} />
          ))}
          {tones.map((t) => (
            <StatusDisc key={`${t}-32`} tone={t} size={32} />
          ))}
        </Row>
      </Section>

      <Section title="Banner">
        {(["info", "success", "warning", "danger"] as const).map((t) => (
          <Banner
            key={t}
            tone={t}
            title="Banner title"
            body="One sentence that says what happened and what to do."
          />
        ))}
      </Section>

      <Section title="Plate and Avatar">
        <Row>
          <Plate plate="NBC 4821" />
          <Avatar name="Ana Santos" />
          <Avatar name="Ana Santos" size={40} />
        </Row>
      </Section>

      <Section title="Capacity bar">
        <CapacityBar capacity={CAPACITY} seatsTaken={8} />
        <CapacityBar capacity={CAPACITY} seatsTaken={18} />
        <CapacityBar capacity={CAPACITY} seatsTaken={CAPACITY} />
        <Row>
          <CountButton
            kind="minus"
            disabled={taken === 0}
            onPress={() => setTaken((n) => Math.max(0, n - 1))}
          />
          <View className="flex-1 gap-2">
            <Text className="font-sans text-body-sm text-text-secondary">
              {taken} of {CAPACITY} seats taken
            </Text>
            <CapacityBar capacity={CAPACITY} seatsTaken={taken} />
          </View>
          <CountButton
            kind="plus"
            disabled={taken === CAPACITY}
            onPress={() => setTaken((n) => Math.min(CAPACITY, n + 1))}
          />
        </Row>
      </Section>

      <Section title="OTP cell">
        <Row>
          <OtpCell />
          <OtpCell digit="4" />
          <OtpCell digit="4" active />
          <OtpCell digit="4" error />
        </Row>
      </Section>

      <Section title="Count button">
        <Row>
          <CountButton kind="minus" />
          <CountButton kind="minus" pressed />
          <CountButton kind="minus" disabled />
          <CountButton kind="plus" />
          <CountButton kind="plus" pressed />
          <CountButton kind="plus" disabled />
        </Row>
      </Section>
    </ScrollView>
  );
}
