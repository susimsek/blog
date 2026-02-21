package handler

import (
	"context"
	"fmt"
	"hash/fnv"
	"regexp"
	"strings"
	"sync"
	"time"

	"suaybsimsek.com/blog-api/pkg/newsletter"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

const (
	postLikesCollectionName = "post_likes"
	postHitsCollectionName  = "post_hits"
	postsCollectionName     = "newsletter_posts"
	maxBatchPostIDs         = 60
	maxScopePostIDs         = 5000
	defaultPageSize         = 20
	maxPageSize             = 100
)

var (
	postIDPattern = regexp.MustCompile(`^[a-z0-9][a-z0-9-]{1,127}$`)

	mongoClient  *mongo.Client
	mongoInitErr error
	mongoOnce    sync.Once

	likesIndexesOnce sync.Once
	likesIndexesErr  error

	hitsIndexesOnce sync.Once
	hitsIndexesErr  error

	contentIndexesOnce sync.Once
	contentIndexesErr  error
)

type topicRecord struct {
	ID    string  `json:"id" bson:"id"`
	Name  string  `json:"name" bson:"name"`
	Color string  `json:"color" bson:"color"`
	Link  *string `json:"link,omitempty" bson:"link,omitempty"`
}

type postRecord struct {
	ID             string        `json:"id" bson:"id"`
	Title          string        `json:"title" bson:"title"`
	PublishedDate  string        `json:"publishedDate" bson:"publishedDate"`
	UpdatedDate    *string       `json:"updatedDate,omitempty" bson:"updatedDate,omitempty"`
	Summary        string        `json:"summary" bson:"summary"`
	SearchText     string        `json:"searchText" bson:"searchText"`
	Thumbnail      *string       `json:"thumbnail" bson:"thumbnail,omitempty"`
	Topics         []topicRecord `json:"topics,omitempty" bson:"topics,omitempty"`
	TopicIDs       []string      `json:"-" bson:"topicIds,omitempty"`
	ReadingTimeMin int           `json:"readingTimeMin" bson:"readingTimeMin"`
	Source         string        `json:"source,omitempty" bson:"source,omitempty"`
	Link           *string       `json:"link,omitempty" bson:"link,omitempty"`
	PublishedAt    time.Time     `json:"-" bson:"publishedAt,omitempty"`
}

type contentResponse struct {
	Status string `json:"status"`

	Locale string `json:"locale,omitempty"`

	Posts []postRecord `json:"posts,omitempty"`
	Total int          `json:"total,omitempty"`
	Page  int          `json:"page,omitempty"`
	Size  int          `json:"size,omitempty"`
	Sort  string       `json:"sort,omitempty"`

	PostID        string           `json:"postId,omitempty"`
	Likes         int64            `json:"likes,omitempty"`
	LikesByPostID map[string]int64 `json:"likesByPostId,omitempty"`
	Hits          int64            `json:"hits,omitempty"`
	HitsByPostID  map[string]int64 `json:"hitsByPostId,omitempty"`
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
	if hits < 700 {
		hits = 700
	}

	return hits
}

func getMongoClient() (*mongo.Client, error) {
	mongoOnce.Do(func() {
		uri, err := newsletter.ResolveMongoURI()
		if err != nil {
			mongoInitErr = err
			return
		}

		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		client, err := mongo.Connect(ctx, options.Client().ApplyURI(uri).SetAppName("blog-api-posts"))
		if err != nil {
			mongoInitErr = fmt.Errorf("mongodb connect failed: %w", err)
			return
		}

		mongoClient = client
	})

	if mongoInitErr != nil {
		return nil, mongoInitErr
	}

	return mongoClient, nil
}

func getCollection(name string) (*mongo.Collection, error) {
	databaseName, databaseErr := newsletter.ResolveDatabaseName()
	if databaseErr != nil {
		return nil, databaseErr
	}

	client, err := getMongoClient()
	if err != nil {
		return nil, err
	}

	return client.Database(databaseName).Collection(name), nil
}

func ensureLikeIndexes(likesCollection *mongo.Collection) error {
	likesIndexesOnce.Do(func() {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		indexes := []mongo.IndexModel{
			{
				Keys:    bson.D{{Key: "postId", Value: 1}},
				Options: options.Index().SetName("uniq_post_likes_post_id").SetUnique(true),
			},
		}

		if _, err := likesCollection.Indexes().CreateMany(ctx, indexes); err != nil {
			likesIndexesErr = fmt.Errorf("post_likes index create failed: %w", err)
			return
		}
	})

	return likesIndexesErr
}

func ensureHitIndexes(hitsCollection *mongo.Collection) error {
	hitsIndexesOnce.Do(func() {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		indexes := []mongo.IndexModel{
			{
				Keys:    bson.D{{Key: "postId", Value: 1}},
				Options: options.Index().SetName("uniq_post_hits_post_id").SetUnique(true),
			},
		}

		if _, err := hitsCollection.Indexes().CreateMany(ctx, indexes); err != nil {
			hitsIndexesErr = fmt.Errorf("post_hits index create failed: %w", err)
			return
		}
	})

	return hitsIndexesErr
}

func ensureContentIndexes(postsCollection *mongo.Collection) error {
	contentIndexesOnce.Do(func() {
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
			contentIndexesErr = fmt.Errorf("content index create failed: %w", err)
			return
		}
	})

	return contentIndexesErr
}

func getLikesCollection() (*mongo.Collection, error) {
	collection, err := getCollection(postLikesCollectionName)
	if err != nil {
		return nil, err
	}
	if err := ensureLikeIndexes(collection); err != nil {
		return nil, err
	}
	return collection, nil
}

func getHitsCollection() (*mongo.Collection, error) {
	collection, err := getCollection(postHitsCollectionName)
	if err != nil {
		return nil, err
	}
	if err := ensureHitIndexes(collection); err != nil {
		return nil, err
	}
	return collection, nil
}

func getPostsCollection() (*mongo.Collection, error) {
	collection, err := getCollection(postsCollectionName)
	if err != nil {
		return nil, err
	}
	if err := ensureContentIndexes(collection); err != nil {
		return nil, err
	}
	return collection, nil
}

func ensurePostLikesDocuments(ctx context.Context, collection *mongo.Collection, postIDs []string, now time.Time) error {
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

func ensurePostHitsDocuments(ctx context.Context, collection *mongo.Collection, postIDs []string, now time.Time) error {
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

func fetchLikesByPostIDs(ctx context.Context, collection *mongo.Collection, postIDs []string) (map[string]int64, error) {
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
	defer cursor.Close(ctx)

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

func fetchHitsByPostIDs(ctx context.Context, collection *mongo.Collection, postIDs []string) (map[string]int64, error) {
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
	defer cursor.Close(ctx)

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

func incrementPostLike(ctx context.Context, collection *mongo.Collection, postID string, now time.Time) (int64, error) {
	if err := ensurePostLikesDocuments(ctx, collection, []string{postID}, now); err != nil {
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

func incrementPostHit(ctx context.Context, collection *mongo.Collection, postID string, now time.Time) (int64, error) {
	if err := ensurePostHitsDocuments(ctx, collection, []string{postID}, now); err != nil {
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

func normalizePostForResponse(post postRecord) postRecord {
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

	return post
}

func queryPosts(
	ctx context.Context,
	collection *mongo.Collection,
	filter bson.M,
	sortOrder string,
	skip int64,
	limit int64,
) ([]postRecord, error) {
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
	defer cursor.Close(ctx)

	posts := make([]postRecord, 0)
	for cursor.Next(ctx) {
		var post postRecord
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

func queryPostByID(ctx context.Context, collection *mongo.Collection, locale string, postID string) (*postRecord, error) {
	var post postRecord
	err := collection.FindOne(ctx, bson.M{
		"locale": locale,
		"id":     postID,
	}).Decode(&post)
	if err == mongo.ErrNoDocuments {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	normalizedPost := normalizePostForResponse(post)
	return &normalizedPost, nil
}

func collectPostIDs(posts []postRecord) []string {
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

func resolveLikesByPostID(ctx context.Context, posts []postRecord) map[string]int64 {
	postIDs := collectPostIDs(posts)
	if len(postIDs) == 0 {
		return nil
	}

	likesCollection, err := getLikesCollection()
	if err != nil {
		return nil
	}

	now := time.Now().UTC()
	if err := ensurePostLikesDocuments(ctx, likesCollection, postIDs, now); err != nil {
		return nil
	}

	likesByPostID, err := fetchLikesByPostIDs(ctx, likesCollection, postIDs)
	if err != nil {
		return nil
	}

	return likesByPostID
}

func resolveHitsByPostID(ctx context.Context, posts []postRecord) map[string]int64 {
	postIDs := collectPostIDs(posts)
	if len(postIDs) == 0 {
		return nil
	}

	hitsCollection, err := getHitsCollection()
	if err != nil {
		return nil
	}

	now := time.Now().UTC()
	if err := ensurePostHitsDocuments(ctx, hitsCollection, postIDs, now); err != nil {
		return nil
	}

	hitsByPostID, err := fetchHitsByPostIDs(ctx, hitsCollection, postIDs)
	if err != nil {
		return nil
	}

	return hitsByPostID
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
