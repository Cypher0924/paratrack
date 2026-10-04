import * as React from "react";
import { Pressable } from "react-native";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./lib";
import { TextClassContext } from "./text";

// Adapted from React Native Reusables `button` (copied by hand, CLI is interactive and app-oriented).
const buttonVariants = cva(
  "flex-row items-center justify-center gap-2 rounded-md",
  {
    variants: {
      variant: {
        default: "bg-accent active:opacity-90",
        outline: "border border-accent bg-white active:opacity-90",
      },
      size: { default: "h-10 px-4 py-2", lg: "h-11 px-8" },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

const buttonTextVariants = cva("text-sm font-medium", {
  variants: {
    variant: { default: "text-white", outline: "text-accent" },
  },
  defaultVariants: { variant: "default" },
});

export type ButtonProps = React.ComponentProps<typeof Pressable> &
  VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <TextClassContext.Provider value={buttonTextVariants({ variant })}>
      <Pressable
        role="button"
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    </TextClassContext.Provider>
  );
}
