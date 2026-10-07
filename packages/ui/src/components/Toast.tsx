import { Pressable, Text, View } from "react-native";

/** Short message pinned to the bottom of its positioned parent, with an optional action. Caller clears it. */
export function Toast({ message, action }: { message: string; action?: { label: string; onPress: () => void } }) {
  return (
    <View role="status" pointerEvents="box-none" className="absolute inset-x-4 bottom-6 z-50 items-center">
      <View className="w-full max-w-[400px] flex-row items-center gap-3 rounded-control bg-foreground px-4 py-3 shadow-floating">
        <Text className="flex-1 font-sans text-body-sm text-surface">{message}</Text>
        {action && (
          <Pressable role="button" onPress={action.onPress} className="min-h-[32px] justify-center">
            <Text className="font-sans-medium text-body-sm text-surface underline">{action.label}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
