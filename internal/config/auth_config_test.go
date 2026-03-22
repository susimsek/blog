package config

import (
	"testing"
	"time"
)

func TestResolveAdminAndReaderConfigs(t *testing.T) {
	t.Setenv("JWT_SECRET", "secret")
	t.Setenv("SITE_URL", "https://example.com")
	t.Setenv("ADMIN_JWT_ISSUER", "admin-issuer")
	t.Setenv("ADMIN_JWT_AUDIENCE", "admin-audience")
	t.Setenv("ADMIN_ACCESS_COOKIE_NAME", "admin_access_custom")
	t.Setenv("ADMIN_REFRESH_COOKIE_NAME", "admin_refresh_custom")
	t.Setenv("ADMIN_CSRF_COOKIE_NAME", "admin_csrf_custom")
	t.Setenv("ADMIN_ACCESS_TTL", "30m")
	t.Setenv("ADMIN_REFRESH_TTL", "48h")
	t.Setenv("ADMIN_REMEMBER_REFRESH_TTL", "96h")

	adminCfg := ResolveAdminConfig()
	if adminCfg.JWTIssuer != "admin-issuer" || adminCfg.JWTAudience != "admin-audience" {
		t.Fatalf("unexpected admin config: %#v", adminCfg)
	}
	if adminCfg.AccessCookieName != "admin_access_custom" || adminCfg.RefreshTTL != 48*time.Hour || !adminCfg.SecureCookies {
		t.Fatalf("unexpected admin cookie/ttl config: %#v", adminCfg)
	}

	t.Setenv("READER_JWT_ISSUER", "reader-issuer")
	t.Setenv("READER_JWT_AUDIENCE", "reader-audience")
	t.Setenv("READER_ACCESS_COOKIE_NAME", "reader_access_custom")
	t.Setenv("READER_REFRESH_COOKIE_NAME", "reader_refresh_custom")
	t.Setenv("READER_ACCESS_TTL", "45m")
	t.Setenv("READER_REFRESH_TTL", "72h")
	t.Setenv("READER_REMEMBER_REFRESH_TTL", "120h")

	readerCfg := ResolveReaderConfig()
	if readerCfg.JWTIssuer != "reader-issuer" || readerCfg.JWTAudience != "reader-audience" {
		t.Fatalf("unexpected reader config: %#v", readerCfg)
	}
	if readerCfg.AccessCookieName != "reader_access_custom" || readerCfg.RefreshTTL != 72*time.Hour || !readerCfg.SecureCookies {
		t.Fatalf("unexpected reader cookie/ttl config: %#v", readerCfg)
	}
}

func TestResolveOAuthConfigs(t *testing.T) {
	t.Setenv("GITHUB_CLIENT_ID", "github-id")
	t.Setenv("GITHUB_CLIENT_SECRET", "github-secret")
	t.Setenv("GOOGLE_CLIENT_ID", "google-id")
	t.Setenv("GOOGLE_CLIENT_SECRET", "google-secret")

	adminGithub := ResolveAdminGithubConfig()
	adminGoogle := ResolveAdminGoogleConfig()
	readerGithub := ResolveReaderGithubConfig()
	readerGoogle := ResolveReaderGoogleConfig()

	if !adminGithub.Enabled() || !adminGoogle.Enabled() || !readerGithub.Enabled() || !readerGoogle.Enabled() {
		t.Fatal("expected oauth configs to be enabled")
	}
}
