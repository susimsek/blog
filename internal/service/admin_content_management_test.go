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

	"go.mongodb.org/mongo-driver/bson"
)

type adminContentStubRepository struct {
	findPostByLocaleAndID func(context.Context, string, string) (*domain.AdminContentPostRecord, error)
	listPostGroups        func(context.Context, domain.AdminContentPostFilter) (*domain.AdminContentPostListResult, error)
	updatePostMetadata    func(
		context.Context,
		string,
		string,
		domain.AdminContentPostMetadataFields,
		*domain.AdminContentCategoryRecord,
		[]domain.AdminContentTopicRecord,
		time.Time,
	) (*domain.AdminContentPostRecord, error)
	updatePostContent           func(context.Context, string, string, string, time.Time) (*domain.AdminContentPostRecord, error)
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

func (stub adminContentStubRepository) UpdatePostMetadata(
	ctx context.Context,
	locale string,
	postID string,
	fields domain.AdminContentPostMetadataFields,
	category *domain.AdminContentCategoryRecord,
	topics []domain.AdminContentTopicRecord,
	now time.Time,
) (*domain.AdminContentPostRecord, error) {
	if stub.updatePostMetadata == nil {
		return nil, nil
	}
	return stub.updatePostMetadata(ctx, locale, postID, fields, category, topics, now)
}

func (stub adminContentStubRepository) UpdatePostContent(
	ctx context.Context,
	locale string,
	postID string,
	content string,
	now time.Time,
) (*domain.AdminContentPostRecord, error) {
	if stub.updatePostContent == nil {
		return nil, nil
	}
	return stub.updatePostContent(ctx, locale, postID, content, now)
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

func TestGetAdminContentPostPopulatesAnalytics(t *testing.T) {
	previousAdminContentRepository := adminContentRepository
	previousPostsRepository := postsRepository
	previousCommentRepository := postCommentRepository
	t.Cleanup(func() {
		adminContentRepository = previousAdminContentRepository
		postsRepository = previousPostsRepository
		postCommentRepository = previousCommentRepository
	})

	adminContentRepository = adminContentStubRepository{
		findPostByLocaleAndID: func(_ context.Context, locale, postID string) (*domain.AdminContentPostRecord, error) {
			if locale != "en" || postID != "alpha-post" {
				t.Fatalf("FindPostByLocaleAndID args = %q %q", locale, postID)
			}
			return &domain.AdminContentPostRecord{
				Locale:      locale,
				ID:          postID,
				Title:       "Alpha",
				PublishedAt: time.Date(2026, time.March, 15, 12, 0, 0, 0, time.UTC),
			}, nil
		},
	}
	postsRepository = postStubRepository{
		countPosts:            func(context.Context, bson.M) (int, error) { return 0, nil },
		findPosts:             func(context.Context, bson.M, string, int64, int64) ([]domain.PostRecord, error) { return nil, nil },
		findPostByID:          func(context.Context, string, string) (*domain.PostRecord, error) { return nil, nil },
		findPostByIDAnyLocale: func(context.Context, string) (*domain.PostRecord, error) { return nil, nil },
		resolveLikesByPostID: func(_ context.Context, posts []domain.PostRecord) map[string]int64 {
			return map[string]int64{posts[0].ID: 18}
		},
		resolveHitsByPostID: func(_ context.Context, posts []domain.PostRecord) map[string]int64 {
			return map[string]int64{posts[0].ID: 150}
		},
		incrementPostLike: func(context.Context, string, time.Time) (int64, error) { return 0, nil },
		incrementPostHit:  func(context.Context, string, time.Time) (int64, error) { return 0, nil },
	}
	postCommentRepository = postCommentStubRepository{
		countApprovedByPosts: func(_ context.Context, postIDs []string) (map[string]int64, error) {
			return map[string]int64{postIDs[0]: 7}, nil
		},
	}

	record, err := GetAdminContentPost(context.Background(), &domain.AdminUser{ID: "admin-1"}, "en", "alpha-post")
	if err != nil {
		t.Fatalf("GetAdminContentPost returned error: %v", err)
	}
	if record == nil {
		t.Fatal("expected content post record")
	}
	if record.ViewCount != 150 || record.LikeCount != 18 || record.CommentCount != 7 {
		t.Fatalf("unexpected analytics: %+v", record)
	}
}

func TestListAdminContentPostsPopulatesAnalytics(t *testing.T) {
	previousAdminContentRepository := adminContentRepository
	previousPostsRepository := postsRepository
	previousCommentRepository := postCommentRepository
	t.Cleanup(func() {
		adminContentRepository = previousAdminContentRepository
		postsRepository = previousPostsRepository
		postCommentRepository = previousCommentRepository
	})

	adminContentRepository = adminContentStubRepository{
		listPostGroups: func(_ context.Context, filter domain.AdminContentPostFilter) (*domain.AdminContentPostListResult, error) {
			if filter.PreferredLocale != "en" {
				t.Fatalf("preferred locale = %q", filter.PreferredLocale)
			}
			return &domain.AdminContentPostListResult{
				Items: []domain.AdminContentPostGroupRecord{
					{
						ID:     "alpha-post",
						Source: "blog",
						Preferred: domain.AdminContentPostRecord{
							Locale: "en",
							ID:     "alpha-post",
							Title:  "Alpha",
						},
					},
				},
				Total: 1,
				Page:  1,
				Size:  10,
			}, nil
		},
	}
	postsRepository = postStubRepository{
		countPosts:            func(context.Context, bson.M) (int, error) { return 0, nil },
		findPosts:             func(context.Context, bson.M, string, int64, int64) ([]domain.PostRecord, error) { return nil, nil },
		findPostByID:          func(context.Context, string, string) (*domain.PostRecord, error) { return nil, nil },
		findPostByIDAnyLocale: func(context.Context, string) (*domain.PostRecord, error) { return nil, nil },
		resolveLikesByPostID: func(_ context.Context, posts []domain.PostRecord) map[string]int64 {
			return map[string]int64{posts[0].ID: 9}
		},
		resolveHitsByPostID: func(_ context.Context, posts []domain.PostRecord) map[string]int64 {
			return map[string]int64{posts[0].ID: 27}
		},
		incrementPostLike: func(context.Context, string, time.Time) (int64, error) { return 0, nil },
		incrementPostHit:  func(context.Context, string, time.Time) (int64, error) { return 0, nil },
	}
	postCommentRepository = postCommentStubRepository{
		countApprovedByPosts: func(_ context.Context, postIDs []string) (map[string]int64, error) {
			return map[string]int64{postIDs[0]: 4}, nil
		},
	}

	result, err := ListAdminContentPosts(context.Background(), &domain.AdminUser{ID: "admin-1"}, domain.AdminContentPostFilter{})
	if err != nil {
		t.Fatalf("ListAdminContentPosts returned error: %v", err)
	}
	if result == nil || len(result.Items) != 1 {
		t.Fatalf("unexpected result: %#v", result)
	}
	item := result.Items[0].Preferred
	if item.ViewCount != 27 || item.LikeCount != 9 || item.CommentCount != 4 {
		t.Fatalf("unexpected analytics: %+v", item)
	}
}

func TestListAdminContentTaxonomiesReturnsRepositoryResults(t *testing.T) {
	previousAdminContentRepository := adminContentRepository
	t.Cleanup(func() {
		adminContentRepository = previousAdminContentRepository
	})

	adminContentRepository = adminContentStubRepository{
		listTopics: func(_ context.Context, locale, query string) ([]domain.AdminContentTopicRecord, error) {
			if locale != "en" || query != "alpha" {
				t.Fatalf("ListTopics args = %q %q", locale, query)
			}
			return []domain.AdminContentTopicRecord{{Locale: locale, ID: "alpha-topic", Name: "Alpha Topic"}}, nil
		},
		listTopicGroups: func(_ context.Context, filter domain.AdminContentTaxonomyFilter) (*domain.AdminContentTopicListResult, error) {
			if filter.PreferredLocale != "tr" {
				t.Fatalf("preferred locale = %q", filter.PreferredLocale)
			}
			return &domain.AdminContentTopicListResult{
				Items: []domain.AdminContentTopicGroupRecord{{ID: "alpha-topic"}},
				Total: 1,
				Page:  1,
				Size:  20,
			}, nil
		},
		listCategories: func(_ context.Context, locale string) ([]domain.AdminContentCategoryRecord, error) {
			return []domain.AdminContentCategoryRecord{{Locale: locale, ID: "alpha-category", Name: "Alpha Category"}}, nil
		},
		listCategoryGroups: func(_ context.Context, filter domain.AdminContentTaxonomyFilter) (*domain.AdminContentCategoryListResult, error) {
			return &domain.AdminContentCategoryListResult{
				Items: []domain.AdminContentCategoryGroupRecord{{ID: "alpha-category"}},
				Total: 1,
				Page:  1,
				Size:  20,
			}, nil
		},
	}

	topics, err := ListAdminContentTopics(context.Background(), &domain.AdminUser{ID: "admin-1"}, "en", "alpha")
	if err != nil || len(topics) != 1 {
		t.Fatalf("ListAdminContentTopics result = %#v, err=%v", topics, err)
	}

	topicsPage, err := ListAdminContentTopicsPage(context.Background(), &domain.AdminUser{ID: "admin-1"}, domain.AdminContentTaxonomyFilter{
		PreferredLocale: "tr",
	})
	if err != nil || topicsPage == nil || topicsPage.Total != 1 {
		t.Fatalf("ListAdminContentTopicsPage result = %#v, err=%v", topicsPage, err)
	}

	categories, err := ListAdminContentCategories(context.Background(), &domain.AdminUser{ID: "admin-1"}, "tr")
	if err != nil || len(categories) != 1 {
		t.Fatalf("ListAdminContentCategories result = %#v, err=%v", categories, err)
	}

	categoriesPage, err := ListAdminContentCategoriesPage(context.Background(), &domain.AdminUser{ID: "admin-1"}, domain.AdminContentTaxonomyFilter{})
	if err != nil || categoriesPage == nil || categoriesPage.Total != 1 {
		t.Fatalf("ListAdminContentCategoriesPage result = %#v, err=%v", categoriesPage, err)
	}
}

func TestUpdateAdminContentPostMetadataUpdatesAndAudits(t *testing.T) {
	previousAdminContentRepository := adminContentRepository
	previousAuditRepo := adminAuditLogRepo
	previousPostsRepository := postsRepository
	previousCommentRepository := postCommentRepository
	t.Cleanup(func() {
		adminContentRepository = previousAdminContentRepository
		adminAuditLogRepo = previousAuditRepo
		postsRepository = previousPostsRepository
		postCommentRepository = previousCommentRepository
	})

	audit := &adminErrorMessageManagementAuditStub{}
	adminAuditLogRepo = audit

	title := " New Title "
	summary := " New Summary "
	thumbnail := " /images/new-alpha.png "
	publishedDate := "2026-03-20"
	updatedDate := "2026-03-21"

	adminContentRepository = adminContentStubRepository{
		findPostByLocaleAndID: func(_ context.Context, locale, postID string) (*domain.AdminContentPostRecord, error) {
			switch postID {
			case "alpha-post":
				return &domain.AdminContentPostRecord{
					Locale:        locale,
					ID:            postID,
					Title:         "Old Title",
					Summary:       "Old Summary",
					Thumbnail:     "/images/old-alpha.png",
					PublishedDate: "2026-03-01",
					UpdatedDate:   "2026-03-02",
					Source:        "blog",
				}, nil
			case "alpha-topic":
				t.Fatal("topic lookup routed to post finder")
			}
			return nil, nil
		},
		findCategoryByLocaleAndID: func(_ context.Context, locale, categoryID string) (*domain.AdminContentCategoryRecord, error) {
			if locale != "en" || categoryID != "tech" {
				t.Fatalf("FindCategoryByLocaleAndID args = %q %q", locale, categoryID)
			}
			return &domain.AdminContentCategoryRecord{Locale: locale, ID: categoryID, Name: "Technology"}, nil
		},
		findTopicByLocaleAndID: func(_ context.Context, locale, topicID string) (*domain.AdminContentTopicRecord, error) {
			if locale != "en" {
				t.Fatalf("unexpected topic locale %q", locale)
			}
			return &domain.AdminContentTopicRecord{Locale: locale, ID: topicID, Name: strings.ToUpper(topicID)}, nil
		},
		updatePostMetadata: func(
			_ context.Context,
			locale string,
			postID string,
			fields domain.AdminContentPostMetadataFields,
			category *domain.AdminContentCategoryRecord,
			topics []domain.AdminContentTopicRecord,
			now time.Time,
		) (*domain.AdminContentPostRecord, error) {
			if locale != "en" || postID != "alpha-post" {
				t.Fatalf("UpdatePostMetadata args = %q %q", locale, postID)
			}
			if fields.Title != "New Title" || fields.Summary != "New Summary" || fields.Thumbnail != "/images/new-alpha.png" {
				t.Fatalf("unexpected metadata fields: %#v", fields)
			}
			if category == nil || category.ID != "tech" {
				t.Fatalf("unexpected category: %#v", category)
			}
			if len(topics) != 2 || topics[0].ID != "alpha-topic" || topics[1].ID != "beta-topic" {
				t.Fatalf("unexpected topics: %#v", topics)
			}
			if now.IsZero() {
				t.Fatal("expected update timestamp")
			}
			return &domain.AdminContentPostRecord{
				Locale:        locale,
				ID:            postID,
				Title:         fields.Title,
				Summary:       fields.Summary,
				Thumbnail:     fields.Thumbnail,
				PublishedDate: fields.PublishedDate,
				UpdatedDate:   fields.UpdatedDate,
				CategoryID:    category.ID,
				CategoryName:  category.Name,
				TopicIDs:      []string{topics[0].ID, topics[1].ID},
				Source:        "blog",
			}, nil
		},
	}
	postsRepository = postStubRepository{
		countPosts:            func(context.Context, bson.M) (int, error) { return 0, nil },
		findPosts:             func(context.Context, bson.M, string, int64, int64) ([]domain.PostRecord, error) { return nil, nil },
		findPostByID:          func(context.Context, string, string) (*domain.PostRecord, error) { return nil, nil },
		findPostByIDAnyLocale: func(context.Context, string) (*domain.PostRecord, error) { return nil, nil },
		resolveLikesByPostID: func(_ context.Context, posts []domain.PostRecord) map[string]int64 {
			return map[string]int64{posts[0].ID: 12}
		},
		resolveHitsByPostID: func(_ context.Context, posts []domain.PostRecord) map[string]int64 {
			return map[string]int64{posts[0].ID: 44}
		},
		incrementPostLike: func(context.Context, string, time.Time) (int64, error) { return 0, nil },
		incrementPostHit:  func(context.Context, string, time.Time) (int64, error) { return 0, nil },
	}
	postCommentRepository = postCommentStubRepository{
		countApprovedByPosts: func(_ context.Context, postIDs []string) (map[string]int64, error) {
			return map[string]int64{postIDs[0]: 5}, nil
		},
	}

	record, err := UpdateAdminContentPostMetadata(context.Background(), &domain.AdminUser{ID: "admin-1", Email: "admin@example.com"}, domain.AdminContentPostMetadataInput{
		Locale:        " en ",
		ID:            " alpha-post ",
		Title:         &title,
		Summary:       &summary,
		Thumbnail:     &thumbnail,
		PublishedDate: &publishedDate,
		UpdatedDate:   &updatedDate,
		CategoryID:    " Tech ",
		TopicIDs:      []string{" beta-topic ", "alpha-topic", "beta-topic"},
	})
	if err != nil {
		t.Fatalf("UpdateAdminContentPostMetadata returned error: %v", err)
	}
	if record == nil || record.Title != "New Title" || record.ViewCount != 44 || record.LikeCount != 12 || record.CommentCount != 5 {
		t.Fatalf("unexpected updated record: %#v", record)
	}
	if len(audit.records) != 1 || audit.records[0].Action != "content_post_updated" {
		t.Fatalf("unexpected audit records: %#v", audit.records)
	}
}

func TestUpdateAdminContentPostContentUpdatesAndAudits(t *testing.T) {
	previousAdminContentRepository := adminContentRepository
	previousAuditRepo := adminAuditLogRepo
	previousPostsRepository := postsRepository
	previousCommentRepository := postCommentRepository
	t.Cleanup(func() {
		adminContentRepository = previousAdminContentRepository
		adminAuditLogRepo = previousAuditRepo
		postsRepository = previousPostsRepository
		postCommentRepository = previousCommentRepository
	})

	audit := &adminErrorMessageManagementAuditStub{}
	adminAuditLogRepo = audit
	adminContentRepository = adminContentStubRepository{
		findPostByLocaleAndID: func(_ context.Context, locale, postID string) (*domain.AdminContentPostRecord, error) {
			return &domain.AdminContentPostRecord{
				Locale:  locale,
				ID:      postID,
				Title:   "Alpha",
				Content: "Old body",
				Source:  "BLOG",
			}, nil
		},
		updatePostContent: func(_ context.Context, locale, postID, content string, now time.Time) (*domain.AdminContentPostRecord, error) {
			if locale != "en" || postID != "alpha-post" || content != "  # Updated body  " || now.IsZero() {
				t.Fatalf("unexpected UpdatePostContent args: %q %q %q %v", locale, postID, content, now)
			}
			return &domain.AdminContentPostRecord{Locale: locale, ID: postID, Title: "Alpha", Content: content, Source: "blog"}, nil
		},
	}
	postsRepository = postStubRepository{
		countPosts:            func(context.Context, bson.M) (int, error) { return 0, nil },
		findPosts:             func(context.Context, bson.M, string, int64, int64) ([]domain.PostRecord, error) { return nil, nil },
		findPostByID:          func(context.Context, string, string) (*domain.PostRecord, error) { return nil, nil },
		findPostByIDAnyLocale: func(context.Context, string) (*domain.PostRecord, error) { return nil, nil },
		resolveLikesByPostID: func(_ context.Context, posts []domain.PostRecord) map[string]int64 {
			return map[string]int64{posts[0].ID: 2}
		},
		resolveHitsByPostID: func(_ context.Context, posts []domain.PostRecord) map[string]int64 {
			return map[string]int64{posts[0].ID: 19}
		},
		incrementPostLike: func(context.Context, string, time.Time) (int64, error) { return 0, nil },
		incrementPostHit:  func(context.Context, string, time.Time) (int64, error) { return 0, nil },
	}
	postCommentRepository = postCommentStubRepository{
		countApprovedByPosts: func(_ context.Context, postIDs []string) (map[string]int64, error) {
			return map[string]int64{postIDs[0]: 3}, nil
		},
	}

	record, err := UpdateAdminContentPostContent(context.Background(), &domain.AdminUser{ID: "admin-1", Email: "admin@example.com"}, domain.AdminContentPostContentInput{
		Locale:  "en",
		ID:      "alpha-post",
		Content: "  # Updated body  ",
	})
	if err != nil {
		t.Fatalf("UpdateAdminContentPostContent returned error: %v", err)
	}
	if record == nil || record.Content != "  # Updated body  " || record.ViewCount != 19 || record.LikeCount != 2 || record.CommentCount != 3 {
		t.Fatalf("unexpected content update result: %#v", record)
	}
	if len(audit.records) != 1 || audit.records[0].Action != "content_post_content_updated" {
		t.Fatalf("unexpected audit records: %#v", audit.records)
	}
}

func TestDeleteAdminContentPostDeletesAndAudits(t *testing.T) {
	previousAdminContentRepository := adminContentRepository
	previousAuditRepo := adminAuditLogRepo
	t.Cleanup(func() {
		adminContentRepository = previousAdminContentRepository
		adminAuditLogRepo = previousAuditRepo
	})

	audit := &adminErrorMessageManagementAuditStub{}
	adminAuditLogRepo = audit
	adminContentRepository = adminContentStubRepository{
		findPostByLocaleAndID: func(_ context.Context, locale, postID string) (*domain.AdminContentPostRecord, error) {
			return &domain.AdminContentPostRecord{Locale: locale, ID: postID, Title: "Alpha", Source: "blog"}, nil
		},
		deletePostByLocaleAndID: func(_ context.Context, locale, postID string) (bool, error) {
			if locale != "en" || postID != "alpha-post" {
				t.Fatalf("DeletePostByLocaleAndID args = %q %q", locale, postID)
			}
			return true, nil
		},
	}

	if err := DeleteAdminContentPost(context.Background(), &domain.AdminUser{ID: "admin-1", Email: "admin@example.com"}, "en", "alpha-post"); err != nil {
		t.Fatalf("DeleteAdminContentPost returned error: %v", err)
	}
	if len(audit.records) != 1 || audit.records[0].Action != "content_post_deleted" {
		t.Fatalf("unexpected audit records: %#v", audit.records)
	}
}

func TestAdminContentTopicWorkflowsPersistAndAudit(t *testing.T) {
	previousAdminContentRepository := adminContentRepository
	previousAuditRepo := adminAuditLogRepo
	t.Cleanup(func() {
		adminContentRepository = previousAdminContentRepository
		adminAuditLogRepo = previousAuditRepo
	})

	audit := &adminErrorMessageManagementAuditStub{}
	adminAuditLogRepo = audit
	topics := map[string]domain.AdminContentTopicRecord{}
	topicKey := func(locale, id string) string { return locale + "|" + id }
	syncCalls := 0
	removeCalls := 0

	adminContentRepository = adminContentStubRepository{
		findTopicByLocaleAndID: func(_ context.Context, locale, topicID string) (*domain.AdminContentTopicRecord, error) {
			record, ok := topics[topicKey(locale, topicID)]
			if !ok {
				return nil, nil
			}
			copyRecord := record
			return &copyRecord, nil
		},
		upsertTopic: func(_ context.Context, record domain.AdminContentTopicRecord, now time.Time) (*domain.AdminContentTopicRecord, error) {
			record.UpdatedAt = now
			topics[topicKey(record.Locale, record.ID)] = record
			copyRecord := record
			return &copyRecord, nil
		},
		deleteTopicByLocaleAndID: func(_ context.Context, locale, topicID string) (bool, error) {
			delete(topics, topicKey(locale, topicID))
			return true, nil
		},
		syncTopicOnPosts: func(_ context.Context, record domain.AdminContentTopicRecord, now time.Time) error {
			if record.ID == "" || now.IsZero() {
				t.Fatalf("unexpected sync topic call: %#v %v", record, now)
			}
			syncCalls++
			return nil
		},
		removeTopicFromPosts: func(_ context.Context, locale, topicID string, now time.Time) error {
			if locale != "en" || topicID != "alpha-topic" || now.IsZero() {
				t.Fatalf("unexpected remove topic call: %q %q %v", locale, topicID, now)
			}
			removeCalls++
			return nil
		},
	}

	created, err := CreateAdminContentTopic(context.Background(), &domain.AdminUser{ID: "admin-1", Email: "admin@example.com"}, domain.AdminContentTopicInput{
		Locale: "en",
		ID:     "alpha-topic",
		Name:   "Alpha Topic",
		Color:  "#112233",
		Link:   "https://example.com/topics/alpha",
	})
	if err != nil || created == nil || created.Name != "Alpha Topic" {
		t.Fatalf("CreateAdminContentTopic result = %#v, err=%v", created, err)
	}

	updated, err := UpdateAdminContentTopic(context.Background(), &domain.AdminUser{ID: "admin-1", Email: "admin@example.com"}, domain.AdminContentTopicInput{
		Locale: "en",
		ID:     "alpha-topic",
		Name:   "Alpha Topic Updated",
		Color:  "#445566",
		Link:   "https://example.com/topics/alpha-updated",
	})
	if err != nil || updated == nil || updated.Name != "Alpha Topic Updated" {
		t.Fatalf("UpdateAdminContentTopic result = %#v, err=%v", updated, err)
	}

	if err := DeleteAdminContentTopic(context.Background(), &domain.AdminUser{ID: "admin-1", Email: "admin@example.com"}, "en", "alpha-topic"); err != nil {
		t.Fatalf("DeleteAdminContentTopic returned error: %v", err)
	}

	if syncCalls != 2 || removeCalls != 1 {
		t.Fatalf("unexpected topic sync calls: sync=%d remove=%d", syncCalls, removeCalls)
	}
	if len(audit.records) != 3 || audit.records[0].Action != "content_topic_created" || audit.records[1].Action != "content_topic_updated" || audit.records[2].Action != "content_topic_deleted" {
		t.Fatalf("unexpected audit records: %#v", audit.records)
	}
}

func TestAdminContentCategoryWorkflowsPersistAndAudit(t *testing.T) {
	previousAdminContentRepository := adminContentRepository
	previousAuditRepo := adminAuditLogRepo
	t.Cleanup(func() {
		adminContentRepository = previousAdminContentRepository
		adminAuditLogRepo = previousAuditRepo
	})

	audit := &adminErrorMessageManagementAuditStub{}
	adminAuditLogRepo = audit
	categories := map[string]domain.AdminContentCategoryRecord{}
	categoryKey := func(locale, id string) string { return locale + "|" + id }
	syncCalls := 0
	clearCalls := 0

	adminContentRepository = adminContentStubRepository{
		findCategoryByLocaleAndID: func(_ context.Context, locale, categoryID string) (*domain.AdminContentCategoryRecord, error) {
			record, ok := categories[categoryKey(locale, categoryID)]
			if !ok {
				return nil, nil
			}
			copyRecord := record
			return &copyRecord, nil
		},
		upsertCategory: func(_ context.Context, record domain.AdminContentCategoryRecord, now time.Time) (*domain.AdminContentCategoryRecord, error) {
			record.UpdatedAt = now
			categories[categoryKey(record.Locale, record.ID)] = record
			copyRecord := record
			return &copyRecord, nil
		},
		deleteCategoryByLocaleAndID: func(_ context.Context, locale, categoryID string) (bool, error) {
			delete(categories, categoryKey(locale, categoryID))
			return true, nil
		},
		syncCategoryOnPosts: func(_ context.Context, record domain.AdminContentCategoryRecord, now time.Time) error {
			if record.ID == "" || now.IsZero() {
				t.Fatalf("unexpected sync category call: %#v %v", record, now)
			}
			syncCalls++
			return nil
		},
		clearCategoryFromPosts: func(_ context.Context, locale, categoryID string, now time.Time) error {
			if locale != "en" || categoryID != "alpha-category" || now.IsZero() {
				t.Fatalf("unexpected clear category call: %q %q %v", locale, categoryID, now)
			}
			clearCalls++
			return nil
		},
	}

	created, err := CreateAdminContentCategory(context.Background(), &domain.AdminUser{ID: "admin-1", Email: "admin@example.com"}, domain.AdminContentCategoryInput{
		Locale: "en",
		ID:     "alpha-category",
		Name:   "Alpha Category",
		Color:  "#112233",
		Icon:   "tag",
		Link:   "https://example.com/categories/alpha",
	})
	if err != nil || created == nil || created.Name != "Alpha Category" {
		t.Fatalf("CreateAdminContentCategory result = %#v, err=%v", created, err)
	}

	updated, err := UpdateAdminContentCategory(context.Background(), &domain.AdminUser{ID: "admin-1", Email: "admin@example.com"}, domain.AdminContentCategoryInput{
		Locale: "en",
		ID:     "alpha-category",
		Name:   "Alpha Category Updated",
		Color:  "#445566",
		Icon:   "folder",
		Link:   "https://example.com/categories/alpha-updated",
	})
	if err != nil || updated == nil || updated.Name != "Alpha Category Updated" {
		t.Fatalf("UpdateAdminContentCategory result = %#v, err=%v", updated, err)
	}

	if err := DeleteAdminContentCategory(context.Background(), &domain.AdminUser{ID: "admin-1", Email: "admin@example.com"}, "en", "alpha-category"); err != nil {
		t.Fatalf("DeleteAdminContentCategory returned error: %v", err)
	}

	if syncCalls != 2 || clearCalls != 1 {
		t.Fatalf("unexpected category sync calls: sync=%d clear=%d", syncCalls, clearCalls)
	}
	if len(audit.records) != 3 || audit.records[0].Action != "content_category_created" || audit.records[1].Action != "content_category_updated" || audit.records[2].Action != "content_category_deleted" {
		t.Fatalf("unexpected audit records: %#v", audit.records)
	}
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

func TestUpdateAdminContentPostMetadataRejectsMissingRelations(t *testing.T) {
	previousAdminContentRepository := adminContentRepository
	t.Cleanup(func() {
		adminContentRepository = previousAdminContentRepository
	})

	adminUser := &domain.AdminUser{ID: "admin-1"}
	basePost := &domain.AdminContentPostRecord{
		Locale:        "en",
		ID:            "alpha-post",
		Title:         "Alpha",
		Summary:       "Summary",
		PublishedDate: "2026-03-01",
		UpdatedDate:   "2026-03-02",
	}

	t.Run("missing category", func(t *testing.T) {
		adminContentRepository = adminContentStubRepository{
			findPostByLocaleAndID: func(_ context.Context, _, _ string) (*domain.AdminContentPostRecord, error) {
				record := *basePost
				return &record, nil
			},
			findCategoryByLocaleAndID: func(_ context.Context, locale, categoryID string) (*domain.AdminContentCategoryRecord, error) {
				if locale != "en" || categoryID != "tech" {
					t.Fatalf("unexpected category lookup args: %q %q", locale, categoryID)
				}
				return nil, nil
			},
		}

		_, err := UpdateAdminContentPostMetadata(context.Background(), adminUser, domain.AdminContentPostMetadataInput{
			Locale:     "en",
			ID:         "alpha-post",
			CategoryID: "tech",
		})
		if err == nil || !strings.Contains(err.Error(), "content category not found") {
			t.Fatalf("expected category not found error, got %v", err)
		}
	})

	t.Run("missing topic", func(t *testing.T) {
		adminContentRepository = adminContentStubRepository{
			findPostByLocaleAndID: func(_ context.Context, _, _ string) (*domain.AdminContentPostRecord, error) {
				record := *basePost
				return &record, nil
			},
			findTopicByLocaleAndID: func(_ context.Context, locale, topicID string) (*domain.AdminContentTopicRecord, error) {
				if locale != "en" || topicID != "missing-topic" {
					t.Fatalf("unexpected topic lookup args: %q %q", locale, topicID)
				}
				return nil, nil
			},
		}

		_, err := UpdateAdminContentPostMetadata(context.Background(), adminUser, domain.AdminContentPostMetadataInput{
			Locale:   "en",
			ID:       "alpha-post",
			TopicIDs: []string{"missing-topic"},
		})
		if err == nil || !strings.Contains(err.Error(), "content topic not found") {
			t.Fatalf("expected topic not found error, got %v", err)
		}
	})
}

func TestAdminContentTopicAndCategorySyncFailures(t *testing.T) {
	previousAdminContentRepository := adminContentRepository
	t.Cleanup(func() {
		adminContentRepository = previousAdminContentRepository
	})

	adminUser := &domain.AdminUser{ID: "admin-1"}

	t.Run("topic sync failure", func(t *testing.T) {
		adminContentRepository = adminContentStubRepository{
			findTopicByLocaleAndID: func(context.Context, string, string) (*domain.AdminContentTopicRecord, error) {
				return nil, nil
			},
			upsertTopic: func(_ context.Context, record domain.AdminContentTopicRecord, now time.Time) (*domain.AdminContentTopicRecord, error) {
				record.UpdatedAt = now
				return &record, nil
			},
			syncTopicOnPosts: func(context.Context, domain.AdminContentTopicRecord, time.Time) error {
				return repository.ErrAdminContentRepositoryUnavailable
			},
		}

		_, err := CreateAdminContentTopic(context.Background(), adminUser, domain.AdminContentTopicInput{
			Locale: "en",
			ID:     "alpha-topic",
			Name:   "Alpha Topic",
			Color:  "#112233",
		})
		if err == nil || !strings.Contains(err.Error(), "admin content management is unavailable") {
			t.Fatalf("expected topic sync failure mapping, got %v", err)
		}
	})

	t.Run("category sync failure", func(t *testing.T) {
		adminContentRepository = adminContentStubRepository{
			findCategoryByLocaleAndID: func(context.Context, string, string) (*domain.AdminContentCategoryRecord, error) {
				return nil, nil
			},
			upsertCategory: func(_ context.Context, record domain.AdminContentCategoryRecord, now time.Time) (*domain.AdminContentCategoryRecord, error) {
				record.UpdatedAt = now
				return &record, nil
			},
			syncCategoryOnPosts: func(context.Context, domain.AdminContentCategoryRecord, time.Time) error {
				return repository.ErrAdminContentRepositoryUnavailable
			},
		}

		_, err := CreateAdminContentCategory(context.Background(), adminUser, domain.AdminContentCategoryInput{
			Locale: "en",
			ID:     "alpha-category",
			Name:   "Alpha Category",
			Color:  "#112233",
		})
		if err == nil || !strings.Contains(err.Error(), "admin content management is unavailable") {
			t.Fatalf("expected category sync failure mapping, got %v", err)
		}
	})
}

func TestNormalizeAdminContentTopicInputSanitizesValues(t *testing.T) {
	record, err := normalizeAdminContentTopicInput(domain.AdminContentTopicInput{
		Locale: " EN ",
		ID:     " Alpha-Topic ",
		Name:   " Alpha Topic ",
		Color:  " #00FF00 ",
		Link:   " https://example.com/topics/alpha ",
	})
	if err != nil {
		t.Fatalf("normalizeAdminContentTopicInput returned error: %v", err)
	}

	if record.Locale != "en" || record.ID != "alpha-topic" || record.Name != "Alpha Topic" || record.Color != "#00ff00" {
		t.Fatalf("unexpected record: %#v", record)
	}
	if record.Link != "https://example.com/topics/alpha" {
		t.Fatalf("unexpected link: %q", record.Link)
	}
}

func TestNormalizeAdminContentCategoryInputRejectsLongIcon(t *testing.T) {
	_, err := normalizeAdminContentCategoryInput(domain.AdminContentCategoryInput{
		Locale: "en",
		ID:     "alpha-category",
		Name:   "Alpha Category",
		Color:  "#abcdef",
		Icon:   string(make([]byte, adminContentIconMaxLength+1)),
	})
	if err == nil {
		t.Fatal("expected icon length validation error")
	}
}

func TestNormalizeAdminContentPostMetadataFieldsAppliesOverrides(t *testing.T) {
	title := " New Title "
	summary := " New summary "
	thumbnail := " /images/alpha.png "
	publishedDate := "2026-03-21"
	updatedDate := "2026-03-22"

	fields, err := normalizeAdminContentPostMetadataFields(domain.AdminContentPostMetadataInput{
		Title:         &title,
		Summary:       &summary,
		Thumbnail:     &thumbnail,
		PublishedDate: &publishedDate,
		UpdatedDate:   &updatedDate,
	}, domain.AdminContentPostRecord{
		Title:         "Old Title",
		Summary:       "Old summary",
		Thumbnail:     "/images/old.png",
		PublishedDate: "2026-01-01",
		UpdatedDate:   "2026-01-02",
	})
	if err != nil {
		t.Fatalf("normalizeAdminContentPostMetadataFields returned error: %v", err)
	}

	if fields.Title != "New Title" || fields.Summary != "New summary" || fields.Thumbnail != "/images/alpha.png" {
		t.Fatalf("unexpected fields: %#v", fields)
	}
	if fields.PublishedDate != "2026-03-21" || fields.UpdatedDate != "2026-03-22" {
		t.Fatalf("unexpected date fields: %#v", fields)
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
