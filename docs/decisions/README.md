# Architecture decision records

ADRs record why a significant decision was accepted. Current rules belong in
[architecture documentation](../README.md#canonical-architecture-owners).

## Accepted decisions

1. [Route Handlers rather than Server Actions](0001-use-route-handlers-not-server-actions.md)
2. [Repository and service separation](0002-repository-service-layer.md)
3. [Local-first route organization](0003-localize-route-specific-code.md)
4. [Invite-only access and server-owned synchronization](0004-single-organization-auth-and-sync.md)

## Process

Create the next zero-padded sequential number with a kebab-case title. Include
Status, Context, Decision, and Consequences. Discuss costs as well as benefits,
and link to the canonical rules instead of copying them.

Use Proposed until accepted. When replacing an accepted decision, add a new ADR,
mark the old one Superseded with a link to its successor, and update the current
architecture and this index. Preserve historical rationale.
