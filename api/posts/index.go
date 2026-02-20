package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"hash/fnv"
	"math"
	"net/http"
	"regexp"
	"sort"
	"strings"
	"sync"
	"time"
	"unicode"

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
	maxFuzzyCandidates      = 3000
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

type contentRequest struct {
	PostID string `json:"postId"`
	Action string `json:"action,omitempty"`
}

type contentResponse struct {
	Status string `json:"status"`

	Locale string `json:"locale,omitempty"`

	Posts []postRecord `json:"posts,omitempty"`
	Total int          `json:"total,omitempty"`
	Page  int          `json:"page,omitempty"`
	Size  int          `json:"size,omitempty"`
	Sort  string       `json:"sort,omitempty"`
	Query string       `json:"query,omitempty"`

	PostID        string           `json:"postId,omitempty"`
	Likes         int64            `json:"likes,omitempty"`
	LikesByPostID map[string]int64 `json:"likesByPostId,omitempty"`
	Hits          int64            `json:"hits,omitempty"`
	HitsByPostID  map[string]int64 `json:"hitsByPostId,omitempty"`
}

func writeJSON(w http.ResponseWriter, statusCode int, payload contentResponse) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(statusCode)
	_ = json.NewEncoder(w).Encode(payload)
}

func normalizePostID(value string) (string, bool) {
	normalized := strings.ToLower(strings.TrimSpace(value))
	if !postIDPattern.MatchString(normalized) {
		return "", false
	}
	return normalized, true
}

func parseBatchPostIDs(raw string) ([]string, bool) {
	if strings.TrimSpace(raw) == "" {
		return nil, false
	}

	parts := strings.Split(raw, ",")
	seen := make(map[string]struct{}, len(parts))
	postIDs := make([]string, 0, len(parts))

	for _, part := range parts {
		postID, ok := normalizePostID(part)
		if !ok {
			return nil, false
		}

		if _, exists := seen[postID]; exists {
			continue
		}

		seen[postID] = struct{}{}
		postIDs = append(postIDs, postID)
	}

	if len(postIDs) == 0 || len(postIDs) > maxBatchPostIDs {
		return nil, false
	}

	return postIDs, true
}

func parseOptionalPostIDs(raw string, maxCount int) ([]string, bool) {
	if strings.TrimSpace(raw) == "" {
		return nil, true
	}

	parts := strings.Split(raw, ",")
	seen := make(map[string]struct{}, len(parts))
	postIDs := make([]string, 0, len(parts))

	for _, part := range parts {
		postID, ok := normalizePostID(part)
		if !ok {
			return nil, false
		}

		if _, exists := seen[postID]; exists {
			continue
		}

		seen[postID] = struct{}{}
		postIDs = append(postIDs, postID)
	}

	if maxCount > 0 && len(postIDs) > maxCount {
		return nil, false
	}

	return postIDs, true
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

func parseDateBoundary(value string, endOfDay bool) (time.Time, bool) {
	raw := strings.TrimSpace(value)
	if raw == "" {
		return time.Time{}, false
	}

	if parsed, err := time.Parse(time.RFC3339, raw); err == nil {
		return parsed.UTC(), true
	}

	if parsed, err := time.Parse("2006-01-02", raw); err == nil {
		if endOfDay {
			parsed = time.Date(parsed.Year(), parsed.Month(), parsed.Day(), 23, 59, 59, int(time.Second-time.Nanosecond), time.UTC)
		} else {
			parsed = time.Date(parsed.Year(), parsed.Month(), parsed.Day(), 0, 0, 0, 0, time.UTC)
		}
		return parsed, true
	}

	if parsed, err := time.Parse("2006-01-02T15:04:05", raw); err == nil {
		return parsed.UTC(), true
	}

	return time.Time{}, false
}

func parsePositiveInt(value string, fallback int, max int) int {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return fallback
	}

	parsed := 0
	for _, char := range trimmed {
		if char < '0' || char > '9' {
			return fallback
		}
		parsed = parsed*10 + int(char-'0')
		if max > 0 && parsed > max {
			return max
		}
	}

	if parsed <= 0 {
		return fallback
	}
	if max > 0 && parsed > max {
		return max
	}
	return parsed
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

func tokenizeSearchValue(value string) []string {
	normalized := strings.ToLower(strings.TrimSpace(value))
	if normalized == "" {
		return nil
	}

	tokens := strings.FieldsFunc(normalized, func(char rune) bool {
		return !unicode.IsLetter(char) && !unicode.IsDigit(char)
	})
	if len(tokens) == 0 {
		return nil
	}

	seen := make(map[string]struct{}, len(tokens))
	result := make([]string, 0, len(tokens))
	for _, token := range tokens {
		if token == "" {
			continue
		}
		if _, exists := seen[token]; exists {
			continue
		}
		seen[token] = struct{}{}
		result = append(result, token)
	}
	return result
}

func levenshteinDistance(left string, right string) int {
	leftRunes := []rune(left)
	rightRunes := []rune(right)

	if len(leftRunes) == 0 {
		return len(rightRunes)
	}
	if len(rightRunes) == 0 {
		return len(leftRunes)
	}

	previous := make([]int, len(rightRunes)+1)
	for j := 0; j <= len(rightRunes); j++ {
		previous[j] = j
	}

	for i := 1; i <= len(leftRunes); i++ {
		current := make([]int, len(rightRunes)+1)
		current[0] = i
		for j := 1; j <= len(rightRunes); j++ {
			cost := 0
			if leftRunes[i-1] != rightRunes[j-1] {
				cost = 1
			}

			insertCost := current[j-1] + 1
			deleteCost := previous[j] + 1
			replaceCost := previous[j-1] + cost
			current[j] = minInt(insertCost, deleteCost, replaceCost)
		}
		previous = current
	}

	return previous[len(rightRunes)]
}

func minInt(values ...int) int {
	if len(values) == 0 {
		return 0
	}
	result := values[0]
	for _, value := range values[1:] {
		if value < result {
			result = value
		}
	}
	return result
}

func fuzzyTokenScore(queryToken string, candidateToken string) float64 {
	if queryToken == candidateToken {
		return 1
	}

	if strings.Contains(candidateToken, queryToken) || strings.Contains(queryToken, candidateToken) {
		return 0.95
	}

	queryLength := len([]rune(queryToken))
	candidateLength := len([]rune(candidateToken))
	if queryLength == 0 || candidateLength == 0 {
		return 0
	}

	distance := levenshteinDistance(queryToken, candidateToken)
	maxLength := maxInt(queryLength, candidateLength)
	score := 1 - (float64(distance) / float64(maxLength))
	if score < 0 {
		return 0
	}
	return score
}

func maxInt(left int, right int) int {
	if left > right {
		return left
	}
	return right
}

func fuzzySearchTextScore(searchText string, query string) float64 {
	queryTokens := tokenizeSearchValue(query)
	if len(queryTokens) == 0 {
		return 0
	}

	searchTokens := tokenizeSearchValue(searchText)
	if len(searchTokens) == 0 {
		return 0
	}

	totalScore := 0.0
	strongMatches := 0

	for _, queryToken := range queryTokens {
		best := 0.0
		for _, searchToken := range searchTokens {
			score := fuzzyTokenScore(queryToken, searchToken)
			if score > best {
				best = score
			}
		}
		if best >= 0.7 {
			strongMatches++
		}
		totalScore += best
	}

	average := totalScore / float64(len(queryTokens))
	coverage := float64(strongMatches) / float64(len(queryTokens))
	score := average*0.8 + coverage*0.2

	normalizedSearchText := strings.ToLower(strings.TrimSpace(searchText))
	normalizedQuery := strings.ToLower(strings.TrimSpace(query))
	if normalizedSearchText != "" && normalizedQuery != "" && strings.Contains(normalizedSearchText, normalizedQuery) {
		score += 0.15
	}

	if score > 1 {
		return 1
	}
	if score < 0 {
		return 0
	}
	return score
}

func fuzzyScoreThreshold(query string) float64 {
	tokens := tokenizeSearchValue(query)
	if len(tokens) == 0 {
		return 1
	}

	longestTokenLength := 0
	for _, token := range tokens {
		tokenLength := len([]rune(token))
		if tokenLength > longestTokenLength {
			longestTokenLength = tokenLength
		}
	}

	switch {
	case longestTokenLength <= 2:
		return 0.95
	case longestTokenLength <= 4:
		return 0.82
	case longestTokenLength <= 7:
		return 0.70
	default:
		return 0.62
	}
}

type scoredPost struct {
	Post  postRecord
	Score float64
}

func applyFuzzySearch(posts []postRecord, query string, sortOrder string) []postRecord {
	threshold := fuzzyScoreThreshold(query)
	scored := make([]scoredPost, 0, len(posts))

	for _, post := range posts {
		searchText := strings.TrimSpace(post.SearchText)
		if searchText == "" {
			continue
		}

		score := fuzzySearchTextScore(searchText, query)
		if score < threshold {
			continue
		}

		scored = append(scored, scoredPost{
			Post:  post,
			Score: score,
		})
	}

	sort.Slice(scored, func(left int, right int) bool {
		leftScore := scored[left].Score
		rightScore := scored[right].Score
		if leftScore != rightScore {
			return leftScore > rightScore
		}

		leftPublishedAt := scored[left].Post.PublishedAt
		rightPublishedAt := scored[right].Post.PublishedAt
		if !leftPublishedAt.Equal(rightPublishedAt) {
			if sortOrder == "asc" {
				return leftPublishedAt.Before(rightPublishedAt)
			}
			return leftPublishedAt.After(rightPublishedAt)
		}

		return scored[left].Post.ID < scored[right].Post.ID
	})

	filtered := make([]postRecord, 0, len(scored))
	for _, candidate := range scored {
		filtered = append(filtered, candidate.Post)
	}
	return filtered
}

func paginatePosts(posts []postRecord, page int, size int) ([]postRecord, int, int) {
	total := len(posts)
	if total == 0 {
		return []postRecord{}, 1, 0
	}

	totalPages := int(math.Ceil(float64(total) / float64(size)))
	if page > totalPages {
		page = totalPages
	}
	if page < 1 {
		page = 1
	}

	start := (page - 1) * size
	end := start + size
	if end > total {
		end = total
	}

	return posts[start:end], page, total
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
	sourceFilter string,
	readingTimeRange string,
	startDateRaw string,
	endDateRaw string,
	topicIDs []string,
	scopeIDs []string,
) bson.M {
	filter := bson.M{
		"locale": locale,
	}

	if len(scopeIDs) > 0 {
		filter["id"] = bson.M{"$in": scopeIDs}
	}

	if len(topicIDs) > 0 {
		filter["topicIds"] = bson.M{"$in": topicIDs}
	}

	if sourceFilter != "all" {
		filter["source"] = sourceFilter
	}

	switch strings.TrimSpace(readingTimeRange) {
	case "3-7":
		filter["readingTimeMin"] = bson.M{"$gte": 3, "$lte": 7}
	case "8-12":
		filter["readingTimeMin"] = bson.M{"$gte": 8, "$lte": 12}
	case "15+":
		filter["readingTimeMin"] = bson.M{"$gte": 15}
	}

	startDate, hasStart := parseDateBoundary(startDateRaw, false)
	endDate, hasEnd := parseDateBoundary(endDateRaw, true)
	if hasStart || hasEnd {
		dateFilter := bson.M{}
		if hasStart {
			dateFilter["$gte"] = startDate
		}
		if hasEnd {
			dateFilter["$lte"] = endDate
		}
		filter["publishedAt"] = dateFilter
	}

	return filter
}

func handleContentGet(w http.ResponseWriter, r *http.Request) {
	collection, err := getPostsCollection()
	if err != nil {
		writeJSON(w, http.StatusServiceUnavailable, contentResponse{Status: "service-unavailable"})
		return
	}

	locale := newsletter.ResolveLocale(strings.TrimSpace(r.URL.Query().Get("locale")), "")
	query := strings.TrimSpace(r.URL.Query().Get("q"))
	sortOrder := normalizeSortOrder(r.URL.Query().Get("sort"))
	sourceFilter := normalizeSource(r.URL.Query().Get("source"))
	readingTimeRange := strings.TrimSpace(r.URL.Query().Get("readingTime"))
	startDate := strings.TrimSpace(r.URL.Query().Get("startDate"))
	endDate := strings.TrimSpace(r.URL.Query().Get("endDate"))
	topicIDs, topicsOK := parseOptionalPostIDs(r.URL.Query().Get("topics"), maxScopePostIDs)
	if !topicsOK {
		writeJSON(w, http.StatusBadRequest, contentResponse{Status: "invalid-topics"})
		return
	}
	scopeIDs, scopeOK := parseOptionalPostIDs(r.URL.Query().Get("scopeIds"), maxScopePostIDs)
	if !scopeOK {
		writeJSON(w, http.StatusBadRequest, contentResponse{Status: "invalid-scope-ids"})
		return
	}

	rawPage := strings.TrimSpace(r.URL.Query().Get("page"))
	rawSize := strings.TrimSpace(r.URL.Query().Get("size"))
	hasPagination := rawPage != "" || rawSize != ""
	page := parsePositiveInt(rawPage, 1, 100000)
	size := parsePositiveInt(rawSize, defaultPageSize, maxPageSize)

	filter := buildContentFilter(
		locale,
		sourceFilter,
		readingTimeRange,
		startDate,
		endDate,
		topicIDs,
		scopeIDs,
	)

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	resolvedPage := 1
	total := 0
	queryProvided := strings.TrimSpace(query) != ""

	if queryProvided {
		posts, err := queryPosts(ctx, collection, filter, sortOrder, 0, maxFuzzyCandidates)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, contentResponse{Status: "failed"})
			return
		}

		fuzzyFiltered := applyFuzzySearch(posts, query, sortOrder)
		pagedPosts := fuzzyFiltered
		resolvedPage = 1
		total = len(fuzzyFiltered)

		if total == 0 {
			writeJSON(w, http.StatusOK, contentResponse{
				Status: "success",
				Locale: locale,
				Posts:  []postRecord{},
				Total:  0,
				Page:   1,
				Size:   size,
				Sort:   sortOrder,
				Query:  query,
			})
			return
		}

		if hasPagination {
			var resolvedTotal int
			pagedPosts, resolvedPage, resolvedTotal = paginatePosts(fuzzyFiltered, page, size)
			total = resolvedTotal
		} else {
			size = total
		}
		if size <= 0 {
			size = 1
		}

		writeJSON(w, http.StatusOK, contentResponse{
			Status:        "success",
			Locale:        locale,
			Posts:         pagedPosts,
			LikesByPostID: resolveLikesByPostID(ctx, pagedPosts),
			HitsByPostID:  resolveHitsByPostID(ctx, pagedPosts),
			Total:         total,
			Page:          resolvedPage,
			Size:          size,
			Sort:          sortOrder,
			Query:         query,
		})
		return
	}

	if hasPagination {
		total64, err := collection.CountDocuments(ctx, filter)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, contentResponse{Status: "failed"})
			return
		}
		total = int(total64)
		if total == 0 {
			writeJSON(w, http.StatusOK, contentResponse{
				Status: "success",
				Locale: locale,
				Posts:  []postRecord{},
				Total:  0,
				Page:   1,
				Size:   size,
				Sort:   sortOrder,
				Query:  query,
			})
			return
		}

		totalPages := int(math.Ceil(float64(total) / float64(size)))
		resolvedPage = page
		if resolvedPage > totalPages {
			resolvedPage = totalPages
		}
		if resolvedPage < 1 {
			resolvedPage = 1
		}
	}

	limit := int64(0)
	if hasPagination {
		limit = int64(size)
	}
	skip := int64(0)
	if hasPagination {
		skip = int64((resolvedPage - 1) * size)
	}

	posts, err := queryPosts(ctx, collection, filter, sortOrder, skip, limit)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, contentResponse{Status: "failed"})
		return
	}
	if !hasPagination {
		total = len(posts)
		resolvedPage = 1
		size = len(posts)
		if size <= 0 {
			size = 1
		}
	}

	writeJSON(w, http.StatusOK, contentResponse{
		Status:        "success",
		Locale:        locale,
		Posts:         posts,
		LikesByPostID: resolveLikesByPostID(ctx, posts),
		HitsByPostID:  resolveHitsByPostID(ctx, posts),
		Total:         total,
		Page:          resolvedPage,
		Size:          size,
		Sort:          sortOrder,
		Query:         query,
	})
}

func handleLikesGet(w http.ResponseWriter, r *http.Request) {
	collection, err := getLikesCollection()
	if err != nil {
		writeJSON(w, http.StatusServiceUnavailable, contentResponse{Status: "service-unavailable"})
		return
	}

	if strings.TrimSpace(r.URL.Query().Get("postIds")) != "" {
		postIDs, ok := parseBatchPostIDs(r.URL.Query().Get("postIds"))
		if !ok {
			writeJSON(w, http.StatusBadRequest, contentResponse{Status: "invalid-post-ids"})
			return
		}

		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		now := time.Now().UTC()
		if err := ensurePostLikesDocuments(ctx, collection, postIDs, now); err != nil {
			writeJSON(w, http.StatusInternalServerError, contentResponse{Status: "failed"})
			return
		}

		likesByPostID, err := fetchLikesByPostIDs(ctx, collection, postIDs)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, contentResponse{Status: "failed"})
			return
		}

		writeJSON(w, http.StatusOK, contentResponse{
			Status:        "success",
			LikesByPostID: likesByPostID,
		})
		return
	}

	postID, ok := normalizePostID(r.URL.Query().Get("postId"))
	if !ok {
		writeJSON(w, http.StatusBadRequest, contentResponse{Status: "invalid-post-id"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	now := time.Now().UTC()
	if err := ensurePostLikesDocuments(ctx, collection, []string{postID}, now); err != nil {
		writeJSON(w, http.StatusInternalServerError, contentResponse{Status: "failed", PostID: postID})
		return
	}

	likesByPostID, err := fetchLikesByPostIDs(ctx, collection, []string{postID})
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, contentResponse{Status: "failed", PostID: postID})
		return
	}

	writeJSON(w, http.StatusOK, contentResponse{
		Status: "success",
		PostID: postID,
		Likes:  likesByPostID[postID],
	})
}

func handleMetricIncrement(w http.ResponseWriter, r *http.Request) {
	var request contentRequest
	decoder := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<20))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&request); err != nil {
		writeJSON(w, http.StatusBadRequest, contentResponse{Status: "invalid-post-id"})
		return
	}

	postID, ok := normalizePostID(request.PostID)
	if !ok {
		writeJSON(w, http.StatusBadRequest, contentResponse{Status: "invalid-post-id"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	action := strings.ToLower(strings.TrimSpace(request.Action))
	if action == "hit" {
		collection, err := getHitsCollection()
		if err != nil {
			writeJSON(w, http.StatusServiceUnavailable, contentResponse{Status: "service-unavailable"})
			return
		}

		hits, err := incrementPostHit(ctx, collection, postID, time.Now().UTC())
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, contentResponse{Status: "failed", PostID: postID})
			return
		}

		writeJSON(w, http.StatusOK, contentResponse{
			Status: "success",
			PostID: postID,
			Hits:   hits,
		})
		return
	}

	collection, err := getLikesCollection()
	if err != nil {
		writeJSON(w, http.StatusServiceUnavailable, contentResponse{Status: "service-unavailable"})
		return
	}

	likes, err := incrementPostLike(ctx, collection, postID, time.Now().UTC())
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, contentResponse{Status: "failed", PostID: postID})
		return
	}

	writeJSON(w, http.StatusOK, contentResponse{
		Status: "success",
		PostID: postID,
		Likes:  likes,
	})
}

func Handler(w http.ResponseWriter, r *http.Request) {
	allowedOrigin, corsErr := newsletter.ResolveAllowedOriginRequired()
	if corsErr != nil {
		writeJSON(w, http.StatusInternalServerError, contentResponse{Status: "config-error"})
		return
	}

	w.Header().Set("Access-Control-Allow-Origin", allowedOrigin)
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept-Language")
	w.Header().Set("Vary", "Origin")
	w.Header().Set("Cache-Control", "no-store")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}

	switch r.Method {
	case http.MethodGet:
		if strings.TrimSpace(r.URL.Query().Get("postIds")) != "" || strings.TrimSpace(r.URL.Query().Get("postId")) != "" {
			handleLikesGet(w, r)
			return
		}
		handleContentGet(w, r)
	case http.MethodPost:
		handleMetricIncrement(w, r)
	default:
		w.Header().Set("Allow", "GET, POST, OPTIONS")
		writeJSON(w, http.StatusMethodNotAllowed, contentResponse{Status: "method-not-allowed"})
	}
}
