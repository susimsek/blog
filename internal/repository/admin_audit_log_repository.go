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
	"suaybsimsek.com/blog-api/pkg/httpauth"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type AdminAuditLogRepository interface {
	Create(ctx context.Context, record domain.AdminAuditLogRecord) error
	ListRecentByResource(ctx context.Context, resource string, limit int) ([]domain.AdminAuditLogRecord, error)
}

var ErrAdminAuditLogRepositoryUnavailable = errors.New("admin audit log repository unavailable")

const (
	adminAuditLogCollectionName        = "admin_audit_logs"
	adminAuditLogRepositoryErrorFormat = "%w: %v"
)

type adminAuditLogMongoRepository struct{}

var (
	adminAuditLogIndexesOnce sync.Once
	adminAuditLogIndexesErr  error
)

func NewAdminAuditLogRepository() AdminAuditLogRepository { return &adminAuditLogMongoRepository{} }

func (*adminAuditLogMongoRepository) Create(ctx context.Context, record domain.AdminAuditLogRecord) error {
	collection, err := getAdminAuditLogCollection()
	if err != nil {
		return fmt.Errorf(adminAuditLogRepositoryErrorFormat, ErrAdminAuditLogRepositoryUnavailable, err)
	}

	createdAt := record.CreatedAt.UTC()
	if createdAt.IsZero() {
		createdAt = time.Now().UTC()
	}

	recordID := strings.TrimSpace(record.ID)
	if recordID == "" {
		id, err := httpauth.GenerateOpaqueToken(18)
		if err != nil {
			return err
		}
		recordID = id
	}

	document := bson.M{
		"id":          recordID,
		"actorId":     strings.TrimSpace(record.ActorID),
		"actorEmail":  strings.TrimSpace(strings.ToLower(record.ActorEmail)),
		"action":      strings.TrimSpace(record.Action),
		"resource":    strings.TrimSpace(record.Resource),
		"scope":       strings.TrimSpace(record.Scope),
		"locale":      strings.TrimSpace(strings.ToLower(record.Locale)),
		"code":        strings.TrimSpace(strings.ToUpper(record.Code)),
		"beforeValue": strings.TrimSpace(record.BeforeValue),
		"afterValue":  strings.TrimSpace(record.AfterValue),
		"status":      strings.TrimSpace(strings.ToLower(record.Status)),
		"failureCode": strings.TrimSpace(strings.ToUpper(record.FailureCode)),
		"requestId":   strings.TrimSpace(record.RequestID),
		"remoteIp":    strings.TrimSpace(record.RemoteIP),
		"countryCode": strings.TrimSpace(strings.ToUpper(record.CountryCode)),
		"userAgent":   strings.TrimSpace(record.UserAgent),
		"createdAt":   createdAt,
	}

	if _, err := collection.InsertOne(ctx, document); err != nil {
		return err
	}

	return nil
}

func (*adminAuditLogMongoRepository) ListRecentByResource(
	ctx context.Context,
	resource string,
	limit int,
) ([]domain.AdminAuditLogRecord, error) {
	collection, err := getAdminAuditLogCollection()
	if err != nil {
		return nil, fmt.Errorf(adminAuditLogRepositoryErrorFormat, ErrAdminAuditLogRepositoryUnavailable, err)
	}

	resolvedResource := strings.TrimSpace(resource)
	if resolvedResource == "" {
		return []domain.AdminAuditLogRecord{}, nil
	}

	resolvedLimit := limit
	if resolvedLimit <= 0 {
		resolvedLimit = 20
	}
	if resolvedLimit > 100 {
		resolvedLimit = 100
	}

	cursor, err := collection.Find(
		ctx,
		bson.M{"resource": resolvedResource},
		options.Find().SetSort(bson.D{{Key: "createdAt", Value: -1}}).SetLimit(int64(resolvedLimit)),
	)
	if err != nil {
		return nil, err
	}
	defer func() { _ = cursor.Close(ctx) }()

	records := make([]domain.AdminAuditLogRecord, 0)
	for cursor.Next(ctx) {
		var doc struct {
			ID          string    `bson:"id"`
			ActorID     string    `bson:"actorId"`
			ActorEmail  string    `bson:"actorEmail"`
			Action      string    `bson:"action"`
			Resource    string    `bson:"resource"`
			Scope       string    `bson:"scope"`
			Locale      string    `bson:"locale"`
			Code        string    `bson:"code"`
			BeforeValue string    `bson:"beforeValue"`
			AfterValue  string    `bson:"afterValue"`
			Status      string    `bson:"status"`
			FailureCode string    `bson:"failureCode"`
			RequestID   string    `bson:"requestId"`
			RemoteIP    string    `bson:"remoteIp"`
			CountryCode string    `bson:"countryCode"`
			UserAgent   string    `bson:"userAgent"`
			CreatedAt   time.Time `bson:"createdAt"`
		}
		if err := cursor.Decode(&doc); err != nil {
			return nil, err
		}

		record := domain.AdminAuditLogRecord{
			ID:          strings.TrimSpace(doc.ID),
			ActorID:     strings.TrimSpace(doc.ActorID),
			ActorEmail:  strings.TrimSpace(strings.ToLower(doc.ActorEmail)),
			Action:      strings.TrimSpace(doc.Action),
			Resource:    strings.TrimSpace(doc.Resource),
			Scope:       strings.TrimSpace(doc.Scope),
			Locale:      strings.TrimSpace(strings.ToLower(doc.Locale)),
			Code:        strings.TrimSpace(strings.ToUpper(doc.Code)),
			BeforeValue: strings.TrimSpace(doc.BeforeValue),
			AfterValue:  strings.TrimSpace(doc.AfterValue),
			Status:      strings.TrimSpace(strings.ToLower(doc.Status)),
			FailureCode: strings.TrimSpace(strings.ToUpper(doc.FailureCode)),
			RequestID:   strings.TrimSpace(doc.RequestID),
			RemoteIP:    strings.TrimSpace(doc.RemoteIP),
			CountryCode: strings.TrimSpace(strings.ToUpper(doc.CountryCode)),
			UserAgent:   strings.TrimSpace(doc.UserAgent),
			CreatedAt:   doc.CreatedAt,
		}
		if record.ID == "" || record.Resource == "" || record.Action == "" {
			continue
		}

		records = append(records, record)
	}

	if err := cursor.Err(); err != nil {
		return nil, err
	}

	return records, nil
}

func getAdminAuditLogCollection() (*mongo.Collection, error) {
	databaseConfig, err := appconfig.ResolveDatabaseConfig()
	if err != nil {
		return nil, err
	}

	client, err := getAdminMongoClient()
	if err != nil {
		return nil, err
	}

	collection := client.Database(databaseConfig.Name).Collection(adminAuditLogCollectionName)
	if err := ensureAdminAuditLogIndexes(collection); err != nil {
		return nil, err
	}

	return collection, nil
}

func ensureAdminAuditLogIndexes(collection *mongo.Collection) error {
	adminAuditLogIndexesOnce.Do(func() {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		indexes := []mongo.IndexModel{
			{
				Keys:    bson.D{{Key: "id", Value: 1}},
				Options: options.Index().SetUnique(true).SetName("uniq_admin_audit_log_id"),
			},
			{
				Keys: bson.D{
					{Key: "resource", Value: 1},
					{Key: "createdAt", Value: -1},
				},
				Options: options.Index().SetName("idx_admin_audit_log_resource_created"),
			},
			{
				Keys:    bson.D{{Key: "requestId", Value: 1}},
				Options: options.Index().SetName("idx_admin_audit_log_request"),
			},
		}

		if _, err := collection.Indexes().CreateMany(ctx, indexes); err != nil {
			adminAuditLogIndexesErr = fmt.Errorf("create admin audit log index failed: %w", err)
		}
	})

	return adminAuditLogIndexesErr
}
