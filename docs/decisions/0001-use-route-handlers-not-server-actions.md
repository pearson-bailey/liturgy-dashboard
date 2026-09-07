# 0001: Use Route Handlers rather than Server Actions

## Status

Accepted

## Context

The application needs one discoverable client-to-backend boundary that human and
automated contributors can inspect consistently. Next.js offers several ways to
execute backend logic; mixing them would make authorization, validation, and
transport ownership less obvious.

## Decision

Use Route Handlers for Client Component backend interactions. Allow server
rendering to invoke services directly. The [dependency contract](../architecture/dependency-rules.md)
and [request flow](../architecture/request-data-flow.md) define current behavior.

## Consequences

HTTP requests provide explicit input, status, and error contracts and permit
callers beyond React. Client operations need fetch/state handling and deliberate
error serialization. The project forgoes Server Action conveniences. Shared
service authorization remains necessary because server callers bypass HTTP.
