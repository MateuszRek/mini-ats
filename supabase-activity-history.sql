create table if not exists public.activity_history (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  entity_type text not null check (entity_type in ('candidate', 'project', 'client', 'system')),
  entity_id text not null,
  action_type text not null,
  action_label text not null,
  old_value text,
  new_value text,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists activity_history_entity_idx
  on public.activity_history (entity_type, entity_id, created_at desc);

create index if not exists activity_history_action_idx
  on public.activity_history (action_type, created_at desc);

alter table public.activity_history enable row level security;

drop policy if exists "Authenticated users can read activity history" on public.activity_history;
create policy "Authenticated users can read activity history"
on public.activity_history
for select
to authenticated
using (true);

drop policy if exists "Authenticated users can insert activity history" on public.activity_history;
create policy "Authenticated users can insert activity history"
on public.activity_history
for insert
to authenticated
with check (true);
