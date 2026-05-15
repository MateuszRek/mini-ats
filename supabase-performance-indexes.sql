create index if not exists idx_candidates_created_at on public.candidates(created_at);
create index if not exists idx_candidates_status on public.candidates(status);
create index if not exists idx_candidates_email on public.candidates(email);
create index if not exists idx_candidates_name on public.candidates(name);

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'candidates'
      and column_name = 'diamond'
  ) then
    execute 'create index if not exists idx_candidates_flags on public.candidates(favorite, diamond, sourced_by_mateusz, sourced_by_klaudia, prefers_remote, prefers_uop, prefers_b2b)';
  else
    execute 'create index if not exists idx_candidates_flags on public.candidates(favorite, sourced_by_mateusz, sourced_by_klaudia, prefers_remote, prefers_uop, prefers_b2b)';
  end if;
end $$;

create index if not exists idx_candidate_projects_candidate_id on public.candidate_projects(candidate_id);
create index if not exists idx_candidate_projects_project_id on public.candidate_projects(project_id);
create index if not exists idx_candidate_projects_status on public.candidate_projects(status);
create index if not exists idx_candidate_projects_recommended_to_client on public.candidate_projects(recommended_to_client);
