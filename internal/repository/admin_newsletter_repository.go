package repository

import (
	"context"
	"errors"
	"fmt"
	"net/url"
	"regexp"
	"strings"
	"time"

	appconfig "suaybsimsek.com/blog-api/internal/config"
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
	ListCampaigns(
		ctx context.Context,
		filter domain.AdminNewsletterCampaignFilter,
		page int,
		size int,
	) (*domain.AdminNewsletterCampaignListResult, error)
	ListDeliveryFailures(
		ctx context.Context,
		filter domain.AdminNewsletterDeliveryFailureFilter,
		page int,
		size int,
	) (*domain.AdminNewsletterDeliveryFailureListResult, error)
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

func (*adminNewsletterMongoRepository) ListCampaigns(
	ctx context.Context,
	filter domain.AdminNewsletterCampaignFilter,
	page int,
	size int,
) (*domain.AdminNewsletterCampaignListResult, error) {
	collection, err := getAdminNewsletterCampaignsCollection()
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
		query["$or"] = bson.A{
			bson.M{
				"title": bson.M{
					"$regex":   escapedQuery,
					"$options": "i",
				},
			},
			bson.M{
				"itemKey": bson.M{
					"$regex":   escapedQuery,
					"$options": "i",
				},
			},
		}
	}

	totalCount, err := collection.CountDocuments(ctx, query)
	if err != nil {
		return nil, err
	}

	findOptions := options.Find().
		SetSort(bson.D{
			{Key: "lastRunAt", Value: -1},
			{Key: "createdAt", Value: -1},
			{Key: "locale", Value: 1},
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

	items := make([]domain.AdminNewsletterCampaignRecord, 0, resolvedSize)
	for cursor.Next(ctx) {
		record, decodeErr := decodeAdminNewsletterCampaign(cursor)
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

	if err := enrichAdminNewsletterCampaignSummaries(ctx, items); err != nil {
		return nil, err
	}

	return &domain.AdminNewsletterCampaignListResult{
		Items: items,
		Total: int(totalCount),
		Page:  resolvedPage,
		Size:  resolvedSize,
	}, nil
}

func (*adminNewsletterMongoRepository) ListDeliveryFailures(
	ctx context.Context,
	filter domain.AdminNewsletterDeliveryFailureFilter,
	page int,
	size int,
) (*domain.AdminNewsletterDeliveryFailureListResult, error) {
	collection, err := getAdminNewsletterDeliveriesCollection()
	if err != nil {
		return nil, fmt.Errorf(adminNewsletterRepositoryUnavailableFormat, ErrAdminNewsletterRepositoryUnavailable, err)
	}

	resolvedPage := max(1, page)
	resolvedSize := max(1, size)
	skip := int64((resolvedPage - 1) * resolvedSize)

	query := bson.M{
		"status":  "failed",
		"locale":  strings.TrimSpace(strings.ToLower(filter.Locale)),
		"itemKey": strings.TrimSpace(filter.ItemKey),
	}

	totalCount, err := collection.CountDocuments(ctx, query)
	if err != nil {
		return nil, err
	}

	findOptions := options.Find().
		SetSort(bson.D{
			{Key: "lastAttemptAt", Value: -1},
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

	items := make([]domain.AdminNewsletterDeliveryFailureRecord, 0, resolvedSize)
	for cursor.Next(ctx) {
		record, decodeErr := decodeAdminNewsletterDeliveryFailure(cursor)
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

	return &domain.AdminNewsletterDeliveryFailureListResult{
		Items: items,
		Total: int(totalCount),
		Page:  resolvedPage,
		Size:  resolvedSize,
	}, nil
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

func decodeAdminNewsletterCampaign(cursor *mongo.Cursor) (*domain.AdminNewsletterCampaignRecord, error) {
	var doc struct {
		Locale      string    `bson:"locale"`
		ItemKey     string    `bson:"itemKey"`
		Title       string    `bson:"title"`
		Summary     string    `bson:"summary"`
		Link        string    `bson:"link"`
		PubDate     string    `bson:"pubDate"`
		RSSURL      string    `bson:"rssURL"`
		Status      string    `bson:"status"`
		SentCount   int64     `bson:"sentCount"`
		FailedCount int64     `bson:"failedCount"`
		LastRunAt   time.Time `bson:"lastRunAt"`
		UpdatedAt   time.Time `bson:"updatedAt"`
		CreatedAt   time.Time `bson:"createdAt"`
	}
	if err := cursor.Decode(&doc); err != nil {
		return nil, err
	}

	if strings.TrimSpace(doc.Locale) == "" || strings.TrimSpace(doc.ItemKey) == "" {
		return nil, nil
	}

	return &domain.AdminNewsletterCampaignRecord{
		Locale:      strings.TrimSpace(strings.ToLower(doc.Locale)),
		ItemKey:     strings.TrimSpace(doc.ItemKey),
		Title:       strings.TrimSpace(doc.Title),
		Summary:     strings.TrimSpace(doc.Summary),
		Link:        strings.TrimSpace(doc.Link),
		PubDate:     strings.TrimSpace(doc.PubDate),
		RSSURL:      strings.TrimSpace(doc.RSSURL),
		Status:      strings.TrimSpace(strings.ToLower(doc.Status)),
		SentCount:   int(doc.SentCount),
		FailedCount: int(doc.FailedCount),
		LastRunAt:   doc.LastRunAt,
		UpdatedAt:   doc.UpdatedAt,
		CreatedAt:   doc.CreatedAt,
	}, nil
}

func enrichAdminNewsletterCampaignSummaries(ctx context.Context, items []domain.AdminNewsletterCampaignRecord) error {
	if len(items) == 0 {
		return nil
	}

	collection, err := getPostContentCollection()
	if err != nil {
		return err
	}

	postIDsByLocale := make(map[string][]string)
	for _, item := range items {
		if strings.TrimSpace(item.Summary) != "" {
			continue
		}

		postID := extractAdminNewsletterPostIDFromLink(item.Link)
		locale := strings.TrimSpace(strings.ToLower(item.Locale))
		if postID == "" || locale == "" {
			continue
		}

		postIDsByLocale[locale] = append(postIDsByLocale[locale], postID)
	}

	if len(postIDsByLocale) == 0 {
		return nil
	}

	summariesByLocale := make(map[string]map[string]string, len(postIDsByLocale))
	for locale, postIDs := range postIDsByLocale {
		queryCtx, cancel := context.WithTimeout(ctx, 8*time.Second)
		cursor, findErr := collection.Find(queryCtx, bson.M{
			"locale": locale,
			"id": bson.M{
				"$in": uniqueAdminNewsletterPostIDs(postIDs),
			},
		}, options.Find().SetProjection(bson.M{
			"id":      1,
			"summary": 1,
		}))
		cancel()
		if findErr != nil {
			return findErr
		}

		localeSummaries := make(map[string]string)
		for cursor.Next(ctx) {
			var doc struct {
				ID      string `bson:"id"`
				Summary string `bson:"summary"`
			}
			if err := cursor.Decode(&doc); err != nil {
				_ = cursor.Close(ctx)
				return err
			}

			postID, ok := normalizePostID(doc.ID)
			if !ok {
				continue
			}
			summary := strings.TrimSpace(doc.Summary)
			if summary == "" {
				continue
			}
			localeSummaries[postID] = summary
		}
		if err := cursor.Err(); err != nil {
			_ = cursor.Close(ctx)
			return err
		}
		_ = cursor.Close(ctx)

		if len(localeSummaries) > 0 {
			summariesByLocale[locale] = localeSummaries
		}
	}

	for index := range items {
		if strings.TrimSpace(items[index].Summary) != "" {
			continue
		}

		postID := extractAdminNewsletterPostIDFromLink(items[index].Link)
		locale := strings.TrimSpace(strings.ToLower(items[index].Locale))
		if postID == "" || locale == "" {
			continue
		}

		if summary := summariesByLocale[locale][postID]; summary != "" {
			items[index].Summary = summary
		}
	}

	return nil
}

func extractAdminNewsletterPostIDFromLink(value string) string {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return ""
	}

	parsed, err := url.Parse(trimmed)
	pathValue := trimmed
	if err == nil {
		pathValue = parsed.Path
	}

	segments := strings.Split(strings.Trim(pathValue, "/"), "/")
	for index := 0; index < len(segments)-1; index++ {
		if segments[index] != "posts" {
			continue
		}
		decoded, decodeErr := url.PathUnescape(segments[index+1])
		if decodeErr != nil {
			decoded = segments[index+1]
		}
		postID, ok := normalizePostID(decoded)
		if ok {
			return postID
		}
		return ""
	}

	return ""
}

func uniqueAdminNewsletterPostIDs(values []string) []string {
	if len(values) == 0 {
		return nil
	}

	seen := make(map[string]struct{}, len(values))
	unique := make([]string, 0, len(values))
	for _, value := range values {
		postID, ok := normalizePostID(value)
		if !ok {
			continue
		}
		if _, exists := seen[postID]; exists {
			continue
		}
		seen[postID] = struct{}{}
		unique = append(unique, postID)
	}

	return unique
}

func decodeAdminNewsletterDeliveryFailure(cursor *mongo.Cursor) (*domain.AdminNewsletterDeliveryFailureRecord, error) {
	var doc struct {
		Locale        string    `bson:"locale"`
		ItemKey       string    `bson:"itemKey"`
		Email         string    `bson:"email"`
		Status        string    `bson:"status"`
		LastError     string    `bson:"lastError"`
		LastAttemptAt time.Time `bson:"lastAttemptAt"`
		UpdatedAt     time.Time `bson:"updatedAt"`
		CreatedAt     time.Time `bson:"createdAt"`
	}
	if err := cursor.Decode(&doc); err != nil {
		return nil, err
	}

	if strings.TrimSpace(doc.Locale) == "" || strings.TrimSpace(doc.ItemKey) == "" || strings.TrimSpace(doc.Email) == "" {
		return nil, nil
	}

	return &domain.AdminNewsletterDeliveryFailureRecord{
		Locale:        strings.TrimSpace(strings.ToLower(doc.Locale)),
		ItemKey:       strings.TrimSpace(doc.ItemKey),
		Email:         strings.TrimSpace(strings.ToLower(doc.Email)),
		Status:        strings.TrimSpace(strings.ToLower(doc.Status)),
		LastError:     strings.TrimSpace(doc.LastError),
		LastAttemptAt: doc.LastAttemptAt,
		UpdatedAt:     doc.UpdatedAt,
		CreatedAt:     doc.CreatedAt,
	}, nil
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

func getAdminNewsletterCampaignsCollection() (*mongo.Collection, error) {
	databaseConfig, err := appconfig.ResolveDatabaseConfig()
	if err != nil {
		return nil, err
	}

	client, err := getAdminMongoClient()
	if err != nil {
		return nil, err
	}

	return client.Database(databaseConfig.Name).Collection("newsletter_campaigns"), nil
}

func getAdminNewsletterDeliveriesCollection() (*mongo.Collection, error) {
	databaseConfig, err := appconfig.ResolveDatabaseConfig()
	if err != nil {
		return nil, err
	}

	client, err := getAdminMongoClient()
	if err != nil {
		return nil, err
	}

	return client.Database(databaseConfig.Name).Collection("newsletter_deliveries"), nil
}

func normalizeOptionalTime(value *time.Time) *time.Time {
	if value == nil || value.IsZero() {
		return nil
	}
	normalized := value.UTC()
	return &normalized
}
