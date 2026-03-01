package graphql

import (
	"strings"

	"suaybsimsek.com/blog-api/internal/graphql/model"
)

const (
	statusServiceUnavailable = "service-unavailable"
	statusInvalidPostID      = "invalid-post-id"
)

func mapLocaleInput(value model.Locale) string {
	switch value {
	case model.LocaleTr:
		return "tr"
	default:
		return "en"
	}
}

func mapLocaleOutput(value string) model.Locale {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "tr":
		return model.LocaleTr
	default:
		return model.LocaleEn
	}
}

func mapResolvedSortOrder(value string) *model.SortOrder {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "asc":
		sortOrder := model.SortOrderAsc
		return &sortOrder
	case "desc":
		sortOrder := model.SortOrderDesc
		return &sortOrder
	default:
		return nil
	}
}

func mapContentQueryStatus(value string) model.ContentQueryStatus {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "success":
		return model.ContentQueryStatusSuccess
	case statusServiceUnavailable:
		return model.ContentQueryStatusServiceUnavailable
	case "invalid-scope-ids":
		return model.ContentQueryStatusInvalidScopeIDS
	case statusInvalidPostID:
		return model.ContentQueryStatusInvalidPostID
	case "not-found":
		return model.ContentQueryStatusNotFound
	default:
		return model.ContentQueryStatusFailed
	}
}

func mapPostMetricStatus(value string) model.PostMetricStatus {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "success":
		return model.PostMetricStatusSuccess
	case statusServiceUnavailable:
		return model.PostMetricStatusServiceUnavailable
	case statusInvalidPostID:
		return model.PostMetricStatusInvalidPostID
	default:
		return model.PostMetricStatusFailed
	}
}

func mapNewsletterMutationStatus(value string) model.NewsletterMutationStatus {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "success":
		return model.NewsletterMutationStatusSuccess
	case "invalid-email":
		return model.NewsletterMutationStatusInvalidEmail
	case "rate-limited":
		return model.NewsletterMutationStatusRateLimited
	case "invalid-link":
		return model.NewsletterMutationStatusInvalidLink
	case "config-error":
		return model.NewsletterMutationStatusConfigError
	case statusServiceUnavailable:
		return model.NewsletterMutationStatusServiceUnavailable
	case "expired":
		return model.NewsletterMutationStatusExpired
	case "failed":
		return model.NewsletterMutationStatusFailed
	default:
		return model.NewsletterMutationStatusUnknownError
	}
}
