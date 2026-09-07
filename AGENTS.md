# Agent entry point

This is the shared contract for Codex, Claude Code, and human contributors.
Read this file first, then load only the documents relevant to the task.

## Project

- Stack: Next.js App Router, React, TypeScript, Supabase, and Zod.
- Package manager: npm; commit `package-lock.json` with dependency changes.
- Runtime: Node.js 22.12+ or 24 LTS (Node.js 24 was used to verify the scaffold).
- Product: invite-only Scripture-usage analytics for one church organization.
- Local Supabase, authentication, Planning Center sync, parsing, and dashboard are implemented.

## Architectural contract

These are entry-point summaries; linked documents own the detailed rules.

- Client Components MUST reach backend application logic through HTTP Route Handlers.
- Server Components MAY call services directly; self-HTTP is not required.
- Application API operations MUST NOT use Server Actions.
- Dependency direction: UI/HTTP boundary -> service -> repository -> Supabase.
- Services MAY also call third-party integrations.
- Client Components MUST NOT import server implementation modules.
- Route Handlers MUST remain transport adapters and MUST NOT query Supabase.
- Repositories MUST own application data persistence operations.
- Services MUST own business transformations, filtering, and aggregation.
- Repositories MUST NOT orchestrate other repositories or import services/UI.
- Provider connection code MUST live in `src/lib/<integration>/`.
- Untrusted boundary data MUST be validated with Zod, not TypeScript casts.
- Server implementation modules MUST use `import "server-only"`.
- Secrets MUST NOT enter Client Component code or public configuration.

Read [dependency rules](docs/architecture/dependency-rules.md) before changing
layer boundaries, [backend](docs/architecture/backend.md) for logic ownership,
and [validation](docs/architecture/validation.md) for runtime boundaries.

## Placement and naming

- Code SHOULD start near the route or feature that owns it.
- Route UI SHOULD live in `_components`; route support code in `_utils`.
- `page.tsx` SHOULD focus on orchestration and meaningful UI composition.
- Shared promotion MUST follow demonstrated reuse or an application-wide concept.
- React component filenames MUST use PascalCase, such as `UserCard.tsx`.
- Other ordinary application filenames MUST use kebab-case.
- Framework filenames MUST retain their required names, such as `page.tsx`.
- Local `_utils` files MUST have descriptive semantic suffixes:
  `.schema.ts`, `.types.ts`, or `.utils.ts` as appropriate.
- Global `src/schema`, `src/types`, and `src/utils` files need no role suffix.
- Directories SHOULD use kebab-case, except framework/private conventions.
- Contributors MUST NOT add speculative abstractions or empty source folders.

See [code organization](docs/architecture/code-organization.md) for placement,
examples, and planned versus existing directories.

## Commands

- Install locked dependencies: `npm ci`.
- Run locally: `npm run dev`.
- Format changes: `npm run format`.
- Check formatting: `npm run format:check`.
- Lint, including static layer restrictions: `npm run lint`.
- Generate route types and check TypeScript: `npm run typecheck`.
- Run the preceding non-mutating checks: `npm run check`.
- Verify production compilation: `npm run build`.
- Serve a production build: `npm start`.
- Unit tests: `npm test`; local database tests: `npm run test:db`.
- Browser tests: `npm run test:e2e` (requires local Supabase and Chromium).
- Local setup and generated artifacts: [local development](docs/workflows/local-development.md).
- Contributors SHOULD add focused tests when behavior warrants them.
- Contributors MUST run applicable checks and report checks they could not run.

See [dependency enforcement](docs/architecture/dependency-rules.md#enforcement)
for what the tools check and what still requires review.

## Find the right context

- [Architecture map](ARCHITECTURE.md): layers, flows, and source map.
- [Documentation index](docs/README.md): canonical ownership and task lookup.
- [Frontend](docs/architecture/frontend.md): rendering and client boundaries.
- [Database](docs/architecture/database.md): persistence, schema, and access policy.
- [Integrations](docs/architecture/integrations.md): SDKs and private configuration.
- [Scripture usage](docs/architecture/scripture-usage.md): classification, parsing, sync, counts.
- [Authentication](docs/architecture/authentication.md): invite-only access and auth flows.
- [Workflows](docs/README.md#workflows): repeatable development checklists.
- [Decision records](docs/decisions/README.md): rationale for accepted decisions.

## Documentation maintenance

Contributors MUST update the canonical document when a change alters an
architectural invariant, dependency direction, organization rule, or workflow.
A significant accepted design decision MUST have an ADR added or superseded.
Incidental implementation changes MUST NOT trigger architectural rewrites.
When code and documentation disagree, contributors MUST determine the intended
contract before changing either; MUST NOT silently bless implementation drift.
Rules MUST have one canonical owner; other documents SHOULD link or summarize.
Generated database documentation MUST NOT be manually maintained as schema truth.
Plans MAY capture temporary work; accepted contracts belong in architecture/ADRs.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
