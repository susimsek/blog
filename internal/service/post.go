package service

import (
	"context"
	"errors"
	"math"
	"regexp"
	"strings"
	"time"

	"suaybsimsek.com/blog-api/internal/domain"
	"suaybsimsek.com/blog-api/internal/repository"
	"suaybsimsek.com/blog-api/pkg/newsletter"

	"go.mongodb.org/mongo-driver/bson"
)

type (
	TopicRecord     = domain.PostTopic
	CategoryRecord  = domain.PostCategory
	PostRecord      = domain.PostRecord
	ContentResponse = domain.PostContentResponse
)

var (
	postIDPattern                                      = regexp.MustCompile(`^[a-z0-9][a-z0-9-]{1,127}$`)
	postsRepository       repository.PostRepository    = repository.NewPostMongoRepository()
	postCommentRepository repository.CommentRepository = repository.NewCommentRepository()
)

const (
	statusServiceUnavailable = "service-unavailable"
	statusInvalidPostID      = "invalid-post-id"
	maxScopePostIDs          = 5000
	defaultPageSize          = 20
	maxPageSize              = 100
)

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
func QueryContent(ctx context.Context, input ContentQueryInput) ContentResponse {
	locale := newsletter.ResolveLocale(strings.TrimSpace(input.Locale), "")
	sortOrder := normalizeSortOrder(input.Sort)

	scopeIDs, scopeOK := normalizePostIDSlice(input.ScopeIDs, maxScopePostIDs)
	if !scopeOK {
		return ContentResponse{Status: "invalid-scope-ids"}
	}

	page := clampPositiveInt(input.Page, 1, 100000)
	size := clampPositiveInt(input.Size, defaultPageSize, maxPageSize)

	filter := buildContentFilter(locale, scopeIDs)

	operationCtx, cancel := withTimeoutContext(ctx, 15*time.Second)
	defer cancel()

	total, countErr := postsRepository.CountPosts(operationCtx, filter)
	if countErr != nil {
		if errors.Is(countErr, repository.ErrPostRepositoryUnavailable) {
			return ContentResponse{Status: statusServiceUnavailable}
		}
		return ContentResponse{Status: "failed"}
	}
	if total == 0 {
		return ContentResponse{
			Status: "success",
			Locale: locale,
			Posts:  []PostRecord{},
			Total:  0,
			Page:   1,
			Size:   size,
			Sort:   sortOrder,
		}
	}

	totalPages := int(math.Ceil(float64(total) / float64(size)))
	resolvedPage := page
	resolvedPage = max(1, min(resolvedPage, totalPages))

	limit := int64(size)
	skip := int64((resolvedPage - 1) * size)

	posts, queryErr := postsRepository.FindPosts(operationCtx, filter, sortOrder, skip, limit)
	if queryErr != nil {
		if errors.Is(queryErr, repository.ErrPostRepositoryUnavailable) {
			return ContentResponse{Status: statusServiceUnavailable}
		}
		return ContentResponse{Status: "failed"}
	}

	return ContentResponse{
		Status:           "success",
		Locale:           locale,
		Posts:            posts,
		LikesByPostID:    postsRepository.ResolveLikesByPostID(operationCtx, posts),
		HitsByPostID:     postsRepository.ResolveHitsByPostID(operationCtx, posts),
		CommentsByPostID: resolveCommentCountsByPostID(operationCtx, posts),
		Total:            total,
		Page:             resolvedPage,
		Size:             size,
		Sort:             sortOrder,
	}
}

// QueryPost returns a single post and its engagement metrics.
func QueryPost(ctx context.Context, input PostQueryInput) ContentResponse {
	locale := newsletter.ResolveLocale(strings.TrimSpace(input.Locale), "")
	postID, ok := normalizePostID(input.PostID)
	if !ok {
		return ContentResponse{Status: statusInvalidPostID, Locale: locale}
	}

	operationCtx, cancel := withTimeoutContext(ctx, 15*time.Second)
	defer cancel()

	post, queryErr := postsRepository.FindPostByID(operationCtx, locale, postID)
	if queryErr != nil {
		if errors.Is(queryErr, repository.ErrPostRepositoryUnavailable) {
			return ContentResponse{Status: statusServiceUnavailable, Locale: locale, PostID: postID}
		}
		return ContentResponse{Status: "failed", Locale: locale, PostID: postID}
	}
	if post == nil {
		return ContentResponse{Status: "not-found", Locale: locale, PostID: postID}
	}

	posts := []PostRecord{*post}
	return ContentResponse{
		Status:           "success",
		Locale:           locale,
		Posts:            posts,
		PostID:           postID,
		LikesByPostID:    postsRepository.ResolveLikesByPostID(operationCtx, posts),
		HitsByPostID:     postsRepository.ResolveHitsByPostID(operationCtx, posts),
		CommentsByPostID: resolveCommentCountsByPostID(operationCtx, posts),
	}
}

// IncrementLike increases like count for a post.
func IncrementLike(ctx context.Context, postID string) ContentResponse {
	return incrementPostMetric(ctx, postID, postsRepository.IncrementPostLike, true)
}

// IncrementHit increases hit count for a post.
func IncrementHit(ctx context.Context, postID string) ContentResponse {
	return incrementPostMetric(ctx, postID, postsRepository.IncrementPostHit, false)
}

func incrementPostMetric(
	ctx context.Context,
	postID string,
	incrementFn func(context.Context, string, time.Time) (int64, error),
	updateLikes bool,
) ContentResponse {
	normalizedPostID, ok := normalizePostID(postID)
	if !ok {
		return ContentResponse{Status: statusInvalidPostID}
	}

	operationCtx, cancel := withTimeoutContext(ctx, 10*time.Second)
	defer cancel()

	value, incrementErr := incrementFn(operationCtx, normalizedPostID, time.Now().UTC())
	if incrementErr != nil {
		if errors.Is(incrementErr, repository.ErrPostRepositoryUnavailable) {
			return ContentResponse{Status: statusServiceUnavailable, PostID: normalizedPostID}
		}
		return ContentResponse{Status: "failed", PostID: normalizedPostID}
	}

	response := ContentResponse{
		Status: "success",
		PostID: normalizedPostID,
	}
	if updateLikes {
		response.Likes = value
		return response
	}

	response.Hits = value
	return response
}

func withTimeoutContext(parent context.Context, timeout time.Duration) (context.Context, context.CancelFunc) {
	if parent == nil {
		parent = context.Background()
	}
	return context.WithTimeout(parent, timeout)
}

func clampPositiveInt(value *int, fallback, maxValue int) int {
	if value == nil {
		return fallback
	}
	if *value <= 0 {
		return fallback
	}
	if maxValue > 0 && *value > maxValue {
		return maxValue
	}
	return *value
}

func normalizePostID(value string) (string, bool) {
	normalized := strings.ToLower(strings.TrimSpace(value))
	if !postIDPattern.MatchString(normalized) {
		return "", false
	}
	return normalized, true
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

func normalizeSortOrder(value string) string {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "asc":
		return "asc"
	default:
		return "desc"
	}
}

func buildContentFilter(locale string, scopeIDs []string) bson.M {
	filter := bson.M{
		"locale": locale,
	}

	if len(scopeIDs) > 0 {
		filter["id"] = bson.M{"$in": scopeIDs}
	}

	return filter
}

func resolveCommentCountsByPostID(ctx context.Context, posts []PostRecord) map[string]int64 {
	postIDs := make([]string, 0, len(posts))
	for _, post := range posts {
		postID, ok := normalizePostID(post.ID)
		if !ok {
			continue
		}
		postIDs = append(postIDs, postID)
	}

	if len(postIDs) == 0 {
		return map[string]int64{}
	}

	counts, err := postCommentRepository.CountApprovedByPosts(ctx, postIDs)
	if err != nil {
		return map[string]int64{}
	}

	return counts
}
