import { ClockIcon } from "phosphor-react-native/src/icons/Clock";
import { WarningCircleIcon } from "phosphor-react-native/src/icons/WarningCircle";
import { useEffect, useRef, useState } from "react";
import { Text, TextInput, View } from "react-native";
import { AppBar } from "../../components/AppBar";
import { Button } from "../../components/Button";
import { OtpCell } from "../../components/OtpCell";
import { useSession } from "../../data/hooks";
import { supabase } from "../../lib/supabase";
import { OnboardingFrame } from "./OnboardingFrame";
import { useNav, useQuery } from "../../lib/nav";
import colors from "../../theme/colors";

const WRONG_CODE_COPY = "That code is not right. Check the text message or send a new code.";
const RESEND_SECONDS = 60;

/** "+639174821093" -> "+63 917 482 1093" */
const pretty = (e164: string) => {
  const n = e164.replace(/^\+63/, "");
  return n.length === 10 ? `+63 ${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}` : e164;
};

const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

/**
 * Figma 04 Verify code (+ 25 wrong code). One hidden input drives the six cells, so paste works
 * and the caret is always in the right cell.
 */
export default function Verify() {
  const { replace } = useNav();
  const { phone, role } = useQuery();
  const { verifyCode, signInWithPhone } = useSession();
  const [code, setCode] = useState("");
  const [wrong, setWrong] = useState(false);
  const [checking, setChecking] = useState(false);
  const [left, setLeft] = useState(RESEND_SECONDS);
  const input = useRef<TextInput>(null);

  useEffect(() => {
    if (!phone) replace("/login");
  }, [phone, replace]);

  useEffect(() => {
    input.current?.focus();
    const id = setInterval(() => setLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, []);

  const verify = async (value = code) => {
    if (!phone || value.length !== 6) return;
    setChecking(true);
    const { error } = await verifyCode(phone, value);
    setChecking(false);
    if (error) {
      setWrong(true);
      setCode("");
      input.current?.focus();
    } else {
      if (role !== "driver") return replace("/home");
      // A driver who already verified a vehicle goes straight to the shift screen.
      const { data } = await supabase.from("drivers").select("vehicle_id").maybeSingle();
      replace(data?.vehicle_id ? "/driver" : "/driver/verify");
    }
  };

  const resend = async () => {
    if (left > 0 || !phone) return;
    setWrong(false);
    setCode("");
    await signInWithPhone(phone);
    setLeft(RESEND_SECONDS);
    input.current?.focus();
  };

  return (
    <OnboardingFrame>
      <AppBar title="" onBack={() => replace(`/login${role === "driver" ? "?role=driver" : ""}`)} backLabel="Back to the mobile number" />
      <View className="flex-1 gap-6 px-6 pt-4 md:px-0">
        <View className="gap-2">
          <Text role="heading" className="font-display text-title-lg text-foreground">Enter the 6-digit code</Text>
          <Text className="font-sans text-body-md text-text-secondary">
            We sent it to {phone ? pretty(phone) : "your number"}.
          </Text>
          <Button
            variant="ghost"
            size="md"
            label="Change number"
            className="self-start"
            onPress={() => replace(`/login${role === "driver" ? "?role=driver" : ""}`)}
          />
        </View>

        <View className="relative flex-row gap-[10px]">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <OtpCell key={i} digit={code[i]} active={!wrong && code.length === i} error={wrong} />
          ))}
          {/* The real field sits over the cells: invisible, but it holds focus and the caret. */}
          <TextInput
            ref={input}
            aria-label="6-digit code"
            value={code}
            onChangeText={(t) => {
              setWrong(false);
              const digits = t.replace(/\D/g, "").slice(0, 6);
              setCode(digits);
              if (digits.length === 6) void verify(digits);
            }}
            keyboardType="number-pad"
            inputMode="numeric"
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            maxLength={6}
            selectionColor={colors.accent}
            cursorColor={colors.accent}
            className="absolute inset-0 h-full w-full text-transparent"
            style={{ color: "transparent", backgroundColor: "transparent", outlineWidth: 0 }}
          />
        </View>

        {wrong ? (
          <View className="gap-2">
            <View className="flex-row items-start gap-[6px]" aria-live="polite">
              <WarningCircleIcon size={16} color={colors["danger-text"]} />
              <Text className="flex-1 font-sans text-body-sm text-danger-text">{WRONG_CODE_COPY}</Text>
            </View>
            <Button variant="ghost" size="md" label="Send a new code" className="self-start" onPress={resend} />
          </View>
        ) : (
          <View className="flex-row items-center gap-[6px]">
            <ClockIcon size={16} color={colors["text-muted"]} />
            <Text className="font-sans text-body-sm text-text-muted">
              {left > 0 ? `Resend code in ${clock(left)}` : "You can send a new code now."}
            </Text>
            {left === 0 && (
              <Button variant="ghost" size="md" label="Resend code" className="self-start" onPress={resend} />
            )}
          </View>
        )}
      </View>

      <View className="px-6 pb-[34px] md:px-0 md:pb-0 md:pt-8">
        <Button label="Verify number" loading={checking} disabled={code.length !== 6} onPress={() => verify()} />
      </View>
    </OnboardingFrame>
  );
}