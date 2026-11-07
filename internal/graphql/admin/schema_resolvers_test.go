package admingraphql

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	appconfig "suaybsimsek.com/blog-api/internal/config"
	"suaybsimsek.com/blog-api/internal/domain"
	"suaybsimsek.com/blog-api/internal/graphql/admin/model"
	appservice "suaybsimsek.com/blog-api/internal/service"
	"suaybsimsek.com/blog-api/internal/testassert"
	appscalars "suaybsimsek.com/blog-api/pkg/graphql/scalars"
	"suaybsimsek.com/blog-api/pkg/httpapi"
	"suaybsimsek.com/blog-api/pkg/httpauth"
)

func TestAdminResolverFactoriesAndMe(t *testing.T) {
	resolver := &Resolver{}
	if resolver.AdminQuery() == nil || resolver.AdminMutation() == nil {
		t.Fatal("expected resolver factories to return implementations")
	}

	queryResolver := &adminQueryResolver{Resolver: resolver}
	me, err := queryResolver.Me(context.Background())
	if err != nil {
		t.Fatalf("Me returned error: %v", err)
	}
	if me == nil || me.Authenticated || me.User != nil {
		t.Fatalf("unexpected anonymous me payload: %#v", me)
	}

	pendingEmailExpiresAt := time.Date(2026, time.March, 21, 10, 0, 0, 0, time.UTC)
	googleLinkedAt := pendingEmailExpiresAt.Add(-time.Hour)
	githubLinkedAt := pendingEmailExpiresAt.Add(-2 * time.Hour)
	ctx := WithAdminUser(context.Background(), &domain.AdminUser{
		ID:                    "admin-1",
		Name:                  " Admin ",
		Username:              " root ",
		AvatarURL:             " /avatar.png ",
		Email:                 "admin@example.com",
		PendingEmail:          "pending@example.com",
		PendingEmailExpiresAt: &pendingEmailExpiresAt,
		GoogleSubject:         "google-123",
		GoogleEmail:           "google@example.com",
		GoogleLinkedAt:        &googleLinkedAt,
		GithubSubject:         "github-123",
		GithubEmail:           "github@example.com",
		GithubLinkedAt:        &githubLinkedAt,
		Roles:                 []string{"admin"},
	})

	me, err = queryResolver.Me(ctx)
	if err != nil {
		t.Fatalf("Me returned error for authenticated user: %v", err)
	}
	if me == nil || !me.Authenticated || me.User == nil || me.User.ID != "admin-1" {
		t.Fatalf("unexpected authenticated me payload: %#v", me)
	}
	if me.User.Name == nil || *me.User.Name != "Admin" || me.User.Username == nil || *me.User.Username != "root" {
		t.Fatalf("unexpected mapped user identity: %#v", me.User)
	}
	if me.User.PendingEmail == nil || *me.User.PendingEmail != "pending@example.com" || !me.User.GoogleLinked || !me.User.GithubLinked {
		t.Fatalf("unexpected linked state: %#v", me.User)
	}
}

func TestAdminResolverMappingHelpers(t *testing.T) {
	now := time.Date(2026, time.March, 21, 12, 30, 0, 0, time.FixedZone("TR", 3*60*60))
	testAdminResolverDashboardMappings(t, now)
	testAdminResolverNewsletterPayloadMappings(t, now)
	testAdminResolverContentMappings(t, now)
	testAdminResolverInputMappings(t, now)
}

func testAdminResolverDashboardMappings(t *testing.T, now time.Time) {
	if toOptionalAdminProfileName("  ") != nil || toOptionalAdminUsername("  ") != nil || toOptionalAdminEmail("  ") != nil || toOptionalAdminAvatarURL("  ") != nil {
		t.Fatal("expected blank optional admin values to map to nil")
	}

	dashboard := mapAdminDashboard(&domain.AdminDashboard{
		TotalPosts:       12,
		TotalSubscribers: 34,
		TopViewedPosts: []domain.AdminDashboardPostMetric{{
			PostID:        "alpha",
			Title:         "Alpha",
			Locale:        "en",
			PublishedDate: "2026-03-20",
			Hits:          120,
		}},
		TopLikedPosts: []domain.AdminDashboardPostMetric{{
			PostID: "beta",
			Likes:  42,
		}},
		ContentHealth: domain.AdminDashboardContentHealth{
			LocalePairCoverage:  95,
			MissingTranslations: 1,
			MissingThumbnails:   2,
			LatestUpdatedPosts: []domain.AdminDashboardUpdatedPost{{
				ID:       "alpha",
				Title:    "Alpha",
				Date:     "2026-03-21",
				Category: "Tech",
			}},
			DominantCategory: &domain.AdminDashboardCategory{ID: "tech", Name: "Tech", Count: 8},
		},
	})
	if dashboard.TotalPosts != 12 || len(dashboard.TopViewedPosts) != 1 || dashboard.ContentHealth == nil || dashboard.ContentHealth.DominantCategory == nil {
		t.Fatalf("unexpected dashboard mapping: %#v", dashboard)
	}
	if mapAdminDashboard(nil).ContentHealth != nil {
		t.Fatal("expected nil dashboard payload to keep content health nil")
	}

	sessions := mapAdminSessions([]domain.AdminSessionRecord{{
		ID:          "session-1",
		UserAgent:   "Mozilla/5.0 Chrome/122 Windows NT 10.0",
		RemoteIP:    "203.0.113.10",
		CountryCode: "tr",
		LastSeenAt:  now,
		CreatedAt:   now.Add(-time.Hour),
		ExpiresAt:   now.Add(time.Hour),
		Persistent:  true,
	}}, "session-1")
	if len(sessions) != 1 || !sessions[0].Current || sessions[0].Device != "Chrome on Windows" || sessions[0].CountryCode != "TR" {
		t.Fatalf("unexpected session mapping: %#v", sessions)
	}

	confirmedAt := now
	unsubscribedAt := now.Add(time.Hour)
	subscriberPayload := mapAdminNewsletterSubscriberListPayload(&domain.AdminNewsletterSubscriberListResult{
		Items: []domain.AdminNewsletterSubscriberRecord{{
			Email:          "admin@example.com",
			Locale:         "en",
			Status:         "active",
			Tags:           []string{"go", "react"},
			FormName:       "Footer",
			Source:         "popup",
			UpdatedAt:      now,
			CreatedAt:      now.Add(-time.Hour),
			ConfirmedAt:    &confirmedAt,
			UnsubscribedAt: &unsubscribedAt,
		}},
		Total: 1,
		Page:  2,
		Size:  50,
	})
	if subscriberPayload.Total != 1 || len(subscriberPayload.Items) != 1 || subscriberPayload.Items[0].Status != model.AdminNewsletterSubscriberStatusActive {
		t.Fatalf("unexpected subscriber payload: %#v", subscriberPayload)
	}
	if mapAdminNewsletterSubscriberListPayload(nil).Page != 1 {
		t.Fatal("expected nil subscriber payload defaults")
	}
}

func testAdminResolverNewsletterPayloadMappings(t *testing.T, now time.Time) {
	campaignPayload := mapAdminNewsletterCampaignListPayload(&domain.AdminNewsletterCampaignListResult{
		Items: []domain.AdminNewsletterCampaignRecord{{
			Locale:      "tr",
			ItemKey:     "post:alpha",
			Title:       "Alpha",
			Summary:     "Summary",
			Link:        "https://example.com",
			PubDate:     "2026-03-21",
			RSSURL:      "https://example.com/rss",
			Status:      "sent",
			SentCount:   10,
			FailedCount: 1,
			LastRunAt:   now,
			UpdatedAt:   now,
			CreatedAt:   now,
		}},
		Total: 1,
		Page:  1,
		Size:  20,
	})
	if campaignPayload.Total != 1 || len(campaignPayload.Items) != 1 || campaignPayload.Items[0].RssURL == nil {
		t.Fatalf("unexpected campaign payload: %#v", campaignPayload)
	}

	failurePayload := mapAdminNewsletterDeliveryFailureListPayload(&domain.AdminNewsletterDeliveryFailureListResult{
		Items: []domain.AdminNewsletterDeliveryFailureRecord{{
			Locale:        "en",
			ItemKey:       "post:alpha",
			Email:         "admin@example.com",
			Status:        "failed",
			LastError:     "smtp timeout",
			LastAttemptAt: now,
			UpdatedAt:     now,
			CreatedAt:     now,
		}},
		Total: 1,
		Page:  1,
		Size:  10,
	})
	if failurePayload.Total != 1 || len(failurePayload.Items) != 1 || failurePayload.Items[0].LastError == nil {
		t.Fatalf("unexpected failure payload: %#v", failurePayload)
	}

	dispatchPayload := mapAdminNewsletterDispatchPayload(&domain.AdminNewsletterDispatchResult{
		Success:   true,
		Message:   " Sent ",
		Timestamp: now,
		Results: []domain.AdminNewsletterDispatchLocaleResult{{
			Locale:      "en",
			RSSURL:      "https://example.com/rss",
			ItemKey:     "post:alpha",
			PostTitle:   "Alpha",
			SentCount:   10,
			FailedCount: 1,
			Skipped:     false,
			Reason:      "queued",
		}},
	})
	if !dispatchPayload.Success || dispatchPayload.Message != "Sent" || len(dispatchPayload.Results) != 1 {
		t.Fatalf("unexpected dispatch payload: %#v", dispatchPayload)
	}
	if mapAdminNewsletterDispatchPayload(nil).Timestamp.IsZero() {
		t.Fatal("expected nil dispatch payload timestamp default")
	}

	testSendPayload := mapAdminNewsletterTestSendPayload(&domain.AdminNewsletterTestSendResult{
		Success:   true,
		Message:   " Queued ",
		Timestamp: now,
		Email:     "admin@example.com",
		Locale:    "tr",
		ItemKey:   "post:beta",
		PostTitle: "Beta",
	})
	if !testSendPayload.Success || testSendPayload.PostTitle == nil || *testSendPayload.PostTitle != "Beta" {
		t.Fatalf("unexpected test send payload: %#v", testSendPayload)
	}

	errorMessagePayload := mapAdminErrorMessageListPayload(&domain.AdminErrorMessageListResult{
		Items: []domain.AdminErrorMessageView{{
			AdminErrorMessageKey: domain.AdminErrorMessageKey{Scope: "admin", Locale: "en", Code: "ADMIN_ERR"},
			Message:              "Error",
			UpdatedAt:            now,
		}},
		Total: 1,
		Page:  3,
		Size:  15,
	})
	if errorMessagePayload.Total != 1 || len(errorMessagePayload.Items) != 1 || errorMessagePayload.Items[0].UpdatedAt == nil {
		t.Fatalf("unexpected error message payload: %#v", errorMessagePayload)
	}
}

func testAdminResolverContentMappings(t *testing.T, now time.Time) {
	postPayload := mapAdminContentPostListPayload(&domain.AdminContentPostListResult{
		Items: []domain.AdminContentPostGroupRecord{{
			ID:     "alpha-post",
			Source: "blog",
			Preferred: domain.AdminContentPostRecord{
				Locale:         "en",
				ID:             "alpha-post",
				Title:          "Alpha",
				Summary:        "Summary",
				Content:        "Body",
				ContentMode:    "markdown",
				Thumbnail:      "/alpha.png",
				Source:         "blog",
				PublishedDate:  "2026-03-20",
				UpdatedDate:    "2026-03-21",
				CategoryID:     "tech",
				CategoryName:   "Tech",
				TopicIDs:       []string{"go"},
				TopicNames:     []string{"Go"},
				ReadingTimeMin: 4,
				UpdatedAt:      now,
				ViewCount:      12,
				LikeCount:      4,
				CommentCount:   2,
			},
			EN: &domain.AdminContentPostRecord{Locale: "en", ID: "alpha-post", Title: "Alpha"},
			TR: &domain.AdminContentPostRecord{Locale: "tr", ID: "alpha-post", Title: "Alfa"},
		}},
		Total: 1,
		Page:  1,
		Size:  20,
	})
	if postPayload.Total != 1 || len(postPayload.Items) != 1 || postPayload.Items[0].Preferred == nil || postPayload.Items[0].Preferred.TopicIds[0] != "go" {
		t.Fatalf("unexpected content post payload: %#v", postPayload)
	}

	topicPayload := mapAdminContentTopicListPayload(&domain.AdminContentTopicListResult{
		Items: []domain.AdminContentTopicGroupRecord{{
			ID:        "alpha-topic",
			Preferred: domain.AdminContentTopicRecord{Locale: "en", ID: "alpha-topic", Name: "Alpha", Color: "#fff", Link: "https://example.com", UpdatedAt: now},
			EN:        &domain.AdminContentTopicRecord{Locale: "en", ID: "alpha-topic", Name: "Alpha"},
			TR:        &domain.AdminContentTopicRecord{Locale: "tr", ID: "alpha-topic", Name: "Alfa"},
		}},
		Total: 1,
		Page:  1,
		Size:  10,
	})
	if topicPayload.Total != 1 || len(topicPayload.Items) != 1 || topicPayload.Items[0].Preferred == nil {
		t.Fatalf("unexpected topic payload: %#v", topicPayload)
	}
	if len(mapAdminContentTopics([]domain.AdminContentTopicRecord{{Locale: "en", ID: "beta-topic", Name: "Beta"}})) != 1 {
		t.Fatal("expected mapped content topics")
	}

	categoryPayload := mapAdminContentCategoryListPayload(&domain.AdminContentCategoryListResult{
		Items: []domain.AdminContentCategoryGroupRecord{{
			ID:        "alpha-category",
			Preferred: domain.AdminContentCategoryRecord{Locale: "en", ID: "alpha-category", Name: "Alpha", Color: "#000", Icon: "tag", Link: "https://example.com", UpdatedAt: now},
			EN:        &domain.AdminContentCategoryRecord{Locale: "en", ID: "alpha-category", Name: "Alpha"},
			TR:        &domain.AdminContentCategoryRecord{Locale: "tr", ID: "alpha-category", Name: "Alfa"},
		}},
		Total: 1,
		Page:  1,
		Size:  10,
	})
	if categoryPayload.Total != 1 || len(categoryPayload.Items) != 1 || categoryPayload.Items[0].Preferred == nil {
		t.Fatalf("unexpected category payload: %#v", categoryPayload)
	}
	if len(mapAdminContentCategories([]domain.AdminContentCategoryRecord{{Locale: "en", ID: "beta-category", Name: "Beta", Color: "#111"}})) != 1 {
		t.Fatal("expected mapped content categories")
	}

	auditLogs := mapAdminAuditLogs([]domain.AdminAuditLogRecord{{
		ID:          "audit-1",
		ActorID:     "admin-1",
		ActorEmail:  "admin@example.com",
		Action:      "updated",
		Scope:       "admin",
		Locale:      "en",
		Code:        "ADMIN_ERR",
		BeforeValue: "before",
		AfterValue:  "after",
		Status:      "success",
		FailureCode: " ",
		RequestID:   "req-1",
		RemoteIP:    "203.0.113.10",
		CountryCode: "TR",
		UserAgent:   "Mozilla/5.0",
		CreatedAt:   time.Time{},
	}})
	if len(auditLogs) != 1 || auditLogs[0].CreatedAt.IsZero() || auditLogs[0].FailureCode != nil {
		t.Fatalf("unexpected audit logs: %#v", auditLogs)
	}
}

func testAdminResolverInputMappings(t *testing.T, now time.Time) {
	parentID := "parent-1"
	scope := " admin "
	icon := " tag "
	mappedKey := mapAdminErrorMessageKey(model.AdminErrorMessageKeyInput{
		Scope:  &scope,
		Locale: " en ",
		Code:   " ADMIN_ERR ",
	})
	if mappedKey.Scope != "admin" || mappedKey.Locale != "en" || mappedKey.Code != "ADMIN_ERR" {
		t.Fatalf("unexpected mapped error key: %#v", mappedKey)
	}

	mappedTopicInput := mapAdminContentTopicInput(model.AdminContentTopicInput{
		Locale: " en ",
		ID:     " alpha-topic ",
		Name:   " Alpha Topic ",
		Color:  " #fff ",
		Link:   urlPtr(" https://example.com/topic "),
	})
	if mappedTopicInput.ID != "alpha-topic" || mappedTopicInput.Link != "https://example.com/topic" {
		t.Fatalf("unexpected mapped topic input: %#v", mappedTopicInput)
	}

	mappedCategoryInput := mapAdminContentCategoryInput(model.AdminContentCategoryInput{
		Locale: " en ",
		ID:     " alpha-category ",
		Name:   " Alpha Category ",
		Color:  " #000 ",
		Icon:   &icon,
		Link:   urlPtr(" https://example.com/topic "),
	})
	if mappedCategoryInput.Icon != "tag" || mappedCategoryInput.Link != "https://example.com/topic" {
		t.Fatalf("unexpected mapped category input: %#v", mappedCategoryInput)
	}

	mappedTopicIDs := mapAdminContentTopicIDs([]string{" alpha ", " ", "beta"})
	if len(mappedTopicIDs) != 2 || mappedTopicIDs[0] != "alpha" || mappedTopicIDs[1] != "beta" {
		t.Fatalf("unexpected mapped topic ids: %#v", mappedTopicIDs)
	}
	if len(mapAdminContentTopicIDs(nil)) != 0 || stringPointerValue(nil) != "" {
		t.Fatal("expected empty defaults for nil inputs")
	}
	trimmedInput := toOptionalTrimmedInputString(&scope)
	if trimmedInput == nil || *trimmedInput != "admin" {
		t.Fatalf("unexpected trimmed input: %#v", trimmedInput)
	}
	if toOptionalAdminString("  ") != nil || toOptionalAdminTime(time.Time{}) != nil || toOptionalAdminTimePointer(nil) != nil || adminDerefString(nil) != "" {
		t.Fatal("expected blank optional helpers to return nil/empty")
	}
	if toOptionalAdminTimePointer(&now) == nil {
		t.Fatal("expected optional admin time pointer")
	}
	testAdminResolverStatusAndCommentMappings(t, now, parentID)
}

func testAdminResolverStatusAndCommentMappings(t *testing.T, now time.Time, parentID string) {
	if mapAdminNewsletterStatusInput(model.AdminNewsletterSubscriberStatusUnsubscribed) != "unsubscribed" ||
		mapAdminNewsletterStatusInput(model.AdminNewsletterSubscriberStatusPending) != "pending" ||
		mapAdminNewsletterStatusOutput(" ACTIVE ") != model.AdminNewsletterSubscriberStatusActive ||
		mapAdminNewsletterStatusOutput("unknown") != model.AdminNewsletterSubscriberStatusPending {
		t.Fatal("unexpected newsletter status mapping")
	}
	if mapAdminCommentStatusInput(model.AdminCommentStatusApproved) != "approved" ||
		mapAdminCommentStatusInput(model.AdminCommentStatusRejected) != "rejected" ||
		mapAdminCommentStatusInput(model.AdminCommentStatusSpam) != "spam" ||
		mapAdminCommentStatusInput(model.AdminCommentStatusPending) != "pending" ||
		mapAdminCommentStatusOutput(" rejected ") != model.AdminCommentStatusRejected ||
		mapAdminCommentStatusOutput("spam") != model.AdminCommentStatusSpam {
		t.Fatal("unexpected comment status mapping")
	}

	comment := mapAdminComment(&domain.CommentRecord{
		ID:          "comment-1",
		PostID:      "post-1",
		PostTitle:   "Post",
		ParentID:    &parentID,
		AuthorName:  " Author ",
		AuthorEmail: " author@example.com ",
		Content:     " Content ",
		Status:      "approved",
		CreatedAt:   now,
		UpdatedAt:   now,
	})
	if comment == nil || comment.ParentID == nil || *comment.ParentID != "parent-1" || comment.Status != model.AdminCommentStatusApproved {
		t.Fatalf("unexpected mapped comment: %#v", comment)
	}
	commentList := mapAdminCommentListPayload(&domain.AdminCommentListResult{
		Items: []domain.CommentRecord{{ID: "comment-1", PostID: "post-1", AuthorName: "A", AuthorEmail: "a@example.com", Content: "Hi", Status: "pending", CreatedAt: now, UpdatedAt: now}},
		Total: 1,
		Page:  0,
		Size:  0,
	})
	if commentList.Page != 1 || commentList.Size != 1 || len(commentList.Items) != 1 {
		t.Fatalf("unexpected comment list payload: %#v", commentList)
	}
	if mapAdminCommentListPayload(nil).Size != 1 {
		t.Fatal("expected nil comment list defaults")
	}
}

func TestAdminResolverMappingNilInputsAndDefaults(t *testing.T) {
	if mapAdminUser(nil) != nil || mapAdminNewsletterCampaign(nil) != nil ||
		mapAdminNewsletterDeliveryFailure(nil) != nil || mapAdminNewsletterSubscriber(nil) != nil ||
		mapAdminErrorMessage(nil) != nil || mapAdminContentPostGroup(nil) != nil ||
		mapAdminContentTopicGroup(nil) != nil || mapAdminContentCategoryGroup(nil) != nil ||
		mapAdminContentPost(nil) != nil || mapAdminContentPostRevision(nil) != nil ||
		mapAdminComment(nil) != nil || mapAdminMediaLibraryItem(nil) != nil {
		t.Fatal("nil records must map to nil")
	}

	if mapAdminNewsletterSubscriberListPayload(nil).Page != 1 ||
		mapAdminNewsletterCampaignListPayload(nil).Page != 1 ||
		mapAdminNewsletterDeliveryFailureListPayload(nil).Page != 1 ||
		mapAdminErrorMessageListPayload(nil).Page != 1 ||
		mapAdminContentPostListPayload(nil).Page != 1 ||
		mapAdminContentTopicListPayload(nil).Page != 1 ||
		mapAdminContentCategoryListPayload(nil).Page != 1 {
		t.Fatal("nil list payloads must use their first-page defaults")
	}
	if mapAdminNewsletterDispatchPayload(nil).Results == nil || mapAdminNewsletterTestSendPayload(nil) == nil {
		t.Fatal("nil newsletter payloads must produce usable defaults")
	}
	if mapAdminContentPostRevisionListPayload(nil).Size != 0 || mapAdminCommentListPayload(nil).Size != 1 {
		t.Fatal("nil revision and comment payloads must use their default sizes")
	}
	if mapAdminContentPostStatusInput(nil) != nil || localePointerValue(nil) != "" ||
		urlPointerValue(nil) != "" || urlPointerToStringPointer(nil) != nil ||
		datePointerToStringPointer(nil) != nil || toOptionalTrimmedInputString(nil) != nil ||
		normalizeAdminLocalePointer(nil) != "" {
		t.Fatal("nil optional input pointers must map to empty defaults")
	}
	if mapAdminNewsletterCampaignStatusOutput("unknown") != model.AdminNewsletterCampaignStatusProcessing ||
		mapAdminContentPostStatusOutput("unknown") != model.AdminContentPostStatusPublished ||
		mapAdminContentModeOutput("unknown") != nil {
		t.Fatal("unknown values must map to documented output defaults")
	}
}

func TestAdminResolverSessionAndRequestHelpers(t *testing.T) {
	t.Setenv("JWT_SECRET", "test-secret")
	t.Setenv("ADMIN_REFRESH_COOKIE_NAME", "admin_refresh")
	t.Setenv("ADMIN_ACCESS_COOKIE_NAME", "admin_access")
	t.Setenv("ADMIN_CSRF_COOKIE_NAME", "admin_csrf")

	claims := httpauth.JWTClaims{
		ID:        "session-123",
		Subject:   "admin-1",
		Type:      "refresh",
		IssuedAt:  time.Now().Add(-time.Minute).Unix(),
		ExpiresAt: time.Now().Add(time.Hour).Unix(),
	}
	token, err := httpauth.IssueHS256JWT(claims, "test-secret")
	if err != nil {
		t.Fatalf("IssueHS256JWT returned error: %v", err)
	}

	request := httptest.NewRequest(http.MethodPost, "/admin", nil)
	request.AddCookie(&http.Cookie{Name: "admin_refresh", Value: token})
	request.Header.Set("CF-IPCountry", "tr")
	request.Header.Set("User-Agent", "Mozilla/5.0 Chrome/122 Windows NT 10.0")
	recorder := httptest.NewRecorder()

	ctx := withRequestContext(context.Background(), request, recorder)
	if sessionID := resolveCurrentRefreshSessionID(ctx); sessionID != "session-123" {
		t.Fatalf("unexpected refresh session id: %q", sessionID)
	}

	traceCtx := httpapi.WithRequestTrace(context.Background(), httpapi.RequestTrace{
		RemoteIP:    "203.0.113.10",
		UserAgent:   "Mozilla/5.0 Firefox/123 Linux",
		CountryCode: "tr",
	})
	metadata := resolveAdminSessionMetadata(traceCtx, request)
	if metadata.RemoteIP != "203.0.113.10" || metadata.UserAgent != "Mozilla/5.0 Firefox/123 Linux" || metadata.CountryCode != "TR" {
		t.Fatalf("unexpected trace-backed metadata: %#v", metadata)
	}

	metadata = resolveAdminSessionMetadata(context.Background(), request)
	if metadata.UserAgent == "" || metadata.CountryCode != "TR" {
		t.Fatalf("unexpected request-backed metadata: %#v", metadata)
	}
	if resolveCountryCodeFromRequest(request) != "TR" || resolveCountryCodeFromRequest(nil) != "" {
		t.Fatal("unexpected country code resolution")
	}

	assertAdminDeviceLabels(t)

	config := appconfig.ResolveAdminConfig()
	clearAdminSessionCookies(recorder, config)
	setAdminRefreshCookie(recorder, config, &appservice.AdminAuthResponse{
		RefreshToken: "refresh-token",
		RememberMe:   true,
		RefreshTTL:   2 * time.Hour,
	})
	setAdminRefreshCookie(recorder, config, &appservice.AdminAuthResponse{
		RefreshToken: "refresh-session-token",
		RememberMe:   false,
	})
	assertAdminCookieHeaders(t, recorder, config)
}

func assertAdminDeviceLabels(t *testing.T) {
	t.Helper()
	if resolveAdminDeviceLabel("Mozilla/5.0 Chrome/122 Windows NT 10.0") != "Chrome on Windows" {
		t.Fatal("expected desktop device label")
	}
	if resolveAdminDeviceLabel("Mozilla/5.0 iPhone Safari/17") != "Safari on iOS" {
		t.Fatal("expected mobile device label")
	}
	if resolveAdminDeviceLabel("Tablet") != "Tablet browser" || resolveAdminDeviceLabel("X11") != "Linux" || resolveAdminDeviceLabel("CustomAgent") != "Browser" {
		t.Fatal("expected fallback device labels")
	}
	if resolveBrowserLabel("edg/123") != "Edge" || resolveBrowserLabel("opr/99") != "Opera" || resolveBrowserLabel("chromium/123") != "Chromium" {
		t.Fatal("expected browser label mappings")
	}
	if resolveOSLabel("android") != "Android" || resolveOSLabel("mac os x") != "macOS" || resolveOSLabel("cros") != "ChromeOS" || resolveOSLabel("linux") != "Linux" {
		t.Fatal("expected OS label mappings")
	}
	if resolveAdminDeviceLabel("") != "Unknown device" || resolveBrowserLabel("unknown") != "" || resolveOSLabel("unknown") != "" {
		t.Fatal("unexpected unknown labels")
	}
	if resolveAdminIPAddressLabel(" ") != "Unknown" || resolveAdminCountryCodeLabel("xyz") != "Unknown" {
		t.Fatal("unexpected fallback labels")
	}
}

func assertAdminCookieHeaders(t *testing.T, recorder *httptest.ResponseRecorder, config appconfig.AdminConfig) {
	t.Helper()
	headers := recorder.Result().Header["Set-Cookie"]
	if len(headers) < 5 {
		t.Fatalf("expected multiple set-cookie headers, got %#v", headers)
	}
	joined := strings.Join(headers, "\n")
	if !strings.Contains(joined, config.RefreshCookieName+"=refresh-token") || !strings.Contains(joined, config.RefreshCookieName+"=refresh-session-token") || !strings.Contains(joined, config.AccessCookieName+"=") {
		t.Fatalf("unexpected set-cookie output: %s", joined)
	}
}

func TestAdminQueryResolvers(t *testing.T) {
	t.Setenv("JWT_SECRET", "test-secret")
	t.Setenv("ADMIN_REFRESH_COOKIE_NAME", "admin_refresh")

	adminUser := &domain.AdminUser{
		ID:    "admin-1",
		Name:  "Admin",
		Email: "admin@example.com",
		Roles: []string{"admin"},
	}
	now := time.Date(2026, time.March, 22, 9, 0, 0, 0, time.UTC)
	page := 2
	size := 15
	commentStatus := model.AdminCommentStatusApproved
	subscriberStatus := model.AdminNewsletterSubscriberStatusActive
	postID := " post-1 "
	query := " alpha "
	locale := appscalars.Locale(" tr ")
	preferredLocale := appscalars.Locale(" en ")
	source := model.ContentSource(" medium ")
	categoryID := " category-1 "
	topicID := " topic-1 "
	campaignStatus := model.AdminNewsletterCampaignStatusSent
	errorCode := " ERR_1 "

	originalQueryAdminGoogleAuthStatusFn := queryAdminGoogleAuthStatusFn
	originalQueryAdminGithubAuthStatusFn := queryAdminGithubAuthStatusFn
	originalQueryAdminDashboardFn := queryAdminDashboardFn
	originalListAdminCommentsFn := listAdminCommentsFn
	originalListActiveAdminSessionsFn := listActiveAdminSessionsFn
	originalListAdminNewsletterSubscribersFn := listAdminNewsletterSubscribersFn
	originalListAdminNewsletterCampaignsFn := listAdminNewsletterCampaignsFn
	originalListAdminNewsletterDeliveryFailuresFn := listAdminNewsletterDeliveryFailuresFn
	originalListAdminErrorMessagesFn := listAdminErrorMessagesFn
	originalListAdminContentPostsFn := listAdminContentPostsFn
	originalGetAdminContentPostFn := getAdminContentPostFn
	originalListAdminContentTopicsPageFn := listAdminContentTopicsPageFn
	originalListAdminContentCategoriesPageFn := listAdminContentCategoriesPageFn
	originalListAdminContentTopicsFn := listAdminContentTopicsFn
	originalListAdminContentCategoriesFn := listAdminContentCategoriesFn
	originalListAdminErrorMessageAuditLogsFn := listAdminErrorMessageAuditLogsFn
	t.Cleanup(func() {
		queryAdminGoogleAuthStatusFn = originalQueryAdminGoogleAuthStatusFn
		queryAdminGithubAuthStatusFn = originalQueryAdminGithubAuthStatusFn
		queryAdminDashboardFn = originalQueryAdminDashboardFn
		listAdminCommentsFn = originalListAdminCommentsFn
		listActiveAdminSessionsFn = originalListActiveAdminSessionsFn
		listAdminNewsletterSubscribersFn = originalListAdminNewsletterSubscribersFn
		listAdminNewsletterCampaignsFn = originalListAdminNewsletterCampaignsFn
		listAdminNewsletterDeliveryFailuresFn = originalListAdminNewsletterDeliveryFailuresFn
		listAdminErrorMessagesFn = originalListAdminErrorMessagesFn
		listAdminContentPostsFn = originalListAdminContentPostsFn
		getAdminContentPostFn = originalGetAdminContentPostFn
		listAdminContentTopicsPageFn = originalListAdminContentTopicsPageFn
		listAdminContentCategoriesPageFn = originalListAdminContentCategoriesPageFn
		listAdminContentTopicsFn = originalListAdminContentTopicsFn
		listAdminContentCategoriesFn = originalListAdminContentCategoriesFn
		listAdminErrorMessageAuditLogsFn = originalListAdminErrorMessageAuditLogsFn
	})

	queryAdminGoogleAuthStatusFn = func(context.Context) (*appservice.AdminGoogleAuthStatusResult, error) {
		return &appservice.AdminGoogleAuthStatusResult{Enabled: true, LoginAvailable: true}, nil
	}
	queryAdminGithubAuthStatusFn = func(context.Context) (*appservice.AdminGithubAuthStatusResult, error) {
		return &appservice.AdminGithubAuthStatusResult{Enabled: true}, nil
	}
	queryAdminDashboardFn = func(context.Context) (*domain.AdminDashboard, error) {
		return &domain.AdminDashboard{
			TotalPosts:       7,
			TotalSubscribers: 11,
		}, nil
	}
	listAdminCommentsFn = func(_ context.Context, user *domain.AdminUser, filter domain.AdminCommentFilter) (*domain.AdminCommentListResult, error) {
		testassert.Equal(t, user.ID, "admin-1", "comment list user")
		testassert.Equal(t, filter.Status, "approved", "comment status filter")
		testassert.Equal(t, filter.PostID, "post-1", "comment post filter")
		testassert.Equal(t, filter.Query, "alpha", "comment query filter")
		testassert.NotNil(t, filter.Page, "comment page should be provided")
		testassert.Equal(t, *filter.Page, 2, "comment page")
		testassert.NotNil(t, filter.Size, "comment size should be provided")
		testassert.Equal(t, *filter.Size, 15, "comment page size")
		return &domain.AdminCommentListResult{
			Items: []domain.CommentRecord{{ID: "comment-1", PostID: "post-1", AuthorName: "Reader", AuthorEmail: "reader@example.com", Content: "hello", Status: "approved", CreatedAt: now, UpdatedAt: now}},
			Total: 1,
			Page:  2,
			Size:  15,
		}, nil
	}
	listActiveAdminSessionsFn = func(_ context.Context, user *domain.AdminUser) ([]domain.AdminSessionRecord, error) {
		testassert.Equal(t, user.ID, "admin-1", "active session user")
		return []domain.AdminSessionRecord{{
			ID:          "session-123",
			UserAgent:   "Mozilla/5.0 Chrome/122 Windows NT 10.0",
			RemoteIP:    "203.0.113.10",
			CountryCode: "tr",
			LastSeenAt:  now,
			CreatedAt:   now.Add(-time.Hour),
			ExpiresAt:   now.Add(time.Hour),
			Persistent:  true,
		}}, nil
	}
	listAdminNewsletterSubscribersFn = func(_ context.Context, user *domain.AdminUser, filter domain.AdminNewsletterSubscriberFilter) (*domain.AdminNewsletterSubscriberListResult, error) {
		testassert.Equal(t, user.ID, "admin-1", "subscriber list user")
		testassert.Equal(t, filter.Locale, "tr", "subscriber locale filter")
		testassert.Equal(t, filter.Status, "active", "subscriber status filter")
		testassert.Equal(t, filter.Query, "alpha", "subscriber query filter")
		testassert.NotNil(t, filter.Page, "subscriber page should be provided")
		testassert.Equal(t, *filter.Page, 2, "subscriber page")
		testassert.NotNil(t, filter.Size, "subscriber size should be provided")
		testassert.Equal(t, *filter.Size, 15, "subscriber page size")
		return &domain.AdminNewsletterSubscriberListResult{
			Items: []domain.AdminNewsletterSubscriberRecord{{Email: "reader@example.com", Locale: "tr", Status: "active", UpdatedAt: now, CreatedAt: now}},
			Total: 1,
			Page:  2,
			Size:  15,
		}, nil
	}
	listAdminNewsletterCampaignsFn = func(_ context.Context, user *domain.AdminUser, filter domain.AdminNewsletterCampaignFilter) (*domain.AdminNewsletterCampaignListResult, error) {
		testassert.Equal(t, user.ID, "admin-1", "campaign list user")
		testassert.Equal(t, filter.Locale, "tr", "campaign locale filter")
		testassert.Equal(t, filter.Status, "sent", "campaign status filter")
		testassert.Equal(t, filter.Query, "alpha", "campaign query filter")
		testassert.NotNil(t, filter.Page, "campaign page should be provided")
		testassert.Equal(t, *filter.Page, 2, "campaign page")
		testassert.NotNil(t, filter.Size, "campaign size should be provided")
		testassert.Equal(t, *filter.Size, 15, "campaign page size")
		return &domain.AdminNewsletterCampaignListResult{
			Items: []domain.AdminNewsletterCampaignRecord{{Locale: "tr", ItemKey: "post:1", Title: "Alpha", Status: "sent", UpdatedAt: now, CreatedAt: now, LastRunAt: now}},
			Total: 1,
			Page:  2,
			Size:  15,
		}, nil
	}
	listAdminNewsletterDeliveryFailuresFn = func(_ context.Context, user *domain.AdminUser, filter domain.AdminNewsletterDeliveryFailureFilter) (*domain.AdminNewsletterDeliveryFailureListResult, error) {
		testassert.Equal(t, user.ID, "admin-1", "failure list user")
		testassert.Equal(t, filter.Locale, "tr", "failure locale filter")
		testassert.Equal(t, filter.ItemKey, "alpha-item", "failure item filter")
		testassert.NotNil(t, filter.Page, "failure page should be provided")
		testassert.Equal(t, *filter.Page, 2, "failure page")
		testassert.NotNil(t, filter.Size, "failure size should be provided")
		testassert.Equal(t, *filter.Size, 15, "failure page size")
		return &domain.AdminNewsletterDeliveryFailureListResult{
			Items: []domain.AdminNewsletterDeliveryFailureRecord{{Locale: "tr", ItemKey: "alpha-item", Email: "reader@example.com", Status: "failed", LastAttemptAt: now, UpdatedAt: now, CreatedAt: now}},
			Total: 1,
			Page:  2,
			Size:  15,
		}, nil
	}
	listAdminErrorMessagesFn = func(_ context.Context, user *domain.AdminUser, filter domain.AdminErrorMessageFilter) (*domain.AdminErrorMessageListResult, error) {
		testassert.Equal(t, user.ID, "admin-1", "error message list user")
		testassert.Equal(t, filter.Locale, "tr", "error message locale filter")
		testassert.Equal(t, filter.Code, "ERR_1", "error message code filter")
		testassert.Equal(t, filter.Query, "alpha", "error message query filter")
		testassert.NotNil(t, filter.Page, "error message page should be provided")
		testassert.Equal(t, *filter.Page, 2, "error message page")
		testassert.NotNil(t, filter.Size, "error message size should be provided")
		testassert.Equal(t, *filter.Size, 15, "error message page size")
		return &domain.AdminErrorMessageListResult{
			Items: []domain.AdminErrorMessageView{{AdminErrorMessageKey: domain.AdminErrorMessageKey{Scope: "admin", Locale: "tr", Code: "ERR_1"}, Message: "Error", UpdatedAt: now}},
			Total: 1,
			Page:  2,
			Size:  15,
		}, nil
	}
	listAdminContentPostsFn = func(_ context.Context, user *domain.AdminUser, filter domain.AdminContentPostFilter) (*domain.AdminContentPostListResult, error) {
		testassert.Equal(t, user.ID, "admin-1", "content post list user")
		testassert.Equal(t, filter.Locale, "tr", "content post locale filter")
		testassert.Equal(t, filter.PreferredLocale, "en", "preferred content post locale filter")
		testassert.Equal(t, filter.Source, "medium", "content post source filter")
		testassert.Equal(t, filter.Query, "alpha", "content post query filter")
		testassert.Equal(t, filter.CategoryID, "category-1", "content post category filter")
		testassert.Equal(t, filter.TopicID, "topic-1", "content post topic filter")
		testassert.NotNil(t, filter.Page, "content post page should be provided")
		testassert.Equal(t, *filter.Page, 2, "content post page")
		testassert.NotNil(t, filter.Size, "content post size should be provided")
		testassert.Equal(t, *filter.Size, 15, "content post page size")
		return &domain.AdminContentPostListResult{
			Items: []domain.AdminContentPostGroupRecord{{
				ID:     "post-1",
				Source: "medium",
				Preferred: domain.AdminContentPostRecord{
					Locale:        "en",
					ID:            "post-1",
					Title:         "Alpha",
					Source:        "medium",
					PublishedDate: "2026-03-22",
				},
			}},
			Total: 1,
			Page:  2,
			Size:  15,
		}, nil
	}
	getAdminContentPostFn = func(_ context.Context, user *domain.AdminUser, contentLocale, id string) (*domain.AdminContentPostRecord, error) {
		testassert.Equal(t, user.ID, "admin-1", "content post user")
		testassert.Equal(t, contentLocale, "tr", "content post locale")
		testassert.Equal(t, id, "post-1", "content post ID")
		return &domain.AdminContentPostRecord{Locale: "tr", ID: "post-1", Title: "Alpha", Source: "blog", PublishedDate: "2026-03-22"}, nil
	}
	listAdminContentTopicsPageFn = func(_ context.Context, user *domain.AdminUser, filter domain.AdminContentTaxonomyFilter) (*domain.AdminContentTopicListResult, error) {
		testassert.Equal(t, user.ID, "admin-1", "topic list user")
		testassert.Equal(t, filter.Locale, "tr", "topic locale filter")
		testassert.Equal(t, filter.PreferredLocale, "en", "preferred topic locale filter")
		testassert.Equal(t, filter.Query, "alpha", "topic query filter")
		testassert.NotNil(t, filter.Page, "topic page should be provided")
		testassert.Equal(t, *filter.Page, 2, "topic page")
		testassert.NotNil(t, filter.Size, "topic size should be provided")
		testassert.Equal(t, *filter.Size, 15, "topic page size")
		return &domain.AdminContentTopicListResult{
			Items: []domain.AdminContentTopicGroupRecord{{ID: "topic-1", Preferred: domain.AdminContentTopicRecord{Locale: "en", ID: "topic-1", Name: "Alpha", Color: "#fff", UpdatedAt: now}}},
			Total: 1,
			Page:  2,
			Size:  15,
		}, nil
	}
	listAdminContentCategoriesPageFn = func(_ context.Context, user *domain.AdminUser, filter domain.AdminContentTaxonomyFilter) (*domain.AdminContentCategoryListResult, error) {
		testassert.Equal(t, user.ID, "admin-1", "category list user")
		testassert.Equal(t, filter.Locale, "tr", "category locale filter")
		testassert.Equal(t, filter.PreferredLocale, "en", "preferred category locale filter")
		testassert.Equal(t, filter.Query, "alpha", "category query filter")
		testassert.NotNil(t, filter.Page, "category page should be provided")
		testassert.Equal(t, *filter.Page, 2, "category page")
		testassert.NotNil(t, filter.Size, "category size should be provided")
		testassert.Equal(t, *filter.Size, 15, "category page size")
		return &domain.AdminContentCategoryListResult{
			Items: []domain.AdminContentCategoryGroupRecord{{ID: "category-1", Preferred: domain.AdminContentCategoryRecord{Locale: "en", ID: "category-1", Name: "Alpha", Color: "#000", UpdatedAt: now}}},
			Total: 1,
			Page:  2,
			Size:  15,
		}, nil
	}
	listAdminContentTopicsFn = func(_ context.Context, user *domain.AdminUser, contentLocale, text string) ([]domain.AdminContentTopicRecord, error) {
		testassert.Equal(t, user.ID, "admin-1", "topic lookup user")
		testassert.Equal(t, contentLocale, "tr", "topic lookup locale")
		testassert.Equal(t, text, "alpha", "topic lookup query")
		return []domain.AdminContentTopicRecord{{Locale: "tr", ID: "topic-1", Name: "Alpha", Color: "#fff", UpdatedAt: now}}, nil
	}
	listAdminContentCategoriesFn = func(_ context.Context, user *domain.AdminUser, contentLocale string) ([]domain.AdminContentCategoryRecord, error) {
		testassert.Equal(t, user.ID, "admin-1", "category lookup user")
		testassert.Equal(t, contentLocale, "tr", "category lookup locale")
		return []domain.AdminContentCategoryRecord{{Locale: "tr", ID: "category-1", Name: "Alpha", Color: "#000", UpdatedAt: now}}, nil
	}
	listAdminErrorMessageAuditLogsFn = func(_ context.Context, user *domain.AdminUser, limit int) ([]domain.AdminAuditLogRecord, error) {
		testassert.Equal(t, user.ID, "admin-1", "audit log user")
		testassert.Equal(t, limit, 5, "audit log limit")
		return []domain.AdminAuditLogRecord{{ID: "audit-1", ActorID: "admin-1", ActorEmail: "admin@example.com", Action: "updated", Scope: "admin", Locale: "tr", Code: "ERR_1", Status: "success", CreatedAt: now}}, nil
	}

	request := httptest.NewRequest(http.MethodPost, "/admin/graphql", nil)
	request.AddCookie(&http.Cookie{Name: "admin_refresh", Value: issueAdminRefreshSessionTokenForTest(t, "session-123")})
	ctx := withRequestContext(WithAdminUser(context.Background(), adminUser), request, httptest.NewRecorder())
	queryResolver := &adminQueryResolver{Resolver: &Resolver{}}

	googleStatus, err := queryResolver.GoogleAuthStatus(ctx)
	testassert.NoError(t, err, "GoogleAuthStatus()")
	testassert.True(t, googleStatus.Enabled, "Google auth should be enabled")
	testassert.True(t, googleStatus.LoginAvailable, "Google login should be available")

	githubStatus, err := queryResolver.GithubAuthStatus(ctx)
	testassert.NoError(t, err, "GithubAuthStatus()")
	testassert.True(t, githubStatus.Enabled, "GitHub auth should be enabled")
	testassert.True(t, !githubStatus.LoginAvailable, "GitHub login should be unavailable")

	dashboard, err := queryResolver.Dashboard(ctx)
	testassert.NoError(t, err, "Dashboard()")
	testassert.Equal(t, dashboard.TotalPosts, 7, "dashboard post count")
	testassert.Equal(t, dashboard.TotalSubscribers, 11, "dashboard subscriber count")

	commentList, err := queryResolver.Comments(ctx, &model.AdminCommentFilterInput{
		Status: &commentStatus,
		PostID: &postID,
		Query:  &query,
		Page:   &page,
		Size:   &size,
	})
	testassert.NoError(t, err, "Comments()")
	testassert.Equal(t, commentList.Total, 1, "comment list total")
	testassert.Equal(t, len(commentList.Items), 1, "comment list item count")

	sessions, err := queryResolver.ActiveSessions(ctx)
	testassert.NoError(t, err, "ActiveSessions()")
	testassert.Equal(t, len(sessions), 1, "active session count")
	testassert.True(t, sessions[0].Current, "active session should be marked current")

	subscriberList, err := queryResolver.NewsletterSubscribers(ctx, &model.AdminNewsletterSubscriberFilterInput{
		Locale: &locale,
		Status: &subscriberStatus,
		Query:  &query,
		Page:   &page,
		Size:   &size,
	})
	testassert.NoError(t, err, "NewsletterSubscribers()")
	testassert.Equal(t, subscriberList.Total, 1, "subscriber list total")
	testassert.Equal(t, len(subscriberList.Items), 1, "subscriber list item count")

	campaignList, err := queryResolver.NewsletterCampaigns(ctx, &model.AdminNewsletterCampaignFilterInput{
		Locale: &locale,
		Status: &campaignStatus,
		Query:  &query,
		Page:   &page,
		Size:   &size,
	})
	testassert.NoError(t, err, "NewsletterCampaigns()")
	testassert.Equal(t, campaignList.Total, 1, "campaign list total")
	testassert.Equal(t, len(campaignList.Items), 1, "campaign list item count")

	failureList, err := queryResolver.NewsletterCampaignFailures(ctx, model.AdminNewsletterDeliveryFailureFilterInput{
		Locale:  locale,
		ItemKey: " alpha-item ",
		Page:    &page,
		Size:    &size,
	})
	testassert.NoError(t, err, "NewsletterCampaignFailures()")
	testassert.Equal(t, failureList.Total, 1, "campaign failure list total")
	testassert.Equal(t, len(failureList.Items), 1, "campaign failure item count")

	errorList, err := queryResolver.ErrorMessages(ctx, &model.AdminErrorMessageFilterInput{
		Locale: &locale,
		Code:   &errorCode,
		Query:  &query,
		Page:   &page,
		Size:   &size,
	})
	testassert.NoError(t, err, "ErrorMessages()")
	testassert.Equal(t, errorList.Total, 1, "error message list total")
	testassert.Equal(t, len(errorList.Items), 1, "error message item count")

	postList, err := queryResolver.ContentPosts(ctx, &model.AdminContentPostFilterInput{
		Locale:          &locale,
		PreferredLocale: &preferredLocale,
		Source:          &source,
		Query:           &query,
		CategoryID:      &categoryID,
		TopicID:         &topicID,
		Page:            &page,
		Size:            &size,
	})
	testassert.NoError(t, err, "ContentPosts()")
	testassert.Equal(t, postList.Total, 1, "content post list total")
	testassert.Equal(t, len(postList.Items), 1, "content post item count")

	post, err := queryResolver.ContentPost(ctx, model.AdminContentEntityKeyInput{Locale: locale, ID: postID})
	testassert.NoError(t, err, "ContentPost()")
	testassert.NotNil(t, post, "content post should be returned")
	testassert.Equal(t, post.ID, "post-1", "content post ID")

	topicPage, err := queryResolver.ContentTopicsPage(ctx, &model.AdminContentTaxonomyFilterInput{
		Locale:          &locale,
		PreferredLocale: &preferredLocale,
		Query:           &query,
		Page:            &page,
		Size:            &size,
	})
	testassert.NoError(t, err, "ContentTopicsPage()")
	testassert.Equal(t, topicPage.Total, 1, "topic page total")
	testassert.Equal(t, len(topicPage.Items), 1, "topic page item count")

	categoryPage, err := queryResolver.ContentCategoriesPage(ctx, &model.AdminContentTaxonomyFilterInput{
		Locale:          &locale,
		PreferredLocale: &preferredLocale,
		Query:           &query,
		Page:            &page,
		Size:            &size,
	})
	testassert.NoError(t, err, "ContentCategoriesPage()")
	testassert.Equal(t, categoryPage.Total, 1, "category page total")
	testassert.Equal(t, len(categoryPage.Items), 1, "category page item count")

	topics, err := queryResolver.ContentTopics(ctx, &locale, &query)
	testassert.NoError(t, err, "ContentTopics()")
	testassert.Equal(t, len(topics), 1, "content topic count")
	testassert.Equal(t, topics[0].ID, "topic-1", "content topic ID")

	categories, err := queryResolver.ContentCategories(ctx, &locale)
	testassert.NoError(t, err, "ContentCategories()")
	testassert.Equal(t, len(categories), 1, "content category count")
	testassert.Equal(t, categories[0].ID, "category-1", "content category ID")

	limit := 5
	auditLogs, err := queryResolver.ErrorMessageAuditLogs(ctx, &limit)
	testassert.NoError(t, err, "ErrorMessageAuditLogs()")
	testassert.Equal(t, len(auditLogs), 1, "audit log count")
	testassert.Equal(t, auditLogs[0].ID, "audit-1", "audit log ID")
}

func TestAdminMutationAuthResolvers(t *testing.T) {
	t.Setenv("JWT_SECRET", "test-secret")
	t.Setenv("ADMIN_ACCESS_COOKIE_NAME", "admin_access")
	t.Setenv("ADMIN_REFRESH_COOKIE_NAME", "admin_refresh")
	t.Setenv("ADMIN_CSRF_COOKIE_NAME", "admin_csrf")

	adminUser := &domain.AdminUser{
		ID:    "admin-1",
		Name:  "Admin",
		Email: "admin@example.com",
		Roles: []string{"admin"},
	}
	recorder := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodPost, "/admin/graphql", nil)
	request.RemoteAddr = "203.0.113.20:8080"
	request.Header.Set("CF-IPCountry", "tr")
	request.Header.Set("User-Agent", "Mozilla/5.0 Chrome/122 Windows NT 10.0")
	traceCtx := httpapi.WithRequestTrace(context.Background(), httpapi.RequestTrace{
		RemoteIP:    "203.0.113.20",
		UserAgent:   "Mozilla/5.0 Chrome/122 Windows NT 10.0",
		CountryCode: "tr",
	})
	ctx := withRequestContext(traceCtx, request, recorder)
	authCtx := withRequestContext(WithAdminUser(traceCtx, adminUser), request, recorder)
	now := time.Date(2026, time.March, 22, 10, 0, 0, 0, time.UTC)

	originalLoginAdminFn := loginAdminFn
	originalStartAdminGoogleConnectFn := startAdminGoogleConnectFn
	originalDisconnectAdminGoogleAccountFn := disconnectAdminGoogleAccountFn
	originalStartAdminGithubConnectFn := startAdminGithubConnectFn
	originalDisconnectAdminGithubAccountFn := disconnectAdminGithubAccountFn
	originalRefreshAdminSessionFn := refreshAdminSessionFn
	originalLogoutAdminFn := logoutAdminFn
	originalRequestAdminPasswordResetFn := requestAdminPasswordResetFn
	originalValidateAdminPasswordResetTokenFn := validateAdminPasswordResetTokenFn
	originalResetAdminPasswordWithTokenFn := resetAdminPasswordWithTokenFn
	originalConfirmAdminEmailChangeFn := confirmAdminEmailChangeFn
	originalChangeAdminNameFn := changeAdminNameFn
	originalChangeAdminAvatarFn := changeAdminAvatarFn
	originalChangeAdminUsernameFn := changeAdminUsernameFn
	originalRequestAdminEmailChangeFn := requestAdminEmailChangeFn
	originalDeleteAdminAccountFn := deleteAdminAccountFn
	originalChangeAdminPasswordFn := changeAdminPasswordFn
	originalRevokeAdminSessionFn := revokeAdminSessionFn
	originalRevokeAllAdminSessionsFn := revokeAllAdminSessionsFn
	t.Cleanup(func() {
		loginAdminFn = originalLoginAdminFn
		startAdminGoogleConnectFn = originalStartAdminGoogleConnectFn
		disconnectAdminGoogleAccountFn = originalDisconnectAdminGoogleAccountFn
		startAdminGithubConnectFn = originalStartAdminGithubConnectFn
		disconnectAdminGithubAccountFn = originalDisconnectAdminGithubAccountFn
		refreshAdminSessionFn = originalRefreshAdminSessionFn
		logoutAdminFn = originalLogoutAdminFn
		requestAdminPasswordResetFn = originalRequestAdminPasswordResetFn
		validateAdminPasswordResetTokenFn = originalValidateAdminPasswordResetTokenFn
		resetAdminPasswordWithTokenFn = originalResetAdminPasswordWithTokenFn
		confirmAdminEmailChangeFn = originalConfirmAdminEmailChangeFn
		changeAdminNameFn = originalChangeAdminNameFn
		changeAdminAvatarFn = originalChangeAdminAvatarFn
		changeAdminUsernameFn = originalChangeAdminUsernameFn
		requestAdminEmailChangeFn = originalRequestAdminEmailChangeFn
		deleteAdminAccountFn = originalDeleteAdminAccountFn
		changeAdminPasswordFn = originalChangeAdminPasswordFn
		revokeAdminSessionFn = originalRevokeAdminSessionFn
		revokeAllAdminSessionsFn = originalRevokeAllAdminSessionsFn
	})

	loginAdminFn = func(_ context.Context, email, password string, rememberMe bool, metadata appservice.AdminSessionMetadata) (*appservice.AdminAuthResponse, error) {
		testassert.Equal(t, email, "admin@example.com", "login email")
		testassert.Equal(t, password, "password", "login password")
		testassert.True(t, rememberMe, "login should remember the session")
		testassert.Equal(t, metadata.RemoteIP, "203.0.113.20", "login remote IP")
		testassert.Equal(t, metadata.CountryCode, "TR", "login country")
		return &appservice.AdminAuthResponse{
			Success:      true,
			User:         adminUser,
			AccessToken:  "access-token",
			RefreshToken: "refresh-token",
			RememberMe:   true,
			RefreshTTL:   time.Hour,
		}, nil
	}
	startAdminGoogleConnectFn = func(_ context.Context, user *domain.AdminUser, locale string) (*appservice.AdminGoogleConnectResult, error) {
		testassert.Equal(t, user.ID, "admin-1", "Google connect user")
		testassert.Equal(t, locale, "tr", "Google connect locale")
		return &appservice.AdminGoogleConnectResult{URL: "/api/oauth/connect?provider=google"}, nil
	}
	disconnectAdminGoogleAccountFn = func(_ context.Context, user *domain.AdminUser) (*domain.AdminUser, error) {
		testassert.Equal(t, user.ID, "admin-1", "Google disconnect user")
		return &domain.AdminUser{ID: "admin-1", Email: "admin@example.com"}, nil
	}
	startAdminGithubConnectFn = func(_ context.Context, user *domain.AdminUser, locale string) (*appservice.AdminGithubConnectResult, error) {
		testassert.Equal(t, user.ID, "admin-1", "GitHub connect user")
		testassert.Equal(t, locale, "tr", "GitHub connect locale")
		return &appservice.AdminGithubConnectResult{URL: "/api/oauth/connect?provider=github"}, nil
	}
	disconnectAdminGithubAccountFn = func(_ context.Context, user *domain.AdminUser) (*domain.AdminUser, error) {
		testassert.Equal(t, user.ID, "admin-1", "GitHub disconnect user")
		return &domain.AdminUser{ID: "admin-1", Email: "admin@example.com"}, nil
	}
	refreshAdminSessionFn = func(_ context.Context, token string, metadata appservice.AdminSessionMetadata) (*appservice.AdminAuthResponse, error) {
		testassert.Equal(t, token, "refresh-session", "refresh token")
		testassert.Equal(t, metadata.RemoteIP, "203.0.113.20", "refresh remote IP")
		testassert.Equal(t, metadata.CountryCode, "TR", "refresh country")
		return &appservice.AdminAuthResponse{
			Success:      true,
			User:         adminUser,
			AccessToken:  "refreshed-access-token",
			RefreshToken: "rotated-refresh-token",
			RememberMe:   false,
		}, nil
	}
	logoutAdminFn = func(_ context.Context, token string) error {
		testassert.Equal(t, token, "refresh-session", "logout token")
		return nil
	}
	requestAdminPasswordResetFn = func(_ context.Context, email, locale string) error {
		testassert.Equal(t, email, "admin@example.com", "password reset email")
		testassert.Equal(t, locale, "tr", "password reset locale")
		return nil
	}
	validateAdminPasswordResetTokenFn = func(_ context.Context, token, locale string) (*appservice.AdminPasswordResetValidationResult, error) {
		testassert.Equal(t, token, "reset-token", "password reset token")
		testassert.Equal(t, locale, "tr", "password reset validation locale")
		return &appservice.AdminPasswordResetValidationResult{Status: "success", Locale: "tr"}, nil
	}
	resetAdminPasswordWithTokenFn = func(
		_ context.Context,
		token,
		newPassword,
		confirmPassword,
		locale string,
	) (*appservice.AdminPasswordResetResult, error) {
		testassert.Equal(t, token, "reset-token", "password reset confirmation token")
		testassert.Equal(t, newPassword, "new-password", "password reset new password")
		testassert.Equal(t, confirmPassword, "new-password", "password reset confirmation")
		testassert.Equal(t, locale, "tr", "password reset confirmation locale")
		return &appservice.AdminPasswordResetResult{Success: true, Locale: "tr"}, nil
	}
	confirmAdminEmailChangeFn = func(_ context.Context, token, locale string) (*appservice.AdminEmailChangeConfirmResult, error) {
		testassert.Equal(t, token, "confirm-token", "email confirmation token")
		testassert.Equal(t, locale, "tr", "email confirmation locale")
		return &appservice.AdminEmailChangeConfirmResult{Status: "success", Locale: "tr"}, nil
	}
	changeAdminNameFn = func(_ context.Context, user *domain.AdminUser, name string) (*domain.AdminUser, error) {
		testassert.Equal(t, user.ID, "admin-1", "name change user")
		testassert.Equal(t, name, "Display Name", "updated display name")
		updatedUser := *adminUser
		updatedUser.Name = name
		return &updatedUser, nil
	}
	changeAdminAvatarFn = func(_ context.Context, user *domain.AdminUser, avatarURL *string) (*domain.AdminUser, error) {
		testassert.Equal(t, user.ID, "admin-1", "avatar change user")
		testassert.NotNil(t, avatarURL, "avatar URL should be provided")
		testassert.Equal(t, *avatarURL, "/avatar.png", "avatar URL")
		updatedUser := *adminUser
		updatedUser.AvatarURL = strings.TrimSpace(*avatarURL)
		return &updatedUser, nil
	}
	changeAdminUsernameFn = func(_ context.Context, user *domain.AdminUser, username string) (*domain.AdminUser, error) {
		testassert.Equal(t, user.ID, "admin-1", "username change user")
		testassert.Equal(t, username, " next-admin ", "requested username")
		updatedUser := *adminUser
		updatedUser.Username = "next-admin"
		return &updatedUser, nil
	}
	requestAdminEmailChangeFn = func(_ context.Context, user *domain.AdminUser, newEmail, currentPassword, locale string) (*appservice.AdminEmailChangeRequestResult, error) {
		testassert.Equal(t, user.ID, "admin-1", "email change user")
		testassert.Equal(t, newEmail, "next@example.com", "new email")
		testassert.Equal(t, currentPassword, "password", "email change password")
		testassert.Equal(t, locale, "tr", "email change locale")
		return &appservice.AdminEmailChangeRequestResult{Success: true, PendingEmail: "next@example.com", ExpiresAt: now.Add(time.Hour)}, nil
	}
	deleteAdminAccountFn = func(_ context.Context, user *domain.AdminUser, currentPassword string) error {
		testassert.Equal(t, user.ID, "admin-1", "deleted account user")
		testassert.Equal(t, currentPassword, "password", "account deletion password")
		return nil
	}
	changeAdminPasswordFn = func(_ context.Context, user *domain.AdminUser, currentPassword, newPassword, confirmPassword string) error {
		testassert.Equal(t, user.ID, "admin-1", "password change user")
		testassert.Equal(t, currentPassword, "current", "current password")
		testassert.Equal(t, newPassword, "new-password", "new password")
		testassert.Equal(t, confirmPassword, "new-password", "password confirmation")
		return nil
	}
	revokeAdminSessionFn = func(_ context.Context, user *domain.AdminUser, sessionID string) (bool, error) {
		testassert.Equal(t, user.ID, "admin-1", "session revoke user")
		testassert.Equal(t, sessionID, "session-123", "revoked session")
		return true, nil
	}
	revokeAllAdminSessionsFn = func(_ context.Context, user *domain.AdminUser) error {
		testassert.Equal(t, user.ID, "admin-1", "revoke all sessions user")
		return nil
	}

	mutationResolver := &adminMutationResolver{Resolver: &Resolver{}}
	rememberMe := true
	loginResult, err := mutationResolver.Login(ctx, model.AdminLoginInput{
		Email:      " admin@example.com ",
		Password:   "password",
		RememberMe: &rememberMe,
	})
	testassert.NoError(t, err, "Login()")
	testassert.True(t, loginResult.Success, "Login should succeed")
	testassert.NotNil(t, loginResult.User, "Login user should be returned")
	testassert.Equal(t, loginResult.User.ID, "admin-1", "Login user ID")

	googleConnectResult, err := mutationResolver.StartGoogleConnect(authCtx, model.AdminStartGoogleConnectInput{Locale: localePtr(" tr ")})
	testassert.NoError(t, err, "StartGoogleConnect()")
	testassert.Equal(t, googleConnectResult.URL, "/api/oauth/connect?provider=google", "Google connect URL")

	googleDisconnectResult, err := mutationResolver.DisconnectGoogle(authCtx)
	testassert.NoError(t, err, "DisconnectGoogle()")
	testassert.True(t, googleDisconnectResult.Success, "Google disconnect should succeed")
	testassert.NotNil(t, googleDisconnectResult.User, "Google disconnect user should be returned")
	testassert.Equal(t, googleDisconnectResult.User.ID, "admin-1", "Google disconnect user ID")

	githubConnectResult, err := mutationResolver.StartGithubConnect(authCtx, model.AdminStartGithubConnectInput{Locale: localePtr(" tr ")})
	testassert.NoError(t, err, "StartGithubConnect()")
	testassert.Equal(t, githubConnectResult.URL, "/api/oauth/connect?provider=github", "GitHub connect URL")

	githubDisconnectResult, err := mutationResolver.DisconnectGithub(authCtx)
	testassert.NoError(t, err, "DisconnectGithub()")
	testassert.True(t, githubDisconnectResult.Success, "GitHub disconnect should succeed")
	testassert.NotNil(t, githubDisconnectResult.User, "GitHub disconnect user should be returned")
	testassert.Equal(t, githubDisconnectResult.User.ID, "admin-1", "GitHub disconnect user ID")

	refreshRequest := httptest.NewRequest(http.MethodPost, "/admin/graphql", nil)
	refreshRequest.RemoteAddr = "203.0.113.20:8080"
	refreshRequest.Header.Set("CF-IPCountry", "tr")
	refreshRequest.Header.Set("User-Agent", "Mozilla/5.0 Chrome/122 Windows NT 10.0")
	refreshRequest.AddCookie(&http.Cookie{Name: "admin_refresh", Value: "refresh-session"})
	refreshCtx := withRequestContext(traceCtx, refreshRequest, httptest.NewRecorder())
	refreshResult, err := mutationResolver.RefreshAdminSession(refreshCtx)
	testassert.NoError(t, err, "RefreshAdminSession()")
	testassert.True(t, refreshResult.Success, "RefreshAdminSession should succeed")
	testassert.NotNil(t, refreshResult.User, "refreshed admin user should be returned")
	testassert.Equal(t, refreshResult.User.ID, "admin-1", "refreshed admin user ID")

	logoutRequest := httptest.NewRequest(http.MethodPost, "/admin/graphql", nil)
	logoutRequest.AddCookie(&http.Cookie{Name: "admin_refresh", Value: "refresh-session"})
	logoutCtx := withRequestContext(context.Background(), logoutRequest, httptest.NewRecorder())
	logoutResult, err := mutationResolver.Logout(logoutCtx)
	testassert.NoError(t, err, "Logout()")
	testassert.True(t, logoutResult.Success, "Logout should succeed")

	requestPasswordResetResult, err := mutationResolver.RequestPasswordReset(ctx, model.AdminRequestPasswordResetInput{
		Email:  "admin@example.com",
		Locale: localePtr("tr"),
	})
	testassert.NoError(t, err, "RequestPasswordReset()")
	testassert.True(t, requestPasswordResetResult.Success, "password reset request should succeed")

	validatePasswordResetResult, err := (&adminQueryResolver{Resolver: &Resolver{}}).ValidatePasswordResetToken(
		ctx,
		" reset-token ",
		localePtr("tr"),
	)
	testassert.NoError(t, err, "ValidatePasswordResetToken()")
	testassert.Equal(t, validatePasswordResetResult.Status, "success", "password reset validation status")
	testassert.Equal(t, validatePasswordResetResult.Locale, "tr", "password reset validation locale")

	confirmPasswordResetResult, err := mutationResolver.ConfirmPasswordReset(ctx, model.AdminConfirmPasswordResetInput{
		Token:           " reset-token ",
		NewPassword:     "new-password",
		ConfirmPassword: "new-password",
		Locale:          localePtr("tr"),
	})
	testassert.NoError(t, err, "ConfirmPasswordReset()")
	testassert.True(t, confirmPasswordResetResult.Success, "password reset confirmation should succeed")
	testassert.Equal(t, confirmPasswordResetResult.Locale, "tr", "password reset confirmation locale")

	confirmEmailChangeResult, err := mutationResolver.ConfirmEmailChange(ctx, " confirm-token ", localePtr("tr"))
	testassert.NoError(t, err, "ConfirmEmailChange()")
	testassert.Equal(t, confirmEmailChangeResult.Status, "success", "email change confirmation status")
	testassert.Equal(t, confirmEmailChangeResult.Locale, "tr", "email change confirmation locale")

	changeNameResult, err := mutationResolver.ChangeName(authCtx, model.AdminChangeNameInput{Name: "Display Name"})
	testassert.NoError(t, err, "ChangeName()")
	testassert.NotNil(t, changeNameResult.User, "updated user should be returned")
	testassert.NotNil(t, changeNameResult.User.Name, "updated name should be returned")
	testassert.Equal(t, *changeNameResult.User.Name, "Display Name", "updated name")

	changeAvatarResult, err := mutationResolver.ChangeAvatar(authCtx, model.AdminChangeAvatarInput{AvatarURL: urlPtr(" /avatar.png ")})
	testassert.NoError(t, err, "ChangeAvatar()")
	testassert.NotNil(t, changeAvatarResult.User, "avatar update user should be returned")
	testassert.NotNil(t, changeAvatarResult.User.AvatarURL, "updated avatar URL should be returned")
	testassert.Equal(t, *changeAvatarResult.User.AvatarURL, "/avatar.png", "updated avatar URL")

	changeUsernameResult, err := mutationResolver.ChangeUsername(authCtx, model.AdminChangeUsernameInput{NewUsername: " next-admin "})
	testassert.NoError(t, err, "ChangeUsername()")
	testassert.NotNil(t, changeUsernameResult.User, "username update user should be returned")
	testassert.NotNil(t, changeUsernameResult.User.Username, "updated username should be returned")
	testassert.Equal(t, *changeUsernameResult.User.Username, "next-admin", "updated username")

	emailChangeResult, err := mutationResolver.RequestEmailChange(authCtx, model.AdminRequestEmailChangeInput{
		NewEmail:        "next@example.com",
		CurrentPassword: "password",
		Locale:          localePtr("tr"),
	})
	testassert.NoError(t, err, "RequestEmailChange()")
	testassert.True(t, emailChangeResult.Success, "email change request should succeed")
	testassert.Equal(t, emailChangeResult.PendingEmail, "next@example.com", "pending email")

	deleteAccountResult, err := mutationResolver.DeleteAccount(authCtx, model.AdminDeleteAccountInput{CurrentPassword: "password"})
	testassert.NoError(t, err, "DeleteAccount()")
	testassert.True(t, deleteAccountResult.Success, "account deletion should succeed")

	changePasswordResult, err := mutationResolver.ChangePassword(authCtx, model.AdminChangePasswordInput{
		CurrentPassword: "current",
		NewPassword:     "new-password",
		ConfirmPassword: "new-password",
	})
	testassert.NoError(t, err, "ChangePassword()")
	testassert.True(t, changePasswordResult.Success, "password change should succeed")

	currentSessionRequest := httptest.NewRequest(http.MethodPost, "/admin/graphql", nil)
	currentSessionRequest.AddCookie(&http.Cookie{Name: "admin_refresh", Value: issueAdminRefreshSessionTokenForTest(t, "session-123")})
	currentSessionCtx := withRequestContext(WithAdminUser(context.Background(), adminUser), currentSessionRequest, httptest.NewRecorder())
	revokeSessionResult, err := mutationResolver.RevokeSession(currentSessionCtx, "session-123")
	testassert.NoError(t, err, "RevokeSession()")
	testassert.True(t, revokeSessionResult.Success, "session revocation should succeed")

	revokeAllSessionsResult, err := mutationResolver.RevokeAllSessions(authCtx)
	testassert.NoError(t, err, "RevokeAllSessions()")
	testassert.True(t, revokeAllSessionsResult.Success, "all sessions should be revoked")

	cookies := strings.Join(recorder.Result().Header["Set-Cookie"], "\n")
	testassert.True(t, strings.Contains(cookies, "admin_access="), "access cookie should be written")
	testassert.True(t, strings.Contains(cookies, "admin_refresh="), "refresh cookie should be written")
}

func TestAdminMutationManagementResolvers(t *testing.T) {
	adminUser := &domain.AdminUser{
		ID:    "admin-1",
		Name:  "Admin",
		Email: "admin@example.com",
		Roles: []string{"admin"},
	}
	now := time.Date(2026, time.March, 22, 11, 0, 0, 0, time.UTC)

	originalUpdateAdminCommentStatusFn := updateAdminCommentStatusFn
	originalDeleteAdminCommentFn := deleteAdminCommentFn
	originalBulkUpdateAdminCommentStatusFn := bulkUpdateAdminCommentStatusFn
	originalBulkDeleteAdminCommentsFn := bulkDeleteAdminCommentsFn
	originalUpdateAdminNewsletterSubscriberStatusFn := updateAdminNewsletterSubscriberStatusFn
	originalDeleteAdminNewsletterSubscriberFn := deleteAdminNewsletterSubscriberFn
	originalTriggerAdminNewsletterDispatchFn := triggerAdminNewsletterDispatchFn
	originalSendAdminNewsletterTestEmailFn := sendAdminNewsletterTestEmailFn
	originalCreateAdminErrorMessageFn := createAdminErrorMessageFn
	originalUpdateAdminErrorMessageFn := updateAdminErrorMessageFn
	originalDeleteAdminErrorMessageFn := deleteAdminErrorMessageFn
	originalUpdateAdminContentPostMetadataFn := updateAdminContentPostMetadataFn
	originalUpdateAdminContentPostContentFn := updateAdminContentPostContentFn
	originalDeleteAdminContentPostFn := deleteAdminContentPostFn
	originalCreateAdminContentTopicFn := createAdminContentTopicFn
	originalUpdateAdminContentTopicFn := updateAdminContentTopicFn
	originalDeleteAdminContentTopicFn := deleteAdminContentTopicFn
	originalCreateAdminContentCategoryFn := createAdminContentCategoryFn
	originalUpdateAdminContentCategoryFn := updateAdminContentCategoryFn
	originalDeleteAdminContentCategoryFn := deleteAdminContentCategoryFn
	t.Cleanup(func() {
		updateAdminCommentStatusFn = originalUpdateAdminCommentStatusFn
		deleteAdminCommentFn = originalDeleteAdminCommentFn
		bulkUpdateAdminCommentStatusFn = originalBulkUpdateAdminCommentStatusFn
		bulkDeleteAdminCommentsFn = originalBulkDeleteAdminCommentsFn
		updateAdminNewsletterSubscriberStatusFn = originalUpdateAdminNewsletterSubscriberStatusFn
		deleteAdminNewsletterSubscriberFn = originalDeleteAdminNewsletterSubscriberFn
		triggerAdminNewsletterDispatchFn = originalTriggerAdminNewsletterDispatchFn
		sendAdminNewsletterTestEmailFn = originalSendAdminNewsletterTestEmailFn
		createAdminErrorMessageFn = originalCreateAdminErrorMessageFn
		updateAdminErrorMessageFn = originalUpdateAdminErrorMessageFn
		deleteAdminErrorMessageFn = originalDeleteAdminErrorMessageFn
		updateAdminContentPostMetadataFn = originalUpdateAdminContentPostMetadataFn
		updateAdminContentPostContentFn = originalUpdateAdminContentPostContentFn
		deleteAdminContentPostFn = originalDeleteAdminContentPostFn
		createAdminContentTopicFn = originalCreateAdminContentTopicFn
		updateAdminContentTopicFn = originalUpdateAdminContentTopicFn
		deleteAdminContentTopicFn = originalDeleteAdminContentTopicFn
		createAdminContentCategoryFn = originalCreateAdminContentCategoryFn
		updateAdminContentCategoryFn = originalUpdateAdminContentCategoryFn
		deleteAdminContentCategoryFn = originalDeleteAdminContentCategoryFn
	})

	updateAdminCommentStatusFn = func(_ context.Context, user *domain.AdminUser, commentID, status string) (*domain.CommentRecord, error) {
		testassert.Equal(t, user.ID, "admin-1", "comment update user")
		testassert.Equal(t, commentID, "comment-1", "comment ID")
		testassert.Equal(t, status, "approved", "comment status")
		return &domain.CommentRecord{ID: "comment-1", PostID: "post-1", AuthorName: "Reader", AuthorEmail: "reader@example.com", Content: "hello", Status: "approved", CreatedAt: now, UpdatedAt: now}, nil
	}
	deleteAdminCommentFn = func(_ context.Context, user *domain.AdminUser, commentID string) error {
		testassert.Equal(t, user.ID, "admin-1", "comment delete user")
		testassert.Equal(t, commentID, "comment-1", "deleted comment ID")
		return nil
	}
	bulkUpdateAdminCommentStatusFn = func(_ context.Context, user *domain.AdminUser, commentIDs []string, status string) (int, error) {
		testassert.Equal(t, user.ID, "admin-1", "bulk comment update user")
		testassert.Equal(t, status, "spam", "bulk comment status")
		testassert.Equal(t, len(commentIDs), 2, "bulk comment update count")
		testassert.Equal(t, commentIDs[0], "comment-1", "first updated comment")
		testassert.Equal(t, commentIDs[1], "comment-2", "second updated comment")
		return 2, nil
	}
	bulkDeleteAdminCommentsFn = func(_ context.Context, user *domain.AdminUser, commentIDs []string) (int, error) {
		testassert.Equal(t, user.ID, "admin-1", "bulk comment delete user")
		testassert.Equal(t, len(commentIDs), 2, "bulk comment delete count")
		testassert.Equal(t, commentIDs[0], "comment-1", "first deleted comment")
		testassert.Equal(t, commentIDs[1], "comment-2", "second deleted comment")
		return 2, nil
	}
	updateAdminNewsletterSubscriberStatusFn = func(_ context.Context, user *domain.AdminUser, email, status string) (*domain.AdminNewsletterSubscriberRecord, error) {
		testassert.Equal(t, user.ID, "admin-1", "subscriber update user")
		testassert.Equal(t, email, "reader@example.com", "subscriber email")
		testassert.Equal(t, status, "active", "subscriber status")
		return &domain.AdminNewsletterSubscriberRecord{Email: email, Locale: "tr", Status: status, UpdatedAt: now, CreatedAt: now}, nil
	}
	deleteAdminNewsletterSubscriberFn = func(_ context.Context, user *domain.AdminUser, email string) error {
		testassert.Equal(t, user.ID, "admin-1", "subscriber delete user")
		testassert.Equal(t, email, "reader@example.com", "deleted subscriber email")
		return nil
	}
	triggerAdminNewsletterDispatchFn = func(_ context.Context, user *domain.AdminUser) (*domain.AdminNewsletterDispatchResult, error) {
		testassert.Equal(t, user.ID, "admin-1", "newsletter dispatch user")
		return &domain.AdminNewsletterDispatchResult{Success: true, Message: "sent", Timestamp: now}, nil
	}
	sendAdminNewsletterTestEmailFn = func(_ context.Context, user *domain.AdminUser, email, locale, itemKey string) (*domain.AdminNewsletterTestSendResult, error) {
		testassert.Equal(t, user.ID, "admin-1", "test newsletter user")
		testassert.Equal(t, email, "reader@example.com", "test newsletter email")
		testassert.Equal(t, locale, "tr", "test newsletter locale")
		testassert.Equal(t, itemKey, "post:1", "test newsletter item")
		return &domain.AdminNewsletterTestSendResult{Success: true, Message: "queued", Timestamp: now, Email: email, Locale: locale, ItemKey: itemKey, PostTitle: "Alpha"}, nil
	}
	createAdminErrorMessageFn = func(_ context.Context, user *domain.AdminUser, key domain.AdminErrorMessageKey, message string) (*domain.AdminErrorMessageView, error) {
		testassert.Equal(t, user.ID, "admin-1", "error message create user")
		testassert.Equal(t, key.Scope, "admin", "created error scope")
		testassert.Equal(t, key.Locale, "tr", "created error locale")
		testassert.Equal(t, key.Code, "ERR_1", "created error code")
		testassert.Equal(t, message, "Created", "created error message")
		return &domain.AdminErrorMessageView{AdminErrorMessageKey: key, Message: message, UpdatedAt: now}, nil
	}
	updateAdminErrorMessageFn = func(_ context.Context, user *domain.AdminUser, key domain.AdminErrorMessageKey, message string) (*domain.AdminErrorMessageView, error) {
		testassert.Equal(t, user.ID, "admin-1", "error message update user")
		testassert.Equal(t, key.Scope, "admin", "updated error scope")
		testassert.Equal(t, key.Locale, "tr", "updated error locale")
		testassert.Equal(t, key.Code, "ERR_1", "updated error code")
		testassert.Equal(t, message, "Updated", "updated error message")
		return &domain.AdminErrorMessageView{AdminErrorMessageKey: key, Message: message, UpdatedAt: now}, nil
	}
	deleteAdminErrorMessageFn = func(_ context.Context, user *domain.AdminUser, key domain.AdminErrorMessageKey) error {
		testassert.Equal(t, user.ID, "admin-1", "error message delete user")
		testassert.Equal(t, key.Scope, "admin", "deleted error scope")
		testassert.Equal(t, key.Locale, "tr", "deleted error locale")
		testassert.Equal(t, key.Code, "ERR_1", "deleted error code")
		return nil
	}
	updateAdminContentPostMetadataFn = func(_ context.Context, user *domain.AdminUser, input domain.AdminContentPostMetadataInput) (*domain.AdminContentPostRecord, error) {
		testassert.Equal(t, user.ID, "admin-1", "metadata update user")
		testassert.Equal(t, input.Locale, "tr", "metadata update locale")
		testassert.Equal(t, input.ID, "post-1", "metadata update post ID")
		testassert.NotNil(t, input.Title, "metadata title should be provided")
		testassert.Equal(t, *input.Title, "Alpha", "metadata title")
		testassert.Equal(t, input.CategoryID, "category-1", "metadata category")
		testassert.Equal(t, len(input.TopicIDs), 2, "metadata topic count")
		testassert.Equal(t, input.TopicIDs[0], "topic-1", "first metadata topic")
		testassert.Equal(t, input.TopicIDs[1], "topic-2", "second metadata topic")
		return &domain.AdminContentPostRecord{Locale: input.Locale, ID: input.ID, Title: *input.Title, Source: "blog", PublishedDate: "2026-03-22"}, nil
	}
	updateAdminContentPostContentFn = func(_ context.Context, user *domain.AdminUser, input domain.AdminContentPostContentInput) (*domain.AdminContentPostRecord, error) {
		testassert.Equal(t, user.ID, "admin-1", "content update user")
		testassert.Equal(t, input.Locale, "tr", "content update locale")
		testassert.Equal(t, input.ID, "post-1", "content update post ID")
		testassert.Equal(t, input.Content, "Body", "content update body")
		return &domain.AdminContentPostRecord{Locale: input.Locale, ID: input.ID, Title: "Alpha", Content: input.Content, Source: "blog", PublishedDate: "2026-03-22"}, nil
	}
	deleteAdminContentPostFn = func(_ context.Context, user *domain.AdminUser, locale, id string) error {
		testassert.Equal(t, user.ID, "admin-1", "content post delete user")
		testassert.Equal(t, locale, "tr", "content post delete locale")
		testassert.Equal(t, id, "post-1", "deleted content post ID")
		return nil
	}
	createAdminContentTopicFn = func(_ context.Context, user *domain.AdminUser, input domain.AdminContentTopicInput) (*domain.AdminContentTopicRecord, error) {
		testassert.Equal(t, user.ID, "admin-1", "topic create user")
		testassert.Equal(t, input.Locale, "tr", "topic create locale")
		testassert.Equal(t, input.ID, "topic-1", "topic create ID")
		testassert.Equal(t, input.Name, "Alpha Topic", "topic create name")
		testassert.Equal(t, input.Color, "#fff", "topic create color")
		testassert.Equal(t, input.Link, "https://example.com/topic", "topic create link")
		return &domain.AdminContentTopicRecord{Locale: input.Locale, ID: input.ID, Name: input.Name, Color: input.Color, Link: input.Link, UpdatedAt: now}, nil
	}
	updateAdminContentTopicFn = func(_ context.Context, user *domain.AdminUser, input domain.AdminContentTopicInput) (*domain.AdminContentTopicRecord, error) {
		testassert.Equal(t, user.ID, "admin-1", "topic update user")
		testassert.Equal(t, input.Locale, "tr", "topic update locale")
		testassert.Equal(t, input.ID, "topic-1", "topic update ID")
		return &domain.AdminContentTopicRecord{Locale: input.Locale, ID: input.ID, Name: input.Name, Color: input.Color, Link: input.Link, UpdatedAt: now}, nil
	}
	deleteAdminContentTopicFn = func(_ context.Context, user *domain.AdminUser, locale, id string) error {
		testassert.Equal(t, user.ID, "admin-1", "topic delete user")
		testassert.Equal(t, locale, "tr", "topic delete locale")
		testassert.Equal(t, id, "topic-1", "deleted topic ID")
		return nil
	}
	createAdminContentCategoryFn = func(_ context.Context, user *domain.AdminUser, input domain.AdminContentCategoryInput) (*domain.AdminContentCategoryRecord, error) {
		testassert.Equal(t, user.ID, "admin-1", "category create user")
		testassert.Equal(t, input.Locale, "tr", "category create locale")
		testassert.Equal(t, input.ID, "category-1", "category create ID")
		testassert.Equal(t, input.Name, "Alpha Category", "category create name")
		testassert.Equal(t, input.Color, "#000", "category create color")
		testassert.Equal(t, input.Icon, "tag", "category create icon")
		testassert.Equal(t, input.Link, "https://example.com/category", "category create link")
		return &domain.AdminContentCategoryRecord{Locale: input.Locale, ID: input.ID, Name: input.Name, Color: input.Color, Icon: input.Icon, Link: input.Link, UpdatedAt: now}, nil
	}
	updateAdminContentCategoryFn = func(_ context.Context, user *domain.AdminUser, input domain.AdminContentCategoryInput) (*domain.AdminContentCategoryRecord, error) {
		testassert.Equal(t, user.ID, "admin-1", "category update user")
		testassert.Equal(t, input.Locale, "tr", "category update locale")
		testassert.Equal(t, input.ID, "category-1", "category update ID")
		return &domain.AdminContentCategoryRecord{Locale: input.Locale, ID: input.ID, Name: input.Name, Color: input.Color, Icon: input.Icon, Link: input.Link, UpdatedAt: now}, nil
	}
	deleteAdminContentCategoryFn = func(_ context.Context, user *domain.AdminUser, locale, id string) error {
		testassert.Equal(t, user.ID, "admin-1", "category delete user")
		testassert.Equal(t, locale, "tr", "category delete locale")
		testassert.Equal(t, id, "category-1", "deleted category ID")
		return nil
	}

	ctx := WithAdminUser(context.Background(), adminUser)
	mutationResolver := &adminMutationResolver{Resolver: &Resolver{}}

	commentResult, err := mutationResolver.UpdateCommentStatus(ctx, model.AdminUpdateCommentStatusInput{CommentID: " comment-1 ", Status: model.AdminCommentStatusApproved})
	testassert.NoError(t, err, "UpdateCommentStatus()")
	testassert.NotNil(t, commentResult, "updated comment should be returned")
	testassert.Equal(t, commentResult.Status, model.AdminCommentStatusApproved, "updated comment status")

	deleteCommentResult, err := mutationResolver.DeleteComment(ctx, model.AdminDeleteCommentInput{CommentID: " comment-1 "})
	testassert.NoError(t, err, "DeleteComment()")
	testassert.True(t, deleteCommentResult.Success, "comment deletion should succeed")

	bulkUpdateResult, err := mutationResolver.BulkUpdateCommentStatus(ctx, model.AdminBulkUpdateCommentStatusInput{
		CommentIds: []string{" comment-1 ", "comment-2 "},
		Status:     model.AdminCommentStatusSpam,
	})
	testassert.NoError(t, err, "BulkUpdateCommentStatus()")
	testassert.Equal(t, bulkUpdateResult.SuccessCount, 2, "updated comment count")

	bulkDeleteResult, err := mutationResolver.BulkDeleteComments(ctx, model.AdminBulkDeleteCommentsInput{
		CommentIds: []string{" comment-1 ", "comment-2 "},
	})
	testassert.NoError(t, err, "BulkDeleteComments()")
	testassert.Equal(t, bulkDeleteResult.SuccessCount, 2, "deleted comment count")

	subscriberResult, err := mutationResolver.UpdateNewsletterSubscriberStatus(ctx, model.AdminUpdateNewsletterSubscriberStatusInput{
		Email:  "reader@example.com",
		Status: model.AdminNewsletterSubscriberStatusActive,
	})
	testassert.NoError(t, err, "UpdateNewsletterSubscriberStatus()")
	testassert.NotNil(t, subscriberResult, "updated subscriber should be returned")
	testassert.Equal(t, subscriberResult.Status, model.AdminNewsletterSubscriberStatusActive, "subscriber status")

	deleteSubscriberResult, err := mutationResolver.DeleteNewsletterSubscriber(ctx, model.AdminDeleteNewsletterSubscriberInput{Email: "reader@example.com"})
	testassert.NoError(t, err, "DeleteNewsletterSubscriber()")
	testassert.True(t, deleteSubscriberResult.Success, "subscriber deletion should succeed")

	dispatchResult, err := mutationResolver.TriggerNewsletterDispatch(ctx)
	testassert.NoError(t, err, "TriggerNewsletterDispatch()")
	testassert.True(t, dispatchResult.Success, "newsletter dispatch should succeed")
	testassert.Equal(t, dispatchResult.Message, "sent", "dispatch message")

	testNewsletterResult, err := mutationResolver.SendTestNewsletter(ctx, model.AdminSendTestNewsletterInput{
		Email:   "reader@example.com",
		Locale:  "tr",
		ItemKey: "post:1",
	})
	testassert.NoError(t, err, "SendTestNewsletter()")
	testassert.True(t, testNewsletterResult.Success, "test newsletter should succeed")
	testassert.NotNil(t, testNewsletterResult.PostTitle, "test newsletter title should be returned")
	testassert.Equal(t, *testNewsletterResult.PostTitle, "Alpha", "test newsletter post title")

	errorKey := &model.AdminErrorMessageKeyInput{Scope: stringPtr(" admin "), Locale: " tr ", Code: " ERR_1 "}
	createErrorResult, err := mutationResolver.CreateErrorMessage(ctx, model.AdminCreateErrorMessageInput{Key: errorKey, Message: "Created"})
	testassert.NoError(t, err, "CreateErrorMessage()")
	testassert.NotNil(t, createErrorResult, "created error message should be returned")
	testassert.Equal(t, createErrorResult.Code, "ERR_1", "created error message code")

	updateErrorResult, err := mutationResolver.UpdateErrorMessage(ctx, model.AdminUpdateErrorMessageInput{Key: errorKey, Message: "Updated"})
	testassert.NoError(t, err, "UpdateErrorMessage()")
	testassert.NotNil(t, updateErrorResult, "updated error message should be returned")
	testassert.Equal(t, updateErrorResult.Message, "Updated", "updated error message")

	deleteErrorResult, err := mutationResolver.DeleteErrorMessage(ctx, model.AdminErrorMessageKeyInput{Scope: stringPtr(" admin "), Locale: " tr ", Code: " ERR_1 "})
	testassert.NoError(t, err, "DeleteErrorMessage()")
	testassert.True(t, deleteErrorResult.Success, "error message deletion should succeed")

	postTitle := " Alpha "
	postSummary := " Summary "
	postThumbnail := " /thumb.png "
	postCategoryID := " category-1 "
	updateMetadataResult, err := mutationResolver.UpdateContentPostMetadata(ctx, model.AdminUpdateContentPostMetadataInput{
		Locale:        " tr ",
		ID:            " post-1 ",
		Title:         &postTitle,
		Summary:       &postSummary,
		Thumbnail:     &postThumbnail,
		PublishedDate: datePtr(" 2026-03-22 "),
		UpdatedDate:   datePtr(" 2026-03-23 "),
		CategoryID:    &postCategoryID,
		TopicIds:      []string{" topic-1 ", " ", "topic-2"},
	})
	testassert.NoError(t, err, "UpdateContentPostMetadata()")
	testassert.NotNil(t, updateMetadataResult, "updated post metadata should be returned")
	testassert.Equal(t, updateMetadataResult.ID, "post-1", "updated post metadata ID")

	updateContentResult, err := mutationResolver.UpdateContentPostContent(ctx, model.AdminUpdateContentPostContentInput{
		Locale:  " tr ",
		ID:      " post-1 ",
		Content: "Body",
	})
	testassert.NoError(t, err, "UpdateContentPostContent()")
	testassert.NotNil(t, updateContentResult, "updated post content should be returned")
	testassert.NotNil(t, updateContentResult.Content, "updated content body should be returned")
	testassert.Equal(t, *updateContentResult.Content, "Body", "updated content body")

	deleteContentPostResult, err := mutationResolver.DeleteContentPost(ctx, model.AdminContentEntityKeyInput{Locale: " tr ", ID: " post-1 "})
	testassert.NoError(t, err, "DeleteContentPost()")
	testassert.True(t, deleteContentPostResult.Success, "content post deletion should succeed")

	createTopicResult, err := mutationResolver.CreateContentTopic(ctx, model.AdminContentTopicInput{
		Locale: " tr ",
		ID:     " topic-1 ",
		Name:   " Alpha Topic ",
		Color:  " #fff ",
		Link:   urlPtr(" https://example.com/topic "),
	})
	testassert.NoError(t, err, "CreateContentTopic()")
	testassert.NotNil(t, createTopicResult, "created topic should be returned")
	testassert.Equal(t, createTopicResult.ID, "topic-1", "created topic ID")

	updateTopicResult, err := mutationResolver.UpdateContentTopic(ctx, model.AdminContentTopicInput{
		Locale: " tr ",
		ID:     " topic-1 ",
		Name:   " Alpha Topic ",
		Color:  " #fff ",
		Link:   urlPtr(" https://example.com/topic "),
	})
	testassert.NoError(t, err, "UpdateContentTopic()")
	testassert.NotNil(t, updateTopicResult, "updated topic should be returned")
	testassert.Equal(t, updateTopicResult.ID, "topic-1", "updated topic ID")

	deleteTopicResult, err := mutationResolver.DeleteContentTopic(ctx, model.AdminContentEntityKeyInput{Locale: " tr ", ID: " topic-1 "})
	testassert.NoError(t, err, "DeleteContentTopic()")
	testassert.True(t, deleteTopicResult.Success, "topic deletion should succeed")

	categoryIcon := " tag "
	createCategoryResult, err := mutationResolver.CreateContentCategory(ctx, model.AdminContentCategoryInput{
		Locale: " tr ",
		ID:     " category-1 ",
		Name:   " Alpha Category ",
		Color:  " #000 ",
		Icon:   &categoryIcon,
		Link:   urlPtr(" https://example.com/category "),
	})
	testassert.NoError(t, err, "CreateContentCategory()")
	testassert.NotNil(t, createCategoryResult, "created category should be returned")
	testassert.Equal(t, createCategoryResult.ID, "category-1", "created category ID")

	updateCategoryResult, err := mutationResolver.UpdateContentCategory(ctx, model.AdminContentCategoryInput{
		Locale: " tr ",
		ID:     " category-1 ",
		Name:   " Alpha Category ",
		Color:  " #000 ",
		Icon:   &categoryIcon,
		Link:   urlPtr(" https://example.com/category "),
	})
	testassert.NoError(t, err, "UpdateContentCategory()")
	testassert.NotNil(t, updateCategoryResult, "updated category should be returned")
	testassert.Equal(t, updateCategoryResult.ID, "category-1", "updated category ID")

	deleteCategoryResult, err := mutationResolver.DeleteContentCategory(ctx, model.AdminContentEntityKeyInput{Locale: " tr ", ID: " category-1 "})
	testassert.NoError(t, err, "DeleteContentCategory()")
	testassert.True(t, deleteCategoryResult.Success, "category deletion should succeed")
}

func issueAdminRefreshSessionTokenForTest(t *testing.T, sessionID string) string {
	t.Helper()

	token, err := httpauth.IssueHS256JWT(httpauth.JWTClaims{
		ID:        sessionID,
		Subject:   "admin-1",
		Type:      "refresh",
		IssuedAt:  time.Now().Add(-time.Minute).Unix(),
		ExpiresAt: time.Now().Add(time.Hour).Unix(),
	}, "test-secret")
	if err != nil {
		t.Fatalf("IssueHS256JWT returned error: %v", err)
	}

	return token
}

func stringPtr(value string) *string {
	return &value
}

func localePtr(value string) *appscalars.Locale {
	resolved := appscalars.Locale(value)
	return &resolved
}

func urlPtr(value string) *appscalars.URL {
	resolved := appscalars.URL(value)
	return &resolved
}

func datePtr(value string) *appscalars.Date {
	resolved := appscalars.Date(value)
	return &resolved
}
