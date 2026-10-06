import { expect, it } from "vitest";
import { cn } from "./cn";

it("keeps custom text sizes next to text colors and merges custom tokens", () => {
  expect(cn("text-title-md text-foreground")).toBe("text-title-md text-foreground");
  expect(cn("text-body-sm", "text-caption")).toBe("text-caption");
  expect(cn("rounded-control", "rounded-pill")).toBe("rounded-pill");
  expect(cn("p-4", "p-space-2")).toBe("p-space-2");
  expect(cn("h-control-md", "h-control-lg")).toBe("h-control-lg");
});
