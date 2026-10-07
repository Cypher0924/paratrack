// Checks supabase/seed.sql geometry and stop offsets. Node built-ins only: node scripts/check-seed.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const sql = readFileSync(fileURLToPath(new URL('../supabase/seed.sql', import.meta.url)), 'utf8');
const R = 6371008.8;
const rad = Math.PI / 180;
// Tarlac province plus Cabanatuan.
const BOX = { latMin: 15.2, latMax: 15.85, lngMin: 120.3, lngMax: 121.05 };
const TOL_M = 60;

const hav = (a, b) => {
  const dl = (b[1] - a[1]) * rad;
  const dg = (b[0] - a[0]) * rad;
  const h = Math.sin(dl / 2) ** 2 + Math.cos(a[1] * rad) * Math.cos(b[1] * rad) * Math.sin(dg / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};
const length = (l) => l.slice(1).reduce((s, p, i) => s + hav(l[i], p), 0);
const xy = (p, o) => [(p[0] - o[0]) * rad * R * Math.cos(o[1] * rad), (p[1] - o[1]) * rad * R];

// Nearest point on a polyline: { dist (m), along (m from line start) }
function project(line, p) {
  let best = { dist: Infinity, along: 0 };
  let cum = 0;
  for (let i = 1; i < line.length; i++) {
    const o = line[i - 1];
    const B = xy(line[i], o);
    const P = xy(p, o);
    const L = B[0] ** 2 + B[1] ** 2;
    const t = L ? Math.max(0, Math.min(1, (P[0] * B[0] + P[1] * B[1]) / L)) : 0;
    const dist = Math.hypot(P[0] - t * B[0], P[1] - t * B[1]);
    const seg = hav(line[i - 1], line[i]);
    if (dist < best.dist) best = { dist, along: cum + t * seg };
    cum += seg;
  }
  return best;
}

const errors = [];
const fail = (m) => errors.push(m);

const routes = new Map();
for (const m of sql.matchAll(
  /\/\* route (\S+) turn=(\d+) \*\/ \('([^']+)', '([^']+)', '(\w+)'::public\.vehicle_type, '[^']+', extensions\.ST_GeomFromText\('LINESTRING\(([^)]*)\)', 4326\), ([\d.]+), (\d+), ([\d.]+), ([\d.]+), ([\d.]+)\)/g,
)) {
  const line = m[6].split(',').map((s) => s.trim().split(' ').map(Number));
  routes.set(m[3], {
    slug: m[1], turn: Number(m[2]), name: m[4], type: m[5], line, lengthM: Number(m[7]),
    fare: [Number(m[9]), Number(m[10]), Number(m[11])], stops: [],
  });
}
const stops = new Map();
for (const m of sql.matchAll(/\('([^']+)', '([^']+)', extensions\.ST_GeomFromText\('POINT\(([-\d.]+) ([-\d.]+)\)', 4326\)\)/g)) {
  stops.set(m[1], { name: m[2], pt: [Number(m[3]), Number(m[4])] });
}
for (const m of sql.matchAll(/\('([^']+)', '([^']+)', (\d+), ([\d.]+)\) \/\* (out|back) \*\//g)) {
  const r = routes.get(m[1]);
  if (!r) fail(`route_stops references unknown route ${m[1]}`);
  else r.stops.push({ stopId: m[2], seq: Number(m[3]), offset: Number(m[4]), leg: m[5] });
}

if (routes.size !== 7) fail(`expected 7 routes, found ${routes.size}`);
const expectRoutes = Object.fromEntries(
  ['Tarlac-Bamban via Capas', 'Tarlac-Cabanatuan via La Paz', 'Tarlac-Gerona', 'Tarlac-La Paz', 'Tarlac-Moncada', 'Tarlac-Paniqui via Gerona', 'Tarlac-San Manuel'].map((n) => [n, ['modern', 17, 4, 2.4]]),
);
const summary = [];
for (const r of routes.values()) {
  const tag = r.name;
  const exp = expectRoutes[r.name];
  if (!exp || exp[0] !== r.type || exp.slice(1).some((v, i) => v !== r.fare[i])) fail(`${tag}: type or fare differs from the plan`);
  const n = r.line.length;
  if (n < 20 || n > 160) fail(`${tag}: ${n} points, want 20-160`);
  const [f, l] = [r.line[0], r.line.at(-1)];
  if (f[0] !== l[0] || f[1] !== l[1]) fail(`${tag}: first and last point differ`);
  const len = length(r.line);
  if (Math.abs(len - r.lengthM) > len * 0.005) fail(`${tag}: length_m ${r.lengthM} vs computed ${len.toFixed(1)}`);
  for (const [lng, lat] of r.line) {
    if (lat < BOX.latMin || lat > BOX.latMax || lng < BOX.lngMin || lng > BOX.lngMax) { fail(`${tag}: point ${lng},${lat} outside bbox`); break; }
  }
  const legs = { out: r.line.slice(0, r.turn + 1), back: r.line.slice(r.turn) };
  const legStart = { out: 0, back: length(legs.out) };
  let prev = -1;
  let prevSeq = 0;
  let lastLeg = 'out';
  if (r.stops.length < 3 || r.stops.length > 12) fail(`${tag}: ${r.stops.length} stops, want 3-12`);
  for (const s of r.stops) {
    const st = stops.get(s.stopId);
    const id = `${tag} #${s.seq} ${st?.name}`;
    if (!st) { fail(`${tag}: unknown stop ${s.stopId}`); continue; }
    if (s.seq !== prevSeq + 1) fail(`${id}: seq not consecutive`);
    prevSeq = s.seq;
    if (s.offset <= prev && !(prev < 0)) fail(`${id}: offset ${s.offset} does not increase`);
    prev = s.offset;
    if (s.offset < 0 || s.offset >= len) fail(`${id}: offset out of [0, length)`);
    if (lastLeg === 'back' && s.leg === 'out') fail(`${id}: outbound stop after a return stop`);
    lastLeg = s.leg;
    const p = project(r.line, st.pt);
    if (p.dist > TOL_M) fail(`${id}: ${p.dist.toFixed(0)} m from the line`);
    const onLeg = project(legs[s.leg], st.pt);
    if (onLeg.dist > TOL_M) fail(`${id}: ${onLeg.dist.toFixed(0)} m from its ${s.leg} leg`);
    const expected = legStart[s.leg] + onLeg.along;
    if (Math.abs(expected - s.offset) > TOL_M) fail(`${id}: offset ${s.offset} vs ${expected.toFixed(1)} on the ${s.leg} leg`);
    if (s.leg === 'back' && s.offset < legStart.back - TOL_M) fail(`${id}: return stop offset is before the return leg`);
  }
  summary.push(`${r.name.padEnd(22)} ${String(n).padStart(3)} pts  ${(len / 1000).toFixed(2).padStart(5)} km  ${r.stops.length} stops (${r.stops.filter((s) => s.leg === 'out').length} out, ${r.stops.filter((s) => s.leg === 'back').length} back)`);
}

const vehicleSql = sql.slice(sql.indexOf('insert into public.vehicles'), sql.indexOf('insert into public.vehicle_live'));
const vehicles = [...vehicleSql.matchAll(/\('[^']+', '[^']+', '[^']+', '([^']+)', '([^']+)', (\d+)\)/g)].map((m) => ({ label: m[1], plate: m[2], cap: Number(m[3]) }));
if (vehicles.length !== 16) fail(`expected 16 vehicles, found ${vehicles.length}`);
if (new Set(vehicles.map((v) => v.plate)).size !== vehicles.length) fail('duplicate plates');
if (new Set(vehicles.map((v) => v.label)).size !== vehicles.length) fail('duplicate labels');
for (const v of vehicles) {
  if (!/^[A-Z]{3} \d{4}$/.test(v.plate)) fail(`${v.label}: plate ${v.plate} is not AAA 0000`);
  if (v.cap !== 22) fail(`${v.label}: capacity ${v.cap}`);
}

console.log(summary.join('\n'));
console.log(`${stops.size} stops, ${vehicles.length} vehicles`);
if (errors.length) {
  console.error(`\n${errors.length} problem(s):\n- ${errors.join('\n- ')}`);
  process.exit(1);
}
console.log('seed OK');
