# Integrations

> Status: Active
> Scope: Connections to external providers
> Canonical for: Provider adapter placement and responsibilities

## Rules

- Provider SDK initialization, connection settings, credentials, provider auth, and
  low-level provider helpers MUST live in `src/lib/<integration>/`.
- Integration modules MUST NOT implement business workflows. Services coordinate
  provider calls and application persistence.
- Provider adapters SHOULD translate provider-specific failures into safe, useful
  failures without leaking tokens or private responses to callers.
- Network calls SHOULD have explicit timeout and retry behavior appropriate to the
  operation; retries MUST account for duplicate side effects and provider limits.
- Configuration MUST be validated at use/startup as appropriate and stay server-only.
- External response validation follows the [validation contract](validation.md).

## Examples and dependencies

`src/lib/supabase/` contains request/secret clients, validated configuration, and SSR
cookie refresh. `src/lib/planning-center/` contains the validated paginated Services
API client. `src/lib/scripture/` adapts the established reference parser and HTML-to-text
library. Business classification, synchronization, and analytics remain in services.

Services call external adapters; repositories use the Supabase adapter for
persistence. See the [dependency matrix](dependency-rules.md) for allowed and
forbidden imports. Direct provider calls from a handler would couple transport to
provider mechanics and bypass service ownership.

## Related documentation

[Backend](backend.md), [database](database.md),
[add an integration](../workflows/add-integration.md).
