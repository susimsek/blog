package service

import (
	"context"
	"maps"
	"strings"
	"sync"
	"time"

	appconfig "suaybsimsek.com/blog-api/internal/config"
	"suaybsimsek.com/blog-api/internal/repository"
	"suaybsimsek.com/blog-api/pkg/httpapi"
	newsletterpkg "suaybsimsek.com/blog-api/pkg/newsletter"
)

const (
	adminErrorMessageScope     = "admin_graphql"
	adminErrorCatalogTTL       = 60 * time.Second
	adminErrorLocaleEN         = "en"
	adminErrorLocaleTR         = "tr"
	adminErrorCodeBadRequest   = "BAD_REQUEST"
	adminErrorCodeUnauthorized = "UNAUTHORIZED"
)

var adminErrorMessageRepository repository.ErrorMessageRepository = repository.NewErrorMessageRepository()

var (
	adminErrorCatalogMu     sync.RWMutex
	adminErrorCatalogCache  map[string]map[string]string
	adminErrorCatalogExpiry time.Time
)

var defaultAdminErrorCatalog = resolveEmbeddedAdminErrorCatalog()

func resolveEmbeddedAdminErrorCatalog() map[string]map[string]string {
	catalog, err := appconfig.LoadEmbeddedAdminErrorCatalog()
	if err == nil && len(catalog) > 0 {
		return catalog
	}

	return map[string]map[string]string{
		adminErrorLocaleEN: {
			"INVALID_CREDENTIALS":      "Invalid email or password.",
			"ADMIN_SESSION_INVALID":    "Your session expired. Sign in again.",
			"ADMIN_AUTH_REQUIRED":      "Your session expired. Sign in again.",
			"INVALID_CSRF_TOKEN":       "Security verification failed. Refresh the page and try again.",
			"SERVICE_UNAVAILABLE":      "Admin service is temporarily unavailable. Please try again.",
			adminErrorCodeBadRequest:   "Request is invalid.",
			adminErrorCodeUnauthorized: "Authentication is required.",
		},
	}
}

func ResolveAdminErrorMessage(ctx context.Context, code, fallbackMessage string) string {
	normalizedCode := strings.TrimSpace(strings.ToUpper(code))
	resolvedFallback := strings.TrimSpace(fallbackMessage)
	if normalizedCode == "" {
		if resolvedFallback != "" {
			return resolvedFallback
		}
		return "Admin request failed."
	}

	locale := resolveAdminErrorLocale(ctx)
	catalog := getAdminErrorCatalog(ctx)

	if localized := lookupAdminErrorMessage(catalog, locale, normalizedCode); localized != "" {
		return localized
	}
	if localized := lookupAdminErrorMessage(catalog, adminErrorLocaleEN, normalizedCode); localized != "" {
		return localized
	}
	if resolvedFallback != "" {
		return resolvedFallback
	}

	return "Admin request failed."
}

func resolveAdminErrorLocale(ctx context.Context) string {
	acceptLanguage := ""
	if trace, ok := httpapi.RequestTraceFromContext(ctx); ok {
		acceptLanguage = strings.TrimSpace(trace.AcceptLang)
	}
	return newsletterpkg.ResolveLocale("", acceptLanguage)
}

func getAdminErrorCatalog(ctx context.Context) map[string]map[string]string {
	now := time.Now().UTC()

	adminErrorCatalogMu.RLock()
	if adminErrorCatalogCache != nil && now.Before(adminErrorCatalogExpiry) {
		cached := adminErrorCatalogCache
		adminErrorCatalogMu.RUnlock()
		return cached
	}
	adminErrorCatalogMu.RUnlock()

	adminErrorCatalogMu.Lock()
	defer adminErrorCatalogMu.Unlock()

	if adminErrorCatalogCache != nil && now.Before(adminErrorCatalogExpiry) {
		return adminErrorCatalogCache
	}

	catalog := cloneAdminErrorCatalog(defaultAdminErrorCatalog)

	records, err := adminErrorMessageRepository.ListByScope(ctx, adminErrorMessageScope)
	if err == nil {
		for _, record := range records {
			locale := strings.TrimSpace(strings.ToLower(record.Locale))
			code := strings.TrimSpace(strings.ToUpper(record.Code))
			message := strings.TrimSpace(record.Message)
			if locale == "" || code == "" || message == "" {
				continue
			}

			localeCatalog, exists := catalog[locale]
			if !exists {
				localeCatalog = make(map[string]string)
				catalog[locale] = localeCatalog
			}
			localeCatalog[code] = message
		}
	}

	adminErrorCatalogCache = catalog
	adminErrorCatalogExpiry = now.Add(adminErrorCatalogTTL)
	return adminErrorCatalogCache
}

func lookupAdminErrorMessage(catalog map[string]map[string]string, locale, code string) string {
	localeCatalog, ok := catalog[locale]
	if !ok {
		return ""
	}

	return strings.TrimSpace(localeCatalog[code])
}

func InvalidateAdminErrorCatalogCache() {
	adminErrorCatalogMu.Lock()
	defer adminErrorCatalogMu.Unlock()

	adminErrorCatalogCache = nil
	adminErrorCatalogExpiry = time.Time{}
}

func cloneAdminErrorCatalog(source map[string]map[string]string) map[string]map[string]string {
	cloned := make(map[string]map[string]string, len(source))
	for locale, items := range source {
		localeItems := make(map[string]string, len(items))
		maps.Copy(localeItems, items)
		cloned[locale] = localeItems
	}
	return cloned
}
