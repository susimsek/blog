package repository

import (
	"context"
	"errors"
	"fmt"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"suaybsimsek.com/blog-api/internal/domain"
)

var ErrPostRepositoryUnavailable = errors.New("posts repository unavailable")

const postRepositoryUnavailableFormat = "%w: %v"

// PostRepository defines data access methods for posts and engagement data.
type PostRepository interface {
	CountPosts(ctx context.Context, filter bson.M) (int, error)
	FindPosts(ctx context.Context, filter bson.M, sortOrder string, skip int64, limit int64) ([]domain.PostRecord, error)
	FindPostByID(ctx context.Context, locale string, postID string) (*domain.PostRecord, error)
	ResolveLikesByPostID(ctx context.Context, posts []domain.PostRecord) map[string]int64
	ResolveHitsByPostID(ctx context.Context, posts []domain.PostRecord) map[string]int64
	IncrementPostLike(ctx context.Context, postID string, now time.Time) (int64, error)
	IncrementPostHit(ctx context.Context, postID string, now time.Time) (int64, error)
}

type postMongoRepository struct{}

// NewPostMongoRepository returns the default MongoDB-backed repository.
func NewPostMongoRepository() PostRepository {
	return &postMongoRepository{}
}

func (r *postMongoRepository) CountPosts(ctx context.Context, filter bson.M) (int, error) {
	collection, err := getPostContentCollection()
	if err != nil {
		return 0, fmt.Errorf(postRepositoryUnavailableFormat, ErrPostRepositoryUnavailable, err)
	}

	total, err := collection.CountDocuments(ctx, filter)
	if err != nil {
		return 0, err
	}

	return int(total), nil
}

func (r *postMongoRepository) FindPosts(
	ctx context.Context,
	filter bson.M,
	sortOrder string,
	skip int64,
	limit int64,
) ([]domain.PostRecord, error) {
	collection, err := getPostContentCollection()
	if err != nil {
		return nil, fmt.Errorf(postRepositoryUnavailableFormat, ErrPostRepositoryUnavailable, err)
	}

	return queryPostRecords(ctx, collection, filter, sortOrder, skip, limit)
}

func (r *postMongoRepository) FindPostByID(ctx context.Context, locale string, postID string) (*domain.PostRecord, error) {
	collection, err := getPostContentCollection()
	if err != nil {
		return nil, fmt.Errorf(postRepositoryUnavailableFormat, ErrPostRepositoryUnavailable, err)
	}

	return queryPostRecordByID(ctx, collection, locale, postID)
}

func (r *postMongoRepository) ResolveLikesByPostID(ctx context.Context, posts []domain.PostRecord) map[string]int64 {
	return resolvePostLikesByPostID(ctx, posts)
}

func (r *postMongoRepository) ResolveHitsByPostID(ctx context.Context, posts []domain.PostRecord) map[string]int64 {
	return resolvePostHitsByPostID(ctx, posts)
}

func (r *postMongoRepository) IncrementPostLike(ctx context.Context, postID string, now time.Time) (int64, error) {
	collection, err := getPostLikesCollection()
	if err != nil {
		return 0, fmt.Errorf(postRepositoryUnavailableFormat, ErrPostRepositoryUnavailable, err)
	}

	return incrementPostLikeValue(ctx, collection, postID, now)
}

func (r *postMongoRepository) IncrementPostHit(ctx context.Context, postID string, now time.Time) (int64, error) {
	collection, err := getPostHitsCollection()
	if err != nil {
		return 0, fmt.Errorf(postRepositoryUnavailableFormat, ErrPostRepositoryUnavailable, err)
	}

	return incrementPostHitValue(ctx, collection, postID, now)
}
