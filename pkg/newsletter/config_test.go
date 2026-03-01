package newsletter

import "testing"

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

	databaseName, err := ResolveDatabaseName()
	if err != nil || databaseName != "blog" {
		t.Fatalf("ResolveDatabaseName() = %q, %v", databaseName, err)
	}

	mongoURI, err := ResolveMongoURI()
	if err != nil || mongoURI != "mongodb://localhost" {
		t.Fatalf("ResolveMongoURI() = %q, %v", mongoURI, err)
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

func TestResolveSMTPConfig(t *testing.T) {
	t.Setenv("GMAIL_SMTP_USER", "sender@example.com")
	t.Setenv("GMAIL_SMTP_APP_PASSWORD", "app-password")

	cfg, err := ResolveSMTPConfig()
	if err != nil {
		t.Fatalf("ResolveSMTPConfig() error = %v", err)
	}
	if cfg.Host != defaultSMTPHost || cfg.Port != defaultSMTPPort {
		t.Fatalf("default smtp config = %#v", cfg)
	}
	if cfg.FromMail != "sender@example.com" || cfg.FromName != "Suayb's Blog" {
		t.Fatalf("default sender config = %#v", cfg)
	}

	t.Setenv("GMAIL_SMTP_HOST", "smtp.example.com")
	t.Setenv("GMAIL_SMTP_PORT", "2525")
	t.Setenv("GMAIL_FROM_EMAIL", "noreply@example.com")
	t.Setenv("GMAIL_FROM_NAME", "Blog Mailer")

	cfg, err = ResolveSMTPConfig()
	if err != nil {
		t.Fatalf("ResolveSMTPConfig() error = %v", err)
	}
	if cfg.Host != "smtp.example.com" || cfg.Port != "2525" {
		t.Fatalf("custom smtp config = %#v", cfg)
	}
	if cfg.FromMail != "noreply@example.com" || cfg.FromName != "Blog Mailer" {
		t.Fatalf("custom sender config = %#v", cfg)
	}
}
