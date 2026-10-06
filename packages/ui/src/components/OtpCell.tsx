import { Text, View } from "react-native";
import { cn } from "../lib/cn";

export type OtpCellProps = {
  digit?: string;
  /** The cell that receives the next digit. Shows the caret. */
  active?: boolean;
  error?: boolean;
  className?: string;
};

/** Figma Feedback / OTP cell. Visual only, the code screen owns the input. */
export function OtpCell({ digit, active = false, error = false, className }: OtpCellProps) {
  return (
    <View
      className={cn(
        "h-[56px] w-[48px] flex-row items-center justify-center gap-[2px] rounded-sm bg-surface",
        error
          ? "border-[1.5px] border-danger"
          : active
            ? "border-[1.5px] border-foreground"
            : "border border-border-strong",
        className,
      )}
    >
      {digit ? <Text className="font-sans-medium text-title-md text-foreground">{digit}</Text> : null}
      {active && <View className="h-[24px] w-[1.5px] bg-accent" />}
    </View>
  );
}
