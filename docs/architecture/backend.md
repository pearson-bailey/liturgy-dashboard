# Backend responsibilities

> Status: Active
> Scope: Route Handlers, services, repositories
> Canonical for: Ownership of transport, business orchestration, and persistence

## Route Handlers

Handlers under `src/app/api/**/route.ts` are transport adapters. They SHOULD
authenticate/authorize as appropriate, read input, validate it with Zod, call a
service, and map the result or known failure to HTTP.

Handlers MUST NOT contain Supabase queries, combine repository results, implement
substantial business logic, or perform application filtering/restructuring.
Reading headers/query strings and serializing a service result are transport work.

## Services

Services MUST own meaningful application transformations, business filtering,
aggregation, calculations, and combinations of data from multiple tables/repositories.
They MAY call one or more repositories or integration clients and coordinate
multi-step workflows. Services MUST NOT contain React/UI concerns or HTTP response
construction. Resource authorization belongs here when it must hold for all callers.

Multi-step persistence is not automatically atomic. A service requiring atomicity
MUST use a suitable database transaction/RPC via a repository, or explicitly design
partial-failure handling; a sequence of SDK calls is not a transaction.

## Repositories

Repositories MUST own application data selects, inserts, updates, deletes, and
database/RPC calls. They SHOULD handle persistence-specific failures and return
database-oriented results with minimal safe mapping.

Repositories MUST NOT import services/UI, orchestrate other repositories, or own
application-facing transformations or aggregation. Persistence predicates, joins
needed to retrieve records, ordering, and pagination MAY be expressed in the query;
business selection policy and application output shaping belong to services.
An optimization that moves business computation into SQL requires a deliberate
architectural decision rather than silently bypassing this ownership rule.

## Example responsibilities

Illustrative only:

| Work                                            | Owner                        |
| ----------------------------------------------- | ---------------------------- |
| Parse an incoming date range with Zod           | HTTP boundary schema/handler |
| Execute a select using validated query criteria | Repository                   |
| Combine results and calculate a business total  | Service                      |
| Convert a known missing result to HTTP 404      | Route Handler                |
| Format a date for display                       | UI helper                    |

## Related documentation

[Allowed/forbidden dependencies](dependency-rules.md), [database](database.md),
[layer rationale](../decisions/0002-repository-service-layer.md).
