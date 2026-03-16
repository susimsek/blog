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

type ReaderUserRepository interface {
	FindByID(ctx context.Context, id string) (*domain.ReaderUserRecord, error)
	FindByEmail(ctx context.Context, email string) (*domain.ReaderUserRecord, error)
	FindByGoogleSubject(ctx context.Context, subject string) (*domain.ReaderUserRecord, error)
	FindByGithubSubject(ctx context.Context, subject string) (*domain.ReaderUserRecord, error)
	Create(ctx context.Context, record domain.ReaderUserRecord) error
	UpdateGoogleIdentityByID(ctx context.Context, id, subject, email, name, avatarURL string, linkedAt time.Time) error
	UpdateGithubIdentityByID(ctx context.Context, id, subject, email, name, avatarURL string, linkedAt time.Time) error
	UpdateLastSeenProviderByID(ctx context.Context, id, provider string) error
}

var (
	ErrReaderUserRepositoryUnavailable = errors.New("reader user repository unavailable")
	ErrReaderUserNotFound              = errors.New("reader user not found")
	ErrReaderEmailAlreadyExists        = errors.New("reader email already exists")
	ErrReaderGoogleAlreadyExists       = errors.New("reader google subject already exists")
	ErrReaderGithubAlreadyExists       = errors.New("reader github subject already exists")
)

const (
	readerUsersCollectionName              = "reader_users"
	readerUsersRepositoryUnavailableFormat = "%w: %v"
)

type readerMongoRepository struct{}

var (
	readerUserIndexesOnce sync.Once
	readerUserIndexesErr  error
)

func NewReaderUserRepository() ReaderUserRepository {
	return &readerMongoRepository{}
}

func (*readerMongoRepository) FindByID(ctx context.Context, id string) (*domain.ReaderUserRecord, error) {
	collection, err := getReaderUsersCollection()
	if err != nil {
		return nil, fmt.Errorf(readerUsersRepositoryUnavailableFormat, ErrReaderUserRepositoryUnavailable, err)
	}

	return findReaderUser(ctx, collection, bson.M{
		"id":     strings.TrimSpace(id),
		"status": bson.M{"$ne": "disabled"},
	})
}

func (*readerMongoRepository) FindByEmail(ctx context.Context, email string) (*domain.ReaderUserRecord, error) {
	collection, err := getReaderUsersCollection()
	if err != nil {
		return nil, fmt.Errorf(readerUsersRepositoryUnavailableFormat, ErrReaderUserRepositoryUnavailable, err)
	}

	return findReaderUser(ctx, collection, bson.M{
		"email":  strings.TrimSpace(strings.ToLower(email)),
		"status": bson.M{"$ne": "disabled"},
	})
}

func (*readerMongoRepository) FindByGoogleSubject(ctx context.Context, subject string) (*domain.ReaderUserRecord, error) {
	collection, err := getReaderUsersCollection()
	if err != nil {
		return nil, fmt.Errorf(readerUsersRepositoryUnavailableFormat, ErrReaderUserRepositoryUnavailable, err)
	}

	return findReaderUser(ctx, collection, bson.M{
		"googleSubject": strings.TrimSpace(subject),
		"status":        bson.M{"$ne": "disabled"},
	})
}

func (*readerMongoRepository) FindByGithubSubject(ctx context.Context, subject string) (*domain.ReaderUserRecord, error) {
	collection, err := getReaderUsersCollection()
	if err != nil {
		return nil, fmt.Errorf(readerUsersRepositoryUnavailableFormat, ErrReaderUserRepositoryUnavailable, err)
	}

	return findReaderUser(ctx, collection, bson.M{
		"githubSubject": strings.TrimSpace(subject),
		"status":        bson.M{"$ne": "disabled"},
	})
}

func (*readerMongoRepository) Create(ctx context.Context, record domain.ReaderUserRecord) error {
	collection, err := getReaderUsersCollection()
	if err != nil {
		return fmt.Errorf(readerUsersRepositoryUnavailableFormat, ErrReaderUserRepositoryUnavailable, err)
	}

	document := bson.M{
		"id":                strings.TrimSpace(record.ID),
		"name":              strings.TrimSpace(record.Name),
		"email":             strings.TrimSpace(strings.ToLower(record.Email)),
		"avatarUrl":         strings.TrimSpace(record.AvatarURL),
		"lastLoginProvider": strings.TrimSpace(record.LastLoginProvider),
		"sessionVersion":    record.SessionVersion,
		"status":            "active",
		"createdAt":         time.Now().UTC(),
		"updatedAt":         time.Now().UTC(),
	}
	if googleSubject := strings.TrimSpace(record.GoogleSubject); googleSubject != "" {
		document["googleSubject"] = googleSubject
		document["googleEmail"] = strings.TrimSpace(strings.ToLower(record.GoogleEmail))
	}
	if githubSubject := strings.TrimSpace(record.GithubSubject); githubSubject != "" {
		document["githubSubject"] = githubSubject
		document["githubEmail"] = strings.TrimSpace(strings.ToLower(record.GithubEmail))
	}
	if record.GoogleLinkedAt != nil {
		document["googleLinkedAt"] = record.GoogleLinkedAt
	}
	if record.GithubLinkedAt != nil {
		document["githubLinkedAt"] = record.GithubLinkedAt
	}

	_, err = collection.InsertOne(ctx, document)
	if err != nil {
		if mongo.IsDuplicateKeyError(err) {
			if strings.TrimSpace(record.GoogleSubject) != "" {
				return ErrReaderGoogleAlreadyExists
			}
			if strings.TrimSpace(record.GithubSubject) != "" {
				return ErrReaderGithubAlreadyExists
			}
			return ErrReaderEmailAlreadyExists
		}
		return err
	}

	return nil
}

func (*readerMongoRepository) UpdateGoogleIdentityByID(
	ctx context.Context,
	id, subject, email, name, avatarURL string,
	linkedAt time.Time,
) error {
	collection, err := getReaderUsersCollection()
	if err != nil {
		return fmt.Errorf(readerUsersRepositoryUnavailableFormat, ErrReaderUserRepositoryUnavailable, err)
	}

	result, err := collection.UpdateOne(
		ctx,
		bson.M{"id": strings.TrimSpace(id), "status": bson.M{"$ne": "disabled"}},
		bson.M{
			"$set": bson.M{
				"name":              strings.TrimSpace(name),
				"email":             strings.TrimSpace(strings.ToLower(email)),
				"avatarUrl":         strings.TrimSpace(avatarURL),
				"googleSubject":     strings.TrimSpace(subject),
				"googleEmail":       strings.TrimSpace(strings.ToLower(email)),
				"googleLinkedAt":    linkedAt,
				"lastLoginProvider": "google",
				"updatedAt":         linkedAt,
			},
		},
	)
	if err != nil {
		if mongo.IsDuplicateKeyError(err) {
			return ErrReaderGoogleAlreadyExists
		}
		return err
	}
	if result.MatchedCount == 0 {
		return ErrReaderUserNotFound
	}

	return nil
}

func (*readerMongoRepository) UpdateGithubIdentityByID(
	ctx context.Context,
	id, subject, email, name, avatarURL string,
	linkedAt time.Time,
) error {
	collection, err := getReaderUsersCollection()
	if err != nil {
		return fmt.Errorf(readerUsersRepositoryUnavailableFormat, ErrReaderUserRepositoryUnavailable, err)
	}

	result, err := collection.UpdateOne(
		ctx,
		bson.M{"id": strings.TrimSpace(id), "status": bson.M{"$ne": "disabled"}},
		bson.M{
			"$set": bson.M{
				"name":              strings.TrimSpace(name),
				"email":             strings.TrimSpace(strings.ToLower(email)),
				"avatarUrl":         strings.TrimSpace(avatarURL),
				"githubSubject":     strings.TrimSpace(subject),
				"githubEmail":       strings.TrimSpace(strings.ToLower(email)),
				"githubLinkedAt":    linkedAt,
				"lastLoginProvider": "github",
				"updatedAt":         linkedAt,
			},
		},
	)
	if err != nil {
		if mongo.IsDuplicateKeyError(err) {
			return ErrReaderGithubAlreadyExists
		}
		return err
	}
	if result.MatchedCount == 0 {
		return ErrReaderUserNotFound
	}

	return nil
}

func (*readerMongoRepository) UpdateLastSeenProviderByID(ctx context.Context, id, provider string) error {
	collection, err := getReaderUsersCollection()
	if err != nil {
		return fmt.Errorf(readerUsersRepositoryUnavailableFormat, ErrReaderUserRepositoryUnavailable, err)
	}

	result, err := collection.UpdateOne(
		ctx,
		bson.M{"id": strings.TrimSpace(id), "status": bson.M{"$ne": "disabled"}},
		bson.M{
			"$set": bson.M{
				"lastLoginProvider": strings.TrimSpace(provider),
				"updatedAt":         time.Now().UTC(),
			},
		},
	)
	if err != nil {
		return err
	}
	if result.MatchedCount == 0 {
		return ErrReaderUserNotFound
	}

	return nil
}

func getReaderUsersCollection() (*mongo.Collection, error) {
	databaseConfig, err := appconfig.ResolveDatabaseConfig()
	if err != nil {
		return nil, err
	}

	client, err := getAdminMongoClient()
	if err != nil {
		return nil, err
	}

	collection := client.Database(databaseConfig.Name).Collection(readerUsersCollectionName)
	if err := ensureReaderUserIndexes(collection); err != nil {
		return nil, err
	}

	return collection, nil
}

func ensureReaderUserIndexes(collection *mongo.Collection) error {
	readerUserIndexesOnce.Do(func() {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		if _, err := collection.UpdateMany(
			ctx,
			bson.M{"googleSubject": ""},
			bson.M{
				"$unset": bson.M{
					"googleSubject":  "",
					"googleEmail":    "",
					"googleLinkedAt": "",
				},
			},
		); err != nil {
			readerUserIndexesErr = fmt.Errorf("clean reader google subject fields failed: %w", err)
			return
		}

		if _, err := collection.UpdateMany(
			ctx,
			bson.M{"githubSubject": ""},
			bson.M{
				"$unset": bson.M{
					"githubSubject":  "",
					"githubEmail":    "",
					"githubLinkedAt": "",
				},
			},
		); err != nil {
			readerUserIndexesErr = fmt.Errorf("clean reader github subject fields failed: %w", err)
			return
		}

		indexes := []mongo.IndexModel{
			{
				Keys:    bson.D{{Key: "id", Value: 1}},
				Options: options.Index().SetUnique(true).SetName("uniq_reader_user_id"),
			},
			{
				Keys:    bson.D{{Key: "email", Value: 1}},
				Options: options.Index().SetUnique(true).SetName("uniq_reader_user_email"),
			},
			{
				Keys: bson.D{{Key: "googleSubject", Value: 1}},
				Options: options.Index().
					SetUnique(true).
					SetName("uniq_reader_user_google_subject").
					SetPartialFilterExpression(bson.M{
						"googleSubject": bson.M{"$exists": true, "$type": "string"},
					}),
			},
			{
				Keys: bson.D{{Key: "githubSubject", Value: 1}},
				Options: options.Index().
					SetUnique(true).
					SetName("uniq_reader_user_github_subject").
					SetPartialFilterExpression(bson.M{
						"githubSubject": bson.M{"$exists": true, "$type": "string"},
					}),
			},
			{
				Keys:    bson.D{{Key: "status", Value: 1}},
				Options: options.Index().SetName("idx_reader_user_status"),
			},
		}

		if _, err := collection.Indexes().CreateMany(ctx, indexes); err != nil {
			readerUserIndexesErr = fmt.Errorf("create reader user index failed: %w", err)
		}
	})

	return readerUserIndexesErr
}

func findReaderUser(ctx context.Context, collection *mongo.Collection, filter bson.M) (*domain.ReaderUserRecord, error) {
	var doc struct {
		ID                string     `bson:"id"`
		Name              string     `bson:"name"`
		Email             string     `bson:"email"`
		AvatarURL         string     `bson:"avatarUrl"`
		LastLoginProvider string     `bson:"lastLoginProvider"`
		GoogleSubject     string     `bson:"googleSubject"`
		GoogleEmail       string     `bson:"googleEmail"`
		GoogleLinkedAt    *time.Time `bson:"googleLinkedAt"`
		GithubSubject     string     `bson:"githubSubject"`
		GithubEmail       string     `bson:"githubEmail"`
		GithubLinkedAt    *time.Time `bson:"githubLinkedAt"`
		SessionVersion    int64      `bson:"sessionVersion"`
	}

	err := collection.FindOne(ctx, filter).Decode(&doc)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	if doc.ID == "" || doc.Email == "" {
		return nil, nil
	}

	sessionVersion := doc.SessionVersion
	if sessionVersion <= 0 {
		sessionVersion = 1
	}

	return &domain.ReaderUserRecord{
		ReaderUser: domain.ReaderUser{
			ID:                strings.TrimSpace(doc.ID),
			Name:              strings.TrimSpace(doc.Name),
			Email:             strings.TrimSpace(strings.ToLower(doc.Email)),
			AvatarURL:         strings.TrimSpace(doc.AvatarURL),
			LastLoginProvider: strings.TrimSpace(doc.LastLoginProvider),
			GoogleSubject:     strings.TrimSpace(doc.GoogleSubject),
			GoogleEmail:       strings.TrimSpace(strings.ToLower(doc.GoogleEmail)),
			GoogleLinkedAt:    doc.GoogleLinkedAt,
			GithubSubject:     strings.TrimSpace(doc.GithubSubject),
			GithubEmail:       strings.TrimSpace(strings.ToLower(doc.GithubEmail)),
			GithubLinkedAt:    doc.GithubLinkedAt,
		},
		SessionVersion: sessionVersion,
	}, nil
}
