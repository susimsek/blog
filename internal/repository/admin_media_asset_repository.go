package repository

import (
	"context"
	"crypto/sha1"
	"encoding/hex"
	"errors"
	"fmt"
	"path"
	"regexp"
	"sort"
	"strings"
	"time"

	"suaybsimsek.com/blog-api/internal/domain"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var (
	ErrAdminMediaAssetRepositoryUnavailable = errors.New("admin media asset repository unavailable")
	ErrAdminMediaAssetNotFound              = errors.New("admin media asset not found")
)

const adminMediaAssetRepositoryUnavailableFormat = "%w: %v"

type AdminMediaAssetRepository interface {
	ListMediaLibraryItems(ctx context.Context, filter domain.AdminMediaLibraryFilter) ([]domain.AdminMediaLibraryItem, error)
	FindMediaAssetByID(ctx context.Context, id string) (*domain.AdminMediaAssetRecord, error)
	FindMediaAssetByDigest(ctx context.Context, digest string) (*domain.AdminMediaAssetRecord, error)
	CreateMediaAsset(ctx context.Context, record domain.AdminMediaAssetRecord) (*domain.AdminMediaAssetRecord, error)
}

type adminMediaAssetMongoRepository struct{}

func NewAdminMediaAssetRepository() AdminMediaAssetRepository {
	return &adminMediaAssetMongoRepository{}
}

func (*adminMediaAssetMongoRepository) ListMediaLibraryItems(
	ctx context.Context,
	filter domain.AdminMediaLibraryFilter,
) ([]domain.AdminMediaLibraryItem, error) {
	mediaCollection, err := getPostMediaAssetsCollection()
	if err != nil {
		return nil, fmt.Errorf(adminMediaAssetRepositoryUnavailableFormat, ErrAdminMediaAssetRepositoryUnavailable, err)
	}

	postsCollection, err := getPostContentCollection()
	if err != nil {
		return nil, fmt.Errorf(adminMediaAssetRepositoryUnavailableFormat, ErrAdminMediaAssetRepositoryUnavailable, err)
	}

	resolvedKind := strings.TrimSpace(strings.ToUpper(filter.Kind))
	items := make([]domain.AdminMediaLibraryItem, 0, 64)

	if resolvedKind == "" || resolvedKind == "ALL" || resolvedKind == "UPLOADED" {
		uploadedItems, uploadedErr := listUploadedMediaLibraryItems(ctx, mediaCollection, filter.Query)
		if uploadedErr != nil {
			return nil, uploadedErr
		}
		enrichMediaLibraryUsageCounts(ctx, postsCollection, uploadedItems)
		items = append(items, uploadedItems...)
	}

	if resolvedKind == "" || resolvedKind == "ALL" || resolvedKind == "REFERENCE" {
		referenceItems, referenceErr := listReferencedMediaLibraryItems(ctx, postsCollection, filter.Query)
		if referenceErr != nil {
			return nil, referenceErr
		}
		items = append(items, referenceItems...)
	}

	sort.SliceStable(items, func(left, right int) bool {
		leftUpdatedAt := items[left].UpdatedAt
		rightUpdatedAt := items[right].UpdatedAt
		switch {
		case !leftUpdatedAt.Equal(rightUpdatedAt):
			return leftUpdatedAt.After(rightUpdatedAt)
		case items[left].UsageCount != items[right].UsageCount:
			return items[left].UsageCount > items[right].UsageCount
		default:
			return strings.ToLower(items[left].Name) < strings.ToLower(items[right].Name)
		}
	})

	return items, nil
}

func (*adminMediaAssetMongoRepository) FindMediaAssetByID(
	ctx context.Context,
	id string,
) (*domain.AdminMediaAssetRecord, error) {
	mediaCollection, err := getPostMediaAssetsCollection()
	if err != nil {
		return nil, fmt.Errorf(adminMediaAssetRepositoryUnavailableFormat, ErrAdminMediaAssetRepositoryUnavailable, err)
	}

	var doc adminMediaAssetDocument
	err = mediaCollection.FindOne(
		ctx,
		bson.M{"id": strings.TrimSpace(id)},
	).Decode(&doc)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	record := mapAdminMediaAssetDocument(doc)
	return &record, nil
}

func (*adminMediaAssetMongoRepository) FindMediaAssetByDigest(
	ctx context.Context,
	digest string,
) (*domain.AdminMediaAssetRecord, error) {
	mediaCollection, err := getPostMediaAssetsCollection()
	if err != nil {
		return nil, fmt.Errorf(adminMediaAssetRepositoryUnavailableFormat, ErrAdminMediaAssetRepositoryUnavailable, err)
	}

	var doc adminMediaAssetDocument
	err = mediaCollection.FindOne(
		ctx,
		bson.M{"digest": strings.TrimSpace(strings.ToLower(digest))},
	).Decode(&doc)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	record := mapAdminMediaAssetDocument(doc)
	return &record, nil
}

func (*adminMediaAssetMongoRepository) CreateMediaAsset(
	ctx context.Context,
	record domain.AdminMediaAssetRecord,
) (*domain.AdminMediaAssetRecord, error) {
	mediaCollection, err := getPostMediaAssetsCollection()
	if err != nil {
		return nil, fmt.Errorf(adminMediaAssetRepositoryUnavailableFormat, ErrAdminMediaAssetRepositoryUnavailable, err)
	}

	now := record.CreatedAt.UTC()
	if now.IsZero() {
		now = time.Now().UTC()
	}
	updatedAt := record.UpdatedAt.UTC()
	if updatedAt.IsZero() {
		updatedAt = now
	}

	document := bson.M{
		"id":          strings.TrimSpace(record.ID),
		"name":        strings.TrimSpace(record.Name),
		"contentType": strings.TrimSpace(record.ContentType),
		"digest":      strings.TrimSpace(strings.ToLower(record.Digest)),
		"sizeBytes":   record.SizeBytes,
		"width":       record.Width,
		"height":      record.Height,
		"data":        append([]byte(nil), record.Data...),
		"createdBy":   strings.TrimSpace(record.CreatedBy),
		"createdAt":   now,
		"updatedAt":   updatedAt,
	}

	if _, err := mediaCollection.InsertOne(ctx, document); err != nil {
		return nil, err
	}

	created := record
	created.CreatedAt = now
	created.UpdatedAt = updatedAt
	return &created, nil
}

type adminMediaAssetDocument struct {
	ID          string    `bson:"id"`
	Name        string    `bson:"name"`
	ContentType string    `bson:"contentType"`
	Digest      string    `bson:"digest"`
	SizeBytes   int       `bson:"sizeBytes"`
	Width       int       `bson:"width"`
	Height      int       `bson:"height"`
	Data        []byte    `bson:"data"`
	CreatedBy   string    `bson:"createdBy"`
	CreatedAt   time.Time `bson:"createdAt"`
	UpdatedAt   time.Time `bson:"updatedAt"`
}

type adminMediaReferenceAggregateDocument struct {
	Value      string    `bson:"value"`
	Title      string    `bson:"title"`
	UsageCount int       `bson:"usageCount"`
	UpdatedAt  time.Time `bson:"updatedAt"`
}

func mapAdminMediaAssetDocument(doc adminMediaAssetDocument) domain.AdminMediaAssetRecord {
	return domain.AdminMediaAssetRecord{
		ID:          strings.TrimSpace(doc.ID),
		Name:        strings.TrimSpace(doc.Name),
		ContentType: strings.TrimSpace(doc.ContentType),
		Digest:      strings.TrimSpace(strings.ToLower(doc.Digest)),
		SizeBytes:   doc.SizeBytes,
		Width:       doc.Width,
		Height:      doc.Height,
		Data:        append([]byte(nil), doc.Data...),
		CreatedBy:   strings.TrimSpace(doc.CreatedBy),
		CreatedAt:   doc.CreatedAt,
		UpdatedAt:   doc.UpdatedAt,
	}
}

func listUploadedMediaLibraryItems(
	ctx context.Context,
	collection *mongo.Collection,
	query string,
) ([]domain.AdminMediaLibraryItem, error) {
	search := strings.TrimSpace(query)
	findQuery := bson.M{}
	if search != "" {
		regex := primitive.Regex{Pattern: regexp.QuoteMeta(search), Options: "i"}
		findQuery["name"] = regex
	}

	cursor, err := collection.Find(
		ctx,
		findQuery,
		options.Find().
			SetSort(bson.D{{Key: "updatedAt", Value: -1}, {Key: "createdAt", Value: -1}}),
	)
	if err != nil {
		return nil, err
	}
	defer func() {
		_ = cursor.Close(ctx)
	}()

	items := make([]domain.AdminMediaLibraryItem, 0, 32)
	for cursor.Next(ctx) {
		var doc adminMediaAssetDocument
		if decodeErr := cursor.Decode(&doc); decodeErr != nil {
			return nil, decodeErr
		}

		value := buildAdminMediaAssetValue(doc.ID)
		items = append(items, domain.AdminMediaLibraryItem{
			ID:          strings.TrimSpace(doc.ID),
			Kind:        "UPLOADED",
			Name:        strings.TrimSpace(doc.Name),
			Value:       value,
			PreviewURL:  value,
			ContentType: strings.TrimSpace(doc.ContentType),
			Width:       doc.Width,
			Height:      doc.Height,
			SizeBytes:   doc.SizeBytes,
			UsageCount:  0,
			CreatedAt:   doc.CreatedAt,
			UpdatedAt:   doc.UpdatedAt,
		})
	}

	if err := cursor.Err(); err != nil {
		return nil, err
	}

	return items, nil
}

func listReferencedMediaLibraryItems(
	ctx context.Context,
	collection *mongo.Collection,
	query string,
) ([]domain.AdminMediaLibraryItem, error) {
	match := bson.M{
		"thumbnail": bson.M{
			"$type": "string",
			"$ne":   "",
			"$not": primitive.Regex{
				Pattern: `^/api/media(?:/|\?)`,
				Options: "i",
			},
		},
	}
	search := strings.TrimSpace(query)
	if search != "" {
		regex := primitive.Regex{Pattern: regexp.QuoteMeta(search), Options: "i"}
		match["$or"] = bson.A{
			bson.M{"thumbnail": regex},
			bson.M{"title": regex},
		}
	}

	cursor, err := collection.Aggregate(
		ctx,
		mongo.Pipeline{
			bson.D{{Key: "$match", Value: match}},
			bson.D{{Key: "$group", Value: bson.M{
				"_id":       "$thumbnail",
				"value":     bson.M{"$first": "$thumbnail"},
				"title":     bson.M{"$first": "$title"},
				"updatedAt": bson.M{"$max": "$updatedAt"},
				"postIDs":   bson.M{"$addToSet": "$id"},
			}}},
			bson.D{{Key: "$addFields", Value: bson.M{
				"usageCount": bson.M{"$size": "$postIDs"},
			}}},
			bson.D{{Key: "$sort", Value: bson.D{{Key: "usageCount", Value: -1}, {Key: "updatedAt", Value: -1}, {Key: "value", Value: 1}}}},
			bson.D{{Key: "$project", Value: bson.M{
				"_id":        0,
				"value":      1,
				"title":      1,
				"updatedAt":  1,
				"usageCount": bson.M{"$size": "$postIDs"},
			}}},
		},
	)
	if err != nil {
		return nil, err
	}
	defer func() {
		_ = cursor.Close(ctx)
	}()

	items := make([]domain.AdminMediaLibraryItem, 0, 32)
	for cursor.Next(ctx) {
		var doc adminMediaReferenceAggregateDocument
		if decodeErr := cursor.Decode(&doc); decodeErr != nil {
			return nil, decodeErr
		}

		value := strings.TrimSpace(doc.Value)
		if value == "" {
			continue
		}
		items = append(items, domain.AdminMediaLibraryItem{
			ID:         "ref:" + shortMediaReferenceID(value),
			Kind:       "REFERENCE",
			Name:       resolveMediaReferenceName(value, strings.TrimSpace(doc.Title)),
			Value:      value,
			PreviewURL: value,
			UsageCount: doc.UsageCount,
			UpdatedAt:  doc.UpdatedAt,
		})
	}

	if err := cursor.Err(); err != nil {
		return nil, err
	}

	return items, nil
}

func buildAdminMediaAssetValue(id string) string {
	return "/api/media/" + strings.TrimSpace(id)
}

func resolveMediaReferenceName(value, fallback string) string {
	resolvedBase := path.Base(strings.TrimSpace(value))
	resolvedBase = strings.TrimSpace(strings.TrimSuffix(resolvedBase, path.Ext(resolvedBase)))
	resolvedBase = strings.ReplaceAll(resolvedBase, "-", " ")
	resolvedBase = strings.ReplaceAll(resolvedBase, "_", " ")
	resolvedBase = strings.TrimSpace(resolvedBase)
	if resolvedBase != "" && resolvedBase != "." && resolvedBase != "/" {
		return resolvedBase
	}
	if resolvedFallback := strings.TrimSpace(fallback); resolvedFallback != "" {
		return resolvedFallback
	}
	return strings.TrimSpace(value)
}

func shortMediaReferenceID(value string) string {
	normalized := strings.TrimSpace(value)
	if normalized == "" {
		return ""
	}
	sum := sha1.Sum([]byte(normalized))
	hexPart := hex.EncodeToString(sum[:])
	if len(hexPart) >= 12 {
		return hexPart[:12]
	}
	return hexPart
}

func enrichMediaLibraryUsageCounts(
	ctx context.Context,
	postsCollection *mongo.Collection,
	items []domain.AdminMediaLibraryItem,
) {
	if len(items) == 0 {
		return
	}

	values := make([]string, 0, len(items))
	valueSet := make(map[string]struct{}, len(items))
	for _, item := range items {
		if item.Value == "" {
			continue
		}
		if _, exists := valueSet[item.Value]; exists {
			continue
		}
		valueSet[item.Value] = struct{}{}
		values = append(values, item.Value)
	}
	if len(values) == 0 {
		return
	}

	cursor, err := postsCollection.Aggregate(
		ctx,
		mongo.Pipeline{
			bson.D{{Key: "$match", Value: bson.M{"thumbnail": bson.M{"$in": values}}}},
			bson.D{{Key: "$group", Value: bson.M{
				"_id":        "$thumbnail",
				"usageCount": bson.M{"$sum": 1},
			}}},
		},
	)
	if err != nil {
		return
	}
	defer func() {
		_ = cursor.Close(ctx)
	}()

	counts := make(map[string]int, len(items))
	for cursor.Next(ctx) {
		var doc struct {
			ID         string `bson:"_id"`
			UsageCount int    `bson:"usageCount"`
		}
		if decodeErr := cursor.Decode(&doc); decodeErr != nil {
			return
		}
		counts[strings.TrimSpace(doc.ID)] = doc.UsageCount
	}

	for index := range items {
		items[index].UsageCount = counts[items[index].Value]
	}
}
