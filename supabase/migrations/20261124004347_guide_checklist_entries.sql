create table if not exists public.guide_checklist_entries (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  cat_id text not null references public.cats(id) on delete cascade,
  date date not null,
  section_id text not null,
  item_id text not null,
  created_at timestamptz not null default now(),
  unique (user_id, cat_id, date, section_id, item_id)
);

create index if not exists guide_checklist_entries_user_date_idx
  on public.guide_checklist_entries (user_id, date);

alter table public.guide_checklist_entries enable row level security;

drop policy if exists guide_checklist_entries_owner_all
  on public.guide_checklist_entries;
create policy guide_checklist_entries_owner_all
  on public.guide_checklist_entries
  for all
  to authenticated
  using (
    auth.uid() = user_id
    and exists (
      select 1
      from public.cats as c
      where c.id = guide_checklist_entries.cat_id and c.user_id = auth.uid()
    )
  )
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.cats as c
      where c.id = guide_checklist_entries.cat_id and c.user_id = auth.uid()
    )
  );

grant select, insert, update, delete
  on public.guide_checklist_entries to authenticated;
