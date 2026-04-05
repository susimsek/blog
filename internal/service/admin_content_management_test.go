package service

import (
	"context"
	"errors"
	"strings"
	"testing"
	"time"

	"suaybsimsek.com/blog-api/internal/domain"
	"suaybsimsek.com/blog-api/internal/repository"
	"suaybsimsek.com/blog-api/pkg/httpapi"
)

type adminContentStubRepository struct {
	findPostByLocaleAndID func(context.Context, string, string) (*domain.AdminContentPostRecord, error)
	listPostGroups        func(context.Context, domain.AdminContentPostFilter) (*domain.AdminContentPostListResult, error)
	listPostRevisions     func(context.Context, string, string, int, int) (*domain.AdminContentPostRevisionListResult, error)
	findPostRevisionByID  func(context.Context, string, string, string) (*domain.AdminContentPostRevisionRecord, error)
	createPostRevision    func(context.Context, domain.AdminContentPostRecord, int, time.Time) (*domain.AdminContentPostRevisionRecord, error)
	updatePostMetadata    func(
		context.Context,
		string,
		string,
		domain.AdminContentPostMetadataFields,
		*domain.AdminContentCategoryRecord,
		[]domain.AdminContentTopicRecord,
		*domain.AdminContentPostRevisionStamp,
		time.Time,
	) (*domain.AdminContentPostRecord, error)
	updatePostContent           func(context.Context, string, string, string, *domain.AdminContentPostRevisionStamp, time.Time) (*domain.AdminContentPostRecord, error)
	restorePostRevision         func(context.Context, domain.AdminContentPostRevisionRecord, *domain.AdminContentPostRevisionStamp, time.Time) (*domain.AdminContentPostRecord, error)
	deletePostByLocaleAndID     func(context.Context, string, string) (bool, error)
	listTopics                  func(context.Context, string, string) ([]domain.AdminContentTopicRecord, error)
	listTopicGroups             func(context.Context, domain.AdminContentTaxonomyFilter) (*domain.AdminContentTopicListResult, error)
	findTopicByLocaleAndID      func(context.Context, string, string) (*domain.AdminContentTopicRecord, error)
	upsertTopic                 func(context.Context, domain.AdminContentTopicRecord, time.Time) (*domain.AdminContentTopicRecord, error)
	deleteTopicByLocaleAndID    func(context.Context, string, string) (bool, error)
	syncTopicOnPosts            func(context.Context, domain.AdminContentTopicRecord, time.Time) error
	removeTopicFromPosts        func(context.Context, string, string, time.Time) error
	listCategories              func(context.Context, string) ([]domain.AdminContentCategoryRecord, error)
	listCategoryGroups          func(context.Context, domain.AdminContentTaxonomyFilter) (*domain.AdminContentCategoryListResult, error)
	findCategoryByLocaleAndID   func(context.Context, string, string) (*domain.AdminContentCategoryRecord, error)
	upsertCategory              func(context.Context, domain.AdminContentCategoryRecord, time.Time) (*domain.AdminContentCategoryRecord, error)
	deleteCategoryByLocaleAndID func(context.Context, string, string) (bool, error)
	syncCategoryOnPosts         func(context.Context, domain.AdminContentCategoryRecord, time.Time) error
	clearCategoryFromPosts      func(context.Context, string, string, time.Time) error
}

func intPtr(value int) *int {
	return &value
}

func (adminContentStubRepository) ListAllPosts(context.Context, domain.AdminContentPostFilter) ([]domain.AdminContentPostRecord, error) {
	return nil, nil
}

func (stub adminContentStubRepository) FindPostByLocaleAndID(
	ctx context.Context,
	locale string,
	postID string,
) (*domain.AdminContentPostRecord, error) {
	if stub.findPostByLocaleAndID == nil {
		return nil, nil
	}
	return stub.findPostByLocaleAndID(ctx, locale, postID)
}

func (stub adminContentStubRepository) ListPostGroups(
	ctx context.Context,
	filter domain.AdminContentPostFilter,
) (*domain.AdminContentPostListResult, error) {
	if stub.listPostGroups == nil {
		return nil, nil
	}
	return stub.listPostGroups(ctx, filter)
}

func (stub adminContentStubRepository) ListPostRevisions(
	ctx context.Context,
	locale string,
	postID string,
	page int,
	size int,
) (*domain.AdminContentPostRevisionListResult, error) {
	if stub.listPostRevisions == nil {
		return nil, nil
	}
	return stub.listPostRevisions(ctx, locale, postID, page, size)
}

func (stub adminContentStubRepository) FindPostRevisionByID(
	ctx context.Context,
	locale string,
	postID string,
	revisionID string,
) (*domain.AdminContentPostRevisionRecord, error) {
	if stub.findPostRevisionByID == nil {
		return nil, nil
	}
	return stub.findPostRevisionByID(ctx, locale, postID, revisionID)
}

func (stub adminContentStubRepository) CreatePostRevision(
	ctx context.Context,
	record domain.AdminContentPostRecord,
	revisionNumber int,
	now time.Time,
) (*domain.AdminContentPostRevisionRecord, error) {
	if stub.createPostRevision == nil {
		return &domain.AdminContentPostRevisionRecord{
			ID:             "revision-1",
			Locale:         record.Locale,
			PostID:         record.ID,
			RevisionNumber: revisionNumber,
			CreatedAt:      now,
		}, nil
	}
	return stub.createPostRevision(ctx, record, revisionNumber, now)
}

func (stub adminContentStubRepository) UpdatePostMetadata(
	ctx context.Context,
	locale string,
	postID string,
	fields domain.AdminContentPostMetadataFields,
	category *domain.AdminContentCategoryRecord,
	topics []domain.AdminContentTopicRecord,
	revisionStamp *domain.AdminContentPostRevisionStamp,
	now time.Time,
) (*domain.AdminContentPostRecord, error) {
	if stub.updatePostMetadata == nil {
		return nil, nil
	}
	return stub.updatePostMetadata(ctx, locale, postID, fields, category, topics, revisionStamp, now)
}

func (stub adminContentStubRepository) UpdatePostContent(
	ctx context.Context,
	locale string,
	postID string,
	content string,
	revisionStamp *domain.AdminContentPostRevisionStamp,
	now time.Time,
) (*domain.AdminContentPostRecord, error) {
	if stub.updatePostContent == nil {
		return nil, nil
	}
	return stub.updatePostContent(ctx, locale, postID, content, revisionStamp, now)
}

func (stub adminContentStubRepository) RestorePostRevision(
	ctx context.Context,
	revision domain.AdminContentPostRevisionRecord,
	revisionStamp *domain.AdminContentPostRevisionStamp,
	now time.Time,
) (*domain.AdminContentPostRecord, error) {
	if stub.restorePostRevision == nil {
		return nil, nil
	}
	return stub.restorePostRevision(ctx, revision, revisionStamp, now)
}

func (stub adminContentStubRepository) DeletePostByLocaleAndID(ctx context.Context, locale, postID string) (bool, error) {
	if stub.deletePostByLocaleAndID == nil {
		return false, nil
	}
	return stub.deletePostByLocaleAndID(ctx, locale, postID)
}

func (stub adminContentStubRepository) ListTopics(
	ctx context.Context,
	locale string,
	query string,
) ([]domain.AdminContentTopicRecord, error) {
	if stub.listTopics == nil {
		return nil, nil
	}
	return stub.listTopics(ctx, locale, query)
}

func (stub adminContentStubRepository) ListTopicGroups(
	ctx context.Context,
	filter domain.AdminContentTaxonomyFilter,
) (*domain.AdminContentTopicListResult, error) {
	if stub.listTopicGroups == nil {
		return nil, nil
	}
	return stub.listTopicGroups(ctx, filter)
}

func (adminContentStubRepository) ListAllTopics(context.Context, domain.AdminContentTaxonomyFilter) ([]domain.AdminContentTopicRecord, error) {
	return nil, nil
}

func (stub adminContentStubRepository) FindTopicByLocaleAndID(
	ctx context.Context,
	locale string,
	topicID string,
) (*domain.AdminContentTopicRecord, error) {
	if stub.findTopicByLocaleAndID == nil {
		return nil, nil
	}
	return stub.findTopicByLocaleAndID(ctx, locale, topicID)
}

func (stub adminContentStubRepository) UpsertTopic(
	ctx context.Context,
	record domain.AdminContentTopicRecord,
	now time.Time,
) (*domain.AdminContentTopicRecord, error) {
	if stub.upsertTopic == nil {
		return nil, nil
	}
	return stub.upsertTopic(ctx, record, now)
}

func (stub adminContentStubRepository) DeleteTopicByLocaleAndID(ctx context.Context, locale, topicID string) (bool, error) {
	if stub.deleteTopicByLocaleAndID == nil {
		return false, nil
	}
	return stub.deleteTopicByLocaleAndID(ctx, locale, topicID)
}

func (stub adminContentStubRepository) SyncTopicOnPosts(
	ctx context.Context,
	record domain.AdminContentTopicRecord,
	now time.Time,
) error {
	if stub.syncTopicOnPosts == nil {
		return nil
	}
	return stub.syncTopicOnPosts(ctx, record, now)
}

func (stub adminContentStubRepository) RemoveTopicFromPosts(
	ctx context.Context,
	locale string,
	topicID string,
	now time.Time,
) error {
	if stub.removeTopicFromPosts == nil {
		return nil
	}
	return stub.removeTopicFromPosts(ctx, locale, topicID, now)
}

func (stub adminContentStubRepository) ListCategories(
	ctx context.Context,
	locale string,
) ([]domain.AdminContentCategoryRecord, error) {
	if stub.listCategories == nil {
		return nil, nil
	}
	return stub.listCategories(ctx, locale)
}

func (stub adminContentStubRepository) ListCategoryGroups(
	ctx context.Context,
	filter domain.AdminContentTaxonomyFilter,
) (*domain.AdminContentCategoryListResult, error) {
	if stub.listCategoryGroups == nil {
		return nil, nil
	}
	return stub.listCategoryGroups(ctx, filter)
}

func (adminContentStubRepository) ListAllCategories(context.Context, domain.AdminContentTaxonomyFilter) ([]domain.AdminContentCategoryRecord, error) {
	return nil, nil
}

func (stub adminContentStubRepository) FindCategoryByLocaleAndID(
	ctx context.Context,
	locale string,
	categoryID string,
) (*domain.AdminContentCategoryRecord, error) {
	if stub.findCategoryByLocaleAndID == nil {
		return nil, nil
	}
	return stub.findCategoryByLocaleAndID(ctx, locale, categoryID)
}

func (stub adminContentStubRepository) UpsertCategory(
	ctx context.Context,
	record domain.AdminContentCategoryRecord,
	now time.Time,
) (*domain.AdminContentCategoryRecord, error) {
	if stub.upsertCategory == nil {
		return nil, nil
	}
	return stub.upsertCategory(ctx, record, now)
}

func (stub adminContentStubRepository) DeleteCategoryByLocaleAndID(
	ctx context.Context,
	locale string,
	categoryID string,
) (bool, error) {
	if stub.deleteCategoryByLocaleAndID == nil {
		return false, nil
	}
	return stub.deleteCategoryByLocaleAndID(ctx, locale, categoryID)
}

func (stub adminContentStubRepository) SyncCategoryOnPosts(
	ctx context.Context,
	record domain.AdminContentCategoryRecord,
	now time.Time,
) error {
	if stub.syncCategoryOnPosts == nil {
		return nil
	}
	return stub.syncCategoryOnPosts(ctx, record, now)
}

func (stub adminContentStubRepository) ClearCategoryFromPosts(
	ctx context.Context,
	locale string,
	categoryID string,
	now time.Time,
) error {
	if stub.clearCategoryFromPosts == nil {
		return nil
	}
	return stub.clearCategoryFromPosts(ctx, locale, categoryID, now)
}

func TestListAdminContentFunctionsHandleNilResultsAndDefaults(t *testing.T) {
	previousAdminContentRepository := adminContentRepository
	t.Cleanup(func() {
		adminContentRepository = previousAdminContentRepository
	})

	adminContentRepository = adminContentStubRepository{
		listPostGroups: func(_ context.Context, filter domain.AdminContentPostFilter) (*domain.AdminContentPostListResult, error) {
			if filter.Locale != "" || filter.PreferredLocale != "en" || filter.Source != "" {
				t.Fatalf("unexpected post filter locales/source: %#v", filter)
			}
			if filter.CategoryID != "tech" || filter.TopicID != "alpha-topic" {
				t.Fatalf("unexpected post filter taxonomy ids: %#v", filter)
			}
			if filter.Page == nil || *filter.Page != 1 || filter.Size == nil || *filter.Size != adminContentDefaultPageSize {
				t.Fatalf("unexpected post filter pagination: %#v", filter)
			}
			return nil, nil
		},
		listTopics: func(_ context.Context, locale, query string) ([]domain.AdminContentTopicRecord, error) {
			if locale != "" || query != "alpha" {
				t.Fatalf("unexpected ListTopics args: %q %q", locale, query)
			}
			return nil, nil
		},
		listTopicGroups: func(_ context.Context, filter domain.AdminContentTaxonomyFilter) (*domain.AdminContentTopicListResult, error) {
			if filter.Locale != "" || filter.PreferredLocale != "" {
				t.Fatalf("unexpected topic page filter: %#v", filter)
			}
			if filter.Page == nil || *filter.Page != 1 || filter.Size == nil || *filter.Size != adminContentDefaultPageSize {
				t.Fatalf("unexpected topic page pagination: %#v", filter)
			}
			return nil, nil
		},
		listCategories: func(_ context.Context, locale string) ([]domain.AdminContentCategoryRecord, error) {
			if locale != "" {
				t.Fatalf("unexpected category locale: %q", locale)
			}
			return nil, nil
		},
		listCategoryGroups: func(_ context.Context, filter domain.AdminContentTaxonomyFilter) (*domain.AdminContentCategoryListResult, error) {
			if filter.Locale != "" || filter.PreferredLocale != "tr" {
				t.Fatalf("unexpected category page filter: %#v", filter)
			}
			if filter.Page == nil || *filter.Page != 1 || filter.Size == nil || *filter.Size != adminContentDefaultPageSize {
				t.Fatalf("unexpected category page pagination: %#v", filter)
			}
			return nil, nil
		},
	}

	posts, err := ListAdminContentPosts(context.Background(), &domain.AdminUser{ID: "admin-1"}, domain.AdminContentPostFilter{
		Locale:          "all",
		PreferredLocale: "",
		Source:          "all",
		Query:           " alpha ",
		CategoryID:      " Tech ",
		TopicID:         " Alpha-Topic ",
		Page:            intPtr(0),
		Size:            intPtr(0),
	})
	if err != nil {
		t.Fatalf("ListAdminContentPosts returned error: %v", err)
	}
	if posts == nil || len(posts.Items) != 0 || posts.Total != 0 || posts.Page != 1 || posts.Size != adminContentDefaultPageSize {
		t.Fatalf("unexpected posts result: %#v", posts)
	}

	topics, err := ListAdminContentTopics(context.Background(), &domain.AdminUser{ID: "admin-1"}, "all", " alpha ")
	if err != nil {
		t.Fatalf("ListAdminContentTopics returned error: %v", err)
	}
	if len(topics) != 0 {
		t.Fatalf("expected empty topics, got %#v", topics)
	}

	topicsPage, err := ListAdminContentTopicsPage(context.Background(), &domain.AdminUser{ID: "admin-1"}, domain.AdminContentTaxonomyFilter{})
	if err != nil {
		t.Fatalf("ListAdminContentTopicsPage returned error: %v", err)
	}
	if topicsPage == nil || len(topicsPage.Items) != 0 || topicsPage.Total != 0 || topicsPage.Page != 1 || topicsPage.Size != adminContentDefaultPageSize {
		t.Fatalf("unexpected topics page result: %#v", topicsPage)
	}

	categories, err := ListAdminContentCategories(context.Background(), &domain.AdminUser{ID: "admin-1"}, "all")
	if err != nil {
		t.Fatalf("ListAdminContentCategories returned error: %v", err)
	}
	if len(categories) != 0 {
		t.Fatalf("expected empty categories, got %#v", categories)
	}

	categoriesPage, err := ListAdminContentCategoriesPage(context.Background(), &domain.AdminUser{ID: "admin-1"}, domain.AdminContentTaxonomyFilter{
		PreferredLocale: "tr",
	})
	if err != nil {
		t.Fatalf("ListAdminContentCategoriesPage returned error: %v", err)
	}
	if categoriesPage == nil || len(categoriesPage.Items) != 0 || categoriesPage.Total != 0 || categoriesPage.Page != 1 || categoriesPage.Size != adminContentDefaultPageSize {
		t.Fatalf("unexpected categories page result: %#v", categoriesPage)
	}
}

func TestAdminContentOperationsRejectInvalidStates(t *testing.T) {
	previousAdminContentRepository := adminContentRepository
	t.Cleanup(func() {
		adminContentRepository = previousAdminContentRepository
	})

	adminContentRepository = adminContentStubRepository{
		findPostByLocaleAndID: func(_ context.Context, locale, postID string) (*domain.AdminContentPostRecord, error) {
			switch postID {
			case "alpha-post":
				return nil, nil
			case "medium-post":
				return &domain.AdminContentPostRecord{
					Locale: locale,
					ID:     postID,
					Source: "medium",
				}, nil
			case "beta-post":
				return &domain.AdminContentPostRecord{
					Locale: locale,
					ID:     postID,
					Title:  "Beta",
					Source: "blog",
				}, nil
			default:
				t.Fatalf("unexpected post id lookup: %q", postID)
				return nil, nil
			}
		},
		findTopicByLocaleAndID: func(_ context.Context, locale, topicID string) (*domain.AdminContentTopicRecord, error) {
			switch topicID {
			case "existing-topic":
				return &domain.AdminContentTopicRecord{Locale: locale, ID: topicID, Name: "Existing"}, nil
			case "missing-topic":
				return nil, nil
			default:
				t.Fatalf("unexpected topic id lookup: %q", topicID)
				return nil, nil
			}
		},
		deleteTopicByLocaleAndID: func(_ context.Context, locale, topicID string) (bool, error) {
			if locale != "en" || topicID != "existing-topic" {
				t.Fatalf("unexpected DeleteTopicByLocaleAndID args: %q %q", locale, topicID)
			}
			return false, nil
		},
		findCategoryByLocaleAndID: func(_ context.Context, locale, categoryID string) (*domain.AdminContentCategoryRecord, error) {
			switch categoryID {
			case "existing-category":
				return &domain.AdminContentCategoryRecord{Locale: locale, ID: categoryID, Name: "Existing"}, nil
			case "missing-category":
				return nil, nil
			default:
				t.Fatalf("unexpected category id lookup: %q", categoryID)
				return nil, nil
			}
		},
		deleteCategoryByLocaleAndID: func(_ context.Context, locale, categoryID string) (bool, error) {
			if locale != "en" || categoryID != "existing-category" {
				t.Fatalf("unexpected DeleteCategoryByLocaleAndID args: %q %q", locale, categoryID)
			}
			return false, nil
		},
	}

	adminUser := &domain.AdminUser{ID: "admin-1"}

	if _, err := GetAdminContentPost(context.Background(), adminUser, "en", "alpha-post"); err == nil || !strings.Contains(err.Error(), "content post not found") {
		t.Fatalf("expected missing post error, got %v", err)
	}

	if _, err := UpdateAdminContentPostContent(context.Background(), adminUser, domain.AdminContentPostContentInput{
		Locale:  "en",
		ID:      "medium-post",
		Content: "updated",
	}); err == nil || !strings.Contains(err.Error(), "only allowed for blog posts") {
		t.Fatalf("expected non-blog update rejection, got %v", err)
	}

	if err := DeleteAdminContentPost(context.Background(), adminUser, "en", "alpha-post"); err == nil || !strings.Contains(err.Error(), "content post not found") {
		t.Fatalf("expected delete missing post error, got %v", err)
	}

	if _, err := CreateAdminContentTopic(context.Background(), adminUser, domain.AdminContentTopicInput{
		Locale: "en",
		ID:     "existing-topic",
		Name:   "Existing",
		Color:  "#112233",
	}); err == nil || !strings.Contains(err.Error(), "already exists") {
		t.Fatalf("expected existing topic error, got %v", err)
	}

	if _, err := UpdateAdminContentTopic(context.Background(), adminUser, domain.AdminContentTopicInput{
		Locale: "en",
		ID:     "missing-topic",
		Name:   "Missing",
		Color:  "#112233",
	}); err == nil || !strings.Contains(err.Error(), "content topic not found") {
		t.Fatalf("expected missing topic update error, got %v", err)
	}

	if err := DeleteAdminContentTopic(context.Background(), adminUser, "en", "existing-topic"); err == nil || !strings.Contains(err.Error(), "content topic not found") {
		t.Fatalf("expected missing topic delete error, got %v", err)
	}

	if _, err := CreateAdminContentCategory(context.Background(), adminUser, domain.AdminContentCategoryInput{
		Locale: "en",
		ID:     "existing-category",
		Name:   "Existing",
		Color:  "#112233",
	}); err == nil || !strings.Contains(err.Error(), "already exists") {
		t.Fatalf("expected existing category error, got %v", err)
	}

	if _, err := UpdateAdminContentCategory(context.Background(), adminUser, domain.AdminContentCategoryInput{
		Locale: "en",
		ID:     "missing-category",
		Name:   "Missing",
		Color:  "#112233",
	}); err == nil || !strings.Contains(err.Error(), "content category not found") {
		t.Fatalf("expected missing category update error, got %v", err)
	}

	if err := DeleteAdminContentCategory(context.Background(), adminUser, "en", "existing-category"); err == nil || !strings.Contains(err.Error(), "content category not found") {
		t.Fatalf("expected missing category delete error, got %v", err)
	}

	if _, err := ListAdminContentPosts(context.Background(), nil, domain.AdminContentPostFilter{}); err == nil || !strings.Contains(err.Error(), "admin authentication required") {
		t.Fatalf("expected list auth error, got %v", err)
	}
}

func TestAdminContentOperationsRequireAdminUser(t *testing.T) {
	testCases := []struct {
		name string
		run  func() error
	}{
		{
			name: "ListAdminContentPosts",
			run: func() error {
				_, err := ListAdminContentPosts(context.Background(), nil, domain.AdminContentPostFilter{})
				return err
			},
		},
		{
			name: "ListAdminContentTopics",
			run: func() error {
				_, err := ListAdminContentTopics(context.Background(), nil, "en", "")
				return err
			},
		},
		{
			name: "ListAdminContentTopicsPage",
			run: func() error {
				_, err := ListAdminContentTopicsPage(context.Background(), nil, domain.AdminContentTaxonomyFilter{})
				return err
			},
		},
		{
			name: "ListAdminContentCategories",
			run: func() error {
				_, err := ListAdminContentCategories(context.Background(), nil, "en")
				return err
			},
		},
		{
			name: "ListAdminContentCategoriesPage",
			run: func() error {
				_, err := ListAdminContentCategoriesPage(context.Background(), nil, domain.AdminContentTaxonomyFilter{})
				return err
			},
		},
		{
			name: "UpdateAdminContentPostMetadata",
			run: func() error {
				_, err := UpdateAdminContentPostMetadata(context.Background(), nil, domain.AdminContentPostMetadataInput{})
				return err
			},
		},
		{
			name: "GetAdminContentPost",
			run: func() error {
				_, err := GetAdminContentPost(context.Background(), nil, "en", "alpha-post")
				return err
			},
		},
		{
			name: "UpdateAdminContentPostContent",
			run: func() error {
				_, err := UpdateAdminContentPostContent(context.Background(), nil, domain.AdminContentPostContentInput{})
				return err
			},
		},
		{
			name: "DeleteAdminContentPost",
			run: func() error {
				return DeleteAdminContentPost(context.Background(), nil, "en", "alpha-post")
			},
		},
		{
			name: "CreateAdminContentTopic",
			run: func() error {
				_, err := CreateAdminContentTopic(context.Background(), nil, domain.AdminContentTopicInput{})
				return err
			},
		},
		{
			name: "UpdateAdminContentTopic",
			run: func() error {
				_, err := UpdateAdminContentTopic(context.Background(), nil, domain.AdminContentTopicInput{})
				return err
			},
		},
		{
			name: "DeleteAdminContentTopic",
			run: func() error {
				return DeleteAdminContentTopic(context.Background(), nil, "en", "alpha-topic")
			},
		},
		{
			name: "CreateAdminContentCategory",
			run: func() error {
				_, err := CreateAdminContentCategory(context.Background(), nil, domain.AdminContentCategoryInput{})
				return err
			},
		},
		{
			name: "UpdateAdminContentCategory",
			run: func() error {
				_, err := UpdateAdminContentCategory(context.Background(), nil, domain.AdminContentCategoryInput{})
				return err
			},
		},
		{
			name: "DeleteAdminContentCategory",
			run: func() error {
				return DeleteAdminContentCategory(context.Background(), nil, "en", "alpha-category")
			},
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			if err := testCase.run(); err == nil || !strings.Contains(err.Error(), "admin authentication required") {
				t.Fatalf("expected auth error, got %v", err)
			}
		})
	}
}

func TestNormalizeAdminContentHelperFunctions(t *testing.T) {
	if _, err := normalizeAdminContentThumbnail("javascript:alert(1)"); err == nil {
		t.Fatal("expected thumbnail validation error")
	}
	if value, err := normalizeAdminContentThumbnail(""); err != nil || value != "" {
		t.Fatalf("expected empty thumbnail, got %q err=%v", value, err)
	}
	if value, err := normalizeAdminContentThumbnail("https://example.com/alpha.png"); err != nil || value == "" {
		t.Fatalf("expected valid thumbnail, got %q err=%v", value, err)
	}
	if _, err := normalizeAdminContentThumbnail(strings.Repeat("a", adminContentThumbnailMaxLength+1)); err == nil {
		t.Fatal("expected thumbnail length validation error")
	}
	if _, err := normalizeAdminContentRequiredDate("2026/03/21", "published date"); err == nil {
		t.Fatal("expected required date validation error")
	}
	if value, err := normalizeAdminContentOptionalDate(" ", "updated date"); err != nil || value != "" {
		t.Fatalf("expected empty optional date, got %q err=%v", value, err)
	}
	if _, err := normalizeAdminContentOptionalDate("2026/03/21", "updated date"); err == nil {
		t.Fatal("expected optional date validation error")
	}
	if _, err := normalizeAdminContentLocale("all", false); err == nil {
		t.Fatal("expected locale validation error")
	}
	if value, err := normalizeAdminContentLocale(" tr ", false); err != nil || value != "tr" {
		t.Fatalf("expected normalized locale, got %q err=%v", value, err)
	}
	if _, err := normalizeAdminContentSource("rss", true); err == nil {
		t.Fatal("expected source validation error")
	}
	if value, err := normalizeAdminContentSource("all", true); err != nil || value != "" {
		t.Fatalf("expected all source normalization, got %q err=%v", value, err)
	}
	if _, err := normalizeAdminContentSource("", false); err == nil {
		t.Fatal("expected required source validation error")
	}
	if _, err := normalizeAdminContentID("Invalid ID", "post id"); err == nil {
		t.Fatal("expected id validation error")
	}
	if _, err := normalizeAdminContentName("", "topic name"); err == nil {
		t.Fatal("expected name validation error")
	}
	if _, err := normalizeAdminContentName(strings.Repeat("a", adminContentNameMaxLength+1), "topic name"); err == nil {
		t.Fatal("expected name length validation error")
	}
	if _, err := normalizeAdminContentColor("", "topic color"); err == nil {
		t.Fatal("expected color validation error")
	}
	if _, err := normalizeAdminContentColor(strings.Repeat("a", adminContentColorMaxLength+1), "topic color"); err == nil {
		t.Fatal("expected color length validation error")
	}
	if _, err := normalizeAdminContentLink("mailto:test@example.com"); err == nil {
		t.Fatal("expected link validation error")
	}
	if value, err := normalizeAdminContentLink(""); err != nil || value != "" {
		t.Fatalf("expected empty link, got %q err=%v", value, err)
	}
	if _, err := normalizeAdminContentPostTitle(""); err == nil {
		t.Fatal("expected post title validation error")
	}
	if _, err := normalizeAdminContentPostTitle(strings.Repeat("a", adminContentTitleMaxLength+1)); err == nil {
		t.Fatal("expected post title length validation error")
	}
	if _, err := normalizeAdminContentPostSummary(strings.Repeat("a", adminContentSummaryMaxLength+1)); err == nil {
		t.Fatal("expected post summary length validation error")
	}
	if _, err := normalizeAdminContentBody("  "); err == nil {
		t.Fatal("expected body validation error")
	}
	if value, err := normalizeAdminContentBody("line1\r\nline2"); err != nil || value != "line1\nline2" {
		t.Fatalf("expected normalized body, got %q err=%v", value, err)
	}
}

func TestNormalizeAdminContentIDsDeduplicatesAndSorts(t *testing.T) {
	ids, err := normalizeAdminContentIDs([]string{" beta ", "alpha", "beta", "ALPHA"}, "topic id")
	if err != nil {
		t.Fatalf("normalizeAdminContentIDs returned error: %v", err)
	}
	if len(ids) != 2 || ids[0] != "alpha" || ids[1] != "beta" {
		t.Fatalf("unexpected ids: %#v", ids)
	}
}

func TestToAdminContentErrorMapsRepositoryErrors(t *testing.T) {
	testCases := []struct {
		err     error
		message string
	}{
		{err: repository.ErrAdminContentRepositoryUnavailable, message: "admin content management is unavailable"},
		{err: repository.ErrAdminContentPostNotFound, message: "content post not found"},
		{err: repository.ErrAdminContentTopicNotFound, message: "content topic not found"},
		{err: repository.ErrAdminContentCategoryNotFound, message: "content category not found"},
	}

	for _, testCase := range testCases {
		if result := toAdminContentError(testCase.err, "fallback"); result == nil || !strings.Contains(result.Error(), testCase.message) {
			t.Fatalf("expected %q mapping, got %v", testCase.message, result)
		}
	}

	internalErr := toAdminContentError(errors.New("boom"), "fallback")
	if internalErr == nil || !strings.Contains(internalErr.Error(), "fallback") {
		t.Fatalf("expected fallback internal error, got %v", internalErr)
	}
}

func TestCreateAdminContentAuditLogIncludesTraceMetadata(t *testing.T) {
	previousAuditRepo := adminAuditLogRepo
	t.Cleanup(func() {
		adminAuditLogRepo = previousAuditRepo
	})

	audit := &adminErrorMessageManagementAuditStub{}
	adminAuditLogRepo = audit

	ctx := httpapi.WithRequestID(context.Background(), "request-1")
	ctx = httpapi.WithRequestTrace(ctx, httpapi.RequestTrace{
		RemoteIP:    "203.0.113.10",
		CountryCode: "tr",
		UserAgent:   "browser",
	})

	if err := createAdminContentAuditLog(
		ctx,
		&domain.AdminUser{ID: "admin-1", Email: "admin@example.com"},
		"content_post_updated",
		"post",
		"en",
		"alpha-post",
		`{"before":true}`,
		`{"after":true}`,
	); err != nil {
		t.Fatalf("createAdminContentAuditLog returned error: %v", err)
	}
	if len(audit.records) != 1 {
		t.Fatalf("expected 1 audit record, got %d", len(audit.records))
	}
	record := audit.records[0]
	if record.RequestID != "request-1" || record.RemoteIP != "203.0.113.10" || record.CountryCode != "TR" {
		t.Fatalf("unexpected audit record: %#v", record)
	}
	if record.Code != "ALPHA-POST" || record.Resource != adminContentAuditResource {
		t.Fatalf("unexpected audit identifiers: %#v", record)
	}
}

func TestCreateAdminContentAuditLogRequiresAdminUser(t *testing.T) {
	if err := createAdminContentAuditLog(context.Background(), nil, "action", "scope", "en", "alpha", "", ""); err == nil || !strings.Contains(err.Error(), "admin authentication required") {
		t.Fatalf("expected auth error, got %v", err)
	}
}

func TestMarshalAdminContentAuditValueHandlesRecords(t *testing.T) {
	value := marshalAdminContentAuditValue(domain.AdminContentTopicRecord{
		Locale: "en",
		ID:     "alpha-topic",
		Name:   "Alpha Topic",
	})
	if value == "" || !strings.Contains(value, `"alpha-topic"`) {
		t.Fatalf("unexpected marshalled value: %q", value)
	}
	if value := marshalAdminContentAuditValue(make(chan int)); value != "" {
		t.Fatalf("expected marshal failure fallback, got %q", value)
	}
}
