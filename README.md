# Mini ATS

Mini ATS is a lightweight recruitment app for managing candidates, clients, projects, CV files, shortlists, project statuses, and client-facing candidate views.

The app is built with Vite, React, Tailwind CSS, Supabase, Vercel Functions, and OpenAI. Candidate data is stored in Supabase, CV files are stored in the `CV` storage bucket, and the `/api/parse-cv` endpoint uses OpenAI to extract candidate information from a CV file or LinkedIn text.

## Current Features

- Email/password login through Supabase Auth
- Candidate database with contact details, skills, tags, notes, rating, favorite flag, and CV link
- Client and project management
- Candidate assignment to projects
- Per-project candidate statuses and notes
- List and Kanban views
- Client-facing shortlist view with project-specific filters
- CSV exports for candidates, projects, and clients
- Full JSON backup export
- AI-assisted CV and LinkedIn parsing through a Vercel API route

## Project Structure

```text
api/parse-cv.js     Vercel API route for OpenAI parsing
src/App.jsx         Main React application
src/main.jsx        React entrypoint
src/index.css       Tailwind CSS import
index.html          Vite HTML entrypoint
vite.config.js      Vite, React, and Tailwind config
```

## Environment Variables

Create a local `.env` file from `.env.example` when running locally.

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_publishable_or_anon_key
OPENAI_API_KEY=your_openai_api_key_for_vercel_api_routes
```

`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are used by the browser app. `OPENAI_API_KEY` is used only by the server-side Vercel function in `api/parse-cv.js`.

Do not commit real `.env` files or secret keys.

## Supabase Checklist

The app expects these Supabase resources:

- Auth enabled for email/password login
- Table `candidates`
- Table `candidate_projects`
- Table `Projekty`
- Table `clients`
- Storage bucket `CV`

The code currently references fields such as:

- `candidates`: `id`, `created_at`, `name`, `status`, `email`, `telefon`, `linkedin`, `lokalizacja`, `doświadczenie`, `notatki`, `tagi`, `jezyk_programowania`, `framework`, `obszar`, `rating`, `favorite`, `cv_url`
- `candidate_projects`: `id`, `candidate_id`, `project_id`, `status`, `notes`
- `Projekty`: `id`, `created_at`, `name` or `nazwa`, `client_id`
- `clients`: `id`, `created_at`, `name`, `note`

Keep Row Level Security policies aligned with the desired access model before exposing the app to more users.

## Running Locally

Install dependencies:

```bash
npm install
```

Start the Vite dev server:

```bash
npm run dev
```

For testing the OpenAI API route locally, use Vercel's local dev flow:

```bash
vercel dev
```

## Deployment

The production app is deployed on Vercel from the `main` branch. Vercel should have `OPENAI_API_KEY` configured in Environment Variables. If you move fully to env-based Supabase configuration, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel as well.

## Safe Development Notes

- Keep the current deployed version working before making larger refactors.
- Prefer small changes: documentation/config first, then component extraction, then new features.
- Do not paste or commit `OPENAI_API_KEY`, Supabase service role keys, or local `.env` files.
- The Supabase browser key can be public, but database access must be protected with Supabase Auth and Row Level Security policies.
