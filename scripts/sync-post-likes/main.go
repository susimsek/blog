package main

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"hash/fnv"
	"log"
	"math"
	"os"
	"path/filepath"
	"strings"
	"time"

	"suaybsimsek.com/blog-api/pkg/newsletter"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

const likesCollectionName = "post_likes"

type indexedPost struct {
	ID             string `json:"id"`
	Source         string `json:"source"`
	PublishedDate  string `json:"publishedDate"`
	UpdatedDate    string `json:"updatedDate"`
	ReadingTimeMin int    `json:"readingTimeMin"`
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

func stableHash(postID string) uint32 {
	hasher := fnv.New32a()
	_, _ = hasher.Write([]byte(postID))
	return hasher.Sum32()
}

func parseDate(value string) time.Time {
	raw := strings.TrimSpace(value)
	if raw == "" {
		return time.Time{}
	}

	layouts := []string{
		"2006-01-02",
		time.RFC3339,
		time.RFC3339Nano,
	}
	for _, layout := range layouts {
		parsed, err := time.Parse(layout, raw)
		if err == nil {
			return parsed.UTC()
		}
	}
	return time.Time{}
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

func readPosts(locales []string) (map[string]postSeedInput, error) {
	postsByID := make(map[string]postSeedInput)

	for _, locale := range locales {
		filePath := filepath.Join(".", "public", "data", fmt.Sprintf("posts.%s.json", locale))
		data, err := os.ReadFile(filePath)
		if err != nil {
			return nil, fmt.Errorf("read failed for %s: %w", filePath, err)
		}

		var posts []indexedPost
		if err := json.Unmarshal(data, &posts); err != nil {
			return nil, fmt.Errorf("parse failed for %s: %w", filePath, err)
		}

		for _, rawPost := range posts {
			postID := strings.ToLower(strings.TrimSpace(rawPost.ID))
			if postID == "" {
				continue
			}

			source := strings.ToLower(strings.TrimSpace(rawPost.Source))
			if source != "" && source != "blog" {
				continue
			}

			publishedAt := parseDate(rawPost.PublishedDate)
			updatedAt := parseDate(rawPost.UpdatedDate)
			reading := rawPost.ReadingTimeMin
			if reading <= 0 {
				reading = 4
			}

			current := postSeedInput{
				ID:             postID,
				PublishedAt:    publishedAt,
				UpdatedAt:      updatedAt,
				ReadingTimeMin: reading,
			}

			existing, exists := postsByID[postID]
			if !exists {
				postsByID[postID] = current
				continue
			}

			if existing.PublishedAt.IsZero() || (!publishedAt.IsZero() && publishedAt.Before(existing.PublishedAt)) {
				existing.PublishedAt = publishedAt
			}
			if existing.UpdatedAt.IsZero() || (!updatedAt.IsZero() && updatedAt.After(existing.UpdatedAt)) {
				existing.UpdatedAt = updatedAt
			}
			if reading > existing.ReadingTimeMin {
				existing.ReadingTimeMin = reading
			}
			postsByID[postID] = existing
		}
	}

	return postsByID, nil
}

func sortedPostIDs(postsByID map[string]postSeedInput) []string {
	result := make([]string, 0, len(postsByID))
	for postID := range postsByID {
		result = append(result, postID)
	}
	return result
}

func ensureLikesIndex(collection *mongo.Collection) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	_, err := collection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "postId", Value: 1}},
		Options: options.Index().SetName("uniq_post_likes_post_id").SetUnique(true),
	})
	if err != nil {
		return fmt.Errorf("index create failed: %w", err)
	}
	return nil
}

func upsertPostLike(
	collection *mongo.Collection,
	post postSeedInput,
	now time.Time,
) (*mongo.UpdateResult, int64, error) {
	likes := computeRealisticLikes(post, now)

	publishedDate := ""
	if !post.PublishedAt.IsZero() {
		publishedDate = post.PublishedAt.Format(time.RFC3339)
	}

	updatedDate := ""
	if !post.UpdatedAt.IsZero() {
		updatedDate = post.UpdatedAt.Format(time.RFC3339)
	}

	result, err := collection.UpdateOne(
		context.Background(),
		bson.M{"postId": post.ID},
		bson.M{
			"$setOnInsert": bson.M{
				"postId":    post.ID,
				"createdAt": now,
			},
			"$set": bson.M{
				"likes":          likes,
				"seededAt":       now,
				"seedModel":      "realistic-v2",
				"publishedDate":  publishedDate,
				"updatedDate":    updatedDate,
				"readingTimeMin": post.ReadingTimeMin,
				"updatedAt":      now,
			},
		},
		options.Update().SetUpsert(true),
	)
	if err != nil {
		return nil, 0, err
	}

	return result, likes, nil
}

func main() {
	loadDotEnv(filepath.Join(".", ".env.local"))

	mongoURI, err := newsletter.ResolveMongoURI()
	if err != nil {
		log.Fatalf("MONGODB_URI error: %v", err)
	}

	databaseName, err := newsletter.ResolveDatabaseName()
	if err != nil {
		log.Fatalf("MONGODB_DATABASE error: %v", err)
	}

	postsByID, err := readPosts([]string{newsletter.LocaleEN, newsletter.LocaleTR})
	if err != nil {
		log.Fatalf("read posts failed: %v", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(mongoURI).SetAppName("blog-post-likes-sync-script"))
	if err != nil {
		log.Fatalf("mongodb connect failed: %v", err)
	}
	defer func() {
		disconnectCtx, disconnectCancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer disconnectCancel()
		_ = client.Disconnect(disconnectCtx)
	}()

	collection := client.Database(databaseName).Collection(likesCollectionName)
	if err := ensureLikesIndex(collection); err != nil {
		log.Fatalf("ensure index failed: %v", err)
	}

	now := time.Now().UTC()
	inserted := 0
	updated := 0
	var minLikes int64 = 1<<62 - 1
	var maxLikes int64
	var sumLikes int64

	for _, postID := range sortedPostIDs(postsByID) {
		post := postsByID[postID]
		post.ID = postID

		result, likes, err := upsertPostLike(collection, post, now)
		if err != nil {
			log.Fatalf("upsert failed for postId=%s: %v", postID, err)
		}

		if result.UpsertedCount > 0 {
			inserted++
		} else {
			updated++
		}

		if likes < minLikes {
			minLikes = likes
		}
		if likes > maxLikes {
			maxLikes = likes
		}
		sumLikes += likes
	}

	total := len(postsByID)
	avgLikes := int64(0)
	if total > 0 {
		avgLikes = sumLikes / int64(total)
	}

	log.Printf(
		"post likes sync completed total=%d inserted=%d updated=%d min=%d max=%d avg=%d",
		total,
		inserted,
		updated,
		minLikes,
		maxLikes,
		avgLikes,
	)
}
