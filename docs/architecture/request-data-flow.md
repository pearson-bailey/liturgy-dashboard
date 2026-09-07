# Request and data flow

> Status: Active
> Scope: Application operation sequencing
> Canonical for: Boundary order and failure propagation

## Client request

```text
Client Component
  -> fetch /api/<operation>
  -> Route Handler: identity/access check + read/validate input
  -> Service: business policy and orchestration
  -> Repository: persistence
  -> Supabase
  <- Repository result -> service result -> HTTP response -> client UI state
```

The handler MUST map known failures to intentional HTTP responses. Malformed
JSON and invalid inputs SHOULD yield 400; missing identity 401; denied access
403; absent resources 404; conflicts 409 where these meanings fit the operation.
Unexpected failures MUST produce a safe server-error response without provider
details or credentials. Client code MUST check response status before treating a
payload as success. API failures use `{ "error": "safe message" }` with the corresponding
status; success payloads have endpoint-specific Zod contracts. Responses are private/no-store.

## Server rendering

```text
Server Component -> Service -> Repository -> Supabase
                        |
                        +-> External integration when required
```

A Server Component MAY call the service directly. It SHOULD map expected domain
outcomes to rendering behavior and let unexpected failures reach the appropriate
error boundary. It MUST NOT make a self-HTTP request merely to reach a service.

## Rules shared by both flows

- Request authentication MUST precede protected operations; resource/business
  authorization MUST be enforced in services so direct server callers cannot bypass it.
- Services MUST receive or resolve trusted identity context; a client-supplied user
  identifier alone is not proof of identity.
- Boundaries MUST validate untrusted inputs before they reach business operations.
  Services MUST preserve business preconditions regardless of caller.
- Integration responses return to services for orchestration and then to the caller.
- Request-scoped identity/client state MUST NOT be shared across users through a
  module-level singleton or incorrectly scoped cache.

[Authentication](authentication.md) defines verified request identity, callback
handling, and same-origin mutation checks. Dashboard reads are uncached so a
refresh after synchronization reflects the latest completed plan snapshots.

## Related documentation

[Validation](validation.md), [backend](backend.md), [database](database.md),
[dependencies](dependency-rules.md).
