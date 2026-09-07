# Architecture map

> Status: Active
> Scope: Application-wide overview
> Canonical for: Navigation between architectural concerns

## Layers and flows

```text
Client Component -- HTTP --> Route Handler --+
                                            |
Server Component ---------------------------+--> Service --> Repository --> Supabase
                                                 |
                                                 +--> Third-party integration
```

Route Handlers adapt HTTP to application operations. Server Components can call
the same service without an HTTP round trip. Services orchestrate business work;
repositories persist application data; integration modules initialize providers.
See [dependency rules](docs/architecture/dependency-rules.md) for the complete
allowed/forbidden matrix and [request flow](docs/architecture/request-data-flow.md)
for boundary sequencing and failures.

## Boundaries

- [Frontend](docs/architecture/frontend.md): rendering, client interaction, composition.
- [Backend](docs/architecture/backend.md): transport, service, and repository ownership.
- [Database](docs/architecture/database.md): Supabase access, migrations, and credentials.
- [Integrations](docs/architecture/integrations.md): provider setup versus business workflows.
- [Validation](docs/architecture/validation.md): Zod at untrusted input/configuration boundaries.

## Source map

The implemented source contains:

```text
src/
  app/
    (auth)/                 # Sign-in, recovery, password update
    (authenticated)/dashboard/
      _components/          # Filters, heatmap, tables, sync controls
      _utils/               # Heatmap presentation helpers
    api/                    # Auth, dashboard, sync Route Handlers
    auth/confirm/           # Invitation / recovery callback
  lib/
    supabase/
    planning-center/
    scripture/
  services/                 # Auth, sync, classification, parsing, analytics
  repositories/             # Persistence queries and transactional RPC adapters
  schema/                   # Shared boundary contracts
  types/                    # Domain contracts and generated database types
  utils/                    # Canon and client-safe reusable helpers
  proxy.ts                  # SSR cookie refresh through auth service
```

The [organization guide](docs/architecture/code-organization.md#directory-map)
owns placement. [Scripture usage](docs/architecture/scripture-usage.md) owns domain
rules and synchronization; [authentication](docs/architecture/authentication.md)
owns invitation-only access. SQL migrations are under `supabase/migrations/`.

## Deeper context

[Principles](docs/architecture/principles.md) explain how to resolve placement
choices. [ADRs](docs/decisions/README.md) record decision rationale.
[Workflows](docs/README.md#workflows) translate the contract into implementation
steps. The [documentation index](docs/README.md) identifies each canonical owner.
