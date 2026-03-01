package post

import (
	"context"
	"errors"
	"testing"
	"time"

	postsrepo "suaybsimsek.com/blog-api/internal/repository/post"

	"go.mongodb.org/mongo-driver/bson"
)

type stubRepository struct {
	countPosts           func(context.Context, bson.M) (int, error)
	findPosts            func(context.Context, bson.M, string, int64, int64) ([]postsrepo.PostRecord, error)
	findPostByID         func(context.Context, string, string) (*postsrepo.PostRecord, error)
	resolveLikesByPostID func(context.Context, []postsrepo.PostRecord) map[string]int64
	resolveHitsByPostID  func(context.Context, []postsrepo.PostRecord) map[string]int64
	incrementPostLike    func(context.Context, string, time.Time) (int64, error)
	incrementPostHit     func(context.Context, string, time.Time) (int64, error)
}

func (stub stubRepository) CountPosts(ctx context.Context, filter bson.M) (int, error) {
	return stub.countPosts(ctx, filter)
}

func (stub stubRepository) FindPosts(
	ctx context.Context,
	filter bson.M,
	sortOrder string,
	skip int64,
	limit int64,
) ([]postsrepo.PostRecord, error) {
	return stub.findPosts(ctx, filter, sortOrder, skip, limit)
}

func (stub stubRepository) FindPostByID(ctx context.Context, locale string, postID string) (*postsrepo.PostRecord, error) {
	return stub.findPostByID(ctx, locale, postID)
}

func (stub stubRepository) ResolveLikesByPostID(ctx context.Context, posts []postsrepo.PostRecord) map[string]int64 {
	return stub.resolveLikesByPostID(ctx, posts)
}

func (stub stubRepository) ResolveHitsByPostID(ctx context.Context, posts []postsrepo.PostRecord) map[string]int64 {
	return stub.resolveHitsByPostID(ctx, posts)
}

func (stub stubRepository) IncrementPostLike(ctx context.Context, postID string, now time.Time) (int64, error) {
	return stub.incrementPostLike(ctx, postID, now)
}

func (stub stubRepository) IncrementPostHit(ctx context.Context, postID string, now time.Time) (int64, error) {
	return stub.incrementPostHit(ctx, postID, now)
}

func TestQueryContent(t *testing.T) {
	originalRepository := postsRepository
	t.Cleanup(func() {
		postsRepository = originalRepository
	})

	postsRepository = stubRepository{
		countPosts: func(_ context.Context, filter bson.M) (int, error) {
			if filter["locale"] != "tr" {
				t.Fatalf("locale filter = %#v", filter)
			}
			return 2, nil
		},
		findPosts: func(_ context.Context, _ bson.M, sortOrder string, skip int64, limit int64) ([]postsrepo.PostRecord, error) {
			if sortOrder != "asc" || skip != 0 || limit != 2 {
				t.Fatalf("query args = %q %d %d", sortOrder, skip, limit)
			}
			return []postsrepo.PostRecord{
				{ID: "alpha-post", Title: "Alpha", PublishedDate: "2026-03-01", Summary: "Summary", SearchText: "alpha", ReadingTimeMin: 3},
				{ID: "beta-post", Title: "Beta", PublishedDate: "2026-03-02", Summary: "Summary", SearchText: "beta", ReadingTimeMin: 4},
			}, nil
		},
		findPostByID: func(context.Context, string, string) (*postsrepo.PostRecord, error) { return nil, nil },
		resolveLikesByPostID: func(_ context.Context, posts []postsrepo.PostRecord) map[string]int64 {
			return map[string]int64{posts[0].ID: 10}
		},
		resolveHitsByPostID: func(_ context.Context, posts []postsrepo.PostRecord) map[string]int64 {
			return map[string]int64{posts[1].ID: 20}
		},
		incrementPostLike: func(context.Context, string, time.Time) (int64, error) { return 0, nil },
		incrementPostHit:  func(context.Context, string, time.Time) (int64, error) { return 0, nil },
	}

	page := 0
	size := 2
	result := QueryContent(context.Background(), ContentQueryInput{
		Locale:   "tr",
		Sort:     "asc",
		ScopeIDs: []string{"Alpha-Post", " alpha-post ", "beta-post"},
		Page:     &page,
		Size:     &size,
	})

	if result.Status != "success" || result.Locale != "tr" || result.Total != 2 || result.Page != 1 || result.Size != 2 {
		t.Fatalf("result = %#v", result)
	}
	if len(result.Posts) != 2 || result.LikesByPostID["alpha-post"] != 10 || result.HitsByPostID["beta-post"] != 20 {
		t.Fatalf("engagement = %#v", result)
	}
}

func TestQueryContentBranches(t *testing.T) {
	originalRepository := postsRepository
	t.Cleanup(func() {
		postsRepository = originalRepository
	})

	postsRepository = stubRepository{
		countPosts: func(context.Context, bson.M) (int, error) { return 0, nil },
		findPosts: func(context.Context, bson.M, string, int64, int64) ([]postsrepo.PostRecord, error) {
			return nil, errors.New("should not be called")
		},
		findPostByID:         func(context.Context, string, string) (*postsrepo.PostRecord, error) { return nil, nil },
		resolveLikesByPostID: func(context.Context, []postsrepo.PostRecord) map[string]int64 { return nil },
		resolveHitsByPostID:  func(context.Context, []postsrepo.PostRecord) map[string]int64 { return nil },
		incrementPostLike:    func(context.Context, string, time.Time) (int64, error) { return 0, nil },
		incrementPostHit:     func(context.Context, string, time.Time) (int64, error) { return 0, nil },
	}

	if result := QueryContent(context.Background(), ContentQueryInput{ScopeIDs: []string{"bad id"}}); result.Status != "invalid-scope-ids" {
		t.Fatalf("invalid scope result = %#v", result)
	}

	result := QueryContent(context.Background(), ContentQueryInput{})
	if result.Status != "success" || result.Total != 0 || result.Page != 1 || len(result.Posts) != 0 {
		t.Fatalf("empty result = %#v", result)
	}

	postsRepository = stubRepository{
		countPosts: func(context.Context, bson.M) (int, error) { return 0, postsrepo.ErrRepositoryUnavailable },
		findPosts: func(context.Context, bson.M, string, int64, int64) ([]postsrepo.PostRecord, error) {
			return nil, nil
		},
		findPostByID:         func(context.Context, string, string) (*postsrepo.PostRecord, error) { return nil, nil },
		resolveLikesByPostID: func(context.Context, []postsrepo.PostRecord) map[string]int64 { return nil },
		resolveHitsByPostID:  func(context.Context, []postsrepo.PostRecord) map[string]int64 { return nil },
		incrementPostLike:    func(context.Context, string, time.Time) (int64, error) { return 0, nil },
		incrementPostHit:     func(context.Context, string, time.Time) (int64, error) { return 0, nil },
	}
	if result := QueryContent(context.Background(), ContentQueryInput{}); result.Status != "service-unavailable" {
		t.Fatalf("service unavailable result = %#v", result)
	}
}

func TestQueryPostAndMetrics(t *testing.T) {
	originalRepository := postsRepository
	t.Cleanup(func() {
		postsRepository = originalRepository
	})

	now := time.Now().UTC()
	postsRepository = stubRepository{
		countPosts: func(context.Context, bson.M) (int, error) { return 0, nil },
		findPosts:  func(context.Context, bson.M, string, int64, int64) ([]postsrepo.PostRecord, error) { return nil, nil },
		findPostByID: func(_ context.Context, locale string, postID string) (*postsrepo.PostRecord, error) {
			if locale != "en" || postID != "alpha-post" {
				t.Fatalf("FindPostByID args = %q %q", locale, postID)
			}
			return &postsrepo.PostRecord{ID: postID, Title: "Alpha", PublishedDate: "2026-03-01", Summary: "Summary", SearchText: "alpha", ReadingTimeMin: 3}, nil
		},
		resolveLikesByPostID: func(context.Context, []postsrepo.PostRecord) map[string]int64 {
			return map[string]int64{"alpha-post": 12}
		},
		resolveHitsByPostID: func(context.Context, []postsrepo.PostRecord) map[string]int64 {
			return map[string]int64{"alpha-post": 42}
		},
		incrementPostLike: func(_ context.Context, postID string, received time.Time) (int64, error) {
			if postID != "alpha-post" || received.IsZero() {
				t.Fatalf("IncrementPostLike args = %q %v", postID, received)
			}
			return 13, nil
		},
		incrementPostHit: func(_ context.Context, postID string, received time.Time) (int64, error) {
			if postID != "alpha-post" || received.Before(now.Add(-time.Minute)) {
				t.Fatalf("IncrementPostHit args = %q %v", postID, received)
			}
			return 43, nil
		},
	}

	postResult := QueryPost(context.Background(), PostQueryInput{Locale: "en", PostID: "Alpha-Post"})
	if postResult.Status != "success" || postResult.PostID != "alpha-post" || len(postResult.Posts) != 1 {
		t.Fatalf("postResult = %#v", postResult)
	}
	if postResult.LikesByPostID["alpha-post"] != 12 || postResult.HitsByPostID["alpha-post"] != 42 {
		t.Fatalf("engagement = %#v", postResult)
	}

	likeResult := IncrementLike(context.Background(), "Alpha-Post")
	if likeResult.Status != "success" || likeResult.Likes != 13 {
		t.Fatalf("likeResult = %#v", likeResult)
	}

	hitResult := IncrementHit(context.Background(), "Alpha-Post")
	if hitResult.Status != "success" || hitResult.Hits != 43 {
		t.Fatalf("hitResult = %#v", hitResult)
	}
}

func TestQueryPostAndMetricBranches(t *testing.T) {
	originalRepository := postsRepository
	t.Cleanup(func() {
		postsRepository = originalRepository
	})

	postsRepository = stubRepository{
		countPosts: func(context.Context, bson.M) (int, error) { return 0, nil },
		findPosts:  func(context.Context, bson.M, string, int64, int64) ([]postsrepo.PostRecord, error) { return nil, nil },
		findPostByID: func(context.Context, string, string) (*postsrepo.PostRecord, error) {
			return nil, postsrepo.ErrRepositoryUnavailable
		},
		resolveLikesByPostID: func(context.Context, []postsrepo.PostRecord) map[string]int64 { return nil },
		resolveHitsByPostID:  func(context.Context, []postsrepo.PostRecord) map[string]int64 { return nil },
		incrementPostLike:    func(context.Context, string, time.Time) (int64, error) { return 0, postsrepo.ErrRepositoryUnavailable },
		incrementPostHit:     func(context.Context, string, time.Time) (int64, error) { return 0, errors.New("boom") },
	}

	if result := QueryPost(context.Background(), PostQueryInput{Locale: "en", PostID: "bad id"}); result.Status != "invalid-post-id" {
		t.Fatalf("invalid post result = %#v", result)
	}
	if result := QueryPost(context.Background(), PostQueryInput{Locale: "en", PostID: "alpha-post"}); result.Status != "service-unavailable" {
		t.Fatalf("service unavailable post result = %#v", result)
	}
	if result := IncrementLike(context.Background(), "bad id"); result.Status != "invalid-post-id" {
		t.Fatalf("invalid like result = %#v", result)
	}
	if result := IncrementLike(context.Background(), "alpha-post"); result.Status != "service-unavailable" {
		t.Fatalf("service unavailable like result = %#v", result)
	}
	if result := IncrementHit(context.Background(), "alpha-post"); result.Status != "failed" {
		t.Fatalf("failed hit result = %#v", result)
	}
}

func TestPostHelperUtilities(t *testing.T) {
	if got := clampPositiveInt(nil, 10, 50); got != 10 {
		t.Fatalf("clampPositiveInt(nil) = %d", got)
	}
	zero := 0
	if got := clampPositiveInt(&zero, 10, 50); got != 10 {
		t.Fatalf("clampPositiveInt(zero) = %d", got)
	}
	large := 100
	if got := clampPositiveInt(&large, 10, 50); got != 50 {
		t.Fatalf("clampPositiveInt(large) = %d", got)
	}
	valid := 12
	if got := clampPositiveInt(&valid, 10, 50); got != 12 {
		t.Fatalf("clampPositiveInt(valid) = %d", got)
	}

	scopeIDs, ok := normalizePostIDSlice([]string{" Alpha-Post ", "alpha-post", "beta-post"}, 3)
	if !ok || len(scopeIDs) != 2 || scopeIDs[0] != "alpha-post" || scopeIDs[1] != "beta-post" {
		t.Fatalf("normalizePostIDSlice() = %#v, %v", scopeIDs, ok)
	}
	if scopeIDs, ok := normalizePostIDSlice([]string{"bad id"}, 3); ok || scopeIDs != nil {
		t.Fatalf("invalid normalizePostIDSlice() = %#v, %v", scopeIDs, ok)
	}
	if scopeIDs, ok := normalizePostIDSlice([]string{"alpha-post", "beta-post"}, 1); ok || scopeIDs != nil {
		t.Fatalf("overflow normalizePostIDSlice() = %#v, %v", scopeIDs, ok)
	}

	timeoutCtx, cancel := withTimeoutContext(nil, time.Second)
	defer cancel()
	if timeoutCtx == nil {
		t.Fatal("withTimeoutContext() should create a context")
	}
}

func TestPostServiceAdditionalBranches(t *testing.T) {
	originalRepository := postsRepository
	t.Cleanup(func() {
		postsRepository = originalRepository
	})

	t.Run("query content returns failed when repository count fails generically", func(t *testing.T) {
		postsRepository = stubRepository{
			countPosts:           func(context.Context, bson.M) (int, error) { return 0, errors.New("boom") },
			findPosts:            func(context.Context, bson.M, string, int64, int64) ([]postsrepo.PostRecord, error) { return nil, nil },
			findPostByID:         func(context.Context, string, string) (*postsrepo.PostRecord, error) { return nil, nil },
			resolveLikesByPostID: func(context.Context, []postsrepo.PostRecord) map[string]int64 { return nil },
			resolveHitsByPostID:  func(context.Context, []postsrepo.PostRecord) map[string]int64 { return nil },
			incrementPostLike:    func(context.Context, string, time.Time) (int64, error) { return 0, nil },
			incrementPostHit:     func(context.Context, string, time.Time) (int64, error) { return 0, nil },
		}

		if result := QueryContent(context.Background(), ContentQueryInput{}); result.Status != "failed" {
			t.Fatalf("failed count result = %#v", result)
		}
	})

	t.Run("query content returns failed when fetch fails generically", func(t *testing.T) {
		postsRepository = stubRepository{
			countPosts: func(context.Context, bson.M) (int, error) { return 1, nil },
			findPosts: func(context.Context, bson.M, string, int64, int64) ([]postsrepo.PostRecord, error) {
				return nil, errors.New("boom")
			},
			findPostByID:         func(context.Context, string, string) (*postsrepo.PostRecord, error) { return nil, nil },
			resolveLikesByPostID: func(context.Context, []postsrepo.PostRecord) map[string]int64 { return nil },
			resolveHitsByPostID:  func(context.Context, []postsrepo.PostRecord) map[string]int64 { return nil },
			incrementPostLike:    func(context.Context, string, time.Time) (int64, error) { return 0, nil },
			incrementPostHit:     func(context.Context, string, time.Time) (int64, error) { return 0, nil },
		}

		if result := QueryContent(context.Background(), ContentQueryInput{}); result.Status != "failed" {
			t.Fatalf("failed find result = %#v", result)
		}
	})

	t.Run("query post returns not found and failed branches", func(t *testing.T) {
		postsRepository = stubRepository{
			countPosts: func(context.Context, bson.M) (int, error) { return 0, nil },
			findPosts:  func(context.Context, bson.M, string, int64, int64) ([]postsrepo.PostRecord, error) { return nil, nil },
			findPostByID: func(context.Context, string, string) (*postsrepo.PostRecord, error) {
				return nil, nil
			},
			resolveLikesByPostID: func(context.Context, []postsrepo.PostRecord) map[string]int64 { return nil },
			resolveHitsByPostID:  func(context.Context, []postsrepo.PostRecord) map[string]int64 { return nil },
			incrementPostLike:    func(context.Context, string, time.Time) (int64, error) { return 0, nil },
			incrementPostHit:     func(context.Context, string, time.Time) (int64, error) { return 0, nil },
		}

		if result := QueryPost(context.Background(), PostQueryInput{Locale: "en", PostID: "alpha-post"}); result.Status != "not-found" {
			t.Fatalf("not found post result = %#v", result)
		}

		postsRepository = stubRepository{
			countPosts: func(context.Context, bson.M) (int, error) { return 0, nil },
			findPosts:  func(context.Context, bson.M, string, int64, int64) ([]postsrepo.PostRecord, error) { return nil, nil },
			findPostByID: func(context.Context, string, string) (*postsrepo.PostRecord, error) {
				return nil, errors.New("boom")
			},
			resolveLikesByPostID: func(context.Context, []postsrepo.PostRecord) map[string]int64 { return nil },
			resolveHitsByPostID:  func(context.Context, []postsrepo.PostRecord) map[string]int64 { return nil },
			incrementPostLike:    func(context.Context, string, time.Time) (int64, error) { return 0, nil },
			incrementPostHit:     func(context.Context, string, time.Time) (int64, error) { return 0, nil },
		}

		if result := QueryPost(context.Background(), PostQueryInput{Locale: "en", PostID: "alpha-post"}); result.Status != "failed" {
			t.Fatalf("failed post result = %#v", result)
		}
	})

	t.Run("metric mutations cover remaining invalid and generic failures", func(t *testing.T) {
		postsRepository = stubRepository{
			countPosts:           func(context.Context, bson.M) (int, error) { return 0, nil },
			findPosts:            func(context.Context, bson.M, string, int64, int64) ([]postsrepo.PostRecord, error) { return nil, nil },
			findPostByID:         func(context.Context, string, string) (*postsrepo.PostRecord, error) { return nil, nil },
			resolveLikesByPostID: func(context.Context, []postsrepo.PostRecord) map[string]int64 { return nil },
			resolveHitsByPostID:  func(context.Context, []postsrepo.PostRecord) map[string]int64 { return nil },
			incrementPostLike:    func(context.Context, string, time.Time) (int64, error) { return 0, errors.New("boom") },
			incrementPostHit:     func(context.Context, string, time.Time) (int64, error) { return 0, postsrepo.ErrRepositoryUnavailable },
		}

		if result := IncrementLike(context.Background(), "alpha-post"); result.Status != "failed" {
			t.Fatalf("failed like result = %#v", result)
		}
		if result := IncrementHit(context.Background(), "bad id"); result.Status != statusInvalidPostID {
			t.Fatalf("invalid hit result = %#v", result)
		}
		if result := IncrementHit(context.Background(), "alpha-post"); result.Status != statusServiceUnavailable {
			t.Fatalf("service unavailable hit result = %#v", result)
		}
	})
}
