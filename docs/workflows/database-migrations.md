# Database migrations

Use [database policy](../architecture/database.md) and the configured local stack
from [local development](local-development.md).

1. Create a forward migration with `npx supabase migration new <kebab-case-description>`.
   Put SQL under `supabase/migrations/`; include constraints, indexes, RLS, grants,
   and any justified persistence RPCs. Do not rewrite deployed migrations.
2. Verify the target is this disposable local project, then run
   `npx supabase db reset` to replay migrations and seeds. It deletes local data.
3. Run `npm run db:types` to generate and format `src/types/database.ts` from the
   actual local schema. Never edit generated database types manually.
4. Run `npm run db:docs` to mechanically synchronize the SQL reference from versioned
   migrations. If fixtures change, edit `scripts/generate-seed.ts`, run
   `npm run db:seed:generate`, then reset the local database again.
5. Run `npm run test:db` for Auth/RLS, write grants, idempotence, rollback, and
   lease/fencing coverage; run applicable [application checks](../../AGENTS.md#commands).
6. Review migration SQL, generated diffs, compatibility, and recovery steps. Record
   significant accepted design changes in an ADR.
7. Remote migration release is separate from local reset/seed operations. Select
   the intended environment and authorized release process explicitly; never load
   the synthetic account/fixture SQL into a hosted project. No deployment is configured.

The npm lockfile pins the CLI. Its configuration reference is linked from
[Supabase's migration guide](https://supabase.com/docs/guides/local-development/database-migrations).
