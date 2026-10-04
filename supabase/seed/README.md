# Tarlac City seed

`supabase/seed.sql` seeds 3 operators, 5 routes, 29 stops, 8 vehicles, offline `vehicle_live` rows and 1 announcement. It is idempotent (fixed UUIDs, `on conflict do nothing`). Operator codes are dev-only demo values. Check it with `node scripts/check-seed.mjs` (Node built-ins only).

## How the geometry was made

All coordinates come from OpenStreetMap (ODbL), not hand-drawn.

1. Place coordinates (SM City Tarlac, Provincial Capitol, City Hall, public market, TSU, bus terminals, barangays) came from one Overpass query over the Tarlac City bounding box:

   ```
   [out:json][timeout:60][bbox:15.40,120.52,15.56,120.68];
   (
   nwr["name"~"SM City Tarlac|Metrotown|Provincial Capitol|Tarlac State University|City Hall|Robinsons|Public Market|Tarlac Capitol",i];
   way["highway"]["name"~"Romulo|MacArthur|Zamora|Rizal|Tañedo|Burgos|Aguinaldo",i];
   );
   out center tags qt;
   ```

   A second query listed `place`, terminal, gate, San Nicolas and Capitol names in the same bbox. Nominatim was used to confirm City Hall.
2. Street-following paths came from the public OSRM demo server (`router.project-osrm.org/route/v1/driving`, OSM data, `overview=full&geometries=geojson`), one request per leg. Each route is an outbound leg through a few waypoints and a separate return leg, so one-way streets give a different return path.
3. The two legs were joined (return start = outbound end, last point = first point exactly) and each leg was simplified with Douglas-Peucker. The tolerance is the smallest value that keeps the loop at 75 points or fewer: 1 to 2 m for the short routes and 9 m for Tarlac-Clark.
4. Stops sit on the simplified line. `offset_m` is the haversine distance along the line from the start to the stop's projection on its own leg. Return-leg stops (marked `/* back */`) therefore have larger offsets than every outbound stop. The `turn=N` comment on each route is the vertex index where the return leg starts, and the check script uses it.

Waypoints (lng,lat) per leg:

| Route | Out | Back |
|---|---|---|
| Downtown-SM | 120.5918,15.4895 > 120.5946,15.4776 | reverse |
| Capitol-SM | 120.5880,15.4803 > 120.5863,15.4863 > 120.5946,15.4776 | 120.5946,15.4776 > 120.5880,15.4803 |
| San Nicolas-Downtown | 120.5953,15.4925 > 120.5899,15.4869 > 120.5925,15.4823 | 120.5925,15.4823 > 120.5953,15.4925 |
| Tarlac-Clark | 120.5937,15.4963 > 120.5990,15.4045 | reverse |
| Campus Loop | 120.5873,15.4852 > 120.5880,15.4803 > 120.5869,15.4783 | 120.5869,15.4783 > 120.5873,15.4852 |

## Judgment calls

- Metrotown was not found in OSM (Overpass and Nominatim). Its stop is a placeholder on MacArthur Hwy, about 35% along the outbound leg. Move it once the real location is known.
- Stops named by fraction along a leg (Burgos St, Juan Luna St, MacArthur Hwy, San Miguel and others) take their name from the OSRM street at that spot. Stops with an explicit place (SM City, Capitol, City Hall, Main Gate, Rizal Ave, San Nicolas, Tarlac Terminal) use the OSM place location snapped to the line.
- `route_stops` has `unique(route_id, stop_id)`, so a stop cannot serve both legs. Return-leg stops are different stops (for example `Metrotown (return)`).
- Tarlac-Clark turns around at about 15.4045, 120.599 on MacArthur Hwy, at the city's southern edge. It is the only route exempt from the bbox check.
- Fares and headways are the plan's values. Plates other than `NBC 4821` and `NAK 2290` are invented placeholders.
- `routes.length_m` is recomputed by the migration trigger. The seed value is a spherical haversine sum.
