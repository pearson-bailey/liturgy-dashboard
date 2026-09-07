# Code organization

> Status: Active
> Scope: Source placement and names
> Canonical for: Local-first organization, promotion, filename conventions

## Rules

- Code SHOULD begin near its owning route/feature. Route-specific UI belongs in
  `_components`; schemas, types, constants, and helpers belong in `_utils`.
- Backend responsibilities still belong in `services`, `repositories`, and `lib`;
  local-first placement MUST NOT bypass layer boundaries.
- Code MAY move to global directories when unrelated routes/features actually reuse
  it or it represents an established application-wide domain concept.
- Importing a route schema in its corresponding API handler is feature-local reuse,
  not by itself a reason to create a global schema.
- Global code MUST NOT depend on private route implementation details. A contract
  needed by both a service and UI SHOULD move to an appropriate shared schema/type module.
- Contributors MUST NOT create empty source directories for appearance.

## Naming

| Kind                        | Convention                          | Example                                                    |
| --------------------------- | ----------------------------------- | ---------------------------------------------------------- |
| React component             | PascalCase                          | `UserCard.tsx`                                             |
| Ordinary application module | kebab-case                          | `users-service.ts`, `format-date.ts`                       |
| Local Zod schema            | descriptive `.schema.ts`            | `user-form.schema.ts`                                      |
| Local TS-only declarations  | descriptive `.types.ts`             | `user-table.types.ts`                                      |
| Local helper/constants      | descriptive `.utils.ts`             | `user-display.utils.ts`                                    |
| Global schema/type/helper   | kebab-case; role suffix unnecessary | `schema/user.ts`, `types/order.ts`, `utils/format-date.ts` |

Files inside `_utils` MUST use a descriptive semantic suffix. Generic `utils.ts`,
`types.ts`, `schema.ts`, and `helpers.ts` MUST NOT be used there. If another role
arises, choose a descriptive role suffix and document it here.

Framework-mandated names MUST stay intact: `page.tsx`, `layout.tsx`, `route.ts`,
`loading.tsx`, `error.tsx`, `not-found.tsx`, `template.tsx`, and other Next.js
special files. Tooling files and generated names follow their tool conventions.
Directories SHOULD use kebab-case except framework conventions such as route
groups/dynamic segments and intentional private directories such as `_components`.

## Directory map

| Path                                           | Responsibility                                                        |
| ---------------------------------------------- | --------------------------------------------------------------------- |
| src/app/                                       | App Router entries, private route UI and support modules              |
| src/app/api/**/route.ts                        | HTTP adapters for authentication, sync, and dashboard                 |
| src/app/(auth)/_components/                    | Shared authentication form within its owning route group              |
| src/app/(authenticated)/dashboard/_components/ | Heatmap, filters, tables, and sync UI                                 |
| src/app/(authenticated)/dashboard/_utils/      | Heatmap presentation helpers                                          |
| src/lib/supabase/                              | Validated config, request/secret clients, SSR cookies                 |
| src/lib/planning-center/                       | Low-level paginated Planning Center transport                         |
| src/lib/scripture/                             | Bible parser and safe HTML-to-text adapter                            |
| src/services/                                  | Auth, synchronization, classification, parsing, analytics             |
| src/repositories/                              | Persistence and RPC adapters                                          |
| src/schema/                                    | Shared validated contracts for browser, services, and HTTP boundaries |
| src/types/                                     | Application contracts and generated database types                    |
| src/utils/                                     | Canon metadata and reusable environment-independent helpers           |
| src/proxy.ts                                   | Framework SSR session-refresh entry point                             |

## Example

Illustrative only; no orders feature currently exists:

```text
src/app/orders/
  page.tsx
  _components/
    OrderList.tsx
    OrderFilters.tsx
  _utils/
    order-filters.schema.ts
    order-list.types.ts
    order-display.utils.ts
```

## Common mistakes

A private folder prevents routing; it does not make a module server-only.
Placing a provider SDK in `_utils` also does not change its architectural layer.

## Related documentation

[Dependency rules](dependency-rules.md), [frontend](frontend.md),
[local-first rationale](../decisions/0003-localize-route-specific-code.md).
