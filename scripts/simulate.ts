// Demo simulator: signs in demo drivers, verifies them onto vehicles, then drives each along its route
// through the real driver API. Run with `npm run simulate`. Node 24 strips the types, so no tsx.
// SIM_BASE_URL picks the API (default http://localhost:3000). Ctrl+C ends every shift.
import { existsSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

// Same files Vitest reads. Variables already set in the shell win, and nothing is printed.
for (const f of ["../apps/web/.env.local", "../.env"]) {
  const p = path.resolve(import.meta.dirname, f);
  if (existsSync(p)) process.loadEnvFile(p);
}
const need = (name: string) => {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name}. Set it in apps/web/.env.local or the root .env`);
  return v;
};

const BASE = (process.env.SIM_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const TICK_MS = 4000;
const SPEED_MPS = 9;

const DEMO = [
  { phone: "+639000000016", code: "TMP-5826", plate: "TMB 2417" },
  { phone: "+639000000017", code: "ZRM-3174", plate: "ZRM 3351" },
  { phone: "+639000000018", code: "NTM-6409", plate: "NPQ 5528" },
  { phone: "+639000000019", code: "NTM-6409", plate: "NSM 1974" },
];

type LngLat = [number, number];

const R = 6371008.8;
const rad = (d: number) => (d * Math.PI) / 180;
const dist = (a: LngLat, b: LngLat) => {
  const h = Math.sin(rad(b[1] - a[1]) / 2) ** 2 + Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(rad(b[0] - a[0]) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};
const bearing = (a: LngLat, b: LngLat) => {
  const y = Math.sin(rad(b[0] - a[0])) * Math.cos(rad(b[1]));
  const x = Math.cos(rad(a[1])) * Math.sin(rad(b[1])) - Math.sin(rad(a[1])) * Math.cos(rad(b[1])) * Math.cos(rad(b[0] - a[0]));
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
};

/** Cumulative distance of each vertex along the line. */
const cumulative = (line: LngLat[]) => {
  const out = [0];
  for (let i = 1; i < line.length; i++) out.push(out[i - 1]! + dist(line[i - 1]!, line[i]!));
  return out;
};

/** The point `m` meters along the line (wrapping, routes are loops) and the heading there. */
const along = (line: LngLat[], cum: number[], m: number) => {
  const total = cum[cum.length - 1]!;
  const d = ((m % total) + total) % total;
  let i = 1;
  while (i < cum.length - 1 && cum[i]! < d) i++;
  const a = line[i - 1]!;
  const b = line[i]!;
  const seg = cum[i]! - cum[i - 1]!;
  const t = seg === 0 ? 0 : (d - cum[i - 1]!) / seg;
  return { point: [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t] as LngLat, heading: bearing(a, b) };
};

const url = need("NEXT_PUBLIC_SUPABASE_URL");
const key = need("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
const otp = need("SUPABASE_AUTH_TEST_OTP");

const newClient = () => createClient(url, key, { auth: { persistSession: false, autoRefreshToken: true } });
type Client = ReturnType<typeof newClient>;

const post = async (client: Client, route: string, body: unknown) => {
  const { data } = await client.auth.getSession();
  const res = await fetch(`${BASE}/api/driver/${route}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token}` },
    body: JSON.stringify(body),
  });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) throw new Error(`${route} ${res.status} ${String(json.error ?? "")}`);
  return json;
};

type Sim = {
  name: string;
  client: Client;
  line: LngLat[];
  cum: number[];
  stops: number[]; // meters along the line
  capacity: number;
  meters: number;
  seats: number;
  nextStop: number;
};

async function setup(d: (typeof DEMO)[number], routes: Map<string, { line: LngLat[]; stops: number[] }>) {
  const client = newClient();
  const sent = await client.auth.signInWithOtp({ phone: d.phone });
  if (sent.error) throw new Error(`${d.phone}: ${sent.error.message}`);
  const v = await client.auth.verifyOtp({ phone: d.phone, token: otp, type: "sms" });
  if (v.error) throw new Error(`${d.phone}: ${v.error.message}`);
  const ver = await client.rpc("verify_driver", { p_operator_code: d.code, p_plate: d.plate });
  if (ver.error) throw new Error(`${d.plate}: ${ver.error.message}`);
  const info = ver.data as { route_id: string; capacity: number };
  const started = await client.rpc("start_shift");
  if (started.error) throw new Error(`${d.plate}: ${started.error.message}`);
  const r = routes.get(info.route_id);
  if (!r) throw new Error(`${d.plate}: route not found`);
  const cum = cumulative(r.line);
  // Spread vehicles on the same route around the loop.
  const meters = (cum[cum.length - 1]! * DEMO.indexOf(d)) / DEMO.length;
  return { name: d.plate, client, line: r.line, cum, stops: r.stops, capacity: info.capacity, meters, seats: 0, nextStop: 0 } satisfies Sim;
}

async function loadRoutes() {
  const sb = newClient();
  const [routes, links, stops] = await Promise.all([
    sb.from("routes").select("id, geom"),
    sb.from("route_stops").select("route_id, stop_id, offset_m"),
    sb.from("stops").select("id"),
  ]);
  if (routes.error || links.error || stops.error) throw new Error("Could not read routes");
  const map = new Map<string, { line: LngLat[]; stops: number[] }>();
  for (const r of routes.data) {
    const line = (r.geom as { coordinates: LngLat[] } | null)?.coordinates ?? [];
    const offsets = links.data.filter((l) => l.route_id === r.id).map((l) => l.offset_m).sort((a, b) => a - b);
    map.set(r.id, { line, stops: offsets });
  }
  return map;
}

const sims: Sim[] = [];
let stopping = false;

async function tick(s: Sim) {
  const before = s.meters;
  s.meters += SPEED_MPS * (TICK_MS / 1000);
  const { point, heading } = along(s.line, s.cum, s.meters);
  await post(s.client, "ping", { lat: point[1], lng: point[0], speed: SPEED_MPS, heading, accuracy: 6 });

  // Passing a stop changes the seat count: some get off, some get on.
  const total = s.cum[s.cum.length - 1]!;
  const crossed = s.stops.some((m) => {
    const a = before % total;
    const b = s.meters % total;
    return a <= b ? m > a && m <= b : m > a || m <= b;
  });
  if (crossed) {
    const off = Math.floor(Math.random() * 4);
    const on = Math.floor(Math.random() * 5);
    s.seats = Math.min(s.capacity, Math.max(0, s.seats - off + on));
    await post(s.client, "seats", { count: s.seats });
    console.log(`${s.name}: stop, ${s.seats}/${s.capacity} seats`);
  }
}

async function main() {
  const routes = await loadRoutes();
  for (const d of DEMO) {
    try {
      sims.push(await setup(d, routes));
      console.log(`${d.plate}: online`);
    } catch (e) {
      console.error(`${d.plate}: skipped, ${(e as Error).message}`);
    }
  }
  if (sims.length === 0) throw new Error("No driver started");

  let n = 0;
  const loop = setInterval(() => {
    if (stopping) return;
    n++;
    Promise.allSettled(sims.map((s) => tick(s))).then((rs) => {
      const bad = rs.flatMap((r, i) => (r.status === "rejected" ? [`${sims[i]!.name} ${(r.reason as Error).message}`] : []));
      console.log(`tick ${n}: ${rs.length - bad.length}/${rs.length} pings ok${bad.length ? `, failed: ${bad.join("; ")}` : ""}`);
    });
  }, TICK_MS);

  const stop = async () => {
    if (stopping) return;
    stopping = true;
    clearInterval(loop);
    console.log("\nGoing offline...");
    await Promise.allSettled(sims.map((s) => post(s.client, "offline", {})));
    process.exit(0);
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
}

main().catch((e) => {
  console.error((e as Error).message);
  process.exit(1);
});
