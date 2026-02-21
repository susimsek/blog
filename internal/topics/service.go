package handler

import (
	"context"
	"strings"
	"time"

	"suaybsimsek.com/blog-api/pkg/newsletter"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type TopicRecord = topicRecord
type TopicsResponse = topicsResponse

// QueryTopics returns topics for locale without HTTP routing.
func QueryTopics(ctx context.Context, locale string) topicsResponse {
	collection, err := getTopicsCollection()
	if err != nil {
		return topicsResponse{Status: "service-unavailable"}
	}

	resolvedLocale := newsletter.ResolveLocale(strings.TrimSpace(locale), "")
	queryCtx, cancel := withTopicTimeout(ctx, 10*time.Second)
	defer cancel()

	cursor, findErr := collection.Find(
		queryCtx,
		bson.M{"locale": resolvedLocale},
		options.Find().SetSort(bson.D{{Key: "name", Value: 1}}),
	)
	if findErr != nil {
		return topicsResponse{Status: "failed"}
	}
	defer cursor.Close(queryCtx)

	topics := make([]topicRecord, 0)
	for cursor.Next(queryCtx) {
		var topic topicRecord
		if decodeErr := cursor.Decode(&topic); decodeErr != nil {
			return topicsResponse{Status: "failed"}
		}
		normalized := normalizeTopic(topic)
		if normalized.ID == "" || normalized.Name == "" || normalized.Color == "" {
			continue
		}
		topics = append(topics, normalized)
	}

	if err := cursor.Err(); err != nil {
		return topicsResponse{Status: "failed"}
	}

	return topicsResponse{
		Status: "success",
		Locale: resolvedLocale,
		Topics: topics,
	}
}

func withTopicTimeout(parent context.Context, timeout time.Duration) (context.Context, context.CancelFunc) {
	if parent == nil {
		parent = context.Background()
	}
	return context.WithTimeout(parent, timeout)
}
