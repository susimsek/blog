package repository

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"suaybsimsek.com/blog-api/internal/domain"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

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
		bson.D{{Key: mongoStageLimit, Value: resolvedSize}},
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
				"locale":           1,
				"id":               1,
				"title":            1,
				"summary":          1,
				"thumbnail":        1,
				"source":           1,
				"publishedAt":      1,
				"publishedDate":    1,
				"updatedDate":      1,
				"category":         1,
				"topics":           1,
				"topicIds":         1,
				"readingTimeMin":   1,
				"status":           1,
				"scheduledAt":      1,
				"revisionCount":    1,
				"latestRevisionAt": 1,
				"updatedAt":        1,
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
			"status":           1,
			"scheduledAt":      1,
			"contentUpdatedAt": 1,
			"revisionCount":    1,
			"latestRevisionAt": 1,
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

func (*adminContentMongoRepository) ListPostRevisions(
	ctx context.Context,
	locale string,
	postID string,
	page int,
	size int,
) (*domain.AdminContentPostRevisionListResult, error) {
	revisionsCollection, err := getPostRevisionsCollection()
	if err != nil {
		return nil, fmt.Errorf(adminContentRepositoryUnavailableFormat, ErrAdminContentRepositoryUnavailable, err)
	}

	filter := bson.M{
		"locale": strings.TrimSpace(strings.ToLower(locale)),
		"postId": strings.TrimSpace(strings.ToLower(postID)),
	}

	total64, err := revisionsCollection.CountDocuments(ctx, filter)
	if err != nil {
		return nil, err
	}
	total := int(total64)
	resolvedPage, resolvedSize, skip := resolveAdminContentPagination(&page, &size, total)
	if total == 0 {
		return &domain.AdminContentPostRevisionListResult{
			Items: []domain.AdminContentPostRevisionRecord{},
			Total: 0,
			Page:  resolvedPage,
			Size:  resolvedSize,
		}, nil
	}

	cursor, err := revisionsCollection.Find(
		ctx,
		filter,
		options.Find().
			SetSort(bson.D{{Key: "revisionNumber", Value: -1}, {Key: "createdAt", Value: -1}}).
			SetSkip(skip).
			SetLimit(int64(resolvedSize)),
	)
	if err != nil {
		return nil, err
	}
	defer func() {
		_ = cursor.Close(ctx)
	}()

	items := make([]domain.AdminContentPostRevisionRecord, 0, resolvedSize)
	for cursor.Next(ctx) {
		var doc adminContentPostRevisionDocument
		if decodeErr := cursor.Decode(&doc); decodeErr != nil {
			return nil, decodeErr
		}
		items = append(items, mapAdminContentPostRevisionDocument(doc))
	}
	if err := cursor.Err(); err != nil {
		return nil, err
	}

	return &domain.AdminContentPostRevisionListResult{
		Items: items,
		Total: total,
		Page:  resolvedPage,
		Size:  resolvedSize,
	}, nil
}

func (*adminContentMongoRepository) FindPostRevisionByID(
	ctx context.Context,
	locale string,
	postID string,
	revisionID string,
) (*domain.AdminContentPostRevisionRecord, error) {
	revisionsCollection, err := getPostRevisionsCollection()
	if err != nil {
		return nil, fmt.Errorf(adminContentRepositoryUnavailableFormat, ErrAdminContentRepositoryUnavailable, err)
	}

	var doc adminContentPostRevisionDocument
	err = revisionsCollection.FindOne(
		ctx,
		bson.M{
			"id":     strings.TrimSpace(revisionID),
			"locale": strings.TrimSpace(strings.ToLower(locale)),
			"postId": strings.TrimSpace(strings.ToLower(postID)),
		},
	).Decode(&doc)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	mapped := mapAdminContentPostRevisionDocument(doc)
	return &mapped, nil
}

func (*adminContentMongoRepository) CreatePostRevision(
	ctx context.Context,
	record domain.AdminContentPostRecord,
	revisionNumber int,
	now time.Time,
) (*domain.AdminContentPostRevisionRecord, error) {
	revisionsCollection, err := getPostRevisionsCollection()
	if err != nil {
		return nil, fmt.Errorf(adminContentRepositoryUnavailableFormat, ErrAdminContentRepositoryUnavailable, err)
	}

	resolvedNow := now.UTC()
	if resolvedNow.IsZero() {
		resolvedNow = time.Now().UTC()
	}
	if revisionNumber <= 0 {
		revisionNumber = max(record.RevisionCount, 0) + 1
	}

	revisionID := primitive.NewObjectID().Hex()
	document := buildAdminContentPostRevisionDocument(record, revisionID, revisionNumber, resolvedNow)
	if _, err := revisionsCollection.InsertOne(ctx, document); err != nil {
		return nil, err
	}

	mapped := mapAdminContentPostRevisionDocument(document)
	return &mapped, nil
}

func (*adminContentMongoRepository) UpdatePostMetadata(
	ctx context.Context,
	locale string,
	postID string,
	fields domain.AdminContentPostMetadataFields,
	category *domain.AdminContentCategoryRecord,
	topics []domain.AdminContentTopicRecord,
	revisionStamp *domain.AdminContentPostRevisionStamp,
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

	setFields := bson.M{
		"title":         strings.TrimSpace(fields.Title),
		"summary":       strings.TrimSpace(fields.Summary),
		"thumbnail":     strings.TrimSpace(fields.Thumbnail),
		"publishedDate": strings.TrimSpace(fields.PublishedDate),
		"updatedDate":   strings.TrimSpace(fields.UpdatedDate),
		"category":      categoryValue,
		"topics":        topicValues,
		"topicIds":      topicIDs,
		"status":        strings.TrimSpace(strings.ToLower(fields.Status)),
		"scheduledAt":   zeroTimeToNil(fields.ScheduledAt),
		"updatedAt":     resolvedNow,
	}
	if revisionStamp != nil && revisionStamp.Number > 0 {
		setFields["revisionCount"] = revisionStamp.Number
	}
	if revisionStamp != nil && !revisionStamp.CreatedAt.IsZero() {
		setFields["latestRevisionAt"] = revisionStamp.CreatedAt.UTC()
	}

	var updated adminContentPostDocument
	err = postsCollection.FindOneAndUpdate(
		ctx,
		bson.M{
			"locale": strings.TrimSpace(strings.ToLower(locale)),
			"id":     strings.TrimSpace(strings.ToLower(postID)),
		},
		bson.M{
			"$set": setFields,
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
				"readingTimeMin":   1,
				"status":           1,
				"scheduledAt":      1,
				"contentUpdatedAt": 1,
				"revisionCount":    1,
				"latestRevisionAt": 1,
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
	revisionStamp *domain.AdminContentPostRevisionStamp,
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

	setFields := bson.M{
		"content":          content,
		"contentMode":      "admin",
		"contentUpdatedAt": resolvedNow,
		"updatedAt":        resolvedNow,
	}
	if revisionStamp != nil && revisionStamp.Number > 0 {
		setFields["revisionCount"] = revisionStamp.Number
	}
	if revisionStamp != nil && !revisionStamp.CreatedAt.IsZero() {
		setFields["latestRevisionAt"] = revisionStamp.CreatedAt.UTC()
	}

	var updated adminContentPostDocument
	err = postsCollection.FindOneAndUpdate(
		ctx,
		bson.M{
			"locale": strings.TrimSpace(strings.ToLower(locale)),
			"id":     strings.TrimSpace(strings.ToLower(postID)),
		},
		bson.M{
			"$set": setFields,
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
				"readingTimeMin":   1,
				"status":           1,
				"scheduledAt":      1,
				"contentUpdatedAt": 1,
				"revisionCount":    1,
				"latestRevisionAt": 1,
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

func (*adminContentMongoRepository) RestorePostRevision(
	ctx context.Context,
	revision domain.AdminContentPostRevisionRecord,
	revisionStamp *domain.AdminContentPostRevisionStamp,
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

	categoryValue := adminContentCategoryDocumentFromRevision(revision)
	topicValues := adminContentTopicDocumentsFromRevision(revision)
	setFields := bson.M{
		"title":            strings.TrimSpace(revision.Title),
		"summary":          strings.TrimSpace(revision.Summary),
		"content":          revision.Content,
		"contentMode":      strings.TrimSpace(strings.ToLower(revision.ContentMode)),
		"thumbnail":        strings.TrimSpace(revision.Thumbnail),
		"publishedDate":    strings.TrimSpace(revision.PublishedDate),
		"updatedDate":      strings.TrimSpace(revision.UpdatedDate),
		"category":         categoryValue,
		"topics":           topicValues,
		"topicIds":         append([]string{}, revision.TopicIDs...),
		"readingTimeMin":   revision.ReadingTimeMin,
		"status":           strings.TrimSpace(strings.ToLower(revision.Status)),
		"scheduledAt":      zeroTimeToNil(revision.ScheduledAt),
		"contentUpdatedAt": zeroTimeToNil(revision.ContentUpdatedAt),
		"updatedAt":        resolvedNow,
	}
	if revisionStamp != nil && revisionStamp.Number > 0 {
		setFields["revisionCount"] = revisionStamp.Number
	}
	if revisionStamp != nil && !revisionStamp.CreatedAt.IsZero() {
		setFields["latestRevisionAt"] = revisionStamp.CreatedAt.UTC()
	}

	var updated adminContentPostDocument
	err = postsCollection.FindOneAndUpdate(
		ctx,
		bson.M{
			"locale": strings.TrimSpace(strings.ToLower(revision.Locale)),
			"id":     strings.TrimSpace(strings.ToLower(revision.PostID)),
		},
		bson.M{
			"$set": setFields,
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
				"readingTimeMin":   1,
				"status":           1,
				"scheduledAt":      1,
				"contentUpdatedAt": 1,
				"revisionCount":    1,
				"latestRevisionAt": 1,
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
