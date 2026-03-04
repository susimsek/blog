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

type AdminUserRepository interface {
	FindByEmail(ctx context.Context, email string) (*domain.AdminUserRecord, error)
	FindByID(ctx context.Context, id string) (*domain.AdminUserRecord, error)
	FindByUsername(ctx context.Context, username string) (*domain.AdminUserRecord, error)
	UpdatePasswordHashByID(ctx context.Context, id, passwordHash string) error
}

var (
	ErrAdminUserRepositoryUnavailable = errors.New("admin user repository unavailable")
	ErrAdminUserNotFound              = errors.New("admin user not found")
)

const (
	adminUsersCollectionName              = "admin_users"
	adminUsersRepositoryUnavailableFormat = "%w: %v"
)

type adminMongoRepository struct{}

var (
	adminMongoClient     *mongo.Client
	adminMongoInitErr    error
	adminMongoClientOnce sync.Once

	adminUserIndexesOnce sync.Once
	adminUserIndexesErr  error
)

func NewAdminUserRepository() AdminUserRepository { return &adminMongoRepository{} }

func (*adminMongoRepository) FindByEmail(ctx context.Context, email string) (*domain.AdminUserRecord, error) {
	collection, err := getAdminUsersCollection()
	if err != nil {
		return nil, fmt.Errorf(adminUsersRepositoryUnavailableFormat, ErrAdminUserRepositoryUnavailable, err)
	}

	return findAdminUser(ctx, collection, bson.M{
		"email":  strings.TrimSpace(strings.ToLower(email)),
		"status": bson.M{"$ne": "disabled"},
	})
}

func (*adminMongoRepository) FindByID(ctx context.Context, id string) (*domain.AdminUserRecord, error) {
	collection, err := getAdminUsersCollection()
	if err != nil {
		return nil, fmt.Errorf(adminUsersRepositoryUnavailableFormat, ErrAdminUserRepositoryUnavailable, err)
	}

	return findAdminUser(ctx, collection, bson.M{
		"id":     strings.TrimSpace(id),
		"status": bson.M{"$ne": "disabled"},
	})
}

func (*adminMongoRepository) FindByUsername(ctx context.Context, username string) (*domain.AdminUserRecord, error) {
	collection, err := getAdminUsersCollection()
	if err != nil {
		return nil, fmt.Errorf(adminUsersRepositoryUnavailableFormat, ErrAdminUserRepositoryUnavailable, err)
	}

	return findAdminUser(ctx, collection, bson.M{
		"username": strings.TrimSpace(username),
		"status":   bson.M{"$ne": "disabled"},
	})
}

func (*adminMongoRepository) UpdatePasswordHashByID(ctx context.Context, id, passwordHash string) error {
	collection, err := getAdminUsersCollection()
	if err != nil {
		return fmt.Errorf(adminUsersRepositoryUnavailableFormat, ErrAdminUserRepositoryUnavailable, err)
	}

	result, err := collection.UpdateOne(
		ctx,
		bson.M{
			"id":     strings.TrimSpace(id),
			"status": bson.M{"$ne": "disabled"},
		},
		bson.M{
			"$set": bson.M{
				"passwordHash": strings.TrimSpace(passwordHash),
			},
			"$inc": bson.M{
				"passwordVersion": 1,
			},
		},
	)
	if err != nil {
		return err
	}
	if result.MatchedCount == 0 {
		return ErrAdminUserNotFound
	}

	return nil
}

func getAdminMongoClient() (*mongo.Client, error) {
	adminMongoClientOnce.Do(func() {
		databaseConfig, err := appconfig.ResolveDatabaseConfig()
		if err != nil {
			adminMongoInitErr = err
			return
		}

		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		client, err := appconfig.NewMongoClient(ctx, databaseConfig, "blog-api-admin-users")
		if err != nil {
			adminMongoInitErr = fmt.Errorf("mongodb connect failed: %w", err)
			return
		}

		adminMongoClient = client
	})

	if adminMongoInitErr != nil {
		return nil, adminMongoInitErr
	}

	return adminMongoClient, nil
}

func getAdminUsersCollection() (*mongo.Collection, error) {
	databaseConfig, err := appconfig.ResolveDatabaseConfig()
	if err != nil {
		return nil, err
	}

	client, err := getAdminMongoClient()
	if err != nil {
		return nil, err
	}

	collection := client.Database(databaseConfig.Name).Collection(adminUsersCollectionName)
	if err := ensureAdminUserIndexes(collection); err != nil {
		return nil, err
	}

	return collection, nil
}

func ensureAdminUserIndexes(collection *mongo.Collection) error {
	adminUserIndexesOnce.Do(func() {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		indexes := []mongo.IndexModel{
			{
				Keys:    bson.D{{Key: "id", Value: 1}},
				Options: options.Index().SetUnique(true).SetName("uniq_admin_user_id"),
			},
			{
				Keys:    bson.D{{Key: "email", Value: 1}},
				Options: options.Index().SetUnique(true).SetName("uniq_admin_user_email"),
			},
			{
				Keys: bson.D{{Key: "username", Value: 1}},
				Options: options.Index().
					SetUnique(true).
					SetName("uniq_admin_user_username").
					SetPartialFilterExpression(bson.M{
						"username": bson.M{
							"$exists": true,
							"$type":   "string",
						},
					}),
			},
			{
				Keys:    bson.D{{Key: "status", Value: 1}},
				Options: options.Index().SetName("idx_admin_user_status"),
			},
		}

		if _, err := collection.Indexes().CreateMany(ctx, indexes); err != nil {
			adminUserIndexesErr = fmt.Errorf("create admin user index failed: %w", err)
		}
	})

	return adminUserIndexesErr
}

func findAdminUser(ctx context.Context, collection *mongo.Collection, filter bson.M) (*domain.AdminUserRecord, error) {
	var doc struct {
		ID              string   `bson:"id"`
		Username        string   `bson:"username"`
		Email           string   `bson:"email"`
		PasswordHash    string   `bson:"passwordHash"`
		PasswordVersion int64    `bson:"passwordVersion"`
		Roles           []string `bson:"roles"`
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

	roles := doc.Roles
	if len(roles) == 0 {
		roles = []string{"admin"}
	}

	return &domain.AdminUserRecord{
		AdminUser: domain.AdminUser{
			ID:       doc.ID,
			Username: strings.TrimSpace(doc.Username),
			Email:    strings.TrimSpace(strings.ToLower(doc.Email)),
			Roles:    roles,
		},
		PasswordHash:    strings.TrimSpace(doc.PasswordHash),
		PasswordVersion: doc.PasswordVersion,
	}, nil
}
