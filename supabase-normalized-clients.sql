-- Mini ATS: target clients -> projects -> candidates schema
-- Run in Supabase SQL Editor. This migration is additive and keeps existing data.

create extension if not exists "pgcrypto";

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  osoba_do_kontaktu text,
  email text,
  telefon text,
  notatki text
);

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'clients'
      and column_name = 'osoba do kontaktu'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'clients'
      and column_name = 'osoba_do_kontaktu'
  ) then
    alter table public.clients rename column "osoba do kontaktu" to osoba_do_kontaktu;
  end if;
end $$;

alter table public.clients
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists osoba_do_kontaktu text,
  add column if not exists email text,
  add column if not exists telefon text,
  add column if not exists notatki text;

alter table public."Projekty"
  add column if not exists client_id uuid;

do $$
begin
  if not exists (
    select 1
    from information_schema.table_constraints
    where constraint_schema = 'public'
      and table_name = 'Projekty'
      and constraint_name = 'projekty_client_id_fkey'
  ) then
    alter table public."Projekty"
      add constraint projekty_client_id_fkey
      foreign key (client_id)
      references public.clients(id)
      on delete set null;
  end if;
end $$;

alter table public.candidate_projects
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists interview_summary text,
  add column if not exists recruiter_notes text;

create index if not exists clients_name_idx on public.clients (name);
create index if not exists projekty_client_id_idx on public."Projekty" (client_id);
create index if not exists candidate_projects_candidate_id_idx on public.candidate_projects (candidate_id);
create index if not exists candidate_projects_project_id_idx on public.candidate_projects (project_id);
