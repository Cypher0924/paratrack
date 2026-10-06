import { PathIcon } from "phosphor-react-native/src/icons/Path";
import { useState } from "react";
import { Text, View } from "react-native";
import { AppBar } from "../../components/AppBar";
import { Button } from "../../components/Button";
import { SettingsRow } from "../../components/SettingsRow";
import { TextField } from "../../components/TextField";
import { useSession } from "../../data/hooks";
import { verifyDriver, type DriverErrorCode } from "../../data/driver";
import type { DriverVerification } from "../../data/types";
import { supabase } from "../../lib/supabase";
import { OnboardingFrame } from "./OnboardingFrame";
import { useNav } from "../../lib/nav";

/** Every reason `verify_driver` answers with, in the words the driver needs. */
const errorCopy: Record<DriverErrorCode, string> = {
  invalid_code_or_plate: "That code and plate do not match. Check both with your operator.",
  too_many_attempts: "Too many tries. Wait an hour, then come back.",
  vehicle_in_use: "Another driver is sharing this vehicle right now. Try again later.",
  phone_required: "Confirm your mobile number first, then verify your vehicle.",
  unknown: "We could not verify the vehicle. Try again.",
};

/** Figma 05 Driver verification. Success shows the assigned route, then the driver home (Phase 7). */
export default function DriverVerify() {
  const { push, replace } = useNav();
  const { signOut } = useSession();
  const [operatorCode, setOperatorCode] = useState("");
  const [plate, setPlate] = useState("");
  const [vehicle, setVehicle] = useState<DriverVerification | null>(null);
  const [error, setError] = useState<DriverErrorCode | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError(null);
    const { vehicle: found, code } = await verifyDriver(supabase, operatorCode, plate);
    setBusy(false);
    if (code) setError(code);
    else setVehicle(found);
  };

  return (
    <OnboardingFrame>
      <AppBar title="" onBack={() => replace("/login")} backLabel="Back to the mobile number" />
      <View className="flex-1 gap-6 px-6 pt-4 md:px-7">
        <View className="gap-2">
          <Text role="heading" className="font-display text-title-lg text-foreground">Verify your vehicle</Text>
          <Text className="font-sans text-body-md text-text-secondary">
            Drivers need a code from their operator or cooperative before going online.
          </Text>
        </View>

        <View className="gap-4">
          <TextField
            label="Operator code"
            value={operatorCode}
            onChangeText={(t) => setOperatorCode(t)}
            autoCapitalize="characters"
            autoCorrect={false}
            helper="Your operator gives you this code. It links you to their vehicles."
            error={error ? errorCopy[error] : undefined}
          />
          <TextField
            label="Plate number"
            value={plate}
            onChangeText={setPlate}
            autoCapitalize="characters"
            autoCorrect={false}
          />
          {vehicle && (
            <SettingsRow
              icon={PathIcon}
              title="Route"
              description="Assigned by your operator"
              trailing="value"
              value={vehicle.route_name}
            />
          )}
        </View>

        {vehicle && (
          <Text className="font-sans text-body-sm text-text-secondary">
            {vehicle.label} · {vehicle.plate} · {vehicle.capacity} seats
          </Text>
        )}
      </View>

      <View className="gap-3 px-6 pb-[34px] md:px-7 md:pb-7 md:pt-8">
        {vehicle ? (
          <Button
            label="Go to my route"
            onPress={() => push("/driver")}
          />
        ) : (
          <Button
            label="Verify vehicle"
            loading={busy}
            disabled={!operatorCode.trim() || !plate.trim()}
            onPress={submit}
          />
        )}
        <Button variant="ghost" size="md" label="Log out" onPress={() => void signOut()} />
      </View>
    </OnboardingFrame>
  );
}