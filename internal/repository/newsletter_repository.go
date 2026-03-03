package repository

import (
	"context"
	"errors"
	"fmt"
	"sync"
	"time"

	appconfig "suaybsimsek.com/blog-api/internal/config"
	"suaybsimsek.com/blog-api/internal/domain"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

const newsletterCollectionName = "newsletter_subscribers"

var ErrNewsletterRepositoryUnavailable = errors.New("newsletter repository unavailable")

const newsletterRepositoryUnavailableFormat = "%w: %v"

type NewsletterPendingSubscription = domain.NewsletterPendingSubscription

type newsletterSingleFinder interface {
	FindOne(context.Context, any, ...*options.FindOneOptions) *mongo.SingleResult
}

type newsletterUpdater interface {
	UpdateOne(context.Context, any, any, ...*options.UpdateOptions) (*mongo.UpdateResult, error)
}

type NewsletterRepository interface {
	GetStatusByEmail(ctx context.Context, email string) (status string, found bool, err error)
	UpsertPendingSubscription(ctx context.Context, input NewsletterPendingSubscription) error
	UpdatePendingSubscription(ctx context.Context, input NewsletterPendingSubscription) error
	ConfirmByTokenHash(ctx context.Context, tokenHash string, now time.Time) (matched bool, err error)
	UnsubscribeByEmail(ctx context.Context, email string, now time.Time) error
}

type newsletterMongoRepository struct{}

var (
	newsletterMongoClient     *mongo.Client
	newsletterMongoInitErr    error
	newsletterMongoClientOnce sync.Once

	newsletterIndexesOnce sync.Once
	newsletterIndexesErr  error
)

func NewNewsletterMongoRepository() NewsletterRepository {
	return &newsletterMongoRepository{}
}

func getNewsletterMongoClient() (*mongo.Client, error) {
	newsletterMongoClientOnce.Do(func() {
		databaseConfig, err := appconfig.ResolveDatabaseConfig()
		if err != nil {
			newsletterMongoInitErr = err
			return
		}

		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		client, err := appconfig.NewMongoClient(ctx, databaseConfig, "blog-api-newsletter")
		if err != nil {
			newsletterMongoInitErr = fmt.Errorf("mongodb connect failed: %w", err)
			return
		}

		newsletterMongoClient = client
	})

	if newsletterMongoInitErr != nil {
		return nil, newsletterMongoInitErr
	}

	return newsletterMongoClient, nil
}

func ensureNewsletterSubscriberIndexes(collection *mongo.Collection) error {
	newsletterIndexesOnce.Do(func() {
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
			newsletterIndexesErr = fmt.Errorf("create index failed: %w", err)
		}
	})

	return newsletterIndexesErr
}

func getNewsletterCollection() (*mongo.Collection, error) {
	databaseConfig, err := appconfig.ResolveDatabaseConfig()
	if err != nil {
		return nil, err
	}

	client, err := getNewsletterMongoClient()
	if err != nil {
		return nil, err
	}

	collection := client.Database(databaseConfig.Name).Collection(newsletterCollectionName)
	if err := ensureNewsletterSubscriberIndexes(collection); err != nil {
		return nil, err
	}

	return collection, nil
}

func (*newsletterMongoRepository) GetStatusByEmail(ctx context.Context, email string) (string, bool, error) {
	collection, err := getNewsletterCollection()
	if err != nil {
		return "", false, fmt.Errorf(newsletterRepositoryUnavailableFormat, ErrNewsletterRepositoryUnavailable, err)
	}

	return getStatusByEmailFromCollection(ctx, collection, email)
}

func getStatusByEmailFromCollection(ctx context.Context, collection newsletterSingleFinder, email string) (string, bool, error) {
	var existing struct {
		Status string `bson:"status"`
	}
	err := collection.FindOne(ctx, bson.M{"email": email}).Decode(&existing)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return "", false, nil
	}
	if err != nil {
		return "", false, err
	}

	return existing.Status, true, nil
}

func (*newsletterMongoRepository) UpsertPendingSubscription(ctx context.Context, input NewsletterPendingSubscription) error {
	collection, err := getNewsletterCollection()
	if err != nil {
		return fmt.Errorf(newsletterRepositoryUnavailableFormat, ErrNewsletterRepositoryUnavailable, err)
	}

	return upsertPendingSubscriptionInCollection(ctx, collection, input)
}

func upsertPendingSubscriptionInCollection(
	ctx context.Context,
	collection newsletterUpdater,
	input NewsletterPendingSubscription,
) error {
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

	_, err := collection.UpdateOne(ctx, bson.M{"email": input.Email}, update, options.Update().SetUpsert(true))
	return err
}

func (*newsletterMongoRepository) UpdatePendingSubscription(ctx context.Context, input NewsletterPendingSubscription) error {
	collection, err := getNewsletterCollection()
	if err != nil {
		return fmt.Errorf(newsletterRepositoryUnavailableFormat, ErrNewsletterRepositoryUnavailable, err)
	}

	return updatePendingSubscriptionInCollection(ctx, collection, input)
}

func updatePendingSubscriptionInCollection(
	ctx context.Context,
	collection newsletterUpdater,
	input NewsletterPendingSubscription,
) error {
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

	_, err := collection.UpdateOne(ctx, bson.M{"email": input.Email}, update)
	return err
}

func (*newsletterMongoRepository) ConfirmByTokenHash(ctx context.Context, tokenHash string, now time.Time) (bool, error) {
	collection, err := getNewsletterCollection()
	if err != nil {
		return false, fmt.Errorf(newsletterRepositoryUnavailableFormat, ErrNewsletterRepositoryUnavailable, err)
	}

	return confirmByTokenHashInCollection(ctx, collection, tokenHash, now)
}

func confirmByTokenHashInCollection(
	ctx context.Context,
	collection newsletterUpdater,
	tokenHash string,
	now time.Time,
) (bool, error) {
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

func (*newsletterMongoRepository) UnsubscribeByEmail(ctx context.Context, email string, now time.Time) error {
	collection, err := getNewsletterCollection()
	if err != nil {
		return fmt.Errorf(newsletterRepositoryUnavailableFormat, ErrNewsletterRepositoryUnavailable, err)
	}

	return unsubscribeByEmailInCollection(ctx, collection, email, now)
}

func unsubscribeByEmailInCollection(ctx context.Context, collection newsletterUpdater, email string, now time.Time) error {
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

	_, err := collection.UpdateOne(ctx, bson.M{"email": email}, update)
	return err
}
