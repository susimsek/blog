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

**Violation:**

```ts
// Repeated debounce flow in multiple files
const [query, setQuery] = useState('');
const [debouncedQuery, setDebouncedQuery] = useState('');

useEffect(() => {
  const timeoutId = window.setTimeout(() => {
    setDebouncedQuery(query.trim());
  }, 220);

  return () => window.clearTimeout(timeoutId);
}, [query]);
```

**Fix:**

```ts
const [query, setQuery] = useState('');
const debouncedQuery = useDebounce(query.trim(), 220);
```

**Checks:**

- Is the same trim/normalize/map logic repeated in more than one handler, hook, or service?
- Does the repo already have a hook or helper that expresses the same rule once?
- Is the duplication real business duplication, or just a thin adapter that should stay local?

### KISS

- Prefer the smallest solution that matches current product behavior.
- Do not introduce factories, adapters, wrapper types, or extra configuration unless they remove real complexity.
- When reviewing React code, prefer straightforward state flow over stacked effects and indirection.

**Violation:**

```ts
type FilterController = {
  state: { value: string };
  actions: { update: (value: string) => void; reset: () => void };
};
```

**Fix:**

```ts
const [filterQuery, setFilterQuery] = useState('');
```

**Checks:**

- Can the same behavior be expressed with plain state and one helper instead of a new abstraction?
- Is a new wrapper type hiding simple intent rather than clarifying it?
- Would a future reader understand the flow without tracing multiple indirection layers?

### YAGNI

- Do not add extension points, option flags, or abstractions for hypothetical future use.
- Remove dead branches, stale compatibility code, and state that no longer drives UI or API behavior.
- If an abstraction only has one caller and does not clarify intent, inline or simplify it.

**Violation:**

```ts
type ContentOptions = {
  enableExperimentalLocaleRouting?: boolean;
  fallbackMode?: 'legacy' | 'modern';
};
```

**Fix:**

```ts
// Keep only the current behavior until a second real use case appears.
```

**Checks:**

- Is this option/flag solving a real current requirement, or an imagined one?
- Does the abstraction have one caller and one implementation?
- Can a dead branch or stale compatibility path be deleted now without changing behavior?

### SRP

- Components should not mix UI rendering, async orchestration, and unrelated domain rules when these can be separated cleanly.
- Resolvers should stay thin; services should not become god-objects.
- Split large files by domain responsibility when the split reduces cognitive load without changing contracts.

**Violation:**

```tsx
function AdminPage() {
  // render
  // fetch
  // mutation
  // modal state
  // route sync
  // validation
}
```

**Fix:**

```tsx
function AdminPage() {
  const pageData = useAdminPageData();
  return <AdminPageView {...pageData} />;
}
```

**Checks:**

- Is one file handling render, fetch, mutation, modal state, and route logic together?
- Can non-visual orchestration move into a focused hook without changing the public surface?
- On backend, is one service mixing validation, repository access, audit logging, and response shaping?

### Naming And Intent

- Prefer names that describe business meaning: `loadPostComments`, `preferredContentLocale`, `revokeAllAdminSessions`.
- Flag names like `handleData`, `processThing`, `value2`, or `doStuff`.
- Rename variables and functions when intent is unclear even if the code is technically correct.

**Violation:**

```ts
const data2 = map(items);
const handleThing = () => mutate();
```

**Fix:**

```ts
const localizedTopicOptions = mapTopicOptions(items);
const handleDeletePostComment = () => mutate();
```

**Checks:**

- Does the name describe business meaning or just mechanics?
- Would the function still make sense if read out of file context?
- Are temporary names masking two different concepts that should be split?

### Side Effects And State

- Avoid duplicated effect logic when an existing hook already solves it.
- Avoid storing derived state that can be computed from current inputs.
- Effects should synchronize with external systems, not compensate for unclear local state design.

**Violation:**

```ts
const [preferredLocale, setPreferredLocale] = useState<'en' | 'tr'>('en');

useEffect(() => {
  setPreferredLocale(filterLocale === 'all' ? routeLocale : filterLocale);
}, [filterLocale, routeLocale]);
```

**Fix:**

```ts
const preferredLocale = filterLocale === 'all' ? routeLocale : filterLocale;
```

**Checks:**

- Is this state derived from other current inputs?
- Is the effect synchronizing with an external system, or just reshaping local state?
- Can an existing hook like `useDebounce` or `useAutoClearValue` replace the manual effect?

### Error Handling

- Preserve the original cause on backend errors.
- Avoid silent failure, swallowed exceptions, and broad catch-all behavior unless it is deliberate and documented.
- Frontend error handling should normalize user-visible messages consistently instead of branching ad hoc in every component.

**Violation:**

```go
if err != nil {
    return errors.New("failed")
}
```

**Fix:**

```go
if err != nil {
    return fmt.Errorf("load admin session: %w", err)
}
```

**Checks:**

- Is the original cause preserved?
- Is the error message domain-specific and actionable?
- Are frontend user-visible messages normalized through the existing admin/content error helpers?

### API And Contract Discipline

- Keep GraphQL and HTTP contracts stable unless the task explicitly changes them.
- Prefer DTO/view-model mapping over leaking persistence models.
- Validate verb semantics, mutation intent, pagination, locale handling, and nullability assumptions.

**Violation:**

```go
func (r *mutationResolver) UpdatePost(ctx context.Context, input model.UpdatePostInput) (*domain.Post, error) {
    // returns persistence model directly
}
```

**Fix:**

```go
func (r *mutationResolver) UpdatePost(ctx context.Context, input model.UpdatePostInput) (*model.Post, error) {
    // map input, delegate to service, map result
}
```

**Checks:**

- Is a persistence model leaking through GraphQL or HTTP?
- Did a refactor accidentally change nullability, locale behavior, pagination, or route shape?
- Is a mutation/query name semantically correct for the action it performs?

### React And Next.js

- Extract repeated non-visual logic into purpose-driven custom hooks.
- Prefer existing repo hooks like `useDebounce` and `useAutoClearValue` over hand-written effect loops.
- Avoid storing derived state when it can be computed from props or state.
- Keep effects for synchronization, not data shaping.
- Preserve static-export constraints; do not introduce server-only Next.js patterns.
- Follow existing repo guidance: do not add `useMemo` or `useCallback` by default unless they solve a real problem or match local patterns.

**Checks:**

- Does the component violate static-export assumptions?
- Is render code mixed with async orchestration that belongs in a hook?
- Is a hook/component accumulating too many unrelated state variables?

### TypeScript

- Prefer narrow types and explicit unions over loose strings.
- Keep state shapes small and normalized.
- Avoid duplicating the same parsing, trimming, or normalization logic across handlers.
- Reuse shared mapping helpers when transforming API payloads.

**Checks:**

- Can a loose `string` become a union or shared type alias?
- Is the same normalization rule duplicated across multiple handlers?
- Is state normalized enough to avoid storing both source and derived values?

### Go Backend

- Keep handlers and resolvers thin; business flow belongs in services.
- Keep services readable by extracting validation, normalization, and persistence helpers when a function starts carrying multiple concerns.
- Preserve layered structure: `api/*` transport, `internal/*` business logic, `pkg/*` shared helpers.
- Return wrapped, meaningful errors and preserve causes.
- Avoid broad god-services and giant test files when smaller domain splits are possible.

**Violation:**

```go
func (s *Service) UpdatePost(...) error {
    // validate
    // normalize
    // load repository data
    // write audit log
    // map response
    // send side effects
}
```

**Fix:**

```go
func (s *Service) UpdatePost(...) error {
    input, err := s.normalizePostInput(...)
    if err != nil { ... }

    result, err := s.postWriter.Update(...)
    if err != nil { ... }

    return nil
}
```

**Checks:**

- Is one service method carrying transport, validation, persistence, and mapping concerns together?
- Does the package layout still respect `api/*`, `internal/*`, `pkg/*` layering?
- Can a large test file be split alongside the service split?

### GraphQL And API Contracts

- Treat schema and public contracts as stable unless the task explicitly changes them.
- Keep resolver methods small and domain-scoped.
- Validate HTTP verb semantics and mutation/query intent.
- Avoid leaking persistence models when a stable API shape already exists.

**Checks:**

- Is resolver code doing business work instead of delegating?
- Did a cleanup accidentally touch generated layers instead of source?
- If the contract really changed, were schema, resolvers, documents, codegen, and tests updated together?

### Performance And Reliability

- Watch for duplicated fetch logic, request race hazards, repeated parsing, and unnecessary rerenders.
- Prefer pagination and scoped queries over loading everything.
- Reuse existing timeout/debounce helpers instead of cloning effect code.

**Violation:**

```ts
useEffect(() => {
  fetchData(query).then(setItems);
}, [query]);
```

**Fix:**

```ts
const requestIdRef = useRef(0);

const loadData = useCallback(async () => {
  const requestId = requestIdRef.current + 1;
  requestIdRef.current = requestId;
  const payload = await fetchData(query);
  if (requestId !== requestIdRef.current) return;
  setItems(payload.items);
}, [query]);
```

**Checks:**

- Is there a request race hazard?
- Is the code loading everything where pagination already exists?
- Are rerenders caused by unnecessary derived state or repeated parsing?

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

## Violation Patterns To Scan

- Manual debounce or timeout effects
- Repeated `trim()/toLowerCase()/map()` pipelines
- Giant components/hooks/services/tests
- Resolver methods with domain logic inline
- DTO/view-model leaks
- Broad `catch` or lost backend error causes
- Manual request flows without race protection
- Derived state mirrored into another piece of state

## Refactor Fix Patterns

- Extract purpose-driven hooks
- Extract service helpers by responsibility
- Reuse existing repo hooks/helpers before adding new abstractions
- Replace duplicated normalize/map logic with shared helpers
- Replace repeated modal/delete flows with generic modal components when the behavior is identical
- Split large files into focused composition, orchestration, and presentational layers

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
