alter table public.candidates
  add column if not exists sourced_by_mateusz boolean not null default false,
  add column if not exists sourced_by_klaudia boolean not null default false;

create index if not exists candidates_sourced_by_mateusz_idx
  on public.candidates (sourced_by_mateusz);

create index if not exists candidates_sourced_by_klaudia_idx
  on public.candidates (sourced_by_klaudia);
