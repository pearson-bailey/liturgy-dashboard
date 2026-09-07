# Frontend

> Status: Active
> Scope: App Router UI
> Canonical for: Rendering, composition, and client interaction behavior

## Rules

- Components SHOULD remain Server Components unless interactivity or browser APIs
  require a Client Component. Keep the client boundary as small as practical.
- `page.tsx` SHOULD orchestrate data loading and compose meaningful UI sections.
- Substantial sections with coherent responsibilities SHOULD move to route-local
  `_components`. Contributors SHOULD NOT extract trivial JSX just to reduce line count.
- Client operations SHOULD expose pending, success, and error states and avoid
  accidental duplicate submissions when an operation is in flight.
- Data passed to Client Components MUST be serializable and limited to what the UI needs.
- Client validation MAY improve feedback, but MUST NOT replace server validation.

## Dependencies and request flow

The [dependency matrix](dependency-rules.md) owns import boundaries. Follow the
[client/server flows](request-data-flow.md) when data is needed; use a service for
server rendering and `fetch` to a Route Handler for client backend operations.

## Common mistakes

Placing business aggregation in a page because it already has the data, importing
a repository into a client hook, or treating `_components` as a security boundary
violates the layer model. Display-only formatting can remain a frontend helper;
business calculations belong in services.

## Related documentation

[Organization](code-organization.md), [validation](validation.md),
[add a page](../workflows/add-page.md).
