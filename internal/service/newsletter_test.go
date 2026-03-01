package service

import (
	"context"
	"errors"
	"testing"
	"time"

	newsletterpkg "suaybsimsek.com/blog-api/pkg/newsletter"
)

type newsletterStubRepository struct {
	getStatusByEmail          func(context.Context, string) (string, bool, error)
	upsertPendingSubscription func(context.Context, PendingSubscription) error
	updatePendingSubscription func(context.Context, PendingSubscription) error
	confirmByTokenHash        func(context.Context, string, time.Time) (bool, error)
	unsubscribeByEmail        func(context.Context, string, time.Time) error
}

func (stub newsletterStubRepository) GetStatusByEmail(ctx context.Context, email string) (string, bool, error) {
	return stub.getStatusByEmail(ctx, email)
}

func (stub newsletterStubRepository) UpsertPendingSubscription(ctx context.Context, input PendingSubscription) error {
	return stub.upsertPendingSubscription(ctx, input)
}

func (stub newsletterStubRepository) UpdatePendingSubscription(ctx context.Context, input PendingSubscription) error {
	return stub.updatePendingSubscription(ctx, input)
}

func (stub newsletterStubRepository) ConfirmByTokenHash(ctx context.Context, tokenHash string, now time.Time) (bool, error) {
	return stub.confirmByTokenHash(ctx, tokenHash, now)
}

func (stub newsletterStubRepository) UnsubscribeByEmail(ctx context.Context, email string, now time.Time) error {
	return stub.unsubscribeByEmail(ctx, email, now)
}

func TestHelpersAndRateLimiter(t *testing.T) {
	if _, err := normalizeEmail(" bad "); err == nil {
		t.Fatal("expected invalid email")
	}
	if email, err := normalizeEmail(" Reader@Example.com "); err != nil || email != "reader@example.com" {
		t.Fatalf("normalizeEmail() = %q, %v", email, err)
	}
	if got := normalizeFormName(""); got != defaultNewsletterFormName {
		t.Fatalf("normalizeFormName() = %q", got)
	}
	if got := normalizeFormName("012345678901234567890123456789012345678901234567890123456789012345"); len(got) != 64 {
		t.Fatalf("normalizeFormName length = %d", len(got))
	}
	if tags := normalizeTags([]string{" react ", "", "react", "tooling", "012345678901234567890123456789012345678901234567890"}); len(tags) != 2 {
		t.Fatalf("normalizeTags() = %#v", tags)
	}
	if tags := normalizeTags(nil); len(tags) != 1 || tags[0] != defaultNewsletterTags[0] {
		t.Fatalf("default tags = %#v", tags)
	}
	if got := hashValue("value"); got == "" || got == "value" {
		t.Fatalf("hashValue() = %q", got)
	}
	if got := hashValue(""); got != "" {
		t.Fatalf("hashValue(empty) = %q", got)
	}
	if _, err := buildConfirmURL("bad-url", "token", "en"); err == nil {
		t.Fatal("expected invalid site url")
	}
	if url, err := buildConfirmURL("https://example.com/blog/", "token", "tr"); err != nil || url != "https://example.com/blog/tr/callback?operation=confirm&token=token" {
		t.Fatalf("buildConfirmURL() = %q, %v", url, err)
	}

	limiter := newRateLimiter(2, time.Hour)
	if !limiter.allow("127.0.0.1") || !limiter.allow("127.0.0.1") || limiter.allow("127.0.0.1") {
		t.Fatal("unexpected rate limiter result")
	}
	if !limiter.allow("") {
		t.Fatal("empty client id should be allowed")
	}
}

func TestRateLimiterPrunesStaleEntries(t *testing.T) {
	limiter := &rateLimiter{
		maxAttempts:     2,
		window:          time.Hour,
		cleanupInterval: time.Minute,
		lastCleanup:     time.Now().UTC().Add(-2 * time.Hour),
		entries: map[string][]time.Time{
			"stale":  {time.Now().UTC().Add(-2 * time.Hour)},
			"active": {time.Now().UTC().Add(-5 * time.Minute)},
		},
	}

	if !limiter.allow("fresh") {
		t.Fatal("fresh client should be allowed")
	}
	if _, exists := limiter.entries["stale"]; exists {
		t.Fatalf("expected stale entry to be pruned: %#v", limiter.entries)
	}
	if _, exists := limiter.entries["active"]; !exists {
		t.Fatalf("expected active entry to be preserved: %#v", limiter.entries)
	}
}

func TestSendConfirmationEmailReturnsSMTPError(t *testing.T) {
	err := sendConfirmationEmail(
		newsletterpkg.SMTPConfig{
			Host:     "127.0.0.1",
			Port:     "1",
			Username: "user",
			Password: "pass",
			FromMail: "noreply@example.com",
		},
		"reader@example.com",
		"https://example.com/en/callback?operation=confirm&token=abc",
		newsletterpkg.LocaleEN,
		"https://example.com",
	)
	if err == nil {
		t.Fatal("expected smtp failure")
	}
}

func TestSubscribeAndResend(t *testing.T) {
	originalRepository := newsletterRepository
	originalResolveSiteURLFn := resolveSiteURLFn
	originalResolveSMTPConfigFn := resolveSMTPConfigFn
	originalSendConfirmationEmailFn := sendConfirmationEmailFn
	originalGenerateConfirmTokenFn := generateConfirmTokenFn
	originalNowUTCFn := nowUTCFn
	originalSubscribeLimiter := subscribeLimiter
	originalResendLimiter := resendLimiter
	t.Cleanup(func() {
		newsletterRepository = originalRepository
		resolveSiteURLFn = originalResolveSiteURLFn
		resolveSMTPConfigFn = originalResolveSMTPConfigFn
		sendConfirmationEmailFn = originalSendConfirmationEmailFn
		generateConfirmTokenFn = originalGenerateConfirmTokenFn
		nowUTCFn = originalNowUTCFn
		subscribeLimiter = originalSubscribeLimiter
		resendLimiter = originalResendLimiter
	})

	fixedNow := time.Date(2026, time.March, 1, 12, 0, 0, 0, time.UTC)
	resolveSiteURLFn = func() (string, error) { return "https://example.com", nil }
	resolveSMTPConfigFn = func() (newsletterpkg.SMTPConfig, error) {
		return newsletterpkg.SMTPConfig{Host: "smtp.example.com", Port: "2525"}, nil
	}
	sendConfirmationEmailFn = func(cfg newsletterpkg.SMTPConfig, recipientEmail, confirmURL, locale, siteURL string) error {
		if recipientEmail != "reader@example.com" || locale != "tr" || siteURL != "https://example.com" || confirmURL == "" {
			t.Fatalf("sendConfirmationEmailFn args = %#v %q %q %q", cfg, recipientEmail, confirmURL, locale)
		}
		return nil
	}
	generateConfirmTokenFn = func() (string, error) { return "token-123", nil }
	nowUTCFn = func() time.Time { return fixedNow }
	subscribeLimiter = newRateLimiter(5, time.Minute)
	resendLimiter = newRateLimiter(5, time.Minute)

	var stored PendingSubscription
	var updated PendingSubscription
	newsletterRepository = newsletterStubRepository{
		getStatusByEmail: func(_ context.Context, email string) (string, bool, error) {
			if email != "reader@example.com" {
				t.Fatalf("email lookup = %q", email)
			}
			return "pending", true, nil
		},
		upsertPendingSubscription: func(_ context.Context, input PendingSubscription) error {
			stored = input
			return nil
		},
		updatePendingSubscription: func(_ context.Context, input PendingSubscription) error {
			updated = input
			return nil
		},
		confirmByTokenHash: func(context.Context, string, time.Time) (bool, error) { return false, nil },
		unsubscribeByEmail: func(context.Context, string, time.Time) error { return nil },
	}

	subscribeResult := Subscribe(context.Background(), SubscribeInput{
		Locale:   "tr",
		Email:    " Reader@Example.com ",
		Tags:     []string{"news", "news", ""},
		FormName: " footer-signup ",
	}, RequestMetadata{ClientIP: "127.0.0.1", UserAgent: "Browser", AcceptLanguage: "tr-TR"})
	if subscribeResult.Status != "success" {
		t.Fatalf("Subscribe() = %#v", subscribeResult)
	}
	if stored.Email != "reader@example.com" || stored.Locale != "tr" || stored.Source != defaultNewsletterSourceName {
		t.Fatalf("stored = %#v", stored)
	}
	if len(stored.Tags) != 1 || stored.Tags[0] != "news" || stored.FormName != "footer-signup" {
		t.Fatalf("stored tags/form = %#v", stored)
	}
	if stored.ConfirmTokenHash == "" || stored.ConfirmTokenExpiresAt != fixedNow.Add(newsletterConfirmTokenTTL) {
		t.Fatalf("stored token data = %#v", stored)
	}

	resendResult := Resend(context.Background(), ResendInput{
		Locale: "tr",
		Email:  "reader@example.com",
	}, RequestMetadata{ClientIP: "127.0.0.2", UserAgent: "Browser", AcceptLanguage: "tr-TR"})
	if resendResult.Status != "success" {
		t.Fatalf("Resend() = %#v", resendResult)
	}
	if updated.Email != "reader@example.com" || updated.Locale != "tr" || updated.ConfirmTokenHash == "" {
		t.Fatalf("updated = %#v", updated)
	}
}

func TestNewsletterServiceBranches(t *testing.T) {
	originalRepository := newsletterRepository
	originalResolveSiteURLFn := resolveSiteURLFn
	originalResolveSMTPConfigFn := resolveSMTPConfigFn
	originalResolveDatabaseNameFn := resolveDatabaseNameFn
	originalResolveUnsubscribeSecretFn := resolveUnsubscribeSecretFn
	originalParseUnsubscribeTokenFn := parseUnsubscribeTokenFn
	originalSendConfirmationEmailFn := sendConfirmationEmailFn
	originalGenerateConfirmTokenFn := generateConfirmTokenFn
	originalNowUTCFn := nowUTCFn
	originalSubscribeLimiter := subscribeLimiter
	originalResendLimiter := resendLimiter
	t.Cleanup(func() {
		newsletterRepository = originalRepository
		resolveSiteURLFn = originalResolveSiteURLFn
		resolveSMTPConfigFn = originalResolveSMTPConfigFn
		resolveDatabaseNameFn = originalResolveDatabaseNameFn
		resolveUnsubscribeSecretFn = originalResolveUnsubscribeSecretFn
		parseUnsubscribeTokenFn = originalParseUnsubscribeTokenFn
		sendConfirmationEmailFn = originalSendConfirmationEmailFn
		generateConfirmTokenFn = originalGenerateConfirmTokenFn
		nowUTCFn = originalNowUTCFn
		subscribeLimiter = originalSubscribeLimiter
		resendLimiter = originalResendLimiter
	})

	resolveSiteURLFn = func() (string, error) { return "", errors.New("missing") }
	resolveSMTPConfigFn = func() (newsletterpkg.SMTPConfig, error) { return newsletterpkg.SMTPConfig{}, nil }
	resolveDatabaseNameFn = func() (string, error) { return "blog", nil }
	resolveUnsubscribeSecretFn = func() (string, error) { return "secret", nil }
	parseUnsubscribeTokenFn = func(string, string, time.Time) (string, error) { return "reader@example.com", nil }
	sendConfirmationEmailFn = func(newsletterpkg.SMTPConfig, string, string, string, string) error { return nil }
	generateConfirmTokenFn = func() (string, error) { return "token", nil }
	nowUTCFn = func() time.Time { return time.Date(2026, time.March, 1, 12, 0, 0, 0, time.UTC) }
	subscribeLimiter = newRateLimiter(1, time.Hour)
	resendLimiter = newRateLimiter(1, time.Hour)

	newsletterRepository = newsletterStubRepository{
		getStatusByEmail:          func(context.Context, string) (string, bool, error) { return "", false, errRepositoryUnavailable },
		upsertPendingSubscription: func(context.Context, PendingSubscription) error { return errors.New("boom") },
		updatePendingSubscription: func(context.Context, PendingSubscription) error { return errors.New("boom") },
		confirmByTokenHash: func(context.Context, string, time.Time) (bool, error) {
			return false, errRepositoryUnavailable
		},
		unsubscribeByEmail: func(context.Context, string, time.Time) error {
			return errRepositoryUnavailable
		},
	}

	if result := Subscribe(context.Background(), SubscribeInput{Terms: true}, RequestMetadata{}); result.Status != "success" {
		t.Fatalf("terms subscribe = %#v", result)
	}
	if result := Subscribe(context.Background(), SubscribeInput{Email: "reader@example.com"}, RequestMetadata{}); result.Status != "unknown-error" {
		t.Fatalf("site url subscribe = %#v", result)
	}

	resolveSiteURLFn = func() (string, error) { return "https://example.com", nil }
	resolveSMTPConfigFn = func() (newsletterpkg.SMTPConfig, error) {
		return newsletterpkg.SMTPConfig{}, errors.New("missing smtp")
	}
	if result := Subscribe(context.Background(), SubscribeInput{Email: "reader@example.com"}, RequestMetadata{}); result.Status != "unknown-error" {
		t.Fatalf("smtp subscribe = %#v", result)
	}

	resolveSMTPConfigFn = func() (newsletterpkg.SMTPConfig, error) { return newsletterpkg.SMTPConfig{}, nil }
	if result := Subscribe(context.Background(), SubscribeInput{Email: "bad-email"}, RequestMetadata{}); result.Status != "invalid-email" {
		t.Fatalf("invalid email subscribe = %#v", result)
	}
	if result := Subscribe(context.Background(), SubscribeInput{Email: "reader@example.com"}, RequestMetadata{ClientIP: "127.0.0.1"}); result.Status != "unknown-error" {
		t.Fatalf("repository subscribe = %#v", result)
	}
	if result := Subscribe(context.Background(), SubscribeInput{Email: "reader@example.com"}, RequestMetadata{ClientIP: "127.0.0.1"}); result.Status != "rate-limited" {
		t.Fatalf("rate limited subscribe = %#v", result)
	}

	newsletterRepository = newsletterStubRepository{
		getStatusByEmail:          func(context.Context, string) (string, bool, error) { return "active", true, nil },
		upsertPendingSubscription: func(context.Context, PendingSubscription) error { return nil },
		updatePendingSubscription: func(context.Context, PendingSubscription) error { return nil },
		confirmByTokenHash:        func(context.Context, string, time.Time) (bool, error) { return false, nil },
		unsubscribeByEmail:        func(context.Context, string, time.Time) error { return nil },
	}
	resendLimiter = newRateLimiter(1, time.Hour)
	if result := Resend(context.Background(), ResendInput{Terms: true}, RequestMetadata{}); result.Status != "success" {
		t.Fatalf("terms resend = %#v", result)
	}
	if result := Resend(context.Background(), ResendInput{Email: "bad"}, RequestMetadata{}); result.Status != "invalid-email" {
		t.Fatalf("invalid email resend = %#v", result)
	}
	if result := Resend(context.Background(), ResendInput{Email: "reader@example.com"}, RequestMetadata{ClientIP: "127.0.0.1"}); result.Status != "success" {
		t.Fatalf("active resend = %#v", result)
	}
	if result := Resend(context.Background(), ResendInput{Email: "reader@example.com"}, RequestMetadata{ClientIP: "127.0.0.1"}); result.Status != "rate-limited" {
		t.Fatalf("rate limited resend = %#v", result)
	}

	resolveDatabaseNameFn = func() (string, error) { return "", errors.New("missing db") }
	if result := Confirm(context.Background(), ""); result.Status != "invalid-link" {
		t.Fatalf("empty confirm = %#v", result)
	}
	if result := Confirm(context.Background(), "token"); result.Status != "config-error" {
		t.Fatalf("config confirm = %#v", result)
	}

	resolveDatabaseNameFn = func() (string, error) { return "blog", nil }
	if result := Confirm(context.Background(), "token"); result.Status != "expired" {
		t.Fatalf("expired confirm = %#v", result)
	}
	newsletterRepository = newsletterStubRepository{
		getStatusByEmail:          func(context.Context, string) (string, bool, error) { return "", false, nil },
		upsertPendingSubscription: func(context.Context, PendingSubscription) error { return nil },
		updatePendingSubscription: func(context.Context, PendingSubscription) error { return nil },
		confirmByTokenHash:        func(context.Context, string, time.Time) (bool, error) { return true, nil },
		unsubscribeByEmail:        func(context.Context, string, time.Time) error { return nil },
	}
	if result := Confirm(context.Background(), "token"); result.Status != "success" {
		t.Fatalf("success confirm = %#v", result)
	}

	resolveUnsubscribeSecretFn = func() (string, error) { return "", errors.New("missing secret") }
	if result := Unsubscribe(context.Background(), ""); result.Status != "invalid-link" {
		t.Fatalf("empty unsubscribe = %#v", result)
	}
	if result := Unsubscribe(context.Background(), "token"); result.Status != "config-error" {
		t.Fatalf("config secret unsubscribe = %#v", result)
	}
	resolveUnsubscribeSecretFn = func() (string, error) { return "secret", nil }
	parseUnsubscribeTokenFn = func(string, string, time.Time) (string, error) { return "", errors.New("bad token") }
	if result := Unsubscribe(context.Background(), "token"); result.Status != "invalid-link" {
		t.Fatalf("invalid token unsubscribe = %#v", result)
	}

	parseUnsubscribeTokenFn = func(string, string, time.Time) (string, error) { return "reader@example.com", nil }
	newsletterRepository = newsletterStubRepository{
		getStatusByEmail:          func(context.Context, string) (string, bool, error) { return "", false, nil },
		upsertPendingSubscription: func(context.Context, PendingSubscription) error { return nil },
		updatePendingSubscription: func(context.Context, PendingSubscription) error { return nil },
		confirmByTokenHash:        func(context.Context, string, time.Time) (bool, error) { return false, nil },
		unsubscribeByEmail:        func(context.Context, string, time.Time) error { return errRepositoryUnavailable },
	}
	if result := Unsubscribe(context.Background(), "token"); result.Status != "service-unavailable" {
		t.Fatalf("service unavailable unsubscribe = %#v", result)
	}
	newsletterRepository = newsletterStubRepository{
		getStatusByEmail:          func(context.Context, string) (string, bool, error) { return "", false, nil },
		upsertPendingSubscription: func(context.Context, PendingSubscription) error { return nil },
		updatePendingSubscription: func(context.Context, PendingSubscription) error { return nil },
		confirmByTokenHash:        func(context.Context, string, time.Time) (bool, error) { return false, nil },
		unsubscribeByEmail:        func(context.Context, string, time.Time) error { return nil },
	}
	if result := Unsubscribe(context.Background(), "token"); result.Status != "success" {
		t.Fatalf("success unsubscribe = %#v", result)
	}
}

func TestNewsletterServiceAdditionalBranches(t *testing.T) {
	originalRepository := newsletterRepository
	originalResolveSiteURLFn := resolveSiteURLFn
	originalResolveSMTPConfigFn := resolveSMTPConfigFn
	originalResolveDatabaseNameFn := resolveDatabaseNameFn
	originalResolveUnsubscribeSecretFn := resolveUnsubscribeSecretFn
	originalParseUnsubscribeTokenFn := parseUnsubscribeTokenFn
	originalSendConfirmationEmailFn := sendConfirmationEmailFn
	originalGenerateConfirmTokenFn := generateConfirmTokenFn
	originalNowUTCFn := nowUTCFn
	originalSubscribeLimiter := subscribeLimiter
	originalResendLimiter := resendLimiter
	t.Cleanup(func() {
		newsletterRepository = originalRepository
		resolveSiteURLFn = originalResolveSiteURLFn
		resolveSMTPConfigFn = originalResolveSMTPConfigFn
		resolveDatabaseNameFn = originalResolveDatabaseNameFn
		resolveUnsubscribeSecretFn = originalResolveUnsubscribeSecretFn
		parseUnsubscribeTokenFn = originalParseUnsubscribeTokenFn
		sendConfirmationEmailFn = originalSendConfirmationEmailFn
		generateConfirmTokenFn = originalGenerateConfirmTokenFn
		nowUTCFn = originalNowUTCFn
		subscribeLimiter = originalSubscribeLimiter
		resendLimiter = originalResendLimiter
	})

	fixedNow := time.Date(2026, time.March, 1, 12, 0, 0, 0, time.UTC)
	resolveSMTPConfigFn = func() (newsletterpkg.SMTPConfig, error) {
		return newsletterpkg.SMTPConfig{Host: "smtp.example.com", Port: "2525"}, nil
	}
	resolveDatabaseNameFn = func() (string, error) { return "blog", nil }
	resolveUnsubscribeSecretFn = func() (string, error) { return "secret", nil }
	parseUnsubscribeTokenFn = func(string, string, time.Time) (string, error) { return "reader@example.com", nil }
	nowUTCFn = func() time.Time { return fixedNow }

	t.Run("subscribe returns success for active subscriber", func(t *testing.T) {
		resolveSiteURLFn = func() (string, error) { return "https://example.com", nil }
		generateConfirmTokenFn = func() (string, error) { return "token", nil }
		sendConfirmationEmailFn = func(newsletterpkg.SMTPConfig, string, string, string, string) error {
			t.Fatal("sendConfirmationEmailFn should not be called")
			return nil
		}
		subscribeLimiter = newRateLimiter(5, time.Minute)
		newsletterRepository = newsletterStubRepository{
			getStatusByEmail: func(context.Context, string) (string, bool, error) { return "active", true, nil },
			upsertPendingSubscription: func(context.Context, PendingSubscription) error {
				t.Fatal("upsert should not be called")
				return nil
			},
			updatePendingSubscription: func(context.Context, PendingSubscription) error { return nil },
			confirmByTokenHash:        func(context.Context, string, time.Time) (bool, error) { return false, nil },
			unsubscribeByEmail:        func(context.Context, string, time.Time) error { return nil },
		}

		if result := Subscribe(context.Background(), SubscribeInput{Email: "reader@example.com"}, RequestMetadata{ClientIP: "203.0.113.1"}); result.Status != "success" {
			t.Fatalf("active subscribe = %#v", result)
		}
	})

	t.Run("subscribe returns unknown error when confirmation setup fails", func(t *testing.T) {
		subscribeLimiter = newRateLimiter(5, time.Minute)
		newsletterRepository = newsletterStubRepository{
			getStatusByEmail:          func(context.Context, string) (string, bool, error) { return "", false, nil },
			upsertPendingSubscription: func(context.Context, PendingSubscription) error { return nil },
			updatePendingSubscription: func(context.Context, PendingSubscription) error { return nil },
			confirmByTokenHash:        func(context.Context, string, time.Time) (bool, error) { return false, nil },
			unsubscribeByEmail:        func(context.Context, string, time.Time) error { return nil },
		}

		resolveSiteURLFn = func() (string, error) { return "https://example.com", nil }
		generateConfirmTokenFn = func() (string, error) { return "", errors.New("boom") }
		if result := Subscribe(context.Background(), SubscribeInput{Email: "reader@example.com"}, RequestMetadata{ClientIP: "203.0.113.2"}); result.Status != statusUnknownError {
			t.Fatalf("token failure subscribe = %#v", result)
		}

		generateConfirmTokenFn = func() (string, error) { return "token", nil }
		resolveSiteURLFn = func() (string, error) { return "not-a-url", nil }
		if result := Subscribe(context.Background(), SubscribeInput{Email: "reader@example.com"}, RequestMetadata{ClientIP: "203.0.113.3"}); result.Status != statusUnknownError {
			t.Fatalf("url failure subscribe = %#v", result)
		}

		resolveSiteURLFn = func() (string, error) { return "https://example.com", nil }
		newsletterRepository = newsletterStubRepository{
			getStatusByEmail: func(context.Context, string) (string, bool, error) { return "", false, nil },
			upsertPendingSubscription: func(context.Context, PendingSubscription) error {
				return errors.New("db failure")
			},
			updatePendingSubscription: func(context.Context, PendingSubscription) error { return nil },
			confirmByTokenHash:        func(context.Context, string, time.Time) (bool, error) { return false, nil },
			unsubscribeByEmail:        func(context.Context, string, time.Time) error { return nil },
		}
		if result := Subscribe(context.Background(), SubscribeInput{Email: "reader@example.com"}, RequestMetadata{ClientIP: "203.0.113.4"}); result.Status != statusUnknownError {
			t.Fatalf("upsert failure subscribe = %#v", result)
		}

		newsletterRepository = newsletterStubRepository{
			getStatusByEmail:          func(context.Context, string) (string, bool, error) { return "", false, nil },
			upsertPendingSubscription: func(context.Context, PendingSubscription) error { return nil },
			updatePendingSubscription: func(context.Context, PendingSubscription) error { return nil },
			confirmByTokenHash:        func(context.Context, string, time.Time) (bool, error) { return false, nil },
			unsubscribeByEmail:        func(context.Context, string, time.Time) error { return nil },
		}
		sendConfirmationEmailFn = func(newsletterpkg.SMTPConfig, string, string, string, string) error {
			return errors.New("smtp failure")
		}
		if result := Subscribe(context.Background(), SubscribeInput{Email: "reader@example.com"}, RequestMetadata{ClientIP: "203.0.113.5"}); result.Status != statusUnknownError {
			t.Fatalf("email failure subscribe = %#v", result)
		}
	})

	t.Run("resend covers not found and failure branches", func(t *testing.T) {
		resendLimiter = newRateLimiter(5, time.Minute)
		resolveSiteURLFn = func() (string, error) { return "https://example.com", nil }
		generateConfirmTokenFn = func() (string, error) { return "token", nil }
		sendConfirmationEmailFn = func(newsletterpkg.SMTPConfig, string, string, string, string) error { return nil }

		newsletterRepository = newsletterStubRepository{
			getStatusByEmail:          func(context.Context, string) (string, bool, error) { return "", false, nil },
			upsertPendingSubscription: func(context.Context, PendingSubscription) error { return nil },
			updatePendingSubscription: func(context.Context, PendingSubscription) error { return nil },
			confirmByTokenHash:        func(context.Context, string, time.Time) (bool, error) { return false, nil },
			unsubscribeByEmail:        func(context.Context, string, time.Time) error { return nil },
		}
		if result := Resend(context.Background(), ResendInput{Email: "reader@example.com"}, RequestMetadata{ClientIP: "203.0.113.10"}); result.Status != "success" {
			t.Fatalf("not found resend = %#v", result)
		}

		newsletterRepository = newsletterStubRepository{
			getStatusByEmail:          func(context.Context, string) (string, bool, error) { return "pending", true, nil },
			upsertPendingSubscription: func(context.Context, PendingSubscription) error { return nil },
			updatePendingSubscription: func(context.Context, PendingSubscription) error { return nil },
			confirmByTokenHash:        func(context.Context, string, time.Time) (bool, error) { return false, nil },
			unsubscribeByEmail:        func(context.Context, string, time.Time) error { return nil },
		}
		generateConfirmTokenFn = func() (string, error) { return "", errors.New("boom") }
		if result := Resend(context.Background(), ResendInput{Email: "reader@example.com"}, RequestMetadata{ClientIP: "203.0.113.11"}); result.Status != statusUnknownError {
			t.Fatalf("token failure resend = %#v", result)
		}

		generateConfirmTokenFn = func() (string, error) { return "token", nil }
		resolveSiteURLFn = func() (string, error) { return "not-a-url", nil }
		if result := Resend(context.Background(), ResendInput{Email: "reader@example.com"}, RequestMetadata{ClientIP: "203.0.113.12"}); result.Status != statusUnknownError {
			t.Fatalf("url failure resend = %#v", result)
		}

		resolveSiteURLFn = func() (string, error) { return "https://example.com", nil }
		newsletterRepository = newsletterStubRepository{
			getStatusByEmail: func(context.Context, string) (string, bool, error) { return "pending", true, nil },
			upsertPendingSubscription: func(context.Context, PendingSubscription) error {
				return nil
			},
			updatePendingSubscription: func(context.Context, PendingSubscription) error {
				return errors.New("db failure")
			},
			confirmByTokenHash: func(context.Context, string, time.Time) (bool, error) { return false, nil },
			unsubscribeByEmail: func(context.Context, string, time.Time) error { return nil },
		}
		if result := Resend(context.Background(), ResendInput{Email: "reader@example.com"}, RequestMetadata{ClientIP: "203.0.113.13"}); result.Status != statusUnknownError {
			t.Fatalf("update failure resend = %#v", result)
		}

		newsletterRepository = newsletterStubRepository{
			getStatusByEmail:          func(context.Context, string) (string, bool, error) { return "pending", true, nil },
			upsertPendingSubscription: func(context.Context, PendingSubscription) error { return nil },
			updatePendingSubscription: func(context.Context, PendingSubscription) error { return nil },
			confirmByTokenHash:        func(context.Context, string, time.Time) (bool, error) { return false, nil },
			unsubscribeByEmail:        func(context.Context, string, time.Time) error { return nil },
		}
		sendConfirmationEmailFn = func(newsletterpkg.SMTPConfig, string, string, string, string) error {
			return errors.New("smtp failure")
		}
		if result := Resend(context.Background(), ResendInput{Email: "reader@example.com"}, RequestMetadata{ClientIP: "203.0.113.14"}); result.Status != statusUnknownError {
			t.Fatalf("email failure resend = %#v", result)
		}
	})

	t.Run("confirm and unsubscribe return failed for generic repository errors", func(t *testing.T) {
		resolveSiteURLFn = func() (string, error) { return "https://example.com", nil }
		sendConfirmationEmailFn = func(newsletterpkg.SMTPConfig, string, string, string, string) error { return nil }
		newsletterRepository = newsletterStubRepository{
			getStatusByEmail:          func(context.Context, string) (string, bool, error) { return "", false, nil },
			upsertPendingSubscription: func(context.Context, PendingSubscription) error { return nil },
			updatePendingSubscription: func(context.Context, PendingSubscription) error { return nil },
			confirmByTokenHash:        func(context.Context, string, time.Time) (bool, error) { return false, errors.New("db failure") },
			unsubscribeByEmail:        func(context.Context, string, time.Time) error { return errors.New("db failure") },
		}

		if result := Confirm(context.Background(), "token"); result.Status != "failed" {
			t.Fatalf("failed confirm = %#v", result)
		}
		if result := Unsubscribe(context.Background(), "token"); result.Status != "failed" {
			t.Fatalf("failed unsubscribe = %#v", result)
		}
	})
}

func TestNewsletterInternalHelpers(t *testing.T) {
	limiter := newRateLimiter(2, time.Minute)
	limiter.entries["client"] = []time.Time{
		time.Now().UTC().Add(-2 * time.Hour),
		time.Now().UTC().Add(-30 * time.Second),
	}
	limiter.pruneStaleEntriesLocked(time.Now().UTC().Add(-time.Minute))
	if len(limiter.entries["client"]) != 1 {
		t.Fatalf("entries = %#v", limiter.entries)
	}

	token, err := generateConfirmToken()
	if err != nil || len(token) != 64 {
		t.Fatalf("generateConfirmToken() = %q, %v", token, err)
	}
}
