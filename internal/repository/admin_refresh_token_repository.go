package repository

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
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

type AdminRefreshTokenRepository interface {
	Create(ctx context.Context, record domain.AdminRefreshTokenRecord) error
	FindActiveByToken(ctx context.Context, jti, rawToken string, now time.Time) (*domain.AdminRefreshTokenRecord, error)
	Rotate(ctx context.Context, currentJTI string, replacement domain.AdminRefreshTokenRecord, now time.Time) error
	RevokeByJTI(ctx context.Context, jti string, now time.Time) error
	RevokeAllByUserID(ctx context.Context, userID string, now time.Time) error
}

var (
	ErrAdminRefreshTokenRepositoryUnavailable = errors.New("admin refresh token repository unavailable")
	ErrAdminRefreshTokenNotFound              = errors.New("admin refresh token not found")
)

const (
	adminRefreshTokensCollectionName             = "admin_refresh_tokens"
	adminRefreshTokenRepositoryUnavailableFormat = "%w: %v"
)

type adminRefreshTokenMongoRepository struct{}

var (
	adminRefreshTokenMongoClient     *mongo.Client
	adminRefreshTokenMongoInitErr    error
	adminRefreshTokenMongoClientOnce sync.Once

	adminRefreshTokenIndexesOnce sync.Once
	adminRefreshTokenIndexesErr  error
)

func NewAdminRefreshTokenMongoRepository() AdminRefreshTokenRepository {
	return &adminRefreshTokenMongoRepository{}
}

func (*adminRefreshTokenMongoRepository) Create(ctx context.Context, record domain.AdminRefreshTokenRecord) error {
	collection, err := getAdminRefreshTokensCollection()
	if err != nil {
		return fmt.Errorf(adminRefreshTokenRepositoryUnavailableFormat, ErrAdminRefreshTokenRepositoryUnavailable, err)
	}

	document := bson.M{
		"jti":        strings.TrimSpace(record.JTI),
		"userId":     strings.TrimSpace(record.UserID),
		"tokenHash":  strings.TrimSpace(record.TokenHash),
		"persistent": record.Persistent,
		"expiresAt":  record.ExpiresAt,
		"createdAt":  record.CreatedAt,
		"rotatedAt":  record.RotatedAt,
		"revokedAt":  record.RevokedAt,
		"replacedBy": strings.TrimSpace(record.ReplacedBy),
	}

	_, err = collection.InsertOne(ctx, document)
	return err
}

func (*adminRefreshTokenMongoRepository) FindActiveByToken(
	ctx context.Context,
	jti string,
	rawToken string,
	now time.Time,
) (*domain.AdminRefreshTokenRecord, error) {
	collection, err := getAdminRefreshTokensCollection()
	if err != nil {
		return nil, fmt.Errorf(adminRefreshTokenRepositoryUnavailableFormat, ErrAdminRefreshTokenRepositoryUnavailable, err)
	}

	var document struct {
		JTI        string     `bson:"jti"`
		UserID     string     `bson:"userId"`
		TokenHash  string     `bson:"tokenHash"`
		Persistent bool       `bson:"persistent"`
		ExpiresAt  time.Time  `bson:"expiresAt"`
		CreatedAt  time.Time  `bson:"createdAt"`
		RotatedAt  *time.Time `bson:"rotatedAt"`
		RevokedAt  *time.Time `bson:"revokedAt"`
		ReplacedBy string     `bson:"replacedBy"`
	}

	filter := bson.M{
		"jti":       strings.TrimSpace(jti),
		"revokedAt": bson.M{"$exists": false},
		"rotatedAt": bson.M{"$exists": false},
		"expiresAt": bson.M{"$gt": now},
	}
	err = collection.FindOne(ctx, filter).Decode(&document)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	if !strings.EqualFold(document.TokenHash, HashAdminRefreshToken(rawToken)) {
		return nil, nil
	}

	return &domain.AdminRefreshTokenRecord{
		JTI:        document.JTI,
		UserID:     document.UserID,
		TokenHash:  document.TokenHash,
		Persistent: document.Persistent,
		ExpiresAt:  document.ExpiresAt,
		CreatedAt:  document.CreatedAt,
		RotatedAt:  document.RotatedAt,
		RevokedAt:  document.RevokedAt,
		ReplacedBy: document.ReplacedBy,
	}, nil
}

func (*adminRefreshTokenMongoRepository) Rotate(
	ctx context.Context,
	currentJTI string,
	replacement domain.AdminRefreshTokenRecord,
	now time.Time,
) error {
	collection, err := getAdminRefreshTokensCollection()
	if err != nil {
		return fmt.Errorf(adminRefreshTokenRepositoryUnavailableFormat, ErrAdminRefreshTokenRepositoryUnavailable, err)
	}

	replacementDocument := bson.M{
		"jti":        strings.TrimSpace(replacement.JTI),
		"userId":     strings.TrimSpace(replacement.UserID),
		"tokenHash":  strings.TrimSpace(replacement.TokenHash),
		"persistent": replacement.Persistent,
		"expiresAt":  replacement.ExpiresAt,
		"createdAt":  replacement.CreatedAt,
		"rotatedAt":  replacement.RotatedAt,
		"revokedAt":  replacement.RevokedAt,
		"replacedBy": strings.TrimSpace(replacement.ReplacedBy),
	}

	if _, err := collection.InsertOne(ctx, replacementDocument); err != nil {
		return err
	}

	update := bson.M{
		"$set": bson.M{
			"rotatedAt":  now,
			"replacedBy": strings.TrimSpace(replacement.JTI),
		},
	}

	result, err := collection.UpdateOne(
		ctx,
		bson.M{
			"jti":       strings.TrimSpace(currentJTI),
			"revokedAt": bson.M{"$exists": false},
			"rotatedAt": bson.M{"$exists": false},
		},
		update,
	)
	if err != nil {
		return err
	}
	if result.MatchedCount == 0 {
		_, _ = collection.DeleteOne(ctx, bson.M{"jti": strings.TrimSpace(replacement.JTI)})
		return ErrAdminRefreshTokenNotFound
	}

	return nil
}

func (*adminRefreshTokenMongoRepository) RevokeByJTI(ctx context.Context, jti string, now time.Time) error {
	collection, err := getAdminRefreshTokensCollection()
	if err != nil {
		return fmt.Errorf(adminRefreshTokenRepositoryUnavailableFormat, ErrAdminRefreshTokenRepositoryUnavailable, err)
	}

	_, err = collection.UpdateOne(
		ctx,
		bson.M{
			"jti":       strings.TrimSpace(jti),
			"revokedAt": bson.M{"$exists": false},
		},
		bson.M{
			"$set": bson.M{
				"revokedAt": now,
			},
		},
	)
	return err
}

func (*adminRefreshTokenMongoRepository) RevokeAllByUserID(ctx context.Context, userID string, now time.Time) error {
	collection, err := getAdminRefreshTokensCollection()
	if err != nil {
		return fmt.Errorf(adminRefreshTokenRepositoryUnavailableFormat, ErrAdminRefreshTokenRepositoryUnavailable, err)
	}

	_, err = collection.UpdateMany(
		ctx,
		bson.M{
			"userId":    strings.TrimSpace(userID),
			"revokedAt": bson.M{"$exists": false},
		},
		bson.M{
			"$set": bson.M{
				"revokedAt": now,
			},
		},
	)
	return err
}

func getAdminRefreshTokenMongoClient() (*mongo.Client, error) {
	adminRefreshTokenMongoClientOnce.Do(func() {
		databaseConfig, err := appconfig.ResolveDatabaseConfig()
		if err != nil {
			adminRefreshTokenMongoInitErr = err
			return
		}

		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		client, err := appconfig.NewMongoClient(ctx, databaseConfig, "blog-api-admin-refresh-tokens")
		if err != nil {
			adminRefreshTokenMongoInitErr = fmt.Errorf("mongodb connect failed: %w", err)
			return
		}

		adminRefreshTokenMongoClient = client
	})

	if adminRefreshTokenMongoInitErr != nil {
		return nil, adminRefreshTokenMongoInitErr
	}

	return adminRefreshTokenMongoClient, nil
}

func getAdminRefreshTokensCollection() (*mongo.Collection, error) {
	databaseConfig, err := appconfig.ResolveDatabaseConfig()
	if err != nil {
		return nil, err
	}

	client, err := getAdminRefreshTokenMongoClient()
	if err != nil {
		return nil, err
	}

	collection := client.Database(databaseConfig.Name).Collection(adminRefreshTokensCollectionName)
	if err := ensureAdminRefreshTokenIndexes(collection); err != nil {
		return nil, err
	}

	return collection, nil
}

func ensureAdminRefreshTokenIndexes(collection *mongo.Collection) error {
	adminRefreshTokenIndexesOnce.Do(func() {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		indexes := []mongo.IndexModel{
			{
				Keys:    bson.D{{Key: "jti", Value: 1}},
				Options: options.Index().SetUnique(true).SetName("uniq_admin_refresh_token_jti"),
			},
			{
				Keys:    bson.D{{Key: "userId", Value: 1}, {Key: "createdAt", Value: -1}},
				Options: options.Index().SetName("idx_admin_refresh_token_user_created"),
			},
			{
				Keys:    bson.D{{Key: "expiresAt", Value: 1}},
				Options: options.Index().SetName("ttl_admin_refresh_token_expires_at").SetExpireAfterSeconds(0),
			},
		}

		if _, err := collection.Indexes().CreateMany(ctx, indexes); err != nil {
			adminRefreshTokenIndexesErr = fmt.Errorf("create admin refresh token index failed: %w", err)
		}
	})

	return adminRefreshTokenIndexesErr
}

func HashAdminRefreshToken(value string) string {
	sum := sha256.Sum256([]byte(strings.TrimSpace(value)))
	return hex.EncodeToString(sum[:])
}
