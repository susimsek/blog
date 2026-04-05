package service

import (
	"context"
	"strings"
	"testing"
	"time"

	"suaybsimsek.com/blog-api/internal/domain"

	"go.mongodb.org/mongo-driver/bson"
)

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
			revisionStamp *domain.AdminContentPostRevisionStamp,
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
			if revisionStamp == nil || revisionStamp.Number != 1 || revisionStamp.CreatedAt.IsZero() {
				t.Fatalf("unexpected revision stamp: %#v", revisionStamp)
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
		updatePostContent: func(
			_ context.Context,
			locale, postID, content string,
			revisionStamp *domain.AdminContentPostRevisionStamp,
			now time.Time,
		) (*domain.AdminContentPostRecord, error) {
			if locale != "en" || postID != "alpha-post" || content != "  # Updated body  " || now.IsZero() {
				t.Fatalf("unexpected UpdatePostContent args: %q %q %q %v", locale, postID, content, now)
			}
			if revisionStamp == nil || revisionStamp.Number != 1 || revisionStamp.CreatedAt.IsZero() {
				t.Fatalf("unexpected revision stamp: %#v", revisionStamp)
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
