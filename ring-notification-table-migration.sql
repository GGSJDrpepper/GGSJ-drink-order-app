begin;

alter table public.ring_application_notifications
  add column if not exists table_no text;

alter table public.ring_application_notifications
  drop constraint if exists ring_application_notifications_table_no_check;

alter table public.ring_application_notifications
  add constraint ring_application_notifications_table_no_check
  check (table_no is null or table_no ~ '^[A-H]$');

create or replace function public.ring_notice_create(
  p_key text, p_id uuid, p_created_at timestamptz, p_table_no text
) returns void
language plpgsql security definer set search_path = ''
as $$
declare normalized_table text;
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

  normalized_table := upper(nullif(btrim(p_table_no), ''));
  if normalized_table is not null and normalized_table !~ '^[A-H]$' then
    raise exception 'invalid table number' using errcode = '22023';
  end if;

  insert into public.ring_application_notifications as n (id, created_at, table_no)
  values (p_id, p_created_at, normalized_table)
  on conflict (id) do update
    set table_no = coalesce(n.table_no, excluded.table_no);
end;
$$;

drop function if exists public.ring_notice_list_public();

create function public.ring_notice_list_public()
returns table (id uuid, created_at timestamptz, acknowledged_at timestamptz, table_no text)
language sql security definer set search_path = ''
as $$
  select n.id, n.created_at, n.acknowledged_at, n.table_no
  from public.ring_application_notifications n
  where n.created_at >= now() - interval '7 days'
    and n.resolved_at is null
    and (n.acknowledged_at is null or n.acknowledged_at >= now() - interval '1 hour')
  order by n.created_at desc
  limit 200;
$$;

revoke all on function public.ring_notice_create(text, uuid, timestamptz, text) from public, anon, authenticated;
revoke all on function public.ring_notice_list_public() from public, anon, authenticated;
grant execute on function public.ring_notice_create(text, uuid, timestamptz, text) to anon, authenticated;
grant execute on function public.ring_notice_list_public() to anon, authenticated;

commit;
