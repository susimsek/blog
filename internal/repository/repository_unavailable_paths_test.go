package repository

import (
	"context"
	"errors"
	"sync"
	"testing"
	"time"

	"suaybsimsek.com/blog-api/internal/domain"
)

func TestAdminUserRepositoryUnavailablePaths(t *testing.T) {
	resetAdminRepositoryState()
	t.Cleanup(resetAdminRepositoryState)
	t.Setenv("MONGODB_URI", "")
	t.Setenv("MONGODB_DATABASE", "")

	repository := NewAdminUserRepository()
	ctx := context.Background()
	now := time.Date(2026, time.March, 22, 10, 0, 0, 0, time.UTC)

	checkUnavailableError(t, ErrAdminUserRepositoryUnavailable, repository.UpdatePasswordHashByID(ctx, "admin-1", "hash"))
	checkUnavailableError(t, ErrAdminUserRepositoryUnavailable, repository.UpdateNameByID(ctx, "admin-1", "Name"))
	checkUnavailableError(t, ErrAdminUserRepositoryUnavailable, repository.UpdateUsernameByID(ctx, "admin-1", "username"))
	checkUnavailableError(t, ErrAdminUserRepositoryUnavailable, repository.SetPendingEmailChangeByID(ctx, "admin-1", domain.AdminPendingEmailChange{
		NewEmail:    "next@example.com",
		TokenHash:   "token-hash",
		Locale:      "en",
		RequestedAt: now,
		ExpiresAt:   now.Add(time.Hour),
	}))
	checkUnavailableError(t, ErrAdminUserRepositoryUnavailable, repository.ClearPendingEmailChangeByID(ctx, "admin-1"))
	checkUnavailableError(t, ErrAdminUserRepositoryUnavailable, repository.SetPendingPasswordResetByID(ctx, "admin-1", domain.AdminPendingPasswordReset{
		TokenHash:   "token-hash",
		Locale:      "tr",
		RequestedAt: now,
		ExpiresAt:   now.Add(time.Hour),
	}))
	checkUnavailableError(t, ErrAdminUserRepositoryUnavailable, repository.ClearPendingPasswordResetByID(ctx, "admin-1"))
	checkUnavailableError(t, ErrAdminUserRepositoryUnavailable, repository.UpdateEmailByID(ctx, "admin-1", "admin@example.com"))
	checkUnavailableError(t, ErrAdminUserRepositoryUnavailable, repository.UpdateGoogleLinkByID(ctx, "admin-1", "subject", "admin@example.com", now))
	checkUnavailableError(t, ErrAdminUserRepositoryUnavailable, repository.ClearGoogleLinkByID(ctx, "admin-1"))
	checkUnavailableError(t, ErrAdminUserRepositoryUnavailable, repository.UpdateGithubLinkByID(ctx, "admin-1", "subject", "admin@example.com", now))
	checkUnavailableError(t, ErrAdminUserRepositoryUnavailable, repository.ClearGithubLinkByID(ctx, "admin-1"))
	checkUnavailableError(t, ErrAdminUserRepositoryUnavailable, repository.UpdateAvatarByID(ctx, "admin-1", "/avatar", "digest", 1))
	checkUnavailableError(t, ErrAdminUserRepositoryUnavailable, repository.DisableByID(ctx, "admin-1"))

	if _, err := repository.FindByEmail(ctx, "admin@example.com"); !errors.Is(err, ErrAdminUserRepositoryUnavailable) {
		t.Fatalf("FindByEmail() error = %v", err)
	}
	if _, err := repository.FindByID(ctx, "admin-1"); !errors.Is(err, ErrAdminUserRepositoryUnavailable) {
		t.Fatalf("FindByID() error = %v", err)
	}
	if _, err := repository.FindByUsername(ctx, "admin"); !errors.Is(err, ErrAdminUserRepositoryUnavailable) {
		t.Fatalf("FindByUsername() error = %v", err)
	}
	if _, err := repository.FindByGoogleSubject(ctx, "subject"); !errors.Is(err, ErrAdminUserRepositoryUnavailable) {
		t.Fatalf("FindByGoogleSubject() error = %v", err)
	}
	if _, err := repository.FindByGithubSubject(ctx, "subject"); !errors.Is(err, ErrAdminUserRepositoryUnavailable) {
		t.Fatalf("FindByGithubSubject() error = %v", err)
	}
	if _, err := repository.FindByPendingEmailChangeTokenHash(ctx, "token-hash"); !errors.Is(err, ErrAdminUserRepositoryUnavailable) {
		t.Fatalf("FindByPendingEmailChangeTokenHash() error = %v", err)
	}
	if _, err := repository.FindByPendingPasswordResetTokenHash(ctx, "token-hash"); !errors.Is(err, ErrAdminUserRepositoryUnavailable) {
		t.Fatalf("FindByPendingPasswordResetTokenHash() error = %v", err)
	}
	if _, err := repository.HasAnyGoogleLink(ctx); !errors.Is(err, ErrAdminUserRepositoryUnavailable) {
		t.Fatalf("HasAnyGoogleLink() error = %v", err)
	}
	if _, err := repository.HasAnyGithubLink(ctx); !errors.Is(err, ErrAdminUserRepositoryUnavailable) {
		t.Fatalf("HasAnyGithubLink() error = %v", err)
	}
}

func TestReaderUserRepositoryUnavailablePaths(t *testing.T) {
	resetAdminRepositoryState()
	t.Cleanup(resetAdminRepositoryState)
	t.Setenv("MONGODB_URI", "")
	t.Setenv("MONGODB_DATABASE", "")

	repository := NewReaderUserRepository()
	ctx := context.Background()
	now := time.Date(2026, time.March, 22, 10, 0, 0, 0, time.UTC)

	record := domain.ReaderUserRecord{
		ReaderUser: domain.ReaderUser{
			ID:    "reader-1",
			Email: "reader@example.com",
		},
		SessionVersion: 1,
	}

	checkUnavailableError(t, ErrReaderUserRepositoryUnavailable, repository.Create(ctx, record))
	checkUnavailableError(t, ErrReaderUserRepositoryUnavailable, repository.UpdateGoogleIdentityByID(
		ctx,
		"reader-1",
		"google-subject",
		"reader@example.com",
		"Reader",
		"/avatar",
		now,
	))
	checkUnavailableError(t, ErrReaderUserRepositoryUnavailable, repository.UpdateGithubIdentityByID(
		ctx,
		"reader-1",
		"github-subject",
		"reader@example.com",
		"Reader",
		"/avatar",
		now,
	))
	checkUnavailableError(t, ErrReaderUserRepositoryUnavailable, repository.UpdateLastSeenProviderByID(ctx, "reader-1", "github"))

	if _, err := repository.FindByID(ctx, "reader-1"); !errors.Is(err, ErrReaderUserRepositoryUnavailable) {
		t.Fatalf("FindByID() error = %v", err)
	}
	if _, err := repository.FindByEmail(ctx, "reader@example.com"); !errors.Is(err, ErrReaderUserRepositoryUnavailable) {
		t.Fatalf("FindByEmail() error = %v", err)
	}
	if _, err := repository.FindByGoogleSubject(ctx, "google-subject"); !errors.Is(err, ErrReaderUserRepositoryUnavailable) {
		t.Fatalf("FindByGoogleSubject() error = %v", err)
	}
	if _, err := repository.FindByGithubSubject(ctx, "github-subject"); !errors.Is(err, ErrReaderUserRepositoryUnavailable) {
		t.Fatalf("FindByGithubSubject() error = %v", err)
	}
}

func TestAdminRefreshTokenRepositoryUnavailablePaths(t *testing.T) {
	resetAdminRefreshTokenRepositoryState()
	t.Cleanup(resetAdminRefreshTokenRepositoryState)
	t.Setenv("MONGODB_URI", "")
	t.Setenv("MONGODB_DATABASE", "")

	repository := NewAdminRefreshTokenMongoRepository()
	ctx := context.Background()
	now := time.Date(2026, time.March, 22, 10, 0, 0, 0, time.UTC)

	checkUnavailableError(t, ErrAdminRefreshTokenRepositoryUnavailable, repository.Create(ctx, domain.AdminRefreshTokenRecord{JTI: "jti-1"}))
	checkUnavailableError(t, ErrAdminRefreshTokenRepositoryUnavailable, repository.Rotate(ctx, "jti-1", domain.AdminRefreshTokenRecord{JTI: "jti-2"}, now))
	checkUnavailableError(t, ErrAdminRefreshTokenRepositoryUnavailable, repository.RevokeByJTI(ctx, "jti-1", now))
	checkUnavailableError(t, ErrAdminRefreshTokenRepositoryUnavailable, repository.RevokeAllByUserID(ctx, "admin-1", now))

	if _, err := repository.FindActiveByToken(ctx, "jti-1", "raw-token", now); !errors.Is(err, ErrAdminRefreshTokenRepositoryUnavailable) {
		t.Fatalf("FindActiveByToken() error = %v", err)
	}
	if _, err := repository.ListActiveByUserID(ctx, "admin-1", now, 10); !errors.Is(err, ErrAdminRefreshTokenRepositoryUnavailable) {
		t.Fatalf("ListActiveByUserID() error = %v", err)
	}
	if _, err := repository.RevokeByJTIAndUserID(ctx, "jti-1", "admin-1", now); !errors.Is(err, ErrAdminRefreshTokenRepositoryUnavailable) {
		t.Fatalf("RevokeByJTIAndUserID() error = %v", err)
	}
}

func TestReaderRefreshTokenRepositoryUnavailablePaths(t *testing.T) {
	resetAdminRepositoryState()
	resetReaderRefreshTokenRepositoryState()
	t.Cleanup(resetAdminRepositoryState)
	t.Cleanup(resetReaderRefreshTokenRepositoryState)
	t.Setenv("MONGODB_URI", "")
	t.Setenv("MONGODB_DATABASE", "")

	repository := NewReaderRefreshTokenMongoRepository()
	ctx := context.Background()
	now := time.Date(2026, time.March, 22, 10, 0, 0, 0, time.UTC)

	checkUnavailableError(t, ErrReaderRefreshTokenRepositoryUnavailable, repository.Create(ctx, domain.ReaderRefreshTokenRecord{JTI: "jti-1"}))
	checkUnavailableError(t, ErrReaderRefreshTokenRepositoryUnavailable, repository.Rotate(ctx, "jti-1", domain.ReaderRefreshTokenRecord{JTI: "jti-2"}, now))
	checkUnavailableError(t, ErrReaderRefreshTokenRepositoryUnavailable, repository.RevokeByJTI(ctx, "jti-1", now))

	if _, err := repository.FindActiveByToken(ctx, "jti-1", "raw-token", now); !errors.Is(err, ErrReaderRefreshTokenRepositoryUnavailable) {
		t.Fatalf("FindActiveByToken() error = %v", err)
	}
}

func TestCommentRepositoryUnavailablePaths(t *testing.T) {
	resetPostRepositoryState()
	resetCommentRepositoryState()
	t.Cleanup(resetPostRepositoryState)
	t.Cleanup(resetCommentRepositoryState)
	t.Setenv("MONGODB_URI", "")
	t.Setenv("MONGODB_DATABASE", "")

	repository := NewCommentRepository()
	ctx := context.Background()
	now := time.Date(2026, time.March, 22, 10, 0, 0, 0, time.UTC)

	checkUnavailableError(t, ErrCommentRepositoryUnavailable, repository.CreateComment(ctx, domain.CommentRecord{ID: "comment-1"}))

	if _, err := repository.ListApprovedByPost(ctx, "alpha-post"); !errors.Is(err, ErrCommentRepositoryUnavailable) {
		t.Fatalf("ListApprovedByPost() error = %v", err)
	}
	if _, err := repository.CountApprovedByPost(ctx, "alpha-post"); !errors.Is(err, ErrCommentRepositoryUnavailable) {
		t.Fatalf("CountApprovedByPost() error = %v", err)
	}
	if _, err := repository.CountApprovedByPosts(ctx, []string{"alpha-post", "beta-post"}); !errors.Is(err, ErrCommentRepositoryUnavailable) {
		t.Fatalf("CountApprovedByPosts() error = %v", err)
	}
	if _, err := repository.FindCommentByID(ctx, "comment-1"); !errors.Is(err, ErrCommentRepositoryUnavailable) {
		t.Fatalf("FindCommentByID() error = %v", err)
	}
	if _, err := repository.ListComments(ctx, domain.AdminCommentFilter{Status: "approved"}, 1, 20); !errors.Is(err, ErrCommentRepositoryUnavailable) {
		t.Fatalf("ListComments() error = %v", err)
	}
	if _, err := repository.UpdateCommentStatusByID(ctx, "comment-1", "approved", "ok", now); !errors.Is(err, ErrCommentRepositoryUnavailable) {
		t.Fatalf("UpdateCommentStatusByID() error = %v", err)
	}
	if _, err := repository.DeleteCommentByID(ctx, "comment-1"); !errors.Is(err, ErrCommentRepositoryUnavailable) {
		t.Fatalf("DeleteCommentByID() error = %v", err)
	}
	if _, err := repository.UpdateCommentStatusByIDs(ctx, []string{"comment-1", "comment-2"}, "approved", "ok", now); !errors.Is(err, ErrCommentRepositoryUnavailable) {
		t.Fatalf("UpdateCommentStatusByIDs() error = %v", err)
	}
	if _, err := repository.DeleteCommentsByIDs(ctx, []string{"comment-1"}); !errors.Is(err, ErrCommentRepositoryUnavailable) {
		t.Fatalf("DeleteCommentsByIDs() error = %v", err)
	}
}

func TestAdminContentRepositoryUnavailablePaths(t *testing.T) {
	resetPostRepositoryState()
	t.Cleanup(resetPostRepositoryState)
	t.Setenv("MONGODB_URI", "")
	t.Setenv("MONGODB_DATABASE", "")

	repository := NewAdminContentRepository()
	ctx := context.Background()
	now := time.Date(2026, time.March, 22, 10, 0, 0, 0, time.UTC)

	if concreteRepository, ok := repository.(*adminContentMongoRepository); !ok || concreteRepository == nil {
		t.Fatalf("NewAdminContentRepository() = %#v", repository)
	}

	if _, err := repository.ListPostGroups(ctx, domain.AdminContentPostFilter{}); !errors.Is(err, ErrAdminContentRepositoryUnavailable) {
		t.Fatalf("ListPostGroups() error = %v", err)
	}
	if _, err := repository.ListAllPosts(ctx, domain.AdminContentPostFilter{}); !errors.Is(err, ErrAdminContentRepositoryUnavailable) {
		t.Fatalf("ListAllPosts() error = %v", err)
	}
	if _, err := repository.FindPostByLocaleAndID(ctx, "en", "alpha-post"); !errors.Is(err, ErrAdminContentRepositoryUnavailable) {
		t.Fatalf("FindPostByLocaleAndID() error = %v", err)
	}
	if _, err := repository.UpdatePostMetadata(ctx, "en", "alpha-post", domain.AdminContentPostMetadataFields{
		Title:         "Alpha",
		Summary:       "Summary",
		Thumbnail:     "/alpha.webp",
		PublishedDate: "2026-03-22",
		UpdatedDate:   "2026-03-23",
	}, &domain.AdminContentCategoryRecord{ID: "tech", Name: "Tech", Color: "#000"}, []domain.AdminContentTopicRecord{{ID: "go", Name: "Go", Color: "#fff"}}, now); !errors.Is(err, ErrAdminContentRepositoryUnavailable) {
		t.Fatalf("UpdatePostMetadata() error = %v", err)
	}
	if _, err := repository.UpdatePostContent(ctx, "en", "alpha-post", "Body", now); !errors.Is(err, ErrAdminContentRepositoryUnavailable) {
		t.Fatalf("UpdatePostContent() error = %v", err)
	}
	if _, err := repository.DeletePostByLocaleAndID(ctx, "en", "alpha-post"); !errors.Is(err, ErrAdminContentRepositoryUnavailable) {
		t.Fatalf("DeletePostByLocaleAndID() error = %v", err)
	}
	if _, err := repository.ListTopics(ctx, "en", "alpha"); !errors.Is(err, ErrAdminContentRepositoryUnavailable) {
		t.Fatalf("ListTopics() error = %v", err)
	}
	if _, err := repository.ListTopicGroups(ctx, domain.AdminContentTaxonomyFilter{}); !errors.Is(err, ErrAdminContentRepositoryUnavailable) {
		t.Fatalf("ListTopicGroups() error = %v", err)
	}
	if _, err := repository.ListAllTopics(ctx, domain.AdminContentTaxonomyFilter{}); !errors.Is(err, ErrAdminContentRepositoryUnavailable) {
		t.Fatalf("ListAllTopics() error = %v", err)
	}
	if _, err := repository.FindTopicByLocaleAndID(ctx, "en", "go"); !errors.Is(err, ErrAdminContentRepositoryUnavailable) {
		t.Fatalf("FindTopicByLocaleAndID() error = %v", err)
	}
	if _, err := repository.UpsertTopic(ctx, domain.AdminContentTopicRecord{Locale: "en", ID: "go", Name: "Go", Color: "#fff"}, now); !errors.Is(err, ErrAdminContentRepositoryUnavailable) {
		t.Fatalf("UpsertTopic() error = %v", err)
	}
	if _, err := repository.DeleteTopicByLocaleAndID(ctx, "en", "go"); !errors.Is(err, ErrAdminContentRepositoryUnavailable) {
		t.Fatalf("DeleteTopicByLocaleAndID() error = %v", err)
	}
	checkUnavailableError(t, ErrAdminContentRepositoryUnavailable, repository.SyncTopicOnPosts(ctx, domain.AdminContentTopicRecord{Locale: "en", ID: "go"}, now))
	checkUnavailableError(t, ErrAdminContentRepositoryUnavailable, repository.RemoveTopicFromPosts(ctx, "en", "go", now))
	if _, err := repository.ListCategories(ctx, "en"); !errors.Is(err, ErrAdminContentRepositoryUnavailable) {
		t.Fatalf("ListCategories() error = %v", err)
	}
	if _, err := repository.ListCategoryGroups(ctx, domain.AdminContentTaxonomyFilter{}); !errors.Is(err, ErrAdminContentRepositoryUnavailable) {
		t.Fatalf("ListCategoryGroups() error = %v", err)
	}
	if _, err := repository.ListAllCategories(ctx, domain.AdminContentTaxonomyFilter{}); !errors.Is(err, ErrAdminContentRepositoryUnavailable) {
		t.Fatalf("ListAllCategories() error = %v", err)
	}
	if _, err := repository.FindCategoryByLocaleAndID(ctx, "en", "tech"); !errors.Is(err, ErrAdminContentRepositoryUnavailable) {
		t.Fatalf("FindCategoryByLocaleAndID() error = %v", err)
	}
	if _, err := repository.UpsertCategory(ctx, domain.AdminContentCategoryRecord{Locale: "en", ID: "tech", Name: "Tech", Color: "#000"}, now); !errors.Is(err, ErrAdminContentRepositoryUnavailable) {
		t.Fatalf("UpsertCategory() error = %v", err)
	}
	if _, err := repository.DeleteCategoryByLocaleAndID(ctx, "en", "tech"); !errors.Is(err, ErrAdminContentRepositoryUnavailable) {
		t.Fatalf("DeleteCategoryByLocaleAndID() error = %v", err)
	}
	checkUnavailableError(t, ErrAdminContentRepositoryUnavailable, repository.SyncCategoryOnPosts(ctx, domain.AdminContentCategoryRecord{Locale: "en", ID: "tech"}, now))
	checkUnavailableError(t, ErrAdminContentRepositoryUnavailable, repository.ClearCategoryFromPosts(ctx, "en", "tech", now))
}

func TestAdminAvatarRepositoryUnavailablePaths(t *testing.T) {
	resetAdminAvatarRepositoryState()
	t.Cleanup(resetAdminAvatarRepositoryState)
	t.Setenv("MONGODB_URI", "")
	t.Setenv("MONGODB_DATABASE", "")

	repository := NewAdminAvatarRepository()
	ctx := context.Background()

	record := domain.AdminAvatarRecord{
		UserID: "admin-1",
		Source: domain.AdminAvatarSource{
			ContentType: "image/webp",
			Data:        []byte("image"),
		},
	}

	checkUnavailableError(t, ErrAdminAvatarRepositoryUnavailable, repository.UpsertByUserID(ctx, record))
	checkUnavailableError(t, ErrAdminAvatarRepositoryUnavailable, repository.DeleteByUserID(ctx, "admin-1"))

	if _, err := repository.FindByUserID(ctx, "admin-1"); !errors.Is(err, ErrAdminAvatarRepositoryUnavailable) {
		t.Fatalf("FindByUserID() error = %v", err)
	}
}

func TestErrorMessageRepositoryUnavailablePaths(t *testing.T) {
	resetErrorMessageRepositoryState()
	t.Cleanup(resetErrorMessageRepositoryState)
	t.Setenv("MONGODB_URI", "")
	t.Setenv("MONGODB_DATABASE", "")

	repository := NewErrorMessageRepository()
	ctx := context.Background()

	checkUnavailableError(t, ErrErrorMessageRepositoryUnavailable, repository.UpsertMany(ctx, []domain.ErrorMessageRecord{{
		Scope:   "auth",
		Locale:  "en",
		Code:    "INVALID",
		Message: "invalid",
	}}))

	if _, err := repository.ListByScope(ctx, "auth"); !errors.Is(err, ErrErrorMessageRepositoryUnavailable) {
		t.Fatalf("ListByScope() error = %v", err)
	}
	if _, err := repository.DeleteByKey(ctx, "auth", "en", "INVALID"); !errors.Is(err, ErrErrorMessageRepositoryUnavailable) {
		t.Fatalf("DeleteByKey() error = %v", err)
	}
}

func TestAdminAuditLogRepositoryUnavailablePaths(t *testing.T) {
	resetAdminRepositoryState()
	adminAuditLogIndexesOnce = sync.Once{}
	adminAuditLogIndexesErr = nil
	t.Cleanup(func() {
		resetAdminRepositoryState()
		adminAuditLogIndexesOnce = sync.Once{}
		adminAuditLogIndexesErr = nil
	})
	t.Setenv("MONGODB_URI", "")
	t.Setenv("MONGODB_DATABASE", "")

	repository := NewAdminAuditLogRepository()
	ctx := context.Background()

	if concreteRepository, ok := repository.(*adminAuditLogMongoRepository); !ok || concreteRepository == nil {
		t.Fatalf("NewAdminAuditLogRepository() = %#v", repository)
	}

	checkUnavailableError(t, ErrAdminAuditLogRepositoryUnavailable, repository.Create(ctx, domain.AdminAuditLogRecord{
		Resource: "admin:error-message:auth:en:INVALID",
		Action:   "updated",
	}))
	if _, err := repository.ListRecentByResource(ctx, "admin:error-message:auth:en:INVALID", 10); !errors.Is(err, ErrAdminAuditLogRepositoryUnavailable) {
		t.Fatalf("ListRecentByResource() error = %v", err)
	}
}

func TestAdminDashboardRepositoryUnavailablePaths(t *testing.T) {
	resetPostRepositoryState()
	resetNewsletterRepositoryState()
	t.Cleanup(resetPostRepositoryState)
	t.Cleanup(resetNewsletterRepositoryState)
	t.Setenv("MONGODB_URI", "")
	t.Setenv("MONGODB_DATABASE", "")

	repository := NewAdminDashboardMongoRepository()
	ctx := context.Background()

	if _, err := repository.CountDistinctPosts(ctx); !errors.Is(err, ErrAdminDashboardRepositoryUnavailable) {
		t.Fatalf("CountDistinctPosts() error = %v", err)
	}
	if _, err := repository.CountActiveSubscribers(ctx); !errors.Is(err, ErrAdminDashboardRepositoryUnavailable) {
		t.Fatalf("CountActiveSubscribers() error = %v", err)
	}
	if _, err := repository.ListTopPostsByHits(ctx, 5); !errors.Is(err, ErrAdminDashboardRepositoryUnavailable) {
		t.Fatalf("ListTopPostsByHits() error = %v", err)
	}
	if _, err := repository.ListTopPostsByLikes(ctx, 5); !errors.Is(err, ErrAdminDashboardRepositoryUnavailable) {
		t.Fatalf("ListTopPostsByLikes() error = %v", err)
	}
	if _, err := repository.BuildContentHealthSummary(ctx); !errors.Is(err, ErrAdminDashboardRepositoryUnavailable) {
		t.Fatalf("BuildContentHealthSummary() error = %v", err)
	}
}

func TestAdminNewsletterRepositoryUnavailablePaths(t *testing.T) {
	resetPostRepositoryState()
	resetNewsletterRepositoryState()
	resetAdminRepositoryState()
	t.Cleanup(resetPostRepositoryState)
	t.Cleanup(resetNewsletterRepositoryState)
	t.Cleanup(resetAdminRepositoryState)
	t.Setenv("MONGODB_URI", "")
	t.Setenv("MONGODB_DATABASE", "")

	repository := NewAdminNewsletterRepository()
	ctx := context.Background()
	now := time.Date(2026, time.March, 22, 10, 0, 0, 0, time.UTC)

	if _, err := repository.ListSubscribers(ctx, domain.AdminNewsletterSubscriberFilter{Locale: "en"}, 1, 20); !errors.Is(err, ErrAdminNewsletterRepositoryUnavailable) {
		t.Fatalf("ListSubscribers() error = %v", err)
	}
	if _, err := repository.ListCampaigns(ctx, domain.AdminNewsletterCampaignFilter{Locale: "en"}, 1, 20); !errors.Is(err, ErrAdminNewsletterRepositoryUnavailable) {
		t.Fatalf("ListCampaigns() error = %v", err)
	}
	if _, err := repository.ListDeliveryFailures(ctx, domain.AdminNewsletterDeliveryFailureFilter{Locale: "en", ItemKey: "post:alpha"}, 1, 20); !errors.Is(err, ErrAdminNewsletterRepositoryUnavailable) {
		t.Fatalf("ListDeliveryFailures() error = %v", err)
	}
	if _, err := repository.UpdateSubscriberStatusByEmail(ctx, "reader@example.com", "active", now); !errors.Is(err, ErrAdminNewsletterRepositoryUnavailable) {
		t.Fatalf("UpdateSubscriberStatusByEmail() error = %v", err)
	}
	if _, err := repository.DeleteSubscriberByEmail(ctx, "reader@example.com"); !errors.Is(err, ErrAdminNewsletterRepositoryUnavailable) {
		t.Fatalf("DeleteSubscriberByEmail() error = %v", err)
	}
}

func checkUnavailableError(t *testing.T, target, err error) {
	t.Helper()
	if !errors.Is(err, target) {
		t.Fatalf("expected error %v, got %v", target, err)
	}
}
