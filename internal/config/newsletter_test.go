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

		if cfg.SiteURL != "https://example.com" {
			t.Fatalf("SiteURL = %q", cfg.SiteURL)
		}
		if cfg.CronSecret != "cron-secret" {
			t.Fatalf("CronSecret = %q", cfg.CronSecret)
		}
		if cfg.UnsubscribeSecret != "unsubscribe-secret" {
			t.Fatalf("UnsubscribeSecret = %q", cfg.UnsubscribeSecret)
		}
		if cfg.MaxRecipientsPerRun != DefaultNewsletterMaxRecipientsPerRun {
			t.Fatalf("MaxRecipientsPerRun = %d", cfg.MaxRecipientsPerRun)
		}
		if cfg.MaxItemAge != time.Duration(DefaultNewsletterMaxItemAgeHours)*time.Hour {
			t.Fatalf("MaxItemAge = %s", cfg.MaxItemAge)
		}
		if cfg.UnsubscribeTokenTTL != time.Duration(DefaultUnsubscribeTokenTTLHours)*time.Hour {
			t.Fatalf("UnsubscribeTokenTTL = %s", cfg.UnsubscribeTokenTTL)
		}
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

		if cfg.MaxRecipientsPerRun != 25 {
			t.Fatalf("MaxRecipientsPerRun = %d", cfg.MaxRecipientsPerRun)
		}
		if cfg.MaxItemAge != 12*time.Hour {
			t.Fatalf("MaxItemAge = %s", cfg.MaxItemAge)
		}
		if cfg.UnsubscribeTokenTTL != 48*time.Hour {
			t.Fatalf("UnsubscribeTokenTTL = %s", cfg.UnsubscribeTokenTTL)
		}
	})
}
