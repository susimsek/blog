package service

import (
	"context"
	"testing"
	"time"

	"suaybsimsek.com/blog-api/internal/domain"

	"go.mongodb.org/mongo-driver/bson"
)

type adminContentStubRepository struct {
	findPostByLocaleAndID func(context.Context, string, string) (*domain.AdminContentPostRecord, error)
	listPostGroups        func(context.Context, domain.AdminContentPostFilter) (*domain.AdminContentPostListResult, error)
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

func (adminContentStubRepository) UpdatePostMetadata(
	context.Context,
	string,
	string,
	domain.AdminContentPostMetadataFields,
	*domain.AdminContentCategoryRecord,
	[]domain.AdminContentTopicRecord,
	time.Time,
) (*domain.AdminContentPostRecord, error) {
	return nil, nil
}

func (adminContentStubRepository) UpdatePostContent(
	context.Context,
	string,
	string,
	string,
	time.Time,
) (*domain.AdminContentPostRecord, error) {
	return nil, nil
}

func (adminContentStubRepository) DeletePostByLocaleAndID(context.Context, string, string) (bool, error) {
	return false, nil
}

func (adminContentStubRepository) ListTopics(context.Context, string) ([]domain.AdminContentTopicRecord, error) {
	return nil, nil
}

func (adminContentStubRepository) ListTopicGroups(
	context.Context,
	domain.AdminContentTaxonomyFilter,
) (*domain.AdminContentTopicListResult, error) {
	return nil, nil
}

func (adminContentStubRepository) ListAllTopics(context.Context, domain.AdminContentTaxonomyFilter) ([]domain.AdminContentTopicRecord, error) {
	return nil, nil
}

func (adminContentStubRepository) FindTopicByLocaleAndID(context.Context, string, string) (*domain.AdminContentTopicRecord, error) {
	return nil, nil
}

func (adminContentStubRepository) UpsertTopic(context.Context, domain.AdminContentTopicRecord, time.Time) (*domain.AdminContentTopicRecord, error) {
	return nil, nil
}

func (adminContentStubRepository) DeleteTopicByLocaleAndID(context.Context, string, string) (bool, error) {
	return false, nil
}

func (adminContentStubRepository) SyncTopicOnPosts(context.Context, domain.AdminContentTopicRecord, time.Time) error {
	return nil
}

func (adminContentStubRepository) RemoveTopicFromPosts(context.Context, string, string, time.Time) error {
	return nil
}

func (adminContentStubRepository) ListCategories(context.Context, string) ([]domain.AdminContentCategoryRecord, error) {
	return nil, nil
}

func (adminContentStubRepository) ListCategoryGroups(
	context.Context,
	domain.AdminContentTaxonomyFilter,
) (*domain.AdminContentCategoryListResult, error) {
	return nil, nil
}

func (adminContentStubRepository) ListAllCategories(context.Context, domain.AdminContentTaxonomyFilter) ([]domain.AdminContentCategoryRecord, error) {
	return nil, nil
}

func (adminContentStubRepository) FindCategoryByLocaleAndID(context.Context, string, string) (*domain.AdminContentCategoryRecord, error) {
	return nil, nil
}

func (adminContentStubRepository) UpsertCategory(
	context.Context,
	domain.AdminContentCategoryRecord,
	time.Time,
) (*domain.AdminContentCategoryRecord, error) {
	return nil, nil
}

func (adminContentStubRepository) DeleteCategoryByLocaleAndID(context.Context, string, string) (bool, error) {
	return false, nil
}

func (adminContentStubRepository) SyncCategoryOnPosts(context.Context, domain.AdminContentCategoryRecord, time.Time) error {
	return nil
}

func (adminContentStubRepository) ClearCategoryFromPosts(context.Context, string, string, time.Time) error {
	return nil
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
