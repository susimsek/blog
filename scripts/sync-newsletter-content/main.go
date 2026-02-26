package main

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"hash/fnv"
	"io"
	"log"
	"math"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"slices"
	"strings"
	"time"

	"suaybsimsek.com/blog-api/pkg/newsletter"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

const (
	postsCollectionName      = "newsletter_posts"
	topicsCollectionName     = "newsletter_topics"
	categoriesCollectionName = "newsletter_categories"
	postLikesCollectionName  = "post_likes"
	postHitsCollectionName   = "post_hits"
	httpTimeout              = 12 * time.Second
	sourceBlog               = "blog"
)

type siteTopic struct {
	ID    string  `json:"id"`
	Name  string  `json:"name"`
	Color string  `json:"color"`
	Link  *string `json:"link,omitempty"`
}

type siteCategory struct {
	ID    string  `json:"id"`
	Name  string  `json:"name"`
	Color string  `json:"color"`
	Link  *string `json:"link,omitempty"`
}

type sitePostCategory struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type sitePost struct {
	ID             string           `json:"id"`
	Title          string           `json:"title"`
	Category       sitePostCategory `json:"category"`
	Summary        string           `json:"summary"`
	Thumbnail      *string          `json:"thumbnail"`
	Topics         []siteTopic      `json:"topics"`
	ReadingTimeMin int              `json:"readingTimeMin"`
	PublishedDate  string           `json:"publishedDate"`
	UpdatedDate    string           `json:"updatedDate"`
	SearchText     string           `json:"searchText"`
	Source         string           `json:"source"`
	Link           *string          `json:"link,omitempty"`
}

type postSeedInput struct {
	ID             string
	PublishedAt    time.Time
	UpdatedAt      time.Time
	ReadingTimeMin int
}

func loadDotEnv(path string) {
	file, err := os.Open(path)
	if err != nil {
		return
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		parts := strings.SplitN(line, "=", 2)
		if len(parts) != 2 {
			continue
		}
		key := strings.TrimSpace(parts[0])
		value := strings.TrimSpace(parts[1])
		if key == "" {
			continue
		}
		if _, exists := os.LookupEnv(key); exists {
			continue
		}
		_ = os.Setenv(key, value)
	}
}

func resolveLocales() []string {
	raw := strings.TrimSpace(os.Getenv("NEWSLETTER_SYNC_LOCALES"))
	if raw == "" {
		return []string{newsletter.LocaleEN, newsletter.LocaleTR}
	}

	split := strings.Split(raw, ",")
	seen := map[string]struct{}{}
	locales := make([]string, 0, len(split))
	for _, value := range split {
		locale := strings.ToLower(strings.TrimSpace(value))
		if locale == "" {
			continue
		}
		if locale != newsletter.LocaleEN && locale != newsletter.LocaleTR {
			continue
		}
		if _, exists := seen[locale]; exists {
			continue
		}
		seen[locale] = struct{}{}
		locales = append(locales, locale)
	}

	if len(locales) == 0 {
		return []string{newsletter.LocaleEN, newsletter.LocaleTR}
	}
	return locales
}

func fetchJSON(requestURL string, target any) error {
	client := &http.Client{Timeout: httpTimeout}
	req, err := http.NewRequest(http.MethodGet, requestURL, nil)
	if err != nil {
		return fmt.Errorf("request create failed: %w", err)
	}
	req.Header.Set("User-Agent", "suayb-blog-content-sync/1.0")

	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("request failed: status=%d", resp.StatusCode)
	}

	body, err := io.ReadAll(io.LimitReader(resp.Body, 4<<20))
	if err != nil {
		return fmt.Errorf("response read failed: %w", err)
	}

	if err := json.Unmarshal(body, target); err != nil {
		return fmt.Errorf("response parse failed: %w", err)
	}
	return nil
}

func readJSONFile(filePath string, target any) error {
	data, err := os.ReadFile(filePath)
	if err != nil {
		return fmt.Errorf("file read failed: %w", err)
	}
	if err := json.Unmarshal(data, target); err != nil {
		return fmt.Errorf("file parse failed: %w", err)
	}
	return nil
}

func shouldUseLocalDataFallback(siteURL string) bool {
	parsed, err := url.Parse(strings.TrimSpace(siteURL))
	if err != nil {
		return false
	}
	host := strings.ToLower(strings.TrimSpace(parsed.Hostname()))
	return host == "localhost" || host == "127.0.0.1"
}

func fetchLocaleData(siteURL string, locale string, dataType string, target any) error {
	requestURL := buildDataURL(siteURL, locale, dataType)
	err := fetchJSON(requestURL, target)
	if err == nil {
		return nil
	}
	if !shouldUseLocalDataFallback(siteURL) {
		return err
	}

	localPath := filepath.Join(".", "public", "data", fmt.Sprintf("%s.%s.json", dataType, locale))
	if fallbackErr := readJSONFile(localPath, target); fallbackErr != nil {
		return fmt.Errorf("%v; fallback failed: %w", err, fallbackErr)
	}
	return nil
}

func normalizeID(raw string) string {
	return strings.ToLower(strings.TrimSpace(raw))
}

func normalizeOptionalString(raw *string) *string {
	if raw == nil {
		return nil
	}
	trimmed := strings.TrimSpace(*raw)
	if trimmed == "" {
		return nil
	}
	return &trimmed
}

func normalizeTopic(raw siteTopic) siteTopic {
	id := normalizeID(raw.ID)
	if id == "" {
		return siteTopic{}
	}

	name := strings.TrimSpace(raw.Name)
	if name == "" {
		name = id
	}

	color := strings.ToLower(strings.TrimSpace(raw.Color))
	if color == "" {
		color = "blue"
	}

	return siteTopic{
		ID:    id,
		Name:  name,
		Color: color,
		Link:  normalizeOptionalString(raw.Link),
	}
}

func normalizeCategory(raw siteCategory) siteCategory {
	id := normalizeID(raw.ID)
	if id == "" {
		return siteCategory{}
	}

	name := strings.TrimSpace(raw.Name)
	if name == "" {
		name = id
	}

	color := strings.ToLower(strings.TrimSpace(raw.Color))
	switch color {
	case "red", "green", "blue", "orange", "yellow", "purple", "gray", "brown", "pink", "cyan":
	default:
		color = "blue"
	}

	return siteCategory{
		ID:    id,
		Name:  name,
		Color: color,
		Link:  normalizeOptionalString(raw.Link),
	}
}

func normalizePostCategory(raw sitePostCategory) *sitePostCategory {
	id := normalizeID(raw.ID)
	if id == "" {
		return nil
	}

	name := strings.TrimSpace(raw.Name)
	if name == "" {
		return nil
	}

	return &sitePostCategory{
		ID:   id,
		Name: name,
	}
}

func normalizeSource(raw string) string {
	switch strings.ToLower(strings.TrimSpace(raw)) {
	case "medium":
		return "medium"
	default:
		return "blog"
	}
}

func parseDate(raw string) (time.Time, bool) {
	trimmed := strings.TrimSpace(raw)
	if trimmed == "" {
		return time.Time{}, false
	}

	layouts := []string{
		"2006-01-02",
		time.RFC3339,
		time.RFC3339Nano,
		"2006-01-02T15:04:05",
	}
	for _, layout := range layouts {
		parsed, err := time.Parse(layout, trimmed)
		if err != nil {
			continue
		}
		return parsed.UTC(), true
	}

	return time.Time{}, false
}

func stableHash(postID string) uint32 {
	hasher := fnv.New32a()
	_, _ = hasher.Write([]byte(postID))
	return hasher.Sum32()
}

func computeRealisticLikes(post postSeedInput, now time.Time) int64 {
	hash := stableHash(post.ID)

	published := post.PublishedAt
	if published.IsZero() {
		published = now.AddDate(0, -6, 0)
	}

	ageDays := int(now.Sub(published).Hours() / 24)
	if ageDays < 1 {
		ageDays = 1
	}

	reading := post.ReadingTimeMin
	if reading < 1 {
		reading = 4
	}

	ageScore := int(math.Sqrt(float64(ageDays))*8.5) + 20
	if ageScore > 420 {
		ageScore = 420
	}

	readingBoost := reading * 3
	if readingBoost > 36 {
		readingBoost = 36
	}

	noise := int(hash%71) - 25 // -25..45
	likes := ageScore + readingBoost + noise
	if likes < 12 {
		likes = 12
	}

	return int64(likes)
}

func computeRealisticHits(post postSeedInput, now time.Time) int64 {
	hash := stableHash(post.ID)

	published := post.PublishedAt
	if published.IsZero() {
		published = now.AddDate(0, -6, 0)
	}

	ageDays := int(now.Sub(published).Hours() / 24)
	if ageDays < 1 {
		ageDays = 1
	}

	reading := post.ReadingTimeMin
	if reading < 1 {
		reading = 4
	}

	likeAgeScore := int(math.Sqrt(float64(ageDays))*8.5) + 20
	if likeAgeScore > 420 {
		likeAgeScore = 420
	}

	likeReadingBoost := reading * 3
	if likeReadingBoost > 36 {
		likeReadingBoost = 36
	}

	likeNoise := int(hash%71) - 25 // -25..45
	likeEstimate := likeAgeScore + likeReadingBoost + likeNoise
	if likeEstimate < 12 {
		likeEstimate = 12
	}

	hitMultiplier := int64(16 + (hash % 17)) // 16..32
	reachNoise := int64(hash%1800) - 450     // -450..1349

	recencyBoost := int64(0)
	if ageDays < 21 {
		recencyBoost = 320 + int64(hash%640)
	}

	hits := int64(likeEstimate)*hitMultiplier + 420 + reachNoise + recencyBoost
	if hits < 700 {
		hits = 700
	}

	return hits
}

func buildDataURL(siteURL string, locale string, dataType string) string {
	return fmt.Sprintf("%s/data/%s.%s.json", strings.TrimRight(siteURL, "/"), dataType, locale)
}

func normalizeSearchText(raw string, title string, summary string, topics []siteTopic) string {
	trimmed := strings.ToLower(strings.TrimSpace(raw))
	if trimmed != "" {
		return trimmed
	}

	parts := make([]string, 0, len(topics)+2)
	if value := strings.TrimSpace(title); value != "" {
		parts = append(parts, value)
	}
	if value := strings.TrimSpace(summary); value != "" {
		parts = append(parts, value)
	}
	for _, topic := range topics {
		if topic.Name != "" {
			parts = append(parts, topic.Name)
		}
	}

	return strings.ToLower(strings.Join(parts, " "))
}

func normalizePostTopics(rawTopics []siteTopic, topicByID map[string]siteTopic) ([]bson.M, []string) {
	if len(rawTopics) == 0 {
		return []bson.M{}, []string{}
	}

	postTopics := make([]bson.M, 0, len(rawTopics))
	topicIDs := make([]string, 0, len(rawTopics))
	seen := make(map[string]struct{}, len(rawTopics))

	for _, rawTopic := range rawTopics {
		topic := normalizeTopic(rawTopic)
		if topic.ID == "" {
			continue
		}
		if existing, exists := topicByID[topic.ID]; exists {
			if topic.Name == "" {
				topic.Name = existing.Name
			}
			if topic.Color == "" {
				topic.Color = existing.Color
			}
			if topic.Link == nil {
				topic.Link = existing.Link
			}
		}
		if _, exists := seen[topic.ID]; exists {
			continue
		}
		seen[topic.ID] = struct{}{}
		topicIDs = append(topicIDs, topic.ID)

		var link any = nil
		if topic.Link != nil {
			link = *topic.Link
		}

		postTopics = append(postTopics, bson.M{
			"id":    topic.ID,
			"name":  topic.Name,
			"color": topic.Color,
			"link":  link,
		})
	}

	slices.Sort(topicIDs)
	return postTopics, topicIDs
}

func ensureIndexes(
	postsCollection *mongo.Collection,
	topicsCollection *mongo.Collection,
	categoriesCollection *mongo.Collection,
	likesCollection *mongo.Collection,
	hitsCollection *mongo.Collection,
) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	postIndexes := []mongo.IndexModel{
		{
			Keys: bson.D{
				{Key: "locale", Value: 1},
				{Key: "id", Value: 1},
			},
			Options: options.Index().
				SetName("uniq_newsletter_post_locale_id").
				SetUnique(true),
		},
		{
			Keys: bson.D{
				{Key: "locale", Value: 1},
				{Key: "publishedAt", Value: -1},
			},
			Options: options.Index().
				SetName("idx_newsletter_post_locale_published_at"),
		},
		{
			Keys: bson.D{
				{Key: "locale", Value: 1},
				{Key: "source", Value: 1},
				{Key: "publishedAt", Value: -1},
			},
			Options: options.Index().
				SetName("idx_newsletter_post_locale_source_published_at"),
		},
		{
			Keys: bson.D{
				{Key: "locale", Value: 1},
				{Key: "topicIds", Value: 1},
				{Key: "publishedAt", Value: -1},
			},
			Options: options.Index().
				SetName("idx_newsletter_post_locale_topic_ids_published_at"),
		},
		{
			Keys: bson.D{
				{Key: "locale", Value: 1},
				{Key: "readingTimeMin", Value: 1},
			},
			Options: options.Index().
				SetName("idx_newsletter_post_locale_reading_time"),
		},
	}
	if _, err := postsCollection.Indexes().CreateMany(ctx, postIndexes); err != nil {
		return fmt.Errorf("post index create failed: %w", err)
	}

	topicIndexes := []mongo.IndexModel{
		{
			Keys: bson.D{
				{Key: "locale", Value: 1},
				{Key: "id", Value: 1},
			},
			Options: options.Index().
				SetName("uniq_newsletter_topic_locale_id").
				SetUnique(true),
		},
		{
			Keys: bson.D{
				{Key: "locale", Value: 1},
				{Key: "name", Value: 1},
			},
			Options: options.Index().
				SetName("idx_newsletter_topic_locale_name"),
		},
	}
	if _, err := topicsCollection.Indexes().CreateMany(ctx, topicIndexes); err != nil {
		return fmt.Errorf("topic index create failed: %w", err)
	}

	categoryIndexes := []mongo.IndexModel{
		{
			Keys: bson.D{
				{Key: "locale", Value: 1},
				{Key: "id", Value: 1},
			},
			Options: options.Index().
				SetName("uniq_newsletter_category_locale_id").
				SetUnique(true),
		},
		{
			Keys: bson.D{
				{Key: "locale", Value: 1},
				{Key: "name", Value: 1},
			},
			Options: options.Index().
				SetName("idx_newsletter_category_locale_name"),
		},
	}
	if _, err := categoriesCollection.Indexes().CreateMany(ctx, categoryIndexes); err != nil {
		return fmt.Errorf("category index create failed: %w", err)
	}

	if _, err := likesCollection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "postId", Value: 1}},
		Options: options.Index().SetName("uniq_post_likes_post_id").SetUnique(true),
	}); err != nil {
		return fmt.Errorf("post_likes index create failed: %w", err)
	}

	if _, err := hitsCollection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "postId", Value: 1}},
		Options: options.Index().SetName("uniq_post_hits_post_id").SetUnique(true),
	}); err != nil {
		return fmt.Errorf("post_hits index create failed: %w", err)
	}

	return nil
}

func seedInitialEngagementForPost(
	ctx context.Context,
	likesCollection *mongo.Collection,
	hitsCollection *mongo.Collection,
	post postSeedInput,
	now time.Time,
) error {
	publishedDate := ""
	if !post.PublishedAt.IsZero() {
		publishedDate = post.PublishedAt.Format(time.RFC3339)
	}

	updatedDate := ""
	if !post.UpdatedAt.IsZero() {
		updatedDate = post.UpdatedAt.Format(time.RFC3339)
	}

	likes := computeRealisticLikes(post, now)
	hits := computeRealisticHits(post, now)

	if _, err := likesCollection.UpdateOne(
		ctx,
		bson.M{"postId": post.ID},
		bson.M{
			"$setOnInsert": bson.M{
				"postId":        post.ID,
				"likes":         likes,
				"seededAt":      now,
				"seedModel":     "realistic-v2",
				"publishedDate": publishedDate,
				"updatedDate":   updatedDate,
				"readingTimeMin": post.ReadingTimeMin,
				"createdAt":     now,
			},
		},
		options.Update().SetUpsert(true),
	); err != nil {
		return fmt.Errorf("likes seed failed: %w", err)
	}

	if _, err := hitsCollection.UpdateOne(
		ctx,
		bson.M{"postId": post.ID},
		bson.M{
			"$setOnInsert": bson.M{
				"postId":        post.ID,
				"hits":          hits,
				"seededAt":      now,
				"seedModel":     "realistic-v2",
				"publishedDate": publishedDate,
				"updatedDate":   updatedDate,
				"readingTimeMin": post.ReadingTimeMin,
				"createdAt":     now,
			},
		},
		options.Update().SetUpsert(true),
	); err != nil {
		return fmt.Errorf("hits seed failed: %w", err)
	}

	return nil
}

func syncLocale(
	locale string,
	siteURL string,
	postsCollection *mongo.Collection,
	topicsCollection *mongo.Collection,
	categoriesCollection *mongo.Collection,
	likesCollection *mongo.Collection,
	hitsCollection *mongo.Collection,
) (postCount int, topicCount int, categoryCount int, err error) {
	var posts []sitePost
	if err := fetchLocaleData(siteURL, locale, "posts", &posts); err != nil {
		return 0, 0, 0, fmt.Errorf("posts fetch failed: %w", err)
	}

	var topics []siteTopic
	if err := fetchLocaleData(siteURL, locale, "topics", &topics); err != nil {
		return 0, 0, 0, fmt.Errorf("topics fetch failed: %w", err)
	}

	var categories []siteCategory
	if err := fetchLocaleData(siteURL, locale, "categories", &categories); err != nil {
		return 0, 0, 0, fmt.Errorf("categories fetch failed: %w", err)
	}

	now := time.Now().UTC()
	siteTopicByID := make(map[string]siteTopic, len(topics))
	topicByID := make(map[string]siteTopic, len(topics))
	categoryByID := make(map[string]siteCategory, len(categories))
	activeTopicIDs := make(map[string]struct{}, len(topics))
	activeCategoryIDs := make(map[string]struct{}, len(categories))
	activePostIDs := make(map[string]struct{}, len(posts))

	for _, raw := range topics {
		topic := normalizeTopic(raw)
		if topic.ID == "" {
			continue
		}
		siteTopicByID[topic.ID] = topic
		topicByID[topic.ID] = topic
		activeTopicIDs[topic.ID] = struct{}{}
	}
	for _, raw := range categories {
		category := normalizeCategory(raw)
		if category.ID == "" {
			continue
		}
		categoryByID[category.ID] = category
		activeCategoryIDs[category.ID] = struct{}{}
	}

	ctx, cancel := context.WithTimeout(context.Background(), 70*time.Second)
	defer cancel()

	for _, topic := range topicByID {
		if topic.ID == "" {
			continue
		}

		var link any = nil
		if topic.Link != nil {
			link = *topic.Link
		}

		_, err := topicsCollection.UpdateOne(
			ctx,
			bson.M{"locale": locale, "id": topic.ID},
			bson.M{
				"$set": bson.M{
					"locale":    locale,
					"id":        topic.ID,
					"name":      topic.Name,
					"color":     topic.Color,
					"link":      link,
					"updatedAt": now,
					"syncedAt":  now,
				},
				"$setOnInsert": bson.M{
					"createdAt": now,
				},
			},
			options.Update().SetUpsert(true),
		)
		if err != nil {
			return 0, 0, 0, fmt.Errorf("topic upsert failed: %w", err)
		}
		topicCount++
	}

	for _, category := range categoryByID {
		if category.ID == "" {
			continue
		}

		var link any = nil
		if category.Link != nil {
			link = *category.Link
		}

		_, err := categoriesCollection.UpdateOne(
			ctx,
			bson.M{"locale": locale, "id": category.ID},
			bson.M{
				"$set": bson.M{
					"locale":    locale,
					"id":        category.ID,
					"name":      category.Name,
					"color":     category.Color,
					"link":      link,
					"updatedAt": now,
					"syncedAt":  now,
				},
				"$setOnInsert": bson.M{
					"createdAt": now,
				},
			},
			options.Update().SetUpsert(true),
		)
		if err != nil {
			return 0, 0, 0, fmt.Errorf("category upsert failed: %w", err)
		}
		categoryCount++
	}

	for _, rawPost := range posts {
		postID := normalizeID(rawPost.ID)
		if postID == "" {
			continue
		}

		source := normalizeSource(rawPost.Source)
		topicLookup := topicByID
		if source != sourceBlog {
			topicLookup = make(map[string]siteTopic, len(rawPost.Topics))
			for _, rawTopic := range rawPost.Topics {
				topic := normalizeTopic(rawTopic)
				if topic.ID == "" {
					continue
				}
				if existingFromSite, exists := siteTopicByID[topic.ID]; exists {
					if topic.Name == "" {
						topic.Name = existingFromSite.Name
					}
					if topic.Color == "" {
						topic.Color = existingFromSite.Color
					}
					if topic.Link == nil {
						topic.Link = existingFromSite.Link
					}
				}
				topicLookup[topic.ID] = topic
			}
		}
		category := normalizePostCategory(rawPost.Category)
		postTopics, topicIDs := normalizePostTopics(rawPost.Topics, topicLookup)
		title := strings.TrimSpace(rawPost.Title)
		summary := strings.TrimSpace(rawPost.Summary)
		searchText := normalizeSearchText(rawPost.SearchText, title, summary, rawPost.Topics)
		readingTimeMin := rawPost.ReadingTimeMin
		if readingTimeMin < 0 {
			readingTimeMin = 0
		}

		publishedDate := strings.TrimSpace(rawPost.PublishedDate)
		parsedPublishedAt, publishedOK := parseDate(publishedDate)
		if !publishedOK {
			parsedPublishedAt = now
		}

		updatedDate := strings.TrimSpace(rawPost.UpdatedDate)
		parsedUpdatedAt, updatedOK := parseDate(updatedDate)
		var updatedAtDate any = nil
		if updatedOK {
			updatedAtDate = parsedUpdatedAt
		}

		link := normalizeOptionalString(rawPost.Link)
		thumbnail := normalizeOptionalString(rawPost.Thumbnail)
		var linkValue any = nil
		if link != nil {
			linkValue = *link
		}
		var thumbnailValue any = nil
		if thumbnail != nil {
			thumbnailValue = *thumbnail
		}

		var categoryValue any = nil
		if category != nil {
			categoryValue = bson.M{
				"id":   category.ID,
				"name": category.Name,
			}
		}

		_, err := postsCollection.UpdateOne(
			ctx,
			bson.M{"locale": locale, "id": postID},
			bson.M{
				"$set": bson.M{
					"locale":         locale,
					"id":             postID,
					"title":          title,
					"category":       categoryValue,
					"summary":        summary,
					"searchText":     searchText,
					"thumbnail":      thumbnailValue,
					"topics":         postTopics,
					"topicIds":       topicIDs,
					"readingTimeMin": readingTimeMin,
					"publishedDate":  publishedDate,
					"publishedAt":    parsedPublishedAt,
					"updatedDate":    updatedDate,
					"updatedAtDate":  updatedAtDate,
					"source":         source,
					"link":           linkValue,
					"updatedAt":      now,
					"syncedAt":       now,
				},
				"$setOnInsert": bson.M{
					"createdAt": now,
				},
			},
			options.Update().SetUpsert(true),
		)
		if err != nil {
			return 0, 0, 0, fmt.Errorf("post upsert failed: %w", err)
		}

		if source == sourceBlog {
			seedInput := postSeedInput{
				ID:             postID,
				PublishedAt:    parsedPublishedAt,
				ReadingTimeMin: readingTimeMin,
			}
			if updatedOK {
				seedInput.UpdatedAt = parsedUpdatedAt
			}

			if err := seedInitialEngagementForPost(ctx, likesCollection, hitsCollection, seedInput, now); err != nil {
				return 0, 0, 0, fmt.Errorf("engagement seed failed for postId=%s: %w", postID, err)
			}
		}

		activePostIDs[postID] = struct{}{}
		postCount++
	}

	activePostIDList := make([]string, 0, len(activePostIDs))
	for postID := range activePostIDs {
		activePostIDList = append(activePostIDList, postID)
	}

	activeTopicIDList := make([]string, 0, len(activeTopicIDs))
	for topicID := range activeTopicIDs {
		activeTopicIDList = append(activeTopicIDList, topicID)
	}
	activeCategoryIDList := make([]string, 0, len(activeCategoryIDs))
	for categoryID := range activeCategoryIDs {
		activeCategoryIDList = append(activeCategoryIDList, categoryID)
	}

	postDeleteFilter := bson.M{"locale": locale}
	if len(activePostIDList) > 0 {
		postDeleteFilter["id"] = bson.M{"$nin": activePostIDList}
	}
	if _, err := postsCollection.DeleteMany(ctx, postDeleteFilter); err != nil {
		return 0, 0, 0, fmt.Errorf("stale post cleanup failed: %w", err)
	}

	topicDeleteFilter := bson.M{"locale": locale}
	if len(activeTopicIDList) > 0 {
		topicDeleteFilter["id"] = bson.M{"$nin": activeTopicIDList}
	}
	if _, err := topicsCollection.DeleteMany(ctx, topicDeleteFilter); err != nil {
		return 0, 0, 0, fmt.Errorf("stale topic cleanup failed: %w", err)
	}

	categoryDeleteFilter := bson.M{"locale": locale}
	if len(activeCategoryIDList) > 0 {
		categoryDeleteFilter["id"] = bson.M{"$nin": activeCategoryIDList}
	}
	if _, err := categoriesCollection.DeleteMany(ctx, categoryDeleteFilter); err != nil {
		return 0, 0, 0, fmt.Errorf("stale category cleanup failed: %w", err)
	}

	return postCount, topicCount, categoryCount, nil
}

func main() {
	loadDotEnv(filepath.Join(".", ".env.local"))

	siteURL, err := newsletter.ResolveSiteURL()
	if err != nil {
		log.Fatalf("SITE_URL error: %v", err)
	}
	mongoURI, err := newsletter.ResolveMongoURI()
	if err != nil {
		log.Fatalf("MONGODB_URI error: %v", err)
	}
	databaseName, err := newsletter.ResolveDatabaseName()
	if err != nil {
		log.Fatalf("MONGODB_DATABASE error: %v", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(mongoURI).SetAppName("blog-content-sync-script"))
	if err != nil {
		log.Fatalf("mongodb connect failed: %v", err)
	}
	defer func() {
		disconnectCtx, disconnectCancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer disconnectCancel()
		_ = client.Disconnect(disconnectCtx)
	}()

	db := client.Database(databaseName)
	postsCollection := db.Collection(postsCollectionName)
	topicsCollection := db.Collection(topicsCollectionName)
	categoriesCollection := db.Collection(categoriesCollectionName)
	likesCollection := db.Collection(postLikesCollectionName)
	hitsCollection := db.Collection(postHitsCollectionName)

	if err := ensureIndexes(postsCollection, topicsCollection, categoriesCollection, likesCollection, hitsCollection); err != nil {
		log.Fatalf("index ensure failed: %v", err)
	}

	locales := resolveLocales()
	for _, locale := range locales {
		postCount, topicCount, categoryCount, err := syncLocale(
			locale,
			siteURL,
			postsCollection,
			topicsCollection,
			categoriesCollection,
			likesCollection,
			hitsCollection,
		)
		if err != nil {
			log.Fatalf("sync failed for locale=%s: %v", locale, err)
		}
		log.Printf("sync completed locale=%s posts=%d topics=%d categories=%d", locale, postCount, topicCount, categoryCount)
	}
}
