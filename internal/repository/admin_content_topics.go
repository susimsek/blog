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

func (*adminContentMongoRepository) ListTopics(ctx context.Context, locale, query string) ([]domain.AdminContentTopicRecord, error) {
	topicsCollection, err := getPostTopicsCollection()
	if err != nil {
		return nil, fmt.Errorf(adminContentRepositoryUnavailableFormat, ErrAdminContentRepositoryUnavailable, err)
	}

	filterQuery := bson.M{}
	resolvedLocale := strings.TrimSpace(strings.ToLower(locale))
	if resolvedLocale != "" {
		filterQuery["locale"] = resolvedLocale
	}

	resolvedSearchQuery := strings.TrimSpace(query)
	if resolvedSearchQuery != "" {
		filterQuery["name"] = primitive.Regex{
			Pattern: regexp.QuoteMeta(resolvedSearchQuery),
			Options: "i",
		}
	}

	cursor, err := topicsCollection.Find(
		ctx,
		filterQuery,
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
