# Local MVP implementation

Completed locally on 2026-09-07. Live Planning Center verification awaits credentials.

Build the authenticated Scripture-usage dashboard requested by the repository owner.
Preserve the existing Route Handler -> service -> repository architecture.

1. Add migration-driven storage, read-only authenticated RLS, transactional replacement,
   leased synchronization locks, local seeds, and Supabase SSR authentication.
2. Implement conservative parser integration, ordered liturgical classification,
   paginated/rate-limited Planning Center retrieval, sync and offline reparse.
3. Add server-filtered analytics, complete canon heatmap, details, and auth UI.
4. Verify migrations/types, unit/integration/browser tests, lint/typecheck/build;
   record environment limitations and update canonical documentation.

## Result and verification

Implemented invite-only Supabase Auth, migration-driven RLS-protected storage,
transactional/idempotent plan replacement, a leased sync/reparse workflow,
conservative Scripture parsing, and an accessible filtered Bible chapter dashboard.
Six synthetic services and a local invited account permit evaluation without live
Planning Center access. The production application was started locally.

Verified a complete local reset from migration and regenerated seed SQL; generated
database types and the SQL reference; passed formatting, lint, TypeScript, 53 unit
tests, three local database tests, and four browser scenarios against the production
build. Browser coverage includes all 66 books/1,189 chapters, combined filters,
count/recency, keyboard chapter history, reparse, invite/recovery, and sign-out.
Desktop/mobile screenshots were inspected. Local Markdown links and the exact
CLAUDE import were checked.

No real Planning Center credentials were available. Transport, pagination,
rate-limit, synchronization failure, classification, and persistence behaviors
were verified using fixtures and the local database. Known limits are recorded in
[technical debt](../tech-debt.md) and the canonical
[domain contract](../../architecture/scripture-usage.md).
