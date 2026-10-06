-- An announcement becomes an inbox notification (kind 'service') for every user with service updates on.
-- Clients get it over Realtime on notifications. Route-scoped announcements still reach every opted-in user.

create function public.fan_out_announcement()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.notifications (user_id, kind, title, body, data)
  select p.id, 'service', new.title, new.body,
    jsonb_build_object('url', '/alerts', 'announcementId', new.id, 'routeId', new.route_id)
  from public.profiles p
  where p.service_updates;
  return new;
end;
$$;

revoke execute on function public.fan_out_announcement() from public, anon, authenticated;

create trigger announcements_fan_out
  after insert on public.announcements
  for each row execute function public.fan_out_announcement();
