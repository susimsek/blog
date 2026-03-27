package repository

import (
	"context"
	"errors"
	"fmt"
	"hash/fnv"
	"regexp"
	"strings"
	"sync"
	"time"

	appconfig "suaybsimsek.com/blog-api/internal/config"
	"suaybsimsek.com/blog-api/internal/domain"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

const (
	postLikesCollectionName   = "post_likes"
	postHitsCollectionName    = "post_hits"
	postsCollectionName       = "newsletter_posts"
	topicsCollectionName      = "newsletter_topics"
	categoriesCollectionName  = "newsletter_categories"
	mediaAssetsCollectionName = "admin_media_assets"
	maxBatchPostIDs           = 60
	maxScopePostIDs           = 5000
	defaultPageSize           = 20
	maxPageSize               = 100
)

var (
	postIDPattern = regexp.MustCompile(`^[a-z0-9][a-z0-9-]{1,127}$`)

	postMongoClient  *mongo.Client
	postMongoInitErr error
	postMongoOnce    sync.Once

	postLikesIndexesOnce sync.Once
	postLikesIndexesErr  error

	postHitsIndexesOnce sync.Once
	postHitsIndexesErr  error

	postContentIndexesOnce sync.Once
	postContentIndexesErr  error

	postTopicIndexesOnce sync.Once
	postTopicIndexesErr  error

	postCategoryIndexesOnce sync.Once
	postCategoryIndexesErr  error

	postMediaAssetIndexesOnce sync.Once
	postMediaAssetIndexesErr  error
)

type (
	PostTopic    = domain.PostTopic
	PostCategory = domain.PostCategory
	PostRecord   = domain.PostRecord
)

type postFinder interface {
	Find(context.Context, any, ...*options.FindOptions) (*mongo.Cursor, error)
}

type postSingleFinder interface {
	FindOne(context.Context, any, ...*options.FindOneOptions) *mongo.SingleResult
}

type postBulkWriter interface {
	BulkWrite(context.Context, []mongo.WriteModel, ...*options.BulkWriteOptions) (*mongo.BulkWriteResult, error)
}

type postSingleUpdater interface {
	FindOneAndUpdate(context.Context, any, any, ...*options.FindOneAndUpdateOptions) *mongo.SingleResult
}

func normalizePostID(value string) (string, bool) {
	normalized := strings.ToLower(strings.TrimSpace(value))
	if !postIDPattern.MatchString(normalized) {
		return "", false
	}
	return normalized, true
}

func computeInitialLikes(postID string) int64 {
	hasher := fnv.New32a()
	_, _ = hasher.Write([]byte(postID))
	return 24 + int64(hasher.Sum32()%220)
}

func computeInitialHits(postID string) int64 {
	hasher := fnv.New32a()
	_, _ = hasher.Write([]byte(postID))
	hash := hasher.Sum32()
	likes := 24 + int64(hash%220)
	multiplier := int64(14 + (hash % 21)) // 14..34
	noise := int64(hash%900) - 220        // -220..679

	hits := likes*multiplier + 350 + noise
	return max(hits, 700)
}

func getPostMongoClient() (*mongo.Client, error) {
	postMongoOnce.Do(func() {
		databaseConfig, err := appconfig.ResolveDatabaseConfig()
		if err != nil {
			postMongoInitErr = err
			return
		}

		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		client, err := appconfig.NewMongoClient(ctx, databaseConfig, "blog-api-posts")
		if err != nil {
			postMongoInitErr = fmt.Errorf("mongodb connect failed: %w", err)
			return
		}

		postMongoClient = client
	})

	if postMongoInitErr != nil {
		return nil, postMongoInitErr
	}

	return postMongoClient, nil
}

func getPostCollection(name string) (*mongo.Collection, error) {
	databaseConfig, databaseErr := appconfig.ResolveDatabaseConfig()
	if databaseErr != nil {
		return nil, databaseErr
	}

	client, err := getPostMongoClient()
	if err != nil {
		return nil, err
	}

	return client.Database(databaseConfig.Name).Collection(name), nil
}

func ensurePostLikeIndexes(likesCollection *mongo.Collection) error {
	postLikesIndexesOnce.Do(func() {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		indexes := []mongo.IndexModel{
			{
				Keys:    bson.D{{Key: "postId", Value: 1}},
				Options: options.Index().SetName("uniq_post_likes_post_id").SetUnique(true),
			},
		}

		if _, err := likesCollection.Indexes().CreateMany(ctx, indexes); err != nil {
			postLikesIndexesErr = fmt.Errorf("post_likes index create failed: %w", err)
			return
		}
	})

	return postLikesIndexesErr
}

func ensurePostHitIndexes(hitsCollection *mongo.Collection) error {
	postHitsIndexesOnce.Do(func() {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		indexes := []mongo.IndexModel{
			{
				Keys:    bson.D{{Key: "postId", Value: 1}},
				Options: options.Index().SetName("uniq_post_hits_post_id").SetUnique(true),
			},
		}

		if _, err := hitsCollection.Indexes().CreateMany(ctx, indexes); err != nil {
			postHitsIndexesErr = fmt.Errorf("post_hits index create failed: %w", err)
			return
		}
	})

	return postHitsIndexesErr
}

func ensurePostContentIndexes(postsCollection *mongo.Collection) error {
	postContentIndexesOnce.Do(func() {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		indexes := []mongo.IndexModel{
			{
				Keys: bson.D{
					{Key: "locale", Value: 1},
					{Key: "id", Value: 1},
				},
				Options: options.Index().SetName("uniq_newsletter_post_locale_id").SetUnique(true),
			},
			{
				Keys: bson.D{
					{Key: "locale", Value: 1},
					{Key: "publishedAt", Value: -1},
				},
				Options: options.Index().SetName("idx_newsletter_post_locale_published_at"),
			},
			{
				Keys: bson.D{
					{Key: "locale", Value: 1},
					{Key: "source", Value: 1},
					{Key: "publishedAt", Value: -1},
				},
				Options: options.Index().SetName("idx_newsletter_post_locale_source_published_at"),
			},
			{
				Keys: bson.D{
					{Key: "locale", Value: 1},
					{Key: "topicIds", Value: 1},
					{Key: "publishedAt", Value: -1},
				},
				Options: options.Index().SetName("idx_newsletter_post_locale_topic_ids_published_at"),
			},
			{
				Keys: bson.D{
					{Key: "locale", Value: 1},
					{Key: "readingTimeMin", Value: 1},
				},
				Options: options.Index().SetName("idx_newsletter_post_locale_reading_time"),
			},
		}

		if _, err := postsCollection.Indexes().CreateMany(ctx, indexes); err != nil {
			postContentIndexesErr = fmt.Errorf("content index create failed: %w", err)
			return
		}
	})

	return postContentIndexesErr
}

func ensurePostTopicIndexes(topicsCollection *mongo.Collection) error {
	postTopicIndexesOnce.Do(func() {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		indexes := []mongo.IndexModel{
			{
				Keys: bson.D{
					{Key: "locale", Value: 1},
					{Key: "id", Value: 1},
				},
				Options: options.Index().SetName("uniq_newsletter_topic_locale_id").SetUnique(true),
			},
			{
				Keys: bson.D{
					{Key: "locale", Value: 1},
					{Key: "name", Value: 1},
				},
				Options: options.Index().SetName("idx_newsletter_topic_locale_name"),
			},
		}

		if _, err := topicsCollection.Indexes().CreateMany(ctx, indexes); err != nil {
			postTopicIndexesErr = fmt.Errorf("newsletter_topics index create failed: %w", err)
		}
	})

	return postTopicIndexesErr
}

func ensurePostCategoryIndexes(categoriesCollection *mongo.Collection) error {
	postCategoryIndexesOnce.Do(func() {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		indexes := []mongo.IndexModel{
			{
				Keys: bson.D{
					{Key: "locale", Value: 1},
					{Key: "id", Value: 1},
				},
				Options: options.Index().SetName("uniq_newsletter_category_locale_id").SetUnique(true),
			},
			{
				Keys: bson.D{
					{Key: "locale", Value: 1},
					{Key: "name", Value: 1},
				},
				Options: options.Index().SetName("idx_newsletter_category_locale_name"),
			},
		}

		if _, err := categoriesCollection.Indexes().CreateMany(ctx, indexes); err != nil {
			postCategoryIndexesErr = fmt.Errorf("newsletter_categories index create failed: %w", err)
		}
	})

	return postCategoryIndexesErr
}

func ensurePostMediaAssetIndexes(mediaCollection *mongo.Collection) error {
	postMediaAssetIndexesOnce.Do(func() {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		indexes := []mongo.IndexModel{
			{
				Keys:    bson.D{{Key: "id", Value: 1}},
				Options: options.Index().SetName("uniq_admin_media_asset_id").SetUnique(true),
			},
			{
				Keys:    bson.D{{Key: "digest", Value: 1}},
				Options: options.Index().SetName("uniq_admin_media_asset_digest").SetUnique(true),
			},
			{
				Keys:    bson.D{{Key: "updatedAt", Value: -1}},
				Options: options.Index().SetName("idx_admin_media_asset_updated"),
			},
			{
				Keys:    bson.D{{Key: "name", Value: 1}},
				Options: options.Index().SetName("idx_admin_media_asset_name"),
			},
		}

		if _, err := mediaCollection.Indexes().CreateMany(ctx, indexes); err != nil {
			postMediaAssetIndexesErr = fmt.Errorf("admin media asset index create failed: %w", err)
		}
	})

	return postMediaAssetIndexesErr
}

func getPostLikesCollection() (*mongo.Collection, error) {
	collection, err := getPostCollection(postLikesCollectionName)
	if err != nil {
		return nil, err
	}
	if err := ensurePostLikeIndexes(collection); err != nil {
		return nil, err
	}
	return collection, nil
}

func getPostHitsCollection() (*mongo.Collection, error) {
	collection, err := getPostCollection(postHitsCollectionName)
	if err != nil {
		return nil, err
	}
	if err := ensurePostHitIndexes(collection); err != nil {
		return nil, err
	}
	return collection, nil
}

func getPostContentCollection() (*mongo.Collection, error) {
	collection, err := getPostCollection(postsCollectionName)
	if err != nil {
		return nil, err
	}
	if err := ensurePostContentIndexes(collection); err != nil {
		return nil, err
	}
	return collection, nil
}

func getPostTopicsCollection() (*mongo.Collection, error) {
	collection, err := getPostCollection(topicsCollectionName)
	if err != nil {
		return nil, err
	}
	if err := ensurePostTopicIndexes(collection); err != nil {
		return nil, err
	}
	return collection, nil
}

func getPostCategoriesCollection() (*mongo.Collection, error) {
	collection, err := getPostCollection(categoriesCollectionName)
	if err != nil {
		return nil, err
	}
	if err := ensurePostCategoryIndexes(collection); err != nil {
		return nil, err
	}
	return collection, nil
}

func getPostMediaAssetsCollection() (*mongo.Collection, error) {
	collection, err := getPostCollection(mediaAssetsCollectionName)
	if err != nil {
		return nil, err
	}
	if err := ensurePostMediaAssetIndexes(collection); err != nil {
		return nil, err
	}
	return collection, nil
}

func ensurePostLikeDocuments(ctx context.Context, collection postBulkWriter, postIDs []string, now time.Time) error {
	if len(postIDs) == 0 {
		return nil
	}

	models := make([]mongo.WriteModel, 0, len(postIDs))
	for _, postID := range postIDs {
		models = append(models, mongo.NewUpdateOneModel().
			SetFilter(bson.M{"postId": postID}).
			SetUpdate(bson.M{
				"$setOnInsert": bson.M{
					"postId":    postID,
					"likes":     computeInitialLikes(postID),
					"seededAt":  now,
					"createdAt": now,
				},
			}).
			SetUpsert(true),
		)
	}

	_, err := collection.BulkWrite(ctx, models, options.BulkWrite().SetOrdered(false))
	return err
}

func ensurePostHitDocuments(ctx context.Context, collection postBulkWriter, postIDs []string, now time.Time) error {
	if len(postIDs) == 0 {
		return nil
	}

	models := make([]mongo.WriteModel, 0, len(postIDs))
	for _, postID := range postIDs {
		models = append(models, mongo.NewUpdateOneModel().
			SetFilter(bson.M{"postId": postID}).
			SetUpdate(bson.M{
				"$setOnInsert": bson.M{
					"postId":    postID,
					"hits":      computeInitialHits(postID),
					"seededAt":  now,
					"createdAt": now,
				},
			}).
			SetUpsert(true),
		)
	}

	_, err := collection.BulkWrite(ctx, models, options.BulkWrite().SetOrdered(false))
	return err
}

func fetchPostLikesByIDs(ctx context.Context, collection postFinder, postIDs []string) (map[string]int64, error) {
	if len(postIDs) == 0 {
		return map[string]int64{}, nil
	}

	cursor, err := collection.Find(
		ctx,
		bson.M{"postId": bson.M{"$in": postIDs}},
		options.Find().SetProjection(bson.M{"postId": 1, "likes": 1}),
	)
	if err != nil {
		return nil, err
	}
	defer func() {
		_ = cursor.Close(ctx)
	}()

	likesByPostID := make(map[string]int64, len(postIDs))
	for cursor.Next(ctx) {
		var doc struct {
			PostID string `bson:"postId"`
			Likes  int64  `bson:"likes"`
		}
		if decodeErr := cursor.Decode(&doc); decodeErr != nil {
			return nil, decodeErr
		}
		likesByPostID[doc.PostID] = doc.Likes
	}

	if err := cursor.Err(); err != nil {
		return nil, err
	}

	for _, postID := range postIDs {
		if _, exists := likesByPostID[postID]; !exists {
			likesByPostID[postID] = computeInitialLikes(postID)
		}
	}

	return likesByPostID, nil
}

func fetchPostHitsByIDs(ctx context.Context, collection postFinder, postIDs []string) (map[string]int64, error) {
	if len(postIDs) == 0 {
		return map[string]int64{}, nil
	}

	cursor, err := collection.Find(
		ctx,
		bson.M{"postId": bson.M{"$in": postIDs}},
		options.Find().SetProjection(bson.M{"postId": 1, "hits": 1}),
	)
	if err != nil {
		return nil, err
	}
	defer func() {
		_ = cursor.Close(ctx)
	}()

	hitsByPostID := make(map[string]int64, len(postIDs))
	for cursor.Next(ctx) {
		var doc struct {
			PostID string `bson:"postId"`
			Hits   int64  `bson:"hits"`
		}
		if decodeErr := cursor.Decode(&doc); decodeErr != nil {
			return nil, decodeErr
		}
		hitsByPostID[doc.PostID] = doc.Hits
	}

	if err := cursor.Err(); err != nil {
		return nil, err
	}

	for _, postID := range postIDs {
		if _, exists := hitsByPostID[postID]; !exists {
			hitsByPostID[postID] = computeInitialHits(postID)
		}
	}

	return hitsByPostID, nil
}

func incrementPostLikeValue(ctx context.Context, collection interface {
	postBulkWriter
	postSingleUpdater
}, postID string, now time.Time,
) (int64, error) {
	if err := ensurePostLikeDocuments(ctx, collection, []string{postID}, now); err != nil {
		return 0, err
	}

	var updated struct {
		Likes int64 `bson:"likes"`
	}

	err := collection.FindOneAndUpdate(
		ctx,
		bson.M{"postId": postID},
		bson.M{
			"$inc": bson.M{"likes": 1},
			"$set": bson.M{"updatedAt": now},
		},
		options.FindOneAndUpdate().
			SetReturnDocument(options.After).
			SetProjection(bson.M{"likes": 1}),
	).Decode(&updated)
	if err != nil {
		return 0, err
	}

	return updated.Likes, nil
}

func incrementPostHitValue(ctx context.Context, collection interface {
	postBulkWriter
	postSingleUpdater
}, postID string, now time.Time,
) (int64, error) {
	if err := ensurePostHitDocuments(ctx, collection, []string{postID}, now); err != nil {
		return 0, err
	}

	var updated struct {
		Hits int64 `bson:"hits"`
	}

	err := collection.FindOneAndUpdate(
		ctx,
		bson.M{"postId": postID},
		bson.M{
			"$inc": bson.M{"hits": 1},
			"$set": bson.M{"updatedAt": now},
		},
		options.FindOneAndUpdate().
			SetReturnDocument(options.After).
			SetProjection(bson.M{"hits": 1}),
	).Decode(&updated)
	if err != nil {
		return 0, err
	}

	return updated.Hits, nil
}

func normalizeSortOrder(value string) string {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "asc":
		return "asc"
	default:
		return "desc"
	}
}

func normalizeSource(source string) string {
	switch strings.ToLower(strings.TrimSpace(source)) {
	case "blog":
		return "blog"
	case "medium":
		return "medium"
	default:
		return "all"
	}
}

func normalizeOptionalString(value *string) *string {
	if value == nil {
		return nil
	}
	trimmed := strings.TrimSpace(*value)
	if trimmed == "" {
		return nil
	}
	return &trimmed
}

func normalizePostForResponse(post PostRecord) PostRecord {
	post.UpdatedDate = normalizeOptionalString(post.UpdatedDate)
	post.Thumbnail = normalizeOptionalString(post.Thumbnail)
	post.Link = normalizeOptionalString(post.Link)
	post.Source = normalizeSource(post.Source)
	if post.Source == "all" {
		post.Source = "blog"
	}

	if len(post.Topics) > 0 {
		for index := range post.Topics {
			post.Topics[index].Color = strings.ToLower(strings.TrimSpace(post.Topics[index].Color))
			post.Topics[index].Link = normalizeOptionalString(post.Topics[index].Link)
		}
	}

	if post.Category != nil {
		post.Category.ID = strings.ToLower(strings.TrimSpace(post.Category.ID))
		post.Category.Name = strings.TrimSpace(post.Category.Name)
		if post.Category.ID == "" || post.Category.Name == "" {
			post.Category = nil
		}
	}

	return post
}

func queryPostRecords(ctx context.Context, collection postFinder, filter bson.M, sortOrder string, skip, limit int64) ([]PostRecord, error) {
	sortDirection := int32(-1)
	if sortOrder == "asc" {
		sortDirection = 1
	}

	findOptions := options.Find().
		SetSort(bson.D{
			{Key: "publishedAt", Value: sortDirection},
			{Key: "id", Value: 1},
		})
	if skip > 0 {
		findOptions.SetSkip(skip)
	}
	if limit > 0 {
		findOptions.SetLimit(limit)
	}

	cursor, err := collection.Find(ctx, filter, findOptions)
	if err != nil {
		return nil, err
	}
	defer func() {
		_ = cursor.Close(ctx)
	}()

	posts := make([]PostRecord, 0)
	for cursor.Next(ctx) {
		var post PostRecord
		if decodeErr := cursor.Decode(&post); decodeErr != nil {
			return nil, decodeErr
		}
		posts = append(posts, normalizePostForResponse(post))
	}

	if err := cursor.Err(); err != nil {
		return nil, err
	}

	return posts, nil
}

func queryPostRecordByID(ctx context.Context, collection postSingleFinder, locale, postID string) (*PostRecord, error) {
	var post PostRecord
	err := collection.FindOne(ctx, bson.M{
		"locale": locale,
		"id":     postID,
	}).Decode(&post)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	normalizedPost := normalizePostForResponse(post)
	return &normalizedPost, nil
}

func queryPostRecordByIDAnyLocale(ctx context.Context, collection postSingleFinder, postID string) (*PostRecord, error) {
	var post PostRecord
	err := collection.FindOne(ctx, bson.M{
		"id": postID,
	}).Decode(&post)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	normalizedPost := normalizePostForResponse(post)
	return &normalizedPost, nil
}

func collectPostIDs(posts []PostRecord) []string {
	if len(posts) == 0 {
		return nil
	}

	postIDs := make([]string, 0, len(posts))
	for _, post := range posts {
		postID, ok := normalizePostID(post.ID)
		if !ok {
			continue
		}
		postIDs = append(postIDs, postID)
	}

	if len(postIDs) == 0 {
		return nil
	}

	return postIDs
}

func resolvePostLikesByPostID(ctx context.Context, posts []PostRecord) map[string]int64 {
	postIDs := collectPostIDs(posts)
	if len(postIDs) == 0 {
		return nil
	}

	likesCollection, err := getPostLikesCollection()
	if err != nil {
		return nil
	}

	if ensurePostLikeDocuments(ctx, likesCollection, postIDs, time.Now().UTC()) != nil {
		return nil
	}

	if likesByPostID, err := fetchPostLikesByIDs(ctx, likesCollection, postIDs); err == nil {
		return likesByPostID
	}

	return nil
}

func resolvePostHitsByPostID(ctx context.Context, posts []PostRecord) map[string]int64 {
	postIDs := collectPostIDs(posts)
	if len(postIDs) == 0 {
		return nil
	}

	hitsCollection, err := getPostHitsCollection()
	if err != nil {
		return nil
	}

	if ensurePostHitDocuments(ctx, hitsCollection, postIDs, time.Now().UTC()) != nil {
		return nil
	}

	if hitsByPostID, err := fetchPostHitsByIDs(ctx, hitsCollection, postIDs); err == nil {
		return hitsByPostID
	}

	return nil
}

func buildContentFilter(
	locale string,
	scopeIDs []string,
) bson.M {
	filter := bson.M{
		"locale": locale,
	}

	if len(scopeIDs) > 0 {
		filter["id"] = bson.M{"$in": scopeIDs}
	}

	return filter
}
