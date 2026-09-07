# Runtime validation

> Status: Active
> Scope: Untrusted data entering the system
> Canonical for: Zod boundary validation and schema ownership

## Rules

- Untrusted input MUST be validated with Zod at its system boundary: JSON bodies,
  query parameters, form payloads, webhook payloads, and configuration where appropriate.
- External API responses MUST be validated when their runtime shape is not sufficiently
  guaranteed. Provider adapters own provider-response validation.
- TypeScript casts such as `as SomeType` MUST NOT substitute for runtime validation.
- Schemas SHOULD start local; promote only according to [organization rules](code-organization.md).
- Types SHOULD be inferred from schemas when they describe the same contract.
- Boundary validation establishes input shape; services still enforce business
  preconditions and authorization for every entry point.
- Webhooks requiring signature verification MUST verify authenticity against the
  provider-required raw payload before trusting parsed input.
- Validation failures MUST be mapped to the caller's error contract without exposing
  secrets. Configuration errors SHOULD fail clearly when the configuration is used.

## Example

Illustrative file: `src/app/api/<operation>/_utils/list-query.schema.ts`.

```ts
import { z } from "zod";

export const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
```

Pass an absent query value as `undefined` when relying on this default;
`URLSearchParams.get()` returns `null`, which coercion handles differently.
Malformed JSON must also be handled: a successful Zod check cannot occur if
`request.json()` throws first.

## Common mistakes

Trusting typed SDK responses without considering runtime guarantees, returning raw
validation errors that contain sensitive input, or validating only in the browser.

## Related documentation

[Request flow](request-data-flow.md), [integration boundaries](integrations.md),
[add an endpoint](../workflows/add-api-endpoint.md).
