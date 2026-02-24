package handler

import (
	"context"
	"errors"
	"math"
	"strings"
	"time"

	"suaybsimsek.com/blog-api/pkg/newsletter"
)

type TopicRecord = topicRecord
type CategoryRecord = categoryRecord
type PostRecord = postRecord
type ContentResponse = contentResponse

var postsRepository Repository = NewMongoRepository()

// ContentQueryInput represents posts query options used by GraphQL and internal callers.
type ContentQueryInput struct {
	Locale   string
	Sort     string
	ScopeIDs []string
	Page     *int
	Size     *int
}

type PostQueryInput struct {
	Locale string
	PostID string
}

// QueryContent returns posts, engagement, and pagination metadata without HTTP routing.
func QueryContent(ctx context.Context, input ContentQueryInput) contentResponse {
	locale := newsletter.ResolveLocale(strings.TrimSpace(input.Locale), "")
	sortOrder := normalizeSortOrder(input.Sort)

	scopeIDs, scopeOK := normalizePostIDSlice(input.ScopeIDs, maxScopePostIDs)
	if !scopeOK {
		return contentResponse{Status: "invalid-scope-ids"}
	}

	page := clampPositiveInt(input.Page, 1, 100000)
	size := clampPositiveInt(input.Size, defaultPageSize, maxPageSize)

	filter := buildContentFilter(locale, scopeIDs)

	operationCtx := withTimeoutContext(ctx, 15*time.Second)
	defer operationCtx.cancel()

	resolvedPage := 1
	total := 0

	total, countErr := postsRepository.CountPosts(operationCtx.ctx, filter)
	if countErr != nil {
		if errors.Is(countErr, errRepositoryUnavailable) {
			return contentResponse{Status: "service-unavailable"}
		}
		return contentResponse{Status: "failed"}
	}
	if total == 0 {
		return contentResponse{
			Status: "success",
			Locale: locale,
			Posts:  []postRecord{},
			Total:  0,
			Page:   1,
			Size:   size,
			Sort:   sortOrder,
		}
	}

	totalPages := int(math.Ceil(float64(total) / float64(size)))
	resolvedPage = page
	if resolvedPage > totalPages {
		resolvedPage = totalPages
	}
	if resolvedPage < 1 {
		resolvedPage = 1
	}

	limit := int64(size)
	skip := int64((resolvedPage - 1) * size)

	posts, queryErr := postsRepository.FindPosts(operationCtx.ctx, filter, sortOrder, skip, limit)
	if queryErr != nil {
		if errors.Is(queryErr, errRepositoryUnavailable) {
			return contentResponse{Status: "service-unavailable"}
		}
		return contentResponse{Status: "failed"}
	}

	return contentResponse{
		Status:        "success",
		Locale:        locale,
		Posts:         posts,
		LikesByPostID: postsRepository.ResolveLikesByPostID(operationCtx.ctx, posts),
		HitsByPostID:  postsRepository.ResolveHitsByPostID(operationCtx.ctx, posts),
		Total:         total,
		Page:          resolvedPage,
		Size:          size,
		Sort:          sortOrder,
	}
}

// QueryPost returns a single post and its engagement metrics.
func QueryPost(ctx context.Context, input PostQueryInput) contentResponse {
	locale := newsletter.ResolveLocale(strings.TrimSpace(input.Locale), "")
	postID, ok := normalizePostID(input.PostID)
	if !ok {
		return contentResponse{Status: "invalid-post-id", Locale: locale}
	}

	operationCtx := withTimeoutContext(ctx, 15*time.Second)
	defer operationCtx.cancel()

	post, queryErr := postsRepository.FindPostByID(operationCtx.ctx, locale, postID)
	if queryErr != nil {
		if errors.Is(queryErr, errRepositoryUnavailable) {
			return contentResponse{Status: "service-unavailable", Locale: locale, PostID: postID}
		}
		return contentResponse{Status: "failed", Locale: locale, PostID: postID}
	}
	if post == nil {
		return contentResponse{Status: "not-found", Locale: locale, PostID: postID}
	}

	posts := []postRecord{*post}
	return contentResponse{
		Status:        "success",
		Locale:        locale,
		Posts:         posts,
		PostID:        postID,
		LikesByPostID: postsRepository.ResolveLikesByPostID(operationCtx.ctx, posts),
		HitsByPostID:  postsRepository.ResolveHitsByPostID(operationCtx.ctx, posts),
	}
}

// IncrementLike increases like count for a post.
func IncrementLike(ctx context.Context, postID string) contentResponse {
	normalizedPostID, ok := normalizePostID(postID)
	if !ok {
		return contentResponse{Status: "invalid-post-id"}
	}

	operationCtx := withTimeoutContext(ctx, 10*time.Second)
	defer operationCtx.cancel()

	likes, incrementErr := postsRepository.IncrementPostLike(operationCtx.ctx, normalizedPostID, time.Now().UTC())
	if incrementErr != nil {
		if errors.Is(incrementErr, errRepositoryUnavailable) {
			return contentResponse{Status: "service-unavailable", PostID: normalizedPostID}
		}
		return contentResponse{Status: "failed", PostID: normalizedPostID}
	}

	return contentResponse{
		Status: "success",
		PostID: normalizedPostID,
		Likes:  likes,
	}
}

// IncrementHit increases hit count for a post.
func IncrementHit(ctx context.Context, postID string) contentResponse {
	normalizedPostID, ok := normalizePostID(postID)
	if !ok {
		return contentResponse{Status: "invalid-post-id"}
	}

	operationCtx := withTimeoutContext(ctx, 10*time.Second)
	defer operationCtx.cancel()

	hits, incrementErr := postsRepository.IncrementPostHit(operationCtx.ctx, normalizedPostID, time.Now().UTC())
	if incrementErr != nil {
		if errors.Is(incrementErr, errRepositoryUnavailable) {
			return contentResponse{Status: "service-unavailable", PostID: normalizedPostID}
		}
		return contentResponse{Status: "failed", PostID: normalizedPostID}
	}

	return contentResponse{
		Status: "success",
		PostID: normalizedPostID,
		Hits:   hits,
	}
}

type timeoutContext struct {
	ctx    context.Context
	cancel context.CancelFunc
}

func withTimeoutContext(parent context.Context, timeout time.Duration) timeoutContext {
	if parent == nil {
		parent = context.Background()
	}
	ctx, cancel := context.WithTimeout(parent, timeout)
	return timeoutContext{ctx: ctx, cancel: cancel}
}

func clampPositiveInt(value *int, fallback int, max int) int {
	if value == nil {
		return fallback
	}
	if *value <= 0 {
		return fallback
	}
	if max > 0 && *value > max {
		return max
	}
	return *value
}

func normalizePostIDSlice(raw []string, maxCount int) ([]string, bool) {
	if len(raw) == 0 {
		return nil, true
	}

	seen := make(map[string]struct{}, len(raw))
	postIDs := make([]string, 0, len(raw))
	for _, item := range raw {
		postID, ok := normalizePostID(item)
		if !ok {
			return nil, false
		}
		if _, exists := seen[postID]; exists {
			continue
		}
		seen[postID] = struct{}{}
		postIDs = append(postIDs, postID)
	}

	if maxCount > 0 && len(postIDs) > maxCount {
		return nil, false
	}

	return postIDs, true
}
