# Add an integration

Use [integration rules](../architecture/integrations.md) and
[validation boundaries](../architecture/validation.md).

1. Establish the provider, required operations, credentials, and failure behavior.
   Read its current official SDK/API documentation before selecting implementation details.
2. Create `src/lib/<integration>/` with server-only client/configuration modules.
   Add only the SDK dependencies actually needed; update the npm lockfile.
3. Validate configuration and applicable external responses. Document variable names
   in `.env.example` without real secrets. Keep credentials out of public configuration.
4. Implement low-level provider calls with deliberate timeout/retry semantics.
5. Orchestrate business workflows in a service; expose client operations through a
   Route Handler using [the endpoint workflow](add-api-endpoint.md).
6. Verify success, provider failure, invalid payloads, and duplicate-side-effect
   behavior where relevant with mocks or the provider's test environment.
7. Run applicable [checks](../../AGENTS.md#commands). Extend import restrictions if a
   new SDK needs enforcement, and document operational setup and accepted decisions.
