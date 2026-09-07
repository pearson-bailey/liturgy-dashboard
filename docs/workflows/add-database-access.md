# Add database access

Use [database policy](../architecture/database.md),
[backend ownership](../architecture/backend.md), and [dependencies](../architecture/dependency-rules.md).

1. Identify the required persistence operation and service use case. Inspect the
   actual schema; if a change is required, follow [migrations](database-migrations.md).
2. Use the established request-scoped client factory in `src/lib/supabase/` for
   authenticated reads. Sync/reparse writes use the server secret client after
   service authentication. Preserve the access policy and regenerate database types.
3. Add a focused server-only repository in `src/repositories/`, using the integration
   client for queries. Keep persistence-specific failures and minimal mapping here.
4. Call the repository from a server-only service. Place business transformations,
   multi-repository composition, authorization, and workflow coordination in the service.
5. Verify allowed and denied access, empty results, persistence failures, and any
   required atomicity against an isolated database. Do not use production for tests.
6. Run applicable [checks](../../AGENTS.md#commands). Update schema artifacts only from
   reliable generation; update architectural documents if their contract changes.
