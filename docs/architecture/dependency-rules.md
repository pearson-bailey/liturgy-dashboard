# Dependency rules

> Status: Active
> Scope: Imports and execution boundaries
> Canonical for: Allowed dependencies, forbidden dependencies, server/client protection

## Allowed dependencies

| Caller                     | Allowed dependencies                                                 |
| -------------------------- | -------------------------------------------------------------------- |
| Client Component           | Client-safe UI, schemas, types, pure helpers; backend via HTTP       |
| Server Component           | UI, shared contracts/helpers, server services                        |
| Route Handler              | Services, boundary schemas/types/helpers, framework HTTP APIs        |
| Service                    | Repositories, integration clients, shared contracts/helpers          |
| Repository                 | Supabase integration, shared contracts/types/persistence helpers     |
| Integration                | Its provider SDK, configuration validation, low-level shared helpers |
| Shared schema/type/utility | Other environment-independent shared modules                         |

## Forbidden dependencies

- Client Component -> service, repository, server Supabase client, or private integration.
- Route Handler -> repository, Supabase client/SDK, or direct provider client.
- Server Component -> repository or direct provider client.
- Service -> React/UI or App Router implementation.
- Repository -> service, another repository for orchestration, UI, or unrelated providers.
- Integration -> service, repository, UI, or business workflow.
- Shared schema/type/utility -> app, server services, repositories, or integration infrastructure.

Provider SDK imports MUST remain in their `src/lib/<integration>/` adapter.
Application data queries MUST remain in repositories, even though the Supabase
client is initialized in `lib`. A type-only import MUST NOT be used to couple
client code to server implementation; move shared contracts to a client-safe module.

## Server/client protection

- Every implementation module under `services`, `repositories`, and `lib` MUST
  import `"server-only"`. This project treats these directories as server-only.
- Pure environment-independent logic intended for both environments SHOULD live
  in local support modules or shared schema/type/utility directories as appropriate.
- A future shared service exception requires a deliberate rule/tooling change;
  contributors MUST NOT remove a marker merely to satisfy a client import.
- Client backend operations MUST use HTTP Route Handlers. `"use server"` directives
  and Server Actions MUST NOT be introduced for application operations.
- Secrets and private provider configuration MUST NOT be passed in client props,
  response payloads, browser bundles, or `NEXT_PUBLIC_` environment variables.

## Enforcement

[ESLint configuration](../../eslint.config.mjs) restricts static imports/re-exports
using the `@/` alias and conventional relative paths, rejects `"use server"`,
and requires server-only imports in server implementation directories. It also
rejects JSX there and keeps Supabase SDK imports out of app/services/repositories.
`npm run build` exercises Next.js's server/client graph protection through these
markers, including transitive imports into Client Components.

The flat configuration follows the official [Next.js ESLint setup](https://nextjs.org/docs/app/api-reference/config/eslint).

This is deliberately lightweight, not a complete dependency-graph checker:

- Dynamic imports, `require`, unusual path spellings, and custom aliases require
  review; contributors MUST NOT use them to evade layer restrictions.
- Semantic query placement, service transformations, cross-repository calls,
  filename conventions, and third-party SDK imports beyond Supabase require review.
- A marker protects bundling, not authorization or response contents.
- No CI is installed yet. Run the [checks](../../AGENTS.md#commands) locally;
  when adding CI, execute the same checks and production build.

If checks miss an observed violation, extend the smallest relevant rule and
verify both an allowed case and a rejected case before adding custom infrastructure.

## Related documentation

[Backend ownership](backend.md), [request flow](request-data-flow.md),
[integrations](integrations.md), [technical debt](../plans/tech-debt.md).
