import * as React from "react";
import { View } from "react-native";
import Animated from "react-native-reanimated";
import { cssInterop } from "nativewind";
import { Bus } from "phosphor-react-native";
import { Button } from "./button";
import { Text } from "./text";

// Reanimated components are not wrapped by NativeWind automatically
const AnimatedView = Animated.createAnimatedComponent(View);
cssInterop(AnimatedView, { className: "style" });

export function SpikeCard() {
  const [open, setOpen] = React.useState(false);
  return (
    <View className="w-80 gap-3">
      <AnimatedView
        testID="spike-card"
        className="items-center justify-center rounded-lg"
        style={{
          backgroundColor: open ? "#42A5F5" : "#1565C0",
          height: open ? 160 : 80,
          transitionProperty: ["backgroundColor", "height"],
          transitionDuration: 400,
        }}
      >
        <Text className="text-white">{open ? "Live (expanded)" : "Idle (collapsed)"}</Text>
      </AnimatedView>
      <Button onPress={() => setOpen((o) => !o)}>
        <Bus size={20} color="#fff" weight="fill" />
        <Text>Toggle</Text>
      </Button>
    </View>
  );
}
