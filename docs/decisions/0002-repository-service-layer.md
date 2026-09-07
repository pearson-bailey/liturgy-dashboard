# 0002: Separate repositories and services

## Status

Accepted

## Context

Persistence details and application transformations change for different reasons.
Mixing them in handlers or query helpers would obscure ownership and make the same
operation harder to reuse for both HTTP and server rendering.

## Decision

Separate database persistence from application orchestration using repositories
and services. [Backend responsibilities](../architecture/backend.md) owns the
precise boundary; the [dependency matrix](../architecture/dependency-rules.md)
defines allowed imports.

## Consequences

Services can coordinate data sources and be tested against controlled persistence
behavior. Repositories keep provider/query details localized. Simple operations
may require an extra function boundary, but empty abstractions are unnecessary.
Atomic multi-step operations need explicit transaction design; layers alone do
not provide atomicity. Review must distinguish query mechanics from business policy.
