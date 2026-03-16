package repository

import (
	"context"
	"errors"
	"fmt"
	"regexp"
	"strings"
	"sync"
	"time"

	"suaybsimsek.com/blog-api/internal/domain"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

const postCommentsCollectionName = "post_comments"

var (
	ErrCommentRepositoryUnavailable = errors.New("comment repository unavailable")
	ErrCommentNotFound              = errors.New("comment not found")
)

const commentRepositoryUnavailableFormat = "%w: %v"

type CommentRepository interface {
	ListApprovedByPost(ctx context.Context, postID string) ([]domain.CommentRecord, error)
	CountApprovedByPost(ctx context.Context, postID string) (int, error)
	CreateComment(ctx context.Context, input domain.CommentRecord) error
	FindCommentByID(ctx context.Context, id string) (*domain.CommentRecord, error)
	ListComments(
		ctx context.Context,
		filter domain.AdminCommentFilter,
		page int,
		size int,
	) (*domain.AdminCommentListResult, error)
	UpdateCommentStatusByID(
		ctx context.Context,
		id string,
		status string,
		moderationNote string,
		now time.Time,
	) (*domain.CommentRecord, error)
	DeleteCommentByID(ctx context.Context, id string) (bool, error)
}

type commentMongoRepository struct{}

var (
	postCommentsIndexesOnce sync.Once
	postCommentsIndexesErr  error
)

type commentSingleFinder interface {
	FindOne(context.Context, any, ...*options.FindOneOptions) *mongo.SingleResult
}

func NewCommentRepository() CommentRepository {
	return &commentMongoRepository{}
}

func ensurePostCommentIndexes(collection *mongo.Collection) error {
	postCommentsIndexesOnce.Do(func() {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		indexes := []mongo.IndexModel{
			{
				Keys:    bson.D{{Key: "id", Value: 1}},
				Options: options.Index().SetUnique(true).SetName("uniq_post_comment_id"),
			},
			{
				Keys: bson.D{
					{Key: "postId", Value: 1},
					{Key: "status", Value: 1},
					{Key: "createdAt", Value: 1},
				},
				Options: options.Index().SetName("idx_post_comment_discussion_status_created"),
			},
			{
				Keys: bson.D{
					{Key: "parentId", Value: 1},
					{Key: "status", Value: 1},
					{Key: "createdAt", Value: 1},
				},
				Options: options.Index().SetName("idx_post_comment_parent_status_created"),
			},
			{
				Keys: bson.D{
					{Key: "status", Value: 1},
					{Key: "createdAt", Value: -1},
				},
				Options: options.Index().SetName("idx_post_comment_status_created"),
			},
			{
				Keys: bson.D{
					{Key: "ipHash", Value: 1},
					{Key: "createdAt", Value: -1},
				},
				Options: options.Index().SetName("idx_post_comment_ip_created"),
			},
		}

		if _, err := collection.Indexes().CreateMany(ctx, indexes); err != nil {
			postCommentsIndexesErr = fmt.Errorf("post_comments index create failed: %w", err)
			return
		}
	})

	return postCommentsIndexesErr
}

func getPostCommentsCollection() (*mongo.Collection, error) {
	collection, err := getPostCollection(postCommentsCollectionName)
	if err != nil {
		return nil, err
	}
	if err := ensurePostCommentIndexes(collection); err != nil {
		return nil, err
	}
	return collection, nil
}

func (*commentMongoRepository) ListApprovedByPost(ctx context.Context, postID string) ([]domain.CommentRecord, error) {
	collection, err := getPostCommentsCollection()
	if err != nil {
		return nil, fmt.Errorf(commentRepositoryUnavailableFormat, ErrCommentRepositoryUnavailable, err)
	}

	cursor, err := collection.Find(
		ctx,
		bson.M{
			"postId": strings.TrimSpace(strings.ToLower(postID)),
			"status": "approved",
		},
		options.Find().SetSort(bson.D{
			{Key: "createdAt", Value: 1},
			{Key: "id", Value: 1},
		}),
	)
	if err != nil {
		return nil, err
	}
	defer func() {
		_ = cursor.Close(ctx)
	}()

	comments := make([]domain.CommentRecord, 0)
	for cursor.Next(ctx) {
		var item domain.CommentRecord
		if decodeErr := cursor.Decode(&item); decodeErr != nil {
			return nil, decodeErr
		}
		comments = append(comments, item)
	}
	if err := cursor.Err(); err != nil {
		return nil, err
	}

	return comments, nil
}

func (*commentMongoRepository) CountApprovedByPost(ctx context.Context, postID string) (int, error) {
	collection, err := getPostCommentsCollection()
	if err != nil {
		return 0, fmt.Errorf(commentRepositoryUnavailableFormat, ErrCommentRepositoryUnavailable, err)
	}

	total, err := collection.CountDocuments(
		ctx,
		bson.M{
			"postId": strings.TrimSpace(strings.ToLower(postID)),
			"status": "approved",
		},
	)
	if err != nil {
		return 0, err
	}

	return int(total), nil
}

func (*commentMongoRepository) CreateComment(ctx context.Context, input domain.CommentRecord) error {
	collection, err := getPostCommentsCollection()
	if err != nil {
		return fmt.Errorf(commentRepositoryUnavailableFormat, ErrCommentRepositoryUnavailable, err)
	}

	_, err = collection.InsertOne(ctx, input)
	return err
}

func (*commentMongoRepository) FindCommentByID(ctx context.Context, id string) (*domain.CommentRecord, error) {
	collection, err := getPostCommentsCollection()
	if err != nil {
		return nil, fmt.Errorf(commentRepositoryUnavailableFormat, ErrCommentRepositoryUnavailable, err)
	}

	return findCommentByIDInCollection(ctx, collection, id)
}

func findCommentByIDInCollection(ctx context.Context, finder commentSingleFinder, id string) (*domain.CommentRecord, error) {
	var item domain.CommentRecord
	err := finder.FindOne(ctx, bson.M{"id": strings.TrimSpace(id)}).Decode(&item)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, ErrCommentNotFound
	}
	if err != nil {
		return nil, err
	}
	return &item, nil
}

func (*commentMongoRepository) ListComments(
	ctx context.Context,
	filter domain.AdminCommentFilter,
	page int,
	size int,
) (*domain.AdminCommentListResult, error) {
	collection, err := getPostCommentsCollection()
	if err != nil {
		return nil, fmt.Errorf(commentRepositoryUnavailableFormat, ErrCommentRepositoryUnavailable, err)
	}

	resolvedPage := max(1, page)
	resolvedSize := max(1, size)
	skip := int64((resolvedPage - 1) * resolvedSize)

	query := bson.M{}
	if status := strings.TrimSpace(strings.ToLower(filter.Status)); status != "" {
		query["status"] = status
	}
	if postID := strings.TrimSpace(strings.ToLower(filter.PostID)); postID != "" {
		query["postId"] = postID
	}
	if searchQuery := strings.TrimSpace(filter.Query); searchQuery != "" {
		escapedQuery := regexp.QuoteMeta(searchQuery)
		query["$or"] = bson.A{
			bson.M{"authorName": bson.M{"$regex": escapedQuery, "$options": "i"}},
			bson.M{"authorEmail": bson.M{"$regex": escapedQuery, "$options": "i"}},
			bson.M{"content": bson.M{"$regex": escapedQuery, "$options": "i"}},
			bson.M{"postTitle": bson.M{"$regex": escapedQuery, "$options": "i"}},
			bson.M{"postId": bson.M{"$regex": escapedQuery, "$options": "i"}},
		}
	}

	totalCount, err := collection.CountDocuments(ctx, query)
	if err != nil {
		return nil, err
	}

	cursor, err := collection.Find(
		ctx,
		query,
		options.Find().
			SetSort(bson.D{
				{Key: "createdAt", Value: -1},
				{Key: "id", Value: 1},
			}).
			SetSkip(skip).
			SetLimit(int64(resolvedSize)),
	)
	if err != nil {
		return nil, err
	}
	defer func() {
		_ = cursor.Close(ctx)
	}()

	items := make([]domain.CommentRecord, 0, resolvedSize)
	for cursor.Next(ctx) {
		var item domain.CommentRecord
		if decodeErr := cursor.Decode(&item); decodeErr != nil {
			return nil, decodeErr
		}
		items = append(items, item)
	}
	if err := cursor.Err(); err != nil {
		return nil, err
	}

	return &domain.AdminCommentListResult{
		Items: items,
		Total: int(totalCount),
		Page:  resolvedPage,
		Size:  resolvedSize,
	}, nil
}

func (*commentMongoRepository) UpdateCommentStatusByID(
	ctx context.Context,
	id string,
	status string,
	moderationNote string,
	now time.Time,
) (*domain.CommentRecord, error) {
	collection, err := getPostCommentsCollection()
	if err != nil {
		return nil, fmt.Errorf(commentRepositoryUnavailableFormat, ErrCommentRepositoryUnavailable, err)
	}

	resolvedID := strings.TrimSpace(id)
	resolvedStatus := strings.TrimSpace(strings.ToLower(status))
	resolvedNote := strings.TrimSpace(moderationNote)
	resolvedNow := now.UTC()

	update := bson.M{
		"$set": bson.M{
			"status":         resolvedStatus,
			"updatedAt":      resolvedNow,
			"moderatedAt":    resolvedNow,
			"moderationNote": resolvedNote,
		},
	}

	var updated domain.CommentRecord
	err = collection.FindOneAndUpdate(
		ctx,
		bson.M{"id": resolvedID},
		update,
		options.FindOneAndUpdate().SetReturnDocument(options.After),
	).Decode(&updated)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, ErrCommentNotFound
	}
	if err != nil {
		return nil, err
	}

	return &updated, nil
}

func (*commentMongoRepository) DeleteCommentByID(ctx context.Context, id string) (bool, error) {
	collection, err := getPostCommentsCollection()
	if err != nil {
		return false, fmt.Errorf(commentRepositoryUnavailableFormat, ErrCommentRepositoryUnavailable, err)
	}

	result, err := collection.DeleteOne(ctx, bson.M{"id": strings.TrimSpace(id)})
	if err != nil {
		return false, err
	}

	return result.DeletedCount > 0, nil
}
