package repository

import (
	"context"
	"errors"
	"fmt"
	"net/url"
	"strconv"
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
	FindByGoogleSubject(ctx context.Context, subject string) (*domain.AdminUserRecord, error)
	FindByGithubSubject(ctx context.Context, subject string) (*domain.AdminUserRecord, error)
	FindByPendingEmailChangeTokenHash(ctx context.Context, tokenHash string) (*domain.AdminUserRecord, error)
	HasAnyGoogleLink(ctx context.Context) (bool, error)
	HasAnyGithubLink(ctx context.Context) (bool, error)
	UpdatePasswordHashByID(ctx context.Context, id, passwordHash string) error
	UpdateNameByID(ctx context.Context, id, name string) error
	UpdateUsernameByID(ctx context.Context, id, username string) error
	SetPendingEmailChangeByID(ctx context.Context, id string, pending domain.AdminPendingEmailChange) error
	ClearPendingEmailChangeByID(ctx context.Context, id string) error
	UpdateEmailByID(ctx context.Context, id, email string) error
	UpdateGoogleLinkByID(ctx context.Context, id, subject, email string, linkedAt time.Time) error
	ClearGoogleLinkByID(ctx context.Context, id string) error
	UpdateGithubLinkByID(ctx context.Context, id, subject, email string, linkedAt time.Time) error
	ClearGithubLinkByID(ctx context.Context, id string) error
	UpdateAvatarByID(ctx context.Context, id, avatarURL, avatarDigest string, avatarVersion int64) error
	DisableByID(ctx context.Context, id string) error
}

var (
	ErrAdminUserRepositoryUnavailable = errors.New("admin user repository unavailable")
	ErrAdminUserNotFound              = errors.New("admin user not found")
	ErrAdminUsernameAlreadyExists     = errors.New("admin username already exists")
	ErrAdminEmailAlreadyExists        = errors.New("admin email already exists")
	ErrAdminGoogleAlreadyExists       = errors.New("admin google subject already exists")
	ErrAdminGithubAlreadyExists       = errors.New("admin github subject already exists")
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

func (*adminMongoRepository) FindByGoogleSubject(ctx context.Context, subject string) (*domain.AdminUserRecord, error) {
	collection, err := getAdminUsersCollection()
	if err != nil {
		return nil, fmt.Errorf(adminUsersRepositoryUnavailableFormat, ErrAdminUserRepositoryUnavailable, err)
	}

	return findAdminUser(ctx, collection, bson.M{
		"googleSubject": strings.TrimSpace(subject),
		"status":        bson.M{"$ne": "disabled"},
	})
}

func (*adminMongoRepository) FindByGithubSubject(ctx context.Context, subject string) (*domain.AdminUserRecord, error) {
	collection, err := getAdminUsersCollection()
	if err != nil {
		return nil, fmt.Errorf(adminUsersRepositoryUnavailableFormat, ErrAdminUserRepositoryUnavailable, err)
	}

	return findAdminUser(ctx, collection, bson.M{
		"githubSubject": strings.TrimSpace(subject),
		"status":        bson.M{"$ne": "disabled"},
	})
}

func (*adminMongoRepository) FindByPendingEmailChangeTokenHash(
	ctx context.Context,
	tokenHash string,
) (*domain.AdminUserRecord, error) {
	collection, err := getAdminUsersCollection()
	if err != nil {
		return nil, fmt.Errorf(adminUsersRepositoryUnavailableFormat, ErrAdminUserRepositoryUnavailable, err)
	}

	return findAdminUser(ctx, collection, bson.M{
		"pendingEmailChange.tokenHash": strings.TrimSpace(tokenHash),
		"status":                       bson.M{"$ne": "disabled"},
	})
}

func (*adminMongoRepository) HasAnyGoogleLink(ctx context.Context) (bool, error) {
	collection, err := getAdminUsersCollection()
	if err != nil {
		return false, fmt.Errorf(adminUsersRepositoryUnavailableFormat, ErrAdminUserRepositoryUnavailable, err)
	}

	count, err := collection.CountDocuments(ctx, bson.M{
		"googleSubject": bson.M{
			"$exists": true,
			"$type":   "string",
			"$ne":     "",
		},
		"status": bson.M{"$ne": "disabled"},
	}, options.Count().SetLimit(1))
	if err != nil {
		return false, err
	}

	return count > 0, nil
}

func (*adminMongoRepository) HasAnyGithubLink(ctx context.Context) (bool, error) {
	collection, err := getAdminUsersCollection()
	if err != nil {
		return false, fmt.Errorf(adminUsersRepositoryUnavailableFormat, ErrAdminUserRepositoryUnavailable, err)
	}

	count, err := collection.CountDocuments(ctx, bson.M{
		"githubSubject": bson.M{
			"$exists": true,
			"$type":   "string",
			"$ne":     "",
		},
		"status": bson.M{"$ne": "disabled"},
	}, options.Count().SetLimit(1))
	if err != nil {
		return false, err
	}

	return count > 0, nil
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

func (*adminMongoRepository) UpdateNameByID(ctx context.Context, id, name string) error {
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
				"name": strings.TrimSpace(name),
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

func (*adminMongoRepository) UpdateUsernameByID(ctx context.Context, id, username string) error {
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
				"username": strings.TrimSpace(username),
			},
		},
	)
	if err != nil {
		if mongo.IsDuplicateKeyError(err) {
			return ErrAdminUsernameAlreadyExists
		}
		return err
	}
	if result.MatchedCount == 0 {
		return ErrAdminUserNotFound
	}

	return nil
}

func (*adminMongoRepository) SetPendingEmailChangeByID(
	ctx context.Context,
	id string,
	pending domain.AdminPendingEmailChange,
) error {
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
				"pendingEmailChange": bson.M{
					"newEmail":    strings.TrimSpace(strings.ToLower(pending.NewEmail)),
					"tokenHash":   strings.TrimSpace(pending.TokenHash),
					"locale":      strings.TrimSpace(strings.ToLower(pending.Locale)),
					"requestedAt": pending.RequestedAt,
					"expiresAt":   pending.ExpiresAt,
				},
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

func (*adminMongoRepository) ClearPendingEmailChangeByID(ctx context.Context, id string) error {
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
			"$unset": bson.M{
				"pendingEmailChange": "",
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

func (*adminMongoRepository) UpdateEmailByID(ctx context.Context, id, email string) error {
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
				"email": strings.TrimSpace(strings.ToLower(email)),
			},
			"$unset": bson.M{
				"pendingEmailChange": "",
			},
			"$inc": bson.M{
				"passwordVersion": 1,
			},
		},
	)
	if err != nil {
		if mongo.IsDuplicateKeyError(err) {
			return ErrAdminEmailAlreadyExists
		}
		return err
	}
	if result.MatchedCount == 0 {
		return ErrAdminUserNotFound
	}

	return nil
}

func (*adminMongoRepository) UpdateGoogleLinkByID(
	ctx context.Context,
	id, subject, email string,
	linkedAt time.Time,
) error {
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
				"googleSubject":  strings.TrimSpace(subject),
				"googleEmail":    strings.TrimSpace(strings.ToLower(email)),
				"googleLinkedAt": linkedAt.UTC(),
			},
		},
	)
	if err != nil {
		if mongo.IsDuplicateKeyError(err) {
			return ErrAdminGoogleAlreadyExists
		}
		return err
	}
	if result.MatchedCount == 0 {
		return ErrAdminUserNotFound
	}

	return nil
}

func (*adminMongoRepository) ClearGoogleLinkByID(ctx context.Context, id string) error {
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
			"$unset": bson.M{
				"googleSubject":  "",
				"googleEmail":    "",
				"googleLinkedAt": "",
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

func (*adminMongoRepository) UpdateGithubLinkByID(
	ctx context.Context,
	id, subject, email string,
	linkedAt time.Time,
) error {
	collection, err := getAdminUsersCollection()
	if err != nil {
		return fmt.Errorf(adminUsersRepositoryUnavailableFormat, ErrAdminUserRepositoryUnavailable, err)
	}

	setFields := bson.M{
		"githubSubject":  strings.TrimSpace(subject),
		"githubLinkedAt": linkedAt.UTC(),
	}
	if strings.TrimSpace(email) != "" {
		setFields["githubEmail"] = strings.TrimSpace(strings.ToLower(email))
	} else {
		setFields["githubEmail"] = ""
	}

	result, err := collection.UpdateOne(
		ctx,
		bson.M{
			"id":     strings.TrimSpace(id),
			"status": bson.M{"$ne": "disabled"},
		},
		bson.M{
			"$set": setFields,
		},
	)
	if err != nil {
		if mongo.IsDuplicateKeyError(err) {
			return ErrAdminGithubAlreadyExists
		}
		return err
	}
	if result.MatchedCount == 0 {
		return ErrAdminUserNotFound
	}

	return nil
}

func (*adminMongoRepository) ClearGithubLinkByID(ctx context.Context, id string) error {
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
			"$unset": bson.M{
				"githubSubject":  "",
				"githubEmail":    "",
				"githubLinkedAt": "",
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

func (*adminMongoRepository) UpdateAvatarByID(
	ctx context.Context,
	id,
	avatarURL,
	avatarDigest string,
	avatarVersion int64,
) error {
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
				"avatarUrl":     strings.TrimSpace(avatarURL),
				"avatarDigest":  strings.TrimSpace(avatarDigest),
				"avatarVersion": avatarVersion,
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

func (*adminMongoRepository) DisableByID(ctx context.Context, id string) error {
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
				"status":     "disabled",
				"disabledAt": time.Now().UTC(),
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
				Keys: bson.D{{Key: "googleSubject", Value: 1}},
				Options: options.Index().
					SetUnique(true).
					SetName("uniq_admin_user_google_subject").
					SetPartialFilterExpression(bson.M{
						"googleSubject": bson.M{
							"$exists": true,
							"$type":   "string",
						},
					}),
			},
			{
				Keys: bson.D{{Key: "githubSubject", Value: 1}},
				Options: options.Index().
					SetUnique(true).
					SetName("uniq_admin_user_github_subject").
					SetPartialFilterExpression(bson.M{
						"githubSubject": bson.M{
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
		ID                 string     `bson:"id"`
		Name               string     `bson:"name"`
		Username           string     `bson:"username"`
		AvatarURL          string     `bson:"avatarUrl"`
		AvatarDigest       string     `bson:"avatarDigest"`
		AvatarVersion      int64      `bson:"avatarVersion"`
		Email              string     `bson:"email"`
		GoogleSubject      string     `bson:"googleSubject"`
		GoogleEmail        string     `bson:"googleEmail"`
		GithubSubject      string     `bson:"githubSubject"`
		GithubEmail        string     `bson:"githubEmail"`
		PasswordHash       string     `bson:"passwordHash"`
		PasswordVersion    int64      `bson:"passwordVersion"`
		Roles              []string   `bson:"roles"`
		GoogleLinkedAt     *time.Time `bson:"googleLinkedAt"`
		GithubLinkedAt     *time.Time `bson:"githubLinkedAt"`
		PendingEmailChange *struct {
			NewEmail    string    `bson:"newEmail"`
			TokenHash   string    `bson:"tokenHash"`
			Locale      string    `bson:"locale"`
			RequestedAt time.Time `bson:"requestedAt"`
			ExpiresAt   time.Time `bson:"expiresAt"`
		} `bson:"pendingEmailChange"`
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

	var pendingEmail string
	var pendingEmailExpiresAt *time.Time
	var pendingChange *domain.AdminPendingEmailChange
	if doc.PendingEmailChange != nil {
		pendingEmail = strings.TrimSpace(strings.ToLower(doc.PendingEmailChange.NewEmail))
		expiresAt := doc.PendingEmailChange.ExpiresAt
		pendingEmailExpiresAt = &expiresAt
		pendingChange = &domain.AdminPendingEmailChange{
			NewEmail:    pendingEmail,
			TokenHash:   strings.TrimSpace(doc.PendingEmailChange.TokenHash),
			Locale:      strings.TrimSpace(strings.ToLower(doc.PendingEmailChange.Locale)),
			RequestedAt: doc.PendingEmailChange.RequestedAt,
			ExpiresAt:   doc.PendingEmailChange.ExpiresAt,
		}
	}

	return &domain.AdminUserRecord{
		AdminUser: domain.AdminUser{
			ID:                    doc.ID,
			Name:                  strings.TrimSpace(doc.Name),
			Username:              strings.TrimSpace(doc.Username),
			AvatarURL:             resolveAdminAvatarURL(doc.ID, doc.AvatarDigest, doc.AvatarVersion, doc.AvatarURL),
			AvatarDigest:          strings.TrimSpace(doc.AvatarDigest),
			AvatarVersion:         doc.AvatarVersion,
			Email:                 strings.TrimSpace(strings.ToLower(doc.Email)),
			PendingEmail:          pendingEmail,
			PendingEmailExpiresAt: pendingEmailExpiresAt,
			GoogleSubject:         strings.TrimSpace(doc.GoogleSubject),
			GoogleEmail:           strings.TrimSpace(strings.ToLower(doc.GoogleEmail)),
			GoogleLinkedAt:        doc.GoogleLinkedAt,
			GithubSubject:         strings.TrimSpace(doc.GithubSubject),
			GithubEmail:           strings.TrimSpace(strings.ToLower(doc.GithubEmail)),
			GithubLinkedAt:        doc.GithubLinkedAt,
			Roles:                 roles,
		},
		PasswordHash:       strings.TrimSpace(doc.PasswordHash),
		PasswordVersion:    doc.PasswordVersion,
		PendingEmailChange: pendingChange,
	}, nil
}

func resolveAdminAvatarURL(userID, digest string, version int64, legacyAvatarURL string) string {
	resolvedUserID := strings.TrimSpace(userID)
	resolvedDigest := strings.TrimSpace(digest)
	if resolvedUserID == "" || resolvedDigest == "" || version <= 0 {
		return strings.TrimSpace(legacyAvatarURL)
	}

	query := url.Values{}
	query.Set("id", resolvedUserID)
	query.Set("s", strconv.Itoa(256))
	query.Set("u", resolvedDigest)
	query.Set("v", strconv.FormatInt(version, 10))

	return "/api/admin-avatar?" + query.Encode()
}
