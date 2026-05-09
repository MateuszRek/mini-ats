alter table public."Projekty"
  add column if not exists project_notes text,
  add column if not exists candidate_requirements text,
  add column if not exists ai_search_summary text;
