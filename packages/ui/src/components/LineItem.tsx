import { Text, View } from "react-native";
import { cn } from "../lib/cn";

export type LineItemProps = {
  kind?: "item" | "discount" | "total";
  label: string;
  /** Formatted amount, for example "₱15.00" or "−₱4.23". */
  amount: string;
};

/** Figma Line item 2017:204: one row of a fare breakdown. */
export function LineItem({ kind = "item", label, amount }: LineItemProps) {
  if (kind === "total") {
    return (
      <View className="w-full flex-row items-center gap-3 border-t border-border py-4">
        <Text className="flex-1 font-sans-medium text-body-md text-foreground">{label}</Text>
        <Text className="font-sans-medium text-title-md text-foreground">{amount}</Text>
      </View>
    );
  }
  return (
    <View className="w-full flex-row items-center gap-3 py-[10px]">
      <Text className="flex-1 font-sans text-body-md text-text-secondary">{label}</Text>
      <Text className={cn("font-sans text-body-md", kind === "discount" ? "text-success-text" : "text-foreground")}>
        {amount}
      </Text>
    </View>
  );
}
