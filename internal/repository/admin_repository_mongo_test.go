package repository

import (
	"context"
	"sync"
	"testing"
	"time"

	"suaybsimsek.com/blog-api/internal/domain"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/integration/mtest"
)

func TestAdminDashboardRepositoryWithMockData(t *testing.T) {
	mt := mtest.New(t, mtest.NewOptions().CreateClient(false))
	mt.RunOpts("mock dashboard data", mtest.NewOptions().
		ClientType(mtest.Mock).
		DatabaseName("blog_test").
		CreateCollection(false), func(mt *mtest.T) {
		resetPostRepositoryState()
		resetNewsletterRepositoryState()
		t.Cleanup(resetPostRepositoryState)
		t.Cleanup(resetNewsletterRepositoryState)
		configureRepositoryMockDatabase(t, "blog_test")
		useMockPostClient(mt)
		useMockNewsletterClient(mt)

		mt.AddMockResponses(
			mtest.CreateSuccessResponse(bson.E{Key: "values", Value: bson.A{"alpha-post", "beta-post"}}),
			mockCountDocumentsResponse("blog_test."+newsletterCollectionName, 7),
			mockFindResponse("blog_test."+postHitsCollectionName,
				bson.D{{Key: "postId", Value: "alpha-post"}, {Key: "hits", Value: int64(120)}},
				bson.D{{Key: "postId", Value: "beta-post"}, {Key: "hits", Value: int32(90)}},
			),
			mockFindResponse("blog_test."+postsCollectionName,
				bson.D{{Key: "id", Value: "alpha-post"}, {Key: "title", Value: "Alpha EN"}, {Key: "locale", Value: "en"}, {Key: "publishedDate", Value: "2026-03-20"}},
				bson.D{{Key: "id", Value: "alpha-post"}, {Key: "title", Value: "Alpha TR"}, {Key: "locale", Value: "tr"}, {Key: "publishedDate", Value: "2026-03-20"}},
				bson.D{{Key: "id", Value: "beta-post"}, {Key: "title", Value: "Beta TR"}, {Key: "locale", Value: "tr"}, {Key: "publishedDate", Value: "2026-03-19"}},
			),
			mtest.CreateSuccessResponse(bson.E{Key: "values", Value: bson.A{"alpha-post", "beta-post"}}),
			mtest.CreateSuccessResponse(bson.E{Key: "values", Value: bson.A{"alpha-post", "gamma-post"}}),
			mockFindResponse("blog_test."+postsCollectionName,
				bson.D{
					{Key: "id", Value: "alpha-post"},
					{Key: "title", Value: " Alpha "},
					{Key: "updatedDate", Value: "2026-03-22"},
					{Key: "publishedDate", Value: "2026-03-20"},
					{Key: "thumbnail", Value: "/alpha.webp"},
					{Key: "category", Value: bson.D{{Key: "id", Value: "tech"}, {Key: "name", Value: "Technology"}}},
				},
				bson.D{
					{Key: "id", Value: "beta-post"},
					{Key: "title", Value: "Beta"},
					{Key: "publishedDate", Value: "2026-03-18"},
					{Key: "thumbnail", Value: ""},
				},
				bson.D{
					{Key: "id", Value: "gamma-post"},
					{Key: "title", Value: "Gamma"},
					{Key: "updatedDate", Value: "2026-03-21"},
					{Key: "publishedDate", Value: "2026-03-17"},
					{Key: "thumbnail", Value: ""},
					{Key: "category", Value: bson.D{{Key: "id", Value: "tech"}, {Key: "name", Value: "Technology"}}},
				},
			),
		)

		repository := NewAdminDashboardMongoRepository()
		ctx := context.Background()

		totalPosts, err := repository.CountDistinctPosts(ctx)
		if err != nil || totalPosts != 2 {
			t.Fatalf("CountDistinctPosts() = %d, %v", totalPosts, err)
		}

		totalSubscribers, err := repository.CountActiveSubscribers(ctx)
		if err != nil || totalSubscribers != 7 {
			t.Fatalf("CountActiveSubscribers() = %d, %v", totalSubscribers, err)
		}

		topPosts, err := repository.ListTopPostsByHits(ctx, 2)
		if err != nil {
			t.Fatalf("ListTopPostsByHits() error = %v", err)
		}
		if len(topPosts) != 2 || topPosts[0].Title != "Alpha EN" || topPosts[0].Hits != 120 || topPosts[1].Locale != "tr" {
			t.Fatalf("ListTopPostsByHits() = %#v", topPosts)
		}

		health, err := repository.BuildContentHealthSummary(ctx)
		if err != nil {
			t.Fatalf("BuildContentHealthSummary() error = %v", err)
		}
		if health.LocalePairCoverage != 50 || health.MissingTranslations != 2 || health.MissingThumbnails != 2 {
			t.Fatalf("unexpected content health summary: %#v", health)
		}
		if len(health.LatestUpdatedPosts) != 3 || health.LatestUpdatedPosts[0].ID != "alpha-post" || health.DominantCategory == nil || health.DominantCategory.ID != "tech" {
			t.Fatalf("unexpected latest posts or dominant category: %#v", health)
		}
	})
}

func TestAdminNewsletterRepositoryListSubscribersAndUpdateWithMockData(t *testing.T) {
	mt := mtest.New(t, mtest.NewOptions().CreateClient(false))
	mt.RunOpts("mock newsletter subscribers", mtest.NewOptions().
		ClientType(mtest.Mock).
		DatabaseName("blog_test").
		CreateCollection(false), func(mt *mtest.T) {
		resetNewsletterRepositoryState()
		t.Cleanup(resetNewsletterRepositoryState)
		configureRepositoryMockDatabase(t, "blog_test")
		useMockNewsletterClient(mt)

		now := time.Date(2026, time.March, 22, 10, 0, 0, 0, time.UTC)

		mt.AddMockResponses(
			mockCountDocumentsResponse("blog_test."+newsletterCollectionName, 2),
			mockFindResponse("blog_test."+newsletterCollectionName,
				bson.D{
					{Key: "email", Value: " Reader@example.com "},
					{Key: "locale", Value: " EN "},
					{Key: "status", Value: " ACTIVE "},
					{Key: "tags", Value: bson.A{"react", "", "go"}},
					{Key: "formName", Value: " Footer "},
					{Key: "source", Value: " popup "},
					{Key: "updatedAt", Value: now},
					{Key: "createdAt", Value: now.Add(-24 * time.Hour)},
					{Key: "confirmedAt", Value: now},
				},
				bson.D{{Key: "email", Value: ""}},
			),
			mtest.CreateSuccessResponse(bson.E{Key: "value", Value: bson.D{
				{Key: "email", Value: " Reader@example.com "},
				{Key: "locale", Value: " EN "},
				{Key: "status", Value: " ACTIVE "},
				{Key: "tags", Value: bson.A{"react"}},
				{Key: "formName", Value: " Footer "},
				{Key: "source", Value: " popup "},
				{Key: "updatedAt", Value: now},
				{Key: "createdAt", Value: now.Add(-24 * time.Hour)},
				{Key: "confirmedAt", Value: now},
			}}),
		)

		repository := NewAdminNewsletterRepository()
		ctx := context.Background()

		result, err := repository.ListSubscribers(ctx, domain.AdminNewsletterSubscriberFilter{
			Locale: "EN",
			Status: "ACTIVE",
			Query:  "reader@example.com",
		}, 1, 10)
		if err != nil {
			t.Fatalf("ListSubscribers() error = %v", err)
		}
		if result.Total != 2 || len(result.Items) != 1 || result.Items[0].Email != "reader@example.com" || len(result.Items[0].Tags) != 2 {
			t.Fatalf("ListSubscribers() = %#v", result)
		}

		record, err := repository.UpdateSubscriberStatusByEmail(ctx, " Reader@example.com ", "ACTIVE", now)
		if err != nil {
			t.Fatalf("UpdateSubscriberStatusByEmail() error = %v", err)
		}
		if record == nil || record.Status != "active" || record.ConfirmedAt == nil {
			t.Fatalf("UpdateSubscriberStatusByEmail() = %#v", record)
		}
	})
}

func TestAdminNewsletterRepositoryCampaignAndFailureListsWithMockData(t *testing.T) {
	mt := mtest.New(t, mtest.NewOptions().CreateClient(false))
	mt.RunOpts("mock newsletter campaigns and failures", mtest.NewOptions().
		ClientType(mtest.Mock).
		DatabaseName("blog_test").
		CreateCollection(false), func(mt *mtest.T) {
		resetPostRepositoryState()
		resetAdminRepositoryState()
		t.Cleanup(resetPostRepositoryState)
		t.Cleanup(resetAdminRepositoryState)
		configureRepositoryMockDatabase(t, "blog_test")
		useMockPostClient(mt)
		useMockAdminClient(mt)

		now := time.Date(2026, time.March, 22, 10, 0, 0, 0, time.UTC)

		mt.AddMockResponses(
			mockCountDocumentsResponse("blog_test.newsletter_campaigns", 1),
			mockFindResponse("blog_test.newsletter_campaigns",
				bson.D{
					{Key: "locale", Value: " EN "},
					{Key: "itemKey", Value: "post:alpha-post"},
					{Key: "title", Value: "Alpha Campaign"},
					{Key: "summary", Value: ""},
					{Key: "link", Value: "https://example.com/en/posts/alpha-post"},
					{Key: "pubDate", Value: "2026-03-20"},
					{Key: "rssURL", Value: "https://example.com/feed.xml"},
					{Key: "status", Value: " SENT "},
					{Key: "sentCount", Value: int64(10)},
					{Key: "failedCount", Value: int64(1)},
					{Key: "lastRunAt", Value: now},
					{Key: "updatedAt", Value: now},
					{Key: "createdAt", Value: now.Add(-time.Hour)},
				},
			),
			mockFindResponse("blog_test."+postsCollectionName,
				bson.D{{Key: "id", Value: "alpha-post"}, {Key: "summary", Value: "Resolved summary"}},
			),
			mockCountDocumentsResponse("blog_test.newsletter_deliveries", 1),
			mockFindResponse("blog_test.newsletter_deliveries",
				bson.D{
					{Key: "locale", Value: " EN "},
					{Key: "itemKey", Value: "post:alpha-post"},
					{Key: "email", Value: " Reader@example.com "},
					{Key: "status", Value: " FAILED "},
					{Key: "lastError", Value: " smtp failed "},
					{Key: "lastAttemptAt", Value: now},
					{Key: "updatedAt", Value: now},
					{Key: "createdAt", Value: now.Add(-time.Hour)},
				},
			),
		)

		repository := NewAdminNewsletterRepository()
		ctx := context.Background()

		campaigns, err := repository.ListCampaigns(ctx, domain.AdminNewsletterCampaignFilter{
			Locale: "EN",
			Status: "SENT",
			Query:  "alpha",
		}, 1, 10)
		if err != nil {
			t.Fatalf("ListCampaigns() error = %v", err)
		}
		if campaigns.Total != 1 || len(campaigns.Items) != 1 || campaigns.Items[0].Summary != "Resolved summary" {
			t.Fatalf("ListCampaigns() = %#v", campaigns)
		}

		failures, err := repository.ListDeliveryFailures(ctx, domain.AdminNewsletterDeliveryFailureFilter{
			Locale:  "EN",
			ItemKey: "post:alpha-post",
		}, 1, 10)
		if err != nil {
			t.Fatalf("ListDeliveryFailures() error = %v", err)
		}
		if failures.Total != 1 || len(failures.Items) != 1 || failures.Items[0].Email != "reader@example.com" || failures.Items[0].Status != "failed" {
			t.Fatalf("ListDeliveryFailures() = %#v", failures)
		}
	})
}

func TestAdminUserRepositoryWithMockData(t *testing.T) {
	mt := mtest.New(t, mtest.NewOptions().CreateClient(false))
	mt.RunOpts("mock admin users", mtest.NewOptions().
		ClientType(mtest.Mock).
		DatabaseName("blog_test").
		CreateCollection(false), func(mt *mtest.T) {
		resetAdminRepositoryState()
		t.Cleanup(resetAdminRepositoryState)
		configureRepositoryMockDatabase(t, "blog_test")
		useMockAdminClient(mt)

		now := time.Date(2026, time.March, 22, 10, 0, 0, 0, time.UTC)

		userDocument := bson.D{
			{Key: "id", Value: "admin-1"},
			{Key: "name", Value: " Admin User "},
			{Key: "username", Value: " admin "},
			{Key: "avatarDigest", Value: "digest"},
			{Key: "avatarVersion", Value: int64(3)},
			{Key: "email", Value: " ADMIN@example.com "},
			{Key: "googleSubject", Value: "google-subject"},
			{Key: "googleEmail", Value: " GOOGLE@example.com "},
			{Key: "githubSubject", Value: "github-subject"},
			{Key: "githubEmail", Value: " GITHUB@example.com "},
			{Key: "passwordHash", Value: "hash"},
			{Key: "passwordVersion", Value: int64(4)},
			{Key: "googleLinkedAt", Value: now},
			{Key: "githubLinkedAt", Value: now},
			{Key: "pendingEmailChange", Value: bson.D{
				{Key: "newEmail", Value: " NEXT@example.com "},
				{Key: "tokenHash", Value: "email-token"},
				{Key: "locale", Value: " TR "},
				{Key: "requestedAt", Value: now},
				{Key: "expiresAt", Value: now.Add(time.Hour)},
			}},
			{Key: "pendingPasswordReset", Value: bson.D{
				{Key: "tokenHash", Value: "reset-token"},
				{Key: "locale", Value: " EN "},
				{Key: "requestedAt", Value: now},
				{Key: "expiresAt", Value: now.Add(time.Hour)},
			}},
		}

		mt.AddMockResponses(
			mockFindResponse("blog_test."+adminUsersCollectionName, userDocument),
			mockCountDocumentsResponse("blog_test."+adminUsersCollectionName, 1),
			mockCountDocumentsResponse("blog_test."+adminUsersCollectionName, 1),
			mockUpdateResponse(1, 1),
			mockUpdateResponse(1, 1),
			mockUpdateResponse(1, 1),
			mockUpdateResponse(1, 1),
			mockUpdateResponse(1, 1),
			mockUpdateResponse(1, 1),
			mockUpdateResponse(1, 1),
			mockUpdateResponse(1, 1),
			mockUpdateResponse(1, 1),
			mockUpdateResponse(1, 1),
			mockUpdateResponse(1, 1),
			mockUpdateResponse(1, 1),
			mockUpdateResponse(1, 1),
			mockUpdateResponse(1, 1),
		)

		repository := NewAdminUserRepository()
		ctx := context.Background()

		record, err := repository.FindByEmail(ctx, " ADMIN@example.com ")
		if err != nil {
			t.Fatalf("FindByEmail() error = %v", err)
		}
		if record == nil || record.Email != "admin@example.com" || record.PendingEmailChange == nil || record.PendingEmailChange.NewEmail != "next@example.com" {
			t.Fatalf("FindByEmail() = %#v", record)
		}
		if record.AvatarURL != "/api/admin-avatar?id=admin-1&s=256&u=digest&v=3" {
			t.Fatalf("unexpected avatar URL: %q", record.AvatarURL)
		}
		if len(record.Roles) != 1 || record.Roles[0] != "admin" || record.PendingPasswordReset == nil || record.PendingPasswordReset.Locale != "en" {
			t.Fatalf("unexpected normalized record: %#v", record)
		}

		hasGoogle, err := repository.HasAnyGoogleLink(ctx)
		if err != nil || !hasGoogle {
			t.Fatalf("HasAnyGoogleLink() = %v, %v", hasGoogle, err)
		}
		hasGithub, err := repository.HasAnyGithubLink(ctx)
		if err != nil || !hasGithub {
			t.Fatalf("HasAnyGithubLink() = %v, %v", hasGithub, err)
		}

		if err := repository.UpdatePasswordHashByID(ctx, "admin-1", "next-hash"); err != nil {
			t.Fatalf("UpdatePasswordHashByID() error = %v", err)
		}
		if err := repository.UpdateNameByID(ctx, "admin-1", "Updated Name"); err != nil {
			t.Fatalf("UpdateNameByID() error = %v", err)
		}
		if err := repository.UpdateUsernameByID(ctx, "admin-1", "updated"); err != nil {
			t.Fatalf("UpdateUsernameByID() error = %v", err)
		}
		if err := repository.SetPendingEmailChangeByID(ctx, "admin-1", domain.AdminPendingEmailChange{
			NewEmail:    "next@example.com",
			TokenHash:   "email-token",
			Locale:      "tr",
			RequestedAt: now,
			ExpiresAt:   now.Add(time.Hour),
		}); err != nil {
			t.Fatalf("SetPendingEmailChangeByID() error = %v", err)
		}
		if err := repository.ClearPendingEmailChangeByID(ctx, "admin-1"); err != nil {
			t.Fatalf("ClearPendingEmailChangeByID() error = %v", err)
		}
		if err := repository.SetPendingPasswordResetByID(ctx, "admin-1", domain.AdminPendingPasswordReset{
			TokenHash:   "reset-token",
			Locale:      "en",
			RequestedAt: now,
			ExpiresAt:   now.Add(time.Hour),
		}); err != nil {
			t.Fatalf("SetPendingPasswordResetByID() error = %v", err)
		}
		if err := repository.ClearPendingPasswordResetByID(ctx, "admin-1"); err != nil {
			t.Fatalf("ClearPendingPasswordResetByID() error = %v", err)
		}
		if err := repository.UpdateEmailByID(ctx, "admin-1", "admin@example.com"); err != nil {
			t.Fatalf("UpdateEmailByID() error = %v", err)
		}
		if err := repository.UpdateGoogleLinkByID(ctx, "admin-1", "google-subject", "admin@example.com", now); err != nil {
			t.Fatalf("UpdateGoogleLinkByID() error = %v", err)
		}
		if err := repository.ClearGoogleLinkByID(ctx, "admin-1"); err != nil {
			t.Fatalf("ClearGoogleLinkByID() error = %v", err)
		}
		if err := repository.UpdateGithubLinkByID(ctx, "admin-1", "github-subject", "admin@example.com", now); err != nil {
			t.Fatalf("UpdateGithubLinkByID() error = %v", err)
		}
		if err := repository.ClearGithubLinkByID(ctx, "admin-1"); err != nil {
			t.Fatalf("ClearGithubLinkByID() error = %v", err)
		}
		if err := repository.UpdateAvatarByID(ctx, "admin-1", "/avatar", "digest", 5); err != nil {
			t.Fatalf("UpdateAvatarByID() error = %v", err)
		}
		if err := repository.DisableByID(ctx, "admin-1"); err != nil {
			t.Fatalf("DisableByID() error = %v", err)
		}
	})
}

func TestAdminContentRepositoryWithMockData(t *testing.T) {
	mt := mtest.New(t, mtest.NewOptions().CreateClient(false))
	mt.RunOpts("mock admin content", mtest.NewOptions().
		ClientType(mtest.Mock).
		DatabaseName("blog_test").
		CreateCollection(false), func(mt *mtest.T) {
		resetPostRepositoryState()
		t.Cleanup(resetPostRepositoryState)
		configureRepositoryMockDatabase(t, "blog_test")
		useMockPostClient(mt)

		now := time.Date(2026, time.March, 22, 10, 0, 0, 0, time.UTC)

		mt.AddMockResponses(
			mtest.CreateCursorResponse(0, "blog_test."+postsCollectionName, mtest.FirstBatch, bson.D{{Key: "total", Value: int32(1)}}),
			mtest.CreateCursorResponse(0, "blog_test."+postsCollectionName, mtest.FirstBatch, bson.D{
				{Key: "id", Value: "alpha-post"},
				{Key: "source", Value: "blog"},
				{Key: "variants", Value: bson.A{
					bson.D{
						{Key: "locale", Value: "en"},
						{Key: "id", Value: "alpha-post"},
						{Key: "title", Value: "Alpha"},
						{Key: "summary", Value: "Summary"},
						{Key: "content", Value: "Body"},
						{Key: "contentMode", Value: "markdown"},
						{Key: "thumbnail", Value: "/alpha.webp"},
						{Key: "source", Value: "blog"},
						{Key: "publishedAt", Value: now},
						{Key: "publishedDate", Value: "2026-03-22"},
						{Key: "updatedDate", Value: "2026-03-23"},
						{Key: "readingTimeMin", Value: int32(4)},
						{Key: "category", Value: bson.D{{Key: "id", Value: "tech"}, {Key: "name", Value: "Tech"}}},
						{Key: "topics", Value: bson.A{bson.D{{Key: "id", Value: "go"}, {Key: "name", Value: "Go"}}}},
						{Key: "topicIds", Value: bson.A{"go"}},
						{Key: "contentUpdatedAt", Value: now},
						{Key: "updatedAt", Value: now},
					},
				}},
			}),
			mockFindResponse("blog_test."+postsCollectionName, bson.D{
				{Key: "locale", Value: "en"},
				{Key: "id", Value: "alpha-post"},
				{Key: "title", Value: "Alpha"},
				{Key: "summary", Value: "Summary"},
				{Key: "thumbnail", Value: "/alpha.webp"},
				{Key: "source", Value: "blog"},
				{Key: "publishedAt", Value: now},
				{Key: "publishedDate", Value: "2026-03-22"},
				{Key: "updatedDate", Value: "2026-03-23"},
				{Key: "readingTimeMin", Value: int32(4)},
				{Key: "category", Value: bson.D{{Key: "id", Value: "tech"}, {Key: "name", Value: "Tech"}}},
				{Key: "topics", Value: bson.A{bson.D{{Key: "id", Value: "go"}, {Key: "name", Value: "Go"}}}},
				{Key: "topicIds", Value: bson.A{"go"}},
				{Key: "updatedAt", Value: now},
			}),
			mockFindResponse("blog_test."+postsCollectionName, bson.D{
				{Key: "locale", Value: "en"},
				{Key: "id", Value: "alpha-post"},
				{Key: "title", Value: "Updated Alpha"},
				{Key: "summary", Value: "Updated Summary"},
				{Key: "content", Value: "Body"},
				{Key: "contentMode", Value: "markdown"},
				{Key: "thumbnail", Value: "/alpha.webp"},
				{Key: "source", Value: "blog"},
				{Key: "publishedDate", Value: "2026-03-22"},
				{Key: "updatedDate", Value: "2026-03-23"},
				{Key: "category", Value: bson.D{{Key: "id", Value: "tech"}, {Key: "name", Value: "Tech"}, {Key: "color", Value: "#000"}}},
				{Key: "topics", Value: bson.A{bson.D{{Key: "id", Value: "go"}, {Key: "name", Value: "Go"}, {Key: "color", Value: "#fff"}}}},
				{Key: "topicIds", Value: bson.A{"go"}},
				{Key: "contentUpdatedAt", Value: now},
				{Key: "updatedAt", Value: now},
			}),
			mtest.CreateSuccessResponse(bson.E{Key: "value", Value: bson.D{
				{Key: "locale", Value: "en"},
				{Key: "id", Value: "alpha-post"},
				{Key: "title", Value: "Updated Alpha"},
				{Key: "summary", Value: "Updated Summary"},
				{Key: "content", Value: "Body"},
				{Key: "contentMode", Value: "markdown"},
				{Key: "thumbnail", Value: "/alpha.webp"},
				{Key: "source", Value: "blog"},
				{Key: "publishedDate", Value: "2026-03-22"},
				{Key: "updatedDate", Value: "2026-03-23"},
				{Key: "category", Value: bson.D{{Key: "id", Value: "tech"}, {Key: "name", Value: "Tech"}, {Key: "color", Value: "#000"}}},
				{Key: "topics", Value: bson.A{bson.D{{Key: "id", Value: "go"}, {Key: "name", Value: "Go"}, {Key: "color", Value: "#fff"}}}},
				{Key: "topicIds", Value: bson.A{"go"}},
				{Key: "contentUpdatedAt", Value: now},
				{Key: "updatedAt", Value: now},
			}}),
			mtest.CreateSuccessResponse(bson.E{Key: "value", Value: bson.D{
				{Key: "locale", Value: "en"},
				{Key: "id", Value: "alpha-post"},
				{Key: "title", Value: "Updated Alpha"},
				{Key: "summary", Value: "Updated Summary"},
				{Key: "content", Value: "Updated Body"},
				{Key: "contentMode", Value: "admin"},
				{Key: "thumbnail", Value: "/alpha.webp"},
				{Key: "source", Value: "blog"},
				{Key: "publishedDate", Value: "2026-03-22"},
				{Key: "updatedDate", Value: "2026-03-23"},
				{Key: "topicIds", Value: bson.A{"go"}},
				{Key: "contentUpdatedAt", Value: now},
				{Key: "updatedAt", Value: now},
			}}),
			mtest.CreateSuccessResponse(bson.E{Key: "n", Value: int32(1)}),
			mockCountDocumentsResponse("blog_test."+postsCollectionName, 0),
			mtest.CreateSuccessResponse(bson.E{Key: "n", Value: int32(1)}),
			mtest.CreateSuccessResponse(bson.E{Key: "n", Value: int32(1)}),
			mockFindResponse("blog_test."+topicsCollectionName,
				bson.D{{Key: "locale", Value: "en"}, {Key: "id", Value: "go"}, {Key: "name", Value: "Go"}, {Key: "color", Value: "#fff"}, {Key: "link", Value: "https://example.com/topic"}, {Key: "updatedAt", Value: now}},
			),
			mockFindResponse("blog_test."+topicsCollectionName,
				bson.D{{Key: "locale", Value: "tr"}, {Key: "id", Value: "go"}, {Key: "name", Value: "Go TR"}, {Key: "color", Value: "#fff"}, {Key: "updatedAt", Value: now}},
			),
			mtest.CreateCursorResponse(0, "blog_test."+topicsCollectionName, mtest.FirstBatch, bson.D{{Key: "total", Value: int32(1)}}),
			mtest.CreateCursorResponse(0, "blog_test."+topicsCollectionName, mtest.FirstBatch, bson.D{
				{Key: "id", Value: "go"},
				{Key: "variants", Value: bson.A{
					bson.D{{Key: "locale", Value: "en"}, {Key: "id", Value: "go"}, {Key: "name", Value: "Go"}, {Key: "color", Value: "#fff"}, {Key: "updatedAt", Value: now}},
					bson.D{{Key: "locale", Value: "tr"}, {Key: "id", Value: "go"}, {Key: "name", Value: "Go TR"}, {Key: "color", Value: "#fff"}, {Key: "updatedAt", Value: now}},
				}},
			}),
			mockFindResponse("blog_test."+topicsCollectionName, bson.D{
				{Key: "locale", Value: "en"},
				{Key: "id", Value: "go"},
				{Key: "name", Value: "Go"},
				{Key: "color", Value: "#fff"},
				{Key: "link", Value: "https://example.com/topic"},
				{Key: "updatedAt", Value: now},
			}),
			mockUpdateResponse(1, 1),
			mockFindResponse("blog_test."+topicsCollectionName, bson.D{
				{Key: "locale", Value: "en"},
				{Key: "id", Value: "go"},
				{Key: "name", Value: "Go"},
				{Key: "color", Value: "#fff"},
				{Key: "link", Value: "https://example.com/topic"},
				{Key: "updatedAt", Value: now},
			}),
			mtest.CreateSuccessResponse(bson.E{Key: "n", Value: int32(1)}),
			mockUpdateResponse(1, 1),
			mockUpdateResponse(1, 1),
			mockFindResponse("blog_test."+categoriesCollectionName,
				bson.D{{Key: "locale", Value: "en"}, {Key: "id", Value: "tech"}, {Key: "name", Value: "Tech"}, {Key: "color", Value: "#000"}, {Key: "icon", Value: "tag"}, {Key: "link", Value: "https://example.com/category"}, {Key: "updatedAt", Value: now}},
			),
			mockFindResponse("blog_test."+categoriesCollectionName,
				bson.D{{Key: "locale", Value: "tr"}, {Key: "id", Value: "tech"}, {Key: "name", Value: "Teknoloji"}, {Key: "color", Value: "#000"}, {Key: "updatedAt", Value: now}},
			),
			mtest.CreateCursorResponse(0, "blog_test."+categoriesCollectionName, mtest.FirstBatch, bson.D{{Key: "total", Value: int32(1)}}),
			mtest.CreateCursorResponse(0, "blog_test."+categoriesCollectionName, mtest.FirstBatch, bson.D{
				{Key: "id", Value: "tech"},
				{Key: "variants", Value: bson.A{
					bson.D{{Key: "locale", Value: "en"}, {Key: "id", Value: "tech"}, {Key: "name", Value: "Tech"}, {Key: "color", Value: "#000"}, {Key: "icon", Value: "tag"}, {Key: "updatedAt", Value: now}},
					bson.D{{Key: "locale", Value: "tr"}, {Key: "id", Value: "tech"}, {Key: "name", Value: "Teknoloji"}, {Key: "color", Value: "#000"}, {Key: "updatedAt", Value: now}},
				}},
			}),
			mockFindResponse("blog_test."+categoriesCollectionName, bson.D{
				{Key: "locale", Value: "en"},
				{Key: "id", Value: "tech"},
				{Key: "name", Value: "Tech"},
				{Key: "color", Value: "#000"},
				{Key: "icon", Value: "tag"},
				{Key: "link", Value: "https://example.com/category"},
				{Key: "updatedAt", Value: now},
			}),
			mockUpdateResponse(1, 1),
			mockFindResponse("blog_test."+categoriesCollectionName, bson.D{
				{Key: "locale", Value: "en"},
				{Key: "id", Value: "tech"},
				{Key: "name", Value: "Tech"},
				{Key: "color", Value: "#000"},
				{Key: "icon", Value: "tag"},
				{Key: "link", Value: "https://example.com/category"},
				{Key: "updatedAt", Value: now},
			}),
			mtest.CreateSuccessResponse(bson.E{Key: "n", Value: int32(1)}),
			mockUpdateResponse(1, 1),
			mockUpdateResponse(1, 1),
		)

		repository := NewAdminContentRepository()
		ctx := context.Background()

		postGroups, err := repository.ListPostGroups(ctx, domain.AdminContentPostFilter{PreferredLocale: "tr"})
		if err != nil || postGroups.Total != 1 || len(postGroups.Items) != 1 || postGroups.Items[0].Preferred.ID != "alpha-post" {
			t.Fatalf("ListPostGroups() = %#v, %v", postGroups, err)
		}

		posts, err := repository.ListAllPosts(ctx, domain.AdminContentPostFilter{Locale: "en"})
		if err != nil || len(posts) != 1 || posts[0].ID != "alpha-post" {
			t.Fatalf("ListAllPosts() = %#v, %v", posts, err)
		}

		post, err := repository.FindPostByLocaleAndID(ctx, "en", "alpha-post")
		if err != nil || post == nil || post.ID != "alpha-post" {
			t.Fatalf("FindPostByLocaleAndID() = %#v, %v", post, err)
		}

		updatedPost, err := repository.UpdatePostMetadata(ctx, "en", "alpha-post", domain.AdminContentPostMetadataFields{
			Title:         "Updated Alpha",
			Summary:       "Updated Summary",
			Thumbnail:     "/alpha.webp",
			PublishedDate: "2026-03-22",
			UpdatedDate:   "2026-03-23",
		}, &domain.AdminContentCategoryRecord{ID: "tech", Name: "Tech", Color: "#000"}, []domain.AdminContentTopicRecord{{ID: "go", Name: "Go", Color: "#fff"}}, now)
		if err != nil || updatedPost == nil || updatedPost.Title != "Updated Alpha" || updatedPost.CategoryID != "tech" {
			t.Fatalf("UpdatePostMetadata() = %#v, %v", updatedPost, err)
		}

		updatedContent, err := repository.UpdatePostContent(ctx, "en", "alpha-post", "Updated Body", now)
		if err != nil || updatedContent == nil || updatedContent.Content != "Updated Body" {
			t.Fatalf("UpdatePostContent() = %#v, %v", updatedContent, err)
		}

		deletedPost, err := repository.DeletePostByLocaleAndID(ctx, "en", "alpha-post")
		if err != nil || !deletedPost {
			t.Fatalf("DeletePostByLocaleAndID() = %v, %v", deletedPost, err)
		}

		topics, err := repository.ListTopics(ctx, "en", "go")
		if err != nil || len(topics) != 1 || topics[0].ID != "go" {
			t.Fatalf("ListTopics() = %#v, %v", topics, err)
		}

		allTopics, err := repository.ListAllTopics(ctx, domain.AdminContentTaxonomyFilter{Locale: "tr"})
		if err != nil || len(allTopics) != 1 || allTopics[0].Locale != "tr" {
			t.Fatalf("ListAllTopics() = %#v, %v", allTopics, err)
		}

		topicGroups, err := repository.ListTopicGroups(ctx, domain.AdminContentTaxonomyFilter{PreferredLocale: "tr"})
		if err != nil || topicGroups.Total != 1 || len(topicGroups.Items) != 1 || topicGroups.Items[0].Preferred.Locale != "tr" {
			t.Fatalf("ListTopicGroups() = %#v, %v", topicGroups, err)
		}

		topic, err := repository.FindTopicByLocaleAndID(ctx, "en", "go")
		if err != nil || topic == nil || topic.Link != "https://example.com/topic" {
			t.Fatalf("FindTopicByLocaleAndID() = %#v, %v", topic, err)
		}

		savedTopic, err := repository.UpsertTopic(ctx, domain.AdminContentTopicRecord{
			Locale: "en",
			ID:     "go",
			Name:   "Go",
			Color:  "#fff",
			Link:   "https://example.com/topic",
		}, now)
		if err != nil || savedTopic == nil || savedTopic.ID != "go" {
			t.Fatalf("UpsertTopic() = %#v, %v", savedTopic, err)
		}

		deletedTopic, err := repository.DeleteTopicByLocaleAndID(ctx, "en", "go")
		if err != nil || !deletedTopic {
			t.Fatalf("DeleteTopicByLocaleAndID() = %v, %v", deletedTopic, err)
		}

		if err := repository.SyncTopicOnPosts(ctx, domain.AdminContentTopicRecord{Locale: "en", ID: "go", Name: "Go", Color: "#fff", Link: "https://example.com/topic"}, now); err != nil {
			t.Fatalf("SyncTopicOnPosts() error = %v", err)
		}
		if err := repository.RemoveTopicFromPosts(ctx, "en", "go", now); err != nil {
			t.Fatalf("RemoveTopicFromPosts() error = %v", err)
		}

		categories, err := repository.ListCategories(ctx, "en")
		if err != nil || len(categories) != 1 || categories[0].ID != "tech" {
			t.Fatalf("ListCategories() = %#v, %v", categories, err)
		}

		allCategories, err := repository.ListAllCategories(ctx, domain.AdminContentTaxonomyFilter{Locale: "tr"})
		if err != nil || len(allCategories) != 1 || allCategories[0].Locale != "tr" {
			t.Fatalf("ListAllCategories() = %#v, %v", allCategories, err)
		}

		categoryGroups, err := repository.ListCategoryGroups(ctx, domain.AdminContentTaxonomyFilter{PreferredLocale: "tr"})
		if err != nil || categoryGroups.Total != 1 || len(categoryGroups.Items) != 1 || categoryGroups.Items[0].Preferred.Locale != "tr" {
			t.Fatalf("ListCategoryGroups() = %#v, %v", categoryGroups, err)
		}

		category, err := repository.FindCategoryByLocaleAndID(ctx, "en", "tech")
		if err != nil || category == nil || category.Icon != "tag" {
			t.Fatalf("FindCategoryByLocaleAndID() = %#v, %v", category, err)
		}

		savedCategory, err := repository.UpsertCategory(ctx, domain.AdminContentCategoryRecord{
			Locale: "en",
			ID:     "tech",
			Name:   "Tech",
			Color:  "#000",
			Icon:   "tag",
			Link:   "https://example.com/category",
		}, now)
		if err != nil || savedCategory == nil || savedCategory.ID != "tech" {
			t.Fatalf("UpsertCategory() = %#v, %v", savedCategory, err)
		}

		deletedCategory, err := repository.DeleteCategoryByLocaleAndID(ctx, "en", "tech")
		if err != nil || !deletedCategory {
			t.Fatalf("DeleteCategoryByLocaleAndID() = %v, %v", deletedCategory, err)
		}

		if err := repository.SyncCategoryOnPosts(ctx, domain.AdminContentCategoryRecord{
			Locale: "en",
			ID:     "tech",
			Name:   "Tech",
			Color:  "#000",
			Icon:   "tag",
		}, now); err != nil {
			t.Fatalf("SyncCategoryOnPosts() error = %v", err)
		}
		if err := repository.ClearCategoryFromPosts(ctx, "en", "tech", now); err != nil {
			t.Fatalf("ClearCategoryFromPosts() error = %v", err)
		}
	})
}

func TestAdminAuditLogRepositoryWithMockData(t *testing.T) {
	mt := mtest.New(t, mtest.NewOptions().CreateClient(false))
	mt.RunOpts("mock admin audit logs", mtest.NewOptions().
		ClientType(mtest.Mock).
		DatabaseName("blog_test").
		CreateCollection(false), func(mt *mtest.T) {
		resetAdminRepositoryState()
		adminAuditLogIndexesOnce = sync.Once{}
		adminAuditLogIndexesErr = nil
		t.Cleanup(func() {
			resetAdminRepositoryState()
			adminAuditLogIndexesOnce = sync.Once{}
			adminAuditLogIndexesErr = nil
		})
		configureRepositoryMockDatabase(t, "blog_test")
		useMockAdminClient(mt)
		adminAuditLogIndexesErr = nil
		markOnceDone(&adminAuditLogIndexesOnce)

		now := time.Date(2026, time.March, 22, 10, 0, 0, 0, time.UTC)
		mt.AddMockResponses(
			mtest.CreateSuccessResponse(),
			mockFindResponse("blog_test."+adminAuditLogCollectionName,
				bson.D{
					{Key: "id", Value: "audit-1"},
					{Key: "actorId", Value: "admin-1"},
					{Key: "actorEmail", Value: " Admin@example.com "},
					{Key: "action", Value: " updated "},
					{Key: "resource", Value: "admin:error-message:auth:en:INVALID"},
					{Key: "scope", Value: " auth "},
					{Key: "locale", Value: " EN "},
					{Key: "code", Value: " invalid "},
					{Key: "beforeValue", Value: "before"},
					{Key: "afterValue", Value: "after"},
					{Key: "status", Value: " SUCCESS "},
					{Key: "failureCode", Value: " "},
					{Key: "requestId", Value: "req-1"},
					{Key: "remoteIp", Value: "203.0.113.10"},
					{Key: "countryCode", Value: " tr "},
					{Key: "userAgent", Value: "Browser"},
					{Key: "createdAt", Value: now},
				},
				bson.D{{Key: "id", Value: ""}},
			),
		)

		repository := NewAdminAuditLogRepository()
		ctx := context.Background()

		if err := repository.Create(ctx, domain.AdminAuditLogRecord{
			ActorID:    "admin-1",
			ActorEmail: "Admin@example.com",
			Action:     "updated",
			Resource:   "admin:error-message:auth:en:INVALID",
			Scope:      "auth",
			Locale:     "EN",
			Code:       "invalid",
			Status:     "SUCCESS",
			CreatedAt:  now,
		}); err != nil {
			t.Fatalf("Create() error = %v", err)
		}

		records, err := repository.ListRecentByResource(ctx, "admin:error-message:auth:en:INVALID", 10)
		if err != nil || len(records) != 1 || records[0].ActorEmail != "admin@example.com" || records[0].Code != "INVALID" {
			t.Fatalf("ListRecentByResource() = %#v, %v", records, err)
		}
	})
}

func TestCommentRepositoryWithMockData(t *testing.T) {
	mt := mtest.New(t, mtest.NewOptions().CreateClient(false))
	mt.RunOpts("mock comments", mtest.NewOptions().
		ClientType(mtest.Mock).
		DatabaseName("blog_test").
		CreateCollection(false), func(mt *mtest.T) {
		resetPostRepositoryState()
		resetCommentRepositoryState()
		t.Cleanup(resetPostRepositoryState)
		t.Cleanup(resetCommentRepositoryState)
		configureRepositoryMockDatabase(t, "blog_test")
		useMockPostClient(mt)
		postCommentsIndexesErr = nil
		markOnceDone(&postCommentsIndexesOnce)

		now := time.Date(2026, time.March, 22, 10, 0, 0, 0, time.UTC)

		commentDoc := bson.D{
			{Key: "id", Value: "comment-1"},
			{Key: "postId", Value: "alpha-post"},
			{Key: "postTitle", Value: "Alpha"},
			{Key: "authorName", Value: "Reader"},
			{Key: "authorEmail", Value: "reader@example.com"},
			{Key: "content", Value: "First"},
			{Key: "status", Value: "approved"},
			{Key: "createdAt", Value: now},
			{Key: "updatedAt", Value: now},
		}

		mt.AddMockResponses(
			mockFindResponse("blog_test."+postCommentsCollectionName, commentDoc),
			mockCountDocumentsResponse("blog_test."+postCommentsCollectionName, 1),
			mockFindResponse("blog_test."+postCommentsCollectionName,
				bson.D{{Key: "_id", Value: "alpha-post"}, {Key: "total", Value: int64(2)}},
				bson.D{{Key: "_id", Value: "beta-post"}, {Key: "total", Value: int64(1)}},
			),
			mockFindResponse("blog_test."+postCommentsCollectionName, commentDoc),
			mockCountDocumentsResponse("blog_test."+postCommentsCollectionName, 1),
			mockFindResponse("blog_test."+postCommentsCollectionName, commentDoc),
			mtest.CreateSuccessResponse(bson.E{Key: "value", Value: bson.D{
				{Key: "id", Value: "comment-1"},
				{Key: "postId", Value: "alpha-post"},
				{Key: "postTitle", Value: "Alpha"},
				{Key: "authorName", Value: "Reader"},
				{Key: "authorEmail", Value: "reader@example.com"},
				{Key: "content", Value: "First"},
				{Key: "status", Value: "approved"},
				{Key: "moderationNote", Value: "ok"},
				{Key: "createdAt", Value: now},
				{Key: "updatedAt", Value: now},
				{Key: "moderatedAt", Value: now},
			}}),
			mtest.CreateSuccessResponse(bson.E{Key: "n", Value: int64(1)}),
			mockUpdateResponse(2, 2),
			mtest.CreateSuccessResponse(bson.E{Key: "n", Value: int64(2)}),
		)

		repository := NewCommentRepository()
		ctx := context.Background()

		approved, err := repository.ListApprovedByPost(ctx, "alpha-post")
		if err != nil || len(approved) != 1 || approved[0].ID != "comment-1" {
			t.Fatalf("ListApprovedByPost() = %#v, %v", approved, err)
		}

		total, err := repository.CountApprovedByPost(ctx, "alpha-post")
		if err != nil || total != 1 {
			t.Fatalf("CountApprovedByPost() = %d, %v", total, err)
		}

		counts, err := repository.CountApprovedByPosts(ctx, []string{"alpha-post", "beta-post"})
		if err != nil || counts["alpha-post"] != 2 || counts["beta-post"] != 1 {
			t.Fatalf("CountApprovedByPosts() = %#v, %v", counts, err)
		}

		found, err := repository.FindCommentByID(ctx, "comment-1")
		if err != nil || found == nil || found.AuthorEmail != "reader@example.com" {
			t.Fatalf("FindCommentByID() = %#v, %v", found, err)
		}

		listResult, err := repository.ListComments(ctx, domain.AdminCommentFilter{
			Status: "APPROVED",
			PostID: "ALPHA-POST",
			Query:  "reader",
		}, 1, 10)
		if err != nil || listResult.Total != 1 || len(listResult.Items) != 1 {
			t.Fatalf("ListComments() = %#v, %v", listResult, err)
		}

		updated, err := repository.UpdateCommentStatusByID(ctx, "comment-1", "APPROVED", "ok", now)
		if err != nil || updated == nil || updated.Status != "approved" || updated.ModerationNote != "ok" {
			t.Fatalf("UpdateCommentStatusByID() = %#v, %v", updated, err)
		}

		deleted, err := repository.DeleteCommentByID(ctx, "comment-1")
		if err != nil || !deleted {
			t.Fatalf("DeleteCommentByID() = %v, %v", deleted, err)
		}

		matched, err := repository.UpdateCommentStatusByIDs(ctx, []string{"comment-1", "comment-2"}, "APPROVED", "ok", now)
		if err != nil || matched != 2 {
			t.Fatalf("UpdateCommentStatusByIDs() = %d, %v", matched, err)
		}

		deletedCount, err := repository.DeleteCommentsByIDs(ctx, []string{"comment-1", "comment-2"})
		if err != nil || deletedCount != 2 {
			t.Fatalf("DeleteCommentsByIDs() = %d, %v", deletedCount, err)
		}
	})
}

func TestAdminRefreshTokenRepositoryWithMockData(t *testing.T) {
	mt := mtest.New(t, mtest.NewOptions().CreateClient(false))
	mt.RunOpts("mock admin refresh tokens", mtest.NewOptions().
		ClientType(mtest.Mock).
		DatabaseName("blog_test").
		CreateCollection(false), func(mt *mtest.T) {
		resetAdminRefreshTokenRepositoryState()
		t.Cleanup(resetAdminRefreshTokenRepositoryState)
		configureRepositoryMockDatabase(t, "blog_test")
		useMockAdminRefreshTokenClient(mt)

		now := time.Date(2026, time.March, 22, 10, 0, 0, 0, time.UTC)
		rawToken := " raw-token "
		hashedToken := HashAdminRefreshToken(rawToken)

		mt.AddMockResponses(
			mtest.CreateSuccessResponse(),
			mockFindResponse("blog_test."+adminRefreshTokensCollectionName, bson.D{
				{Key: "jti", Value: "jti-1"},
				{Key: "userId", Value: "admin-1"},
				{Key: "tokenHash", Value: hashedToken},
				{Key: "persistent", Value: true},
				{Key: "userAgent", Value: " Browser "},
				{Key: "remoteIP", Value: "127.0.0.1"},
				{Key: "countryCode", Value: " tr "},
				{Key: "lastSeenAt", Value: now},
				{Key: "expiresAt", Value: now.Add(24 * time.Hour)},
				{Key: "createdAt", Value: now.Add(-24 * time.Hour)},
			}),
			mockFindResponse("blog_test."+adminRefreshTokensCollectionName,
				bson.D{
					{Key: "jti", Value: "jti-2"},
					{Key: "userAgent", Value: " Browser 2 "},
					{Key: "remoteIP", Value: "10.0.0.1"},
					{Key: "countryCode", Value: " us "},
					{Key: "lastSeenAt", Value: now},
					{Key: "createdAt", Value: now.Add(-time.Hour)},
					{Key: "expiresAt", Value: now.Add(12 * time.Hour)},
					{Key: "persistent", Value: false},
				},
			),
			mtest.CreateSuccessResponse(),
			mockUpdateResponse(1, 1),
			mockUpdateResponse(1, 1),
			mockUpdateResponse(1, 1),
			mockUpdateResponse(1, 1),
			mockUpdateResponse(2, 2),
		)

		repository := NewAdminRefreshTokenMongoRepository()
		ctx := context.Background()

		err := repository.Create(ctx, domain.AdminRefreshTokenRecord{
			JTI:         "jti-1",
			UserID:      "admin-1",
			TokenHash:   hashedToken,
			Persistent:  true,
			UserAgent:   "Browser",
			RemoteIP:    "127.0.0.1",
			CountryCode: "tr",
			LastSeenAt:  now,
			ExpiresAt:   now.Add(24 * time.Hour),
			CreatedAt:   now.Add(-24 * time.Hour),
		})
		if err != nil {
			t.Fatalf("Create() error = %v", err)
		}

		record, err := repository.FindActiveByToken(ctx, "jti-1", rawToken, now)
		if err != nil {
			t.Fatalf("FindActiveByToken() error = %v", err)
		}
		if record == nil || record.CountryCode != "TR" || record.TokenHash != hashedToken {
			t.Fatalf("FindActiveByToken() = %#v", record)
		}

		sessions, err := repository.ListActiveByUserID(ctx, "admin-1", now, 0)
		if err != nil {
			t.Fatalf("ListActiveByUserID() error = %v", err)
		}
		if len(sessions) != 1 || sessions[0].ID != "jti-2" || sessions[0].CountryCode != "US" {
			t.Fatalf("ListActiveByUserID() = %#v", sessions)
		}

		err = repository.Rotate(ctx, "jti-1", domain.AdminRefreshTokenRecord{
			JTI:         "jti-3",
			UserID:      "admin-1",
			TokenHash:   HashAdminRefreshToken("replacement"),
			Persistent:  true,
			UserAgent:   "Browser",
			RemoteIP:    "127.0.0.1",
			CountryCode: "tr",
			LastSeenAt:  now,
			ExpiresAt:   now.Add(48 * time.Hour),
			CreatedAt:   now,
		}, now)
		if err != nil {
			t.Fatalf("Rotate() error = %v", err)
		}

		revoked, err := repository.RevokeByJTIAndUserID(ctx, "jti-1", "admin-1", now)
		if err != nil || !revoked {
			t.Fatalf("RevokeByJTIAndUserID() = %v, %v", revoked, err)
		}
		if err := repository.RevokeByJTI(ctx, "jti-2", now); err != nil {
			t.Fatalf("RevokeByJTI() error = %v", err)
		}
		if err := repository.RevokeAllByUserID(ctx, "admin-1", now); err != nil {
			t.Fatalf("RevokeAllByUserID() error = %v", err)
		}
	})
}

func TestErrorMessageRepositoryWithMockData(t *testing.T) {
	mt := mtest.New(t, mtest.NewOptions().CreateClient(false))
	mt.RunOpts("mock error message catalog", mtest.NewOptions().
		ClientType(mtest.Mock).
		DatabaseName("blog_test").
		CreateCollection(false), func(mt *mtest.T) {
		resetErrorMessageRepositoryState()
		t.Cleanup(resetErrorMessageRepositoryState)
		configureRepositoryMockDatabase(t, "blog_test")
		useMockErrorMessageClient(mt)

		now := time.Date(2026, time.March, 22, 10, 0, 0, 0, time.UTC)

		mt.AddMockResponses(
			mockFindResponse("blog_test."+errorMessagesCollectionName,
				bson.D{
					{Key: "scope", Value: " auth "},
					{Key: "locale", Value: " EN "},
					{Key: "code", Value: " invalid "},
					{Key: "message", Value: " Invalid input "},
					{Key: "updatedAt", Value: now},
				},
				bson.D{{Key: "scope", Value: "auth"}, {Key: "locale", Value: ""}},
			),
			mtest.CreateSuccessResponse(
				bson.E{Key: "n", Value: int32(2)},
				bson.E{Key: "nModified", Value: int32(2)},
			),
			mtest.CreateSuccessResponse(bson.E{Key: "n", Value: int32(1)}),
		)

		repository := NewErrorMessageRepository()
		ctx := context.Background()

		items, err := repository.ListByScope(ctx, " auth ")
		if err != nil {
			t.Fatalf("ListByScope() error = %v", err)
		}
		if len(items) != 1 || items[0].Locale != "en" || items[0].Code != "INVALID" {
			t.Fatalf("ListByScope() = %#v", items)
		}

		err = repository.UpsertMany(ctx, []domain.ErrorMessageRecord{
			{Scope: "auth", Locale: "EN", Code: "invalid", Message: "Invalid input", UpdatedAt: now},
			{Scope: "auth", Locale: "tr", Code: "invalid", Message: "Gecersiz", UpdatedAt: now},
			{Scope: " ", Locale: "en", Code: "missing", Message: "skip"},
		})
		if err != nil {
			t.Fatalf("UpsertMany() error = %v", err)
		}

		deleted, err := repository.DeleteByKey(ctx, "auth", "EN", "invalid")
		if err != nil || !deleted {
			t.Fatalf("DeleteByKey() = %v, %v", deleted, err)
		}
	})
}

func TestAdminAvatarRepositoryWithMockData(t *testing.T) {
	mt := mtest.New(t, mtest.NewOptions().CreateClient(false))
	mt.RunOpts("mock admin avatars", mtest.NewOptions().
		ClientType(mtest.Mock).
		DatabaseName("blog_test").
		CreateCollection(false), func(mt *mtest.T) {
		resetAdminAvatarRepositoryState()
		t.Cleanup(resetAdminAvatarRepositoryState)
		configureRepositoryMockDatabase(t, "blog_test")
		useMockAdminAvatarClient(mt)

		now := time.Date(2026, time.March, 22, 10, 0, 0, 0, time.UTC)

		mt.AddMockResponses(
			mockUpdateResponse(1, 1),
			mockFindResponse("blog_test."+adminAvatarsCollectionName, bson.D{
				{Key: "userId", Value: "admin-1"},
				{Key: "digest", Value: "digest"},
				{Key: "version", Value: int64(2)},
				{Key: "updatedAt", Value: now},
				{Key: "source", Value: bson.D{
					{Key: "contentType", Value: "image/webp"},
					{Key: "data", Value: []byte("source")},
				}},
				{Key: "variants", Value: bson.A{
					bson.D{
						{Key: "size", Value: 64},
						{Key: "contentType", Value: "image/webp"},
						{Key: "data", Value: []byte("variant")},
					},
					bson.D{{Key: "size", Value: 0}},
				}},
			}),
			mtest.CreateSuccessResponse(bson.E{Key: "n", Value: int32(1)}),
		)

		repository := NewAdminAvatarRepository()
		ctx := context.Background()

		err := repository.UpsertByUserID(ctx, domain.AdminAvatarRecord{
			UserID:  "admin-1",
			Digest:  "digest",
			Version: 2,
			Source: domain.AdminAvatarSource{
				ContentType: "image/webp",
				Data:        []byte("source"),
			},
			Variants: []domain.AdminAvatarVariant{
				{Size: 64, ContentType: "image/webp", Data: []byte("variant")},
				{Size: 0, ContentType: "", Data: nil},
			},
			UpdatedAt: now,
		})
		if err != nil {
			t.Fatalf("UpsertByUserID() error = %v", err)
		}

		record, err := repository.FindByUserID(ctx, "admin-1")
		if err != nil {
			t.Fatalf("FindByUserID() error = %v", err)
		}
		if record == nil || record.UserID != "admin-1" || len(record.Variants) != 1 || string(record.Source.Data) != "source" {
			t.Fatalf("FindByUserID() = %#v", record)
		}

		if err := repository.DeleteByUserID(ctx, "admin-1"); err != nil {
			t.Fatalf("DeleteByUserID() error = %v", err)
		}
	})
}

func configureRepositoryMockDatabase(t *testing.T, databaseName string) {
	t.Helper()
	t.Setenv("MONGODB_URI", "mongodb://localhost:27017")
	t.Setenv("MONGODB_DATABASE", databaseName)
}

func useMockPostClient(mt *mtest.T) {
	postMongoClient = mt.Client
	postMongoInitErr = nil
	markOnceDone(&postMongoOnce)
	postLikesIndexesErr = nil
	postHitsIndexesErr = nil
	postContentIndexesErr = nil
	postTopicIndexesErr = nil
	postCategoryIndexesErr = nil
	markOnceDone(&postLikesIndexesOnce)
	markOnceDone(&postHitsIndexesOnce)
	markOnceDone(&postContentIndexesOnce)
	markOnceDone(&postTopicIndexesOnce)
	markOnceDone(&postCategoryIndexesOnce)
}

func useMockNewsletterClient(mt *mtest.T) {
	newsletterMongoClient = mt.Client
	newsletterMongoInitErr = nil
	markOnceDone(&newsletterMongoClientOnce)
	newsletterIndexesErr = nil
	markOnceDone(&newsletterIndexesOnce)
}

func useMockAdminClient(mt *mtest.T) {
	adminMongoClient = mt.Client
	adminMongoInitErr = nil
	markOnceDone(&adminMongoClientOnce)
	adminUserIndexesErr = nil
	readerUserIndexesErr = nil
	markOnceDone(&adminUserIndexesOnce)
	markOnceDone(&readerUserIndexesOnce)
}

func useMockAdminRefreshTokenClient(mt *mtest.T) {
	adminRefreshTokenMongoClient = mt.Client
	adminRefreshTokenMongoInitErr = nil
	markOnceDone(&adminRefreshTokenMongoClientOnce)
	adminRefreshTokenIndexesErr = nil
	markOnceDone(&adminRefreshTokenIndexesOnce)
}

func useMockErrorMessageClient(mt *mtest.T) {
	errorMessageMongoClient = mt.Client
	errorMessageMongoInitErr = nil
	markOnceDone(&errorMessageMongoClientOnce)
	errorMessageIndexesErr = nil
	markOnceDone(&errorMessageIndexesOnce)
}

func useMockAdminAvatarClient(mt *mtest.T) {
	adminAvatarMongoClient = mt.Client
	adminAvatarMongoInitErr = nil
	markOnceDone(&adminAvatarMongoClientOnce)
	adminAvatarIndexesErr = nil
	markOnceDone(&adminAvatarIndexesOnce)
}

func mockCountDocumentsResponse(namespace string, count int64) bson.D {
	return mtest.CreateCursorResponse(0, namespace, mtest.FirstBatch, bson.D{{Key: "n", Value: count}})
}

func mockFindResponse(namespace string, docs ...bson.D) bson.D {
	return mtest.CreateCursorResponse(0, namespace, mtest.FirstBatch, docs...)
}

func mockUpdateResponse(matchedCount, modifiedCount int64) bson.D {
	return mtest.CreateSuccessResponse(
		bson.E{Key: "n", Value: matchedCount},
		bson.E{Key: "nModified", Value: modifiedCount},
	)
}
