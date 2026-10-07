# Tarlac seed

`supabase/seed.sql` seeds 3 operators, 7 modern jeepney (modern PUJ) routes from the Tarlac City terminal, 27 stops, 16 vehicles, offline `vehicle_live` rows and 1 announcement. It is idempotent (fixed UUIDs `a1/b1/c1/d1`, `on conflict do nothing`). Check it with `node scripts/check-seed.mjs` (Node built-ins only).

The previous invented seed (Downtown-SM, Capitol-SM and others, UUIDs `a0/b0/c0/d0`) is removed by `supabase/seed/replace-2026-10-07.sql`. Run that once per database before this seed. It only touches the old ids.

## Routes

Research: local transport inside the city is mostly tricycles. Modern PUJ routes are registered from Tarlac City, with these unit counts:

| Route | Units | Stops (out leg) |
|---|---|---|
| Tarlac-Bamban via Capas | 35 | Tarlac Terminal, Robinsons Supermarket, San Rafael Barangay Hall, Capas, Bamban Municipal Hall |
| Tarlac-Cabanatuan via La Paz | 40 | Tarlac Terminal, Metro Town Mall, Maliwalo Barangay Hall, Amucao Multipurpose Hall, La Paz Municipal Hall, Zaragoza, Santa Rosa, Cabanatuan Central Terminal |
| Tarlac-Gerona | 15 | Tarlac Terminal, Salapungan Barangay Hall, Parsolingan, Gerona Municipal Hall |
| Tarlac-La Paz | 10 | Tarlac Terminal, Metro Town Mall, Maliwalo Barangay Hall, Amucao Multipurpose Hall, La Paz Municipal Hall |
| Tarlac-Moncada | 13 | Tarlac Terminal, Salapungan Barangay Hall, Parsolingan, Moncada Public Plaza |
| Tarlac-Paniqui via Gerona | 18 | Tarlac Terminal, Salapungan Barangay Hall, Parsolingan, Gerona Municipal Hall, Paniqui Town Hall |
| Tarlac-San Manuel | 17 | Tarlac Terminal, Salapungan Barangay Hall, Parsolingan, San Manuel |

Each route also has 2 or 3 `(return)` stops on the back leg. Fare is the LTFRB modern jeepney fare: PHP 17 for the first 4 km, PHP 2.40 per succeeding km (`base_fare 17, base_km 4, per_km 2.40`). Discounts stay in `packages/core`.

## How the geometry was made

All coordinates come from OpenStreetMap (ODbL).

1. Places came from Overpass queries. The origin is the OSM way "Tarlac City Transport Terminal" (`amenity=bus_station`, network `PUB;PUJ`, San Nicolas), shared by all 7 routes. Destinations are the OSM town hall or plaza: Bamban, Gerona, La Paz and Paniqui town halls, Moncada Public Plaza and the Cabanatuan City Central Terminal. In-city stops are OSM places within 60 m of the routed path, taken from one bbox query (`15.38,120.50,15.57,120.75`) for named amenities, shops, parks, places and tourism, then filtered by distance to each path.
2. Street-following paths came from the public OSRM demo server (`router.project-osrm.org/route/v1/driving`, `overview=full&geometries=geojson`). Each route is an out leg through the named towns (Capas for Bamban, La Paz, Zaragoza and Santa Rosa for Cabanatuan, Gerona for Paniqui) and a separate back leg with reversed waypoints, so one-way streets give a different back path. Town waypoints are OSM town halls where mapped, otherwise the Nominatim town center (Capas, Zaragoza, Santa Rosa).
3. The legs were joined (back start = out end, last point = first point exactly) and simplified with Douglas-Peucker. The tolerance per route is the smallest whole-meter value that keeps the loop at 150 points or fewer: 3 m for Gerona and La Paz up to 16 m for Cabanatuan.
4. `offset_m` is the haversine distance along the line to the stop's projection on its own leg. Back leg stops (marked `/* back */`) come after the turn. The `turn=N` comment on each route is the vertex index where the back leg starts. Stops keep their real OSM coordinates, so they sit up to 57 m from the simplified line (the check allows 60 m).
5. Headway = round trip time / unit count, where round trip time is 2 x route length at 25 km/h, with a 5 min minimum. Result: Bamban 5, Cabanatuan 6, Gerona 5, La Paz 9, Moncada 11, Paniqui 6, San Manuel 10. It assumes every registered unit runs at once, so real headways are likely longer.

## Approximate or placeholder

- In-city streets are OSRM's driving path. No source gives the actual streets or stops, so every path and stop position is approximate. Correct them with rider and driver knowledge.
- Stops are landmarks the path passes, not confirmed loading points. Capas, Zaragoza and Santa Rosa are Nominatim town centers.
- "San Manuel" has no mapped town hall or plaza in OSM. Its point is on MacArthur Hwy at the OSM San Manuel Municipal Police Station.
- The terminal point is the OSM way center, about 25 m from the routed road.
- Operators: only "Zaragoza Ramstar Transport Service Cooperative" (Cabanatuan) is a known real name. "Tarlac Modern PUJ Cooperative" and "Northern Tarlac Modern PUJ Cooperative" are placeholders. Operator codes (`TMP-5826`, `ZRM-3174`, `NTM-6409`) are dev demo values.
- Vehicles are 2 or 3 per route, labeled `<Town> NN`, capacity 22, with invented plates.
- The announcement ("Last Cabanatuan trip leaves at 8:00 PM") is a placeholder.
- `routes.length_m` is recomputed by the migration trigger. The seed value is a spherical haversine sum.
- `route_stops` has `unique(route_id, stop_id)`, so back leg stops are separate stops named `... (return)`.
