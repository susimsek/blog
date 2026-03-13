package repository

import (
	"context"
	"errors"
	"fmt"
	"regexp"
	"strings"
	"time"

	"suaybsimsek.com/blog-api/internal/domain"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var (
	ErrAdminContentRepositoryUnavailable = errors.New("admin content repository unavailable")
	ErrAdminContentPostNotFound          = errors.New("admin content post not found")
	ErrAdminContentTopicNotFound         = errors.New("admin content topic not found")
	ErrAdminContentCategoryNotFound      = errors.New("admin content category not found")
)

const adminContentRepositoryUnavailableFormat = "%w: %v"

type AdminContentRepository interface {
	ListPosts(
		ctx context.Context,
		filter domain.AdminContentPostFilter,
		page int,
		size int,
	) (*domain.AdminContentPostListResult, error)
	FindPostByLocaleAndID(ctx context.Context, locale, postID string) (*domain.AdminContentPostRecord, error)
	UpdatePostMetadata(
		ctx context.Context,
		locale string,
		postID string,
		category *domain.AdminContentCategoryRecord,
		topics []domain.AdminContentTopicRecord,
		now time.Time,
	) (*domain.AdminContentPostRecord, error)
	UpdatePostContent(
		ctx context.Context,
		locale string,
		postID string,
		content string,
		now time.Time,
	) (*domain.AdminContentPostRecord, error)
	DeletePostByLocaleAndID(ctx context.Context, locale, postID string) (bool, error)
	ListTopics(ctx context.Context, locale string) ([]domain.AdminContentTopicRecord, error)
	ListTopicsPage(
		ctx context.Context,
		filter domain.AdminContentTaxonomyFilter,
		page int,
		size int,
	) (*domain.AdminContentTopicListResult, error)
	FindTopicByLocaleAndID(ctx context.Context, locale, topicID string) (*domain.AdminContentTopicRecord, error)
	UpsertTopic(ctx context.Context, record domain.AdminContentTopicRecord, now time.Time) (*domain.AdminContentTopicRecord, error)
	DeleteTopicByLocaleAndID(ctx context.Context, locale, topicID string) (bool, error)
	SyncTopicOnPosts(ctx context.Context, record domain.AdminContentTopicRecord, now time.Time) error
	RemoveTopicFromPosts(ctx context.Context, locale, topicID string, now time.Time) error
	ListCategories(ctx context.Context, locale string) ([]domain.AdminContentCategoryRecord, error)
	ListCategoriesPage(
		ctx context.Context,
		filter domain.AdminContentTaxonomyFilter,
		page int,
		size int,
	) (*domain.AdminContentCategoryListResult, error)
	FindCategoryByLocaleAndID(ctx context.Context, locale, categoryID string) (*domain.AdminContentCategoryRecord, error)
	UpsertCategory(
		ctx context.Context,
		record domain.AdminContentCategoryRecord,
		now time.Time,
	) (*domain.AdminContentCategoryRecord, error)
	DeleteCategoryByLocaleAndID(ctx context.Context, locale, categoryID string) (bool, error)
	SyncCategoryOnPosts(ctx context.Context, record domain.AdminContentCategoryRecord, now time.Time) error
	ClearCategoryFromPosts(ctx context.Context, locale, categoryID string, now time.Time) error
}

type adminContentMongoRepository struct{}

func NewAdminContentRepository() AdminContentRepository { return &adminContentMongoRepository{} }

func (*adminContentMongoRepository) ListPosts(
	ctx context.Context,
	filter domain.AdminContentPostFilter,
	page int,
	size int,
) (*domain.AdminContentPostListResult, error) {
	postsCollection, err := getPostContentCollection()
	if err != nil {
		return nil, fmt.Errorf(adminContentRepositoryUnavailableFormat, ErrAdminContentRepositoryUnavailable, err)
	}

	query := buildAdminContentPostFilter(filter)
	total, err := postsCollection.CountDocuments(ctx, query)
	if err != nil {
		return nil, err
	}
	if total == 0 {
		return &domain.AdminContentPostListResult{
			Items: []domain.AdminContentPostRecord{},
			Total: 0,
			Page:  1,
			Size:  size,
		}, nil
	}

	totalPages := int((total + int64(size) - 1) / int64(size))
	resolvedPage := max(1, min(page, totalPages))
	skip := int64((resolvedPage - 1) * size)

	cursor, err := postsCollection.Find(
		ctx,
		query,
		options.Find().
			SetSort(bson.D{
				{Key: "publishedAt", Value: -1},
				{Key: "id", Value: 1},
			}).
			SetSkip(skip).
			SetLimit(int64(size)).
			SetProjection(bson.M{
				"locale":        1,
				"id":            1,
				"title":         1,
				"summary":       1,
				"thumbnail":     1,
				"source":        1,
				"publishedDate": 1,
				"updatedDate":   1,
				"category":      1,
				"topics":        1,
				"topicIds":      1,
				"updatedAt":     1,
			}),
	)
	if err != nil {
		return nil, err
	}
	defer func() {
		_ = cursor.Close(ctx)
	}()

	items := make([]domain.AdminContentPostRecord, 0, size)
	for cursor.Next(ctx) {
		var doc adminContentPostDocument
		if decodeErr := cursor.Decode(&doc); decodeErr != nil {
			return nil, decodeErr
		}
		items = append(items, mapAdminContentPostDocument(doc))
	}

	if err := cursor.Err(); err != nil {
		return nil, err
	}

	return &domain.AdminContentPostListResult{
		Items: items,
		Total: int(total),
		Page:  resolvedPage,
		Size:  size,
	}, nil
}

func (*adminContentMongoRepository) FindPostByLocaleAndID(
	ctx context.Context,
	locale string,
	postID string,
) (*domain.AdminContentPostRecord, error) {
	postsCollection, err := getPostContentCollection()
	if err != nil {
		return nil, fmt.Errorf(adminContentRepositoryUnavailableFormat, ErrAdminContentRepositoryUnavailable, err)
	}

	var doc adminContentPostDocument
	err = postsCollection.FindOne(
		ctx,
		bson.M{
			"locale": strings.TrimSpace(strings.ToLower(locale)),
			"id":     strings.TrimSpace(strings.ToLower(postID)),
		},
		options.FindOne().SetProjection(bson.M{
			"locale":           1,
			"id":               1,
			"title":            1,
			"summary":          1,
			"content":          1,
			"contentMode":      1,
			"thumbnail":        1,
			"source":           1,
			"publishedDate":    1,
			"updatedDate":      1,
			"category":         1,
			"topics":           1,
			"topicIds":         1,
			"contentUpdatedAt": 1,
			"updatedAt":        1,
		}),
	).Decode(&doc)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	mapped := mapAdminContentPostDocument(doc)
	return &mapped, nil
}

func (*adminContentMongoRepository) UpdatePostMetadata(
	ctx context.Context,
	locale string,
	postID string,
	category *domain.AdminContentCategoryRecord,
	topics []domain.AdminContentTopicRecord,
	now time.Time,
) (*domain.AdminContentPostRecord, error) {
	postsCollection, err := getPostContentCollection()
	if err != nil {
		return nil, fmt.Errorf(adminContentRepositoryUnavailableFormat, ErrAdminContentRepositoryUnavailable, err)
	}

	resolvedNow := now.UTC()
	if resolvedNow.IsZero() {
		resolvedNow = time.Now().UTC()
	}

	categoryValue := any(nil)
	if category != nil {
		categoryDocument := bson.M{
			"id":    strings.TrimSpace(strings.ToLower(category.ID)),
			"name":  strings.TrimSpace(category.Name),
			"color": strings.TrimSpace(strings.ToLower(category.Color)),
		}
		if icon := strings.TrimSpace(category.Icon); icon != "" {
			categoryDocument["icon"] = icon
		}
		categoryValue = categoryDocument
	}

	topicValues := make([]bson.M, 0, len(topics))
	topicIDs := make([]string, 0, len(topics))
	for _, topic := range topics {
		resolvedID := strings.TrimSpace(strings.ToLower(topic.ID))
		if resolvedID == "" {
			continue
		}
		resolvedTopic := bson.M{
			"id":    resolvedID,
			"name":  strings.TrimSpace(topic.Name),
			"color": strings.TrimSpace(strings.ToLower(topic.Color)),
		}
		if link := strings.TrimSpace(topic.Link); link != "" {
			resolvedTopic["link"] = link
		}
		topicValues = append(topicValues, resolvedTopic)
		topicIDs = append(topicIDs, resolvedID)
	}

	var updated adminContentPostDocument
	err = postsCollection.FindOneAndUpdate(
		ctx,
		bson.M{
			"locale": strings.TrimSpace(strings.ToLower(locale)),
			"id":     strings.TrimSpace(strings.ToLower(postID)),
		},
		bson.M{
			"$set": bson.M{
				"category":  categoryValue,
				"topics":    topicValues,
				"topicIds":  topicIDs,
				"updatedAt": resolvedNow,
			},
		},
		options.FindOneAndUpdate().
			SetReturnDocument(options.After).
			SetProjection(bson.M{
				"locale":           1,
				"id":               1,
				"title":            1,
				"summary":          1,
				"content":          1,
				"contentMode":      1,
				"thumbnail":        1,
				"source":           1,
				"publishedDate":    1,
				"updatedDate":      1,
				"category":         1,
				"topics":           1,
				"topicIds":         1,
				"contentUpdatedAt": 1,
				"updatedAt":        1,
			}),
	).Decode(&updated)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, ErrAdminContentPostNotFound
	}
	if err != nil {
		return nil, err
	}

	mapped := mapAdminContentPostDocument(updated)
	return &mapped, nil
}

func (*adminContentMongoRepository) UpdatePostContent(
	ctx context.Context,
	locale string,
	postID string,
	content string,
	now time.Time,
) (*domain.AdminContentPostRecord, error) {
	postsCollection, err := getPostContentCollection()
	if err != nil {
		return nil, fmt.Errorf(adminContentRepositoryUnavailableFormat, ErrAdminContentRepositoryUnavailable, err)
	}

	resolvedNow := now.UTC()
	if resolvedNow.IsZero() {
		resolvedNow = time.Now().UTC()
	}

	var updated adminContentPostDocument
	err = postsCollection.FindOneAndUpdate(
		ctx,
		bson.M{
			"locale": strings.TrimSpace(strings.ToLower(locale)),
			"id":     strings.TrimSpace(strings.ToLower(postID)),
		},
		bson.M{
			"$set": bson.M{
				"content":          content,
				"contentMode":      "admin",
				"contentUpdatedAt": resolvedNow,
				"updatedAt":        resolvedNow,
			},
		},
		options.FindOneAndUpdate().
			SetReturnDocument(options.After).
			SetProjection(bson.M{
				"locale":           1,
				"id":               1,
				"title":            1,
				"summary":          1,
				"content":          1,
				"contentMode":      1,
				"thumbnail":        1,
				"source":           1,
				"publishedDate":    1,
				"updatedDate":      1,
				"category":         1,
				"topics":           1,
				"topicIds":         1,
				"contentUpdatedAt": 1,
				"updatedAt":        1,
			}),
	).Decode(&updated)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, ErrAdminContentPostNotFound
	}
	if err != nil {
		return nil, err
	}

	mapped := mapAdminContentPostDocument(updated)
	return &mapped, nil
}

func (*adminContentMongoRepository) DeletePostByLocaleAndID(ctx context.Context, locale, postID string) (bool, error) {
	postsCollection, err := getPostContentCollection()
	if err != nil {
		return false, fmt.Errorf(adminContentRepositoryUnavailableFormat, ErrAdminContentRepositoryUnavailable, err)
	}

	resolvedPostID := strings.TrimSpace(strings.ToLower(postID))
	result, err := postsCollection.DeleteOne(ctx, bson.M{
		"locale": strings.TrimSpace(strings.ToLower(locale)),
		"id":     resolvedPostID,
	})
	if err != nil {
		return false, err
	}
	if result.DeletedCount == 0 {
		return false, nil
	}

	remainingCount, err := postsCollection.CountDocuments(ctx, bson.M{"id": resolvedPostID})
	if err != nil {
		return true, err
	}
	if remainingCount > 0 {
		return true, nil
	}

	if likesCollection, likesErr := getPostLikesCollection(); likesErr == nil {
		_, _ = likesCollection.DeleteOne(ctx, bson.M{"postId": resolvedPostID})
	}
	if hitsCollection, hitsErr := getPostHitsCollection(); hitsErr == nil {
		_, _ = hitsCollection.DeleteOne(ctx, bson.M{"postId": resolvedPostID})
	}

	return true, nil
}

func (*adminContentMongoRepository) ListTopics(ctx context.Context, locale string) ([]domain.AdminContentTopicRecord, error) {
	topicsCollection, err := getPostTopicsCollection()
	if err != nil {
		return nil, fmt.Errorf(adminContentRepositoryUnavailableFormat, ErrAdminContentRepositoryUnavailable, err)
	}

	query := bson.M{}
	resolvedLocale := strings.TrimSpace(strings.ToLower(locale))
	if resolvedLocale != "" {
		query["locale"] = resolvedLocale
	}

	cursor, err := topicsCollection.Find(
		ctx,
		query,
		options.Find().
			SetSort(bson.D{
				{Key: "locale", Value: 1},
				{Key: "name", Value: 1},
				{Key: "id", Value: 1},
			}),
	)
	if err != nil {
		return nil, err
	}
	defer func() {
		_ = cursor.Close(ctx)
	}()

	items := make([]domain.AdminContentTopicRecord, 0)
	for cursor.Next(ctx) {
		var doc struct {
			Locale    string    `bson:"locale"`
			ID        string    `bson:"id"`
			Name      string    `bson:"name"`
			Color     string    `bson:"color"`
			Link      string    `bson:"link"`
			UpdatedAt time.Time `bson:"updatedAt"`
		}
		if decodeErr := cursor.Decode(&doc); decodeErr != nil {
			return nil, decodeErr
		}

		item := domain.AdminContentTopicRecord{
			Locale:    strings.TrimSpace(strings.ToLower(doc.Locale)),
			ID:        strings.TrimSpace(strings.ToLower(doc.ID)),
			Name:      strings.TrimSpace(doc.Name),
			Color:     strings.TrimSpace(strings.ToLower(doc.Color)),
			Link:      strings.TrimSpace(doc.Link),
			UpdatedAt: doc.UpdatedAt,
		}
		if item.Locale == "" || item.ID == "" || item.Name == "" {
			continue
		}
		items = append(items, item)
	}

	if err := cursor.Err(); err != nil {
		return nil, err
	}

	return items, nil
}

func (*adminContentMongoRepository) ListTopicsPage(
	ctx context.Context,
	filter domain.AdminContentTaxonomyFilter,
	page int,
	size int,
) (*domain.AdminContentTopicListResult, error) {
	topicsCollection, err := getPostTopicsCollection()
	if err != nil {
		return nil, fmt.Errorf(adminContentRepositoryUnavailableFormat, ErrAdminContentRepositoryUnavailable, err)
	}

	query := buildAdminContentTopicFilter(filter)
	total, err := topicsCollection.CountDocuments(ctx, query)
	if err != nil {
		return nil, err
	}
	if total == 0 {
		return &domain.AdminContentTopicListResult{
			Items: []domain.AdminContentTopicRecord{},
			Total: 0,
			Page:  1,
			Size:  size,
		}, nil
	}

	totalPages := int((total + int64(size) - 1) / int64(size))
	resolvedPage := max(1, min(page, totalPages))
	skip := int64((resolvedPage - 1) * size)

	cursor, err := topicsCollection.Find(
		ctx,
		query,
		options.Find().
			SetSort(bson.D{
				{Key: "locale", Value: 1},
				{Key: "name", Value: 1},
				{Key: "id", Value: 1},
			}).
			SetSkip(skip).
			SetLimit(int64(size)).
			SetProjection(bson.M{
				"locale":    1,
				"id":        1,
				"name":      1,
				"color":     1,
				"link":      1,
				"updatedAt": 1,
			}),
	)
	if err != nil {
		return nil, err
	}
	defer func() {
		_ = cursor.Close(ctx)
	}()

	items := make([]domain.AdminContentTopicRecord, 0, size)
	for cursor.Next(ctx) {
		var doc struct {
			Locale    string    `bson:"locale"`
			ID        string    `bson:"id"`
			Name      string    `bson:"name"`
			Color     string    `bson:"color"`
			Link      string    `bson:"link"`
			UpdatedAt time.Time `bson:"updatedAt"`
		}
		if decodeErr := cursor.Decode(&doc); decodeErr != nil {
			return nil, decodeErr
		}

		item := domain.AdminContentTopicRecord{
			Locale:    strings.TrimSpace(strings.ToLower(doc.Locale)),
			ID:        strings.TrimSpace(strings.ToLower(doc.ID)),
			Name:      strings.TrimSpace(doc.Name),
			Color:     strings.TrimSpace(strings.ToLower(doc.Color)),
			Link:      strings.TrimSpace(doc.Link),
			UpdatedAt: doc.UpdatedAt,
		}
		if item.Locale == "" || item.ID == "" || item.Name == "" {
			continue
		}
		items = append(items, item)
	}

	if err := cursor.Err(); err != nil {
		return nil, err
	}

	return &domain.AdminContentTopicListResult{
		Items: items,
		Total: int(total),
		Page:  resolvedPage,
		Size:  size,
	}, nil
}

func (*adminContentMongoRepository) FindTopicByLocaleAndID(
	ctx context.Context,
	locale string,
	topicID string,
) (*domain.AdminContentTopicRecord, error) {
	topicsCollection, err := getPostTopicsCollection()
	if err != nil {
		return nil, fmt.Errorf(adminContentRepositoryUnavailableFormat, ErrAdminContentRepositoryUnavailable, err)
	}

	var doc struct {
		Locale    string    `bson:"locale"`
		ID        string    `bson:"id"`
		Name      string    `bson:"name"`
		Color     string    `bson:"color"`
		Link      string    `bson:"link"`
		UpdatedAt time.Time `bson:"updatedAt"`
	}
	err = topicsCollection.FindOne(ctx, bson.M{
		"locale": strings.TrimSpace(strings.ToLower(locale)),
		"id":     strings.TrimSpace(strings.ToLower(topicID)),
	}).Decode(&doc)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	return &domain.AdminContentTopicRecord{
		Locale:    strings.TrimSpace(strings.ToLower(doc.Locale)),
		ID:        strings.TrimSpace(strings.ToLower(doc.ID)),
		Name:      strings.TrimSpace(doc.Name),
		Color:     strings.TrimSpace(strings.ToLower(doc.Color)),
		Link:      strings.TrimSpace(doc.Link),
		UpdatedAt: doc.UpdatedAt,
	}, nil
}

func (*adminContentMongoRepository) UpsertTopic(
	ctx context.Context,
	record domain.AdminContentTopicRecord,
	now time.Time,
) (*domain.AdminContentTopicRecord, error) {
	topicsCollection, err := getPostTopicsCollection()
	if err != nil {
		return nil, fmt.Errorf(adminContentRepositoryUnavailableFormat, ErrAdminContentRepositoryUnavailable, err)
	}

	resolvedNow := now.UTC()
	if resolvedNow.IsZero() {
		resolvedNow = time.Now().UTC()
	}

	update := bson.M{
		"locale":    strings.TrimSpace(strings.ToLower(record.Locale)),
		"id":        strings.TrimSpace(strings.ToLower(record.ID)),
		"name":      strings.TrimSpace(record.Name),
		"color":     strings.TrimSpace(strings.ToLower(record.Color)),
		"updatedAt": resolvedNow,
	}
	if link := strings.TrimSpace(record.Link); link != "" {
		update["link"] = link
	}

	_, err = topicsCollection.UpdateOne(
		ctx,
		bson.M{
			"locale": update["locale"],
			"id":     update["id"],
		},
		bson.M{
			"$set": update,
			"$setOnInsert": bson.M{
				"createdAt": resolvedNow,
			},
		},
		options.Update().SetUpsert(true),
	)
	if err != nil {
		return nil, err
	}

	return (&adminContentMongoRepository{}).FindTopicByLocaleAndID(
		ctx,
		record.Locale,
		record.ID,
	)
}

func (*adminContentMongoRepository) DeleteTopicByLocaleAndID(ctx context.Context, locale, topicID string) (bool, error) {
	topicsCollection, err := getPostTopicsCollection()
	if err != nil {
		return false, fmt.Errorf(adminContentRepositoryUnavailableFormat, ErrAdminContentRepositoryUnavailable, err)
	}

	result, err := topicsCollection.DeleteOne(ctx, bson.M{
		"locale": strings.TrimSpace(strings.ToLower(locale)),
		"id":     strings.TrimSpace(strings.ToLower(topicID)),
	})
	if err != nil {
		return false, err
	}

	return result.DeletedCount > 0, nil
}

func (*adminContentMongoRepository) SyncTopicOnPosts(
	ctx context.Context,
	record domain.AdminContentTopicRecord,
	now time.Time,
) error {
	postsCollection, err := getPostContentCollection()
	if err != nil {
		return fmt.Errorf(adminContentRepositoryUnavailableFormat, ErrAdminContentRepositoryUnavailable, err)
	}

	resolvedLocale := strings.TrimSpace(strings.ToLower(record.Locale))
	resolvedTopicID := strings.TrimSpace(strings.ToLower(record.ID))
	if resolvedLocale == "" || resolvedTopicID == "" {
		return nil
	}

	updateDocument := bson.M{
		"$set": bson.M{
			"topics.$[topic].name":  strings.TrimSpace(record.Name),
			"topics.$[topic].color": strings.TrimSpace(strings.ToLower(record.Color)),
			"updatedAt":             now.UTC(),
		},
	}
	if link := strings.TrimSpace(record.Link); link != "" {
		updateDocument["$set"].(bson.M)["topics.$[topic].link"] = link
	} else {
		updateDocument["$unset"] = bson.M{"topics.$[topic].link": ""}
	}

	_, err = postsCollection.UpdateMany(
		ctx,
		bson.M{
			"locale":   resolvedLocale,
			"topicIds": resolvedTopicID,
		},
		updateDocument,
		options.Update().SetArrayFilters(options.ArrayFilters{
			Filters: []any{
				bson.M{"topic.id": resolvedTopicID},
			},
		}),
	)
	return err
}

func (*adminContentMongoRepository) RemoveTopicFromPosts(
	ctx context.Context,
	locale string,
	topicID string,
	now time.Time,
) error {
	postsCollection, err := getPostContentCollection()
	if err != nil {
		return fmt.Errorf(adminContentRepositoryUnavailableFormat, ErrAdminContentRepositoryUnavailable, err)
	}

	_, err = postsCollection.UpdateMany(
		ctx,
		bson.M{
			"locale":   strings.TrimSpace(strings.ToLower(locale)),
			"topicIds": strings.TrimSpace(strings.ToLower(topicID)),
		},
		bson.M{
			"$pull": bson.M{
				"topics":   bson.M{"id": strings.TrimSpace(strings.ToLower(topicID))},
				"topicIds": strings.TrimSpace(strings.ToLower(topicID)),
			},
			"$set": bson.M{
				"updatedAt": now.UTC(),
			},
		},
	)
	return err
}

func (*adminContentMongoRepository) ListCategories(
	ctx context.Context,
	locale string,
) ([]domain.AdminContentCategoryRecord, error) {
	categoriesCollection, err := getPostCategoriesCollection()
	if err != nil {
		return nil, fmt.Errorf(adminContentRepositoryUnavailableFormat, ErrAdminContentRepositoryUnavailable, err)
	}

	query := bson.M{}
	resolvedLocale := strings.TrimSpace(strings.ToLower(locale))
	if resolvedLocale != "" {
		query["locale"] = resolvedLocale
	}

	cursor, err := categoriesCollection.Find(
		ctx,
		query,
		options.Find().
			SetSort(bson.D{
				{Key: "locale", Value: 1},
				{Key: "name", Value: 1},
				{Key: "id", Value: 1},
			}),
	)
	if err != nil {
		return nil, err
	}
	defer func() {
		_ = cursor.Close(ctx)
	}()

	items := make([]domain.AdminContentCategoryRecord, 0)
	for cursor.Next(ctx) {
		var doc struct {
			Locale    string    `bson:"locale"`
			ID        string    `bson:"id"`
			Name      string    `bson:"name"`
			Color     string    `bson:"color"`
			Icon      string    `bson:"icon"`
			Link      string    `bson:"link"`
			UpdatedAt time.Time `bson:"updatedAt"`
		}
		if decodeErr := cursor.Decode(&doc); decodeErr != nil {
			return nil, decodeErr
		}

		item := domain.AdminContentCategoryRecord{
			Locale:    strings.TrimSpace(strings.ToLower(doc.Locale)),
			ID:        strings.TrimSpace(strings.ToLower(doc.ID)),
			Name:      strings.TrimSpace(doc.Name),
			Color:     strings.TrimSpace(strings.ToLower(doc.Color)),
			Icon:      strings.TrimSpace(doc.Icon),
			Link:      strings.TrimSpace(doc.Link),
			UpdatedAt: doc.UpdatedAt,
		}
		if item.Locale == "" || item.ID == "" || item.Name == "" {
			continue
		}
		items = append(items, item)
	}

	if err := cursor.Err(); err != nil {
		return nil, err
	}

	return items, nil
}

func (*adminContentMongoRepository) ListCategoriesPage(
	ctx context.Context,
	filter domain.AdminContentTaxonomyFilter,
	page int,
	size int,
) (*domain.AdminContentCategoryListResult, error) {
	categoriesCollection, err := getPostCategoriesCollection()
	if err != nil {
		return nil, fmt.Errorf(adminContentRepositoryUnavailableFormat, ErrAdminContentRepositoryUnavailable, err)
	}

	query := buildAdminContentCategoryFilter(filter)
	total, err := categoriesCollection.CountDocuments(ctx, query)
	if err != nil {
		return nil, err
	}
	if total == 0 {
		return &domain.AdminContentCategoryListResult{
			Items: []domain.AdminContentCategoryRecord{},
			Total: 0,
			Page:  1,
			Size:  size,
		}, nil
	}

	totalPages := int((total + int64(size) - 1) / int64(size))
	resolvedPage := max(1, min(page, totalPages))
	skip := int64((resolvedPage - 1) * size)

	cursor, err := categoriesCollection.Find(
		ctx,
		query,
		options.Find().
			SetSort(bson.D{
				{Key: "locale", Value: 1},
				{Key: "name", Value: 1},
				{Key: "id", Value: 1},
			}).
			SetSkip(skip).
			SetLimit(int64(size)).
			SetProjection(bson.M{
				"locale":    1,
				"id":        1,
				"name":      1,
				"color":     1,
				"icon":      1,
				"link":      1,
				"updatedAt": 1,
			}),
	)
	if err != nil {
		return nil, err
	}
	defer func() {
		_ = cursor.Close(ctx)
	}()

	items := make([]domain.AdminContentCategoryRecord, 0, size)
	for cursor.Next(ctx) {
		var doc struct {
			Locale    string    `bson:"locale"`
			ID        string    `bson:"id"`
			Name      string    `bson:"name"`
			Color     string    `bson:"color"`
			Icon      string    `bson:"icon"`
			Link      string    `bson:"link"`
			UpdatedAt time.Time `bson:"updatedAt"`
		}
		if decodeErr := cursor.Decode(&doc); decodeErr != nil {
			return nil, decodeErr
		}

		item := domain.AdminContentCategoryRecord{
			Locale:    strings.TrimSpace(strings.ToLower(doc.Locale)),
			ID:        strings.TrimSpace(strings.ToLower(doc.ID)),
			Name:      strings.TrimSpace(doc.Name),
			Color:     strings.TrimSpace(strings.ToLower(doc.Color)),
			Icon:      strings.TrimSpace(doc.Icon),
			Link:      strings.TrimSpace(doc.Link),
			UpdatedAt: doc.UpdatedAt,
		}
		if item.Locale == "" || item.ID == "" || item.Name == "" {
			continue
		}
		items = append(items, item)
	}

	if err := cursor.Err(); err != nil {
		return nil, err
	}

	return &domain.AdminContentCategoryListResult{
		Items: items,
		Total: int(total),
		Page:  resolvedPage,
		Size:  size,
	}, nil
}

func (*adminContentMongoRepository) FindCategoryByLocaleAndID(
	ctx context.Context,
	locale string,
	categoryID string,
) (*domain.AdminContentCategoryRecord, error) {
	categoriesCollection, err := getPostCategoriesCollection()
	if err != nil {
		return nil, fmt.Errorf(adminContentRepositoryUnavailableFormat, ErrAdminContentRepositoryUnavailable, err)
	}

	var doc struct {
		Locale    string    `bson:"locale"`
		ID        string    `bson:"id"`
		Name      string    `bson:"name"`
		Color     string    `bson:"color"`
		Icon      string    `bson:"icon"`
		Link      string    `bson:"link"`
		UpdatedAt time.Time `bson:"updatedAt"`
	}
	err = categoriesCollection.FindOne(ctx, bson.M{
		"locale": strings.TrimSpace(strings.ToLower(locale)),
		"id":     strings.TrimSpace(strings.ToLower(categoryID)),
	}).Decode(&doc)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	return &domain.AdminContentCategoryRecord{
		Locale:    strings.TrimSpace(strings.ToLower(doc.Locale)),
		ID:        strings.TrimSpace(strings.ToLower(doc.ID)),
		Name:      strings.TrimSpace(doc.Name),
		Color:     strings.TrimSpace(strings.ToLower(doc.Color)),
		Icon:      strings.TrimSpace(doc.Icon),
		Link:      strings.TrimSpace(doc.Link),
		UpdatedAt: doc.UpdatedAt,
	}, nil
}

func (*adminContentMongoRepository) UpsertCategory(
	ctx context.Context,
	record domain.AdminContentCategoryRecord,
	now time.Time,
) (*domain.AdminContentCategoryRecord, error) {
	categoriesCollection, err := getPostCategoriesCollection()
	if err != nil {
		return nil, fmt.Errorf(adminContentRepositoryUnavailableFormat, ErrAdminContentRepositoryUnavailable, err)
	}

	resolvedNow := now.UTC()
	if resolvedNow.IsZero() {
		resolvedNow = time.Now().UTC()
	}

	update := bson.M{
		"locale":    strings.TrimSpace(strings.ToLower(record.Locale)),
		"id":        strings.TrimSpace(strings.ToLower(record.ID)),
		"name":      strings.TrimSpace(record.Name),
		"color":     strings.TrimSpace(strings.ToLower(record.Color)),
		"updatedAt": resolvedNow,
	}
	if icon := strings.TrimSpace(record.Icon); icon != "" {
		update["icon"] = icon
	}
	if link := strings.TrimSpace(record.Link); link != "" {
		update["link"] = link
	}

	_, err = categoriesCollection.UpdateOne(
		ctx,
		bson.M{
			"locale": update["locale"],
			"id":     update["id"],
		},
		bson.M{
			"$set": update,
			"$setOnInsert": bson.M{
				"createdAt": resolvedNow,
			},
		},
		options.Update().SetUpsert(true),
	)
	if err != nil {
		return nil, err
	}

	return (&adminContentMongoRepository{}).FindCategoryByLocaleAndID(
		ctx,
		record.Locale,
		record.ID,
	)
}

func (*adminContentMongoRepository) DeleteCategoryByLocaleAndID(
	ctx context.Context,
	locale string,
	categoryID string,
) (bool, error) {
	categoriesCollection, err := getPostCategoriesCollection()
	if err != nil {
		return false, fmt.Errorf(adminContentRepositoryUnavailableFormat, ErrAdminContentRepositoryUnavailable, err)
	}

	result, err := categoriesCollection.DeleteOne(ctx, bson.M{
		"locale": strings.TrimSpace(strings.ToLower(locale)),
		"id":     strings.TrimSpace(strings.ToLower(categoryID)),
	})
	if err != nil {
		return false, err
	}

	return result.DeletedCount > 0, nil
}

func (*adminContentMongoRepository) SyncCategoryOnPosts(
	ctx context.Context,
	record domain.AdminContentCategoryRecord,
	now time.Time,
) error {
	postsCollection, err := getPostContentCollection()
	if err != nil {
		return fmt.Errorf(adminContentRepositoryUnavailableFormat, ErrAdminContentRepositoryUnavailable, err)
	}

	resolvedLocale := strings.TrimSpace(strings.ToLower(record.Locale))
	resolvedCategoryID := strings.TrimSpace(strings.ToLower(record.ID))
	if resolvedLocale == "" || resolvedCategoryID == "" {
		return nil
	}

	categoryValue := bson.M{
		"id":    resolvedCategoryID,
		"name":  strings.TrimSpace(record.Name),
		"color": strings.TrimSpace(strings.ToLower(record.Color)),
	}
	if icon := strings.TrimSpace(record.Icon); icon != "" {
		categoryValue["icon"] = icon
	}

	_, err = postsCollection.UpdateMany(
		ctx,
		bson.M{
			"locale":      resolvedLocale,
			"category.id": resolvedCategoryID,
		},
		bson.M{
			"$set": bson.M{
				"category":  categoryValue,
				"updatedAt": now.UTC(),
			},
		},
	)
	return err
}

func (*adminContentMongoRepository) ClearCategoryFromPosts(
	ctx context.Context,
	locale string,
	categoryID string,
	now time.Time,
) error {
	postsCollection, err := getPostContentCollection()
	if err != nil {
		return fmt.Errorf(adminContentRepositoryUnavailableFormat, ErrAdminContentRepositoryUnavailable, err)
	}

	_, err = postsCollection.UpdateMany(
		ctx,
		bson.M{
			"locale":      strings.TrimSpace(strings.ToLower(locale)),
			"category.id": strings.TrimSpace(strings.ToLower(categoryID)),
		},
		bson.M{
			"$set": bson.M{
				"category":  nil,
				"updatedAt": now.UTC(),
			},
		},
	)
	return err
}

type adminContentPostDocument struct {
	Locale        string `bson:"locale"`
	ID            string `bson:"id"`
	Title         string `bson:"title"`
	Summary       string `bson:"summary"`
	Content       string `bson:"content"`
	ContentMode   string `bson:"contentMode"`
	Thumbnail     string `bson:"thumbnail"`
	Source        string `bson:"source"`
	PublishedDate string `bson:"publishedDate"`
	UpdatedDate   string `bson:"updatedDate"`
	Category      *struct {
		ID   string `bson:"id"`
		Name string `bson:"name"`
	} `bson:"category"`
	Topics []struct {
		ID   string `bson:"id"`
		Name string `bson:"name"`
	} `bson:"topics"`
	TopicIDs         []string  `bson:"topicIds"`
	ContentUpdatedAt time.Time `bson:"contentUpdatedAt"`
	UpdatedAt        time.Time `bson:"updatedAt"`
}

func mapAdminContentPostDocument(doc adminContentPostDocument) domain.AdminContentPostRecord {
	topicIDs := make([]string, 0, len(doc.TopicIDs))
	for _, topicID := range doc.TopicIDs {
		resolvedID := strings.TrimSpace(strings.ToLower(topicID))
		if resolvedID == "" {
			continue
		}
		topicIDs = append(topicIDs, resolvedID)
	}

	topicNames := make([]string, 0, len(doc.Topics))
	if len(doc.Topics) > 0 {
		for _, topic := range doc.Topics {
			name := strings.TrimSpace(topic.Name)
			if name == "" {
				continue
			}
			topicNames = append(topicNames, name)
		}
	}

	if len(topicNames) == 0 {
		topicNames = append(topicNames, topicIDs...)
	}

	categoryID := ""
	categoryName := ""
	if doc.Category != nil {
		categoryID = strings.TrimSpace(strings.ToLower(doc.Category.ID))
		categoryName = strings.TrimSpace(doc.Category.Name)
	}

	return domain.AdminContentPostRecord{
		Locale:           strings.TrimSpace(strings.ToLower(doc.Locale)),
		ID:               strings.TrimSpace(strings.ToLower(doc.ID)),
		Title:            strings.TrimSpace(doc.Title),
		Summary:          strings.TrimSpace(doc.Summary),
		Content:          doc.Content,
		ContentMode:      strings.TrimSpace(strings.ToLower(doc.ContentMode)),
		Thumbnail:        strings.TrimSpace(doc.Thumbnail),
		Source:           strings.TrimSpace(strings.ToLower(doc.Source)),
		PublishedDate:    strings.TrimSpace(doc.PublishedDate),
		UpdatedDate:      strings.TrimSpace(doc.UpdatedDate),
		CategoryID:       categoryID,
		CategoryName:     categoryName,
		TopicIDs:         topicIDs,
		TopicNames:       topicNames,
		ContentUpdatedAt: doc.ContentUpdatedAt,
		UpdatedAt:        doc.UpdatedAt,
	}
}

func buildAdminContentPostFilter(filter domain.AdminContentPostFilter) bson.M {
	query := bson.M{}

	resolvedLocale := strings.TrimSpace(strings.ToLower(filter.Locale))
	if resolvedLocale != "" {
		query["locale"] = resolvedLocale
	}

	resolvedSource := strings.TrimSpace(strings.ToLower(filter.Source))
	if resolvedSource != "" {
		query["source"] = resolvedSource
	}

	resolvedCategoryID := strings.TrimSpace(strings.ToLower(filter.CategoryID))
	if resolvedCategoryID != "" {
		query["category.id"] = resolvedCategoryID
	}

	resolvedTopicID := strings.TrimSpace(strings.ToLower(filter.TopicID))
	if resolvedTopicID != "" {
		query["topicIds"] = resolvedTopicID
	}

	resolvedSearchQuery := strings.TrimSpace(filter.Query)
	if resolvedSearchQuery != "" {
		searchPattern := primitive.Regex{
			Pattern: regexp.QuoteMeta(resolvedSearchQuery),
			Options: "i",
		}
		query["$or"] = bson.A{
			bson.M{"id": searchPattern},
			bson.M{"title": searchPattern},
			bson.M{"summary": searchPattern},
			bson.M{"searchText": searchPattern},
		}
	}

	return query
}

func buildAdminContentTopicFilter(filter domain.AdminContentTaxonomyFilter) bson.M {
	query := bson.M{}

	resolvedLocale := strings.TrimSpace(strings.ToLower(filter.Locale))
	if resolvedLocale != "" {
		query["locale"] = resolvedLocale
	}

	resolvedSearchQuery := strings.TrimSpace(filter.Query)
	if resolvedSearchQuery != "" {
		searchPattern := primitive.Regex{
			Pattern: regexp.QuoteMeta(resolvedSearchQuery),
			Options: "i",
		}
		query["$or"] = bson.A{
			bson.M{"id": searchPattern},
			bson.M{"name": searchPattern},
		}
	}

	return query
}

func buildAdminContentCategoryFilter(filter domain.AdminContentTaxonomyFilter) bson.M {
	query := bson.M{}

	resolvedLocale := strings.TrimSpace(strings.ToLower(filter.Locale))
	if resolvedLocale != "" {
		query["locale"] = resolvedLocale
	}

	resolvedSearchQuery := strings.TrimSpace(filter.Query)
	if resolvedSearchQuery != "" {
		searchPattern := primitive.Regex{
			Pattern: regexp.QuoteMeta(resolvedSearchQuery),
			Options: "i",
		}
		query["$or"] = bson.A{
			bson.M{"id": searchPattern},
			bson.M{"name": searchPattern},
			bson.M{"icon": searchPattern},
		}
	}

	return query
}
