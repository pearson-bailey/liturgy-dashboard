# Add a page

Use [frontend rules](../architecture/frontend.md) and
[placement/naming](../architecture/code-organization.md).

1. Locate the owning route/subtree and create its required `page.tsx` entry point.
2. Start with server rendering. If data is needed, define/reuse a service and apply
   the [server flow](../architecture/request-data-flow.md); do not invent data sources.
3. Extract substantial coherent UI into local `_components`. Keep supporting
   schemas/types/helpers in descriptively suffixed `_utils` files.
4. Introduce a Client Component only where interactivity requires it. For backend
   interactions, follow [add an API endpoint](add-api-endpoint.md).
5. Handle meaningful loading, empty, and error states; check keyboard interaction
   and accessible labels for controls introduced by the page.
6. Run applicable [checks](../../AGENTS.md#commands) and verify the route locally.
   Update canonical docs only if the architectural contract changes.
