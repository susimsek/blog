package service

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/url"
	"sort"
	"strings"
	"time"

	appconfig "suaybsimsek.com/blog-api/internal/config"
	"suaybsimsek.com/blog-api/internal/domain"
	"suaybsimsek.com/blog-api/internal/repository"
	"suaybsimsek.com/blog-api/pkg/apperrors"
	newsletterpkg "suaybsimsek.com/blog-api/pkg/newsletter"
)

const (
	adminNewsletterDefaultPageSize = 20
	adminNewsletterMaxPageSize     = 100
	adminNewsletterStatusPending   = "pending"
	adminNewsletterStatusActive    = "active"
	adminNewsletterStatusDisabled  = "unsubscribed"
	adminNewsletterDispatchTimeout = 45 * time.Second
)

var adminNewsletterRepository repository.AdminNewsletterRepository = repository.NewAdminNewsletterRepository()

var adminNewsletterDispatchClient = &http.Client{
	Timeout: adminNewsletterDispatchTimeout,
}

type adminNewsletterDispatchLocalePayload struct {
	RSSURL      string `json:"rssUrl"`
	ItemKey     string `json:"itemKey"`
	PostTitle   string `json:"postTitle"`
	SentCount   int    `json:"sentCount"`
	FailedCount int    `json:"failedCount"`
	Skipped     bool   `json:"skipped"`
	Reason      string `json:"reason"`
}

type adminNewsletterDispatchResponsePayload struct {
	Status    string                                          `json:"status"`
	Code      string                                          `json:"code"`
	Message   string                                          `json:"message"`
	Timestamp string                                          `json:"timestamp"`
	Locales   map[string]adminNewsletterDispatchLocalePayload `json:"locales"`
}

func ListAdminNewsletterSubscribers(
	ctx context.Context,
	adminUser *domain.AdminUser,
	filter domain.AdminNewsletterSubscriberFilter,
) (*domain.AdminNewsletterSubscriberListResult, error) {
	if adminUser == nil || strings.TrimSpace(adminUser.ID) == "" {
		return nil, apperrors.Unauthorized("admin authentication required")
	}

	page := clampPositiveInt(filter.Page, 1, 100000)
	size := clampPositiveInt(filter.Size, adminNewsletterDefaultPageSize, adminNewsletterMaxPageSize)
	locale, err := normalizeAdminNewsletterLocale(filter.Locale)
	if err != nil {
		return nil, err
	}
	status, err := normalizeAdminNewsletterStatusFilter(filter.Status)
	if err != nil {
		return nil, err
	}

	result, err := adminNewsletterRepository.ListSubscribers(
		ctx,
		domain.AdminNewsletterSubscriberFilter{
			Locale: locale,
			Status: status,
			Query:  strings.TrimSpace(filter.Query),
		},
		page,
		size,
	)
	if err != nil {
		return nil, toAdminNewsletterError(err, "failed to list newsletter subscribers")
	}
	if result == nil {
		return &domain.AdminNewsletterSubscriberListResult{
			Items: []domain.AdminNewsletterSubscriberRecord{},
			Total: 0,
			Page:  page,
			Size:  size,
		}, nil
	}

	if result.Items == nil {
		result.Items = []domain.AdminNewsletterSubscriberRecord{}
	}

	return result, nil
}

func UpdateAdminNewsletterSubscriberStatus(
	ctx context.Context,
	adminUser *domain.AdminUser,
	email string,
	status string,
) (*domain.AdminNewsletterSubscriberRecord, error) {
	if adminUser == nil || strings.TrimSpace(adminUser.ID) == "" {
		return nil, apperrors.Unauthorized("admin authentication required")
	}

	resolvedEmail, err := newsletterpkg.NormalizeSubscriberEmail(email)
	if err != nil {
		return nil, apperrors.BadRequest("invalid subscriber email")
	}

	resolvedStatus, err := normalizeAdminNewsletterMutableStatus(status)
	if err != nil {
		return nil, err
	}

	updated, err := adminNewsletterRepository.UpdateSubscriberStatusByEmail(
		ctx,
		resolvedEmail,
		resolvedStatus,
		time.Now().UTC(),
	)
	if err != nil {
		return nil, toAdminNewsletterError(err, "failed to update newsletter subscriber")
	}

	return updated, nil
}

func DeleteAdminNewsletterSubscriber(ctx context.Context, adminUser *domain.AdminUser, email string) error {
	if adminUser == nil || strings.TrimSpace(adminUser.ID) == "" {
		return apperrors.Unauthorized("admin authentication required")
	}

	resolvedEmail, err := newsletterpkg.NormalizeSubscriberEmail(email)
	if err != nil {
		return apperrors.BadRequest("invalid subscriber email")
	}

	deleted, err := adminNewsletterRepository.DeleteSubscriberByEmail(ctx, resolvedEmail)
	if err != nil {
		return toAdminNewsletterError(err, "failed to delete newsletter subscriber")
	}
	if !deleted {
		return apperrors.BadRequest("newsletter subscriber not found")
	}

	return nil
}

func ListAdminNewsletterCampaigns(
	ctx context.Context,
	adminUser *domain.AdminUser,
	filter domain.AdminNewsletterCampaignFilter,
) (*domain.AdminNewsletterCampaignListResult, error) {
	if adminUser == nil || strings.TrimSpace(adminUser.ID) == "" {
		return nil, apperrors.Unauthorized("admin authentication required")
	}

	page := clampPositiveInt(filter.Page, 1, 100000)
	size := clampPositiveInt(filter.Size, adminNewsletterDefaultPageSize, adminNewsletterMaxPageSize)
	locale, err := normalizeAdminNewsletterLocale(filter.Locale)
	if err != nil {
		return nil, err
	}
	status, err := normalizeAdminNewsletterCampaignStatus(filter.Status)
	if err != nil {
		return nil, err
	}

	result, err := adminNewsletterRepository.ListCampaigns(
		ctx,
		domain.AdminNewsletterCampaignFilter{
			Locale: locale,
			Status: status,
			Query:  strings.TrimSpace(filter.Query),
		},
		page,
		size,
	)
	if err != nil {
		return nil, toAdminNewsletterError(err, "failed to list newsletter campaigns")
	}
	if result == nil {
		return &domain.AdminNewsletterCampaignListResult{
			Items: []domain.AdminNewsletterCampaignRecord{},
			Total: 0,
			Page:  page,
			Size:  size,
		}, nil
	}

	if result.Items == nil {
		result.Items = []domain.AdminNewsletterCampaignRecord{}
	}

	return result, nil
}

func ListAdminNewsletterDeliveryFailures(
	ctx context.Context,
	adminUser *domain.AdminUser,
	filter domain.AdminNewsletterDeliveryFailureFilter,
) (*domain.AdminNewsletterDeliveryFailureListResult, error) {
	if adminUser == nil || strings.TrimSpace(adminUser.ID) == "" {
		return nil, apperrors.Unauthorized("admin authentication required")
	}

	page := clampPositiveInt(filter.Page, 1, 100000)
	size := clampPositiveInt(filter.Size, adminNewsletterDefaultPageSize, adminNewsletterMaxPageSize)
	locale, err := normalizeAdminNewsletterLocale(filter.Locale)
	if err != nil || locale == "" {
		return nil, apperrors.BadRequest("newsletter campaign locale is required")
	}

	itemKey := strings.TrimSpace(filter.ItemKey)
	if itemKey == "" {
		return nil, apperrors.BadRequest("newsletter campaign item key is required")
	}

	result, err := adminNewsletterRepository.ListDeliveryFailures(
		ctx,
		domain.AdminNewsletterDeliveryFailureFilter{
			Locale:  locale,
			ItemKey: itemKey,
		},
		page,
		size,
	)
	if err != nil {
		return nil, toAdminNewsletterError(err, "failed to list newsletter delivery failures")
	}
	if result == nil {
		return &domain.AdminNewsletterDeliveryFailureListResult{
			Items: []domain.AdminNewsletterDeliveryFailureRecord{},
			Total: 0,
			Page:  page,
			Size:  size,
		}, nil
	}

	if result.Items == nil {
		result.Items = []domain.AdminNewsletterDeliveryFailureRecord{}
	}

	return result, nil
}

func TriggerAdminNewsletterDispatch(
	ctx context.Context,
	adminUser *domain.AdminUser,
) (*domain.AdminNewsletterDispatchResult, error) {
	if adminUser == nil || strings.TrimSpace(adminUser.ID) == "" {
		return nil, apperrors.Unauthorized("admin authentication required")
	}

	config, err := appconfig.ResolveNewsletterConfig()
	if err != nil {
		return nil, apperrors.Config("newsletter dispatch is not configured", err)
	}

	payload, err := executeAdminNewsletterDispatchRequest(ctx, config, nil)
	if err != nil {
		return nil, err
	}

	results := make([]domain.AdminNewsletterDispatchLocaleResult, 0, len(payload.Locales))
	for localeKey, item := range payload.Locales {
		results = append(results, domain.AdminNewsletterDispatchLocaleResult{
			Locale:      strings.TrimSpace(strings.ToLower(localeKey)),
			RSSURL:      strings.TrimSpace(item.RSSURL),
			ItemKey:     strings.TrimSpace(item.ItemKey),
			PostTitle:   strings.TrimSpace(item.PostTitle),
			SentCount:   item.SentCount,
			FailedCount: item.FailedCount,
			Skipped:     item.Skipped,
			Reason:      strings.TrimSpace(item.Reason),
		})
	}
	sort.Slice(results, func(i, j int) bool {
		if results[i].Locale == results[j].Locale {
			return results[i].ItemKey < results[j].ItemKey
		}
		return results[i].Locale < results[j].Locale
	})

	timestamp := time.Now().UTC()
	if parsed, err := time.Parse(time.RFC3339, strings.TrimSpace(payload.Timestamp)); err == nil {
		timestamp = parsed.UTC()
	}

	message := strings.TrimSpace(payload.Message)
	if message == "" {
		message = "newsletter dispatch completed"
	}

	return &domain.AdminNewsletterDispatchResult{
		Success:   true,
		Message:   message,
		Timestamp: timestamp,
		Results:   results,
	}, nil
}

func SendAdminNewsletterTestEmail(
	ctx context.Context,
	adminUser *domain.AdminUser,
	email string,
	locale string,
	itemKey string,
) (*domain.AdminNewsletterTestSendResult, error) {
	if adminUser == nil || strings.TrimSpace(adminUser.ID) == "" {
		return nil, apperrors.Unauthorized("admin authentication required")
	}

	resolvedEmail, err := newsletterpkg.NormalizeSubscriberEmail(email)
	if err != nil {
		return nil, apperrors.BadRequest("invalid test email")
	}

	resolvedLocale, err := normalizeAdminNewsletterLocale(locale)
	if err != nil || resolvedLocale == "" {
		return nil, apperrors.BadRequest("newsletter locale is required")
	}

	resolvedItemKey := strings.TrimSpace(itemKey)
	if resolvedItemKey == "" {
		return nil, apperrors.BadRequest("newsletter item key is required")
	}

	config, err := appconfig.ResolveNewsletterConfig()
	if err != nil {
		return nil, apperrors.Config("newsletter dispatch is not configured", err)
	}

	query := url.Values{}
	query.Set("mode", "test")
	query.Set("email", resolvedEmail)
	query.Set("locale", resolvedLocale)
	query.Set("itemKey", resolvedItemKey)

	payload, err := executeAdminNewsletterDispatchRequest(ctx, config, query)
	if err != nil {
		return nil, err
	}

	localePayload, exists := payload.Locales[resolvedLocale]
	if !exists {
		return nil, apperrors.Internal("newsletter test send response is incomplete", nil)
	}

	timestamp := time.Now().UTC()
	if parsed, parseErr := time.Parse(time.RFC3339, strings.TrimSpace(payload.Timestamp)); parseErr == nil {
		timestamp = parsed.UTC()
	}

	message := strings.TrimSpace(payload.Message)
	if message == "" {
		message = "test newsletter email sent"
	}

	return &domain.AdminNewsletterTestSendResult{
		Success:   true,
		Message:   message,
		Timestamp: timestamp,
		Email:     resolvedEmail,
		Locale:    resolvedLocale,
		ItemKey:   resolvedItemKey,
		PostTitle: strings.TrimSpace(localePayload.PostTitle),
	}, nil
}

func executeAdminNewsletterDispatchRequest(
	ctx context.Context,
	config appconfig.NewsletterConfig,
	query url.Values,
) (*adminNewsletterDispatchResponsePayload, error) {
	siteURL, parseErr := url.Parse(config.SiteURL)
	if parseErr != nil || siteURL.Scheme == "" || siteURL.Host == "" {
		return nil, apperrors.Config("newsletter dispatch site url is invalid", parseErr)
	}

	endpoint := strings.TrimRight(config.SiteURL, "/") + "/api/newsletter-dispatch"
	if len(query) > 0 {
		endpoint += "?" + query.Encode()
	}

	request, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return nil, apperrors.Internal("failed to build newsletter dispatch request", err)
	}
	request.Header.Set("Authorization", "Bearer "+config.CronSecret)
	request.Header.Set("Accept", "application/json")
	request.Header.Set("User-Agent", "blog-admin-newsletter-ops/1.0")

	response, err := adminNewsletterDispatchClient.Do(request)
	if err != nil {
		return nil, apperrors.ServiceUnavailable("newsletter dispatch is unavailable", err)
	}
	defer func() {
		_ = response.Body.Close()
	}()

	var payload adminNewsletterDispatchResponsePayload
	if err := json.NewDecoder(response.Body).Decode(&payload); err != nil {
		return nil, apperrors.Internal("failed to decode newsletter dispatch response", err)
	}

	if response.StatusCode >= http.StatusBadRequest || strings.TrimSpace(strings.ToLower(payload.Status)) == "error" {
		message := strings.TrimSpace(payload.Message)
		if message == "" {
			message = "newsletter dispatch failed"
		}
		return nil, apperrors.New("BAD_GATEWAY", message, http.StatusBadGateway, nil)
	}

	if payload.Locales == nil {
		payload.Locales = map[string]adminNewsletterDispatchLocalePayload{}
	}

	return &payload, nil
}

func normalizeAdminNewsletterLocale(value string) (string, error) {
	resolved := strings.TrimSpace(strings.ToLower(value))
	switch resolved {
	case "", "all":
		return "", nil
	case adminErrorLocaleEN, adminErrorLocaleTR:
		return resolved, nil
	default:
		return "", apperrors.BadRequest("unsupported newsletter locale")
	}
}

func normalizeAdminNewsletterStatusFilter(value string) (string, error) {
	resolved := strings.TrimSpace(strings.ToLower(value))
	switch resolved {
	case "", "all":
		return "", nil
	case adminNewsletterStatusPending, adminNewsletterStatusActive, adminNewsletterStatusDisabled:
		return resolved, nil
	default:
		return "", apperrors.BadRequest("unsupported newsletter status")
	}
}

func normalizeAdminNewsletterMutableStatus(value string) (string, error) {
	resolved := strings.TrimSpace(strings.ToLower(value))
	switch resolved {
	case adminNewsletterStatusActive, adminNewsletterStatusDisabled:
		return resolved, nil
	default:
		return "", apperrors.BadRequest("unsupported newsletter status")
	}
}

func normalizeAdminNewsletterCampaignStatus(value string) (string, error) {
	resolved := strings.TrimSpace(strings.ToLower(value))
	switch resolved {
	case "", "all":
		return "", nil
	case "processing", "partial", "sent":
		return resolved, nil
	default:
		return "", apperrors.BadRequest("unsupported newsletter campaign status")
	}
}

func toAdminNewsletterError(err error, message string) error {
	switch {
	case errors.Is(err, repository.ErrAdminNewsletterRepositoryUnavailable):
		return apperrors.ServiceUnavailable("admin newsletter is unavailable", err)
	case errors.Is(err, repository.ErrAdminNewsletterSubscriberNotFound):
		return apperrors.BadRequest("newsletter subscriber not found")
	default:
		return apperrors.Internal(message, err)
	}
}
