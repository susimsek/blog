package repository

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"suaybsimsek.com/blog-api/internal/domain"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

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
			"locale":                    resolvedLocale,
			adminContentCategoryIDField: resolvedCategoryID,
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
