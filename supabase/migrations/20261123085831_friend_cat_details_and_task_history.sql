-- Store task progress per calendar day without exposing owner rows through RLS.
alter table public.tasks
  add column if not exists progress_by_date jsonb not null default '[]'::jsonb
  check (jsonb_typeof(progress_by_date) = 'array');

-- Friends can read the full shared cat profile and its related records only through
-- this access-controlled JSON RPC. Base-table RLS stays owner-only.
create or replace function public.get_friend_cat_detail(
  target_user_id uuid,
  target_cat_id text
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $function$
  select pg_catalog.jsonb_build_object(
    'cat', pg_catalog.to_jsonb(c) - 'user_id',
    'daily_logs', coalesce((
      select pg_catalog.jsonb_agg(pg_catalog.to_jsonb(l) - 'user_id' order by l.date desc)
      from public.daily_logs as l
      where l.user_id = target_user_id and l.cat_id = target_cat_id
    ), '[]'::jsonb),
    'tasks', coalesce((
      select pg_catalog.jsonb_agg(pg_catalog.to_jsonb(t) - 'user_id' order by t.created_at desc)
      from public.tasks as t
      where t.user_id = target_user_id
        and (t.cat_id = target_cat_id or t.cat_id is null)
    ), '[]'::jsonb),
    'reminders', coalesce((
      select pg_catalog.jsonb_agg(pg_catalog.to_jsonb(r) - 'user_id' order by r.time)
      from public.reminders as r
      where r.user_id = target_user_id
        and (r.cat_id = target_cat_id or r.cat_id is null)
    ), '[]'::jsonb),
    'health_entries', coalesce((
      select pg_catalog.jsonb_agg(pg_catalog.to_jsonb(h) - 'user_id' order by h.date desc, h.created_at desc)
      from public.health_entries as h
      where h.user_id = target_user_id and h.cat_id = target_cat_id
    ), '[]'::jsonb),
    'vaccinations', coalesce((
      select pg_catalog.jsonb_agg(pg_catalog.to_jsonb(v) - 'user_id' order by v.date desc)
      from public.vaccinations as v
      where v.user_id = target_user_id and v.cat_id = target_cat_id
    ), '[]'::jsonb),
    'weight_entries', coalesce((
      select pg_catalog.jsonb_agg(pg_catalog.to_jsonb(w) - 'user_id' order by w.date desc)
      from public.weight_entries as w
      where w.user_id = target_user_id and w.cat_id = target_cat_id
    ), '[]'::jsonb)
  )
  from public.cats as c
  where c.id = target_cat_id
    and c.user_id = target_user_id
    and auth.uid() is not null
    and exists (
      select 1
      from public.friendships as f
      where f.status = 'accepted'
        and (
          (f.requester_id = auth.uid() and f.addressee_id = target_user_id)
          or (f.addressee_id = auth.uid() and f.requester_id = target_user_id)
        )
    )
  limit 1;
$function$;

revoke all on function public.get_friend_cat_detail(uuid, text) from public, anon;
grant execute on function public.get_friend_cat_detail(uuid, text) to authenticated;
