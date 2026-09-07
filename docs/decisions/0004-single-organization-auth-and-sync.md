# 0004: Invite-only access and server-owned synchronization

## Status

Accepted

## Context

Planning Center source data belongs to one church. Leaders need a shared read view
and controlled synchronization, while local development must be reproducible without
live church credentials. Browser write access would expose synchronized history to
accidental mutation and permit bypassing parsing/classification.

## Decision

Use a dedicated invite-only Supabase Auth project, authenticated read-only table
access, and server-owned writes behind authenticated services. Serialize sync and
stored-data reparse with a database lease and atomically replace each plan snapshot.
Provide synthetic local fixtures and an invited local account, isolated from remote
migrations. See [authentication](../architecture/authentication.md) and
[Scripture usage](../architecture/scripture-usage.md) for the current contracts.

## Consequences

All invited users have equal access in the MVP. The project must not share its Auth
tenant with unrelated public-signup applications. A service secret is required for
sync/reparse, but ordinary reads preserve RLS. Transactional persistence prevents
partial-plan results; already completed plans survive a later sync failure. The
local synchronous workflow is simple to inspect, but a timed serverless deployment
would require a durable worker decision before large historical imports.
