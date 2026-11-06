create table if not exists public.drink_orders (
  id uuid primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  source text not null check (source in ('reception', 'table')),
  drink_name text not null,
  quantity integer not null default 1 check (quantity > 0),
  target text not null check (target in ('tournament', 'ring', 'bar')),
  table_no text,
  seat_no text,
  payment_status text not null check (payment_status in ('paid', 'uncollected')),
  payment_method text not null check (payment_method in ('cash', 'card', 'paypay', 'coin', 'transit', 'id', 'unknown')),
  notes text,
  status text not null check (status in ('ordered', 'making', 'made', 'served', 'canceled')),
  made_at timestamptz,
  served_at timestamptz,
  paid_at timestamptz,
  events jsonb not null default '[]'::jsonb
);

create table if not exists public.drink_app_settings (
  id text primary key,
  updated_at timestamptz not null default now(),
  menu jsonb not null default '[]'::jsonb
);

create table if not exists public.ring_application_notifications (
  id uuid primary key,
  created_at timestamptz not null default now(),
  acknowledged_at timestamptz
);

alter table public.drink_orders enable row level security;
alter table public.drink_app_settings enable row level security;
alter table public.ring_application_notifications enable row level security;
grant select, insert, update on public.ring_application_notifications to anon, authenticated;

drop policy if exists "drink_orders_select" on public.drink_orders;
drop policy if exists "drink_orders_insert" on public.drink_orders;
drop policy if exists "drink_orders_update" on public.drink_orders;
drop policy if exists "drink_app_settings_select" on public.drink_app_settings;
drop policy if exists "drink_app_settings_insert" on public.drink_app_settings;
drop policy if exists "drink_app_settings_update" on public.drink_app_settings;
drop policy if exists "ring_application_notifications_select" on public.ring_application_notifications;
drop policy if exists "ring_application_notifications_insert" on public.ring_application_notifications;
drop policy if exists "ring_application_notifications_update" on public.ring_application_notifications;

create policy "drink_orders_select"
  on public.drink_orders
  for select
  using (true);

create policy "drink_orders_insert"
  on public.drink_orders
  for insert
  with check (true);

create policy "drink_orders_update"
  on public.drink_orders
  for update
  using (true)
  with check (true);

create policy "drink_app_settings_select"
  on public.drink_app_settings
  for select
  using (true);

create policy "drink_app_settings_insert"
  on public.drink_app_settings
  for insert
  with check (true);

create policy "drink_app_settings_update"
  on public.drink_app_settings
  for update
  using (true)
  with check (true);

create policy "ring_application_notifications_select"
  on public.ring_application_notifications
  for select
  using (true);

create policy "ring_application_notifications_insert"
  on public.ring_application_notifications
  for insert
  with check (true);

create policy "ring_application_notifications_update"
  on public.ring_application_notifications
  for update
  using (true)
  with check (true);

alter table public.drink_orders
  drop constraint if exists drink_orders_payment_method_check;

alter table public.drink_orders
  add constraint drink_orders_payment_method_check
  check (payment_method in ('cash', 'card', 'paypay', 'coin', 'transit', 'id', 'unknown'))
  not valid;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'drink_orders'
  ) then
    alter publication supabase_realtime add table public.drink_orders;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'ring_application_notifications'
  ) then
    alter publication supabase_realtime add table public.ring_application_notifications;
  end if;
end $$;

create index if not exists ring_application_notifications_created_at_idx
  on public.ring_application_notifications (created_at desc);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'drink_app_settings'
  ) then
    alter publication supabase_realtime add table public.drink_app_settings;
  end if;
end $$;

create index if not exists drink_orders_created_at_idx
  on public.drink_orders (created_at desc);

create index if not exists drink_orders_status_idx
  on public.drink_orders (status);

create index if not exists drink_app_settings_updated_at_idx
  on public.drink_app_settings (updated_at desc);

-- Keep the shared order table small. This job runs hourly and removes orders
-- whose original order time is more than 24 hours old.
create extension if not exists pg_cron with schema extensions;

select cron.schedule(
  'drink-orders-retention-24h',
  '7 * * * *',
  $command$
    delete from public.drink_orders
    where created_at < now() - interval '24 hours';
  $command$
);

select cron.schedule(
  'ring-application-notifications-retention-7d',
  '7 * * * *',
  $command$
    delete from public.ring_application_notifications
    where created_at < now() - interval '7 days';
  $command$
);
