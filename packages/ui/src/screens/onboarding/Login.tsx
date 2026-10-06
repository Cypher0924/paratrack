import { useEffect, useRef, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { AppBar } from "../../components/AppBar";
import { Button } from "../../components/Button";
import { OnboardingFrame } from "./OnboardingFrame";
import { useNav, useQuery } from "../../lib/nav";
import { useSession } from "../../data/hooks";
import { parsePhMobile } from "@repo/core";
import colors from "../../theme/colors";

const INVALID_COPY = "Enter 10 digits after +63, like 917 482 1093";
const SEND_FAILED_COPY = "We could not send a code to that number. Check it and try again.";

/** Groups the national part as 917 482 1093 while the field is being typed. */
const group = (digits: string) => {
  const d = digits.slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
};

/**
 * Figma 03 Mobile number (+ 24 error). Commuter and driver share this screen; `?role=driver`
 * sends success to `/driver/verify` instead of `/home`.
 */
export default function Login() {
  const { push, replace } = useNav();
  const { role } = useQuery();
  const { signInWithPhone } = useSession();
  const [digits, setDigits] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const input = useRef<TextInput>(null);

  useEffect(() => {
    input.current?.focus();
  }, []);

  const send = async () => {
    const e164 = parsePhMobile(digits);
    if (!e164) return setError(INVALID_COPY);
    setError(null);
    setSending(true);
    const failure = await signInWithPhone(e164);
    setSending(false);
    // Non-test numbers are refused by the server, so a send failure is an expected path.
    if (failure) setError(SEND_FAILED_COPY);
    else push(`/login/verify?phone=${encodeURIComponent(e164)}${role === "driver" ? "&role=driver" : ""}`);
  };

  return (
    <OnboardingFrame>
      <AppBar title="" onBack={() => replace("/")} backLabel="Back to welcome" />
      <View className="flex-1 gap-6 px-6 pt-4 md:px-7">
        <View className="gap-2">
          <Text role="heading" className="font-display text-title-lg text-foreground">Add your mobile number</Text>
          <Text className="font-sans text-body-md text-text-secondary">
            We will text you a 6-digit code to confirm it is you.
          </Text>
        </View>

        <View className="gap-2">
          <Text className="font-sans-medium text-body-sm text-foreground">Mobile number</Text>
          {/* The border carries the focus and error states, so the input has no outline. */}
          <Pressable
            onPress={() => input.current?.focus()}
            className={`h-control-lg flex-row items-center gap-[10px] overflow-hidden rounded-control bg-surface px-4 ${
              error ? "border-[1.5px] border-danger" : "border border-border-strong"
            }`}
          >
            <Text className="font-sans text-body-md text-foreground">+63</Text>
            <TextInput
              ref={input}
              aria-label="Mobile number"
              value={group(digits)}
              onChangeText={(t) => {
                setDigits(t.replace(/\D/g, ""));
                setError(null);
              }}
              onSubmitEditing={send}
              keyboardType="number-pad"
              inputMode="numeric"
              autoComplete="tel"
              returnKeyType="send"
              placeholderTextColor={colors["text-muted"]}
              selectionColor={colors.accent}
              cursorColor={colors.accent}
              className="flex-1 self-stretch font-sans text-body-md text-foreground"
              style={{ outlineWidth: 0 }}
            />
          </Pressable>
          {error && (
            <View className="flex-row items-center gap-[6px]" aria-live="polite">
              <Text className="flex-1 font-sans text-body-sm text-danger-text">{error}</Text>
            </View>
          )}
        </View>

        <Text className="font-sans text-body-sm text-text-secondary">
          By continuing, you agree to the{" "}
          <Text
            aria-label="Terms of Service"
            className="font-sans-medium text-body-sm text-accent"
            onPress={() => push("/terms")}
          >
            Terms of Service
          </Text>{" "}
          and{" "}
          <Text
            aria-label="Privacy Policy"
            className="font-sans-medium text-body-sm text-accent"
            onPress={() => push("/privacy")}
          >
            Privacy Policy
          </Text>
          .
        </Text>
      </View>

      <View className="px-6 pb-[34px] md:px-7 md:pb-7 md:pt-8">
        <Button label="Send code" loading={sending} onPress={send} />
      </View>
    </OnboardingFrame>
  );
}