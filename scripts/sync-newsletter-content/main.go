package main

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"time"

	"suaybsimsek.com/blog-api/pkg/newsletter"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

const (
	postsCollectionName  = "newsletter_posts"
	topicsCollectionName = "newsletter_topics"
	httpTimeout          = 12 * time.Second
)

type siteTopic struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Color string `json:"color"`
}

type sitePost struct {
	ID             string      `json:"id"`
	Title          string      `json:"title"`
	Summary        string      `json:"summary"`
	Thumbnail      string      `json:"thumbnail"`
	Topics         []siteTopic `json:"topics"`
	ReadingTimeMin int         `json:"readingTimeMin"`
	PublishedDate  string      `json:"publishedDate"`
	UpdatedDate    string      `json:"updatedDate"`
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
	req.Header.Set("User-Agent", "suayb-blog-newsletter-content-sync/1.0")

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

func normalizeTopic(raw siteTopic) siteTopic {
	id := strings.TrimSpace(raw.ID)
	name := strings.TrimSpace(raw.Name)
	color := strings.ToLower(strings.TrimSpace(raw.Color))

	if id == "" {
		return siteTopic{}
	}
	if name == "" {
		name = id
	}

	return siteTopic{
		ID:    id,
		Name:  name,
		Color: color,
	}
}

func ensureIndexes(postsCollection *mongo.Collection, topicsCollection *mongo.Collection) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	_, err := postsCollection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{
			{Key: "locale", Value: 1},
			{Key: "id", Value: 1},
		},
		Options: options.Index().
			SetName("uniq_newsletter_post_locale_id").
			SetUnique(true),
	})
	if err != nil {
		return fmt.Errorf("post index create failed: %w", err)
	}

	_, err = topicsCollection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{
			{Key: "locale", Value: 1},
			{Key: "id", Value: 1},
		},
		Options: options.Index().
			SetName("uniq_newsletter_topic_locale_id").
			SetUnique(true),
	})
	if err != nil {
		return fmt.Errorf("topic index create failed: %w", err)
	}

	return nil
}

func buildDataURL(siteURL string, locale string, dataType string) string {
	return fmt.Sprintf("%s/data/%s.%s.json", strings.TrimRight(siteURL, "/"), dataType, locale)
}

func syncLocale(
	locale string,
	siteURL string,
	postsCollection *mongo.Collection,
	topicsCollection *mongo.Collection,
) (postCount int, topicCount int, err error) {
	var posts []sitePost
	if err := fetchLocaleData(siteURL, locale, "posts", &posts); err != nil {
		return 0, 0, fmt.Errorf("posts fetch failed: %w", err)
	}

	var topics []siteTopic
	if err := fetchLocaleData(siteURL, locale, "topics", &topics); err != nil {
		return 0, 0, fmt.Errorf("topics fetch failed: %w", err)
	}

	now := time.Now().UTC()
	topicByID := make(map[string]siteTopic, len(topics))

	for _, raw := range topics {
		topic := normalizeTopic(raw)
		if topic.ID == "" {
			continue
		}
		topicByID[topic.ID] = topic
	}

	for _, post := range posts {
		for _, rawTopic := range post.Topics {
			topic := normalizeTopic(rawTopic)
			if topic.ID == "" {
				continue
			}
			if existing, exists := topicByID[topic.ID]; exists {
				if existing.Name == "" {
					existing.Name = topic.Name
				}
				if existing.Color == "" {
					existing.Color = topic.Color
				}
				topicByID[topic.ID] = existing
				continue
			}
			topicByID[topic.ID] = topic
		}
	}

	ctx, cancel := context.WithTimeout(context.Background(), 40*time.Second)
	defer cancel()

	for _, topic := range topicByID {
		_, err := topicsCollection.UpdateOne(
			ctx,
			bson.M{"locale": locale, "id": topic.ID},
			bson.M{
				"$set": bson.M{
					"locale":    locale,
					"id":        topic.ID,
					"name":      topic.Name,
					"color":     topic.Color,
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
			return 0, 0, fmt.Errorf("topic upsert failed: %w", err)
		}
		topicCount++
	}

	for _, rawPost := range posts {
		postID := strings.TrimSpace(rawPost.ID)
		if postID == "" {
			continue
		}

		postTopics := make([]bson.M, 0, len(rawPost.Topics))
		for _, rawTopic := range rawPost.Topics {
			topic := normalizeTopic(rawTopic)
			if topic.ID == "" {
				continue
			}
			if topic.Color == "" {
				if fromIndex, exists := topicByID[topic.ID]; exists {
					topic.Color = fromIndex.Color
				}
			}
			postTopics = append(postTopics, bson.M{
				"id":    topic.ID,
				"name":  topic.Name,
				"color": topic.Color,
			})
		}

		_, err := postsCollection.UpdateOne(
			ctx,
			bson.M{"locale": locale, "id": postID},
			bson.M{
				"$set": bson.M{
					"locale":         locale,
					"id":             postID,
					"title":          strings.TrimSpace(rawPost.Title),
					"summary":        strings.TrimSpace(rawPost.Summary),
					"thumbnail":      strings.TrimSpace(rawPost.Thumbnail),
					"topics":         postTopics,
					"readingTimeMin": rawPost.ReadingTimeMin,
					"publishedDate":  strings.TrimSpace(rawPost.PublishedDate),
					"updatedDate":    strings.TrimSpace(rawPost.UpdatedDate),
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
			return 0, 0, fmt.Errorf("post upsert failed: %w", err)
		}
		postCount++
	}

	return postCount, topicCount, nil
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

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(mongoURI).SetAppName("blog-newsletter-content-sync-script"))
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

	if err := ensureIndexes(postsCollection, topicsCollection); err != nil {
		log.Fatalf("index ensure failed: %v", err)
	}

	locales := resolveLocales()
	for _, locale := range locales {
		postCount, topicCount, err := syncLocale(locale, siteURL, postsCollection, topicsCollection)
		if err != nil {
			log.Fatalf("sync failed for locale=%s: %v", locale, err)
		}
		log.Printf("sync completed locale=%s posts=%d topics=%d", locale, postCount, topicCount)
	}
}
