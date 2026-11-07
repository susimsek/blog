package service

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	appconfig "suaybsimsek.com/blog-api/internal/config"
	"suaybsimsek.com/blog-api/internal/domain"
	"suaybsimsek.com/blog-api/internal/repository"
	"suaybsimsek.com/blog-api/internal/testassert"
)

type adminNewsletterManagementStubRepository struct {
	items        []domain.AdminNewsletterSubscriberRecord
	campaigns    []domain.AdminNewsletterCampaignRecord
	failures     []domain.AdminNewsletterDeliveryFailureRecord
	listErr      error
	campaignsErr error
	failuresErr  error
	updateErr    error
	deleteErr    error
}

func (stub *adminNewsletterManagementStubRepository) ListSubscribers(
	_ context.Context,
	filter domain.AdminNewsletterSubscriberFilter,
	page int,
	size int,
) (*domain.AdminNewsletterSubscriberListResult, error) {
	if stub.listErr != nil {
		return nil, stub.listErr
	}

	filtered := make([]domain.AdminNewsletterSubscriberRecord, 0, len(stub.items))
	for _, item := range stub.items {
		if filter.Locale != "" && item.Locale != filter.Locale {
			continue
		}
		if filter.Status != "" && item.Status != filter.Status {
			continue
		}
		filtered = append(filtered, item)
	}

	return &domain.AdminNewsletterSubscriberListResult{
		Items: filtered,
		Total: len(filtered),
		Page:  page,
		Size:  size,
	}, nil
}

func (stub *adminNewsletterManagementStubRepository) ListCampaigns(
	_ context.Context,
	filter domain.AdminNewsletterCampaignFilter,
	page int,
	size int,
) (*domain.AdminNewsletterCampaignListResult, error) {
	if stub.campaignsErr != nil {
		return nil, stub.campaignsErr
	}

	filtered := make([]domain.AdminNewsletterCampaignRecord, 0, len(stub.campaigns))
	for _, item := range stub.campaigns {
		if filter.Locale != "" && item.Locale != filter.Locale {
			continue
		}
		if filter.Status != "" && item.Status != filter.Status {
			continue
		}
		filtered = append(filtered, item)
	}

	return &domain.AdminNewsletterCampaignListResult{
		Items: filtered,
		Total: len(filtered),
		Page:  page,
		Size:  size,
	}, nil
}

func (stub *adminNewsletterManagementStubRepository) ListDeliveryFailures(
	_ context.Context,
	filter domain.AdminNewsletterDeliveryFailureFilter,
	page int,
	size int,
) (*domain.AdminNewsletterDeliveryFailureListResult, error) {
	if stub.failuresErr != nil {
		return nil, stub.failuresErr
	}

	filtered := make([]domain.AdminNewsletterDeliveryFailureRecord, 0, len(stub.failures))
	for _, item := range stub.failures {
		if filter.Locale != "" && item.Locale != filter.Locale {
			continue
		}
		if filter.ItemKey != "" && item.ItemKey != filter.ItemKey {
			continue
		}
		filtered = append(filtered, item)
	}

	return &domain.AdminNewsletterDeliveryFailureListResult{
		Items: filtered,
		Total: len(filtered),
		Page:  page,
		Size:  size,
	}, nil
}

func (stub *adminNewsletterManagementStubRepository) UpdateSubscriberStatusByEmail(
	_ context.Context,
	email string,
	status string,
	now time.Time,
) (*domain.AdminNewsletterSubscriberRecord, error) {
	if stub.updateErr != nil {
		return nil, stub.updateErr
	}

	for index, item := range stub.items {
		if item.Email != email {
			continue
		}
		item.Status = status
		item.UpdatedAt = now
		stub.items[index] = item
		return &item, nil
	}

	return nil, repository.ErrAdminNewsletterSubscriberNotFound
}

func (stub *adminNewsletterManagementStubRepository) DeleteSubscriberByEmail(
	_ context.Context,
	email string,
) (bool, error) {
	if stub.deleteErr != nil {
		return false, stub.deleteErr
	}

	next := make([]domain.AdminNewsletterSubscriberRecord, 0, len(stub.items))
	deleted := false
	for _, item := range stub.items {
		if item.Email == email {
			deleted = true
			continue
		}
		next = append(next, item)
	}
	stub.items = next

	return deleted, nil
}

func TestListAdminNewsletterSubscribersFiltersByLocaleAndStatus(t *testing.T) {
	previousRepo := adminNewsletterRepository
	t.Cleanup(func() {
		adminNewsletterRepository = previousRepo
	})

	adminNewsletterRepository = &adminNewsletterManagementStubRepository{
		items: []domain.AdminNewsletterSubscriberRecord{
			{Email: "active-en@example.com", Locale: "en", Status: adminNewsletterStatusActive},
			{Email: "pending-en@example.com", Locale: "en", Status: adminNewsletterStatusPending},
			{Email: "active-tr@example.com", Locale: "tr", Status: adminNewsletterStatusActive},
		},
	}

	page := 1
	size := 10
	result, err := ListAdminNewsletterSubscribers(
		context.Background(),
		&domain.AdminUser{ID: "admin-1"},
		domain.AdminNewsletterSubscriberFilter{
			Locale: "en",
			Status: adminNewsletterStatusActive,
			Page:   &page,
			Size:   &size,
		},
	)
	if err != nil {
		t.Fatalf("ListAdminNewsletterSubscribers returned error: %v", err)
	}

	if result.Total != 1 {
		t.Fatalf("expected total 1, got %d", result.Total)
	}
	if len(result.Items) != 1 {
		t.Fatalf("expected 1 item, got %d", len(result.Items))
	}
	if result.Items[0].Email != "active-en@example.com" {
		t.Fatalf("unexpected subscriber: %s", result.Items[0].Email)
	}
}

func TestUpdateAdminNewsletterSubscriberStatusUpdatesRecord(t *testing.T) {
	previousRepo := adminNewsletterRepository
	t.Cleanup(func() {
		adminNewsletterRepository = previousRepo
	})

	adminNewsletterRepository = &adminNewsletterManagementStubRepository{
		items: []domain.AdminNewsletterSubscriberRecord{
			{Email: "member@example.com", Locale: "en", Status: adminNewsletterStatusPending},
		},
	}

	updated, err := UpdateAdminNewsletterSubscriberStatus(
		context.Background(),
		&domain.AdminUser{ID: "admin-1"},
		"member@example.com",
		adminNewsletterStatusActive,
	)
	if err != nil {
		t.Fatalf("UpdateAdminNewsletterSubscriberStatus returned error: %v", err)
	}

	if updated == nil || updated.Status != adminNewsletterStatusActive {
		t.Fatalf("expected updated status %q, got %#v", adminNewsletterStatusActive, updated)
	}
}

func TestListAdminNewsletterCampaignsFiltersByLocale(t *testing.T) {
	previousRepo := adminNewsletterRepository
	t.Cleanup(func() {
		adminNewsletterRepository = previousRepo
	})

	adminNewsletterRepository = &adminNewsletterManagementStubRepository{
		campaigns: []domain.AdminNewsletterCampaignRecord{
			{Locale: "en", ItemKey: "en-post", Title: "English post", Status: "sent"},
			{Locale: "tr", ItemKey: "tr-post", Title: "Turkish post", Status: "partial"},
		},
	}

	page := 1
	size := 5
	result, err := ListAdminNewsletterCampaigns(
		context.Background(),
		&domain.AdminUser{ID: "admin-1"},
		domain.AdminNewsletterCampaignFilter{
			Locale: "tr",
			Page:   &page,
			Size:   &size,
		},
	)
	if err != nil {
		t.Fatalf("ListAdminNewsletterCampaigns returned error: %v", err)
	}

	if result.Total != 1 {
		t.Fatalf("expected total 1, got %d", result.Total)
	}
	if len(result.Items) != 1 || result.Items[0].ItemKey != "tr-post" {
		t.Fatalf("unexpected campaign payload: %#v", result.Items)
	}
}

func TestListAdminNewsletterDeliveryFailuresRequiresCampaignIdentity(t *testing.T) {
	previousRepo := adminNewsletterRepository
	t.Cleanup(func() {
		adminNewsletterRepository = previousRepo
	})

	adminNewsletterRepository = &adminNewsletterManagementStubRepository{}

	_, err := ListAdminNewsletterDeliveryFailures(
		context.Background(),
		&domain.AdminUser{ID: "admin-1"},
		domain.AdminNewsletterDeliveryFailureFilter{},
	)
	if err == nil {
		t.Fatal("expected error")
	}
}

func TestDeleteAdminNewsletterSubscriberReturnsBadRequestWhenMissing(t *testing.T) {
	previousRepo := adminNewsletterRepository
	t.Cleanup(func() {
		adminNewsletterRepository = previousRepo
	})

	adminNewsletterRepository = &adminNewsletterManagementStubRepository{
		items: []domain.AdminNewsletterSubscriberRecord{},
	}

	err := DeleteAdminNewsletterSubscriber(context.Background(), &domain.AdminUser{ID: "admin-1"}, "missing@example.com")
	if err == nil {
		t.Fatal("expected error")
	}
}

func TestListAdminNewsletterSubscribersReturnsServiceUnavailable(t *testing.T) {
	previousRepo := adminNewsletterRepository
	t.Cleanup(func() {
		adminNewsletterRepository = previousRepo
	})

	adminNewsletterRepository = &adminNewsletterManagementStubRepository{
		listErr: repository.ErrAdminNewsletterRepositoryUnavailable,
	}

	_, err := ListAdminNewsletterSubscribers(
		context.Background(),
		&domain.AdminUser{ID: "admin-1"},
		domain.AdminNewsletterSubscriberFilter{},
	)
	if err == nil {
		t.Fatal("expected error")
	}
}

func TestUpdateAdminNewsletterSubscriberStatusReturnsInternalOnRepoError(t *testing.T) {
	previousRepo := adminNewsletterRepository
	t.Cleanup(func() {
		adminNewsletterRepository = previousRepo
	})

	adminNewsletterRepository = &adminNewsletterManagementStubRepository{
		updateErr: errors.New("db down"),
	}

	_, err := UpdateAdminNewsletterSubscriberStatus(
		context.Background(),
		&domain.AdminUser{ID: "admin-1"},
		"member@example.com",
		adminNewsletterStatusActive,
	)
	if err == nil {
		t.Fatal("expected error")
	}
}

func TestTriggerAdminNewsletterDispatchParsesAndSortsResults(t *testing.T) {
	previousClient := adminNewsletterDispatchClient
	t.Cleanup(func() {
		adminNewsletterDispatchClient = previousClient
	})

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/api/newsletter-dispatch" {
			t.Fatalf("unexpected request path: %s", r.URL.Path)
		}
		if r.Header.Get("Authorization") != "Bearer cron-secret" {
			t.Fatalf("unexpected authorization header: %q", r.Header.Get("Authorization"))
		}
		if _, err := w.Write([]byte(`{
			"status":"ok",
			"message":" completed ",
			"timestamp":"2026-03-21T10:30:00Z",
			"locales":{
				"tr":{"rssUrl":"https://example.com/tr.xml","itemKey":"post:beta","postTitle":"Beta","sentCount":2,"failedCount":1,"skipped":false,"reason":"queued"},
				"en":{"rssUrl":"https://example.com/en.xml","itemKey":"post:alpha","postTitle":"Alpha","sentCount":4,"failedCount":0,"skipped":false,"reason":"done"}
			}
		}`)); err != nil {
			t.Fatalf("Write returned error: %v", err)
		}
	}))
	defer server.Close()

	adminNewsletterDispatchClient = server.Client()
	t.Setenv("SITE_URL", server.URL)
	t.Setenv("CRON_SECRET", "cron-secret")
	t.Setenv("NEWSLETTER_UNSUBSCRIBE_SECRET", "unsubscribe-secret")

	result, err := TriggerAdminNewsletterDispatch(context.Background(), &domain.AdminUser{ID: "admin-1"})
	if err != nil {
		t.Fatalf("TriggerAdminNewsletterDispatch returned error: %v", err)
	}
	if result == nil || !result.Success || result.Message != "completed" || result.Timestamp.Format(time.RFC3339) != "2026-03-21T10:30:00Z" {
		t.Fatalf("unexpected dispatch result: %#v", result)
	}
	if len(result.Results) != 2 || result.Results[0].Locale != "en" || result.Results[1].Locale != "tr" {
		t.Fatalf("expected sorted locale results, got %#v", result.Results)
	}
}

func TestSendAdminNewsletterTestEmailBuildsTestDispatchRequest(t *testing.T) {
	previousClient := adminNewsletterDispatchClient
	t.Cleanup(func() {
		adminNewsletterDispatchClient = previousClient
	})

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		query := r.URL.Query()
		if query.Get("mode") != "test" || query.Get("email") != "admin@example.com" || query.Get("locale") != "en" || query.Get("itemKey") != "post:alpha" {
			t.Fatalf("unexpected query parameters: %#v", query)
		}
		if _, err := w.Write([]byte(`{
			"status":"ok",
			"message":" sent ",
			"timestamp":"2026-03-21T11:00:00Z",
			"locales":{
				"en":{"postTitle":"Alpha"}
			}
		}`)); err != nil {
			t.Fatalf("Write returned error: %v", err)
		}
	}))
	defer server.Close()

	adminNewsletterDispatchClient = server.Client()
	t.Setenv("SITE_URL", server.URL)
	t.Setenv("CRON_SECRET", "cron-secret")
	t.Setenv("NEWSLETTER_UNSUBSCRIBE_SECRET", "unsubscribe-secret")

	result, err := SendAdminNewsletterTestEmail(
		context.Background(),
		&domain.AdminUser{ID: "admin-1"},
		"admin@example.com",
		"en",
		"post:alpha",
	)
	if err != nil {
		t.Fatalf("SendAdminNewsletterTestEmail returned error: %v", err)
	}
	if result == nil || !result.Success || result.Email != "admin@example.com" || result.PostTitle != "Alpha" {
		t.Fatalf("unexpected test send result: %#v", result)
	}
}

func TestExecuteAdminNewsletterDispatchRequestMapsFailures(t *testing.T) {
	_, err := executeAdminNewsletterDispatchRequest(context.Background(), appconfig.NewsletterConfig{
		SiteURL:    "://bad-url",
		CronSecret: "cron-secret",
	}, nil)
	if err == nil {
		t.Fatal("expected invalid site url error")
	}

	previousClient := adminNewsletterDispatchClient
	t.Cleanup(func() {
		adminNewsletterDispatchClient = previousClient
	})

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusBadGateway)
		if _, writeErr := w.Write([]byte(`{"status":"error","message":" dispatch failed "}`)); writeErr != nil {
			t.Fatalf("Write returned error: %v", writeErr)
		}
	}))
	defer server.Close()

	adminNewsletterDispatchClient = server.Client()
	_, err = executeAdminNewsletterDispatchRequest(context.Background(), appconfig.NewsletterConfig{
		SiteURL:    server.URL,
		CronSecret: "cron-secret",
	}, nil)
	if err == nil {
		t.Fatal("expected dispatch failure error")
	}
}

func TestListAdminNewsletterDeliveryFailuresReturnsFilteredRecords(t *testing.T) {
	previousRepo := adminNewsletterRepository
	t.Cleanup(func() {
		adminNewsletterRepository = previousRepo
	})

	adminNewsletterRepository = &adminNewsletterManagementStubRepository{
		failures: []domain.AdminNewsletterDeliveryFailureRecord{
			{Locale: "en", ItemKey: "post:alpha", Email: "reader@example.com", Status: "failed"},
			{Locale: "tr", ItemKey: "post:beta", Email: "reader2@example.com", Status: "failed"},
		},
	}

	page := 1
	size := 5
	result, err := ListAdminNewsletterDeliveryFailures(
		context.Background(),
		&domain.AdminUser{ID: "admin-1"},
		domain.AdminNewsletterDeliveryFailureFilter{
			Locale:  "en",
			ItemKey: "post:alpha",
			Page:    &page,
			Size:    &size,
		},
	)
	if err != nil {
		t.Fatalf("ListAdminNewsletterDeliveryFailures returned error: %v", err)
	}
	if result.Total != 1 || len(result.Items) != 1 || result.Items[0].Email != "reader@example.com" {
		t.Fatalf("unexpected failures result: %#v", result)
	}
}

func TestAdminNewsletterNormalizersRejectInvalidValues(t *testing.T) {
	if _, err := normalizeAdminNewsletterLocale("de"); err == nil {
		t.Fatal("expected invalid locale error")
	}
	if _, err := normalizeAdminNewsletterMutableStatus("pending"); err == nil {
		t.Fatal("expected invalid mutable status error")
	}
	if _, err := normalizeAdminNewsletterCampaignStatus("unknown"); err == nil {
		t.Fatal("expected invalid campaign status error")
	}
}

func TestAdminNewsletterManagementRequiresAuthentication(t *testing.T) {
	if _, err := ListAdminNewsletterSubscribers(context.Background(), nil, domain.AdminNewsletterSubscriberFilter{}); err == nil || err.Error() != "admin authentication required" {
		t.Fatalf("expected auth error for subscribers, got %v", err)
	}
	if _, err := UpdateAdminNewsletterSubscriberStatus(context.Background(), nil, "reader@example.com", adminNewsletterStatusActive); err == nil || err.Error() != "admin authentication required" {
		t.Fatalf("expected auth error for subscriber update, got %v", err)
	}
	if err := DeleteAdminNewsletterSubscriber(context.Background(), nil, "reader@example.com"); err == nil || err.Error() != "admin authentication required" {
		t.Fatalf("expected auth error for subscriber delete, got %v", err)
	}
	if _, err := ListAdminNewsletterCampaigns(context.Background(), nil, domain.AdminNewsletterCampaignFilter{}); err == nil || err.Error() != "admin authentication required" {
		t.Fatalf("expected auth error for campaigns, got %v", err)
	}
	if _, err := ListAdminNewsletterDeliveryFailures(context.Background(), nil, domain.AdminNewsletterDeliveryFailureFilter{}); err == nil || err.Error() != "admin authentication required" {
		t.Fatalf("expected auth error for failures, got %v", err)
	}
	if _, err := TriggerAdminNewsletterDispatch(context.Background(), nil); err == nil || err.Error() != "admin authentication required" {
		t.Fatalf("expected auth error for dispatch, got %v", err)
	}
	if _, err := SendAdminNewsletterTestEmail(context.Background(), nil, "reader@example.com", "en", "post:alpha"); err == nil || err.Error() != "admin authentication required" {
		t.Fatalf("expected auth error for test email, got %v", err)
	}
}

func TestAdminNewsletterManagementValidationAndRepositoryErrors(t *testing.T) {
	previousRepo := adminNewsletterRepository
	t.Cleanup(func() {
		adminNewsletterRepository = previousRepo
	})

	admin := &domain.AdminUser{ID: "admin-1"}

	_, err := UpdateAdminNewsletterSubscriberStatus(context.Background(), admin, "bad", adminNewsletterStatusActive)
	testassert.ErrorContains(t, err, "invalid subscriber email")
	_, err = UpdateAdminNewsletterSubscriberStatus(context.Background(), admin, "reader@example.com", "pending")
	testassert.ErrorContains(t, err, "unsupported newsletter status")
	testassert.ErrorContains(t, DeleteAdminNewsletterSubscriber(context.Background(), admin, "bad"), "invalid subscriber email")
	_, err = ListAdminNewsletterCampaigns(context.Background(), admin, domain.AdminNewsletterCampaignFilter{Status: "broken"})
	testassert.ErrorContains(t, err, "unsupported newsletter campaign status")
	_, err = ListAdminNewsletterDeliveryFailures(context.Background(), admin, domain.AdminNewsletterDeliveryFailureFilter{Locale: "de", ItemKey: "post:alpha"})
	testassert.ErrorContains(t, err, "newsletter campaign locale is required")
	_, err = SendAdminNewsletterTestEmail(context.Background(), admin, "bad", "en", "post:alpha")
	testassert.ErrorContains(t, err, "invalid test email")
	_, err = SendAdminNewsletterTestEmail(context.Background(), admin, "reader@example.com", "", "post:alpha")
	testassert.ErrorContains(t, err, "newsletter locale is required")
	_, err = SendAdminNewsletterTestEmail(context.Background(), admin, "reader@example.com", "en", " ")
	testassert.ErrorContains(t, err, "newsletter item key is required")

	adminNewsletterRepository = &adminNewsletterManagementStubRepository{
		campaignsErr: repository.ErrAdminNewsletterRepositoryUnavailable,
	}
	_, err = ListAdminNewsletterCampaigns(context.Background(), admin, domain.AdminNewsletterCampaignFilter{})
	testassert.ErrorContains(t, err, "admin newsletter is unavailable")

	adminNewsletterRepository = &adminNewsletterManagementStubRepository{
		failuresErr: repository.ErrAdminNewsletterRepositoryUnavailable,
	}
	_, err = ListAdminNewsletterDeliveryFailures(context.Background(), admin, domain.AdminNewsletterDeliveryFailureFilter{Locale: "en", ItemKey: "post:alpha"})
	testassert.ErrorContains(t, err, "admin newsletter is unavailable")

	adminNewsletterRepository = &adminNewsletterManagementStubRepository{
		deleteErr: repository.ErrAdminNewsletterRepositoryUnavailable,
	}
	testassert.ErrorContains(t, DeleteAdminNewsletterSubscriber(context.Background(), admin, "reader@example.com"), "admin newsletter is unavailable")
}

func TestAdminNewsletterDispatchAndHelperErrorPaths(t *testing.T) {
	admin := &domain.AdminUser{ID: "admin-1"}

	_, err := TriggerAdminNewsletterDispatch(context.Background(), admin)
	testassert.ErrorContains(t, err, "newsletter dispatch is not configured")

	previousClient := adminNewsletterDispatchClient
	t.Cleanup(func() {
		adminNewsletterDispatchClient = previousClient
	})

	adminNewsletterDispatchClient = &http.Client{
		Transport: roundTripFunc(func(*http.Request) (*http.Response, error) {
			return nil, errors.New("network down")
		}),
	}
	_, err = executeAdminNewsletterDispatchRequest(context.Background(), appconfig.NewsletterConfig{
		SiteURL:    "https://example.com",
		CronSecret: "cron-secret",
	}, nil)
	testassert.ErrorContains(t, err, "newsletter dispatch is unavailable")

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		_, err := w.Write([]byte(`{"status":"ok"`))
		testassert.NoError(t, err, "write malformed response")
	}))
	defer server.Close()

	adminNewsletterDispatchClient = server.Client()
	_, err = executeAdminNewsletterDispatchRequest(context.Background(), appconfig.NewsletterConfig{
		SiteURL:    server.URL,
		CronSecret: "cron-secret",
	}, nil)
	testassert.ErrorContains(t, err, "failed to decode newsletter dispatch response")

	errorServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		_, err := w.Write([]byte(`{"status":"error","message":" "}`))
		testassert.NoError(t, err, "write error response")
	}))
	defer errorServer.Close()

	adminNewsletterDispatchClient = errorServer.Client()
	_, err = executeAdminNewsletterDispatchRequest(context.Background(), appconfig.NewsletterConfig{
		SiteURL:    errorServer.URL,
		CronSecret: "cron-secret",
	}, nil)
	testassert.ErrorContains(t, err, "newsletter dispatch failed")

	incompleteServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		_, err := w.Write([]byte(`{"status":"ok","timestamp":"bad","message":" ","locales":{}}`))
		testassert.NoError(t, err, "write incomplete response")
	}))
	defer incompleteServer.Close()

	adminNewsletterDispatchClient = incompleteServer.Client()
	t.Setenv("SITE_URL", incompleteServer.URL)
	t.Setenv("CRON_SECRET", "cron-secret")
	t.Setenv("NEWSLETTER_UNSUBSCRIBE_SECRET", "unsubscribe-secret")

	_, err = SendAdminNewsletterTestEmail(context.Background(), admin, "reader@example.com", "en", "post:alpha")
	testassert.ErrorContains(t, err, "newsletter test send response is incomplete")

	t.Run("helper mappings", func(t *testing.T) {
		status, err := normalizeAdminNewsletterStatusFilter(" all ")
		testassert.NoError(t, err, "normalize all status")
		testassert.Equal(t, status, "", "normalized all status")
		testassert.ErrorContains(t, toAdminNewsletterError(repository.ErrAdminNewsletterSubscriberNotFound, "fallback"), "newsletter subscriber not found")
		testassert.ErrorContains(t, toAdminNewsletterError(errors.New("boom"), "fallback"), "fallback")
	})
}
