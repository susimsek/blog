package service

import (
	"context"
	"encoding/json"
	"errors"
	"net/url"
	"regexp"
	"sort"
	"strings"
	"time"

	"suaybsimsek.com/blog-api/internal/domain"
	"suaybsimsek.com/blog-api/internal/repository"
	"suaybsimsek.com/blog-api/pkg/apperrors"
	"suaybsimsek.com/blog-api/pkg/httpapi"
)

const (
	adminContentDefaultPageSize         = 20
	adminContentMaxPageSize             = 100
	adminContentIDMaxLength             = 128
	adminContentNameMaxLength           = 120
	adminContentTitleMaxLength          = 240
	adminContentSummaryMaxLength        = 4000
	adminContentColorMaxLength          = 32
	adminContentIconMaxLength           = 64
	adminContentLinkMaxLength           = 512
	adminContentThumbnailMaxLength      = 1024
	adminContentBodyMaxLength           = 400000
	adminContentRevisionDefaultPageSize = 10

	adminContentAuditResource      = "admin_content_management"
	adminContentAuditStatusSuccess = "success"
	adminContentAuthRequired       = "admin authentication required"
	adminContentCategoryIDField    = "category id"
	adminContentTopicIDField       = "topic id"
	adminContentPostIDField        = "post id"
	adminContentPostNotFound       = "content post not found"
	adminContentCategoryNotFound   = "content category not found"
	adminContentTopicNotFound      = "content topic not found"
	adminContentLoadPostFailed     = "failed to load content post"
	adminContentLoadCategoryFailed = "failed to load content category"
	adminContentLoadTopicFailed    = "failed to load content topic"
	adminContentInvalidLink        = "invalid content link"
	adminContentFieldRequired      = " is required"
	adminContentFieldInvalid       = "invalid "
	adminContentRevisionNotFound   = "content post revision not found"
)

var (
	adminContentIDPattern                                    = regexp.MustCompile(`^[a-z0-9][a-z0-9-]{1,127}$`)
	adminContentRepository repository.AdminContentRepository = repository.NewAdminContentRepository()
)

func normalizeAdminContentLocale(value string, allowAll bool) (string, error) {
	resolved := strings.TrimSpace(strings.ToLower(value))
	switch resolved {
	case "", "all":
		if allowAll {
			return "", nil
		}
		return "", apperrors.BadRequest("content locale is required")
	case adminErrorLocaleEN, adminErrorLocaleTR:
		return resolved, nil
	default:
		return "", apperrors.BadRequest("unsupported content locale")
	}
}

func normalizeAdminContentSource(value string, allowAll bool) (string, error) {
	resolved := strings.TrimSpace(strings.ToLower(value))
	switch resolved {
	case "", "all":
		if allowAll {
			return "", nil
		}
		return "", apperrors.BadRequest("content source is required")
	case "blog", "medium":
		return resolved, nil
	default:
		return "", apperrors.BadRequest("unsupported content source")
	}
}

func normalizeAdminContentID(value, field string) (string, error) {
	resolved := strings.TrimSpace(strings.ToLower(value))
	if resolved == "" {
		return "", apperrors.BadRequest(field + adminContentFieldRequired)
	}
	if len(resolved) > adminContentIDMaxLength || !adminContentIDPattern.MatchString(resolved) {
		return "", apperrors.BadRequest(adminContentFieldInvalid + field)
	}
	return resolved, nil
}

func normalizeAdminContentIDs(values []string, field string) ([]string, error) {
	if len(values) == 0 {
		return []string{}, nil
	}

	seen := make(map[string]struct{}, len(values))
	ids := make([]string, 0, len(values))
	for _, value := range values {
		id, err := normalizeAdminContentID(value, field)
		if err != nil {
			return nil, err
		}
		if _, exists := seen[id]; exists {
			continue
		}
		seen[id] = struct{}{}
		ids = append(ids, id)
	}

	sort.Strings(ids)
	return ids, nil
}

func normalizeAdminContentName(value, field string) (string, error) {
	resolved := strings.TrimSpace(value)
	if resolved == "" {
		return "", apperrors.BadRequest(field + adminContentFieldRequired)
	}
	if len(resolved) > adminContentNameMaxLength {
		return "", apperrors.BadRequest(field + " is too long")
	}
	return resolved, nil
}

func normalizeAdminContentColor(value, field string) (string, error) {
	resolved := strings.TrimSpace(strings.ToLower(value))
	if resolved == "" {
		return "", apperrors.BadRequest(field + adminContentFieldRequired)
	}
	if len(resolved) > adminContentColorMaxLength {
		return "", apperrors.BadRequest(field + " is too long")
	}
	return resolved, nil
}

func normalizeAdminContentLink(value string) (string, error) {
	resolved := strings.TrimSpace(value)
	if resolved == "" {
		return "", nil
	}
	if len(resolved) > adminContentLinkMaxLength {
		return "", apperrors.BadRequest("content link is too long")
	}

	parsed, err := url.Parse(resolved)
	if err != nil {
		return "", apperrors.BadRequest(adminContentInvalidLink)
	}
	scheme := strings.ToLower(strings.TrimSpace(parsed.Scheme))
	if scheme != "http" && scheme != "https" {
		return "", apperrors.BadRequest(adminContentInvalidLink)
	}
	if strings.TrimSpace(parsed.Host) == "" {
		return "", apperrors.BadRequest(adminContentInvalidLink)
	}

	return resolved, nil
}

func toAdminContentError(err error, message string) error {
	switch {
	case errors.Is(err, repository.ErrAdminContentRepositoryUnavailable):
		return apperrors.ServiceUnavailable("admin content management is unavailable", err)
	case errors.Is(err, repository.ErrAdminContentPostNotFound):
		return apperrors.BadRequest(adminContentPostNotFound)
	case errors.Is(err, repository.ErrAdminContentTopicNotFound):
		return apperrors.BadRequest(adminContentTopicNotFound)
	case errors.Is(err, repository.ErrAdminContentCategoryNotFound):
		return apperrors.BadRequest(adminContentCategoryNotFound)
	default:
		return apperrors.Internal(message, err)
	}
}

func marshalAdminContentAuditValue(value any) string {
	if value == nil {
		return ""
	}

	jsonValue, err := json.Marshal(value)
	if err != nil {
		return ""
	}
	return strings.TrimSpace(string(jsonValue))
}

func createAdminContentAuditLog( // NOSONAR
	ctx context.Context,
	adminUser *domain.AdminUser,
	action string,
	scope string,
	locale string,
	code string,
	beforeValue string,
	afterValue string,
) error {
	if adminUser == nil || strings.TrimSpace(adminUser.ID) == "" {
		return apperrors.Unauthorized(adminContentAuthRequired)
	}

	trace, _ := httpapi.RequestTraceFromContext(ctx)
	record := domain.AdminAuditLogRecord{
		ActorID:     strings.TrimSpace(adminUser.ID),
		ActorEmail:  strings.TrimSpace(strings.ToLower(adminUser.Email)),
		Action:      strings.TrimSpace(action),
		Resource:    adminContentAuditResource,
		Scope:       strings.TrimSpace(scope),
		Locale:      strings.TrimSpace(strings.ToLower(locale)),
		Code:        strings.TrimSpace(strings.ToUpper(code)),
		BeforeValue: strings.TrimSpace(beforeValue),
		AfterValue:  strings.TrimSpace(afterValue),
		Status:      adminContentAuditStatusSuccess,
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
