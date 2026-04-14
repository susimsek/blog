---
name: design-patterns
description: Common design patterns for this blog platform with Go, React, and TypeScript examples (Factory, Builder, Strategy, Observer, Decorator, Adapter, Facade, State). Use when the user asks to implement a pattern, wants a more extensible design, or needs to refactor rigid conditionals, tangled UI state, or awkward integrations.
---

# Design Patterns Skill

Quick reference for common design patterns in this Next.js + React + TypeScript + Go blog platform.

## When to Use

- User asks to implement a specific pattern
- Designing extensible or flexible components, hooks, services, or adapters
- Refactoring rigid code in `src/`, `api/`, `internal/`, or `pkg/`
- Reducing conditional sprawl in UI rendering, provider selection, or backend integrations
- Isolating transport, GraphQL, i18n, or third-party boundaries

## Quick Reference: When to Use What

| Problem                                    | Pattern       | Use When                                                                    |
| ------------------------------------------ | ------------- | --------------------------------------------------------------------------- |
| Complex object construction                | **Builder**   | Many parameters, optional fields, or fixture-style setup                    |
| Create objects without hard-coding type    | **Factory**   | Implementation is chosen by config, locale, environment, or runtime input   |
| Multiple algorithms, swap at runtime       | **Strategy**  | Behavior varies by context but call flow stays the same                     |
| Add behavior without rewriting the core    | **Decorator** | Dynamic composition like logging, timing, caching, auth, retries            |
| Notify multiple consumers of state changes | **Observer**  | One-to-many dependency, especially analytics, invalidation, or UI reactions |
| Convert incompatible interfaces            | **Adapter**   | Integrate transport DTOs, third-party APIs, legacy helpers, or browser APIs |
| Hide subsystem complexity                  | **Facade**    | One stable entrypoint should hide several hooks, queries, or services       |
| Model status-driven behavior               | **State**     | Transitions matter more than scattered booleans                             |

---

## Creational Patterns

### Builder

**Problem:** Many optional fields or setup branches make call sites noisy and error-prone

```ts
// ✅ Builder-style helper for a post payload
type PostInput = {
  title: string;
  slug: string;
  published: boolean;
  summary?: string;
  locale: 'en' | 'tr';
};

export function buildPostInput(overrides: Partial<PostInput> = {}): PostInput {
  return {
    title: 'Example Post',
    slug: 'example-post',
    published: false,
    locale: 'en',
    ...overrides,
  };
}

// Usage
const post = buildPostInput({
  title: 'GraphQL Notes',
  locale: 'tr',
});
```

Prefer this for test fixtures, GraphQL input assembly, and configuration objects. In Go, prefer plain structs plus validation before introducing a dedicated builder type.

### Factory

**Problem:** Create objects without knowing the exact implementation upfront

```go
// ✅ Factory pattern
type NewsletterSender interface {
	Send(to string, body string) error
}

func NewNewsletterSender(kind string) (NewsletterSender, error) {
	switch kind {
	case "smtp":
		return NewSMTPSender(), nil
	case "noop":
		return NoopSender{}, nil
	default:
		return nil, fmt.Errorf("unknown sender kind: %s", kind)
	}
}
```

Use this when sender, client, parser, or storage implementation depends on runtime config. Avoid it when one concrete type is already obvious.

---

## Behavioral Patterns

### Strategy

**Problem:** Multiple algorithms for the same operation, selected at runtime

```go
// ✅ Strategy pattern
type SlugGenerator interface {
	Generate(title string) string
}

type EnglishSlugGenerator struct{}

func (EnglishSlugGenerator) Generate(title string) string {
	return strings.ToLower(strings.ReplaceAll(title, " ", "-"))
}

type TurkishSlugGenerator struct{}

func (TurkishSlugGenerator) Generate(title string) string {
	return normalizeTurkishSlug(title)
}

type PostService struct {
	slugger SlugGenerator
}

func (s PostService) Create(title string) string {
	return s.slugger.Generate(title)
}
```

```tsx
// React variant
type PreviewRenderer = (value: string) => React.ReactNode;

const renderers: Record<'markdown' | 'html', PreviewRenderer> = {
  markdown: value => <MarkdownPreview source={value} />,
  html: value => <HtmlPreview html={value} />,
};
```

Use for locale-specific behavior, rendering modes, search ranking, formatting, provider selection, and retry policies.

### Observer

**Problem:** Notify multiple parts of the system when state changes

```tsx
// ✅ React effect-based observer
useEffect(() => {
  analytics.track('post_viewed', { slug });
  void invalidateRelatedPosts(slug);
}, [slug]);
```

```ts
// Redux-style observer via action reaction
if (action.type === 'comments/commentApproved') {
  dispatch(fetchComments(action.payload.postId));
  analytics.track('comment_approved', action.payload);
}
```

Use for analytics, cache invalidation, follow-up fetches, and decoupled reactions. Prefer props, context, store subscriptions, and effects before inventing a custom event bus.

### State

**Problem:** Behavior depends on explicit status transitions, not just flags

```tsx
// ✅ State pattern with explicit statuses
type Status = 'idle' | 'saving' | 'success' | 'error';

type Action = { type: 'save' } | { type: 'success' } | { type: 'error' };

function reducer(state: Status, action: Action): Status {
  switch (action.type) {
    case 'save':
      return 'saving';
    case 'success':
      return 'success';
    case 'error':
      return 'error';
  }
}
```

```go
// Go transition rules
func AdvancePostStatus(current PostStatus, action Action) (PostStatus, error) {
	switch {
	case current == Draft && action == SubmitReview:
		return InReview, nil
	case current == InReview && action == Publish:
		return Published, nil
	default:
		return current, fmt.Errorf("invalid transition: %s -> %s", current, action)
	}
}
```

Use this for post workflow, moderation state, auth/session flow, and async UI lifecycles.

---

## Structural Patterns

### Decorator

**Problem:** Add behavior dynamically without changing the wrapped implementation

```go
// ✅ Decorator pattern
type CommentService interface {
	Create(ctx context.Context, input CreateCommentInput) error
}

type LoggingCommentService struct {
	next   CommentService
	logger *slog.Logger
}

func (s LoggingCommentService) Create(ctx context.Context, input CreateCommentInput) error {
	s.logger.Info("creating comment", "postID", input.PostID)
	return s.next.Create(ctx, input)
}
```

```ts
// JS/TS functional decorator
export function withTiming<TArgs extends unknown[], TResult>(name: string, fn: (...args: TArgs) => TResult) {
  return (...args: TArgs): TResult => {
    const start = performance.now();
    const result = fn(...args);
    console.log(name, performance.now() - start);
    return result;
  };
}
```

Use for logging, tracing, retries, caching, auth, and metrics. In Go, middleware is usually the idiomatic decorator form.

### Adapter

**Problem:** Make incompatible interfaces work together cleanly

```go
// ✅ Adapter pattern
type Mailer interface {
	Send(ctx context.Context, to string, body string) error
}

type ResendAdapter struct {
	client *resend.Client
}

func (a ResendAdapter) Send(ctx context.Context, to string, body string) error {
	return a.client.Send(ctx, resendPayload(to, body))
}
```

```ts
// Frontend DTO adapter
type ApiPost = { id: string; headline: string; created_at: string };
type PostCard = { id: string; title: string; createdAt: Date };

export function toPostCardModel(post: ApiPost): PostCard {
  return {
    id: post.id,
    title: post.headline,
    createdAt: new Date(post.created_at),
  };
}
```

Use at GraphQL, HTTP, i18n, browser API, and third-party SDK boundaries. Keep translation local and do not leak external shapes deep into domain code.

### Facade

**Problem:** Provide a simpler interface over several subsystems

```tsx
// ✅ Facade pattern via custom hook
function useAdminComments(postId: string) {
  const query = useCommentsQuery(postId);
  const mutation = useUpdateCommentStatusMutation();

  return {
    comments: query.data ?? [],
    isLoading: query.isLoading,
    updateStatus: mutation.mutateAsync,
  };
}
```

```go
// Backend facade over several dependencies
type PublishPostService struct {
	repo    PostRepository
	indexer SearchIndexer
	cache   Cache
}

func (s PublishPostService) Publish(ctx context.Context, id string) error {
	post, err := s.repo.Publish(ctx, id)
	if err != nil {
		return err
	}

	if err := s.indexer.Index(ctx, post); err != nil {
		return err
	}

	return s.cache.Invalidate(ctx, "posts")
}
```

Use this to hide orchestration inside a focused hook or service. Keep the facade narrow so it does not become a god object.

---

## Pattern Selection Guide

| Situation                                 | Pattern          |
| ----------------------------------------- | ---------------- |
| Object creation is complex                | Builder, Factory |
| Need to add features dynamically          | Decorator        |
| Multiple implementations of an algorithm  | Strategy         |
| React to state changes                    | Observer, State  |
| Integrate with legacy or third-party code | Adapter          |
| Hide query/service orchestration          | Facade           |

## Anti-Patterns to Avoid

| Anti-Pattern                               | Problem                                            | Better Approach                                   |
| ------------------------------------------ | -------------------------------------------------- | ------------------------------------------------- |
| Singleton abuse                            | Hidden shared state, hard testing, global coupling | Dependency injection or explicit module ownership |
| Factory everywhere                         | Over-engineering for obvious construction          | Plain constructor or helper when type is known    |
| Deep decorator chains                      | Hard to trace control flow and failures            | Composition with fewer layers                     |
| Event bus for simple UI state              | Hidden behavior and debugging pain                 | Props, context, reducer, or store subscription    |
| State abstraction without real transitions | Ceremony with no safety                            | Simple booleans or discriminated unions           |
| Adapter leaking transport models           | Domain code becomes coupled to external schemas    | Normalize once at the boundary                    |
| God-facade service/hook                    | Too many responsibilities in one place             | Split by use case or domain boundary              |
