# Documentation index

Read [AGENTS.md](../AGENTS.md) for the shared contract and commands, then
[ARCHITECTURE.md](../ARCHITECTURE.md) for the map. Load the smallest set of
documents that answers the current task.

## Canonical architecture owners

| Document                                               | Owns                                                       |
| ------------------------------------------------------ | ---------------------------------------------------------- |
| [Principles](architecture/principles.md)               | Scope discipline and architectural tradeoffs               |
| [Code organization](architecture/code-organization.md) | Placement, promotion, naming, directory map                |
| [Dependency rules](architecture/dependency-rules.md)   | Allowed imports, server/client protection, enforcement     |
| [Request/data flow](architecture/request-data-flow.md) | Boundary sequencing and error flow                         |
| [Frontend](architecture/frontend.md)                   | UI composition and client interaction behavior             |
| [Backend](architecture/backend.md)                     | Transport, orchestration, and persistence responsibilities |
| [Database](architecture/database.md)                   | Database access policy and schema authority                |
| [Validation](architecture/validation.md)               | Runtime validation boundaries and schema ownership         |
| [Integrations](architecture/integrations.md)           | Provider configuration and low-level adapters              |

Summaries and workflow checklists point to these owners instead of creating
alternate rules. Maintenance requirements live in [AGENTS.md](../AGENTS.md#documentation-maintenance).

Domain contracts: [Scripture usage](architecture/scripture-usage.md) owns liturgical
classification, parsing, sync, and analytics; [authentication](architecture/authentication.md)
owns invitation-only identity and session flows.

## Workflows

- [Local development and setup](workflows/local-development.md)
- [Hosted invitations and password recovery](workflows/hosted-authentication.md)
- [Add a page](workflows/add-page.md)
- [Add an API endpoint](workflows/add-api-endpoint.md)
- [Add database access](workflows/add-database-access.md)
- [Add an integration](workflows/add-integration.md)
- [Database migrations](workflows/database-migrations.md)

## Decisions, plans, and generated references

- [Decision records](decisions/README.md): accepted rationale and ADR process.
- [Active plans](plans/active/README.md): temporary implementation plans.
- [Completed plans](plans/completed/README.md): completed plan archive.
- [Technical debt](plans/tech-debt.md): known gaps and follow-up triggers.
- [Database schema reference](generated/database-schema.md): mechanically synchronized migration SQL.
