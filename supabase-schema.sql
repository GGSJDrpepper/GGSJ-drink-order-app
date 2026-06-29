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
  payment_method text not null check (payment_method in ('cash', 'card', 'paypay', 'coin', 'transit', 'unknown')),
  notes text,
  status text not null check (status in ('ordered', 'making', 'made', 'served', 'canceled')),
  made_at timestamptz,
  served_at timestamptz,
  paid_at timestamptz,
  events jsonb not null default '[]'::jsonb
);

alter table public.drink_orders enable row level security;

drop policy if exists "drink_orders_select" on public.drink_orders;
drop policy if exists "drink_orders_insert" on public.drink_orders;
drop policy if exists "drink_orders_update" on public.drink_orders;

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

alter table public.drink_orders
  drop constraint if exists drink_orders_payment_method_check;

alter table public.drink_orders
  add constraint drink_orders_payment_method_check
  check (payment_method in ('cash', 'card', 'paypay', 'coin', 'transit', 'unknown'))
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

create index if not exists drink_orders_created_at_idx
  on public.drink_orders (created_at desc);

create index if not exists drink_orders_status_idx
  on public.drink_orders (status);
