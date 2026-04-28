package repository

import (
	"context"
	"regexp"
	"strings"

	"suaybsimsek.com/blog-api/internal/domain"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

func buildAdminContentPostFilter(filter domain.AdminContentPostFilter) bson.M {
	query := bson.M{}

	resolvedLocale := strings.TrimSpace(strings.ToLower(filter.Locale))
	if resolvedLocale != "" {
		query["locale"] = resolvedLocale
	}

	resolvedSource := strings.TrimSpace(strings.ToLower(filter.Source))
	if resolvedSource != "" {
		query["source"] = resolvedSource
	}

	resolvedCategoryID := strings.TrimSpace(strings.ToLower(filter.CategoryID))
	if resolvedCategoryID != "" {
		query["category.id"] = resolvedCategoryID
	}

	resolvedTopicID := strings.TrimSpace(strings.ToLower(filter.TopicID))
	if resolvedTopicID != "" {
		query["topicIds"] = resolvedTopicID
	}

	resolvedSearchQuery := strings.TrimSpace(filter.Query)
	if resolvedSearchQuery != "" {
		searchPattern := primitive.Regex{
			Pattern: regexp.QuoteMeta(resolvedSearchQuery),
			Options: "i",
		}
		query["$or"] = bson.A{
			bson.M{"id": searchPattern},
			bson.M{"title": searchPattern},
			bson.M{"summary": searchPattern},
			bson.M{"searchText": searchPattern},
		}
	}

	return query
}

func buildAdminContentPostGroupPipeline(filter domain.AdminContentPostFilter) mongo.Pipeline {
	query := buildAdminContentPostFilter(filter)

	return mongo.Pipeline{
		bson.D{{Key: mongoStageMatch, Value: query}},
		bson.D{{Key: mongoStageProject, Value: bson.M{
			"locale":           1,
			"id":               1,
			"title":            1,
			"summary":          1,
			"thumbnail":        1,
			"source":           1,
			"publishedAt":      1,
			"publishedDate":    1,
			"updatedDate":      1,
			"category":         1,
			"topics":           1,
			"topicIds":         1,
			"readingTimeMin":   1,
			"status":           1,
			"scheduledAt":      1,
			"revisionCount":    1,
			"latestRevisionAt": 1,
			"updatedAt":        1,
			"sortPublishedAt": bson.M{
				"$ifNull": bson.A{
					"$publishedAt",
					bson.M{
						"$dateFromString": bson.M{
							"dateString": "$publishedDate",
							"format":     "%Y-%m-%d",
							"onError":    nil,
							"onNull":     nil,
						},
					},
				},
			},
		}}},
		bson.D{{Key: "$sort", Value: bson.D{
			{Key: "sortPublishedAt", Value: -1},
			{Key: "id", Value: 1},
			{Key: "source", Value: 1},
			{Key: "locale", Value: 1},
		}}},
		bson.D{{Key: mongoStageGroup, Value: bson.M{
			"_id": bson.M{
				"id":     "$id",
				"source": mongoFieldSource,
			},
			"id":              bson.M{mongoFieldFirst: "$id"},
			"source":          bson.M{mongoFieldFirst: mongoFieldSource},
			"sortPublishedAt": bson.M{mongoFieldFirst: "$sortPublishedAt"},
			"variants": bson.M{"$push": bson.M{
				"locale":           mongoFieldLocale,
				"id":               "$id",
				"title":            "$title",
				"summary":          "$summary",
				"thumbnail":        "$thumbnail",
				"source":           mongoFieldSource,
				"publishedAt":      "$publishedAt",
				"publishedDate":    "$publishedDate",
				"updatedDate":      "$updatedDate",
				"category":         "$category",
				"topics":           "$topics",
				"topicIds":         "$topicIds",
				"readingTimeMin":   "$readingTimeMin",
				"status":           "$status",
				"scheduledAt":      "$scheduledAt",
				"revisionCount":    "$revisionCount",
				"latestRevisionAt": "$latestRevisionAt",
				"updatedAt":        mongoFieldUpdatedAt,
			}},
		}}},
		bson.D{{Key: "$sort", Value: bson.D{
			{Key: "sortPublishedAt", Value: -1},
			{Key: "id", Value: 1},
			{Key: "source", Value: 1},
		}}},
		bson.D{{Key: "$project", Value: bson.M{
			"_id":      0,
			"id":       1,
			"source":   1,
			"variants": 1,
		}}},
	}
}

func buildAdminContentTopicFilter(filter domain.AdminContentTaxonomyFilter) bson.M {
	query := bson.M{}

	resolvedLocale := strings.TrimSpace(strings.ToLower(filter.Locale))
	if resolvedLocale != "" {
		query["locale"] = resolvedLocale
	}

	resolvedSearchQuery := strings.TrimSpace(filter.Query)
	if resolvedSearchQuery != "" {
		searchPattern := primitive.Regex{
			Pattern: regexp.QuoteMeta(resolvedSearchQuery),
			Options: "i",
		}
		query["$or"] = bson.A{
			bson.M{"id": searchPattern},
			bson.M{"name": searchPattern},
		}
	}

	return query
}

func buildAdminContentTopicGroupPipeline(filter domain.AdminContentTaxonomyFilter) mongo.Pipeline {
	query := buildAdminContentTopicFilter(filter)
	sortName := buildAdminContentPreferredNameExpression(strings.TrimSpace(strings.ToLower(filter.PreferredLocale)))

	return mongo.Pipeline{
		bson.D{{Key: "$match", Value: query}},
		bson.D{{Key: "$group", Value: bson.M{
			"_id": "$id",
			"id":  bson.M{"$first": "$id"},
			"variants": bson.M{"$push": bson.M{
				"locale":    "$locale",
				"id":        "$id",
				"name":      "$name",
				"color":     "$color",
				"link":      "$link",
				"updatedAt": "$updatedAt",
			}},
			"enName": bson.M{"$max": bson.M{
				"$cond": bson.A{
					bson.M{"$eq": bson.A{"$locale", adminContentLocaleEN}},
					"$name",
					"",
				},
			}},
			"trName": bson.M{"$max": bson.M{
				"$cond": bson.A{
					bson.M{"$eq": bson.A{"$locale", adminContentLocaleTR}},
					"$name",
					"",
				},
			}},
		}}},
		bson.D{{Key: "$addFields", Value: bson.M{"sortName": sortName}}},
		bson.D{{Key: "$sort", Value: bson.D{
			{Key: "sortName", Value: 1},
			{Key: "id", Value: 1},
		}}},
		bson.D{{Key: "$project", Value: bson.M{
			"_id":      0,
			"id":       1,
			"variants": 1,
		}}},
	}
}

func buildAdminContentCategoryFilter(filter domain.AdminContentTaxonomyFilter) bson.M {
	query := bson.M{}

	resolvedLocale := strings.TrimSpace(strings.ToLower(filter.Locale))
	if resolvedLocale != "" {
		query["locale"] = resolvedLocale
	}

	resolvedSearchQuery := strings.TrimSpace(filter.Query)
	if resolvedSearchQuery != "" {
		searchPattern := primitive.Regex{
			Pattern: regexp.QuoteMeta(resolvedSearchQuery),
			Options: "i",
		}
		query["$or"] = bson.A{
			bson.M{"id": searchPattern},
			bson.M{"name": searchPattern},
			bson.M{"icon": searchPattern},
		}
	}

	return query
}

func buildAdminContentCategoryGroupPipeline(filter domain.AdminContentTaxonomyFilter) mongo.Pipeline {
	query := buildAdminContentCategoryFilter(filter)
	sortName := buildAdminContentPreferredNameExpression(strings.TrimSpace(strings.ToLower(filter.PreferredLocale)))

	return mongo.Pipeline{
		bson.D{{Key: "$match", Value: query}},
		bson.D{{Key: "$group", Value: bson.M{
			"_id": "$id",
			"id":  bson.M{"$first": "$id"},
			"variants": bson.M{"$push": bson.M{
				"locale":    "$locale",
				"id":        "$id",
				"name":      "$name",
				"color":     "$color",
				"icon":      "$icon",
				"link":      "$link",
				"updatedAt": "$updatedAt",
			}},
			"enName": bson.M{"$max": bson.M{
				"$cond": bson.A{
					bson.M{"$eq": bson.A{"$locale", adminContentLocaleEN}},
					"$name",
					"",
				},
			}},
			"trName": bson.M{"$max": bson.M{
				"$cond": bson.A{
					bson.M{"$eq": bson.A{"$locale", adminContentLocaleTR}},
					"$name",
					"",
				},
			}},
		}}},
		bson.D{{Key: "$addFields", Value: bson.M{"sortName": sortName}}},
		bson.D{{Key: "$sort", Value: bson.D{
			{Key: "sortName", Value: 1},
			{Key: "id", Value: 1},
		}}},
		bson.D{{Key: "$project", Value: bson.M{
			"_id":      0,
			"id":       1,
			"variants": 1,
		}}},
	}
}

func buildAdminContentPreferredNameExpression(preferredLocale string) bson.M {
	if preferredLocale == adminContentLocaleTR {
		return bson.M{
			"$cond": bson.A{
				bson.M{"$ne": bson.A{mongoTrNameField, ""}},
				mongoTrNameField,
				mongoEnNameField,
			},
		}
	}

	return bson.M{
		"$cond": bson.A{
			bson.M{"$ne": bson.A{"$enName", ""}},
			"$enName",
			"$trName",
		},
	}
}

func resolveAdminContentPagination(page, size *int, total int) (int, int, int64) {
	resolvedPage := 1
	resolvedSize := total
	if resolvedSize <= 0 {
		resolvedSize = 1
	}

	if size != nil && *size > 0 {
		resolvedSize = *size
	}
	if page != nil && *page > 0 {
		resolvedPage = *page
	}

	if total == 0 {
		return 1, resolvedSize, 0
	}

	totalPages := max(1, (total+resolvedSize-1)/resolvedSize)
	if resolvedPage > totalPages {
		resolvedPage = totalPages
	}

	return resolvedPage, resolvedSize, int64((resolvedPage - 1) * resolvedSize)
}

func aggregateAdminContentTotal(
	ctx context.Context,
	collection *mongo.Collection,
	basePipeline mongo.Pipeline,
) (int, error) {
	countPipeline := append(mongo.Pipeline{}, basePipeline...)
	countPipeline = append(countPipeline, bson.D{{Key: "$count", Value: "total"}})

	cursor, err := collection.Aggregate(ctx, countPipeline)
	if err != nil {
		return 0, err
	}
	defer func() {
		_ = cursor.Close(ctx)
	}()

	var countDoc struct {
		Total int `bson:"total"`
	}
	if cursor.Next(ctx) {
		if decodeErr := cursor.Decode(&countDoc); decodeErr != nil {
			return 0, decodeErr
		}
	}
	if err := cursor.Err(); err != nil {
		return 0, err
	}

	return countDoc.Total, nil
}

func assignAdminContentPreferredPost(group *domain.AdminContentPostGroupRecord, preferredLocale string) {
	if group == nil {
		return
	}

	if preferredLocale == adminContentLocaleTR {
		if group.TR != nil {
			group.Preferred = *group.TR
			return
		}
		if group.EN != nil {
			group.Preferred = *group.EN
			return
		}
	}

	if group.EN != nil {
		group.Preferred = *group.EN
		return
	}
	if group.TR != nil {
		group.Preferred = *group.TR
	}
}

func assignAdminContentPreferredTopic(group *domain.AdminContentTopicGroupRecord, preferredLocale string) {
	if group == nil {
		return
	}

	if preferredLocale == adminContentLocaleTR {
		if group.TR != nil {
			group.Preferred = *group.TR
			return
		}
		if group.EN != nil {
			group.Preferred = *group.EN
			return
		}
	}

	if group.EN != nil {
		group.Preferred = *group.EN
		return
	}
	if group.TR != nil {
		group.Preferred = *group.TR
	}
}

func assignAdminContentPreferredCategory(group *domain.AdminContentCategoryGroupRecord, preferredLocale string) {
	if group == nil {
		return
	}

	if preferredLocale == adminContentLocaleTR {
		if group.TR != nil {
			group.Preferred = *group.TR
			return
		}
		if group.EN != nil {
			group.Preferred = *group.EN
			return
		}
	}

	if group.EN != nil {
		group.Preferred = *group.EN
		return
	}
	if group.TR != nil {
		group.Preferred = *group.TR
	}
}
