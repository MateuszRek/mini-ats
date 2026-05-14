alter table public.candidates
  add column if not exists sourced_by_mateusz boolean not null default false,
  add column if not exists sourced_by_klaudia boolean not null default false,
  add column if not exists prefers_remote boolean not null default false,
  add column if not exists prefers_uop boolean not null default false,
  add column if not exists prefers_b2b boolean not null default false;

create index if not exists candidates_sourced_by_mateusz_idx
  on public.candidates (sourced_by_mateusz);

create index if not exists candidates_sourced_by_klaudia_idx
  on public.candidates (sourced_by_klaudia);

create index if not exists candidates_prefers_remote_idx
  on public.candidates (prefers_remote);

create index if not exists candidates_prefers_uop_idx
  on public.candidates (prefers_uop);

create index if not exists candidates_prefers_b2b_idx
  on public.candidates (prefers_b2b);
