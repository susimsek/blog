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
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

var (
	ErrAdminMediaAssetRepositoryUnavailable = errors.New("admin media asset repository unavailable")
	ErrAdminMediaAssetNotFound              = errors.New("admin media asset not found")
)

const adminMediaAssetRepositoryUnavailableFormat = "%w: %v"

const (
	adminMediaLibrarySortRecent = "RECENT"
	adminMediaLibrarySortName   = "NAME"
	adminMediaLibrarySortSize   = "SIZE"
	adminMediaLibrarySortUsage  = "USAGE"
)

type AdminMediaAssetRepository interface {
	ListMediaLibraryItems(
		ctx context.Context,
		filter domain.AdminMediaLibraryFilter,
	) (*domain.AdminMediaLibraryListPayload, error)
	FindMediaAssetByID(ctx context.Context, id string) (*domain.AdminMediaAssetRecord, error)
	FindMediaAssetByDigest(ctx context.Context, digest string) (*domain.AdminMediaAssetRecord, error)
	CountMediaAssetUsage(ctx context.Context, value string) (int, error)
	CreateMediaAsset(ctx context.Context, record domain.AdminMediaAssetRecord) (*domain.AdminMediaAssetRecord, error)
	DeleteMediaAssetByID(ctx context.Context, id string) (bool, error)
}

type adminMediaAssetMongoRepository struct{}

func NewAdminMediaAssetRepository() AdminMediaAssetRepository {
	return &adminMediaAssetMongoRepository{}
}

func (*adminMediaAssetMongoRepository) ListMediaLibraryItems(
	ctx context.Context,
	filter domain.AdminMediaLibraryFilter,
) (*domain.AdminMediaLibraryListPayload, error) {
	mediaCollection, err := getPostMediaAssetsCollection()
	if err != nil {
		return nil, fmt.Errorf(adminMediaAssetRepositoryUnavailableFormat, ErrAdminMediaAssetRepositoryUnavailable, err)
	}

	postsCollection, err := getPostContentCollection()
	if err != nil {
		return nil, fmt.Errorf(adminMediaAssetRepositoryUnavailableFormat, ErrAdminMediaAssetRepositoryUnavailable, err)
	}

	resolvedKind := strings.TrimSpace(strings.ToUpper(filter.Kind))
	resolvedPage := filter.Page
	if resolvedPage <= 0 {
		resolvedPage = 1
	}
	resolvedSize := filter.Size
	if resolvedSize <= 0 {
		resolvedSize = 10
	}

	sortStage := bson.D{{Key: "$sort", Value: buildAdminMediaLibrarySortDocument(filter.Sort)}}
	facetStage := bson.D{{Key: "$facet", Value: bson.M{
		"items": bson.A{
			bson.M{"$skip": (resolvedPage - 1) * resolvedSize},
			bson.M{"$limit": resolvedSize},
		},
		"meta": bson.A{
			bson.M{"$count": "total"},
		},
	}}}

	switch resolvedKind {
	case "UPLOADED":
		return aggregateAdminMediaLibraryPayload(
			ctx,
			mediaCollection,
			append(buildUploadedMediaLibraryPipeline(postsCollection.Name(), filter.Query), sortStage, facetStage),
			resolvedPage,
			resolvedSize,
		)
	case "REFERENCE":
		return aggregateAdminMediaLibraryPayload(
			ctx,
			postsCollection,
			append(buildReferencedMediaLibraryPipeline(filter.Query), sortStage, facetStage),
			resolvedPage,
			resolvedSize,
		)
	default:
		pipeline := append(buildUploadedMediaLibraryPipeline(postsCollection.Name(), filter.Query),
			bson.D{{Key: "$unionWith", Value: bson.M{
				"coll":     postsCollection.Name(),
				"pipeline": buildReferencedMediaLibraryPipeline(filter.Query),
			}}},
			sortStage,
			facetStage,
		)
		return aggregateAdminMediaLibraryPayload(ctx, mediaCollection, pipeline, resolvedPage, resolvedSize)
	}
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

func (*adminMediaAssetMongoRepository) CountMediaAssetUsage(ctx context.Context, value string) (int, error) {
	postsCollection, err := getPostContentCollection()
	if err != nil {
		return 0, fmt.Errorf(adminMediaAssetRepositoryUnavailableFormat, ErrAdminMediaAssetRepositoryUnavailable, err)
	}

	resolvedValue := strings.TrimSpace(value)
	if resolvedValue == "" {
		return 0, nil
	}

	cursor, err := postsCollection.Aggregate(
		ctx,
		mongo.Pipeline{
			bson.D{{Key: "$match", Value: bson.M{"thumbnail": resolvedValue}}},
			bson.D{{Key: "$group", Value: bson.M{
				"_id":     nil,
				"postIDs": bson.M{"$addToSet": "$id"},
			}}},
			bson.D{{Key: "$project", Value: bson.M{
				"_id":        0,
				"usageCount": bson.M{"$size": "$postIDs"},
			}}},
		},
	)
	if err != nil {
		return 0, err
	}
	defer func() {
		_ = cursor.Close(ctx)
	}()

	if !cursor.Next(ctx) {
		if err := cursor.Err(); err != nil {
			return 0, err
		}
		return 0, nil
	}

	var doc struct {
		UsageCount int `bson:"usageCount"`
	}
	if err := cursor.Decode(&doc); err != nil {
		return 0, err
	}

	return doc.UsageCount, nil
}

func (*adminMediaAssetMongoRepository) DeleteMediaAssetByID(ctx context.Context, id string) (bool, error) {
	mediaCollection, err := getPostMediaAssetsCollection()
	if err != nil {
		return false, fmt.Errorf(adminMediaAssetRepositoryUnavailableFormat, ErrAdminMediaAssetRepositoryUnavailable, err)
	}

	result, err := mediaCollection.DeleteOne(ctx, bson.M{"id": strings.TrimSpace(id)})
	if err != nil {
		return false, err
	}

	return result.DeletedCount > 0, nil
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

type adminMediaLibraryAggregateResult struct {
	Items []adminMediaLibraryItemDocument `bson:"items"`
	Meta  []struct {
		Total int `bson:"total"`
	} `bson:"meta"`
}

type adminMediaLibraryItemDocument struct {
	ID          string    `bson:"id"`
	Kind        string    `bson:"kind"`
	Name        string    `bson:"name"`
	Value       string    `bson:"value"`
	PreviewURL  string    `bson:"previewUrl"`
	ContentType string    `bson:"contentType"`
	Width       int       `bson:"width"`
	Height      int       `bson:"height"`
	SizeBytes   int       `bson:"sizeBytes"`
	UsageCount  int       `bson:"usageCount"`
	CreatedAt   time.Time `bson:"createdAt,omitempty"`
	UpdatedAt   time.Time `bson:"updatedAt,omitempty"`
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

func aggregateAdminMediaLibraryPayload(
	ctx context.Context,
	collection *mongo.Collection,
	pipeline mongo.Pipeline,
	page int,
	size int,
) (*domain.AdminMediaLibraryListPayload, error) {
	cursor, err := collection.Aggregate(ctx, pipeline)
	if err != nil {
		return nil, err
	}
	defer func() {
		_ = cursor.Close(ctx)
	}()

	if !cursor.Next(ctx) {
		if err := cursor.Err(); err != nil {
			return nil, err
		}
		return &domain.AdminMediaLibraryListPayload{
			Items: []domain.AdminMediaLibraryItem{},
			Total: 0,
			Page:  page,
			Size:  size,
		}, nil
	}

	var result adminMediaLibraryAggregateResult
	if err := cursor.Decode(&result); err != nil {
		return nil, err
	}

	items := make([]domain.AdminMediaLibraryItem, 0, len(result.Items))
	for _, item := range result.Items {
		items = append(items, domain.AdminMediaLibraryItem{
			ID:          strings.TrimSpace(item.ID),
			Kind:        strings.TrimSpace(item.Kind),
			Name:        strings.TrimSpace(item.Name),
			Value:       strings.TrimSpace(item.Value),
			PreviewURL:  strings.TrimSpace(item.PreviewURL),
			ContentType: strings.TrimSpace(item.ContentType),
			Width:       item.Width,
			Height:      item.Height,
			SizeBytes:   item.SizeBytes,
			UsageCount:  item.UsageCount,
			CreatedAt:   item.CreatedAt,
			UpdatedAt:   item.UpdatedAt,
		})
	}

	total := 0
	if len(result.Meta) > 0 {
		total = result.Meta[0].Total
	}

	return &domain.AdminMediaLibraryListPayload{
		Items: items,
		Total: total,
		Page:  page,
		Size:  size,
	}, nil
}

func buildUploadedMediaLibraryPipeline(postsCollectionName, query string) mongo.Pipeline {
	match := bson.M{}
	if search := strings.TrimSpace(query); search != "" {
		match["name"] = primitive.Regex{Pattern: regexp.QuoteMeta(search), Options: "i"}
	}

	valueExpr := bson.M{"$concat": bson.A{"/api/media/", "$id"}}

	return mongo.Pipeline{
		bson.D{{Key: "$match", Value: match}},
		bson.D{{Key: "$lookup", Value: bson.M{
			"from": postsCollectionName,
			"let":  bson.M{"thumbnailValue": valueExpr},
			"pipeline": bson.A{
				bson.M{"$match": bson.M{
					"$expr": bson.M{"$eq": bson.A{"$thumbnail", "$$thumbnailValue"}},
				}},
				bson.M{"$group": bson.M{
					"_id":     nil,
					"postIDs": bson.M{"$addToSet": "$id"},
				}},
				bson.M{"$project": bson.M{
					"_id":        0,
					"usageCount": bson.M{"$size": "$postIDs"},
				}},
			},
			"as": "usageMeta",
		}}},
		bson.D{{Key: "$addFields", Value: bson.M{
			"kind":       "UPLOADED",
			"value":      valueExpr,
			"previewUrl": valueExpr,
			"usageCount": bson.M{"$ifNull": bson.A{bson.M{"$first": "$usageMeta.usageCount"}, 0}},
			"sortName":   bson.M{"$toLower": "$name"},
		}}},
		bson.D{{Key: "$project", Value: bson.M{
			"_id":         0,
			"id":          "$id",
			"kind":        1,
			"name":        "$name",
			"value":       1,
			"previewUrl":  1,
			"contentType": "$contentType",
			"width":       "$width",
			"height":      "$height",
			"sizeBytes":   "$sizeBytes",
			"usageCount":  1,
			"createdAt":   "$createdAt",
			"updatedAt":   "$updatedAt",
			"sortName":    1,
		}}},
	}
}

func buildReferencedMediaLibraryPipeline(query string) mongo.Pipeline {
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
	if search := strings.TrimSpace(query); search != "" {
		regex := primitive.Regex{Pattern: regexp.QuoteMeta(search), Options: "i"}
		match["$or"] = bson.A{
			bson.M{"thumbnail": regex},
			bson.M{"title": regex},
		}
	}

	referenceNameExpr := bson.M{
		"$let": bson.M{
			"vars": bson.M{
				"trimmedTitle": bson.M{
					"$trim": bson.M{
						"input": bson.M{"$ifNull": bson.A{"$title", ""}},
					},
				},
			},
			"in": bson.M{
				"$cond": bson.A{
					bson.M{"$ne": bson.A{"$$trimmedTitle", ""}},
					"$$trimmedTitle",
					bson.M{
						"$trim": bson.M{
							"input": bson.M{
								"$replaceAll": bson.M{
									"input": bson.M{
										"$replaceAll": bson.M{
											"input": bson.M{
												"$arrayElemAt": bson.A{
													bson.M{
														"$split": bson.A{
															bson.M{
																"$arrayElemAt": bson.A{
																	bson.M{"$split": bson.A{"$value", "/"}},
																	-1,
																},
															},
															".",
														},
													},
													0,
												},
											},
											"find":        "-",
											"replacement": " ",
										},
									},
									"find":        "_",
									"replacement": " ",
								},
							},
						},
					},
				},
			},
		},
	}

	return mongo.Pipeline{
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
			"id":         bson.M{"$concat": bson.A{"ref:", "$value"}},
			"name":       referenceNameExpr,
			"previewUrl": "$value",
			"kind":       "REFERENCE",
			"sizeBytes":  0,
			"width":      0,
			"height":     0,
			"sortName":   bson.M{"$toLower": referenceNameExpr},
		}}},
		bson.D{{Key: "$project", Value: bson.M{
			"_id":         0,
			"id":          1,
			"kind":        1,
			"name":        1,
			"value":       1,
			"previewUrl":  1,
			"contentType": bson.M{"$literal": ""},
			"width":       1,
			"height":      1,
			"sizeBytes":   1,
			"usageCount":  1,
			"createdAt":   "$updatedAt",
			"updatedAt":   1,
			"sortName":    1,
		}}},
	}
}

func buildAdminMediaLibrarySortDocument(sortKey string) bson.D {
	resolvedSort := strings.TrimSpace(strings.ToUpper(sortKey))
	if resolvedSort == "" {
		resolvedSort = adminMediaLibrarySortRecent
	}

	switch resolvedSort {
	case adminMediaLibrarySortName:
		return bson.D{{Key: "sortName", Value: 1}, {Key: "updatedAt", Value: -1}, {Key: "usageCount", Value: -1}}
	case adminMediaLibrarySortSize:
		return bson.D{{Key: "sizeBytes", Value: -1}, {Key: "updatedAt", Value: -1}, {Key: "sortName", Value: 1}}
	case adminMediaLibrarySortUsage:
		return bson.D{{Key: "usageCount", Value: -1}, {Key: "updatedAt", Value: -1}, {Key: "sortName", Value: 1}}
	default:
		return bson.D{{Key: "updatedAt", Value: -1}, {Key: "usageCount", Value: -1}, {Key: "sortName", Value: 1}}
	}
}
