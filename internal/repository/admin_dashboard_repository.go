package repository

import (
	"context"
	"errors"
	"fmt"
	"sort"
	"strings"
	"time"

	"suaybsimsek.com/blog-api/internal/domain"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var ErrAdminDashboardRepositoryUnavailable = errors.New("admin dashboard repository unavailable")

const adminDashboardRepositoryUnavailableFormat = "%w: %v"

type AdminDashboardRepository interface {
	CountDistinctPosts(ctx context.Context) (int, error)
	CountActiveSubscribers(ctx context.Context) (int, error)
	ListTopPostsByHits(ctx context.Context, limit int) ([]domain.AdminDashboardPostMetric, error)
	ListTopPostsByLikes(ctx context.Context, limit int) ([]domain.AdminDashboardPostMetric, error)
	BuildContentHealthSummary(ctx context.Context) (domain.AdminDashboardContentHealth, error)
}

type adminDashboardMongoRepository struct{}

func NewAdminDashboardMongoRepository() AdminDashboardRepository {
	return &adminDashboardMongoRepository{}
}

func (*adminDashboardMongoRepository) CountDistinctPosts(ctx context.Context) (int, error) {
	collection, err := getPostContentCollection()
	if err != nil {
		return 0, fmt.Errorf(adminDashboardRepositoryUnavailableFormat, ErrAdminDashboardRepositoryUnavailable, err)
	}

	values, err := collection.Distinct(ctx, "id", bson.M{
		"source": bson.M{"$ne": "medium"},
	})
	if err != nil {
		return 0, err
	}

	return len(values), nil
}

func (*adminDashboardMongoRepository) CountActiveSubscribers(ctx context.Context) (int, error) {
	collection, err := getNewsletterCollection()
	if err != nil {
		return 0, fmt.Errorf(adminDashboardRepositoryUnavailableFormat, ErrAdminDashboardRepositoryUnavailable, err)
	}

	total, err := collection.CountDocuments(ctx, bson.M{"status": "active"})
	if err != nil {
		return 0, err
	}

	return int(total), nil
}

func (*adminDashboardMongoRepository) ListTopPostsByHits(
	ctx context.Context,
	limit int,
) ([]domain.AdminDashboardPostMetric, error) {
	collection, err := getPostHitsCollection()
	if err != nil {
		return nil, fmt.Errorf(adminDashboardRepositoryUnavailableFormat, ErrAdminDashboardRepositoryUnavailable, err)
	}

	metrics, err := fetchTopMetrics(ctx, collection, "hits", limit)
	if err != nil {
		return nil, err
	}

	return resolveDashboardPosts(ctx, metrics, "hits")
}

func (*adminDashboardMongoRepository) ListTopPostsByLikes(
	ctx context.Context,
	limit int,
) ([]domain.AdminDashboardPostMetric, error) {
	collection, err := getPostLikesCollection()
	if err != nil {
		return nil, fmt.Errorf(adminDashboardRepositoryUnavailableFormat, ErrAdminDashboardRepositoryUnavailable, err)
	}

	metrics, err := fetchTopMetrics(ctx, collection, "likes", limit)
	if err != nil {
		return nil, err
	}

	return resolveDashboardPosts(ctx, metrics, "likes")
}

func (*adminDashboardMongoRepository) BuildContentHealthSummary(ctx context.Context) (domain.AdminDashboardContentHealth, error) {
	collection, err := getPostContentCollection()
	if err != nil {
		return domain.AdminDashboardContentHealth{}, fmt.Errorf(adminDashboardRepositoryUnavailableFormat, ErrAdminDashboardRepositoryUnavailable, err)
	}

	enIDsRaw, err := collection.Distinct(ctx, "id", bson.M{"locale": "en"})
	if err != nil {
		return domain.AdminDashboardContentHealth{}, err
	}

	trIDsRaw, err := collection.Distinct(ctx, "id", bson.M{"locale": "tr"})
	if err != nil {
		return domain.AdminDashboardContentHealth{}, err
	}

	enIDs := toStringSet(enIDsRaw)
	trIDs := toStringSet(trIDsRaw)

	missingTr := 0
	for postID := range enIDs {
		if _, exists := trIDs[postID]; !exists {
			missingTr++
		}
	}

	missingEn := 0
	for postID := range trIDs {
		if _, exists := enIDs[postID]; !exists {
			missingEn++
		}
	}

	localePairCoverage := 100
	if len(enIDs) > 0 {
		covered := max(len(enIDs)-missingTr, 0)
		localePairCoverage = int(float64(covered)/float64(len(enIDs))*100 + 0.5)
	}

	cursor, err := collection.Find(
		ctx,
		bson.M{
			"locale": "en",
			"source": bson.M{"$ne": "medium"},
		},
		options.Find().SetProjection(bson.M{
			"id":            1,
			"title":         1,
			"updatedDate":   1,
			"publishedDate": 1,
			"thumbnail":     1,
			"category":      1,
		}),
	)
	if err != nil {
		return domain.AdminDashboardContentHealth{}, err
	}
	defer func() {
		_ = cursor.Close(ctx)
	}()

	type contentDoc struct {
		ID            string `bson:"id"`
		Title         string `bson:"title"`
		UpdatedDate   string `bson:"updatedDate"`
		PublishedDate string `bson:"publishedDate"`
		Thumbnail     string `bson:"thumbnail"`
		Category      *struct {
			ID   string `bson:"id"`
			Name string `bson:"name"`
		} `bson:"category"`
	}

	type latestCandidate struct {
		post domain.AdminDashboardUpdatedPost
		at   time.Time
	}

	missingThumbnails := 0
	latestCandidates := make([]latestCandidate, 0, 12)
	categoryCount := make(map[string]*domain.AdminDashboardCategory)

	for cursor.Next(ctx) {
		var doc contentDoc
		if err := cursor.Decode(&doc); err != nil {
			return domain.AdminDashboardContentHealth{}, err
		}

		if strings.TrimSpace(doc.Thumbnail) == "" {
			missingThumbnails++
		}

		categoryID := "uncategorized"
		categoryName := "Uncategorized"
		if doc.Category != nil {
			if strings.TrimSpace(doc.Category.ID) != "" {
				categoryID = strings.TrimSpace(doc.Category.ID)
			}
			if strings.TrimSpace(doc.Category.Name) != "" {
				categoryName = strings.TrimSpace(doc.Category.Name)
			}
		}

		if existing, exists := categoryCount[categoryID]; exists {
			existing.Count++
		} else {
			categoryCount[categoryID] = &domain.AdminDashboardCategory{
				ID:    categoryID,
				Name:  categoryName,
				Count: 1,
			}
		}

		dateValue := strings.TrimSpace(doc.UpdatedDate)
		if dateValue == "" {
			dateValue = strings.TrimSpace(doc.PublishedDate)
		}

		latestCandidates = append(latestCandidates, latestCandidate{
			post: domain.AdminDashboardUpdatedPost{
				ID:       strings.TrimSpace(doc.ID),
				Title:    strings.TrimSpace(doc.Title),
				Date:     dateValue,
				Category: categoryName,
			},
			at: parseDashboardDate(dateValue),
		})
	}

	if err := cursor.Err(); err != nil {
		return domain.AdminDashboardContentHealth{}, err
	}

	sort.SliceStable(latestCandidates, func(i, j int) bool {
		return latestCandidates[i].at.After(latestCandidates[j].at)
	})

	latestUpdatedPosts := make([]domain.AdminDashboardUpdatedPost, 0, 3)
	for _, candidate := range latestCandidates {
		if len(latestUpdatedPosts) >= 3 {
			break
		}
		latestUpdatedPosts = append(latestUpdatedPosts, candidate.post)
	}

	var dominantCategory *domain.AdminDashboardCategory
	for _, category := range categoryCount {
		if dominantCategory == nil || category.Count > dominantCategory.Count {
			copyCategory := *category
			dominantCategory = &copyCategory
		}
	}

	return domain.AdminDashboardContentHealth{
		LocalePairCoverage:  localePairCoverage,
		MissingTranslations: missingEn + missingTr,
		MissingThumbnails:   missingThumbnails,
		LatestUpdatedPosts:  latestUpdatedPosts,
		DominantCategory:    dominantCategory,
	}, nil
}

type dashboardMetricDoc struct {
	PostID string `bson:"postId"`
	Value  int64  `bson:"value"`
}

func fetchTopMetrics(ctx context.Context, collection *mongo.Collection, field string, limit int) ([]dashboardMetricDoc, error) {
	if limit <= 0 {
		limit = 5
	}

	cursor, err := collection.Find(
		ctx,
		bson.M{},
		options.Find().
			SetSort(bson.D{{Key: field, Value: -1}}).
			SetLimit(int64(limit)).
			SetProjection(bson.M{"postId": 1, field: 1}),
	)
	if err != nil {
		return nil, err
	}
	defer func() {
		_ = cursor.Close(ctx)
	}()

	metrics := make([]dashboardMetricDoc, 0, limit)
	for cursor.Next(ctx) {
		var raw map[string]any
		if err := cursor.Decode(&raw); err != nil {
			return nil, err
		}

		postID, _ := raw["postId"].(string)
		if postID == "" {
			continue
		}

		value := int64(0)
		switch candidate := raw[field].(type) {
		case int32:
			value = int64(candidate)
		case int64:
			value = candidate
		case float64:
			value = int64(candidate)
		}

		metrics = append(metrics, dashboardMetricDoc{
			PostID: postID,
			Value:  value,
		})
	}

	if err := cursor.Err(); err != nil {
		return nil, err
	}

	return metrics, nil
}

func resolveDashboardPosts(
	ctx context.Context,
	metrics []dashboardMetricDoc,
	field string,
) ([]domain.AdminDashboardPostMetric, error) {
	if len(metrics) == 0 {
		return []domain.AdminDashboardPostMetric{}, nil
	}

	contentCollection, err := getPostContentCollection()
	if err != nil {
		return nil, fmt.Errorf(adminDashboardRepositoryUnavailableFormat, ErrAdminDashboardRepositoryUnavailable, err)
	}

	postIDs := make([]string, 0, len(metrics))
	for _, metric := range metrics {
		postIDs = append(postIDs, metric.PostID)
	}

	cursor, err := contentCollection.Find(
		ctx,
		bson.M{"id": bson.M{"$in": postIDs}},
		options.Find().
			SetProjection(bson.M{
				"id":            1,
				"title":         1,
				"locale":        1,
				"publishedDate": 1,
			}),
	)
	if err != nil {
		return nil, err
	}
	defer func() {
		_ = cursor.Close(ctx)
	}()

	type postDoc struct {
		ID            string    `bson:"id"`
		Title         string    `bson:"title"`
		Locale        string    `bson:"locale"`
		PublishedDate string    `bson:"publishedDate"`
		PublishedAt   time.Time `bson:"publishedAt"`
	}

	postsByID := make(map[string]postDoc, len(postIDs))
	for cursor.Next(ctx) {
		var doc postDoc
		if err := cursor.Decode(&doc); err != nil {
			return nil, err
		}

		current, exists := postsByID[doc.ID]
		if !exists || (current.Locale != "en" && doc.Locale == "en") {
			postsByID[doc.ID] = doc
		}
	}

	if err := cursor.Err(); err != nil {
		return nil, err
	}

	result := make([]domain.AdminDashboardPostMetric, 0, len(metrics))
	for _, metric := range metrics {
		post := postsByID[metric.PostID]
		item := domain.AdminDashboardPostMetric{
			PostID:        metric.PostID,
			Title:         post.Title,
			Locale:        post.Locale,
			PublishedDate: post.PublishedDate,
		}

		if field == "hits" {
			item.Hits = metric.Value
		} else {
			item.Likes = metric.Value
		}

		result = append(result, item)
	}

	return result, nil
}

func toStringSet(values []any) map[string]struct{} {
	set := make(map[string]struct{}, len(values))
	for _, value := range values {
		asString, ok := value.(string)
		if !ok {
			continue
		}
		trimmed := strings.TrimSpace(asString)
		if trimmed == "" {
			continue
		}
		set[trimmed] = struct{}{}
	}
	return set
}

func parseDashboardDate(value string) time.Time {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return time.Time{}
	}

	layouts := []string{
		"2006-01-02",
		time.RFC3339,
		time.RFC3339Nano,
	}

	for _, layout := range layouts {
		parsed, err := time.Parse(layout, trimmed)
		if err == nil {
			return parsed
		}
	}

	return time.Time{}
}
