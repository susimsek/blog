package repository

import (
	"context"
	"errors"
	"fmt"
	"regexp"
	"strings"
	"time"

	"suaybsimsek.com/blog-api/internal/domain"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var (
	ErrAdminNewsletterRepositoryUnavailable = errors.New("admin newsletter repository unavailable")
	ErrAdminNewsletterSubscriberNotFound    = errors.New("admin newsletter subscriber not found")
)

const adminNewsletterRepositoryUnavailableFormat = "%w: %v"

type AdminNewsletterRepository interface {
	ListSubscribers(
		ctx context.Context,
		filter domain.AdminNewsletterSubscriberFilter,
		page int,
		size int,
	) (*domain.AdminNewsletterSubscriberListResult, error)
	UpdateSubscriberStatusByEmail(
		ctx context.Context,
		email string,
		status string,
		now time.Time,
	) (*domain.AdminNewsletterSubscriberRecord, error)
	DeleteSubscriberByEmail(ctx context.Context, email string) (bool, error)
}

type adminNewsletterMongoRepository struct{}

func NewAdminNewsletterRepository() AdminNewsletterRepository {
	return &adminNewsletterMongoRepository{}
}

func (*adminNewsletterMongoRepository) ListSubscribers(
	ctx context.Context,
	filter domain.AdminNewsletterSubscriberFilter,
	page int,
	size int,
) (*domain.AdminNewsletterSubscriberListResult, error) {
	collection, err := getNewsletterCollection()
	if err != nil {
		return nil, fmt.Errorf(adminNewsletterRepositoryUnavailableFormat, ErrAdminNewsletterRepositoryUnavailable, err)
	}

	resolvedPage := max(1, page)
	resolvedSize := max(1, size)
	skip := int64((resolvedPage - 1) * resolvedSize)

	query := bson.M{}

	locale := strings.TrimSpace(strings.ToLower(filter.Locale))
	if locale != "" {
		query["locale"] = locale
	}

	status := strings.TrimSpace(strings.ToLower(filter.Status))
	if status != "" {
		query["status"] = status
	}

	searchQuery := strings.TrimSpace(filter.Query)
	if searchQuery != "" {
		escapedQuery := regexp.QuoteMeta(searchQuery)
		query["email"] = bson.M{
			"$regex":   escapedQuery,
			"$options": "i",
		}
	}

	totalCount, err := collection.CountDocuments(ctx, query)
	if err != nil {
		return nil, err
	}

	findOptions := options.Find().
		SetSort(bson.D{
			{Key: "updatedAt", Value: -1},
			{Key: "email", Value: 1},
		}).
		SetSkip(skip).
		SetLimit(int64(resolvedSize))

	cursor, err := collection.Find(ctx, query, findOptions)
	if err != nil {
		return nil, err
	}
	defer func() {
		_ = cursor.Close(ctx)
	}()

	items := make([]domain.AdminNewsletterSubscriberRecord, 0, resolvedSize)
	for cursor.Next(ctx) {
		record, decodeErr := decodeAdminNewsletterSubscriber(cursor)
		if decodeErr != nil {
			return nil, decodeErr
		}
		if record == nil {
			continue
		}
		items = append(items, *record)
	}
	if err := cursor.Err(); err != nil {
		return nil, err
	}

	return &domain.AdminNewsletterSubscriberListResult{
		Items: items,
		Total: int(totalCount),
		Page:  resolvedPage,
		Size:  resolvedSize,
	}, nil
}

func (*adminNewsletterMongoRepository) UpdateSubscriberStatusByEmail(
	ctx context.Context,
	email string,
	status string,
	now time.Time,
) (*domain.AdminNewsletterSubscriberRecord, error) {
	collection, err := getNewsletterCollection()
	if err != nil {
		return nil, fmt.Errorf(adminNewsletterRepositoryUnavailableFormat, ErrAdminNewsletterRepositoryUnavailable, err)
	}

	resolvedEmail := strings.TrimSpace(strings.ToLower(email))
	resolvedStatus := strings.TrimSpace(strings.ToLower(status))
	resolvedNow := now.UTC()

	updateFields := bson.M{
		"status":    resolvedStatus,
		"updatedAt": resolvedNow,
	}

	unsetFields := bson.M{}
	switch resolvedStatus {
	case "active":
		updateFields["confirmedAt"] = resolvedNow
		unsetFields["unsubscribedAt"] = ""
	case "unsubscribed":
		updateFields["unsubscribedAt"] = resolvedNow
	default:
		unsetFields["confirmedAt"] = ""
		unsetFields["unsubscribedAt"] = ""
	}

	update := bson.M{
		"$set": updateFields,
	}
	if len(unsetFields) > 0 {
		update["$unset"] = unsetFields
	}

	var updatedDoc struct {
		Email          string     `bson:"email"`
		Locale         string     `bson:"locale"`
		Status         string     `bson:"status"`
		Tags           []string   `bson:"tags"`
		FormName       string     `bson:"formName"`
		Source         string     `bson:"source"`
		UpdatedAt      time.Time  `bson:"updatedAt"`
		CreatedAt      time.Time  `bson:"createdAt"`
		ConfirmedAt    *time.Time `bson:"confirmedAt"`
		UnsubscribedAt *time.Time `bson:"unsubscribedAt"`
	}

	err = collection.FindOneAndUpdate(
		ctx,
		bson.M{"email": resolvedEmail},
		update,
		options.FindOneAndUpdate().SetReturnDocument(options.After),
	).Decode(&updatedDoc)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, ErrAdminNewsletterSubscriberNotFound
	}
	if err != nil {
		return nil, err
	}

	return normalizeAdminNewsletterRecord(
		updatedDoc.Email,
		updatedDoc.Locale,
		updatedDoc.Status,
		updatedDoc.Tags,
		updatedDoc.FormName,
		updatedDoc.Source,
		updatedDoc.UpdatedAt,
		updatedDoc.CreatedAt,
		updatedDoc.ConfirmedAt,
		updatedDoc.UnsubscribedAt,
	), nil
}

func (*adminNewsletterMongoRepository) DeleteSubscriberByEmail(ctx context.Context, email string) (bool, error) {
	collection, err := getNewsletterCollection()
	if err != nil {
		return false, fmt.Errorf(adminNewsletterRepositoryUnavailableFormat, ErrAdminNewsletterRepositoryUnavailable, err)
	}

	resolvedEmail := strings.TrimSpace(strings.ToLower(email))
	if resolvedEmail == "" {
		return false, errors.New("invalid subscriber email")
	}

	result, err := collection.DeleteOne(ctx, bson.M{"email": resolvedEmail})
	if err != nil {
		return false, err
	}

	return result.DeletedCount > 0, nil
}

func decodeAdminNewsletterSubscriber(cursor *mongo.Cursor) (*domain.AdminNewsletterSubscriberRecord, error) {
	var doc struct {
		Email          string     `bson:"email"`
		Locale         string     `bson:"locale"`
		Status         string     `bson:"status"`
		Tags           []string   `bson:"tags"`
		FormName       string     `bson:"formName"`
		Source         string     `bson:"source"`
		UpdatedAt      time.Time  `bson:"updatedAt"`
		CreatedAt      time.Time  `bson:"createdAt"`
		ConfirmedAt    *time.Time `bson:"confirmedAt"`
		UnsubscribedAt *time.Time `bson:"unsubscribedAt"`
	}
	if err := cursor.Decode(&doc); err != nil {
		return nil, err
	}

	return normalizeAdminNewsletterRecord(
		doc.Email,
		doc.Locale,
		doc.Status,
		doc.Tags,
		doc.FormName,
		doc.Source,
		doc.UpdatedAt,
		doc.CreatedAt,
		doc.ConfirmedAt,
		doc.UnsubscribedAt,
	), nil
}

func normalizeAdminNewsletterRecord(
	email string,
	locale string,
	status string,
	tags []string,
	formName string,
	source string,
	updatedAt time.Time,
	createdAt time.Time,
	confirmedAt *time.Time,
	unsubscribedAt *time.Time,
) *domain.AdminNewsletterSubscriberRecord {
	resolvedEmail := strings.TrimSpace(strings.ToLower(email))
	resolvedLocale := strings.TrimSpace(strings.ToLower(locale))
	resolvedStatus := strings.TrimSpace(strings.ToLower(status))
	if resolvedEmail == "" || resolvedLocale == "" || resolvedStatus == "" {
		return nil
	}

	resolvedTags := make([]string, 0, len(tags))
	for _, tag := range tags {
		trimmedTag := strings.TrimSpace(tag)
		if trimmedTag == "" {
			continue
		}
		resolvedTags = append(resolvedTags, trimmedTag)
	}

	return &domain.AdminNewsletterSubscriberRecord{
		Email:          resolvedEmail,
		Locale:         resolvedLocale,
		Status:         resolvedStatus,
		Tags:           resolvedTags,
		FormName:       strings.TrimSpace(formName),
		Source:         strings.TrimSpace(source),
		UpdatedAt:      updatedAt.UTC(),
		CreatedAt:      createdAt.UTC(),
		ConfirmedAt:    normalizeOptionalTime(confirmedAt),
		UnsubscribedAt: normalizeOptionalTime(unsubscribedAt),
	}
}

func normalizeOptionalTime(value *time.Time) *time.Time {
	if value == nil || value.IsZero() {
		return nil
	}
	normalized := value.UTC()
	return &normalized
}
