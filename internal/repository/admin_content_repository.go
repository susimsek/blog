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

const (
	adminContentLocaleEN = "en"
	adminContentLocaleTR = "tr"
)

type AdminContentRepository interface {
	ListPostGroups(ctx context.Context, filter domain.AdminContentPostFilter) (*domain.AdminContentPostListResult, error)
	ListAllPosts(ctx context.Context, filter domain.AdminContentPostFilter) ([]domain.AdminContentPostRecord, error)
	FindPostByLocaleAndID(ctx context.Context, locale, postID string) (*domain.AdminContentPostRecord, error)
	UpdatePostMetadata(
		ctx context.Context,
		locale string,
		postID string,
		fields domain.AdminContentPostMetadataFields,
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
	ListTopicGroups(ctx context.Context, filter domain.AdminContentTaxonomyFilter) (*domain.AdminContentTopicListResult, error)
	ListAllTopics(ctx context.Context, filter domain.AdminContentTaxonomyFilter) ([]domain.AdminContentTopicRecord, error)
	FindTopicByLocaleAndID(ctx context.Context, locale, topicID string) (*domain.AdminContentTopicRecord, error)
	UpsertTopic(ctx context.Context, record domain.AdminContentTopicRecord, now time.Time) (*domain.AdminContentTopicRecord, error)
	DeleteTopicByLocaleAndID(ctx context.Context, locale, topicID string) (bool, error)
	SyncTopicOnPosts(ctx context.Context, record domain.AdminContentTopicRecord, now time.Time) error
	RemoveTopicFromPosts(ctx context.Context, locale, topicID string, now time.Time) error
	ListCategories(ctx context.Context, locale string) ([]domain.AdminContentCategoryRecord, error)
	ListCategoryGroups(ctx context.Context, filter domain.AdminContentTaxonomyFilter) (*domain.AdminContentCategoryListResult, error)
	ListAllCategories(ctx context.Context, filter domain.AdminContentTaxonomyFilter) ([]domain.AdminContentCategoryRecord, error)
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

func (*adminContentMongoRepository) ListPostGroups(
	ctx context.Context,
	filter domain.AdminContentPostFilter,
) (*domain.AdminContentPostListResult, error) {
	postsCollection, err := getPostContentCollection()
	if err != nil {
		return nil, fmt.Errorf(adminContentRepositoryUnavailableFormat, ErrAdminContentRepositoryUnavailable, err)
	}

	resolvedPreferredLocale := strings.TrimSpace(strings.ToLower(filter.PreferredLocale))
	if resolvedPreferredLocale == "" {
		resolvedPreferredLocale = adminContentLocaleEN
	}

	basePipeline := buildAdminContentPostGroupPipeline(filter)
	total, err := aggregateAdminContentTotal(ctx, postsCollection, basePipeline)
	if err != nil {
		return nil, err
	}

	resolvedPage, resolvedSize, skip := resolveAdminContentPagination(filter.Page, filter.Size, total)
	if total == 0 {
		return &domain.AdminContentPostListResult{
			Items: []domain.AdminContentPostGroupRecord{},
			Total: 0,
			Page:  resolvedPage,
			Size:  resolvedSize,
		}, nil
	}

	itemsPipeline := append(mongo.Pipeline{}, basePipeline...)
	itemsPipeline = append(itemsPipeline,
		bson.D{{Key: "$skip", Value: skip}},
		bson.D{{Key: "$limit", Value: resolvedSize}},
	)

	cursor, err := postsCollection.Aggregate(ctx, itemsPipeline)
	if err != nil {
		return nil, err
	}
	defer func() {
		_ = cursor.Close(ctx)
	}()

	items := make([]domain.AdminContentPostGroupRecord, 0, resolvedSize)
	for cursor.Next(ctx) {
		var doc adminContentPostGroupAggregateDocument
		if decodeErr := cursor.Decode(&doc); decodeErr != nil {
			return nil, decodeErr
		}

		item, ok := mapAdminContentPostGroupAggregateDocument(doc, resolvedPreferredLocale)
		if !ok {
			continue
		}
		items = append(items, item)
	}
	if err := cursor.Err(); err != nil {
		return nil, err
	}

	return &domain.AdminContentPostListResult{
		Items: items,
		Total: total,
		Page:  resolvedPage,
		Size:  resolvedSize,
	}, nil
}

func (*adminContentMongoRepository) ListAllPosts(
	ctx context.Context,
	filter domain.AdminContentPostFilter,
) ([]domain.AdminContentPostRecord, error) {
	postsCollection, err := getPostContentCollection()
	if err != nil {
		return nil, fmt.Errorf(adminContentRepositoryUnavailableFormat, ErrAdminContentRepositoryUnavailable, err)
	}

	query := buildAdminContentPostFilter(filter)
	cursor, err := postsCollection.Find(
		ctx,
		query,
		options.Find().
			SetSort(bson.D{
				{Key: "publishedAt", Value: -1},
				{Key: "id", Value: 1},
			}).
			SetProjection(bson.M{
				"locale":         1,
				"id":             1,
				"title":          1,
				"summary":        1,
				"thumbnail":      1,
				"source":         1,
				"publishedAt":    1,
				"publishedDate":  1,
				"updatedDate":    1,
				"category":       1,
				"topics":         1,
				"topicIds":       1,
				"readingTimeMin": 1,
				"updatedAt":      1,
			}),
	)
	if err != nil {
		return nil, err
	}
	defer func() {
		_ = cursor.Close(ctx)
	}()

	items := make([]domain.AdminContentPostRecord, 0)
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

	return items, nil
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
			"readingTimeMin":   1,
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
	fields domain.AdminContentPostMetadataFields,
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
				"title":         strings.TrimSpace(fields.Title),
				"summary":       strings.TrimSpace(fields.Summary),
				"thumbnail":     strings.TrimSpace(fields.Thumbnail),
				"publishedDate": strings.TrimSpace(fields.PublishedDate),
				"updatedDate":   strings.TrimSpace(fields.UpdatedDate),
				"category":      categoryValue,
				"topics":        topicValues,
				"topicIds":      topicIDs,
				"updatedAt":     resolvedNow,
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

func (*adminContentMongoRepository) ListAllTopics(
	ctx context.Context,
	filter domain.AdminContentTaxonomyFilter,
) ([]domain.AdminContentTopicRecord, error) {
	topicsCollection, err := getPostTopicsCollection()
	if err != nil {
		return nil, fmt.Errorf(adminContentRepositoryUnavailableFormat, ErrAdminContentRepositoryUnavailable, err)
	}

	query := buildAdminContentTopicFilter(filter)
	cursor, err := topicsCollection.Find(
		ctx,
		query,
		options.Find().
			SetSort(bson.D{
				{Key: "locale", Value: 1},
				{Key: "name", Value: 1},
				{Key: "id", Value: 1},
			}).
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

	items := make([]domain.AdminContentTopicRecord, 0, 32)
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

func (*adminContentMongoRepository) ListTopicGroups(
	ctx context.Context,
	filter domain.AdminContentTaxonomyFilter,
) (*domain.AdminContentTopicListResult, error) {
	topicsCollection, err := getPostTopicsCollection()
	if err != nil {
		return nil, fmt.Errorf(adminContentRepositoryUnavailableFormat, ErrAdminContentRepositoryUnavailable, err)
	}

	resolvedPreferredLocale := strings.TrimSpace(strings.ToLower(filter.PreferredLocale))
	if resolvedPreferredLocale == "" {
		resolvedPreferredLocale = adminContentLocaleEN
	}

	basePipeline := buildAdminContentTopicGroupPipeline(filter)
	total, err := aggregateAdminContentTotal(ctx, topicsCollection, basePipeline)
	if err != nil {
		return nil, err
	}

	resolvedPage, resolvedSize, skip := resolveAdminContentPagination(filter.Page, filter.Size, total)
	if total == 0 {
		return &domain.AdminContentTopicListResult{
			Items: []domain.AdminContentTopicGroupRecord{},
			Total: 0,
			Page:  resolvedPage,
			Size:  resolvedSize,
		}, nil
	}

	itemsPipeline := append(mongo.Pipeline{}, basePipeline...)
	itemsPipeline = append(itemsPipeline,
		bson.D{{Key: "$skip", Value: skip}},
		bson.D{{Key: "$limit", Value: resolvedSize}},
	)

	cursor, err := topicsCollection.Aggregate(ctx, itemsPipeline)
	if err != nil {
		return nil, err
	}
	defer func() {
		_ = cursor.Close(ctx)
	}()

	items := make([]domain.AdminContentTopicGroupRecord, 0, resolvedSize)
	for cursor.Next(ctx) {
		var doc adminContentTopicGroupAggregateDocument
		if decodeErr := cursor.Decode(&doc); decodeErr != nil {
			return nil, decodeErr
		}

		item, ok := mapAdminContentTopicGroupAggregateDocument(doc, resolvedPreferredLocale)
		if !ok {
			continue
		}
		items = append(items, item)
	}
	if err := cursor.Err(); err != nil {
		return nil, err
	}

	return &domain.AdminContentTopicListResult{
		Items: items,
		Total: total,
		Page:  resolvedPage,
		Size:  resolvedSize,
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

func (*adminContentMongoRepository) ListAllCategories(
	ctx context.Context,
	filter domain.AdminContentTaxonomyFilter,
) ([]domain.AdminContentCategoryRecord, error) {
	categoriesCollection, err := getPostCategoriesCollection()
	if err != nil {
		return nil, fmt.Errorf(adminContentRepositoryUnavailableFormat, ErrAdminContentRepositoryUnavailable, err)
	}

	query := buildAdminContentCategoryFilter(filter)
	cursor, err := categoriesCollection.Find(
		ctx,
		query,
		options.Find().
			SetSort(bson.D{
				{Key: "locale", Value: 1},
				{Key: "name", Value: 1},
				{Key: "id", Value: 1},
			}).
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

	items := make([]domain.AdminContentCategoryRecord, 0, 32)
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

func (*adminContentMongoRepository) ListCategoryGroups(
	ctx context.Context,
	filter domain.AdminContentTaxonomyFilter,
) (*domain.AdminContentCategoryListResult, error) {
	categoriesCollection, err := getPostCategoriesCollection()
	if err != nil {
		return nil, fmt.Errorf(adminContentRepositoryUnavailableFormat, ErrAdminContentRepositoryUnavailable, err)
	}

	resolvedPreferredLocale := strings.TrimSpace(strings.ToLower(filter.PreferredLocale))
	if resolvedPreferredLocale == "" {
		resolvedPreferredLocale = adminContentLocaleEN
	}

	basePipeline := buildAdminContentCategoryGroupPipeline(filter)
	total, err := aggregateAdminContentTotal(ctx, categoriesCollection, basePipeline)
	if err != nil {
		return nil, err
	}

	resolvedPage, resolvedSize, skip := resolveAdminContentPagination(filter.Page, filter.Size, total)
	if total == 0 {
		return &domain.AdminContentCategoryListResult{
			Items: []domain.AdminContentCategoryGroupRecord{},
			Total: 0,
			Page:  resolvedPage,
			Size:  resolvedSize,
		}, nil
	}

	itemsPipeline := append(mongo.Pipeline{}, basePipeline...)
	itemsPipeline = append(itemsPipeline,
		bson.D{{Key: "$skip", Value: skip}},
		bson.D{{Key: "$limit", Value: resolvedSize}},
	)

	cursor, err := categoriesCollection.Aggregate(ctx, itemsPipeline)
	if err != nil {
		return nil, err
	}
	defer func() {
		_ = cursor.Close(ctx)
	}()

	items := make([]domain.AdminContentCategoryGroupRecord, 0, resolvedSize)
	for cursor.Next(ctx) {
		var doc adminContentCategoryGroupAggregateDocument
		if decodeErr := cursor.Decode(&doc); decodeErr != nil {
			return nil, decodeErr
		}

		item, ok := mapAdminContentCategoryGroupAggregateDocument(doc, resolvedPreferredLocale)
		if !ok {
			continue
		}
		items = append(items, item)
	}
	if err := cursor.Err(); err != nil {
		return nil, err
	}

	return &domain.AdminContentCategoryListResult{
		Items: items,
		Total: total,
		Page:  resolvedPage,
		Size:  resolvedSize,
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
	Locale        string    `bson:"locale"`
	ID            string    `bson:"id"`
	Title         string    `bson:"title"`
	Summary       string    `bson:"summary"`
	Content       string    `bson:"content"`
	ContentMode   string    `bson:"contentMode"`
	Thumbnail     string    `bson:"thumbnail"`
	Source        string    `bson:"source"`
	PublishedAt   time.Time `bson:"publishedAt"`
	PublishedDate string    `bson:"publishedDate"`
	UpdatedDate   string    `bson:"updatedDate"`
	Category      *struct {
		ID   string `bson:"id"`
		Name string `bson:"name"`
	} `bson:"category"`
	Topics []struct {
		ID   string `bson:"id"`
		Name string `bson:"name"`
	} `bson:"topics"`
	TopicIDs         []string  `bson:"topicIds"`
	ReadingTimeMin   int       `bson:"readingTimeMin"`
	ContentUpdatedAt time.Time `bson:"contentUpdatedAt"`
	UpdatedAt        time.Time `bson:"updatedAt"`
}

type adminContentPostGroupAggregateDocument struct {
	ID       string                     `bson:"id"`
	Source   string                     `bson:"source"`
	Variants []adminContentPostDocument `bson:"variants"`
}

type adminContentTopicAggregateVariantDocument struct {
	Locale    string    `bson:"locale"`
	ID        string    `bson:"id"`
	Name      string    `bson:"name"`
	Color     string    `bson:"color"`
	Link      string    `bson:"link"`
	UpdatedAt time.Time `bson:"updatedAt"`
}

type adminContentTopicGroupAggregateDocument struct {
	ID       string                                      `bson:"id"`
	Variants []adminContentTopicAggregateVariantDocument `bson:"variants"`
}

type adminContentCategoryAggregateVariantDocument struct {
	Locale    string    `bson:"locale"`
	ID        string    `bson:"id"`
	Name      string    `bson:"name"`
	Color     string    `bson:"color"`
	Icon      string    `bson:"icon"`
	Link      string    `bson:"link"`
	UpdatedAt time.Time `bson:"updatedAt"`
}

type adminContentCategoryGroupAggregateDocument struct {
	ID       string                                         `bson:"id"`
	Variants []adminContentCategoryAggregateVariantDocument `bson:"variants"`
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
		PublishedAt:      doc.PublishedAt,
		PublishedDate:    strings.TrimSpace(doc.PublishedDate),
		UpdatedDate:      strings.TrimSpace(doc.UpdatedDate),
		CategoryID:       categoryID,
		CategoryName:     categoryName,
		TopicIDs:         topicIDs,
		TopicNames:       topicNames,
		ReadingTimeMin:   doc.ReadingTimeMin,
		ContentUpdatedAt: doc.ContentUpdatedAt,
		UpdatedAt:        doc.UpdatedAt,
	}
}

func mapAdminContentPostGroupAggregateDocument(
	doc adminContentPostGroupAggregateDocument,
	preferredLocale string,
) (domain.AdminContentPostGroupRecord, bool) {
	group := domain.AdminContentPostGroupRecord{
		ID:     strings.TrimSpace(strings.ToLower(doc.ID)),
		Source: strings.TrimSpace(strings.ToLower(doc.Source)),
	}

	for _, variant := range doc.Variants {
		mapped := mapAdminContentPostDocument(variant)
		switch mapped.Locale {
		case adminContentLocaleEN:
			if group.EN == nil {
				group.EN = &mapped
			}
		case adminContentLocaleTR:
			if group.TR == nil {
				group.TR = &mapped
			}
		}
	}

	assignAdminContentPreferredPost(&group, preferredLocale)
	if strings.TrimSpace(group.Preferred.ID) == "" {
		return domain.AdminContentPostGroupRecord{}, false
	}

	return group, true
}

func mapAdminContentTopicGroupAggregateDocument(
	doc adminContentTopicGroupAggregateDocument,
	preferredLocale string,
) (domain.AdminContentTopicGroupRecord, bool) {
	group := domain.AdminContentTopicGroupRecord{ID: strings.TrimSpace(strings.ToLower(doc.ID))}

	for _, variant := range doc.Variants {
		mapped := domain.AdminContentTopicRecord{
			Locale:    strings.TrimSpace(strings.ToLower(variant.Locale)),
			ID:        strings.TrimSpace(strings.ToLower(variant.ID)),
			Name:      strings.TrimSpace(variant.Name),
			Color:     strings.TrimSpace(strings.ToLower(variant.Color)),
			Link:      strings.TrimSpace(variant.Link),
			UpdatedAt: variant.UpdatedAt,
		}
		switch mapped.Locale {
		case adminContentLocaleEN:
			if group.EN == nil {
				group.EN = &mapped
			}
		case adminContentLocaleTR:
			if group.TR == nil {
				group.TR = &mapped
			}
		}
	}

	assignAdminContentPreferredTopic(&group, preferredLocale)
	if strings.TrimSpace(group.Preferred.ID) == "" {
		return domain.AdminContentTopicGroupRecord{}, false
	}

	return group, true
}

func mapAdminContentCategoryGroupAggregateDocument(
	doc adminContentCategoryGroupAggregateDocument,
	preferredLocale string,
) (domain.AdminContentCategoryGroupRecord, bool) {
	group := domain.AdminContentCategoryGroupRecord{ID: strings.TrimSpace(strings.ToLower(doc.ID))}

	for _, variant := range doc.Variants {
		mapped := domain.AdminContentCategoryRecord{
			Locale:    strings.TrimSpace(strings.ToLower(variant.Locale)),
			ID:        strings.TrimSpace(strings.ToLower(variant.ID)),
			Name:      strings.TrimSpace(variant.Name),
			Color:     strings.TrimSpace(strings.ToLower(variant.Color)),
			Icon:      strings.TrimSpace(variant.Icon),
			Link:      strings.TrimSpace(variant.Link),
			UpdatedAt: variant.UpdatedAt,
		}
		switch mapped.Locale {
		case adminContentLocaleEN:
			if group.EN == nil {
				group.EN = &mapped
			}
		case adminContentLocaleTR:
			if group.TR == nil {
				group.TR = &mapped
			}
		}
	}

	assignAdminContentPreferredCategory(&group, preferredLocale)
	if strings.TrimSpace(group.Preferred.ID) == "" {
		return domain.AdminContentCategoryGroupRecord{}, false
	}

	return group, true
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

func buildAdminContentPostGroupPipeline(filter domain.AdminContentPostFilter) mongo.Pipeline {
	query := buildAdminContentPostFilter(filter)

	return mongo.Pipeline{
		bson.D{{Key: "$match", Value: query}},
		bson.D{{Key: "$project", Value: bson.M{
			"locale":         1,
			"id":             1,
			"title":          1,
			"summary":        1,
			"thumbnail":      1,
			"source":         1,
			"publishedAt":    1,
			"publishedDate":  1,
			"updatedDate":    1,
			"category":       1,
			"topics":         1,
			"topicIds":       1,
			"readingTimeMin": 1,
			"updatedAt":      1,
			"sortPublishedAt": bson.M{
				"$ifNull": bson.A{
					"$publishedAt",
					bson.M{
						"$dateFromString": bson.M{
							"dateString": "$publishedDate",
							"format":     "%Y-%m-%d",
							"onError":    nil,
							"onNull":     nil,
						},
					},
				},
			},
		}}},
		bson.D{{Key: "$sort", Value: bson.D{
			{Key: "sortPublishedAt", Value: -1},
			{Key: "id", Value: 1},
			{Key: "source", Value: 1},
			{Key: "locale", Value: 1},
		}}},
		bson.D{{Key: "$group", Value: bson.M{
			"_id": bson.M{
				"id":     "$id",
				"source": "$source",
			},
			"id":              bson.M{"$first": "$id"},
			"source":          bson.M{"$first": "$source"},
			"sortPublishedAt": bson.M{"$first": "$sortPublishedAt"},
			"variants": bson.M{"$push": bson.M{
				"locale":         "$locale",
				"id":             "$id",
				"title":          "$title",
				"summary":        "$summary",
				"thumbnail":      "$thumbnail",
				"source":         "$source",
				"publishedAt":    "$publishedAt",
				"publishedDate":  "$publishedDate",
				"updatedDate":    "$updatedDate",
				"category":       "$category",
				"topics":         "$topics",
				"topicIds":       "$topicIds",
				"readingTimeMin": "$readingTimeMin",
				"updatedAt":      "$updatedAt",
			}},
		}}},
		bson.D{{Key: "$sort", Value: bson.D{
			{Key: "sortPublishedAt", Value: -1},
			{Key: "id", Value: 1},
			{Key: "source", Value: 1},
		}}},
		bson.D{{Key: "$project", Value: bson.M{
			"_id":      0,
			"id":       1,
			"source":   1,
			"variants": 1,
		}}},
	}
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

func buildAdminContentTopicGroupPipeline(filter domain.AdminContentTaxonomyFilter) mongo.Pipeline {
	query := buildAdminContentTopicFilter(filter)
	sortName := buildAdminContentPreferredNameExpression(strings.TrimSpace(strings.ToLower(filter.PreferredLocale)))

	return mongo.Pipeline{
		bson.D{{Key: "$match", Value: query}},
		bson.D{{Key: "$group", Value: bson.M{
			"_id": "$id",
			"id":  bson.M{"$first": "$id"},
			"variants": bson.M{"$push": bson.M{
				"locale":    "$locale",
				"id":        "$id",
				"name":      "$name",
				"color":     "$color",
				"link":      "$link",
				"updatedAt": "$updatedAt",
			}},
			"enName": bson.M{"$max": bson.M{
				"$cond": bson.A{
					bson.M{"$eq": bson.A{"$locale", adminContentLocaleEN}},
					"$name",
					"",
				},
			}},
			"trName": bson.M{"$max": bson.M{
				"$cond": bson.A{
					bson.M{"$eq": bson.A{"$locale", adminContentLocaleTR}},
					"$name",
					"",
				},
			}},
		}}},
		bson.D{{Key: "$addFields", Value: bson.M{"sortName": sortName}}},
		bson.D{{Key: "$sort", Value: bson.D{
			{Key: "sortName", Value: 1},
			{Key: "id", Value: 1},
		}}},
		bson.D{{Key: "$project", Value: bson.M{
			"_id":      0,
			"id":       1,
			"variants": 1,
		}}},
	}
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

func buildAdminContentCategoryGroupPipeline(filter domain.AdminContentTaxonomyFilter) mongo.Pipeline {
	query := buildAdminContentCategoryFilter(filter)
	sortName := buildAdminContentPreferredNameExpression(strings.TrimSpace(strings.ToLower(filter.PreferredLocale)))

	return mongo.Pipeline{
		bson.D{{Key: "$match", Value: query}},
		bson.D{{Key: "$group", Value: bson.M{
			"_id": "$id",
			"id":  bson.M{"$first": "$id"},
			"variants": bson.M{"$push": bson.M{
				"locale":    "$locale",
				"id":        "$id",
				"name":      "$name",
				"color":     "$color",
				"icon":      "$icon",
				"link":      "$link",
				"updatedAt": "$updatedAt",
			}},
			"enName": bson.M{"$max": bson.M{
				"$cond": bson.A{
					bson.M{"$eq": bson.A{"$locale", adminContentLocaleEN}},
					"$name",
					"",
				},
			}},
			"trName": bson.M{"$max": bson.M{
				"$cond": bson.A{
					bson.M{"$eq": bson.A{"$locale", adminContentLocaleTR}},
					"$name",
					"",
				},
			}},
		}}},
		bson.D{{Key: "$addFields", Value: bson.M{"sortName": sortName}}},
		bson.D{{Key: "$sort", Value: bson.D{
			{Key: "sortName", Value: 1},
			{Key: "id", Value: 1},
		}}},
		bson.D{{Key: "$project", Value: bson.M{
			"_id":      0,
			"id":       1,
			"variants": 1,
		}}},
	}
}

func buildAdminContentPreferredNameExpression(preferredLocale string) bson.M {
	if preferredLocale == adminContentLocaleTR {
		return bson.M{
			"$cond": bson.A{
				bson.M{"$ne": bson.A{"$trName", ""}},
				"$trName",
				"$enName",
			},
		}
	}

	return bson.M{
		"$cond": bson.A{
			bson.M{"$ne": bson.A{"$enName", ""}},
			"$enName",
			"$trName",
		},
	}
}

func resolveAdminContentPagination(page, size *int, total int) (int, int, int64) {
	resolvedPage := 1
	resolvedSize := total
	if resolvedSize <= 0 {
		resolvedSize = 1
	}

	if size != nil && *size > 0 {
		resolvedSize = *size
	}
	if page != nil && *page > 0 {
		resolvedPage = *page
	}

	if total == 0 {
		return 1, resolvedSize, 0
	}

	totalPages := max(1, (total+resolvedSize-1)/resolvedSize)
	if resolvedPage > totalPages {
		resolvedPage = totalPages
	}

	return resolvedPage, resolvedSize, int64((resolvedPage - 1) * resolvedSize)
}

func aggregateAdminContentTotal(
	ctx context.Context,
	collection *mongo.Collection,
	basePipeline mongo.Pipeline,
) (int, error) {
	countPipeline := append(mongo.Pipeline{}, basePipeline...)
	countPipeline = append(countPipeline, bson.D{{Key: "$count", Value: "total"}})

	cursor, err := collection.Aggregate(ctx, countPipeline)
	if err != nil {
		return 0, err
	}
	defer func() {
		_ = cursor.Close(ctx)
	}()

	var countDoc struct {
		Total int `bson:"total"`
	}
	if cursor.Next(ctx) {
		if decodeErr := cursor.Decode(&countDoc); decodeErr != nil {
			return 0, decodeErr
		}
	}
	if err := cursor.Err(); err != nil {
		return 0, err
	}

	return countDoc.Total, nil
}

func assignAdminContentPreferredPost(group *domain.AdminContentPostGroupRecord, preferredLocale string) {
	if group == nil {
		return
	}

	if preferredLocale == adminContentLocaleTR {
		if group.TR != nil {
			group.Preferred = *group.TR
			return
		}
		if group.EN != nil {
			group.Preferred = *group.EN
			return
		}
	}

	if group.EN != nil {
		group.Preferred = *group.EN
		return
	}
	if group.TR != nil {
		group.Preferred = *group.TR
	}
}

func assignAdminContentPreferredTopic(group *domain.AdminContentTopicGroupRecord, preferredLocale string) {
	if group == nil {
		return
	}

	if preferredLocale == adminContentLocaleTR {
		if group.TR != nil {
			group.Preferred = *group.TR
			return
		}
		if group.EN != nil {
			group.Preferred = *group.EN
			return
		}
	}

	if group.EN != nil {
		group.Preferred = *group.EN
		return
	}
	if group.TR != nil {
		group.Preferred = *group.TR
	}
}

func assignAdminContentPreferredCategory(group *domain.AdminContentCategoryGroupRecord, preferredLocale string) {
	if group == nil {
		return
	}

	if preferredLocale == adminContentLocaleTR {
		if group.TR != nil {
			group.Preferred = *group.TR
			return
		}
		if group.EN != nil {
			group.Preferred = *group.EN
			return
		}
	}

	if group.EN != nil {
		group.Preferred = *group.EN
		return
	}
	if group.TR != nil {
		group.Preferred = *group.TR
	}
}
