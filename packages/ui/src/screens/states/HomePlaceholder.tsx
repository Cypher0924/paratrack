import { Text, View } from "react-native";
import { Logo } from "../../components/Brand";
import { Button } from "../../components/Button";
import { useSessionGuard } from "../../lib/session";
import { useSession } from "../../data/hooks";

/**
 * Placeholder for Figma 06 Home, so the onboarding flow has somewhere to land and its e2e can
 * assert the end of the login. Task 7 (map screens) replaces this file with the real Home:
 * the map, the arrival sheet and the tab bar. It holds no data of its own on purpose.
 */
export default function Home() {
  const { ready } = useSessionGuard("in");
  const { signOut } = useSession();
  if (!ready) return null;
  return (
    <View className="h-full w-full flex-1 items-center justify-center gap-4 bg-background px-6">
      <Logo height={36} />
      <Text role="heading" className="font-display text-title-lg text-center text-foreground">You are signed in</Text>
      <Text className="text-center font-sans text-body-md text-text-secondary">
        The commuter home, with the live map, arrives with the map screens.
      </Text>
      <Button variant="secondary" label="Log out" className="mt-2" onPress={() => void signOut()} />
    </View>
  );
}