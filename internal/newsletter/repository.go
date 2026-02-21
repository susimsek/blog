package newsletter

import (
	"context"
	"errors"
	"fmt"
	"sync"
	"time"

	newsletterpkg "suaybsimsek.com/blog-api/pkg/newsletter"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

const newsletterCollectionName = "newsletter_subscribers"

var errRepositoryUnavailable = errors.New("newsletter repository unavailable")

type PendingSubscription struct {
	Email                 string
	Locale                string
	Tags                  []string
	FormName              string
	Source                string
	UpdatedAt             time.Time
	IPHash                string
	UserAgent             string
	ConfirmTokenHash      string
	ConfirmTokenExpiresAt time.Time
	ConfirmRequestedAt    time.Time
	CreatedAt             *time.Time
}

type Repository interface {
	GetStatusByEmail(ctx context.Context, email string) (status string, found bool, err error)
	UpsertPendingSubscription(ctx context.Context, input PendingSubscription) error
	UpdatePendingSubscription(ctx context.Context, input PendingSubscription) error
	ConfirmByTokenHash(ctx context.Context, tokenHash string, now time.Time) (matched bool, err error)
	UnsubscribeByEmail(ctx context.Context, email string, now time.Time) error
}

type mongoRepository struct{}

var (
	mongoClient     *mongo.Client
	mongoInitErr    error
	mongoClientOnce sync.Once

	indexesOnce sync.Once
	indexesErr  error
)

func NewMongoRepository() Repository {
	return &mongoRepository{}
}

func getMongoClient() (*mongo.Client, error) {
	mongoClientOnce.Do(func() {
		uri, err := newsletterpkg.ResolveMongoURI()
		if err != nil {
			mongoInitErr = err
			return
		}

		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		client, err := mongo.Connect(ctx, options.Client().ApplyURI(uri).SetAppName("blog-api-newsletter"))
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

func ensureSubscriberIndexes(collection *mongo.Collection) error {
	indexesOnce.Do(func() {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		indexes := []mongo.IndexModel{
			{
				Keys:    bson.D{{Key: "email", Value: 1}},
				Options: options.Index().SetUnique(true).SetName("uniq_newsletter_email"),
			},
			{
				Keys: bson.D{
					{Key: "status", Value: 1},
					{Key: "locale", Value: 1},
				},
				Options: options.Index().SetName("idx_newsletter_status_locale"),
			},
			{
				Keys:    bson.D{{Key: "confirmTokenHash", Value: 1}},
				Options: options.Index().SetName("idx_confirm_token_hash"),
			},
			{
				Keys: bson.D{{Key: "confirmTokenExpiresAt", Value: 1}},
				Options: options.Index().
					SetName("ttl_confirm_token_expiry").
					SetExpireAfterSeconds(0),
			},
		}

		_, err := collection.Indexes().CreateMany(ctx, indexes)
		if err != nil {
			indexesErr = fmt.Errorf("create index failed: %w", err)
		}
	})

	return indexesErr
}

func getCollection() (*mongo.Collection, error) {
	databaseName, err := newsletterpkg.ResolveDatabaseName()
	if err != nil {
		return nil, err
	}

	client, err := getMongoClient()
	if err != nil {
		return nil, err
	}

	collection := client.Database(databaseName).Collection(newsletterCollectionName)
	if err := ensureSubscriberIndexes(collection); err != nil {
		return nil, err
	}

	return collection, nil
}

func (r *mongoRepository) GetStatusByEmail(ctx context.Context, email string) (string, bool, error) {
	collection, err := getCollection()
	if err != nil {
		return "", false, fmt.Errorf("%w: %v", errRepositoryUnavailable, err)
	}

	var existing struct {
		Status string `bson:"status"`
	}
	err = collection.FindOne(ctx, bson.M{"email": email}).Decode(&existing)
	if err == mongo.ErrNoDocuments {
		return "", false, nil
	}
	if err != nil {
		return "", false, err
	}

	return existing.Status, true, nil
}

func (r *mongoRepository) UpsertPendingSubscription(ctx context.Context, input PendingSubscription) error {
	collection, err := getCollection()
	if err != nil {
		return fmt.Errorf("%w: %v", errRepositoryUnavailable, err)
	}

	setFields := bson.M{
		"email":                 input.Email,
		"locale":                input.Locale,
		"status":                "pending",
		"tags":                  input.Tags,
		"formName":              input.FormName,
		"source":                input.Source,
		"updatedAt":             input.UpdatedAt,
		"ipHash":                input.IPHash,
		"userAgent":             input.UserAgent,
		"confirmTokenHash":      input.ConfirmTokenHash,
		"confirmTokenExpiresAt": input.ConfirmTokenExpiresAt,
		"confirmRequestedAt":    input.ConfirmRequestedAt,
	}

	update := bson.M{
		"$set": setFields,
	}
	if input.CreatedAt != nil {
		update["$setOnInsert"] = bson.M{
			"createdAt": *input.CreatedAt,
		}
	}

	_, err = collection.UpdateOne(ctx, bson.M{"email": input.Email}, update, options.Update().SetUpsert(true))
	return err
}

func (r *mongoRepository) UpdatePendingSubscription(ctx context.Context, input PendingSubscription) error {
	collection, err := getCollection()
	if err != nil {
		return fmt.Errorf("%w: %v", errRepositoryUnavailable, err)
	}

	update := bson.M{
		"$set": bson.M{
			"locale":                input.Locale,
			"status":                "pending",
			"updatedAt":             input.UpdatedAt,
			"ipHash":                input.IPHash,
			"userAgent":             input.UserAgent,
			"confirmTokenHash":      input.ConfirmTokenHash,
			"confirmTokenExpiresAt": input.ConfirmTokenExpiresAt,
			"confirmRequestedAt":    input.ConfirmRequestedAt,
		},
	}

	_, err = collection.UpdateOne(ctx, bson.M{"email": input.Email}, update)
	return err
}

func (r *mongoRepository) ConfirmByTokenHash(ctx context.Context, tokenHash string, now time.Time) (bool, error) {
	collection, err := getCollection()
	if err != nil {
		return false, fmt.Errorf("%w: %v", errRepositoryUnavailable, err)
	}

	filter := bson.M{
		"confirmTokenHash":      tokenHash,
		"status":                "pending",
		"confirmTokenExpiresAt": bson.M{"$gt": now},
	}
	update := bson.M{
		"$set": bson.M{
			"status":      "active",
			"confirmedAt": now,
			"updatedAt":   now,
		},
		"$unset": bson.M{
			"confirmTokenHash":      "",
			"confirmTokenExpiresAt": "",
			"confirmRequestedAt":    "",
		},
	}

	result, err := collection.UpdateOne(ctx, filter, update)
	if err != nil {
		return false, err
	}

	return result.MatchedCount > 0, nil
}

func (r *mongoRepository) UnsubscribeByEmail(ctx context.Context, email string, now time.Time) error {
	collection, err := getCollection()
	if err != nil {
		return fmt.Errorf("%w: %v", errRepositoryUnavailable, err)
	}

	update := bson.M{
		"$set": bson.M{
			"status":         "unsubscribed",
			"updatedAt":      now,
			"unsubscribedAt": now,
		},
		"$unset": bson.M{
			"confirmTokenHash":      "",
			"confirmTokenExpiresAt": "",
			"confirmRequestedAt":    "",
		},
	}

	_, err = collection.UpdateOne(ctx, bson.M{"email": email}, update)
	return err
}
