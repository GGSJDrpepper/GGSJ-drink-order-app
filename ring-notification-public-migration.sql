begin;

create or replace function public.ring_notice_list_public()
returns table (id uuid, created_at timestamptz, acknowledged_at timestamptz)
language sql security definer set search_path = ''
as $$
  select n.id, n.created_at, n.acknowledged_at
  from public.ring_application_notifications n
  where n.created_at >= now() - interval '7 days'
    and n.resolved_at is null
    and (n.acknowledged_at is null or n.acknowledged_at >= now() - interval '1 hour')
  order by n.created_at desc
  limit 200;
$$;

create or replace function public.ring_notice_ack_public(p_id uuid)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare changed integer;
begin
  update public.ring_application_notifications
  set acknowledged_at = now()
  where id = p_id and acknowledged_at is null and resolved_at is null
    and created_at >= now() - interval '7 days';
  get diagnostics changed = row_count;
  return changed = 1;
end;
$$;

revoke all on function public.ring_notice_list_public() from public, anon, authenticated;
revoke all on function public.ring_notice_ack_public(uuid) from public, anon, authenticated;
grant execute on function public.ring_notice_list_public() to anon, authenticated;
grant execute on function public.ring_notice_ack_public(uuid) to anon, authenticated;

commit;
