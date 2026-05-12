-- Mini ATS contact reminders - ETAP 1
-- Run this in Supabase SQL Editor if the columns are missing.

alter table public.candidates
  add column if not exists reminder_date date,
  add column if not exists reminder_note text;

create index if not exists candidates_reminder_date_idx
  on public.candidates (reminder_date);
