# 0003: Localize route-specific code

## Status

Accepted

## Context

Global folders tend to accumulate unrelated helpers and schemas when reuse is
assumed too early. Contributors then need broader context to understand a small
route change. App Router private folders offer explicit local organization.

## Decision

Keep route UI and supporting code near their owner using `_components` and
`_utils`, promoting established shared concepts as needed. The
[organization guide](../architecture/code-organization.md) owns placement and names.

## Consequences

Route changes stay discoverable within a small subtree and global folders remain
purposeful. Some local similarity may precede genuine reuse, and promotion can
require moving files later. Locality does not override backend layer boundaries
or turn private folders into server/client protection.
