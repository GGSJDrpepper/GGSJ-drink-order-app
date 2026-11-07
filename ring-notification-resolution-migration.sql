begin;

alter table public.ring_application_notifications
  add column if not exists resolved_at timestamptz;

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
      and n.resolved_at is null
      and (n.acknowledged_at is null or n.acknowledged_at >= now() - interval '1 hour')
    order by n.created_at desc
    limit 200;
end;
$$;

create or replace function public.ring_notice_resolve(
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
  insert into public.ring_application_notifications as n (id, created_at, resolved_at)
  values (p_id, p_created_at, now())
  on conflict (id) do update set resolved_at = coalesce(
    n.resolved_at, excluded.resolved_at
  );
end;
$$;

revoke all on function public.ring_notice_list(text) from public, anon, authenticated;
revoke all on function public.ring_notice_resolve(text, uuid, timestamptz) from public, anon, authenticated;
grant execute on function public.ring_notice_list(text) to anon, authenticated;
grant execute on function public.ring_notice_resolve(text, uuid, timestamptz) to anon, authenticated;

commit;
