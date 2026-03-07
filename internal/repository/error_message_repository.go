package repository

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"sync"
	"time"

	appconfig "suaybsimsek.com/blog-api/internal/config"
	"suaybsimsek.com/blog-api/internal/domain"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type ErrorMessageRepository interface {
	ListByScope(ctx context.Context, scope string) ([]domain.ErrorMessageRecord, error)
	UpsertMany(ctx context.Context, records []domain.ErrorMessageRecord) error
}

var ErrErrorMessageRepositoryUnavailable = errors.New("error message repository unavailable")

const (
	errorMessagesCollectionName        = "error_message_catalog"
	errorMessageUnavailableErrorFormat = "%w: %v"
)

type errorMessageMongoRepository struct{}

var (
	errorMessageMongoClient     *mongo.Client
	errorMessageMongoInitErr    error
	errorMessageMongoClientOnce sync.Once

	errorMessageIndexesOnce sync.Once
	errorMessageIndexesErr  error
)

func NewErrorMessageRepository() ErrorMessageRepository { return &errorMessageMongoRepository{} }

func (*errorMessageMongoRepository) ListByScope(ctx context.Context, scope string) ([]domain.ErrorMessageRecord, error) {
	collection, err := getErrorMessagesCollection()
	if err != nil {
		return nil, fmt.Errorf(errorMessageUnavailableErrorFormat, ErrErrorMessageRepositoryUnavailable, err)
	}

	trimmedScope := strings.TrimSpace(scope)
	if trimmedScope == "" {
		return nil, nil
	}

	cursor, err := collection.Find(ctx, bson.M{"scope": trimmedScope})
	if err != nil {
		return nil, err
	}
	defer func() { _ = cursor.Close(ctx) }()

	records := make([]domain.ErrorMessageRecord, 0)
	for cursor.Next(ctx) {
		var doc struct {
			Scope     string    `bson:"scope"`
			Locale    string    `bson:"locale"`
			Code      string    `bson:"code"`
			Message   string    `bson:"message"`
			UpdatedAt time.Time `bson:"updatedAt"`
		}
		if err := cursor.Decode(&doc); err != nil {
			return nil, err
		}

		locale := strings.TrimSpace(strings.ToLower(doc.Locale))
		code := strings.TrimSpace(strings.ToUpper(doc.Code))
		message := strings.TrimSpace(doc.Message)
		if locale == "" || code == "" || message == "" {
			continue
		}

		records = append(records, domain.ErrorMessageRecord{
			Scope:     strings.TrimSpace(doc.Scope),
			Locale:    locale,
			Code:      code,
			Message:   message,
			UpdatedAt: doc.UpdatedAt,
		})
	}

	if err := cursor.Err(); err != nil {
		return nil, err
	}

	return records, nil
}

func (*errorMessageMongoRepository) UpsertMany(ctx context.Context, records []domain.ErrorMessageRecord) error {
	collection, err := getErrorMessagesCollection()
	if err != nil {
		return fmt.Errorf(errorMessageUnavailableErrorFormat, ErrErrorMessageRepositoryUnavailable, err)
	}
	if len(records) == 0 {
		return nil
	}

	models := make([]mongo.WriteModel, 0, len(records))
	for _, record := range records {
		scope := strings.TrimSpace(record.Scope)
		locale := strings.TrimSpace(strings.ToLower(record.Locale))
		code := strings.TrimSpace(strings.ToUpper(record.Code))
		message := strings.TrimSpace(record.Message)
		if scope == "" || locale == "" || code == "" || message == "" {
			continue
		}

		updatedAt := record.UpdatedAt.UTC()
		if updatedAt.IsZero() {
			updatedAt = time.Now().UTC()
		}

		models = append(models, mongo.NewUpdateOneModel().
			SetFilter(bson.M{
				"scope":  scope,
				"locale": locale,
				"code":   code,
			}).
			SetUpdate(bson.M{
				"$set": bson.M{
					"scope":     scope,
					"locale":    locale,
					"code":      code,
					"message":   message,
					"updatedAt": updatedAt,
				},
			}).
			SetUpsert(true),
		)
	}

	if len(models) == 0 {
		return nil
	}

	_, err = collection.BulkWrite(ctx, models, options.BulkWrite().SetOrdered(false))
	return err
}

func getErrorMessageMongoClient() (*mongo.Client, error) {
	errorMessageMongoClientOnce.Do(func() {
		databaseConfig, err := appconfig.ResolveDatabaseConfig()
		if err != nil {
			errorMessageMongoInitErr = err
			return
		}

		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		client, err := appconfig.NewMongoClient(ctx, databaseConfig, "blog-api-error-message-catalog")
		if err != nil {
			errorMessageMongoInitErr = fmt.Errorf("mongodb connect failed: %w", err)
			return
		}

		errorMessageMongoClient = client
	})

	if errorMessageMongoInitErr != nil {
		return nil, errorMessageMongoInitErr
	}

	return errorMessageMongoClient, nil
}

func getErrorMessagesCollection() (*mongo.Collection, error) {
	databaseConfig, err := appconfig.ResolveDatabaseConfig()
	if err != nil {
		return nil, err
	}

	client, err := getErrorMessageMongoClient()
	if err != nil {
		return nil, err
	}

	collection := client.Database(databaseConfig.Name).Collection(errorMessagesCollectionName)
	if err := ensureErrorMessageIndexes(collection); err != nil {
		return nil, err
	}

	return collection, nil
}

func ensureErrorMessageIndexes(collection *mongo.Collection) error {
	errorMessageIndexesOnce.Do(func() {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		indexes := []mongo.IndexModel{
			{
				Keys: bson.D{
					{Key: "scope", Value: 1},
					{Key: "locale", Value: 1},
					{Key: "code", Value: 1},
				},
				Options: options.Index().SetUnique(true).SetName("uniq_error_message_scope_locale_code"),
			},
			{
				Keys:    bson.D{{Key: "updatedAt", Value: -1}},
				Options: options.Index().SetName("idx_error_message_updated"),
			},
		}

		if _, err := collection.Indexes().CreateMany(ctx, indexes); err != nil {
			errorMessageIndexesErr = fmt.Errorf("create error message index failed: %w", err)
		}
	})

	return errorMessageIndexesErr
}
