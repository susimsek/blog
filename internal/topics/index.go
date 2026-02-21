package handler

import (
	"context"
	"fmt"
	"strings"
	"sync"
	"time"

	"suaybsimsek.com/blog-api/pkg/newsletter"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

const topicsCollectionName = "newsletter_topics"

var (
	topicsClient  *mongo.Client
	topicsInitErr error
	topicsOnce    sync.Once

	topicsIndexesOnce sync.Once
	topicsIndexesErr  error
)

type topicRecord struct {
	ID    string  `json:"id" bson:"id"`
	Name  string  `json:"name" bson:"name"`
	Color string  `json:"color" bson:"color"`
	Link  *string `json:"link,omitempty" bson:"link,omitempty"`
}

type topicsResponse struct {
	Status string        `json:"status"`
	Locale string        `json:"locale,omitempty"`
	Topics []topicRecord `json:"topics,omitempty"`
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

func normalizeTopic(topic topicRecord) topicRecord {
	topic.ID = strings.TrimSpace(topic.ID)
	topic.Name = strings.TrimSpace(topic.Name)
	topic.Color = strings.ToLower(strings.TrimSpace(topic.Color))
	topic.Link = normalizeOptionalString(topic.Link)
	return topic
}

func getTopicsClient() (*mongo.Client, error) {
	topicsOnce.Do(func() {
		uri, err := newsletter.ResolveMongoURI()
		if err != nil {
			topicsInitErr = err
			return
		}

		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		client, err := mongo.Connect(ctx, options.Client().ApplyURI(uri).SetAppName("blog-api-topics"))
		if err != nil {
			topicsInitErr = fmt.Errorf("mongodb connect failed: %w", err)
			return
		}

		topicsClient = client
	})

	if topicsInitErr != nil {
		return nil, topicsInitErr
	}

	return topicsClient, nil
}

func getTopicsCollection() (*mongo.Collection, error) {
	databaseName, databaseErr := newsletter.ResolveDatabaseName()
	if databaseErr != nil {
		return nil, databaseErr
	}

	client, err := getTopicsClient()
	if err != nil {
		return nil, err
	}

	collection := client.Database(databaseName).Collection(topicsCollectionName)
	if err := ensureTopicIndexes(collection); err != nil {
		return nil, err
	}

	return collection, nil
}

func ensureTopicIndexes(collection *mongo.Collection) error {
	topicsIndexesOnce.Do(func() {
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

		if _, err := collection.Indexes().CreateMany(ctx, indexes); err != nil {
			topicsIndexesErr = fmt.Errorf("topic index create failed: %w", err)
		}
	})

	return topicsIndexesErr
}
