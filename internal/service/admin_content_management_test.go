package service

import (
	"context"
	"errors"
	"strings"
	"testing"
	"time"

	"suaybsimsek.com/blog-api/internal/domain"
	"suaybsimsek.com/blog-api/internal/repository"
	"suaybsimsek.com/blog-api/internal/testassert"
	"suaybsimsek.com/blog-api/pkg/httpapi"
)

type adminContentStubRepository struct {
	findPostByLocaleAndID       func(context.Context, string, string) (*domain.AdminContentPostRecord, error)
	listPostGroups              func(context.Context, domain.AdminContentPostFilter) (*domain.AdminContentPostListResult, error)
	listPostRevisions           func(context.Context, string, string, int, int) (*domain.AdminContentPostRevisionListResult, error)
	findPostRevisionByID        func(context.Context, string, string, string) (*domain.AdminContentPostRevisionRecord, error)
	createPostRevision          func(context.Context, domain.AdminContentPostRecord, int, time.Time) (*domain.AdminContentPostRevisionRecord, error)
	updatePostMetadata          func(context.Context, domain.AdminContentPostMetadataUpdate) (*domain.AdminContentPostRecord, error)
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
	update domain.AdminContentPostMetadataUpdate,
) (*domain.AdminContentPostRecord, error) {
	if stub.updatePostMetadata == nil {
		return nil, nil
	}
	return stub.updatePostMetadata(ctx, update)
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
			testassert.Equal(t, filter.Locale, "", "post filter locale")
			testassert.Equal(t, filter.PreferredLocale, "en", "preferred post filter locale")
			testassert.Equal(t, filter.Source, "", "post filter source")
			testassert.Equal(t, filter.CategoryID, "tech", "post filter category")
			testassert.Equal(t, filter.TopicID, "alpha-topic", "post filter topic")
			testassert.NotNil(t, filter.Page, "post filter page should be set")
			testassert.Equal(t, *filter.Page, 1, "post filter page")
			testassert.NotNil(t, filter.Size, "post filter size should be set")
			testassert.Equal(t, *filter.Size, adminContentDefaultPageSize, "post filter size")
			return nil, nil
		},
		listTopics: func(_ context.Context, locale, query string) ([]domain.AdminContentTopicRecord, error) {
			testassert.Equal(t, locale, "", "topic list locale")
			testassert.Equal(t, query, "alpha", "topic list query")
			return nil, nil
		},
		listTopicGroups: func(_ context.Context, filter domain.AdminContentTaxonomyFilter) (*domain.AdminContentTopicListResult, error) {
			testassert.Equal(t, filter.Locale, "", "topic page locale")
			testassert.Equal(t, filter.PreferredLocale, "", "topic page preferred locale")
			testassert.NotNil(t, filter.Page, "topic page should be set")
			testassert.Equal(t, *filter.Page, 1, "topic page number")
			testassert.NotNil(t, filter.Size, "topic page size should be set")
			testassert.Equal(t, *filter.Size, adminContentDefaultPageSize, "topic page size")
			return nil, nil
		},
		listCategories: func(_ context.Context, locale string) ([]domain.AdminContentCategoryRecord, error) {
			testassert.Equal(t, locale, "", "category locale")
			return nil, nil
		},
		listCategoryGroups: func(_ context.Context, filter domain.AdminContentTaxonomyFilter) (*domain.AdminContentCategoryListResult, error) {
			testassert.Equal(t, filter.Locale, "", "category page locale")
			testassert.Equal(t, filter.PreferredLocale, "tr", "category preferred locale")
			testassert.NotNil(t, filter.Page, "category page should be set")
			testassert.Equal(t, *filter.Page, 1, "category page number")
			testassert.NotNil(t, filter.Size, "category page size should be set")
			testassert.Equal(t, *filter.Size, adminContentDefaultPageSize, "category page size")
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
	testassert.NoError(t, err, "ListAdminContentPosts")
	testassert.NotNil(t, posts, "post list should be returned")
	testassert.Equal(t, len(posts.Items), 0, "post list item count")
	testassert.Equal(t, posts.Total, 0, "post list total")
	testassert.Equal(t, posts.Page, 1, "post list page")
	testassert.Equal(t, posts.Size, adminContentDefaultPageSize, "post list size")

	topics, err := ListAdminContentTopics(context.Background(), &domain.AdminUser{ID: "admin-1"}, "all", " alpha ")
	testassert.NoError(t, err, "ListAdminContentTopics")
	testassert.Equal(t, len(topics), 0, "topic list item count")

	topicsPage, err := ListAdminContentTopicsPage(context.Background(), &domain.AdminUser{ID: "admin-1"}, domain.AdminContentTaxonomyFilter{})
	testassert.NoError(t, err, "ListAdminContentTopicsPage")
	testassert.NotNil(t, topicsPage, "topic page should be returned")
	testassert.Equal(t, len(topicsPage.Items), 0, "topic page item count")
	testassert.Equal(t, topicsPage.Total, 0, "topic page total")
	testassert.Equal(t, topicsPage.Page, 1, "topic page number")
	testassert.Equal(t, topicsPage.Size, adminContentDefaultPageSize, "topic page size")

	categories, err := ListAdminContentCategories(context.Background(), &domain.AdminUser{ID: "admin-1"}, "all")
	testassert.NoError(t, err, "ListAdminContentCategories")
	testassert.Equal(t, len(categories), 0, "category list item count")

	categoriesPage, err := ListAdminContentCategoriesPage(context.Background(), &domain.AdminUser{ID: "admin-1"}, domain.AdminContentTaxonomyFilter{
		PreferredLocale: "tr",
	})
	testassert.NoError(t, err, "ListAdminContentCategoriesPage")
	testassert.NotNil(t, categoriesPage, "category page should be returned")
	testassert.Equal(t, len(categoriesPage.Items), 0, "category page item count")
	testassert.Equal(t, categoriesPage.Total, 0, "category page total")
	testassert.Equal(t, categoriesPage.Page, 1, "category page number")
	testassert.Equal(t, categoriesPage.Size, adminContentDefaultPageSize, "category page size")
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
			testassert.Equal(t, locale, "en", "deleted topic locale")
			testassert.Equal(t, topicID, "existing-topic", "deleted topic ID")
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
			testassert.Equal(t, locale, "en", "deleted category locale")
			testassert.Equal(t, categoryID, "existing-category", "deleted category ID")
			return false, nil
		},
	}

	adminUser := &domain.AdminUser{ID: "admin-1"}

	_, err := GetAdminContentPost(context.Background(), adminUser, "en", "alpha-post")
	testassert.ErrorContains(t, err, "content post not found")

	_, err = UpdateAdminContentPostContent(context.Background(), adminUser, domain.AdminContentPostContentInput{
		Locale:  "en",
		ID:      "medium-post",
		Content: "updated",
	})
	testassert.ErrorContains(t, err, "only allowed for blog posts")

	err = DeleteAdminContentPost(context.Background(), adminUser, "en", "alpha-post")
	testassert.ErrorContains(t, err, "content post not found")

	_, err = CreateAdminContentTopic(context.Background(), adminUser, domain.AdminContentTopicInput{
		Locale: "en",
		ID:     "existing-topic",
		Name:   "Existing",
		Color:  "#112233",
	})
	testassert.ErrorContains(t, err, "already exists")

	_, err = UpdateAdminContentTopic(context.Background(), adminUser, domain.AdminContentTopicInput{
		Locale: "en",
		ID:     "missing-topic",
		Name:   "Missing",
		Color:  "#112233",
	})
	testassert.ErrorContains(t, err, "content topic not found")

	err = DeleteAdminContentTopic(context.Background(), adminUser, "en", "existing-topic")
	testassert.ErrorContains(t, err, "content topic not found")

	_, err = CreateAdminContentCategory(context.Background(), adminUser, domain.AdminContentCategoryInput{
		Locale: "en",
		ID:     "existing-category",
		Name:   "Existing",
		Color:  "#112233",
	})
	testassert.ErrorContains(t, err, "already exists")

	_, err = UpdateAdminContentCategory(context.Background(), adminUser, domain.AdminContentCategoryInput{
		Locale: "en",
		ID:     "missing-category",
		Name:   "Missing",
		Color:  "#112233",
	})
	testassert.ErrorContains(t, err, "content category not found")

	err = DeleteAdminContentCategory(context.Background(), adminUser, "en", "existing-category")
	testassert.ErrorContains(t, err, "content category not found")

	_, err = ListAdminContentPosts(context.Background(), nil, domain.AdminContentPostFilter{})
	testassert.ErrorContains(t, err, "admin authentication required")
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
