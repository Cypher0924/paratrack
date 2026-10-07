// PostToolUse (Edit|Write): flag unitless Tailwind arbitrary values in .tsx.
// Hermes compiled `border-[1.5]` to `border-color: 1.5`, so sizes need a unit.
import { readFileSync } from "node:fs";

const input = JSON.parse(readFileSync(0, "utf8"));
const file = input.tool_input?.file_path ?? "";
if (!file.endsWith(".tsx")) process.exit(0);

const re = /\b(?:border(?:-[xytrbl])?|w|h|min-[wh]|max-[wh]|size|gap(?:-[xy])?|p[xytrbl]?|m[xytrbl]?|top|left|right|bottom|inset(?:-[xy])?|rounded(?:-[a-z]+)?|text|tracking)-\[-?[0-9.]+\]/g;
const hits = readFileSync(file, "utf8")
  .split("\n")
  .flatMap((line, i) => (line.match(re) ?? []).map((m) => `${i + 1}: ${m}`));

if (hits.length) {
  console.error(`Unitless Tailwind arbitrary values in ${file} (add px, e.g. border-[1.5px]):\n${hits.join("\n")}`);
  process.exit(2);
}
