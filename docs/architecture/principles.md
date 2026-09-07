# Architectural principles

> Status: Active
> Scope: Design choices across the application
> Canonical for: Scope discipline and architectural tradeoffs

## Purpose

Keep ownership obvious and context small enough for a new contributor to find
the relevant contract without reading the entire repository.

## Rules

- Contributors MUST distinguish established requirements from illustrative examples.
  Names such as `orders` in documentation do not establish an application domain.
- Contributors SHOULD choose the smallest implementation that satisfies an actual
  requirement; MUST NOT invent tables, providers, or abstractions for anticipated work.
- New abstractions SHOULD make an existing responsibility or repeated operation clearer.
- Architectural exceptions MUST be explicit, justified, and reflected in the owning
  document and enforcement. Significant decisions follow the ADR process.
- Mechanical checks SHOULD enforce concrete boundaries when their benefit exceeds
  maintenance cost. Review remains necessary for semantic ownership of business logic.

## Common mistakes

Creating a service/repository pair with no use case, adding speculative shared
utilities, or treating every implementation detail as an architectural decision
adds maintenance cost without clarifying the system.

## Related documentation

[Organization](code-organization.md), [dependency rules](dependency-rules.md),
[ADR process](../decisions/README.md), [maintenance contract](../../AGENTS.md#documentation-maintenance).
