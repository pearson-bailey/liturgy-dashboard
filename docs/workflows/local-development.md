# Local development

1. Install Node.js 22.12+ or 24 LTS, npm dependencies with `npm ci`, and Docker Desktop. Start
   Docker's Linux-container engine.
2. Run `npx supabase start`, then `npx supabase db reset` to recreate this project's
   disposable local database from migrations and synthetic seed data. Reset deletes
   this project's local data; never use the local fixture workflow against hosted data.
3. Run `npm run db:env` to create ignored `.env.local` from the local CLI status.
   It refuses to overwrite existing configuration. For an existing file, obtain new
   local values from `npx supabase status` and update only the relevant settings.
4. Run `npm run db:types`, then `npm run dev`. Open <http://127.0.0.1:3000>.
5. Sign in with the synthetic invited user **elder@example.test** and password
   **Local-elders-2026!**. This credential is a local fixture, never a production account.

Local Supabase endpoints: API 55321, Postgres 55322, Studio 55323, and Mailpit 55324.
The nondefault range avoids Windows-reserved ports observed during setup. These
ports are declared in `supabase/config.toml`; no operating-system reservation was changed.
Application analytics does not require Supabase's separate log analytics service,
which is disabled locally.

## Synthetic history and generation

`supabase/seed.sql` contains six synthetic services dated 2024–2026, two Service
Types, the church's theological headings, and representative Scripture readings.
It demonstrates repeated chapters, chapter-only input, a multi-chapter range,
Sermon versus other elements, and unused books. Song fixtures are excluded by the
same classification/parsing pipeline used for real synchronization.

Change `scripts/generate-seed.ts`, then run `npm run db:seed:generate` and
`npx supabase db reset` to rebuild fixtures. Do not apply seed SQL to remote projects.
Run `npm run db:docs` to regenerate the SQL reference from migrations.

## Auth setup

The local configuration disables signup globally while keeping the email provider
enabled. Invitation and recovery templates are checked in under `supabase/templates/`.
Local messages appear at <http://127.0.0.1:55324>; no external email is sent.
Invite additional users through local Studio. Open the captured invitation link,
set a password, then sign in. Recovery works across browsers through token-hash
verification. See [authentication](../architecture/authentication.md) for hosted setup.

## Planning Center

Add the placeholders from `.env.example` to `.env.local`: personal access token
client ID/secret, identifying User-Agent (include an administrative contact), and
an explicitly chosen `PLANNING_CENTER_SYNC_START_DATE` in YYYY-MM-DD form. Optional
`PLANNING_CENTER_SERVICE_TYPE_IDS` is a comma-separated list of numeric IDs.
Restart Next.js after changing environment settings, sign in, and use Sync Planning
Center. Secrets remain server-side; browser Supabase configuration is unnecessary.
Without Planning Center credentials, seeded analytics and stored-data reparsing work.
The start date is an inclusive lower bound: setting it to today excludes all earlier
services. The dashboard shows the active range. If no eligible plans match, the sync
reports which settings to check instead of claiming a successful import.
Run one Next.js server at a time; stop a previous `npm start` before using `npm run dev`
to avoid serving different configurations on IPv4 and IPv6 localhost addresses.

After adjusting parsing/header rules, run the tests, then click **Reparse stored
items** while signed in. This replaces normalized references from stored source
without fetching Planning Center. The same database lock covers sync and reparse.

## Verification

- `npm run check`: formatting, lint, typecheck, and unit/transport/service tests.
- `npm run test:db`: local Auth/RLS, idempotence, rollback, lock and stale-worker tests.
- `npx playwright install chromium` once, then `npm run test:e2e`: real browser auth,
  filters, 66 books/1,189 cells, count/recency, details, reparse, sign-out, invite/recovery.
- `npm run build`: production compilation and server/client boundary checks.

Database/browser tests refuse nonlocal Supabase URLs. Do not run them concurrently
with a manual sync; they exercise the shared local synchronization lock. Playwright
starts Next.js automatically unless one is already available on its configured URL.
