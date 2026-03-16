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

type ReaderRefreshTokenRepository interface {
	Create(ctx context.Context, record domain.ReaderRefreshTokenRecord) error
	FindActiveByToken(ctx context.Context, jti, rawToken string, now time.Time) (*domain.ReaderRefreshTokenRecord, error)
	Rotate(ctx context.Context, currentJTI string, replacement domain.ReaderRefreshTokenRecord, now time.Time) error
	RevokeByJTI(ctx context.Context, jti string, now time.Time) error
}

var (
	ErrReaderRefreshTokenRepositoryUnavailable = errors.New("reader refresh token repository unavailable")
	ErrReaderRefreshTokenNotFound              = errors.New("reader refresh token not found")
)

const (
	readerRefreshTokensCollectionName             = "reader_refresh_tokens"
	readerRefreshTokenRepositoryUnavailableFormat = "%w: %v"
)

type readerRefreshTokenMongoRepository struct{}

var (
	readerRefreshTokenIndexesOnce sync.Once
	readerRefreshTokenIndexesErr  error
)

func NewReaderRefreshTokenMongoRepository() ReaderRefreshTokenRepository {
	return &readerRefreshTokenMongoRepository{}
}

func (*readerRefreshTokenMongoRepository) Create(ctx context.Context, record domain.ReaderRefreshTokenRecord) error {
	collection, err := getReaderRefreshTokensCollection()
	if err != nil {
		return fmt.Errorf(readerRefreshTokenRepositoryUnavailableFormat, ErrReaderRefreshTokenRepositoryUnavailable, err)
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

func (*readerRefreshTokenMongoRepository) FindActiveByToken(
	ctx context.Context,
	jti string,
	rawToken string,
	now time.Time,
) (*domain.ReaderRefreshTokenRecord, error) {
	collection, err := getReaderRefreshTokensCollection()
	if err != nil {
		return nil, fmt.Errorf(readerRefreshTokenRepositoryUnavailableFormat, ErrReaderRefreshTokenRepositoryUnavailable, err)
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

	if !strings.EqualFold(document.TokenHash, HashReaderRefreshToken(rawToken)) {
		return nil, nil
	}

	return &domain.ReaderRefreshTokenRecord{
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

func (*readerRefreshTokenMongoRepository) Rotate(
	ctx context.Context,
	currentJTI string,
	replacement domain.ReaderRefreshTokenRecord,
	now time.Time,
) error {
	collection, err := getReaderRefreshTokensCollection()
	if err != nil {
		return fmt.Errorf(readerRefreshTokenRepositoryUnavailableFormat, ErrReaderRefreshTokenRepositoryUnavailable, err)
	}
	client, err := getAdminMongoClient()
	if err != nil {
		return fmt.Errorf(readerRefreshTokenRepositoryUnavailableFormat, ErrReaderRefreshTokenRepositoryUnavailable, err)
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
	}

	session, err := client.StartSession()
	if err != nil {
		return err
	}
	defer session.EndSession(ctx)

	_, err = session.WithTransaction(ctx, func(sessionContext mongo.SessionContext) (any, error) {
		updateResult, updateErr := collection.UpdateOne(
			sessionContext,
			bson.M{
				"$and": bson.A{
					bson.M{"jti": strings.TrimSpace(currentJTI)},
					bson.M{"expiresAt": bson.M{"$gt": now}},
					unsetOrNullFilter("revokedAt"),
					unsetOrNullFilter("rotatedAt"),
				},
			},
			bson.M{
				"$set": bson.M{
					"rotatedAt":  now,
					"replacedBy": strings.TrimSpace(replacement.JTI),
				},
			},
		)
		if updateErr != nil {
			return nil, updateErr
		}
		if updateResult.MatchedCount == 0 {
			return nil, ErrReaderRefreshTokenNotFound
		}

		if _, insertErr := collection.InsertOne(sessionContext, replacementDocument); insertErr != nil {
			return nil, insertErr
		}

		return nil, nil
	})
	return err
}

func (*readerRefreshTokenMongoRepository) RevokeByJTI(ctx context.Context, jti string, now time.Time) error {
	collection, err := getReaderRefreshTokensCollection()
	if err != nil {
		return fmt.Errorf(readerRefreshTokenRepositoryUnavailableFormat, ErrReaderRefreshTokenRepositoryUnavailable, err)
	}

	_, err = collection.UpdateOne(
		ctx,
		bson.M{
			"jti": strings.TrimSpace(jti),
			"$and": bson.A{
				unsetOrNullFilter("revokedAt"),
			},
		},
		bson.M{"$set": bson.M{"revokedAt": now}},
	)
	return err
}

func getReaderRefreshTokensCollection() (*mongo.Collection, error) {
	databaseConfig, err := appconfig.ResolveDatabaseConfig()
	if err != nil {
		return nil, err
	}

	client, err := getAdminMongoClient()
	if err != nil {
		return nil, err
	}

	collection := client.Database(databaseConfig.Name).Collection(readerRefreshTokensCollectionName)
	if err := ensureReaderRefreshTokenIndexes(collection); err != nil {
		return nil, err
	}

	return collection, nil
}

func ensureReaderRefreshTokenIndexes(collection *mongo.Collection) error {
	readerRefreshTokenIndexesOnce.Do(func() {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		indexes := []mongo.IndexModel{
			{
				Keys:    bson.D{{Key: "jti", Value: 1}},
				Options: options.Index().SetUnique(true).SetName("uniq_reader_refresh_token_jti"),
			},
			{
				Keys:    bson.D{{Key: "userId", Value: 1}, {Key: "lastSeenAt", Value: -1}},
				Options: options.Index().SetName("idx_reader_refresh_token_user_last_seen"),
			},
			{
				Keys:    bson.D{{Key: "expiresAt", Value: 1}},
				Options: options.Index().SetName("idx_reader_refresh_token_expires"),
			},
		}

		if _, err := collection.Indexes().CreateMany(ctx, indexes); err != nil {
			readerRefreshTokenIndexesErr = fmt.Errorf("create reader refresh token index failed: %w", err)
		}
	})

	return readerRefreshTokenIndexesErr
}

func HashReaderRefreshToken(value string) string {
	sum := sha256.Sum256([]byte(strings.TrimSpace(value)))
	return hex.EncodeToString(sum[:])
}
