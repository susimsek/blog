package handler

import (
	"context"
	"errors"
	"fmt"
	"time"

	"go.mongodb.org/mongo-driver/bson"
)

var errRepositoryUnavailable = errors.New("posts repository unavailable")

// Repository defines data access methods for posts and engagement data.
type Repository interface {
	CountPosts(ctx context.Context, filter bson.M) (int, error)
	FindPosts(ctx context.Context, filter bson.M, sortOrder string, skip int64, limit int64) ([]postRecord, error)
	ResolveLikesByPostID(ctx context.Context, posts []postRecord) map[string]int64
	ResolveHitsByPostID(ctx context.Context, posts []postRecord) map[string]int64
	IncrementPostLike(ctx context.Context, postID string, now time.Time) (int64, error)
	IncrementPostHit(ctx context.Context, postID string, now time.Time) (int64, error)
}

type mongoRepository struct{}

// NewMongoRepository returns the default MongoDB-backed repository.
func NewMongoRepository() Repository {
	return &mongoRepository{}
}

func (r *mongoRepository) CountPosts(ctx context.Context, filter bson.M) (int, error) {
	collection, err := getPostsCollection()
	if err != nil {
		return 0, fmt.Errorf("%w: %v", errRepositoryUnavailable, err)
	}

	total, err := collection.CountDocuments(ctx, filter)
	if err != nil {
		return 0, err
	}

	return int(total), nil
}

func (r *mongoRepository) FindPosts(
	ctx context.Context,
	filter bson.M,
	sortOrder string,
	skip int64,
	limit int64,
) ([]postRecord, error) {
	collection, err := getPostsCollection()
	if err != nil {
		return nil, fmt.Errorf("%w: %v", errRepositoryUnavailable, err)
	}

	return queryPosts(ctx, collection, filter, sortOrder, skip, limit)
}

func (r *mongoRepository) ResolveLikesByPostID(ctx context.Context, posts []postRecord) map[string]int64 {
	return resolveLikesByPostID(ctx, posts)
}

func (r *mongoRepository) ResolveHitsByPostID(ctx context.Context, posts []postRecord) map[string]int64 {
	return resolveHitsByPostID(ctx, posts)
}

func (r *mongoRepository) IncrementPostLike(ctx context.Context, postID string, now time.Time) (int64, error) {
	collection, err := getLikesCollection()
	if err != nil {
		return 0, fmt.Errorf("%w: %v", errRepositoryUnavailable, err)
	}

	return incrementPostLike(ctx, collection, postID, now)
}

func (r *mongoRepository) IncrementPostHit(ctx context.Context, postID string, now time.Time) (int64, error) {
	collection, err := getHitsCollection()
	if err != nil {
		return 0, fmt.Errorf("%w: %v", errRepositoryUnavailable, err)
	}

	return incrementPostHit(ctx, collection, postID, now)
}
