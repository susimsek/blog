---
name: code-quality
description: Review and refactor code for this blog platform using clean code principles, React/Next.js patterns, Go layering, GraphQL/API contracts, duplication reduction, and verification discipline. Use when the user asks to review, refactor, optimize, clean, simplify, or improve maintainability.
---

# Code Quality

Systematic code-quality review and refactor workflow for this Next.js + React + TypeScript + Go + GraphQL blog platform.

## When To Use

- "review this code"
- "refactor"
- "clean code"
- "optimize maintainability"
- "find bad code"
- before merging non-trivial UI, GraphQL, or backend changes

## When Not To Use

- Do not turn a small bug fix into a broad cleanup unless the user asks for a wider refactor.
- Do not change public GraphQL or HTTP contracts just because the internal code could be cleaner.
- Do not rewrite stable code purely for style if there is no readability, correctness, or maintenance gain.
- Do not refactor generated files; change the source or config that owns them.
- Do not introduce new abstractions when deleting duplication or simplifying flow is enough.
- Do not revert unrelated user changes while cleaning code.

## Workflow

1. Quick scan the changed or relevant area.
2. Identify the highest-signal 1-3 issues first.
3. Classify them by severity before changing code.
4. Prefer behavior-preserving refactors over broad churn.
5. Reuse existing hooks, helpers, and domain utilities before adding new abstractions.
6. Run the minimum repo verification stack before handoff.

## Severity Levels

- Critical: crash risk, data corruption, security issue, broken auth/session flow, broken contract, or clear production correctness bug. Must fix before merge.
- Important: performance issue, race condition, duplicated domain logic, major maintainability risk, or API misuse. Should fix in the same change when scoped.
- Code Smell: readability issue, oversized function, naming problem, dead code, unnecessary indirection, repeated glue code. Fix when low-risk.
- Good: notable strong patterns worth preserving, especially shared helpers, clear layering, focused hooks, and stable contracts.

## Review Priorities

### Clean Code

- Remove duplication before adding new abstraction.
- Prefer simple data flow over clever indirection.
- Avoid premature abstractions and dead configuration paths.
- Keep components and services focused on one responsibility.
- Replace magic numbers and magic strings when they represent stable domain rules.
- Use names that describe intent, not implementation mechanics.

## Clean Code Principles

### DRY

- Flag repeated validation, normalization, mapping, timeout, debounce, fetch, and error-handling logic.
- Prefer one shared helper or hook when the same logic appears in multiple places.
- In this repo, first look for existing utilities under `src/hooks`, `src/lib`, `internal/service`, and `internal/graphql/admin`.

### KISS

- Prefer the smallest solution that matches current product behavior.
- Do not introduce factories, adapters, wrapper types, or extra configuration unless they remove real complexity.
- When reviewing React code, prefer straightforward state flow over stacked effects and indirection.

### YAGNI

- Do not add extension points, option flags, or abstractions for hypothetical future use.
- Remove dead branches, stale compatibility code, and state that no longer drives UI or API behavior.
- If an abstraction only has one caller and does not clarify intent, inline or simplify it.

### SRP

- Components should not mix UI rendering, async orchestration, and unrelated domain rules when these can be separated cleanly.
- Resolvers should stay thin; services should not become god-objects.
- Split large files by domain responsibility when the split reduces cognitive load without changing contracts.

### Naming And Intent

- Prefer names that describe business meaning: `loadPostComments`, `preferredContentLocale`, `revokeAllAdminSessions`.
- Flag names like `handleData`, `processThing`, `value2`, or `doStuff`.
- Rename variables and functions when intent is unclear even if the code is technically correct.

### Side Effects And State

- Avoid duplicated effect logic when an existing hook already solves it.
- Avoid storing derived state that can be computed from current inputs.
- Effects should synchronize with external systems, not compensate for unclear local state design.

### Error Handling

- Preserve the original cause on backend errors.
- Avoid silent failure, swallowed exceptions, and broad catch-all behavior unless it is deliberate and documented.
- Frontend error handling should normalize user-visible messages consistently instead of branching ad hoc in every component.

### API And Contract Discipline

- Keep GraphQL and HTTP contracts stable unless the task explicitly changes them.
- Prefer DTO/view-model mapping over leaking persistence models.
- Validate verb semantics, mutation intent, pagination, locale handling, and nullability assumptions.

### React And Next.js

- Extract repeated non-visual logic into purpose-driven custom hooks.
- Prefer existing repo hooks like `useDebounce` and `useAutoClearValue` over hand-written effect loops.
- Avoid storing derived state when it can be computed from props or state.
- Keep effects for synchronization, not data shaping.
- Preserve static-export constraints; do not introduce server-only Next.js patterns.
- Follow existing repo guidance: do not add `useMemo` or `useCallback` by default unless they solve a real problem or match local patterns.

### TypeScript

- Prefer narrow types and explicit unions over loose strings.
- Keep state shapes small and normalized.
- Avoid duplicating the same parsing, trimming, or normalization logic across handlers.
- Reuse shared mapping helpers when transforming API payloads.

### Go Backend

- Keep handlers and resolvers thin; business flow belongs in services.
- Keep services readable by extracting validation, normalization, and persistence helpers when a function starts carrying multiple concerns.
- Preserve layered structure: `api/*` transport, `internal/*` business logic, `pkg/*` shared helpers.
- Return wrapped, meaningful errors and preserve causes.
- Avoid broad god-services and giant test files when smaller domain splits are possible.

### GraphQL And API Contracts

- Treat schema and public contracts as stable unless the task explicitly changes them.
- Keep resolver methods small and domain-scoped.
- Validate HTTP verb semantics and mutation/query intent.
- Avoid leaking persistence models when a stable API shape already exists.

### Performance And Reliability

- Watch for duplicated fetch logic, request race hazards, repeated parsing, and unnecessary rerenders.
- Prefer pagination and scoped queries over loading everything.
- Reuse existing timeout/debounce helpers instead of cloning effect code.

## Red Flags

- Same trim/normalize/map logic copied in more than one handler or resolver.
- Multiple `setTimeout` or debounce effects implementing the same pattern by hand.
- Giant components or services that mix unrelated responsibilities.
- Premature abstractions with one implementation and one caller.
- Manual API/result shaping repeated across multiple files.
- State that exists only to mirror another piece of state.
- Resolver or handler code that performs substantial business logic inline.
- Backend functions with validation, repository access, audit logging, and formatting all mixed together.

## Repo-Specific Anti-Patterns

- Manual debounce effect instead of `src/hooks/useDebounce.ts`.
- Manual success-message timeout instead of `src/hooks/useAutoClearValue.ts`.
- React component or hook that mixes render, fetch orchestration, mutation logic, and modal state without a clear boundary.
- Admin GraphQL resolver that performs service-level business logic instead of mapping input and delegating.
- Go service that mixes validation, repository access, audit logging, and response shaping in one large function.
- Client-side locale/category/topic mapping duplicated across multiple admin components instead of using shared helpers or backend-preferred payloads.
- Repeated `trim()/normalize/map` logic in multiple handlers when a single helper can express the rule once.
- State introduced only to track a debounced or derived version of another state when a shared hook already exists.

## Refactor Guardrails

- Preserve runtime behavior unless the user explicitly asks for behavior changes.
- Preserve public contracts: GraphQL schema, HTTP shape, route behavior, locale behavior, and data shape.
- Prefer extracting helpers/hooks/modules over rewriting whole files.
- Keep diffs focused; avoid unrelated cleanup in the same change.
- Do not hand-edit generated outputs under GraphQL generated layers.
- If a refactor touches user-visible behavior, run `changeset-validation`.
- If a refactor touches GraphQL bindings, follow `graphql-change-flow`.

## Smell Triggers

- Component or hook with many independent state variables and repeated effects.
- File size large enough that one screen cannot show the main flow clearly.
- Multiple success/error/debounce/time-based effects with the same structure.
- Resolver file that groups unrelated domains.
- Service/test file that keeps growing after domain splits already exist elsewhere.
- Helper functions named after mechanics instead of domain meaning.

## Repo-Specific Checks

- Frontend: `pnpm run lint`, `pnpm run typecheck`, `pnpm test`
- Backend: `pnpm run backend:lint`, `pnpm run backend:test`, `pnpm run backend:ci`
- GraphQL changes: consider `pnpm run graphql:generate` and `pnpm run graphql:codegen`
- i18n changes: consider `pnpm run i18n:interface`
- Content metadata changes: consider `pnpm run sync:post-metadata`

Use the repo-local skills when relevant:

- `release-gates`
- `code-change-verification`
- `changeset-validation`
- `graphql-change-flow`

## Tooling Guidance

- Use GitHub MCP when the task references a GitHub URL, PR, issue, or remote file.
- Use Context7 for up-to-date library and framework guidance when API behavior matters.
- Prefer `rg` for fast codebase scanning.

## Output Format

- Findings first, ordered by severity when the user asks for review.
- For refactors, explain the concrete smell removed and the behavior preserved.
- Include verification that was run and note intentionally skipped derived steps.

### Review Template

```markdown
## Findings

- Critical: ...
- Important: ...
- Code Smell: ...

## Good

- ...

## Residual Risks

- ...

## Verification

- Ran ...
- Skipped ...
```

### No-Findings Template

```markdown
No findings.

Residual risks:

- ...

Verification:

- Ran ...
```
