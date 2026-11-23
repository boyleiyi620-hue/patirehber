-- Keep private account data private; friends only see explicitly limited cat basics.

create unique index if not exists profiles_friend_code_unique
  on public.profiles (friend_code)
  where friend_code is not null;

alter table public.friendships
  alter column requester_id set not null,
  alter column addressee_id set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.friendships'::regclass
      and conname = 'friendships_no_self'
  ) then
    alter table public.friendships
      add constraint friendships_no_self check (requester_id <> addressee_id);
  end if;
end;
$$;

create unique index if not exists friendships_unique_pair
  on public.friendships (
    least(requester_id, addressee_id),
    greatest(requester_id, addressee_id)
  );

-- SECURITY DEFINER is needed for the auth trigger, but it must not be callable
-- directly by API roles. All object references are schema-qualified.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email));
  return new;
end;
$function$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

create or replace function public.get_my_friend_code()
returns text
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_code text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select p.friend_code into v_code
  from public.profiles as p
  where p.id = auth.uid()
  for update;

  if not found then
    raise exception 'Profile not found' using errcode = 'P0002';
  end if;

  if v_code is null then
    loop
      v_code := pg_catalog.upper(
        pg_catalog.substr(
          pg_catalog.replace(pg_catalog.gen_random_uuid()::text, '-', ''),
          1,
          8
        )
      );
      exit when not exists (
        select 1 from public.profiles as p where p.friend_code = v_code
      );
    end loop;

    update public.profiles as p
    set friend_code = v_code
    where p.id = auth.uid();
  end if;

  return v_code;
end;
$function$;

create or replace function public.send_friend_request(p_code text)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_requester uuid := auth.uid();
  v_target uuid;
  v_friendship_id uuid;
  v_status text;
  v_existing_requester uuid;
  v_code text := pg_catalog.upper(pg_catalog.btrim(coalesce(p_code, '')));
begin
  if v_requester is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if v_code = '' then
    raise exception 'Friend code is required' using errcode = '22023';
  end if;

  select p.id into v_target
  from public.profiles as p
  where p.friend_code = v_code;

  if v_target is null then
    raise exception 'No account found for this code' using errcode = 'P0002';
  end if;
  if v_target = v_requester then
    raise exception 'You cannot add yourself' using errcode = '22023';
  end if;

  select f.id, f.status, f.requester_id
  into v_friendship_id, v_status, v_existing_requester
  from public.friendships as f
  where (f.requester_id = v_requester and f.addressee_id = v_target)
     or (f.requester_id = v_target and f.addressee_id = v_requester)
  limit 1;

  if v_status = 'accepted' then
    return;
  elsif v_status = 'pending' then
    raise exception 'A friend request is already pending' using errcode = '23505';
  elsif v_status = 'rejected' then
    update public.friendships as f
    set requester_id = v_requester,
        addressee_id = v_target,
        status = 'pending'
    where f.id = v_friendship_id;
    return;
  end if;

  insert into public.friendships (requester_id, addressee_id, status)
  values (v_requester, v_target, 'pending');
exception
  when unique_violation then
    raise exception 'A friend request or friendship already exists' using errcode = '23505';
end;
$function$;

create or replace function public.respond_to_friend_request(
  p_friendship_id uuid,
  p_accept boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  update public.friendships as f
  set status = case when p_accept then 'accepted' else 'rejected' end
  where f.id = p_friendship_id
    and f.addressee_id = auth.uid()
    and f.status = 'pending';

  if not found then
    raise exception 'Pending request not found' using errcode = 'P0002';
  end if;
end;
$function$;

create or replace function public.get_friend_profile(target_user_id uuid)
returns table (id uuid, display_name text)
language sql
stable
security definer
set search_path = ''
as $function$
  select p.id, p.display_name
  from public.profiles as p
  where p.id = target_user_id
    and (
      p.id = auth.uid()
      or exists (
        select 1
        from public.friendships as f
        where f.status = 'accepted'
          and (
            (f.requester_id = auth.uid() and f.addressee_id = p.id)
            or (f.addressee_id = auth.uid() and f.requester_id = p.id)
          )
      )
    );
$function$;

create or replace function public.get_friend_cats(target_user_id uuid)
returns table (
  id text,
  name text,
  breed_id text,
  birth_date date
)
language sql
stable
security definer
set search_path = ''
as $function$
  select c.id, c.name, c.breed_id, c.birth_date
  from public.cats as c
  where c.user_id = target_user_id
    and exists (
      select 1
      from public.friendships as f
      where f.status = 'accepted'
        and (
          (f.requester_id = auth.uid() and f.addressee_id = target_user_id)
          or (f.addressee_id = auth.uid() and f.requester_id = target_user_id)
        )
    )
  order by c.created_at;
$function$;

revoke all on function public.get_my_friend_code() from public, anon;
revoke all on function public.send_friend_request(text) from public, anon;
revoke all on function public.respond_to_friend_request(uuid, boolean) from public, anon;
revoke all on function public.get_friend_profile(uuid) from public, anon;
revoke all on function public.get_friend_cats(uuid) from public, anon;
grant execute on function public.get_my_friend_code() to authenticated;
grant execute on function public.send_friend_request(text) to authenticated;
grant execute on function public.respond_to_friend_request(uuid, boolean) to authenticated;
grant execute on function public.get_friend_profile(uuid) to authenticated;
grant execute on function public.get_friend_cats(uuid) to authenticated;

-- Restrict table policies to authenticated owners. Friend reads now go through
-- the whitelisted SECURITY DEFINER RPCs above, never through raw table rows.
alter table public.profiles enable row level security;
alter table public.friendships enable row level security;
alter table public.cats enable row level security;
alter table public.daily_logs enable row level security;
alter table public.reminders enable row level security;
alter table public.tasks enable row level security;
alter table public.health_entries enable row level security;
alter table public.vaccinations enable row level security;
alter table public.weight_entries enable row level security;

drop policy if exists profiles_own on public.profiles;
create policy profiles_own on public.profiles
  for all to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);
drop policy if exists profiles_friends_select on public.profiles;

drop policy if exists cats_own on public.cats;
create policy cats_own on public.cats
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
drop policy if exists cats_friends_select on public.cats;

drop policy if exists daily_logs_own on public.daily_logs;
create policy daily_logs_own on public.daily_logs
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists reminders_own on public.reminders;
create policy reminders_own on public.reminders
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists tasks_own on public.tasks;
create policy tasks_own on public.tasks
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists health_entries_own on public.health_entries;
create policy health_entries_own on public.health_entries
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
drop policy if exists health_entries_friends_select on public.health_entries;

drop policy if exists vaccinations_own on public.vaccinations;
create policy vaccinations_own on public.vaccinations
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
drop policy if exists vaccinations_friends_select on public.vaccinations;

drop policy if exists weight_entries_own on public.weight_entries;
create policy weight_entries_own on public.weight_entries
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
drop policy if exists weight_entries_friends_select on public.weight_entries;

drop policy if exists friendships_select on public.friendships;
create policy friendships_select on public.friendships
  for select to authenticated
  using (auth.uid() = requester_id or auth.uid() = addressee_id);
drop policy if exists friendships_delete on public.friendships;
create policy friendships_delete on public.friendships
  for delete to authenticated
  using (auth.uid() = requester_id or auth.uid() = addressee_id);
drop policy if exists friendships_insert on public.friendships;
drop policy if exists friendships_update on public.friendships;
