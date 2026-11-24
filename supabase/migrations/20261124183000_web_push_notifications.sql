create extension if not exists pg_cron;
create extension if not exists pg_net;
create extension if not exists supabase_vault;

alter table public.profiles
  add column if not exists notifications_enabled boolean not null default false,
  add column if not exists notification_food boolean not null default true,
  add column if not exists notification_water boolean not null default true,
  add column if not exists notification_litter boolean not null default true,
  add column if not exists notification_health boolean not null default true,
  add column if not exists notification_quiet_hours boolean not null default true;

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  timezone text not null default 'UTC' check (char_length(timezone) <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_id_idx
  on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;
drop policy if exists push_subscriptions_owner_all on public.push_subscriptions;
create policy push_subscriptions_owner_all on public.push_subscriptions
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
grant select, insert, update, delete on public.push_subscriptions to authenticated;

create table if not exists public.push_deliveries (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.push_subscriptions(id) on delete cascade,
  reminder_id text not null,
  local_date date not null,
  created_at timestamptz not null default now(),
  unique (subscription_id, reminder_id, local_date)
);

create index if not exists push_deliveries_created_at_idx
  on public.push_deliveries (created_at);

alter table public.push_deliveries enable row level security;
revoke all on public.push_deliveries from public, anon, authenticated;
grant all on public.push_deliveries to service_role;
