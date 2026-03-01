package config

import (
	"testing"
	"time"
)

func TestResolveRequiredEnvHelpers(t *testing.T) {
	t.Setenv("API_CORS_ORIGIN", " https://example.com ")
	t.Setenv("MONGODB_DATABASE", " blog ")
	t.Setenv("MONGODB_URI", " mongodb://localhost ")
	t.Setenv("SITE_URL", " https://example.com/ ")
	t.Setenv("CRON_SECRET", " cron-secret ")
	t.Setenv("NEWSLETTER_UNSUBSCRIBE_SECRET", " unsubscribe-secret ")

	origin, err := ResolveAllowedOriginRequired()
	if err != nil || origin != "https://example.com" {
		t.Fatalf("ResolveAllowedOriginRequired() = %q, %v", origin, err)
	}
	if ResolveAllowedOriginOptional() != "https://example.com" {
		t.Fatalf("ResolveAllowedOriginOptional() mismatch")
	}

	databaseConfig, err := ResolveDatabaseConfig()
	if err != nil {
		t.Fatalf("ResolveDatabaseConfig() error = %v", err)
	}
	if databaseConfig.Name != "blog" || databaseConfig.URI != "mongodb://localhost" {
		t.Fatalf("ResolveDatabaseConfig() = %#v", databaseConfig)
	}

	siteURL, err := ResolveSiteURL()
	if err != nil || siteURL != "https://example.com" {
		t.Fatalf("ResolveSiteURL() = %q, %v", siteURL, err)
	}
	if got := ResolveSiteURLOrRoot(); got != "https://example.com" {
		t.Fatalf("ResolveSiteURLOrRoot() = %q", got)
	}

	if cronSecret, err := ResolveCronSecret(); err != nil || cronSecret != "cron-secret" {
		t.Fatalf("ResolveCronSecret() = %q, %v", cronSecret, err)
	}
	if unsubscribeSecret, err := ResolveUnsubscribeSecret(); err != nil || unsubscribeSecret != "unsubscribe-secret" {
		t.Fatalf("ResolveUnsubscribeSecret() = %q, %v", unsubscribeSecret, err)
	}
}

func TestResolveSiteURLOrRootAndPositiveIntFallbacks(t *testing.T) {
	t.Setenv("SITE_URL", "")
	if got := ResolveSiteURLOrRoot(); got != "/" {
		t.Fatalf("ResolveSiteURLOrRoot() = %q", got)
	}

	t.Setenv("NEWSLETTER_BATCH", "25")
	if got := ResolvePositiveIntEnv("NEWSLETTER_BATCH", 10); got != 25 {
		t.Fatalf("ResolvePositiveIntEnv() = %d", got)
	}

	t.Setenv("NEWSLETTER_BATCH", "-5")
	if got := ResolvePositiveIntEnv("NEWSLETTER_BATCH", 10); got != 10 {
		t.Fatalf("negative ResolvePositiveIntEnv() = %d", got)
	}

	t.Setenv("NEWSLETTER_BATCH", "nope")
	if got := ResolvePositiveIntEnv("NEWSLETTER_BATCH", 10); got != 10 {
		t.Fatalf("invalid ResolvePositiveIntEnv() = %d", got)
	}
}

func TestResolveBoolEnv(t *testing.T) {
	originalGetenv := getenv
	t.Cleanup(func() {
		getenv = originalGetenv
	})

	tests := []struct {
		name     string
		envValue string
		fallback bool
		want     bool
	}{
		{name: "defaults to fallback", envValue: "", fallback: true, want: true},
		{name: "parses true", envValue: "true", fallback: false, want: true},
		{name: "parses false", envValue: "false", fallback: true, want: false},
		{name: "parses on", envValue: "on", fallback: false, want: true},
		{name: "invalid value falls back", envValue: "maybe", fallback: true, want: true},
	}

	for _, testCase := range tests {
		t.Run(testCase.name, func(t *testing.T) {
			getenv = func(_ string) string {
				return testCase.envValue
			}

			if got := resolveBoolEnv("TEST_ENV", testCase.fallback); got != testCase.want {
				t.Fatalf("resolveBoolEnv() = %v, want %v", got, testCase.want)
			}
		})
	}
}

func TestDatabaseHelpers(t *testing.T) {
	t.Setenv("MONGODB_DATABASE", "blog")
	t.Setenv("MONGODB_URI", "mongodb://localhost:27017")

	if got, err := ResolveDatabaseName(); err != nil || got != "blog" {
		t.Fatalf("ResolveDatabaseName() = %q, %v", got, err)
	}
	if got, err := ResolveMongoURI(); err != nil || got != "mongodb://localhost:27017" {
		t.Fatalf("ResolveMongoURI() = %q, %v", got, err)
	}

	clientOptions := BuildMongoClientOptions(DatabaseConfig{
		URI:                    "mongodb://localhost:27017",
		ConnectTimeout:         3 * time.Second,
		ServerSelectionTimeout: 4 * time.Second,
	}, "blog-api-test")
	if clientOptions.AppName == nil || *clientOptions.AppName != "blog-api-test" {
		t.Fatalf("BuildMongoClientOptions().AppName = %#v", clientOptions.AppName)
	}
	if clientOptions.ConnectTimeout == nil || *clientOptions.ConnectTimeout != 3*time.Second {
		t.Fatalf("BuildMongoClientOptions().ConnectTimeout = %#v", clientOptions.ConnectTimeout)
	}
	if clientOptions.ServerSelectionTimeout == nil || *clientOptions.ServerSelectionTimeout != 4*time.Second {
		t.Fatalf("BuildMongoClientOptions().ServerSelectionTimeout = %#v", clientOptions.ServerSelectionTimeout)
	}
}
