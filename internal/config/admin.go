package config

import (
	"strings"
	"time"
)

const (
	DefaultAdminAccessCookieName   = "admin_access"
	DefaultAdminRefreshCookieName  = "admin_refresh"
	DefaultAdminCSRFCookieName     = "admin_csrf"
	DefaultAdminJWTIssuer          = "blog-admin"
	DefaultAdminJWTAudience        = "blog-admin"
	DefaultAdminAccessTTL          = 12 * time.Hour
	DefaultAdminRefreshTTL         = 7 * 24 * time.Hour
	DefaultAdminRememberRefreshTTL = 30 * 24 * time.Hour
)

type AdminConfig struct {
	JWTSecret          string
	AccessCookieName   string
	RefreshCookieName  string
	CSRFCookieName     string
	JWTIssuer          string
	JWTAudience        string
	AccessTTL          time.Duration
	RefreshTTL         time.Duration
	RememberRefreshTTL time.Duration
	SecureCookies      bool
}

func ResolveAdminConfig() AdminConfig {
	issuer := strings.TrimSpace(getenv("ADMIN_JWT_ISSUER"))
	if issuer == "" {
		issuer = DefaultAdminJWTIssuer
	}

	audience := strings.TrimSpace(getenv("ADMIN_JWT_AUDIENCE"))
	if audience == "" {
		audience = DefaultAdminJWTAudience
	}

	accessCookieName := strings.TrimSpace(getenv("ADMIN_ACCESS_COOKIE_NAME"))
	if accessCookieName == "" {
		accessCookieName = DefaultAdminAccessCookieName
	}

	refreshCookieName := strings.TrimSpace(getenv("ADMIN_REFRESH_COOKIE_NAME"))
	if refreshCookieName == "" {
		refreshCookieName = DefaultAdminRefreshCookieName
	}

	csrfCookieName := strings.TrimSpace(getenv("ADMIN_CSRF_COOKIE_NAME"))
	if csrfCookieName == "" {
		csrfCookieName = DefaultAdminCSRFCookieName
	}

	return AdminConfig{
		JWTSecret:          strings.TrimSpace(getenv("JWT_SECRET")),
		AccessCookieName:   accessCookieName,
		RefreshCookieName:  refreshCookieName,
		CSRFCookieName:     csrfCookieName,
		JWTIssuer:          issuer,
		JWTAudience:        audience,
		AccessTTL:          resolveDurationEnv("ADMIN_ACCESS_TTL", DefaultAdminAccessTTL),
		RefreshTTL:         resolveDurationEnv("ADMIN_REFRESH_TTL", DefaultAdminRefreshTTL),
		RememberRefreshTTL: resolveDurationEnv("ADMIN_REMEMBER_REFRESH_TTL", DefaultAdminRememberRefreshTTL),
		SecureCookies:      resolveAdminSecureCookie(),
	}
}

func resolveDurationEnv(name string, fallback time.Duration) time.Duration {
	rawValue := strings.TrimSpace(getenv(name))
	if rawValue == "" {
		return fallback
	}

	parsed, err := time.ParseDuration(rawValue)
	if err != nil || parsed <= 0 {
		return fallback
	}

	return parsed
}

func resolveAdminSecureCookie() bool {
	if value, ok := resolveOptionalBoolEnv("COOKIE_SECURE"); ok {
		return value
	}

	siteURL := strings.ToLower(strings.TrimSpace(getenv("SITE_URL")))
	return strings.HasPrefix(siteURL, "https://")
}
