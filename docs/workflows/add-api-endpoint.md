# Add an API endpoint

Use [backend ownership](../architecture/backend.md),
[validation](../architecture/validation.md), and [request flow](../architecture/request-data-flow.md).

1. Define the HTTP method, input/result contract, known error responses, and access
   policy for the actual operation. Create `src/app/api/<path>/route.ts`.
2. Define a local Zod schema or reuse an established shared contract. Handle both
   malformed JSON and schema-invalid input, including query/form input as applicable.
3. Authenticate protected requests and pass trusted identity to the service; ensure
   resource authorization also holds for direct server callers. For cookie-authenticated
   mutations, establish appropriate origin/CSRF protection with the auth design.
4. Implement/reuse a server-only service. Follow [database access](add-database-access.md)
   or [integration setup](add-integration.md) as needed. Keep the handler transport-only.
5. Map known failures to documented statuses and unexpected failures to safe responses.
6. Verify valid input, malformed input, unauthorized/forbidden callers, and relevant
   failure paths. Add focused Vitest coverage and Playwright coverage where browser
   behavior matters. Use the existing local database suite for persistence/access policy.
7. Run applicable [checks](../../AGENTS.md#commands), including a build when client/server
   boundaries change. Update affected contracts/ADRs only when warranted.
