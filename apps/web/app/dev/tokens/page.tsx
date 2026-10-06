import preset from "@repo/ui/src/theme/preset";

const colors = Object.entries(preset.theme!.extend!.colors as Record<string, string>);

// Literal class names so Tailwind's scanner sees them.
const sizes = [
  ["title-md", "text-title-md"],
  ["title-sm", "text-title-sm"],
  ["body-md", "text-body-md"],
  ["body-sm", "text-body-sm"],
  ["caption", "text-caption"],
  ["map-label", "text-map-label"],
] as const;
const radii = [
  ["xs", "rounded-xs"],
  ["sm", "rounded-sm"],
  ["md", "rounded-md"],
  ["control", "rounded-control"],
  ["panel", "rounded-panel"],
  ["surface", "rounded-surface"],
  ["pill", "rounded-pill"],
] as const;
const shadows = [
  ["raised", "shadow-raised"],
  ["sheet", "shadow-sheet"],
  ["floating", "shadow-floating"],
] as const;

export default function Tokens() {
  return (
    <main className="mx-auto max-w-3xl p-5">
      <h1 className="text-title-md font-sans-medium">Tokens</h1>

      <h2 className="mt-5 text-title-sm font-sans-medium">Colors</h2>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {colors.map(([name, hex]) => (
          <div key={name} className="flex items-center gap-2 text-caption">
            <div
              data-swatch={name}
              className="h-control-md w-control-md shrink-0 rounded-xs border border-border"
              style={{ backgroundColor: hex }}
            />
            <div>
              <div className="font-sans-medium">{name}</div>
              <div className="text-text-muted">{hex}</div>
            </div>
          </div>
        ))}
      </div>

      <h2 className="mt-5 text-title-sm font-sans-medium">Type</h2>
      <div className="mt-2 flex flex-col gap-2">
        {sizes.map(([s, cls]) => (
          <div key={s} className="flex items-baseline gap-3">
            <span className="w-24 text-caption text-text-muted">{s}</span>
            <span className={`${cls} font-sans`}>Bus to SM City</span>
            <span className={`${cls} font-sans-medium`}>Medium</span>
          </div>
        ))}
      </div>

      <h2 className="mt-5 text-title-sm font-sans-medium">Radii</h2>
      <div className="mt-2 flex flex-wrap gap-3">
        {radii.map(([r, cls]) => (
          <div
            key={r}
            className={`flex h-control-lg w-20 items-center justify-center bg-accent-subtle text-caption ${cls}`}
          >
            {r}
          </div>
        ))}
      </div>

      <h2 className="mt-5 text-title-sm font-sans-medium">Shadows</h2>
      <div className="mt-2 flex flex-wrap gap-5 bg-surface-muted p-5">
        {shadows.map(([s, cls]) => (
          <div
            key={s}
            className={`flex h-16 w-28 items-center justify-center rounded-md bg-surface text-caption ${cls}`}
          >
            {s}
          </div>
        ))}
      </div>
    </main>
  );
}
