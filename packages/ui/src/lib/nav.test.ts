import { readFileSync } from "node:fs";
import { expect, it } from "vitest";

const names = (f: string) =>
  [...readFileSync(`${__dirname}/${f}`, "utf8").matchAll(/export function (\w+)/g)]
    .map((m) => m[1])
    .sort();

it("nav.web and nav.native export the same names", () => {
  expect(names("./nav.web.ts")).toEqual(names("./nav.native.ts"));
  expect(names("./nav.web.ts")).toEqual(["useNav", "useParams"]);
});
