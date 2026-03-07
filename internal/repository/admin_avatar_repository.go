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

type AdminAvatarRepository interface {
	UpsertByUserID(ctx context.Context, record domain.AdminAvatarRecord) error
	FindByUserID(ctx context.Context, userID string) (*domain.AdminAvatarRecord, error)
	DeleteByUserID(ctx context.Context, userID string) error
}

var ErrAdminAvatarRepositoryUnavailable = errors.New("admin avatar repository unavailable")

const (
	adminAvatarsCollectionName            = "admin_avatar_files"
	adminAvatarRepositoryUnavailableError = "%w: %v"
)

type adminAvatarMongoRepository struct{}

var (
	adminAvatarMongoClient     *mongo.Client
	adminAvatarMongoInitErr    error
	adminAvatarMongoClientOnce sync.Once

	adminAvatarIndexesOnce sync.Once
	adminAvatarIndexesErr  error
)

func NewAdminAvatarRepository() AdminAvatarRepository {
	return &adminAvatarMongoRepository{}
}

func (*adminAvatarMongoRepository) UpsertByUserID(ctx context.Context, record domain.AdminAvatarRecord) error {
	collection, err := getAdminAvatarsCollection()
	if err != nil {
		return fmt.Errorf(adminAvatarRepositoryUnavailableError, ErrAdminAvatarRepositoryUnavailable, err)
	}

	userID := strings.TrimSpace(record.UserID)
	if userID == "" {
		return errors.New("admin avatar user id is required")
	}

	variants := make([]bson.M, 0, len(record.Variants))
	for _, variant := range record.Variants {
		if variant.Size <= 0 || strings.TrimSpace(variant.ContentType) == "" || len(variant.Data) == 0 {
			continue
		}

		variants = append(variants, bson.M{
			"size":        variant.Size,
			"contentType": strings.TrimSpace(variant.ContentType),
			"data":        variant.Data,
		})
	}

	sourceContentType := strings.TrimSpace(record.Source.ContentType)
	sourceData := append([]byte(nil), record.Source.Data...)
	if sourceContentType == "" || len(sourceData) == 0 {
		return errors.New("admin avatar source is required")
	}

	updatedAt := record.UpdatedAt.UTC()
	if updatedAt.IsZero() {
		updatedAt = time.Now().UTC()
	}

	_, err = collection.UpdateOne(
		ctx,
		bson.M{"userId": userID},
		bson.M{
			"$set": bson.M{
				"userId":    userID,
				"digest":    strings.TrimSpace(record.Digest),
				"version":   record.Version,
				"updatedAt": updatedAt,
				"source": bson.M{
					"contentType": sourceContentType,
					"data":        sourceData,
				},
				"variants": variants,
			},
		},
		options.Update().SetUpsert(true),
	)

	return err
}

func (*adminAvatarMongoRepository) FindByUserID(ctx context.Context, userID string) (*domain.AdminAvatarRecord, error) {
	collection, err := getAdminAvatarsCollection()
	if err != nil {
		return nil, fmt.Errorf(adminAvatarRepositoryUnavailableError, ErrAdminAvatarRepositoryUnavailable, err)
	}

	var doc struct {
		UserID    string    `bson:"userId"`
		Digest    string    `bson:"digest"`
		Version   int64     `bson:"version"`
		UpdatedAt time.Time `bson:"updatedAt"`
		Source    struct {
			ContentType string `bson:"contentType"`
			Data        []byte `bson:"data"`
		} `bson:"source"`
		Variants []struct {
			Size        int    `bson:"size"`
			ContentType string `bson:"contentType"`
			Data        []byte `bson:"data"`
		} `bson:"variants"`
	}

	err = collection.FindOne(ctx, bson.M{"userId": strings.TrimSpace(userID)}).Decode(&doc)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	if strings.TrimSpace(doc.UserID) == "" {
		return nil, nil
	}
	variants := make([]domain.AdminAvatarVariant, 0, len(doc.Variants))
	sourceContentType := strings.TrimSpace(doc.Source.ContentType)
	sourceData := append([]byte(nil), doc.Source.Data...)
	sourceMaxSize := 0
	for _, variant := range doc.Variants {
		if variant.Size <= 0 || strings.TrimSpace(variant.ContentType) == "" || len(variant.Data) == 0 {
			continue
		}

		if (sourceContentType == "" || len(sourceData) == 0) && variant.Size > sourceMaxSize {
			sourceContentType = strings.TrimSpace(variant.ContentType)
			sourceData = append([]byte(nil), variant.Data...)
			sourceMaxSize = variant.Size
		}

		variants = append(variants, domain.AdminAvatarVariant{
			Size:        variant.Size,
			ContentType: strings.TrimSpace(variant.ContentType),
			Data:        append([]byte(nil), variant.Data...),
		})
	}
	if sourceContentType == "" || len(sourceData) == 0 {
		return nil, nil
	}

	return &domain.AdminAvatarRecord{
		UserID:  strings.TrimSpace(doc.UserID),
		Digest:  strings.TrimSpace(doc.Digest),
		Version: doc.Version,
		Source: domain.AdminAvatarSource{
			ContentType: sourceContentType,
			Data:        sourceData,
		},
		UpdatedAt: doc.UpdatedAt,
		Variants:  variants,
	}, nil
}

func (*adminAvatarMongoRepository) DeleteByUserID(ctx context.Context, userID string) error {
	collection, err := getAdminAvatarsCollection()
	if err != nil {
		return fmt.Errorf(adminAvatarRepositoryUnavailableError, ErrAdminAvatarRepositoryUnavailable, err)
	}

	_, err = collection.DeleteOne(ctx, bson.M{"userId": strings.TrimSpace(userID)})
	return err
}

func getAdminAvatarMongoClient() (*mongo.Client, error) {
	adminAvatarMongoClientOnce.Do(func() {
		databaseConfig, err := appconfig.ResolveDatabaseConfig()
		if err != nil {
			adminAvatarMongoInitErr = err
			return
		}

		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		client, err := appconfig.NewMongoClient(ctx, databaseConfig, "blog-api-admin-avatars")
		if err != nil {
			adminAvatarMongoInitErr = fmt.Errorf("mongodb connect failed: %w", err)
			return
		}

		adminAvatarMongoClient = client
	})

	if adminAvatarMongoInitErr != nil {
		return nil, adminAvatarMongoInitErr
	}

	return adminAvatarMongoClient, nil
}

func getAdminAvatarsCollection() (*mongo.Collection, error) {
	databaseConfig, err := appconfig.ResolveDatabaseConfig()
	if err != nil {
		return nil, err
	}

	client, err := getAdminAvatarMongoClient()
	if err != nil {
		return nil, err
	}

	collection := client.Database(databaseConfig.Name).Collection(adminAvatarsCollectionName)
	if err := ensureAdminAvatarIndexes(collection); err != nil {
		return nil, err
	}

	return collection, nil
}

func ensureAdminAvatarIndexes(collection *mongo.Collection) error {
	adminAvatarIndexesOnce.Do(func() {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		indexes := []mongo.IndexModel{
			{
				Keys:    bson.D{{Key: "userId", Value: 1}},
				Options: options.Index().SetUnique(true).SetName("uniq_admin_avatar_user"),
			},
			{
				Keys:    bson.D{{Key: "updatedAt", Value: -1}},
				Options: options.Index().SetName("idx_admin_avatar_updated"),
			},
		}

		if _, err := collection.Indexes().CreateMany(ctx, indexes); err != nil {
			adminAvatarIndexesErr = fmt.Errorf("create admin avatar index failed: %w", err)
		}
	})

	return adminAvatarIndexesErr
}
