# Database

> Status: Active
> Scope: Supabase application data and schema
> Canonical for: Database access policy, credentials, schema authority

## Current state

Local Supabase is configured in `supabase/config.toml`. Versioned migrations create
Service Types, plans, ordered non-song items, normalized references, chapter usages,
sync runs, a security-invoker join view, and persistence/lock RPCs. All application
tables enable RLS with authenticated SELECT only; no browser write grants exist.
See the [generated SQL reference](../generated/database-schema.md).

[Configuration](../../src/lib/supabase/config.ts) validates the server URL and
publishable key on use. Request clients use Supabase SSR cookies. A separate secret
client is used only for authenticated synchronization/reparse persistence.

## Rules

- Application data access MUST pass through repositories, using a client initialized
  in `src/lib/supabase/`; see [backend ownership](backend.md).
- New database operations MUST preserve the [identity model](authentication.md) and
  access policy. A publishable key alone is not an authenticated user.
- User-scoped clients MUST carry verified request identity and preserve RLS. New
  exposed tables MUST have deliberate access policies, including unauthenticated behavior.
- Privileged secret/service-role keys MUST remain server-only and MUST NOT be the
  default for ordinary user operations; they can bypass RLS.
- Cookie-based auth MUST include session verification and refresh/cookie
  propagation appropriate to Route Handlers and Server Components. Do not trust an
  unverified session object as authorization evidence.
- Versioned SQL under `supabase/migrations/` MUST be the canonical
  database schema history. Dashboard-only changes MUST be captured in migrations.
- Database TypeScript types SHOULD be generated from the migrated schema into
  `src/types/database.ts`; generated types MUST NOT substitute for boundary validation.
- Generated schema documentation MUST be derived from the same schema, not fabricated.

## Supabase setup reference

For cookie-based authentication, consult the official [Supabase SSR client guide](https://supabase.com/docs/guides/auth/server-side/creating-a-client).
Its browser data-access examples do not override this project's HTTP/service model.
The [authentication contract](authentication.md) documents the implemented model.

## Related documentation

[Migration workflow](../workflows/database-migrations.md),
[add database access](../workflows/add-database-access.md),
[generated schema reference](../generated/database-schema.md),
[integrations](integrations.md), [validation](validation.md).
