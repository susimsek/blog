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
	parentID := "parent-1"
	scope := " admin "
	link := " https://example.com/topic "
	icon := " tag "

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
		Link:   &link,
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
		Link:   &link,
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
	locale := " tr "
	preferredLocale := " en "
	source := " medium "
	categoryID := " category-1 "
	topicID := " topic-1 "
	campaignStatus := " sent "
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
		if user.ID != "admin-1" || filter.Status != "approved" || filter.PostID != "post-1" || filter.Query != "alpha" || filter.Page == nil || *filter.Page != 2 || filter.Size == nil || *filter.Size != 15 {
			t.Fatalf("unexpected comment filter: %#v", filter)
		}
		return &domain.AdminCommentListResult{
			Items: []domain.CommentRecord{{ID: "comment-1", PostID: "post-1", AuthorName: "Reader", AuthorEmail: "reader@example.com", Content: "hello", Status: "approved", CreatedAt: now, UpdatedAt: now}},
			Total: 1,
			Page:  2,
			Size:  15,
		}, nil
	}
	listActiveAdminSessionsFn = func(_ context.Context, user *domain.AdminUser) ([]domain.AdminSessionRecord, error) {
		if user.ID != "admin-1" {
			t.Fatalf("unexpected session user: %#v", user)
		}
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
		if user.ID != "admin-1" || filter.Locale != "tr" || filter.Status != "active" || filter.Query != "alpha" || filter.Page == nil || *filter.Page != 2 || filter.Size == nil || *filter.Size != 15 {
			t.Fatalf("unexpected subscriber filter: %#v", filter)
		}
		return &domain.AdminNewsletterSubscriberListResult{
			Items: []domain.AdminNewsletterSubscriberRecord{{Email: "reader@example.com", Locale: "tr", Status: "active", UpdatedAt: now, CreatedAt: now}},
			Total: 1,
			Page:  2,
			Size:  15,
		}, nil
	}
	listAdminNewsletterCampaignsFn = func(_ context.Context, user *domain.AdminUser, filter domain.AdminNewsletterCampaignFilter) (*domain.AdminNewsletterCampaignListResult, error) {
		if user.ID != "admin-1" || filter.Locale != "tr" || filter.Status != "sent" || filter.Query != "alpha" || filter.Page == nil || *filter.Page != 2 || filter.Size == nil || *filter.Size != 15 {
			t.Fatalf("unexpected campaign filter: %#v", filter)
		}
		return &domain.AdminNewsletterCampaignListResult{
			Items: []domain.AdminNewsletterCampaignRecord{{Locale: "tr", ItemKey: "post:1", Title: "Alpha", Status: "sent", UpdatedAt: now, CreatedAt: now, LastRunAt: now}},
			Total: 1,
			Page:  2,
			Size:  15,
		}, nil
	}
	listAdminNewsletterDeliveryFailuresFn = func(_ context.Context, user *domain.AdminUser, filter domain.AdminNewsletterDeliveryFailureFilter) (*domain.AdminNewsletterDeliveryFailureListResult, error) {
		if user.ID != "admin-1" || filter.Locale != "tr" || filter.ItemKey != "alpha-item" || filter.Page == nil || *filter.Page != 2 || filter.Size == nil || *filter.Size != 15 {
			t.Fatalf("unexpected failure filter: %#v", filter)
		}
		return &domain.AdminNewsletterDeliveryFailureListResult{
			Items: []domain.AdminNewsletterDeliveryFailureRecord{{Locale: "tr", ItemKey: "alpha-item", Email: "reader@example.com", Status: "failed", LastAttemptAt: now, UpdatedAt: now, CreatedAt: now}},
			Total: 1,
			Page:  2,
			Size:  15,
		}, nil
	}
	listAdminErrorMessagesFn = func(_ context.Context, user *domain.AdminUser, filter domain.AdminErrorMessageFilter) (*domain.AdminErrorMessageListResult, error) {
		if user.ID != "admin-1" || filter.Locale != "tr" || filter.Code != "ERR_1" || filter.Query != "alpha" || filter.Page == nil || *filter.Page != 2 || filter.Size == nil || *filter.Size != 15 {
			t.Fatalf("unexpected error message filter: %#v", filter)
		}
		return &domain.AdminErrorMessageListResult{
			Items: []domain.AdminErrorMessageView{{AdminErrorMessageKey: domain.AdminErrorMessageKey{Scope: "admin", Locale: "tr", Code: "ERR_1"}, Message: "Error", UpdatedAt: now}},
			Total: 1,
			Page:  2,
			Size:  15,
		}, nil
	}
	listAdminContentPostsFn = func(_ context.Context, user *domain.AdminUser, filter domain.AdminContentPostFilter) (*domain.AdminContentPostListResult, error) {
		if user.ID != "admin-1" || filter.Locale != "tr" || filter.PreferredLocale != "en" || filter.Source != "medium" || filter.Query != "alpha" || filter.CategoryID != "category-1" || filter.TopicID != "topic-1" || filter.Page == nil || *filter.Page != 2 || filter.Size == nil || *filter.Size != 15 {
			t.Fatalf("unexpected content post filter: %#v", filter)
		}
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
		if user.ID != "admin-1" || contentLocale != "tr" || id != "post-1" {
			t.Fatalf("unexpected content entity key: %q %q", contentLocale, id)
		}
		return &domain.AdminContentPostRecord{Locale: "tr", ID: "post-1", Title: "Alpha", Source: "blog", PublishedDate: "2026-03-22"}, nil
	}
	listAdminContentTopicsPageFn = func(_ context.Context, user *domain.AdminUser, filter domain.AdminContentTaxonomyFilter) (*domain.AdminContentTopicListResult, error) {
		if user.ID != "admin-1" || filter.Locale != "tr" || filter.PreferredLocale != "en" || filter.Query != "alpha" || filter.Page == nil || *filter.Page != 2 || filter.Size == nil || *filter.Size != 15 {
			t.Fatalf("unexpected topic page filter: %#v", filter)
		}
		return &domain.AdminContentTopicListResult{
			Items: []domain.AdminContentTopicGroupRecord{{ID: "topic-1", Preferred: domain.AdminContentTopicRecord{Locale: "en", ID: "topic-1", Name: "Alpha", Color: "#fff", UpdatedAt: now}}},
			Total: 1,
			Page:  2,
			Size:  15,
		}, nil
	}
	listAdminContentCategoriesPageFn = func(_ context.Context, user *domain.AdminUser, filter domain.AdminContentTaxonomyFilter) (*domain.AdminContentCategoryListResult, error) {
		if user.ID != "admin-1" || filter.Locale != "tr" || filter.PreferredLocale != "en" || filter.Query != "alpha" || filter.Page == nil || *filter.Page != 2 || filter.Size == nil || *filter.Size != 15 {
			t.Fatalf("unexpected category page filter: %#v", filter)
		}
		return &domain.AdminContentCategoryListResult{
			Items: []domain.AdminContentCategoryGroupRecord{{ID: "category-1", Preferred: domain.AdminContentCategoryRecord{Locale: "en", ID: "category-1", Name: "Alpha", Color: "#000", UpdatedAt: now}}},
			Total: 1,
			Page:  2,
			Size:  15,
		}, nil
	}
	listAdminContentTopicsFn = func(_ context.Context, user *domain.AdminUser, contentLocale, text string) ([]domain.AdminContentTopicRecord, error) {
		if user.ID != "admin-1" || contentLocale != "tr" || text != "alpha" {
			t.Fatalf("unexpected topics lookup: %q %q", contentLocale, text)
		}
		return []domain.AdminContentTopicRecord{{Locale: "tr", ID: "topic-1", Name: "Alpha", Color: "#fff", UpdatedAt: now}}, nil
	}
	listAdminContentCategoriesFn = func(_ context.Context, user *domain.AdminUser, contentLocale string) ([]domain.AdminContentCategoryRecord, error) {
		if user.ID != "admin-1" || contentLocale != "tr" {
			t.Fatalf("unexpected categories lookup: %q", contentLocale)
		}
		return []domain.AdminContentCategoryRecord{{Locale: "tr", ID: "category-1", Name: "Alpha", Color: "#000", UpdatedAt: now}}, nil
	}
	listAdminErrorMessageAuditLogsFn = func(_ context.Context, user *domain.AdminUser, limit int) ([]domain.AdminAuditLogRecord, error) {
		if user.ID != "admin-1" || limit != 5 {
			t.Fatalf("unexpected audit log limit: %d", limit)
		}
		return []domain.AdminAuditLogRecord{{ID: "audit-1", ActorID: "admin-1", ActorEmail: "admin@example.com", Action: "updated", Scope: "admin", Locale: "tr", Code: "ERR_1", Status: "success", CreatedAt: now}}, nil
	}

	request := httptest.NewRequest(http.MethodPost, "/admin/graphql", nil)
	request.AddCookie(&http.Cookie{Name: "admin_refresh", Value: issueAdminRefreshSessionTokenForTest(t, "session-123")})
	ctx := withRequestContext(WithAdminUser(context.Background(), adminUser), request, httptest.NewRecorder())
	queryResolver := &adminQueryResolver{Resolver: &Resolver{}}

	googleStatus, err := queryResolver.GoogleAuthStatus(ctx)
	if err != nil || !googleStatus.Enabled || !googleStatus.LoginAvailable {
		t.Fatalf("GoogleAuthStatus() = %#v, %v", googleStatus, err)
	}

	githubStatus, err := queryResolver.GithubAuthStatus(ctx)
	if err != nil || !githubStatus.Enabled || githubStatus.LoginAvailable {
		t.Fatalf("GithubAuthStatus() = %#v, %v", githubStatus, err)
	}

	dashboard, err := queryResolver.Dashboard(ctx)
	if err != nil || dashboard.TotalPosts != 7 || dashboard.TotalSubscribers != 11 {
		t.Fatalf("Dashboard() = %#v, %v", dashboard, err)
	}

	commentList, err := queryResolver.Comments(ctx, &model.AdminCommentFilterInput{
		Status: &commentStatus,
		PostID: &postID,
		Query:  &query,
		Page:   &page,
		Size:   &size,
	})
	if err != nil || commentList.Total != 1 || len(commentList.Items) != 1 {
		t.Fatalf("Comments() = %#v, %v", commentList, err)
	}

	sessions, err := queryResolver.ActiveSessions(ctx)
	if err != nil || len(sessions) != 1 || !sessions[0].Current {
		t.Fatalf("ActiveSessions() = %#v, %v", sessions, err)
	}

	subscriberList, err := queryResolver.NewsletterSubscribers(ctx, &model.AdminNewsletterSubscriberFilterInput{
		Locale: &locale,
		Status: &subscriberStatus,
		Query:  &query,
		Page:   &page,
		Size:   &size,
	})
	if err != nil || subscriberList.Total != 1 || len(subscriberList.Items) != 1 {
		t.Fatalf("NewsletterSubscribers() = %#v, %v", subscriberList, err)
	}

	campaignList, err := queryResolver.NewsletterCampaigns(ctx, &model.AdminNewsletterCampaignFilterInput{
		Locale: &locale,
		Status: &campaignStatus,
		Query:  &query,
		Page:   &page,
		Size:   &size,
	})
	if err != nil || campaignList.Total != 1 || len(campaignList.Items) != 1 {
		t.Fatalf("NewsletterCampaigns() = %#v, %v", campaignList, err)
	}

	failureList, err := queryResolver.NewsletterCampaignFailures(ctx, model.AdminNewsletterDeliveryFailureFilterInput{
		Locale:  locale,
		ItemKey: " alpha-item ",
		Page:    &page,
		Size:    &size,
	})
	if err != nil || failureList.Total != 1 || len(failureList.Items) != 1 {
		t.Fatalf("NewsletterCampaignFailures() = %#v, %v", failureList, err)
	}

	errorList, err := queryResolver.ErrorMessages(ctx, &model.AdminErrorMessageFilterInput{
		Locale: &locale,
		Code:   &errorCode,
		Query:  &query,
		Page:   &page,
		Size:   &size,
	})
	if err != nil || errorList.Total != 1 || len(errorList.Items) != 1 {
		t.Fatalf("ErrorMessages() = %#v, %v", errorList, err)
	}

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
	if err != nil || postList.Total != 1 || len(postList.Items) != 1 {
		t.Fatalf("ContentPosts() = %#v, %v", postList, err)
	}

	post, err := queryResolver.ContentPost(ctx, model.AdminContentEntityKeyInput{Locale: locale, ID: postID})
	if err != nil || post == nil || post.ID != "post-1" {
		t.Fatalf("ContentPost() = %#v, %v", post, err)
	}

	topicPage, err := queryResolver.ContentTopicsPage(ctx, &model.AdminContentTaxonomyFilterInput{
		Locale:          &locale,
		PreferredLocale: &preferredLocale,
		Query:           &query,
		Page:            &page,
		Size:            &size,
	})
	if err != nil || topicPage.Total != 1 || len(topicPage.Items) != 1 {
		t.Fatalf("ContentTopicsPage() = %#v, %v", topicPage, err)
	}

	categoryPage, err := queryResolver.ContentCategoriesPage(ctx, &model.AdminContentTaxonomyFilterInput{
		Locale:          &locale,
		PreferredLocale: &preferredLocale,
		Query:           &query,
		Page:            &page,
		Size:            &size,
	})
	if err != nil || categoryPage.Total != 1 || len(categoryPage.Items) != 1 {
		t.Fatalf("ContentCategoriesPage() = %#v, %v", categoryPage, err)
	}

	topics, err := queryResolver.ContentTopics(ctx, &locale, &query)
	if err != nil || len(topics) != 1 || topics[0].ID != "topic-1" {
		t.Fatalf("ContentTopics() = %#v, %v", topics, err)
	}

	categories, err := queryResolver.ContentCategories(ctx, &locale)
	if err != nil || len(categories) != 1 || categories[0].ID != "category-1" {
		t.Fatalf("ContentCategories() = %#v, %v", categories, err)
	}

	limit := 5
	auditLogs, err := queryResolver.ErrorMessageAuditLogs(ctx, &limit)
	if err != nil || len(auditLogs) != 1 || auditLogs[0].ID != "audit-1" {
		t.Fatalf("ErrorMessageAuditLogs() = %#v, %v", auditLogs, err)
	}
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
		if email != "admin@example.com" || password != "password" || !rememberMe || metadata.RemoteIP != "203.0.113.20" || metadata.CountryCode != "TR" {
			t.Fatalf("unexpected login call: %q %q %t %#v", email, password, rememberMe, metadata)
		}
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
		if user.ID != "admin-1" || locale != " tr " {
			t.Fatalf("unexpected google connect input: %q %#v", locale, user)
		}
		return &appservice.AdminGoogleConnectResult{URL: "/api/google/connect"}, nil
	}
	disconnectAdminGoogleAccountFn = func(_ context.Context, user *domain.AdminUser) (*domain.AdminUser, error) {
		if user.ID != "admin-1" {
			t.Fatalf("unexpected google disconnect user: %#v", user)
		}
		return &domain.AdminUser{ID: "admin-1", Email: "admin@example.com"}, nil
	}
	startAdminGithubConnectFn = func(_ context.Context, user *domain.AdminUser, locale string) (*appservice.AdminGithubConnectResult, error) {
		if user.ID != "admin-1" || locale != " tr " {
			t.Fatalf("unexpected github connect input: %q %#v", locale, user)
		}
		return &appservice.AdminGithubConnectResult{URL: "/api/github/connect"}, nil
	}
	disconnectAdminGithubAccountFn = func(_ context.Context, user *domain.AdminUser) (*domain.AdminUser, error) {
		if user.ID != "admin-1" {
			t.Fatalf("unexpected github disconnect user: %#v", user)
		}
		return &domain.AdminUser{ID: "admin-1", Email: "admin@example.com"}, nil
	}
	refreshAdminSessionFn = func(_ context.Context, token string, metadata appservice.AdminSessionMetadata) (*appservice.AdminAuthResponse, error) {
		if token != "refresh-session" || metadata.RemoteIP != "203.0.113.20" || metadata.CountryCode != "TR" {
			t.Fatalf("unexpected refresh input: %q %#v", token, metadata)
		}
		return &appservice.AdminAuthResponse{
			Success:      true,
			User:         adminUser,
			AccessToken:  "refreshed-access-token",
			RefreshToken: "rotated-refresh-token",
			RememberMe:   false,
		}, nil
	}
	logoutAdminFn = func(_ context.Context, token string) error {
		if token != "refresh-session" {
			t.Fatalf("unexpected logout token: %q", token)
		}
		return nil
	}
	changeAdminNameFn = func(_ context.Context, user *domain.AdminUser, name string) (*domain.AdminUser, error) {
		if user.ID != "admin-1" || name != "Display Name" {
			t.Fatalf("unexpected change name input: %q %#v", name, user)
		}
		updatedUser := *adminUser
		updatedUser.Name = name
		return &updatedUser, nil
	}
	changeAdminAvatarFn = func(_ context.Context, user *domain.AdminUser, avatarURL *string) (*domain.AdminUser, error) {
		if user.ID != "admin-1" || avatarURL == nil || *avatarURL != " /avatar.png " {
			t.Fatalf("unexpected change avatar input: %#v %#v", avatarURL, user)
		}
		updatedUser := *adminUser
		updatedUser.AvatarURL = strings.TrimSpace(*avatarURL)
		return &updatedUser, nil
	}
	changeAdminUsernameFn = func(_ context.Context, user *domain.AdminUser, username string) (*domain.AdminUser, error) {
		if user.ID != "admin-1" || username != " next-admin " {
			t.Fatalf("unexpected change username input: %q %#v", username, user)
		}
		updatedUser := *adminUser
		updatedUser.Username = "next-admin"
		return &updatedUser, nil
	}
	requestAdminEmailChangeFn = func(_ context.Context, user *domain.AdminUser, newEmail, currentPassword, locale string) (*appservice.AdminEmailChangeRequestResult, error) {
		if user.ID != "admin-1" || newEmail != "next@example.com" || currentPassword != "password" || locale != "tr" {
			t.Fatalf("unexpected email change request input: %q %q %q", newEmail, currentPassword, locale)
		}
		return &appservice.AdminEmailChangeRequestResult{Success: true, PendingEmail: "next@example.com", ExpiresAt: now.Add(time.Hour)}, nil
	}
	deleteAdminAccountFn = func(_ context.Context, user *domain.AdminUser, currentPassword string) error {
		if user.ID != "admin-1" || currentPassword != "password" {
			t.Fatalf("unexpected delete account input: %q %#v", currentPassword, user)
		}
		return nil
	}
	changeAdminPasswordFn = func(_ context.Context, user *domain.AdminUser, currentPassword, newPassword, confirmPassword string) error {
		if user.ID != "admin-1" || currentPassword != "current" || newPassword != "new-password" || confirmPassword != "new-password" {
			t.Fatalf("unexpected change password input: %q %q %q", currentPassword, newPassword, confirmPassword)
		}
		return nil
	}
	revokeAdminSessionFn = func(_ context.Context, user *domain.AdminUser, sessionID string) (bool, error) {
		if user.ID != "admin-1" || sessionID != "session-123" {
			t.Fatalf("unexpected revoke session input: %q %#v", sessionID, user)
		}
		return true, nil
	}
	revokeAllAdminSessionsFn = func(_ context.Context, user *domain.AdminUser) error {
		if user.ID != "admin-1" {
			t.Fatalf("unexpected revoke all user: %#v", user)
		}
		return nil
	}

	mutationResolver := &adminMutationResolver{Resolver: &Resolver{}}
	rememberMe := true
	loginResult, err := mutationResolver.Login(ctx, model.AdminLoginInput{
		Email:      " admin@example.com ",
		Password:   "password",
		RememberMe: &rememberMe,
	})
	if err != nil || !loginResult.Success || loginResult.User == nil || loginResult.User.ID != "admin-1" {
		t.Fatalf("Login() = %#v, %v", loginResult, err)
	}

	googleConnectResult, err := mutationResolver.StartGoogleConnect(authCtx, model.AdminStartGoogleConnectInput{Locale: stringPtr(" tr ")})
	if err != nil || googleConnectResult.URL != "/api/google/connect" {
		t.Fatalf("StartGoogleConnect() = %#v, %v", googleConnectResult, err)
	}

	googleDisconnectResult, err := mutationResolver.DisconnectGoogle(authCtx)
	if err != nil || !googleDisconnectResult.Success || googleDisconnectResult.User == nil || googleDisconnectResult.User.ID != "admin-1" {
		t.Fatalf("DisconnectGoogle() = %#v, %v", googleDisconnectResult, err)
	}

	githubConnectResult, err := mutationResolver.StartGithubConnect(authCtx, model.AdminStartGithubConnectInput{Locale: stringPtr(" tr ")})
	if err != nil || githubConnectResult.URL != "/api/github/connect" {
		t.Fatalf("StartGithubConnect() = %#v, %v", githubConnectResult, err)
	}

	githubDisconnectResult, err := mutationResolver.DisconnectGithub(authCtx)
	if err != nil || !githubDisconnectResult.Success || githubDisconnectResult.User == nil || githubDisconnectResult.User.ID != "admin-1" {
		t.Fatalf("DisconnectGithub() = %#v, %v", githubDisconnectResult, err)
	}

	refreshRequest := httptest.NewRequest(http.MethodPost, "/admin/graphql", nil)
	refreshRequest.RemoteAddr = "203.0.113.20:8080"
	refreshRequest.Header.Set("CF-IPCountry", "tr")
	refreshRequest.Header.Set("User-Agent", "Mozilla/5.0 Chrome/122 Windows NT 10.0")
	refreshRequest.AddCookie(&http.Cookie{Name: "admin_refresh", Value: "refresh-session"})
	refreshCtx := withRequestContext(traceCtx, refreshRequest, httptest.NewRecorder())
	refreshResult, err := mutationResolver.RefreshAdminSession(refreshCtx)
	if err != nil || !refreshResult.Success || refreshResult.User == nil || refreshResult.User.ID != "admin-1" {
		t.Fatalf("RefreshAdminSession() = %#v, %v", refreshResult, err)
	}

	logoutRequest := httptest.NewRequest(http.MethodPost, "/admin/graphql", nil)
	logoutRequest.AddCookie(&http.Cookie{Name: "admin_refresh", Value: "refresh-session"})
	logoutCtx := withRequestContext(context.Background(), logoutRequest, httptest.NewRecorder())
	logoutResult, err := mutationResolver.Logout(logoutCtx)
	if err != nil || !logoutResult.Success {
		t.Fatalf("Logout() = %#v, %v", logoutResult, err)
	}

	changeNameResult, err := mutationResolver.ChangeName(authCtx, model.AdminChangeNameInput{Name: "Display Name"})
	if err != nil || changeNameResult.User == nil || changeNameResult.User.Name == nil || *changeNameResult.User.Name != "Display Name" {
		t.Fatalf("ChangeName() = %#v, %v", changeNameResult, err)
	}

	changeAvatarResult, err := mutationResolver.ChangeAvatar(authCtx, model.AdminChangeAvatarInput{AvatarURL: stringPtr(" /avatar.png ")})
	if err != nil || changeAvatarResult.User == nil || changeAvatarResult.User.AvatarURL == nil || *changeAvatarResult.User.AvatarURL != "/avatar.png" {
		t.Fatalf("ChangeAvatar() = %#v, %v", changeAvatarResult, err)
	}

	changeUsernameResult, err := mutationResolver.ChangeUsername(authCtx, model.AdminChangeUsernameInput{NewUsername: " next-admin "})
	if err != nil || changeUsernameResult.User == nil || changeUsernameResult.User.Username == nil || *changeUsernameResult.User.Username != "next-admin" {
		t.Fatalf("ChangeUsername() = %#v, %v", changeUsernameResult, err)
	}

	emailChangeResult, err := mutationResolver.RequestEmailChange(authCtx, model.AdminRequestEmailChangeInput{
		NewEmail:        "next@example.com",
		CurrentPassword: "password",
		Locale:          stringPtr("tr"),
	})
	if err != nil || !emailChangeResult.Success || emailChangeResult.PendingEmail != "next@example.com" {
		t.Fatalf("RequestEmailChange() = %#v, %v", emailChangeResult, err)
	}

	deleteAccountResult, err := mutationResolver.DeleteAccount(authCtx, model.AdminDeleteAccountInput{CurrentPassword: "password"})
	if err != nil || !deleteAccountResult.Success {
		t.Fatalf("DeleteAccount() = %#v, %v", deleteAccountResult, err)
	}

	changePasswordResult, err := mutationResolver.ChangePassword(authCtx, model.AdminChangePasswordInput{
		CurrentPassword: "current",
		NewPassword:     "new-password",
		ConfirmPassword: "new-password",
	})
	if err != nil || !changePasswordResult.Success {
		t.Fatalf("ChangePassword() = %#v, %v", changePasswordResult, err)
	}

	currentSessionRequest := httptest.NewRequest(http.MethodPost, "/admin/graphql", nil)
	currentSessionRequest.AddCookie(&http.Cookie{Name: "admin_refresh", Value: issueAdminRefreshSessionTokenForTest(t, "session-123")})
	currentSessionCtx := withRequestContext(WithAdminUser(context.Background(), adminUser), currentSessionRequest, httptest.NewRecorder())
	revokeSessionResult, err := mutationResolver.RevokeSession(currentSessionCtx, "session-123")
	if err != nil || !revokeSessionResult.Success {
		t.Fatalf("RevokeSession() = %#v, %v", revokeSessionResult, err)
	}

	revokeAllSessionsResult, err := mutationResolver.RevokeAllSessions(authCtx)
	if err != nil || !revokeAllSessionsResult.Success {
		t.Fatalf("RevokeAllSessions() = %#v, %v", revokeAllSessionsResult, err)
	}

	cookies := strings.Join(recorder.Result().Header["Set-Cookie"], "\n")
	if !strings.Contains(cookies, "admin_access=") || !strings.Contains(cookies, "admin_refresh=") {
		t.Fatalf("expected admin cookies to be written, got %s", cookies)
	}
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
		if user.ID != "admin-1" || commentID != "comment-1" || status != "approved" {
			t.Fatalf("unexpected update comment status input: %q %q", commentID, status)
		}
		return &domain.CommentRecord{ID: "comment-1", PostID: "post-1", AuthorName: "Reader", AuthorEmail: "reader@example.com", Content: "hello", Status: "approved", CreatedAt: now, UpdatedAt: now}, nil
	}
	deleteAdminCommentFn = func(_ context.Context, user *domain.AdminUser, commentID string) error {
		if user.ID != "admin-1" || commentID != "comment-1" {
			t.Fatalf("unexpected delete comment input: %q", commentID)
		}
		return nil
	}
	bulkUpdateAdminCommentStatusFn = func(_ context.Context, user *domain.AdminUser, commentIDs []string, status string) (int, error) {
		if user.ID != "admin-1" || status != "spam" || len(commentIDs) != 2 || commentIDs[0] != "comment-1" || commentIDs[1] != "comment-2" {
			t.Fatalf("unexpected bulk update input: %#v %q", commentIDs, status)
		}
		return 2, nil
	}
	bulkDeleteAdminCommentsFn = func(_ context.Context, user *domain.AdminUser, commentIDs []string) (int, error) {
		if user.ID != "admin-1" || len(commentIDs) != 2 || commentIDs[0] != "comment-1" || commentIDs[1] != "comment-2" {
			t.Fatalf("unexpected bulk delete input: %#v", commentIDs)
		}
		return 2, nil
	}
	updateAdminNewsletterSubscriberStatusFn = func(_ context.Context, user *domain.AdminUser, email, status string) (*domain.AdminNewsletterSubscriberRecord, error) {
		if user.ID != "admin-1" || email != "reader@example.com" || status != "active" {
			t.Fatalf("unexpected update subscriber input: %q %q", email, status)
		}
		return &domain.AdminNewsletterSubscriberRecord{Email: email, Locale: "tr", Status: status, UpdatedAt: now, CreatedAt: now}, nil
	}
	deleteAdminNewsletterSubscriberFn = func(_ context.Context, user *domain.AdminUser, email string) error {
		if user.ID != "admin-1" || email != "reader@example.com" {
			t.Fatalf("unexpected delete subscriber input: %q", email)
		}
		return nil
	}
	triggerAdminNewsletterDispatchFn = func(_ context.Context, user *domain.AdminUser) (*domain.AdminNewsletterDispatchResult, error) {
		if user.ID != "admin-1" {
			t.Fatalf("unexpected dispatch user: %#v", user)
		}
		return &domain.AdminNewsletterDispatchResult{Success: true, Message: "sent", Timestamp: now}, nil
	}
	sendAdminNewsletterTestEmailFn = func(_ context.Context, user *domain.AdminUser, email, locale, itemKey string) (*domain.AdminNewsletterTestSendResult, error) {
		if user.ID != "admin-1" || email != "reader@example.com" || locale != "tr" || itemKey != "post:1" {
			t.Fatalf("unexpected test send input: %q %q %q", email, locale, itemKey)
		}
		return &domain.AdminNewsletterTestSendResult{Success: true, Message: "queued", Timestamp: now, Email: email, Locale: locale, ItemKey: itemKey, PostTitle: "Alpha"}, nil
	}
	createAdminErrorMessageFn = func(_ context.Context, user *domain.AdminUser, key domain.AdminErrorMessageKey, message string) (*domain.AdminErrorMessageView, error) {
		if user.ID != "admin-1" || key.Scope != "admin" || key.Locale != "tr" || key.Code != "ERR_1" || message != "Created" {
			t.Fatalf("unexpected create error message input: %#v %q", key, message)
		}
		return &domain.AdminErrorMessageView{AdminErrorMessageKey: key, Message: message, UpdatedAt: now}, nil
	}
	updateAdminErrorMessageFn = func(_ context.Context, user *domain.AdminUser, key domain.AdminErrorMessageKey, message string) (*domain.AdminErrorMessageView, error) {
		if user.ID != "admin-1" || key.Scope != "admin" || key.Locale != "tr" || key.Code != "ERR_1" || message != "Updated" {
			t.Fatalf("unexpected update error message input: %#v %q", key, message)
		}
		return &domain.AdminErrorMessageView{AdminErrorMessageKey: key, Message: message, UpdatedAt: now}, nil
	}
	deleteAdminErrorMessageFn = func(_ context.Context, user *domain.AdminUser, key domain.AdminErrorMessageKey) error {
		if user.ID != "admin-1" || key.Scope != "admin" || key.Locale != "tr" || key.Code != "ERR_1" {
			t.Fatalf("unexpected delete error key: %#v", key)
		}
		return nil
	}
	updateAdminContentPostMetadataFn = func(_ context.Context, user *domain.AdminUser, input domain.AdminContentPostMetadataInput) (*domain.AdminContentPostRecord, error) {
		if user.ID != "admin-1" || input.Locale != "tr" || input.ID != "post-1" || input.Title == nil || *input.Title != "Alpha" || input.CategoryID != "category-1" || len(input.TopicIDs) != 2 || input.TopicIDs[0] != "topic-1" || input.TopicIDs[1] != "topic-2" {
			t.Fatalf("unexpected content metadata input: %#v", input)
		}
		return &domain.AdminContentPostRecord{Locale: input.Locale, ID: input.ID, Title: *input.Title, Source: "blog", PublishedDate: "2026-03-22"}, nil
	}
	updateAdminContentPostContentFn = func(_ context.Context, user *domain.AdminUser, input domain.AdminContentPostContentInput) (*domain.AdminContentPostRecord, error) {
		if user.ID != "admin-1" || input.Locale != "tr" || input.ID != "post-1" || input.Content != "Body" {
			t.Fatalf("unexpected content body input: %#v", input)
		}
		return &domain.AdminContentPostRecord{Locale: input.Locale, ID: input.ID, Title: "Alpha", Content: input.Content, Source: "blog", PublishedDate: "2026-03-22"}, nil
	}
	deleteAdminContentPostFn = func(_ context.Context, user *domain.AdminUser, locale, id string) error {
		if user.ID != "admin-1" || locale != "tr" || id != "post-1" {
			t.Fatalf("unexpected delete content post input: %q %q", locale, id)
		}
		return nil
	}
	createAdminContentTopicFn = func(_ context.Context, user *domain.AdminUser, input domain.AdminContentTopicInput) (*domain.AdminContentTopicRecord, error) {
		if user.ID != "admin-1" || input.Locale != "tr" || input.ID != "topic-1" || input.Name != "Alpha Topic" || input.Color != "#fff" || input.Link != "https://example.com/topic" {
			t.Fatalf("unexpected create topic input: %#v", input)
		}
		return &domain.AdminContentTopicRecord{Locale: input.Locale, ID: input.ID, Name: input.Name, Color: input.Color, Link: input.Link, UpdatedAt: now}, nil
	}
	updateAdminContentTopicFn = func(_ context.Context, user *domain.AdminUser, input domain.AdminContentTopicInput) (*domain.AdminContentTopicRecord, error) {
		if user.ID != "admin-1" || input.Locale != "tr" || input.ID != "topic-1" {
			t.Fatalf("unexpected update topic input: %#v", input)
		}
		return &domain.AdminContentTopicRecord{Locale: input.Locale, ID: input.ID, Name: input.Name, Color: input.Color, Link: input.Link, UpdatedAt: now}, nil
	}
	deleteAdminContentTopicFn = func(_ context.Context, user *domain.AdminUser, locale, id string) error {
		if user.ID != "admin-1" || locale != "tr" || id != "topic-1" {
			t.Fatalf("unexpected delete topic input: %q %q", locale, id)
		}
		return nil
	}
	createAdminContentCategoryFn = func(_ context.Context, user *domain.AdminUser, input domain.AdminContentCategoryInput) (*domain.AdminContentCategoryRecord, error) {
		if user.ID != "admin-1" || input.Locale != "tr" || input.ID != "category-1" || input.Name != "Alpha Category" || input.Color != "#000" || input.Icon != "tag" || input.Link != "https://example.com/category" {
			t.Fatalf("unexpected create category input: %#v", input)
		}
		return &domain.AdminContentCategoryRecord{Locale: input.Locale, ID: input.ID, Name: input.Name, Color: input.Color, Icon: input.Icon, Link: input.Link, UpdatedAt: now}, nil
	}
	updateAdminContentCategoryFn = func(_ context.Context, user *domain.AdminUser, input domain.AdminContentCategoryInput) (*domain.AdminContentCategoryRecord, error) {
		if user.ID != "admin-1" || input.Locale != "tr" || input.ID != "category-1" {
			t.Fatalf("unexpected update category input: %#v", input)
		}
		return &domain.AdminContentCategoryRecord{Locale: input.Locale, ID: input.ID, Name: input.Name, Color: input.Color, Icon: input.Icon, Link: input.Link, UpdatedAt: now}, nil
	}
	deleteAdminContentCategoryFn = func(_ context.Context, user *domain.AdminUser, locale, id string) error {
		if user.ID != "admin-1" || locale != "tr" || id != "category-1" {
			t.Fatalf("unexpected delete category input: %q %q", locale, id)
		}
		return nil
	}

	ctx := WithAdminUser(context.Background(), adminUser)
	mutationResolver := &adminMutationResolver{Resolver: &Resolver{}}

	commentResult, err := mutationResolver.UpdateCommentStatus(ctx, model.AdminUpdateCommentStatusInput{CommentID: " comment-1 ", Status: model.AdminCommentStatusApproved})
	if err != nil || commentResult == nil || commentResult.Status != model.AdminCommentStatusApproved {
		t.Fatalf("UpdateCommentStatus() = %#v, %v", commentResult, err)
	}

	deleteCommentResult, err := mutationResolver.DeleteComment(ctx, model.AdminDeleteCommentInput{CommentID: " comment-1 "})
	if err != nil || !deleteCommentResult.Success {
		t.Fatalf("DeleteComment() = %#v, %v", deleteCommentResult, err)
	}

	bulkUpdateResult, err := mutationResolver.BulkUpdateCommentStatus(ctx, model.AdminBulkUpdateCommentStatusInput{
		CommentIds: []string{" comment-1 ", "comment-2 "},
		Status:     model.AdminCommentStatusSpam,
	})
	if err != nil || bulkUpdateResult.SuccessCount != 2 {
		t.Fatalf("BulkUpdateCommentStatus() = %#v, %v", bulkUpdateResult, err)
	}

	bulkDeleteResult, err := mutationResolver.BulkDeleteComments(ctx, model.AdminBulkDeleteCommentsInput{
		CommentIds: []string{" comment-1 ", "comment-2 "},
	})
	if err != nil || bulkDeleteResult.SuccessCount != 2 {
		t.Fatalf("BulkDeleteComments() = %#v, %v", bulkDeleteResult, err)
	}

	subscriberResult, err := mutationResolver.UpdateNewsletterSubscriberStatus(ctx, model.AdminUpdateNewsletterSubscriberStatusInput{
		Email:  "reader@example.com",
		Status: model.AdminNewsletterSubscriberStatusActive,
	})
	if err != nil || subscriberResult == nil || subscriberResult.Status != model.AdminNewsletterSubscriberStatusActive {
		t.Fatalf("UpdateNewsletterSubscriberStatus() = %#v, %v", subscriberResult, err)
	}

	deleteSubscriberResult, err := mutationResolver.DeleteNewsletterSubscriber(ctx, model.AdminDeleteNewsletterSubscriberInput{Email: "reader@example.com"})
	if err != nil || !deleteSubscriberResult.Success {
		t.Fatalf("DeleteNewsletterSubscriber() = %#v, %v", deleteSubscriberResult, err)
	}

	dispatchResult, err := mutationResolver.TriggerNewsletterDispatch(ctx)
	if err != nil || !dispatchResult.Success || dispatchResult.Message != "sent" {
		t.Fatalf("TriggerNewsletterDispatch() = %#v, %v", dispatchResult, err)
	}

	testNewsletterResult, err := mutationResolver.SendTestNewsletter(ctx, model.AdminSendTestNewsletterInput{
		Email:   "reader@example.com",
		Locale:  "tr",
		ItemKey: "post:1",
	})
	if err != nil || !testNewsletterResult.Success || testNewsletterResult.PostTitle == nil || *testNewsletterResult.PostTitle != "Alpha" {
		t.Fatalf("SendTestNewsletter() = %#v, %v", testNewsletterResult, err)
	}

	errorKey := &model.AdminErrorMessageKeyInput{Scope: stringPtr(" admin "), Locale: " tr ", Code: " ERR_1 "}
	createErrorResult, err := mutationResolver.CreateErrorMessage(ctx, model.AdminCreateErrorMessageInput{Key: errorKey, Message: "Created"})
	if err != nil || createErrorResult == nil || createErrorResult.Code != "ERR_1" {
		t.Fatalf("CreateErrorMessage() = %#v, %v", createErrorResult, err)
	}

	updateErrorResult, err := mutationResolver.UpdateErrorMessage(ctx, model.AdminUpdateErrorMessageInput{Key: errorKey, Message: "Updated"})
	if err != nil || updateErrorResult == nil || updateErrorResult.Message != "Updated" {
		t.Fatalf("UpdateErrorMessage() = %#v, %v", updateErrorResult, err)
	}

	deleteErrorResult, err := mutationResolver.DeleteErrorMessage(ctx, model.AdminErrorMessageKeyInput{Scope: stringPtr(" admin "), Locale: " tr ", Code: " ERR_1 "})
	if err != nil || !deleteErrorResult.Success {
		t.Fatalf("DeleteErrorMessage() = %#v, %v", deleteErrorResult, err)
	}

	postTitle := " Alpha "
	postSummary := " Summary "
	postThumbnail := " /thumb.png "
	publishedDate := " 2026-03-22 "
	updatedDate := " 2026-03-23 "
	postCategoryID := " category-1 "
	updateMetadataResult, err := mutationResolver.UpdateContentPostMetadata(ctx, model.AdminUpdateContentPostMetadataInput{
		Locale:        " tr ",
		ID:            " post-1 ",
		Title:         &postTitle,
		Summary:       &postSummary,
		Thumbnail:     &postThumbnail,
		PublishedDate: &publishedDate,
		UpdatedDate:   &updatedDate,
		CategoryID:    &postCategoryID,
		TopicIds:      []string{" topic-1 ", " ", "topic-2"},
	})
	if err != nil || updateMetadataResult == nil || updateMetadataResult.ID != "post-1" {
		t.Fatalf("UpdateContentPostMetadata() = %#v, %v", updateMetadataResult, err)
	}

	updateContentResult, err := mutationResolver.UpdateContentPostContent(ctx, model.AdminUpdateContentPostContentInput{
		Locale:  " tr ",
		ID:      " post-1 ",
		Content: "Body",
	})
	if err != nil || updateContentResult == nil || updateContentResult.Content == nil || *updateContentResult.Content != "Body" {
		t.Fatalf("UpdateContentPostContent() = %#v, %v", updateContentResult, err)
	}

	deleteContentPostResult, err := mutationResolver.DeleteContentPost(ctx, model.AdminContentEntityKeyInput{Locale: " tr ", ID: " post-1 "})
	if err != nil || !deleteContentPostResult.Success {
		t.Fatalf("DeleteContentPost() = %#v, %v", deleteContentPostResult, err)
	}

	topicLink := " https://example.com/topic "
	createTopicResult, err := mutationResolver.CreateContentTopic(ctx, model.AdminContentTopicInput{
		Locale: " tr ",
		ID:     " topic-1 ",
		Name:   " Alpha Topic ",
		Color:  " #fff ",
		Link:   &topicLink,
	})
	if err != nil || createTopicResult == nil || createTopicResult.ID != "topic-1" {
		t.Fatalf("CreateContentTopic() = %#v, %v", createTopicResult, err)
	}

	updateTopicResult, err := mutationResolver.UpdateContentTopic(ctx, model.AdminContentTopicInput{
		Locale: " tr ",
		ID:     " topic-1 ",
		Name:   " Alpha Topic ",
		Color:  " #fff ",
		Link:   &topicLink,
	})
	if err != nil || updateTopicResult == nil || updateTopicResult.ID != "topic-1" {
		t.Fatalf("UpdateContentTopic() = %#v, %v", updateTopicResult, err)
	}

	deleteTopicResult, err := mutationResolver.DeleteContentTopic(ctx, model.AdminContentEntityKeyInput{Locale: " tr ", ID: " topic-1 "})
	if err != nil || !deleteTopicResult.Success {
		t.Fatalf("DeleteContentTopic() = %#v, %v", deleteTopicResult, err)
	}

	categoryIcon := " tag "
	categoryLink := " https://example.com/category "
	createCategoryResult, err := mutationResolver.CreateContentCategory(ctx, model.AdminContentCategoryInput{
		Locale: " tr ",
		ID:     " category-1 ",
		Name:   " Alpha Category ",
		Color:  " #000 ",
		Icon:   &categoryIcon,
		Link:   &categoryLink,
	})
	if err != nil || createCategoryResult == nil || createCategoryResult.ID != "category-1" {
		t.Fatalf("CreateContentCategory() = %#v, %v", createCategoryResult, err)
	}

	updateCategoryResult, err := mutationResolver.UpdateContentCategory(ctx, model.AdminContentCategoryInput{
		Locale: " tr ",
		ID:     " category-1 ",
		Name:   " Alpha Category ",
		Color:  " #000 ",
		Icon:   &categoryIcon,
		Link:   &categoryLink,
	})
	if err != nil || updateCategoryResult == nil || updateCategoryResult.ID != "category-1" {
		t.Fatalf("UpdateContentCategory() = %#v, %v", updateCategoryResult, err)
	}

	deleteCategoryResult, err := mutationResolver.DeleteContentCategory(ctx, model.AdminContentEntityKeyInput{Locale: " tr ", ID: " category-1 "})
	if err != nil || !deleteCategoryResult.Success {
		t.Fatalf("DeleteContentCategory() = %#v, %v", deleteCategoryResult, err)
	}
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
