import { MagnifyingGlassIcon } from "phosphor-react-native/src/icons/MagnifyingGlass";
import { Pressable, Text } from "react-native";
import { cn } from "../lib/cn";
import colors from "../theme/colors";

export type SearchBarProps = {
  placeholder?: string;
  onPress?: () => void;
  className?: string;
};

/** Figma Search bar 2014:200. Floats over the map and opens the route search, so it is a button, not an input. */
export function SearchBar({ placeholder = "Where to?", onPress, className }: SearchBarProps) {
  return (
    <Pressable
      role="button"
      aria-label={`Search routes. ${placeholder}`}
      onPress={onPress}
      className={cn(
        "h-[52px] w-full flex-row items-center gap-3 rounded-control border border-border-subtle bg-surface px-4 shadow-raised",
        className,
      )}
    >
      <MagnifyingGlassIcon size={20} color={colors["text-secondary"]} />
      <Text className="flex-1 font-sans text-body-md text-text-muted">{placeholder}</Text>
    </Pressable>
  );
}
