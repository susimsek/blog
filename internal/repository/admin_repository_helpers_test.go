package repository

import (
	"testing"
	"time"

	"suaybsimsek.com/blog-api/internal/domain"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

func TestAdminContentMappingHelpers(t *testing.T) {
	now := time.Date(2026, time.March, 21, 10, 0, 0, 0, time.UTC)

	post := mapAdminContentPostDocument(adminContentPostDocument{
		Locale:        " EN ",
		ID:            " Alpha-Post ",
		Title:         " Alpha ",
		Summary:       " Summary ",
		Content:       "body",
		ContentMode:   " MARKDOWN ",
		Thumbnail:     " /alpha.png ",
		Source:        " BLOG ",
		PublishedDate: "2026-03-20",
		UpdatedDate:   "2026-03-21",
		TopicIDs:      []string{" React ", "", "Go"},
		Topics: []struct {
			ID   string `bson:"id"`
			Name string `bson:"name"`
		}{{Name: " React "}},
		Category: &struct {
			ID   string `bson:"id"`
			Name string `bson:"name"`
		}{ID: " Tech ", Name: " Technology "},
		ReadingTimeMin: 5,
		UpdatedAt:      now,
	})
	if post.Locale != "en" || post.ID != "alpha-post" || post.CategoryID != "tech" {
		t.Fatalf("unexpected mapped post: %#v", post)
	}
	if len(post.TopicIDs) != 2 || post.TopicNames[0] != "React" {
		t.Fatalf("unexpected topics: %#v", post)
	}

	postGroup, ok := mapAdminContentPostGroupAggregateDocument(adminContentPostGroupAggregateDocument{
		ID:     "alpha-post",
		Source: "blog",
		Variants: []adminContentPostDocument{
			{Locale: "en", ID: "alpha-post", Title: "Alpha"},
			{Locale: "tr", ID: "alpha-post", Title: "Alfa"},
		},
	}, adminContentLocaleTR)
	if !ok || postGroup.Preferred.Locale != "tr" {
		t.Fatalf("unexpected post group: %#v, ok=%v", postGroup, ok)
	}

	topicGroup, ok := mapAdminContentTopicGroupAggregateDocument(adminContentTopicGroupAggregateDocument{
		ID: "alpha-topic",
		Variants: []adminContentTopicAggregateVariantDocument{
			{Locale: "en", ID: "alpha-topic", Name: "Alpha", Color: "#fff"},
			{Locale: "tr", ID: "alpha-topic", Name: "Alfa", Color: "#000"},
		},
	}, adminContentLocaleEN)
	if !ok || topicGroup.Preferred.Locale != "en" {
		t.Fatalf("unexpected topic group: %#v, ok=%v", topicGroup, ok)
	}

	categoryGroup, ok := mapAdminContentCategoryGroupAggregateDocument(adminContentCategoryGroupAggregateDocument{
		ID: "alpha-category",
		Variants: []adminContentCategoryAggregateVariantDocument{
			{Locale: "tr", ID: "alpha-category", Name: "Kategori", Color: "#000", Icon: "icon"},
		},
	}, adminContentLocaleEN)
	if !ok || categoryGroup.Preferred.Locale != "tr" {
		t.Fatalf("unexpected category group: %#v, ok=%v", categoryGroup, ok)
	}
}

func TestAdminContentFilterAndPipelineHelpers(t *testing.T) {
	postFilter := buildAdminContentPostFilter(domain.AdminContentPostFilter{
		Locale:     "EN",
		Source:     "BLOG",
		CategoryID: "Tech",
		TopicID:    "Go",
		Query:      "alpha",
	})
	if postFilter["locale"] != "en" || postFilter["source"] != "blog" || postFilter["category.id"] != "tech" {
		t.Fatalf("unexpected post filter: %#v", postFilter)
	}
	if _, ok := postFilter["$or"]; !ok {
		t.Fatalf("expected search clause in post filter: %#v", postFilter)
	}

	postPipeline := buildAdminContentPostGroupPipeline(domain.AdminContentPostFilter{PreferredLocale: "tr"})
	if len(postPipeline) == 0 {
		t.Fatal("expected post pipeline")
	}
	if stage, ok := postPipeline[0].Map()["$match"]; !ok || stage == nil {
		t.Fatalf("expected $match stage, got %#v", postPipeline[0])
	}

	topicFilter := buildAdminContentTopicFilter(domain.AdminContentTaxonomyFilter{Locale: "TR", Query: "alpha"})
	if topicFilter["locale"] != "tr" {
		t.Fatalf("unexpected topic filter: %#v", topicFilter)
	}

	categoryFilter := buildAdminContentCategoryFilter(domain.AdminContentTaxonomyFilter{Locale: "EN", Query: "icon"})
	if categoryFilter["locale"] != "en" {
		t.Fatalf("unexpected category filter: %#v", categoryFilter)
	}

	topicPipeline := buildAdminContentTopicGroupPipeline(domain.AdminContentTaxonomyFilter{PreferredLocale: "tr"})
	categoryPipeline := buildAdminContentCategoryGroupPipeline(domain.AdminContentTaxonomyFilter{PreferredLocale: "en"})
	if len(topicPipeline) == 0 || len(categoryPipeline) == 0 {
		t.Fatal("expected taxonomy pipelines")
	}

	if buildAdminContentPreferredNameExpression(adminContentLocaleTR) == nil {
		t.Fatal("expected preferred name expression")
	}
}

func TestAdminContentPaginationAndPreferredAssignmentHelpers(t *testing.T) {
	page, size, skip := resolveAdminContentPagination(nil, nil, 0)
	if page != 1 || size != 1 || skip != 0 {
		t.Fatalf("unexpected zero-total pagination: %d %d %d", page, size, skip)
	}

	requestedPage := 9
	requestedSize := 20
	page, size, skip = resolveAdminContentPagination(&requestedPage, &requestedSize, 35)
	if page != 2 || size != 20 || skip != 20 {
		t.Fatalf("unexpected pagination: %d %d %d", page, size, skip)
	}

	postGroup := &domain.AdminContentPostGroupRecord{
		EN: &domain.AdminContentPostRecord{Locale: "en", ID: "alpha"},
		TR: &domain.AdminContentPostRecord{Locale: "tr", ID: "alpha"},
	}
	assignAdminContentPreferredPost(postGroup, adminContentLocaleTR)
	if postGroup.Preferred.Locale != "tr" {
		t.Fatalf("unexpected preferred post: %#v", postGroup.Preferred)
	}

	topicGroup := &domain.AdminContentTopicGroupRecord{
		EN: &domain.AdminContentTopicRecord{Locale: "en", ID: "alpha"},
	}
	assignAdminContentPreferredTopic(topicGroup, adminContentLocaleTR)
	if topicGroup.Preferred.Locale != "en" {
		t.Fatalf("unexpected preferred topic: %#v", topicGroup.Preferred)
	}

	categoryGroup := &domain.AdminContentCategoryGroupRecord{
		TR: &domain.AdminContentCategoryRecord{Locale: "tr", ID: "alpha"},
	}
	assignAdminContentPreferredCategory(categoryGroup, adminContentLocaleEN)
	if categoryGroup.Preferred.Locale != "tr" {
		t.Fatalf("unexpected preferred category: %#v", categoryGroup.Preferred)
	}
}

func TestDashboardAndNewsletterHelpers(t *testing.T) {
	set := toStringSet([]any{" alpha ", "", 3, "beta"})
	if len(set) != 2 {
		t.Fatalf("unexpected string set: %#v", set)
	}

	if parsed := parseDashboardDate("2026-03-21"); parsed.IsZero() {
		t.Fatal("expected parsed date")
	}
	if parsed := parseDashboardDate("invalid"); !parsed.IsZero() {
		t.Fatalf("expected zero date, got %v", parsed)
	}

	unsetFilter := unsetOrNullFilter("revokedAt")
	orConditions, ok := unsetFilter["$or"].(bson.A)
	if !ok || len(orConditions) != 2 {
		t.Fatalf("unexpected unsetOrNullFilter: %#v", unsetFilter)
	}
	if hashed := HashAdminRefreshToken(" token "); hashed == "" || hashed == HashAdminRefreshToken("other") {
		t.Fatalf("unexpected HashAdminRefreshToken() result: %q", hashed)
	}

	confirmedAt := time.Date(2026, time.March, 21, 10, 0, 0, 0, time.FixedZone("X", 3*3600))
	record := normalizeAdminNewsletterRecord(
		" ADMIN@example.com ",
		" EN ",
		" ACTIVE ",
		[]string{" react ", "", "go"},
		" Form ",
		" popup ",
		time.Date(2026, time.March, 21, 9, 0, 0, 0, time.FixedZone("X", 3*3600)),
		time.Date(2026, time.March, 20, 9, 0, 0, 0, time.FixedZone("X", 3*3600)),
		&confirmedAt,
		nil,
	)
	if record == nil || record.Email != "admin@example.com" || record.Locale != "en" || record.Status != "active" {
		t.Fatalf("unexpected newsletter record: %#v", record)
	}
	if len(record.Tags) != 2 || record.ConfirmedAt == nil || record.ConfirmedAt.Location() != time.UTC {
		t.Fatalf("unexpected newsletter metadata: %#v", record)
	}
	if normalizeAdminNewsletterRecord("", "en", "active", nil, "", "", time.Time{}, time.Time{}, nil, nil) != nil {
		t.Fatal("expected invalid newsletter record to return nil")
	}
}

func TestDecodeAdminNewsletterDeliveryFailureAndOptionalTime(t *testing.T) {
	cursor, err := mongoCursorFromDocs([]any{
		bson.M{
			"locale":        " EN ",
			"itemKey":       "post:alpha",
			"email":         " ADMIN@example.com ",
			"status":        " FAILED ",
			"lastError":     " boom ",
			"lastAttemptAt": time.Date(2026, time.March, 21, 10, 0, 0, 0, time.UTC),
			"updatedAt":     time.Date(2026, time.March, 21, 10, 0, 0, 0, time.UTC),
			"createdAt":     time.Date(2026, time.March, 21, 9, 0, 0, 0, time.UTC),
		},
	})
	if err != nil {
		t.Fatalf("mongoCursorFromDocs returned error: %v", err)
	}
	defer func() { _ = cursor.Close(t.Context()) }()

	if !cursor.Next(t.Context()) {
		t.Fatal("expected cursor item")
	}
	record, err := decodeAdminNewsletterDeliveryFailure(cursor)
	if err != nil || record == nil || record.Locale != "en" || record.Email != "admin@example.com" || record.Status != "failed" {
		t.Fatalf("unexpected delivery failure record: %#v, err=%v", record, err)
	}

	if normalizeOptionalTime(nil) != nil {
		t.Fatal("expected nil optional time")
	}
	zero := time.Time{}
	if normalizeOptionalTime(&zero) != nil {
		t.Fatal("expected nil zero optional time")
	}
}

func mongoCursorFromDocs(docs []any) (*mongo.Cursor, error) {
	return mongo.NewCursorFromDocuments(docs, nil, nil)
}

func TestPrimitiveRegexFiltersAreEscaped(t *testing.T) {
	filter := buildAdminContentPostFilter(domain.AdminContentPostFilter{Query: "a+b"})
	clauses, ok := filter["$or"].(bson.A)
	if !ok || len(clauses) == 0 {
		t.Fatalf("expected regex clauses: %#v", filter)
	}
	regex, ok := clauses[0].(bson.M)["id"].(primitive.Regex)
	if !ok || regex.Pattern != "a\\+b" {
		t.Fatalf("unexpected regex: %#v", clauses[0])
	}
}
