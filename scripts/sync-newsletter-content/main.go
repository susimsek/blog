package main

import (
	"bufio"
	"bytes"
	"context"
	"crypto/sha1"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"hash/fnv"
	"image"
	_ "image/jpeg"
	_ "image/png"
	"io"
	"log"
	"math"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"regexp"
	"slices"
	"strings"
	"time"

	appconfig "suaybsimsek.com/blog-api/internal/config"
	"suaybsimsek.com/blog-api/pkg/newsletter"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	_ "golang.org/x/image/webp"
)

const (
	postsCollectionName       = "newsletter_posts"
	topicsCollectionName      = "newsletter_topics"
	categoriesCollectionName  = "newsletter_categories"
	postLikesCollectionName   = "post_likes"
	postHitsCollectionName    = "post_hits"
	mediaAssetsCollectionName = "admin_media_assets"
	httpTimeout               = 12 * time.Second
	sourceBlog                = "blog"
	contentSyncMediaCreatedBy = "sync-newsletter-content"
)

var markdownPostIDPattern = regexp.MustCompile(`^[a-z0-9][a-z0-9-]{1,127}$`)

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
	Icon  string  `json:"icon,omitempty"`
	Link  *string `json:"link,omitempty"`
}

type sitePostCategory struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Color string `json:"color"`
	Icon  string `json:"icon,omitempty"`
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

type markdownPostRecord struct {
	Locale  string
	ID      string
	Content string
	Hash    string
}

func loadDotEnv(path string) {
	file, err := os.Open(path)
	if err != nil {
		return
	}
	defer func() {
		_ = file.Close()
	}()

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
	defer func() {
		_ = resp.Body.Close()
	}()

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

func fetchLocaleData(siteURL, locale, dataType string, target any) error {
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
		return fmt.Errorf("%w; fallback failed: %w", err, fallbackErr)
	}
	return nil
}

func normalizeID(raw string) string {
	return strings.ToLower(strings.TrimSpace(raw))
}

func loadMarkdownPostRecords(locale string) ([]markdownPostRecord, error) {
	localeDir := filepath.Join(".", "content", "posts", locale)
	entries, err := os.ReadDir(localeDir)
	if err != nil {
		if os.IsNotExist(err) {
			return []markdownPostRecord{}, nil
		}
		return nil, fmt.Errorf("read locale markdown directory %s: %w", locale, err)
	}

	records := make([]markdownPostRecord, 0, len(entries))
	for _, entry := range entries {
		if entry.IsDir() || !strings.HasSuffix(strings.ToLower(entry.Name()), ".md") {
			continue
		}

		postID := strings.TrimSpace(strings.ToLower(strings.TrimSuffix(entry.Name(), filepath.Ext(entry.Name()))))
		if !markdownPostIDPattern.MatchString(postID) {
			continue
		}

		filePath := filepath.Join(localeDir, entry.Name())
		body, err := extractMarkdownBodyFromFile(filePath)
		if err != nil {
			return nil, fmt.Errorf("read markdown body %s: %w", filePath, err)
		}

		records = append(records, markdownPostRecord{
			Locale:  locale,
			ID:      postID,
			Content: body,
			Hash:    sha256Hex(body),
		})
	}

	slices.SortFunc(records, func(a, b markdownPostRecord) int {
		return strings.Compare(a.ID, b.ID)
	})
	return records, nil
}

func extractMarkdownBodyFromFile(filePath string) (string, error) {
	raw, err := os.ReadFile(filePath)
	if err != nil {
		return "", err
	}

	normalized := strings.ReplaceAll(string(raw), "\r\n", "\n")
	normalized = strings.TrimPrefix(normalized, "\uFEFF")
	if !strings.HasPrefix(normalized, "---\n") {
		return strings.TrimSpace(normalized), nil
	}

	rest := normalized[len("---\n"):]
	if _, content, ok := strings.Cut(rest, "\n---\n"); ok {
		return strings.TrimSpace(content), nil
	}
	if _, content, ok := strings.Cut(rest, "\n...\n"); ok {
		return strings.TrimSpace(content), nil
	}

	return strings.TrimSpace(normalized), nil
}

func sha256Hex(value string) string {
	hash := sha256.Sum256([]byte(value))
	return hex.EncodeToString(hash[:])
}

func syncMarkdownPostContent(
	ctx context.Context,
	postsCollection *mongo.Collection,
	locale string,
	records []markdownPostRecord,
	now time.Time,
) (markdownUpdated, contentUpdated int64, err error) {
	if len(records) == 0 {
		return 0, 0, nil
	}

	markdownModels := make([]mongo.WriteModel, 0, len(records))
	contentModels := make([]mongo.WriteModel, 0, len(records))

	for _, record := range records {
		if record.ID == "" {
			continue
		}

		markdownModels = append(markdownModels, mongo.NewUpdateOneModel().
			SetFilter(bson.M{
				"locale": locale,
				"id":     record.ID,
				"source": sourceBlog,
				"$or": bson.A{
					bson.M{"markdownContentHash": bson.M{"$exists": false}},
					bson.M{"markdownContentHash": bson.M{"$ne": record.Hash}},
				},
			}).
			SetUpdate(bson.M{
				"$set": bson.M{
					"markdownContent":          record.Content,
					"markdownContentHash":      record.Hash,
					"markdownContentUpdatedAt": now,
					"syncedAt":                 now,
					"updatedAt":                now,
				},
			}))

		contentModels = append(contentModels, mongo.NewUpdateOneModel().
			SetFilter(bson.M{
				"locale": locale,
				"id":     record.ID,
				"source": sourceBlog,
				"contentMode": bson.M{
					"$ne": "admin",
				},
				"$or": bson.A{
					bson.M{"contentHash": bson.M{"$exists": false}},
					bson.M{"contentHash": bson.M{"$ne": record.Hash}},
					bson.M{"content": bson.M{"$exists": false}},
				},
			}).
			SetUpdate(bson.M{
				"$set": bson.M{
					"content":          record.Content,
					"contentHash":      record.Hash,
					"contentMode":      "markdown",
					"contentUpdatedAt": now,
					"syncedAt":         now,
					"updatedAt":        now,
				},
			}))
	}

	if len(markdownModels) > 0 {
		result, writeErr := postsCollection.BulkWrite(ctx, markdownModels, options.BulkWrite().SetOrdered(false))
		if writeErr != nil {
			return 0, 0, fmt.Errorf("markdown content bulk update failed: %w", writeErr)
		}
		markdownUpdated = result.ModifiedCount
	}

	if len(contentModels) > 0 {
		result, writeErr := postsCollection.BulkWrite(ctx, contentModels, options.BulkWrite().SetOrdered(false))
		if writeErr != nil {
			return 0, 0, fmt.Errorf("post content bulk update failed: %w", writeErr)
		}
		contentUpdated = result.ModifiedCount
	}

	return markdownUpdated, contentUpdated, nil
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

func syncLegacyThumbnailAsset(
	ctx context.Context,
	siteURL string,
	mediaCollection *mongo.Collection,
	rawThumbnail *string,
	now time.Time,
) (*string, error) {
	thumbnail := normalizeOptionalString(rawThumbnail)
	if thumbnail == nil {
		return nil, nil
	}

	resolvedValue := strings.TrimSpace(*thumbnail)
	if resolvedValue == "" || strings.HasPrefix(resolvedValue, "/api/media/") {
		return &resolvedValue, nil
	}

	localPath, ok := resolveLegacyThumbnailLocalPath(siteURL, resolvedValue)
	if !ok {
		return &resolvedValue, nil
	}

	payload, err := os.ReadFile(localPath)
	if err != nil {
		return nil, fmt.Errorf("thumbnail read failed (%s): %w", localPath, err)
	}
	if len(payload) == 0 {
		return &resolvedValue, nil
	}

	config, _, err := image.DecodeConfig(bytes.NewReader(payload))
	if err != nil {
		return nil, fmt.Errorf("thumbnail image decode failed (%s): %w", localPath, err)
	}
	contentType := detectMediaContentType(localPath, payload)
	if contentType == "" {
		return nil, fmt.Errorf("thumbnail content type unsupported (%s)", localPath)
	}

	digest := sha1Hex(payload)
	existingID, err := findExistingMediaAssetIDByDigest(ctx, mediaCollection, digest)
	if err != nil {
		return nil, fmt.Errorf("media asset lookup failed: %w", err)
	}
	if existingID != "" {
		syncedValue := "/api/media/" + existingID
		return &syncedValue, nil
	}

	id := primitive.NewObjectID().Hex()
	_, err = mediaCollection.InsertOne(ctx, bson.M{
		"id":          id,
		"name":        filepath.Base(localPath),
		"contentType": contentType,
		"digest":      digest,
		"sizeBytes":   len(payload),
		"width":       config.Width,
		"height":      config.Height,
		"data":        payload,
		"createdBy":   contentSyncMediaCreatedBy,
		"createdAt":   now,
		"updatedAt":   now,
	})
	if err != nil {
		return nil, fmt.Errorf("media asset insert failed: %w", err)
	}

	syncedValue := "/api/media/" + id
	return &syncedValue, nil
}

func resolveLegacyThumbnailLocalPath(siteURL, thumbnail string) (string, bool) {
	resolvedValue := strings.TrimSpace(thumbnail)
	if resolvedValue == "" {
		return "", false
	}

	if trimmedPath, ok := strings.CutPrefix(resolvedValue, "/"); ok {
		return filepath.Join(".", "public", filepath.FromSlash(trimmedPath)), true
	}

	parsedThumbnailURL, err := url.Parse(resolvedValue)
	if err != nil || parsedThumbnailURL.Scheme == "" || parsedThumbnailURL.Host == "" {
		return "", false
	}

	parsedSiteURL, err := url.Parse(strings.TrimSpace(siteURL))
	if err != nil || parsedSiteURL.Host == "" {
		return "", false
	}

	if !strings.EqualFold(strings.TrimSpace(parsedThumbnailURL.Hostname()), strings.TrimSpace(parsedSiteURL.Hostname())) {
		return "", false
	}
	if !strings.HasPrefix(parsedThumbnailURL.Path, "/") {
		return "", false
	}

	return filepath.Join(".", "public", filepath.FromSlash(strings.TrimPrefix(parsedThumbnailURL.Path, "/"))), true
}

func detectMediaContentType(filePath string, payload []byte) string {
	extension := strings.ToLower(strings.TrimSpace(filepath.Ext(filePath)))
	switch extension {
	case ".png":
		return "image/png"
	case ".jpg", ".jpeg":
		return "image/jpeg"
	case ".webp":
		return "image/webp"
	}

	detected := strings.ToLower(strings.TrimSpace(http.DetectContentType(payload)))
	switch detected {
	case "image/png", "image/jpeg", "image/webp":
		return detected
	default:
		return ""
	}
}

func sha1Hex(payload []byte) string {
	sum := sha1.Sum(payload)
	return hex.EncodeToString(sum[:])
}

func findExistingMediaAssetIDByDigest(ctx context.Context, mediaCollection *mongo.Collection, digest string) (string, error) {
	var doc struct {
		ID string `bson:"id"`
	}

	err := mediaCollection.FindOne(
		ctx,
		bson.M{"digest": strings.TrimSpace(strings.ToLower(digest))},
		options.FindOne().SetProjection(bson.M{"id": 1}),
	).Decode(&doc)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return "", nil
	}
	if err != nil {
		return "", err
	}

	return strings.TrimSpace(doc.ID), nil
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
	icon := strings.TrimSpace(raw.Icon)
	switch color {
	case "red", "green", "blue", "orange", "yellow", "purple", "gray", "brown", "pink", "cyan":
	default:
		color = "blue"
	}
	switch icon {
	case "gamepad", "code":
	default:
		icon = ""
	}

	return siteCategory{
		ID:    id,
		Name:  name,
		Color: color,
		Icon:  icon,
		Link:  normalizeOptionalString(raw.Link),
	}
}

func normalizePostCategory(raw sitePostCategory, definedCategories map[string]siteCategory) *sitePostCategory {
	id := normalizeID(raw.ID)
	if id == "" {
		return nil
	}

	name := strings.TrimSpace(raw.Name)
	color := strings.ToLower(strings.TrimSpace(raw.Color))
	icon := strings.TrimSpace(raw.Icon)
	if definedCategory, exists := definedCategories[id]; exists {
		if name == "" {
			name = definedCategory.Name
		}
		if color == "" {
			color = definedCategory.Color
		}
		if icon == "" {
			icon = definedCategory.Icon
		}
	}
	if name == "" {
		return nil
	}

	switch color {
	case "red", "green", "blue", "orange", "yellow", "purple", "gray", "brown", "pink", "cyan":
	default:
		color = "blue"
	}
	switch icon {
	case "gamepad", "code":
	default:
		icon = ""
	}

	return &sitePostCategory{
		ID:    id,
		Name:  name,
		Color: color,
		Icon:  icon,
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
	ageDays = max(ageDays, 1)

	reading := post.ReadingTimeMin
	if reading < 1 {
		reading = 4
	}

	ageScore := int(math.Sqrt(float64(ageDays))*8.5) + 20
	ageScore = min(ageScore, 420)

	readingBoost := reading * 3
	readingBoost = min(readingBoost, 36)

	noise := int(hash%71) - 25 // -25..45
	likes := ageScore + readingBoost + noise
	likes = max(likes, 12)

	return int64(likes)
}

func computeRealisticHits(post postSeedInput, now time.Time) int64 {
	hash := stableHash(post.ID)

	published := post.PublishedAt
	if published.IsZero() {
		published = now.AddDate(0, -6, 0)
	}

	ageDays := int(now.Sub(published).Hours() / 24)
	ageDays = max(ageDays, 1)

	reading := post.ReadingTimeMin
	if reading < 1 {
		reading = 4
	}

	likeAgeScore := int(math.Sqrt(float64(ageDays))*8.5) + 20
	likeAgeScore = min(likeAgeScore, 420)

	likeReadingBoost := reading * 3
	likeReadingBoost = min(likeReadingBoost, 36)

	likeNoise := int(hash%71) - 25 // -25..45
	likeEstimate := likeAgeScore + likeReadingBoost + likeNoise
	likeEstimate = max(likeEstimate, 12)

	hitMultiplier := int64(16 + (hash % 17)) // 16..32
	reachNoise := int64(hash%1800) - 450     // -450..1349

	recencyBoost := int64(0)
	if ageDays < 21 {
		recencyBoost = 320 + int64(hash%640)
	}

	hits := int64(likeEstimate)*hitMultiplier + 420 + reachNoise + recencyBoost
	hits = max(hits, 700)

	return hits
}

func buildDataURL(siteURL, locale, dataType string) string {
	return fmt.Sprintf("%s/data/%s.%s.json", strings.TrimRight(siteURL, "/"), dataType, locale)
}

func normalizeSearchText(raw, title, summary string, topics []siteTopic) string {
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
	mediaCollection *mongo.Collection,
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

	mediaIndexes := []mongo.IndexModel{
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
	if _, err := mediaCollection.Indexes().CreateMany(ctx, mediaIndexes); err != nil {
		return fmt.Errorf("admin media asset index create failed: %w", err)
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
				"postId":         post.ID,
				"likes":          likes,
				"seededAt":       now,
				"seedModel":      "realistic-v2",
				"publishedDate":  publishedDate,
				"updatedDate":    updatedDate,
				"readingTimeMin": post.ReadingTimeMin,
				"createdAt":      now,
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
				"postId":         post.ID,
				"hits":           hits,
				"seededAt":       now,
				"seedModel":      "realistic-v2",
				"publishedDate":  publishedDate,
				"updatedDate":    updatedDate,
				"readingTimeMin": post.ReadingTimeMin,
				"createdAt":      now,
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
	mediaCollection *mongo.Collection,
) (postCount, topicCount, categoryCount int, err error) {
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
	markdownRecords, err := loadMarkdownPostRecords(locale)
	if err != nil {
		return 0, 0, 0, fmt.Errorf("markdown load failed: %w", err)
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

	ctx, cancel := context.WithTimeout(context.Background(), 120*time.Second)
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
					"icon":      category.Icon,
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
		category := normalizePostCategory(rawPost.Category, categoryByID)
		postTopics, topicIDs := normalizePostTopics(rawPost.Topics, topicLookup)
		title := strings.TrimSpace(rawPost.Title)
		summary := strings.TrimSpace(rawPost.Summary)
		searchText := normalizeSearchText(rawPost.SearchText, title, summary, rawPost.Topics)
		readingTimeMin := rawPost.ReadingTimeMin
		readingTimeMin = max(readingTimeMin, 0)

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
		thumbnail, err := syncLegacyThumbnailAsset(ctx, siteURL, mediaCollection, rawPost.Thumbnail, now)
		if err != nil {
			return 0, 0, 0, fmt.Errorf("thumbnail media sync failed for postId=%s: %w", postID, err)
		}
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
				"id":    category.ID,
				"name":  category.Name,
				"color": category.Color,
				"icon":  category.Icon,
			}
		}

		_, err = postsCollection.UpdateOne(
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

	markdownUpdated, contentUpdated, err := syncMarkdownPostContent(ctx, postsCollection, locale, markdownRecords, now)
	if err != nil {
		return 0, 0, 0, fmt.Errorf("markdown sync failed: %w", err)
	}
	log.Printf(
		"markdown sync locale=%s files=%d markdownUpdated=%d contentUpdated=%d",
		locale,
		len(markdownRecords),
		markdownUpdated,
		contentUpdated,
	)

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

	siteURL, err := appconfig.ResolveSiteURL()
	if err != nil {
		log.Fatalf("SITE_URL error: %v", err)
	}
	databaseConfig, err := appconfig.ResolveDatabaseConfig()
	if err != nil {
		log.Fatalf("database config error: %v", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	client, err := appconfig.NewMongoClient(ctx, databaseConfig, "blog-content-sync-script")
	if err != nil {
		log.Fatalf("mongodb connect failed: %v", err)
	}
	defer func() {
		disconnectCtx, disconnectCancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer disconnectCancel()
		_ = client.Disconnect(disconnectCtx)
	}()

	db := client.Database(databaseConfig.Name)
	postsCollection := db.Collection(postsCollectionName)
	topicsCollection := db.Collection(topicsCollectionName)
	categoriesCollection := db.Collection(categoriesCollectionName)
	likesCollection := db.Collection(postLikesCollectionName)
	hitsCollection := db.Collection(postHitsCollectionName)
	mediaCollection := db.Collection(mediaAssetsCollectionName)

	if err := ensureIndexes(postsCollection, topicsCollection, categoriesCollection, likesCollection, hitsCollection, mediaCollection); err != nil {
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
			mediaCollection,
		)
		if err != nil {
			log.Fatalf("sync failed for locale=%s: %v", locale, err)
		}
		log.Printf("sync completed locale=%s posts=%d topics=%d categories=%d", locale, postCount, topicCount, categoryCount)
	}
}
