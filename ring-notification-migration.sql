begin;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.ring_notification_keys (
  purpose text primary key check (purpose in ('producer', 'bar')),
  token_hash bytea not null
);
alter table private.ring_notification_keys enable row level security;
revoke all on private.ring_notification_keys from public, anon, authenticated;

create table if not exists public.ring_application_notifications (
  id uuid primary key,
  created_at timestamptz not null default now(),
  acknowledged_at timestamptz
);
alter table public.ring_application_notifications enable row level security;
revoke all on public.ring_application_notifications from public, anon, authenticated;

create index if not exists ring_application_notifications_created_at_idx
  on public.ring_application_notifications (created_at desc);

create or replace function public.ring_notice_create(
  p_key text, p_id uuid, p_created_at timestamptz
) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if p_key is null or length(p_key) <> 32 or not exists (
    select 1 from private.ring_notification_keys
    where purpose = 'producer' and token_hash = sha256(convert_to(p_key, 'UTF8'))
  ) then
    raise exception 'invalid notification key' using errcode = '28000';
  end if;
  if p_created_at < now() - interval '7 days' or p_created_at > now() + interval '1 day' then
    raise exception 'invalid notification time' using errcode = '22007';
  end if;
  insert into public.ring_application_notifications (id, created_at)
  values (p_id, p_created_at) on conflict (id) do nothing;
end;
$$;

create or replace function public.ring_notice_list(p_key text)
returns table (id uuid, created_at timestamptz, acknowledged_at timestamptz)
language plpgsql security definer set search_path = ''
as $$
begin
  if p_key is null or length(p_key) <> 32 or not exists (
    select 1 from private.ring_notification_keys
    where purpose = 'bar' and token_hash = sha256(convert_to(p_key, 'UTF8'))
  ) then
    raise exception 'invalid notification key' using errcode = '28000';
  end if;
  return query
    select n.id, n.created_at, n.acknowledged_at
    from public.ring_application_notifications n
    where n.created_at >= now() - interval '7 days'
      and (n.acknowledged_at is null or n.acknowledged_at >= now() - interval '1 hour')
    order by n.created_at desc
    limit 200;
end;
$$;

create or replace function public.ring_notice_ack(p_key text, p_id uuid)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare changed integer;
begin
  if p_key is null or length(p_key) <> 32 or not exists (
    select 1 from private.ring_notification_keys
    where purpose = 'bar' and token_hash = sha256(convert_to(p_key, 'UTF8'))
  ) then
    raise exception 'invalid notification key' using errcode = '28000';
  end if;
  update public.ring_application_notifications
  set acknowledged_at = now()
  where id = p_id and acknowledged_at is null;
  get diagnostics changed = row_count;
  return changed = 1;
end;
$$;

revoke all on function public.ring_notice_create(text, uuid, timestamptz) from public, anon, authenticated;
revoke all on function public.ring_notice_list(text) from public, anon, authenticated;
revoke all on function public.ring_notice_ack(text, uuid) from public, anon, authenticated;
grant execute on function public.ring_notice_create(text, uuid, timestamptz) to anon, authenticated;
grant execute on function public.ring_notice_list(text) to anon, authenticated;
grant execute on function public.ring_notice_ack(text, uuid) to anon, authenticated;

commit;
