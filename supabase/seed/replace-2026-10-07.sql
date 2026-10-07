-- Run once on each database before the new supabase/seed.sql. Removes the old invented seed (fixed UUIDs a0/b0/c0/d0).
-- Idempotent. Vehicles first: vehicles.route_id has no cascade. Deleting vehicles also removes their drivers, live rows and trips.
delete from public.vehicles where id::text like 'd0000000-0000-4000-8000-0000000000__';
delete from public.announcements where title = 'Campus Loop paused from 12:00 to 1:00 PM';
delete from public.routes where id::text like 'b0000000-0000-4000-8000-0000000000__';
delete from public.stops where id::text like 'c0000000-0000-4000-8000-0000000000__';
delete from public.operators where id::text like 'a0000000-0000-4000-8000-0000000000__';
