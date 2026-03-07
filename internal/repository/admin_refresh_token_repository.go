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
	ListActiveByUserID(ctx context.Context, userID string, now time.Time, limit int) ([]domain.AdminSessionRecord, error)
	Rotate(ctx context.Context, currentJTI string, replacement domain.AdminRefreshTokenRecord, now time.Time) error
	RevokeByJTIAndUserID(ctx context.Context, jti, userID string, now time.Time) (bool, error)
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
		"jti":         strings.TrimSpace(record.JTI),
		"userId":      strings.TrimSpace(record.UserID),
		"tokenHash":   strings.TrimSpace(record.TokenHash),
		"persistent":  record.Persistent,
		"userAgent":   strings.TrimSpace(record.UserAgent),
		"remoteIP":    strings.TrimSpace(record.RemoteIP),
		"countryCode": strings.TrimSpace(strings.ToUpper(record.CountryCode)),
		"lastSeenAt":  record.LastSeenAt,
		"expiresAt":   record.ExpiresAt,
		"createdAt":   record.CreatedAt,
		"replacedBy":  strings.TrimSpace(record.ReplacedBy),
	}
	if record.RotatedAt != nil {
		document["rotatedAt"] = record.RotatedAt
	}
	if record.RevokedAt != nil {
		document["revokedAt"] = record.RevokedAt
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
		JTI         string     `bson:"jti"`
		UserID      string     `bson:"userId"`
		TokenHash   string     `bson:"tokenHash"`
		Persistent  bool       `bson:"persistent"`
		UserAgent   string     `bson:"userAgent"`
		RemoteIP    string     `bson:"remoteIP"`
		CountryCode string     `bson:"countryCode"`
		LastSeenAt  time.Time  `bson:"lastSeenAt"`
		ExpiresAt   time.Time  `bson:"expiresAt"`
		CreatedAt   time.Time  `bson:"createdAt"`
		RotatedAt   *time.Time `bson:"rotatedAt"`
		RevokedAt   *time.Time `bson:"revokedAt"`
		ReplacedBy  string     `bson:"replacedBy"`
	}

	filter := bson.M{
		"$and": bson.A{
			bson.M{"jti": strings.TrimSpace(jti)},
			bson.M{"expiresAt": bson.M{"$gt": now}},
			unsetOrNullFilter("revokedAt"),
			unsetOrNullFilter("rotatedAt"),
		},
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
		JTI:         document.JTI,
		UserID:      document.UserID,
		TokenHash:   document.TokenHash,
		Persistent:  document.Persistent,
		UserAgent:   document.UserAgent,
		RemoteIP:    document.RemoteIP,
		CountryCode: strings.TrimSpace(strings.ToUpper(document.CountryCode)),
		LastSeenAt:  document.LastSeenAt,
		ExpiresAt:   document.ExpiresAt,
		CreatedAt:   document.CreatedAt,
		RotatedAt:   document.RotatedAt,
		RevokedAt:   document.RevokedAt,
		ReplacedBy:  document.ReplacedBy,
	}, nil
}

func (*adminRefreshTokenMongoRepository) ListActiveByUserID(
	ctx context.Context,
	userID string,
	now time.Time,
	limit int,
) ([]domain.AdminSessionRecord, error) {
	collection, err := getAdminRefreshTokensCollection()
	if err != nil {
		return nil, fmt.Errorf(adminRefreshTokenRepositoryUnavailableFormat, ErrAdminRefreshTokenRepositoryUnavailable, err)
	}

	resolvedLimit := limit
	if resolvedLimit <= 0 || resolvedLimit > 100 {
		resolvedLimit = 20
	}

	cursor, err := collection.Find(
		ctx,
		bson.M{
			"$and": bson.A{
				bson.M{"userId": strings.TrimSpace(userID)},
				bson.M{"expiresAt": bson.M{"$gt": now}},
				unsetOrNullFilter("revokedAt"),
				unsetOrNullFilter("rotatedAt"),
			},
		},
		options.Find().
			SetSort(bson.D{{Key: "lastSeenAt", Value: -1}, {Key: "createdAt", Value: -1}}).
			SetLimit(int64(resolvedLimit)).
			SetProjection(bson.M{
				"jti":         1,
				"userAgent":   1,
				"remoteIP":    1,
				"countryCode": 1,
				"lastSeenAt":  1,
				"createdAt":   1,
				"expiresAt":   1,
				"persistent":  1,
			}),
	)
	if err != nil {
		return nil, err
	}
	defer func() {
		_ = cursor.Close(ctx)
	}()

	type sessionDoc struct {
		JTI         string    `bson:"jti"`
		UserAgent   string    `bson:"userAgent"`
		RemoteIP    string    `bson:"remoteIP"`
		CountryCode string    `bson:"countryCode"`
		LastSeenAt  time.Time `bson:"lastSeenAt"`
		CreatedAt   time.Time `bson:"createdAt"`
		ExpiresAt   time.Time `bson:"expiresAt"`
		Persistent  bool      `bson:"persistent"`
	}

	sessions := make([]domain.AdminSessionRecord, 0, resolvedLimit)
	for cursor.Next(ctx) {
		var doc sessionDoc
		if err := cursor.Decode(&doc); err != nil {
			return nil, err
		}

		sessions = append(sessions, domain.AdminSessionRecord{
			ID:          strings.TrimSpace(doc.JTI),
			UserAgent:   strings.TrimSpace(doc.UserAgent),
			RemoteIP:    strings.TrimSpace(doc.RemoteIP),
			CountryCode: strings.TrimSpace(strings.ToUpper(doc.CountryCode)),
			LastSeenAt:  doc.LastSeenAt,
			CreatedAt:   doc.CreatedAt,
			ExpiresAt:   doc.ExpiresAt,
			Persistent:  doc.Persistent,
		})
	}

	if err := cursor.Err(); err != nil {
		return nil, err
	}

	return sessions, nil
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
		"jti":         strings.TrimSpace(replacement.JTI),
		"userId":      strings.TrimSpace(replacement.UserID),
		"tokenHash":   strings.TrimSpace(replacement.TokenHash),
		"persistent":  replacement.Persistent,
		"userAgent":   strings.TrimSpace(replacement.UserAgent),
		"remoteIP":    strings.TrimSpace(replacement.RemoteIP),
		"countryCode": strings.TrimSpace(strings.ToUpper(replacement.CountryCode)),
		"lastSeenAt":  replacement.LastSeenAt,
		"expiresAt":   replacement.ExpiresAt,
		"createdAt":   replacement.CreatedAt,
		"replacedBy":  strings.TrimSpace(replacement.ReplacedBy),
	}
	if replacement.RotatedAt != nil {
		replacementDocument["rotatedAt"] = replacement.RotatedAt
	}
	if replacement.RevokedAt != nil {
		replacementDocument["revokedAt"] = replacement.RevokedAt
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
			"$and": bson.A{
				bson.M{"jti": strings.TrimSpace(currentJTI)},
				unsetOrNullFilter("revokedAt"),
				unsetOrNullFilter("rotatedAt"),
			},
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

func (*adminRefreshTokenMongoRepository) RevokeByJTIAndUserID(
	ctx context.Context,
	jti string,
	userID string,
	now time.Time,
) (bool, error) {
	collection, err := getAdminRefreshTokensCollection()
	if err != nil {
		return false, fmt.Errorf(adminRefreshTokenRepositoryUnavailableFormat, ErrAdminRefreshTokenRepositoryUnavailable, err)
	}

	result, err := collection.UpdateOne(
		ctx,
		bson.M{
			"$and": bson.A{
				bson.M{"jti": strings.TrimSpace(jti)},
				bson.M{"userId": strings.TrimSpace(userID)},
				unsetOrNullFilter("revokedAt"),
				unsetOrNullFilter("rotatedAt"),
			},
		},
		bson.M{
			"$set": bson.M{
				"revokedAt": now,
			},
		},
	)
	if err != nil {
		return false, err
	}

	return result.MatchedCount > 0, nil
}

func (*adminRefreshTokenMongoRepository) RevokeByJTI(ctx context.Context, jti string, now time.Time) error {
	collection, err := getAdminRefreshTokensCollection()
	if err != nil {
		return fmt.Errorf(adminRefreshTokenRepositoryUnavailableFormat, ErrAdminRefreshTokenRepositoryUnavailable, err)
	}

	_, err = collection.UpdateOne(
		ctx,
		bson.M{
			"$and": bson.A{
				bson.M{"jti": strings.TrimSpace(jti)},
				unsetOrNullFilter("revokedAt"),
			},
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
			"$and": bson.A{
				bson.M{"userId": strings.TrimSpace(userID)},
				unsetOrNullFilter("revokedAt"),
			},
		},
		bson.M{
			"$set": bson.M{
				"revokedAt": now,
			},
		},
	)
	return err
}

func unsetOrNullFilter(field string) bson.M {
	return bson.M{
		"$or": bson.A{
			bson.M{field: bson.M{"$exists": false}},
			bson.M{field: nil},
		},
	}
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
				Keys:    bson.D{{Key: "userId", Value: 1}, {Key: "lastSeenAt", Value: -1}},
				Options: options.Index().SetName("idx_admin_refresh_token_user_last_seen"),
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
