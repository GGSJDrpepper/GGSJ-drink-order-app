create table if not exists public.ring_application_notifications (
  id uuid primary key,
  created_at timestamptz not null default now(),
  acknowledged_at timestamptz
);

alter table public.ring_application_notifications enable row level security;
grant select, insert, update on public.ring_application_notifications to anon, authenticated;

drop policy if exists "ring_application_notifications_select" on public.ring_application_notifications;
drop policy if exists "ring_application_notifications_insert" on public.ring_application_notifications;
drop policy if exists "ring_application_notifications_update" on public.ring_application_notifications;

create policy "ring_application_notifications_select"
  on public.ring_application_notifications for select using (true);
create policy "ring_application_notifications_insert"
  on public.ring_application_notifications for insert with check (true);
create policy "ring_application_notifications_update"
  on public.ring_application_notifications for update using (true) with check (true);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'ring_application_notifications'
  ) then
    alter publication supabase_realtime add table public.ring_application_notifications;
  end if;
end $$;

create index if not exists ring_application_notifications_created_at_idx
  on public.ring_application_notifications (created_at desc);

create extension if not exists pg_cron with schema extensions;

select cron.schedule(
  'ring-application-notifications-retention-7d',
  '7 * * * *',
  $command$
    delete from public.ring_application_notifications
    where created_at < now() - interval '7 days';
  $command$
);
