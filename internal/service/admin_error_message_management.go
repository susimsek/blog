package service

import (
	"context"
	"math"
	"regexp"
	"slices"
	"strings"
	"time"

	"suaybsimsek.com/blog-api/internal/domain"
	"suaybsimsek.com/blog-api/internal/repository"
	"suaybsimsek.com/blog-api/pkg/apperrors"
	"suaybsimsek.com/blog-api/pkg/httpapi"
)

const (
	adminErrorMessageMaxLength     = 500
	adminErrorMessageDefaultSize   = 20
	adminErrorMessageMaxSize       = 100
	adminErrorMessageAuditResource = "admin_error_messages"
	adminAuditStatusSuccess        = "success"
)

var (
	adminErrorCodePattern                                    = regexp.MustCompile(`^[A-Z0-9_]{2,120}$`)
	adminAuditLogRepo     repository.AdminAuditLogRepository = repository.NewAdminAuditLogRepository()
)

func ListAdminErrorMessages(
	ctx context.Context,
	adminUser *domain.AdminUser,
	filter domain.AdminErrorMessageFilter,
) (*domain.AdminErrorMessageListResult, error) {
	if adminUser == nil || strings.TrimSpace(adminUser.ID) == "" {
		return nil, apperrors.Unauthorized("admin authentication required")
	}

	records, err := adminErrorMessageRepository.ListByScope(ctx, adminErrorMessageScope)
	if err != nil {
		return nil, apperrors.Internal("failed to load admin error messages", err)
	}

	filterLocale := strings.TrimSpace(strings.ToLower(filter.Locale))
	filterCode := strings.TrimSpace(strings.ToUpper(filter.Code))
	filterQuery := strings.TrimSpace(strings.ToLower(filter.Query))
	page := clampPositiveInt(filter.Page, 1, 100000)
	size := clampPositiveInt(filter.Size, adminErrorMessageDefaultSize, adminErrorMessageMaxSize)

	items := make([]domain.AdminErrorMessageView, 0, len(records))
	for _, record := range records {
		item := mapAdminErrorMessageRecord(record)
		if !matchesAdminErrorMessageFilter(item, filterLocale, filterCode, filterQuery) {
			continue
		}
		items = append(items, item)
	}

	slices.SortFunc(items, func(left, right domain.AdminErrorMessageView) int {
		if compared := strings.Compare(left.Scope, right.Scope); compared != 0 {
			return compared
		}
		if compared := strings.Compare(left.Locale, right.Locale); compared != 0 {
			return compared
		}
		return strings.Compare(left.Code, right.Code)
	})

	total := len(items)
	if total == 0 {
		return &domain.AdminErrorMessageListResult{
			Items: []domain.AdminErrorMessageView{},
			Total: 0,
			Page:  1,
			Size:  size,
		}, nil
	}

	totalPages := int(math.Ceil(float64(total) / float64(size)))
	resolvedPage := max(1, min(page, totalPages))
	startIndex := (resolvedPage - 1) * size
	endIndex := min(startIndex+size, total)
	pagedItems := items[startIndex:endIndex]

	return &domain.AdminErrorMessageListResult{
		Items: pagedItems,
		Total: total,
		Page:  resolvedPage,
		Size:  size,
	}, nil
}

func CreateAdminErrorMessage(
	ctx context.Context,
	adminUser *domain.AdminUser,
	key domain.AdminErrorMessageKey,
	message string,
) (*domain.AdminErrorMessageView, error) {
	if adminUser == nil || strings.TrimSpace(adminUser.ID) == "" {
		return nil, apperrors.Unauthorized("admin authentication required")
	}

	resolvedKey, err := normalizeAdminErrorMessageKey(key)
	if err != nil {
		return nil, err
	}

	resolvedMessage := strings.TrimSpace(message)
	if resolvedMessage == "" {
		return nil, apperrors.BadRequest("error message is required")
	}
	if len(resolvedMessage) > adminErrorMessageMaxLength {
		return nil, apperrors.BadRequest("error message is too long")
	}

	beforeValue, err := loadCurrentAdminErrorMessageValue(ctx, resolvedKey)
	if err != nil {
		return nil, err
	}
	if beforeValue != "" {
		return nil, apperrors.BadRequest("admin error message already exists")
	}

	now := time.Now().UTC()
	if err := adminErrorMessageRepository.UpsertMany(ctx, []domain.ErrorMessageRecord{
		{
			Scope:     resolvedKey.Scope,
			Locale:    resolvedKey.Locale,
			Code:      resolvedKey.Code,
			Message:   resolvedMessage,
			UpdatedAt: now,
		},
	}); err != nil {
		return nil, apperrors.Internal("failed to persist admin error message", err)
	}

	InvalidateAdminErrorCatalogCache()

	if err := createAdminErrorMessageAuditLog(
		ctx,
		adminUser,
		"error_message_created",
		resolvedKey,
		beforeValue,
		resolvedMessage,
		adminAuditStatusSuccess,
		"",
	); err != nil {
		return nil, err
	}

	return &domain.AdminErrorMessageView{
		AdminErrorMessageKey: resolvedKey,
		Message:              resolvedMessage,
		UpdatedAt:            now,
	}, nil
}

func UpdateAdminErrorMessage(
	ctx context.Context,
	adminUser *domain.AdminUser,
	key domain.AdminErrorMessageKey,
	message string,
) (*domain.AdminErrorMessageView, error) {
	if adminUser == nil || strings.TrimSpace(adminUser.ID) == "" {
		return nil, apperrors.Unauthorized("admin authentication required")
	}

	resolvedKey, err := normalizeAdminErrorMessageKey(key)
	if err != nil {
		return nil, err
	}

	resolvedMessage := strings.TrimSpace(message)
	if resolvedMessage == "" {
		return nil, apperrors.BadRequest("error message is required")
	}
	if len(resolvedMessage) > adminErrorMessageMaxLength {
		return nil, apperrors.BadRequest("error message is too long")
	}

	beforeValue, err := loadCurrentAdminErrorMessageValue(ctx, resolvedKey)
	if err != nil {
		return nil, err
	}
	if beforeValue == "" {
		return nil, apperrors.BadRequest("admin error message not found")
	}

	now := time.Now().UTC()
	if err := adminErrorMessageRepository.UpsertMany(ctx, []domain.ErrorMessageRecord{
		{
			Scope:     resolvedKey.Scope,
			Locale:    resolvedKey.Locale,
			Code:      resolvedKey.Code,
			Message:   resolvedMessage,
			UpdatedAt: now,
		},
	}); err != nil {
		return nil, apperrors.Internal("failed to persist admin error message", err)
	}

	InvalidateAdminErrorCatalogCache()

	if err := createAdminErrorMessageAuditLog(
		ctx,
		adminUser,
		"error_message_updated",
		resolvedKey,
		beforeValue,
		resolvedMessage,
		adminAuditStatusSuccess,
		"",
	); err != nil {
		return nil, err
	}

	return &domain.AdminErrorMessageView{
		AdminErrorMessageKey: resolvedKey,
		Message:              resolvedMessage,
		UpdatedAt:            now,
	}, nil
}

func DeleteAdminErrorMessage(
	ctx context.Context,
	adminUser *domain.AdminUser,
	key domain.AdminErrorMessageKey,
) error {
	if adminUser == nil || strings.TrimSpace(adminUser.ID) == "" {
		return apperrors.Unauthorized("admin authentication required")
	}

	resolvedKey, err := normalizeAdminErrorMessageKey(key)
	if err != nil {
		return err
	}

	beforeValue, err := loadCurrentAdminErrorMessageValue(ctx, resolvedKey)
	if err != nil {
		return err
	}
	if beforeValue == "" {
		return apperrors.BadRequest("admin error message not found")
	}

	deleted, err := adminErrorMessageRepository.DeleteByKey(
		ctx,
		resolvedKey.Scope,
		resolvedKey.Locale,
		resolvedKey.Code,
	)
	if err != nil {
		return apperrors.Internal("failed to delete admin error message", err)
	}
	if !deleted {
		return apperrors.BadRequest("admin error message not found")
	}

	InvalidateAdminErrorCatalogCache()

	if err := createAdminErrorMessageAuditLog(
		ctx,
		adminUser,
		"error_message_deleted",
		resolvedKey,
		beforeValue,
		"",
		adminAuditStatusSuccess,
		"",
	); err != nil {
		return err
	}

	return nil
}

func ListAdminErrorMessageAuditLogs(
	ctx context.Context,
	adminUser *domain.AdminUser,
	limit int,
) ([]domain.AdminAuditLogRecord, error) {
	if adminUser == nil || strings.TrimSpace(adminUser.ID) == "" {
		return nil, apperrors.Unauthorized("admin authentication required")
	}

	logs, err := adminAuditLogRepo.ListRecentByResource(ctx, adminErrorMessageAuditResource, limit)
	if err != nil {
		return nil, apperrors.Internal("failed to load admin audit logs", err)
	}

	return logs, nil
}

func normalizeAdminErrorMessageKey(key domain.AdminErrorMessageKey) (domain.AdminErrorMessageKey, error) {
	resolved := domain.AdminErrorMessageKey{
		Scope:  strings.TrimSpace(key.Scope),
		Locale: strings.TrimSpace(strings.ToLower(key.Locale)),
		Code:   strings.TrimSpace(strings.ToUpper(key.Code)),
	}
	if resolved.Scope == "" {
		resolved.Scope = adminErrorMessageScope
	}
	if resolved.Scope != adminErrorMessageScope {
		return domain.AdminErrorMessageKey{}, apperrors.BadRequest("invalid error message scope")
	}
	if resolved.Locale == "" {
		return domain.AdminErrorMessageKey{}, apperrors.BadRequest("error message locale is required")
	}
	if resolved.Locale != adminErrorLocaleEN && resolved.Locale != adminErrorLocaleTR {
		return domain.AdminErrorMessageKey{}, apperrors.BadRequest("unsupported error message locale")
	}
	if resolved.Code == "" {
		return domain.AdminErrorMessageKey{}, apperrors.BadRequest("error message code is required")
	}
	if !adminErrorCodePattern.MatchString(resolved.Code) {
		return domain.AdminErrorMessageKey{}, apperrors.BadRequest("invalid error message code")
	}

	return resolved, nil
}

func matchesAdminErrorMessageFilter(item domain.AdminErrorMessageView, locale, code, query string) bool {
	if locale != "" && item.Locale != locale {
		return false
	}
	if code != "" && item.Code != code {
		return false
	}
	if query == "" {
		return true
	}

	searchableParts := []string{
		strings.ToLower(item.Scope),
		strings.ToLower(item.Locale),
		strings.ToLower(item.Code),
		strings.ToLower(item.Message),
	}
	for _, part := range searchableParts {
		if strings.Contains(part, query) {
			return true
		}
	}

	return false
}

func mapAdminErrorMessageRecord(record domain.ErrorMessageRecord) domain.AdminErrorMessageView {
	scope := strings.TrimSpace(record.Scope)
	if scope == "" {
		scope = adminErrorMessageScope
	}

	return domain.AdminErrorMessageView{
		AdminErrorMessageKey: domain.AdminErrorMessageKey{
			Scope:  scope,
			Locale: strings.TrimSpace(strings.ToLower(record.Locale)),
			Code:   strings.TrimSpace(strings.ToUpper(record.Code)),
		},
		Message:   strings.TrimSpace(record.Message),
		UpdatedAt: record.UpdatedAt,
	}
}

func loadCurrentAdminErrorMessageValue(ctx context.Context, key domain.AdminErrorMessageKey) (string, error) {
	records, err := adminErrorMessageRepository.ListByScope(ctx, key.Scope)
	if err != nil {
		return "", apperrors.Internal("failed to load admin error messages", err)
	}

	for _, record := range records {
		locale := strings.TrimSpace(strings.ToLower(record.Locale))
		code := strings.TrimSpace(strings.ToUpper(record.Code))
		if locale == key.Locale && code == key.Code {
			return strings.TrimSpace(record.Message), nil
		}
	}

	return "", nil
}

func createAdminErrorMessageAuditLog(
	ctx context.Context,
	adminUser *domain.AdminUser,
	action string,
	key domain.AdminErrorMessageKey,
	beforeValue string,
	afterValue string,
	status string,
	failureCode string,
) error {
	if adminUser == nil || strings.TrimSpace(adminUser.ID) == "" {
		return apperrors.Unauthorized("admin authentication required")
	}

	trace, _ := httpapi.RequestTraceFromContext(ctx)
	record := domain.AdminAuditLogRecord{
		ActorID:     strings.TrimSpace(adminUser.ID),
		ActorEmail:  strings.TrimSpace(strings.ToLower(adminUser.Email)),
		Action:      strings.TrimSpace(action),
		Resource:    adminErrorMessageAuditResource,
		Scope:       strings.TrimSpace(key.Scope),
		Locale:      strings.TrimSpace(strings.ToLower(key.Locale)),
		Code:        strings.TrimSpace(strings.ToUpper(key.Code)),
		BeforeValue: strings.TrimSpace(beforeValue),
		AfterValue:  strings.TrimSpace(afterValue),
		Status:      strings.TrimSpace(strings.ToLower(status)),
		FailureCode: strings.TrimSpace(strings.ToUpper(failureCode)),
		RequestID:   httpapi.RequestIDFromContext(ctx),
		RemoteIP:    strings.TrimSpace(trace.RemoteIP),
		CountryCode: strings.TrimSpace(strings.ToUpper(trace.CountryCode)),
		UserAgent:   strings.TrimSpace(trace.UserAgent),
		CreatedAt:   time.Now().UTC(),
	}

	if err := adminAuditLogRepo.Create(ctx, record); err != nil {
		return apperrors.Internal("failed to persist admin audit log", err)
	}

	return nil
}

func SaveAdminErrorMessages(ctx context.Context, records []domain.ErrorMessageRecord) error {
	if len(records) == 0 {
		return nil
	}
	if err := adminErrorMessageRepository.UpsertMany(ctx, records); err != nil {
		return err
	}

	InvalidateAdminErrorCatalogCache()
	return nil
}
