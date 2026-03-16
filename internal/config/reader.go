package config

import (
	"strings"
	"time"
)

const (
	DefaultReaderAccessCookieName   = "reader_access"
	DefaultReaderRefreshCookieName  = "reader_refresh"
	DefaultReaderJWTIssuer          = "blog-reader"
	DefaultReaderJWTAudience        = "blog-reader"
	DefaultReaderAccessTTL          = 12 * time.Hour
	DefaultReaderRefreshTTL         = 7 * 24 * time.Hour
	DefaultReaderRememberRefreshTTL = 30 * 24 * time.Hour
)

type ReaderConfig struct {
	JWTSecret          string
	AccessCookieName   string
	RefreshCookieName  string
	JWTIssuer          string
	JWTAudience        string
	AccessTTL          time.Duration
	RefreshTTL         time.Duration
	RememberRefreshTTL time.Duration
	SecureCookies      bool
}

func ResolveReaderConfig() ReaderConfig {
	issuer := strings.TrimSpace(getenv("READER_JWT_ISSUER"))
	if issuer == "" {
		issuer = DefaultReaderJWTIssuer
	}

	audience := strings.TrimSpace(getenv("READER_JWT_AUDIENCE"))
	if audience == "" {
		audience = DefaultReaderJWTAudience
	}

	accessCookieName := strings.TrimSpace(getenv("READER_ACCESS_COOKIE_NAME"))
	if accessCookieName == "" {
		accessCookieName = DefaultReaderAccessCookieName
	}

	refreshCookieName := strings.TrimSpace(getenv("READER_REFRESH_COOKIE_NAME"))
	if refreshCookieName == "" {
		refreshCookieName = DefaultReaderRefreshCookieName
	}

	return ReaderConfig{
		JWTSecret:          strings.TrimSpace(getenv("JWT_SECRET")),
		AccessCookieName:   accessCookieName,
		RefreshCookieName:  refreshCookieName,
		JWTIssuer:          issuer,
		JWTAudience:        audience,
		AccessTTL:          resolveDurationEnv("READER_ACCESS_TTL", DefaultReaderAccessTTL),
		RefreshTTL:         resolveDurationEnv("READER_REFRESH_TTL", DefaultReaderRefreshTTL),
		RememberRefreshTTL: resolveDurationEnv("READER_REMEMBER_REFRESH_TTL", DefaultReaderRememberRefreshTTL),
		SecureCookies:      resolveReaderSecureCookie(),
	}
}

func resolveReaderSecureCookie() bool {
	if value, ok := resolveOptionalBoolEnv("COOKIE_SECURE"); ok {
		return value
	}

	siteURL := strings.ToLower(strings.TrimSpace(getenv("SITE_URL")))
	return strings.HasPrefix(siteURL, "https://")
}
