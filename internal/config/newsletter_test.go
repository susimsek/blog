package config

import (
	"testing"
	"time"
)

func TestResolveNewsletterConfig(t *testing.T) {
	t.Run("uses defaults", func(t *testing.T) {
		t.Setenv("SITE_URL", " https://example.com/ ")
		t.Setenv("CRON_SECRET", " cron-secret ")
		t.Setenv("NEWSLETTER_UNSUBSCRIBE_SECRET", " unsubscribe-secret ")

		cfg, err := ResolveNewsletterConfig()
		if err != nil {
			t.Fatalf("ResolveNewsletterConfig() error = %v", err)
		}
		assertDefaultNewsletterConfig(t, cfg)
	})

	t.Run("uses configured limits", func(t *testing.T) {
		t.Setenv("SITE_URL", "https://example.com")
		t.Setenv("CRON_SECRET", "cron-secret")
		t.Setenv("NEWSLETTER_UNSUBSCRIBE_SECRET", "unsubscribe-secret")
		t.Setenv("NEWSLETTER_MAX_RECIPIENTS_PER_RUN", "25")
		t.Setenv("NEWSLETTER_MAX_ITEM_AGE_HOURS", "12")
		t.Setenv("NEWSLETTER_UNSUBSCRIBE_TOKEN_TTL_HOURS", "48")

		cfg, err := ResolveNewsletterConfig()
		if err != nil {
			t.Fatalf("ResolveNewsletterConfig() error = %v", err)
		}

		assertNewsletterConfigLimits(t, cfg, 25, 12*time.Hour, 48*time.Hour)
	})
}

func assertDefaultNewsletterConfig(t *testing.T, cfg NewsletterConfig) {
	t.Helper()
	if cfg.SiteURL != "https://example.com" || cfg.CronSecret != "cron-secret" || cfg.UnsubscribeSecret != "unsubscribe-secret" {
		t.Fatalf("newsletter config secrets/site = %#v", cfg)
	}
	assertNewsletterConfigLimits(
		t,
		cfg,
		DefaultNewsletterMaxRecipientsPerRun,
		time.Duration(DefaultNewsletterMaxItemAgeHours)*time.Hour,
		time.Duration(DefaultUnsubscribeTokenTTLHours)*time.Hour,
	)
}

func assertNewsletterConfigLimits(t *testing.T, cfg NewsletterConfig, recipients int, maxAge, tokenTTL time.Duration) {
	t.Helper()
	if cfg.MaxRecipientsPerRun != recipients || cfg.MaxItemAge != maxAge || cfg.UnsubscribeTokenTTL != tokenTTL {
		t.Fatalf("newsletter limits = %d/%s/%s", cfg.MaxRecipientsPerRun, cfg.MaxItemAge, cfg.UnsubscribeTokenTTL)
	}
}
