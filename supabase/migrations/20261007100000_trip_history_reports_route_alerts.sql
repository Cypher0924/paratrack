-- Research screens: trip history (41), trip complete feedback (38), problem reports (39),
-- per-route service alerts (34), and a vehicle type for modern jeepneys.

-- Modern PUJs (diesel, Class 2) are not e-jeeps. Used by the seed only, so adding it here is safe.
alter type public.vehicle_type add value if not exists 'modern';

-- Trip timestamps for history. Set by trigger so auto-ended trips get them too.
alter table public.trips
  add column boarded_at timestamptz,
  add column ended_at timestamptz,
  add column feedback text[] not null default '{}'
    check (feedback <@ array['on_time', 'seats_right', 'safe_driving', 'clean', 'friendly']);

create function public.stamp_trip_status()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'onboard' and old.status is distinct from 'onboard' then
    new.boarded_at := coalesce(new.boarded_at, now());
  elsif new.status = 'ended' and old.status is distinct from 'ended' then
    new.ended_at := coalesce(new.ended_at, now());
  end if;
  return new;
end;
$$;

create trigger trips_stamp_status
  before update of status on public.trips
  for each row execute function public.stamp_trip_status();

create index trips_user_id_ended_at_idx on public.trips (user_id, ended_at desc) where status = 'ended';

-- Problem reports. Commuters write and read their own. Operators read them in the dashboard.
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  trip_id uuid not null references public.trips on delete cascade,
  kind text not null check (kind in ('seats_wrong', 'overcharged', 'unsafe_driving', 'safety')),
  note text check (char_length(note) <= 500),
  created_at timestamptz not null default now()
);
create index reports_user_id_idx on public.reports (user_id);
create index reports_trip_id_idx on public.reports (trip_id);

alter table public.reports enable row level security;
grant select, insert on public.reports to authenticated;
grant all on public.reports to service_role;

create policy "Users read own reports" on public.reports for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users report own trips" on public.reports for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.trips t where t.id = trip_id and t.user_id = (select auth.uid()))
  );

-- Saved routes carry their own service alert switch.
alter table public.saved_routes add column alerts boolean not null default true;

-- Route announcements go only to people who saved that route with alerts on.
-- City-wide announcements (no route) still reach everyone with service updates on.
create or replace function public.fan_out_announcement()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.notifications (user_id, kind, title, body, data)
  select p.id, 'service', new.title, new.body,
    jsonb_build_object('url', '/alerts/' || new.id, 'announcementId', new.id, 'routeId', new.route_id)
  from public.profiles p
  where p.service_updates
    and (
      new.route_id is null
      or exists (
        select 1 from public.saved_routes s
        where s.user_id = p.id and s.route_id = new.route_id and s.alerts
      )
    );
  return new;
end;
$$;
