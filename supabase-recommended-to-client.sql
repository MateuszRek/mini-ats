alter table public.candidate_projects
add column if not exists recommended_to_client boolean not null default false;

create index if not exists candidate_projects_recommended_to_client_idx
on public.candidate_projects (recommended_to_client);
