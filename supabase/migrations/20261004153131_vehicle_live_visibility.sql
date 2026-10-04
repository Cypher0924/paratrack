-- Offline vehicles stay readable, so Realtime delivers the update that takes them offline,
-- but they keep no location. drivers (vehicle_id is unique) now says who drives each vehicle.

-- Any write that sets a vehicle offline (end_shift, the stale-vehicles job, the seed) clears its location.
create function public.clear_offline_location()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not new.online then
    new.lat := null;
    new.lng := null;
    new.heading := null;
    new.accuracy := null;
    new.speed_mps := 0;
    new.progress_m := 0;
  end if;
  return new;
end;
$$;

revoke execute on function public.clear_offline_location() from public, anon, authenticated;

create trigger vehicle_live_clear_offline
  before insert or update on public.vehicle_live
  for each row execute function public.clear_offline_location();

update public.vehicle_live set online = false where not online;

drop policy "Anyone reads online vehicles" on public.vehicle_live;
create policy "Anyone reads vehicle status" on public.vehicle_live for select to anon, authenticated using (true);

alter table public.vehicle_live drop column driver_id;

-- Driver functions now find the caller's vehicle through drivers. Signatures and grants are unchanged.

create or replace function public.verify_driver(p_operator_code text, p_plate text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_vehicle record;
begin
  if v_uid is null or auth.jwt() ->> 'is_anonymous' = 'true' then
    raise exception 'phone_required';
  end if;

  if (
    select count(*) from public.driver_verify_attempts a
    where a.user_id = v_uid and a.created_at > now() - interval '1 hour'
  ) >= 5 then
    raise exception 'too_many_attempts';
  end if;

  select v.id, v.operator_id, v.label, v.plate, v.capacity, v.route_id, r.name as route_name
  into v_vehicle
  from public.vehicles v
  join public.operators o on o.id = v.operator_id
  join public.routes r on r.id = v.route_id
  where o.code = p_operator_code
    and upper(regexp_replace(v.plate, '[\s-]', '', 'g')) = upper(regexp_replace(p_plate, '[\s-]', '', 'g'));

  if not found then
    insert into public.driver_verify_attempts (user_id) values (v_uid);
    -- A raise would roll the attempt back, so answer with PostgREST's error status and body instead.
    -- supabase-js reports it like a raised error: error.message = 'invalid_code_or_plate'.
    perform set_config('response.status', '400', true);
    return jsonb_build_object('code', 'P0001', 'message', 'invalid_code_or_plate', 'details', null, 'hint', null);
  end if;

  -- Another driver is sharing this vehicle's location right now.
  if exists (
    select 1
    from public.drivers d
    join public.vehicle_live l on l.vehicle_id = d.vehicle_id
    where d.vehicle_id = v_vehicle.id
      and d.user_id <> v_uid
      and l.online
      and l.updated_at > now() - interval '5 minutes'
  ) then
    raise exception 'vehicle_in_use';
  end if;

  -- Switching vehicles takes the old one offline.
  update public.vehicle_live l set online = false
  from public.drivers d
  where d.user_id = v_uid and l.vehicle_id = d.vehicle_id and d.vehicle_id <> v_vehicle.id and l.online;

  -- One driver per vehicle: verifying moves the vehicle to the caller.
  delete from public.drivers d where d.vehicle_id = v_vehicle.id and d.user_id <> v_uid;
  insert into public.drivers (user_id, operator_id, vehicle_id, verified_at)
  values (v_uid, v_vehicle.operator_id, v_vehicle.id, now())
  on conflict (user_id) do update
    set operator_id = excluded.operator_id, vehicle_id = excluded.vehicle_id, verified_at = excluded.verified_at;

  return jsonb_build_object(
    'vehicle_id', v_vehicle.id,
    'label', v_vehicle.label,
    'plate', v_vehicle.plate,
    'capacity', v_vehicle.capacity,
    'route_id', v_vehicle.route_id,
    'route_name', v_vehicle.route_name
  );
end;
$$;

create or replace function public.start_shift()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_vehicle uuid;
  v_live public.vehicle_live;
begin
  select d.vehicle_id into v_vehicle from public.drivers d where d.user_id = auth.uid();
  if v_vehicle is null then
    raise exception 'not_a_driver';
  end if;

  insert into public.vehicle_live (vehicle_id, online, seats_taken, marked_full, updated_at)
  values (v_vehicle, true, 0, false, now())
  on conflict (vehicle_id) do update
    set online = true, seats_taken = 0, marked_full = false, updated_at = now()
  returning * into v_live;

  return to_jsonb(v_live);
end;
$$;

create or replace function public.driver_ping(
  p_lat double precision,
  p_lng double precision,
  p_speed real default null,
  p_heading real default null,
  p_accuracy real default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_live public.vehicle_live;
  v_route_id uuid;
  v_len double precision;       -- route length in meters
  v_line extensions.geometry;   -- route in UTM meters
  v_scale double precision;     -- route meters per UTM meter
  v_pt extensions.geometry;
  v_from double precision;
  v_to double precision;
  v_window extensions.geometry;
  v_try integer;
  v_along double precision;
  v_progress double precision;
  v_moved double precision := 0;
  v_speed double precision;
begin
  select l.* into v_live
  from public.vehicle_live l
  join public.drivers d on d.vehicle_id = l.vehicle_id
  where d.user_id = auth.uid() and l.online
  for update of l;
  if not found then
    raise exception 'not_online';
  end if;

  if p_lat is null or p_lng is null or p_lat not between -90 and 90 or p_lng not between -180 and 180 then
    raise exception 'invalid_point';
  end if;

  -- ponytail: UTM 51N (EPSG:32651) covers Tarlac, pick the zone per route if the app leaves zone 51
  select r.id, r.length_m, extensions.st_transform(r.geom, 32651)
  into v_route_id, v_len, v_line
  from public.vehicles v
  join public.routes r on r.id = v.route_id
  where v.id = v_live.vehicle_id;
  v_scale := v_len / extensions.st_length(v_line);
  v_pt := extensions.st_transform(extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326), 32651);

  -- Loops often run out and back on one street, so search ahead of the current progress first.
  -- The window starts 50 m back to absorb GPS jitter and wraps past the end of the loop.
  -- ponytail: 2 km forward window, tune if loops cross themselves
  v_from := (v_live.progress_m - 50) / v_len;
  v_from := v_from - floor(v_from);
  v_to := v_from + least(2050 / v_len, 1);
  if v_to <= 1 then
    v_window := extensions.st_linesubstring(v_line, v_from, v_to);
  else
    v_window := extensions.st_makeline(
      extensions.st_linesubstring(v_line, v_from, 1),
      extensions.st_linesubstring(v_line, 0, v_to - 1)
    );
  end if;

  -- Try the window, then the whole line. Within one, take the earliest segment within 10 m of the
  -- closest, since overlapping out and back legs tie on distance.
  select c.try, f.along_m * v_scale
  into v_try, v_along
  from (values (1, v_window), (2, v_line)) as c(try, line)
  cross join lateral (
    select s.start_m + extensions.st_linelocatepoint(s.geom, v_pt) * s.len as along_m
    from (
      select
        d.path[1] as i,
        d.geom,
        extensions.st_length(d.geom) as len,
        extensions.st_distance(d.geom, v_pt) as dist,
        min(extensions.st_distance(d.geom, v_pt)) over () as min_dist,
        coalesce(sum(extensions.st_length(d.geom)) over (
          order by d.path[1] rows between unbounded preceding and 1 preceding
        ), 0) as start_m
      from extensions.st_dumpsegments(c.line) d
    ) s
    where s.len > 0 and s.dist <= 200 and s.dist <= s.min_dist + 10
    order by s.i
    limit 1
  ) f
  order by c.try
  limit 1;

  if v_try = 1 then
    -- Progress never moves back within the window.
    v_moved := greatest(v_along - 50, 0);
    v_progress := v_live.progress_m + v_moved;
  elsif v_try = 2 then
    v_progress := v_along;
    v_moved := v_progress - v_live.progress_m;
    v_moved := v_moved - v_len * floor(v_moved / v_len);
  else
    v_progress := v_live.progress_m;
  end if;
  v_progress := v_progress - v_len * floor(v_progress / v_len);

  v_speed := 0.7 * v_live.speed_mps + 0.3 * coalesce(
    case when p_speed >= 0 then p_speed end,
    v_moved / greatest(extract(epoch from now() - v_live.updated_at)::double precision, 1)
  );
  v_speed := least(greatest(v_speed, 0), 40);

  update public.vehicle_live set
    lat = p_lat,
    lng = p_lng,
    heading = p_heading,
    accuracy = p_accuracy,
    progress_m = v_progress,
    speed_mps = v_speed,
    updated_at = now()
  where vehicle_id = v_live.vehicle_id;

  return jsonb_build_object(
    'vehicle_id', v_live.vehicle_id,
    'route_id', v_route_id,
    'route_length_m', v_len,
    'progress_m', v_progress,
    'speed_mps', v_speed::real,
    'on_route', v_try is not null
  );
end;
$$;

create or replace function public.driver_set_seats(p_count integer default null, p_full boolean default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_live public.vehicle_live;
  v_capacity smallint;
  v_was_full boolean;
begin
  select l.* into v_live
  from public.vehicle_live l
  join public.drivers d on d.vehicle_id = l.vehicle_id
  where d.user_id = auth.uid() and l.online
  for update of l;
  if not found then
    raise exception 'not_online';
  end if;

  select v.capacity into v_capacity from public.vehicles v where v.id = v_live.vehicle_id;
  v_was_full := v_live.marked_full or v_live.seats_taken >= v_capacity;

  update public.vehicle_live set
    seats_taken = case when p_count is null then seats_taken else least(greatest(p_count, 0), v_capacity) end,
    marked_full = coalesce(p_full, marked_full)
  where vehicle_id = v_live.vehicle_id
  returning * into v_live;

  return jsonb_build_object(
    'seats_taken', v_live.seats_taken,
    'capacity', v_capacity,
    'marked_full', v_live.marked_full,
    'was_full', v_was_full,
    'is_full', v_live.marked_full or v_live.seats_taken >= v_capacity
  );
end;
$$;

-- Idempotent: a vehicle the stale-vehicles job already took offline still ends cleanly.
create or replace function public.end_shift()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_vehicle uuid;
begin
  select d.vehicle_id into v_vehicle from public.drivers d where d.user_id = auth.uid();
  if v_vehicle is null then
    raise exception 'not_a_driver';
  end if;

  update public.vehicle_live set online = false where vehicle_id = v_vehicle and online;

  return jsonb_build_object('vehicle_id', v_vehicle, 'trackers', public.tracking_count(v_vehicle));
end;
$$;
