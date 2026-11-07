package service

import (
	"context"
	"errors"
	"testing"
	"time"

	appconfig "suaybsimsek.com/blog-api/internal/config"
	"suaybsimsek.com/blog-api/internal/testassert"
	newsletterpkg "suaybsimsek.com/blog-api/pkg/newsletter"
)

func assertNewsletterStatus(t *testing.T, got, want string) {
	t.Helper()
	testassert.Equal(t, got, want, "newsletter result status")
}

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
	firstRequestAllowed := limiter.allow("127.0.0.1")
	secondRequestAllowed := limiter.allow("127.0.0.1")
	thirdRequestAllowed := limiter.allow("127.0.0.1")
	if !firstRequestAllowed || !secondRequestAllowed || thirdRequestAllowed {
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
		appconfig.MailConfig{
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
	originalResolveMailConfigFn := resolveMailConfigFn
	originalSendConfirmationEmailFn := sendConfirmationEmailFn
	originalGenerateConfirmTokenFn := generateConfirmTokenFn
	originalNowUTCFn := nowUTCFn
	originalSubscribeLimiter := subscribeLimiter
	originalResendLimiter := resendLimiter
	t.Cleanup(func() {
		newsletterRepository = originalRepository
		resolveSiteURLFn = originalResolveSiteURLFn
		resolveMailConfigFn = originalResolveMailConfigFn
		sendConfirmationEmailFn = originalSendConfirmationEmailFn
		generateConfirmTokenFn = originalGenerateConfirmTokenFn
		nowUTCFn = originalNowUTCFn
		subscribeLimiter = originalSubscribeLimiter
		resendLimiter = originalResendLimiter
	})

	fixedNow := time.Date(2026, time.March, 1, 12, 0, 0, 0, time.UTC)
	resolveSiteURLFn = func() (string, error) { return "https://example.com", nil }
	resolveMailConfigFn = func() (appconfig.MailConfig, error) {
		return appconfig.MailConfig{Host: "smtp.example.com", Port: "2525"}, nil
	}
	sendConfirmationEmailFn = func(cfg appconfig.MailConfig, recipientEmail, confirmURL, locale, siteURL string) error {
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
	originalResolveMailConfigFn := resolveMailConfigFn
	originalResolveDatabaseConfigFn := resolveDatabaseConfigFn
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
		resolveMailConfigFn = originalResolveMailConfigFn
		resolveDatabaseConfigFn = originalResolveDatabaseConfigFn
		resolveUnsubscribeSecretFn = originalResolveUnsubscribeSecretFn
		parseUnsubscribeTokenFn = originalParseUnsubscribeTokenFn
		sendConfirmationEmailFn = originalSendConfirmationEmailFn
		generateConfirmTokenFn = originalGenerateConfirmTokenFn
		nowUTCFn = originalNowUTCFn
		subscribeLimiter = originalSubscribeLimiter
		resendLimiter = originalResendLimiter
	})

	resolveSiteURLFn = func() (string, error) { return "", errors.New("missing") }
	resolveMailConfigFn = func() (appconfig.MailConfig, error) { return appconfig.MailConfig{}, nil }
	resolveDatabaseConfigFn = func() (appconfig.DatabaseConfig, error) {
		return appconfig.DatabaseConfig{Name: "blog"}, nil
	}
	resolveUnsubscribeSecretFn = func() (string, error) { return "secret", nil }
	parseUnsubscribeTokenFn = func(string, string, time.Time) (string, error) { return "reader@example.com", nil }
	sendConfirmationEmailFn = func(appconfig.MailConfig, string, string, string, string) error { return nil }
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

	assertNewsletterStatus(t, Subscribe(context.Background(), SubscribeInput{Terms: true}, RequestMetadata{}).Status, "success")
	assertNewsletterStatus(t, Subscribe(context.Background(), SubscribeInput{Email: "reader@example.com"}, RequestMetadata{}).Status, "unknown-error")

	resolveSiteURLFn = func() (string, error) { return "https://example.com", nil }
	resolveMailConfigFn = func() (appconfig.MailConfig, error) {
		return appconfig.MailConfig{}, errors.New("missing smtp")
	}
	assertNewsletterStatus(t, Subscribe(context.Background(), SubscribeInput{Email: "reader@example.com"}, RequestMetadata{}).Status, "unknown-error")

	resolveMailConfigFn = func() (appconfig.MailConfig, error) { return appconfig.MailConfig{}, nil }
	assertNewsletterStatus(t, Subscribe(context.Background(), SubscribeInput{Email: "bad-email"}, RequestMetadata{}).Status, "invalid-email")
	assertNewsletterStatus(t, Subscribe(context.Background(), SubscribeInput{Email: "reader@example.com"}, RequestMetadata{ClientIP: "127.0.0.1"}).Status, "unknown-error")
	assertNewsletterStatus(t, Subscribe(context.Background(), SubscribeInput{Email: "reader@example.com"}, RequestMetadata{ClientIP: "127.0.0.1"}).Status, "rate-limited")

	newsletterRepository = newsletterStubRepository{
		getStatusByEmail:          func(context.Context, string) (string, bool, error) { return "active", true, nil },
		upsertPendingSubscription: func(context.Context, PendingSubscription) error { return nil },
		updatePendingSubscription: func(context.Context, PendingSubscription) error { return nil },
		confirmByTokenHash:        func(context.Context, string, time.Time) (bool, error) { return false, nil },
		unsubscribeByEmail:        func(context.Context, string, time.Time) error { return nil },
	}
	resendLimiter = newRateLimiter(1, time.Hour)
	assertNewsletterStatus(t, Resend(context.Background(), ResendInput{Terms: true}, RequestMetadata{}).Status, "success")
	assertNewsletterStatus(t, Resend(context.Background(), ResendInput{Email: "bad"}, RequestMetadata{}).Status, "invalid-email")
	assertNewsletterStatus(t, Resend(context.Background(), ResendInput{Email: "reader@example.com"}, RequestMetadata{ClientIP: "127.0.0.1"}).Status, "success")
	assertNewsletterStatus(t, Resend(context.Background(), ResendInput{Email: "reader@example.com"}, RequestMetadata{ClientIP: "127.0.0.1"}).Status, "rate-limited")

	resolveDatabaseConfigFn = func() (appconfig.DatabaseConfig, error) { return appconfig.DatabaseConfig{}, errors.New("missing db") }
	assertNewsletterStatus(t, Confirm(context.Background(), "").Status, "invalid-link")
	assertNewsletterStatus(t, Confirm(context.Background(), "token").Status, "config-error")

	resolveDatabaseConfigFn = func() (appconfig.DatabaseConfig, error) {
		return appconfig.DatabaseConfig{Name: "blog"}, nil
	}
	assertNewsletterStatus(t, Confirm(context.Background(), "token").Status, "expired")
	newsletterRepository = newsletterStubRepository{
		getStatusByEmail:          func(context.Context, string) (string, bool, error) { return "", false, nil },
		upsertPendingSubscription: func(context.Context, PendingSubscription) error { return nil },
		updatePendingSubscription: func(context.Context, PendingSubscription) error { return nil },
		confirmByTokenHash:        func(context.Context, string, time.Time) (bool, error) { return true, nil },
		unsubscribeByEmail:        func(context.Context, string, time.Time) error { return nil },
	}
	assertNewsletterStatus(t, Confirm(context.Background(), "token").Status, "success")

	resolveUnsubscribeSecretFn = func() (string, error) { return "", errors.New("missing secret") }
	assertNewsletterStatus(t, Unsubscribe(context.Background(), "").Status, "invalid-link")
	assertNewsletterStatus(t, Unsubscribe(context.Background(), "token").Status, "config-error")
	resolveUnsubscribeSecretFn = func() (string, error) { return "secret", nil }
	parseUnsubscribeTokenFn = func(string, string, time.Time) (string, error) { return "", errors.New("bad token") }
	assertNewsletterStatus(t, Unsubscribe(context.Background(), "token").Status, "invalid-link")

	parseUnsubscribeTokenFn = func(string, string, time.Time) (string, error) { return "reader@example.com", nil }
	newsletterRepository = newsletterStubRepository{
		getStatusByEmail:          func(context.Context, string) (string, bool, error) { return "", false, nil },
		upsertPendingSubscription: func(context.Context, PendingSubscription) error { return nil },
		updatePendingSubscription: func(context.Context, PendingSubscription) error { return nil },
		confirmByTokenHash:        func(context.Context, string, time.Time) (bool, error) { return false, nil },
		unsubscribeByEmail:        func(context.Context, string, time.Time) error { return errRepositoryUnavailable },
	}
	assertNewsletterStatus(t, Unsubscribe(context.Background(), "token").Status, "service-unavailable")
	newsletterRepository = newsletterStubRepository{
		getStatusByEmail:          func(context.Context, string) (string, bool, error) { return "", false, nil },
		upsertPendingSubscription: func(context.Context, PendingSubscription) error { return nil },
		updatePendingSubscription: func(context.Context, PendingSubscription) error { return nil },
		confirmByTokenHash:        func(context.Context, string, time.Time) (bool, error) { return false, nil },
		unsubscribeByEmail:        func(context.Context, string, time.Time) error { return nil },
	}
	assertNewsletterStatus(t, Unsubscribe(context.Background(), "token").Status, "success")
}

func TestNewsletterServiceAdditionalBranches(t *testing.T) {
	originalRepository := newsletterRepository
	originalResolveSiteURLFn := resolveSiteURLFn
	originalResolveMailConfigFn := resolveMailConfigFn
	originalResolveDatabaseConfigFn := resolveDatabaseConfigFn
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
		resolveMailConfigFn = originalResolveMailConfigFn
		resolveDatabaseConfigFn = originalResolveDatabaseConfigFn
		resolveUnsubscribeSecretFn = originalResolveUnsubscribeSecretFn
		parseUnsubscribeTokenFn = originalParseUnsubscribeTokenFn
		sendConfirmationEmailFn = originalSendConfirmationEmailFn
		generateConfirmTokenFn = originalGenerateConfirmTokenFn
		nowUTCFn = originalNowUTCFn
		subscribeLimiter = originalSubscribeLimiter
		resendLimiter = originalResendLimiter
	})

	fixedNow := time.Date(2026, time.March, 1, 12, 0, 0, 0, time.UTC)
	resolveMailConfigFn = func() (appconfig.MailConfig, error) {
		return appconfig.MailConfig{Host: "smtp.example.com", Port: "2525"}, nil
	}
	resolveDatabaseConfigFn = func() (appconfig.DatabaseConfig, error) {
		return appconfig.DatabaseConfig{Name: "blog"}, nil
	}
	resolveUnsubscribeSecretFn = func() (string, error) { return "secret", nil }
	parseUnsubscribeTokenFn = func(string, string, time.Time) (string, error) { return "reader@example.com", nil }
	nowUTCFn = func() time.Time { return fixedNow }

	t.Run("subscribe returns success for active subscriber", func(t *testing.T) {
		resolveSiteURLFn = func() (string, error) { return "https://example.com", nil }
		generateConfirmTokenFn = func() (string, error) { return "token", nil }
		sendConfirmationEmailFn = func(appconfig.MailConfig, string, string, string, string) error {
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

		assertNewsletterStatus(t, Subscribe(context.Background(), SubscribeInput{Email: "reader@example.com"}, RequestMetadata{ClientIP: "203.0.113.1"}).Status, "success")
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
		assertNewsletterStatus(t, Subscribe(context.Background(), SubscribeInput{Email: "reader@example.com"}, RequestMetadata{ClientIP: "203.0.113.2"}).Status, statusUnknownError)

		generateConfirmTokenFn = func() (string, error) { return "token", nil }
		resolveSiteURLFn = func() (string, error) { return "not-a-url", nil }
		assertNewsletterStatus(t, Subscribe(context.Background(), SubscribeInput{Email: "reader@example.com"}, RequestMetadata{ClientIP: "203.0.113.3"}).Status, statusUnknownError)

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
		assertNewsletterStatus(t, Subscribe(context.Background(), SubscribeInput{Email: "reader@example.com"}, RequestMetadata{ClientIP: "203.0.113.4"}).Status, statusUnknownError)

		newsletterRepository = newsletterStubRepository{
			getStatusByEmail:          func(context.Context, string) (string, bool, error) { return "", false, nil },
			upsertPendingSubscription: func(context.Context, PendingSubscription) error { return nil },
			updatePendingSubscription: func(context.Context, PendingSubscription) error { return nil },
			confirmByTokenHash:        func(context.Context, string, time.Time) (bool, error) { return false, nil },
			unsubscribeByEmail:        func(context.Context, string, time.Time) error { return nil },
		}
		sendConfirmationEmailFn = func(appconfig.MailConfig, string, string, string, string) error {
			return errors.New("smtp failure")
		}
		assertNewsletterStatus(t, Subscribe(context.Background(), SubscribeInput{Email: "reader@example.com"}, RequestMetadata{ClientIP: "203.0.113.5"}).Status, statusUnknownError)
	})

	t.Run("resend covers not found and failure branches", func(t *testing.T) {
		resendLimiter = newRateLimiter(5, time.Minute)
		resolveSiteURLFn = func() (string, error) { return "https://example.com", nil }
		generateConfirmTokenFn = func() (string, error) { return "token", nil }
		sendConfirmationEmailFn = func(appconfig.MailConfig, string, string, string, string) error { return nil }

		newsletterRepository = newsletterStubRepository{
			getStatusByEmail:          func(context.Context, string) (string, bool, error) { return "", false, nil },
			upsertPendingSubscription: func(context.Context, PendingSubscription) error { return nil },
			updatePendingSubscription: func(context.Context, PendingSubscription) error { return nil },
			confirmByTokenHash:        func(context.Context, string, time.Time) (bool, error) { return false, nil },
			unsubscribeByEmail:        func(context.Context, string, time.Time) error { return nil },
		}
		assertNewsletterStatus(t, Resend(context.Background(), ResendInput{Email: "reader@example.com"}, RequestMetadata{ClientIP: "203.0.113.10"}).Status, "success")

		newsletterRepository = newsletterStubRepository{
			getStatusByEmail:          func(context.Context, string) (string, bool, error) { return "pending", true, nil },
			upsertPendingSubscription: func(context.Context, PendingSubscription) error { return nil },
			updatePendingSubscription: func(context.Context, PendingSubscription) error { return nil },
			confirmByTokenHash:        func(context.Context, string, time.Time) (bool, error) { return false, nil },
			unsubscribeByEmail:        func(context.Context, string, time.Time) error { return nil },
		}
		generateConfirmTokenFn = func() (string, error) { return "", errors.New("boom") }
		assertNewsletterStatus(t, Resend(context.Background(), ResendInput{Email: "reader@example.com"}, RequestMetadata{ClientIP: "203.0.113.11"}).Status, statusUnknownError)

		generateConfirmTokenFn = func() (string, error) { return "token", nil }
		resolveSiteURLFn = func() (string, error) { return "not-a-url", nil }
		assertNewsletterStatus(t, Resend(context.Background(), ResendInput{Email: "reader@example.com"}, RequestMetadata{ClientIP: "203.0.113.12"}).Status, statusUnknownError)

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
		assertNewsletterStatus(t, Resend(context.Background(), ResendInput{Email: "reader@example.com"}, RequestMetadata{ClientIP: "203.0.113.13"}).Status, statusUnknownError)

		newsletterRepository = newsletterStubRepository{
			getStatusByEmail:          func(context.Context, string) (string, bool, error) { return "pending", true, nil },
			upsertPendingSubscription: func(context.Context, PendingSubscription) error { return nil },
			updatePendingSubscription: func(context.Context, PendingSubscription) error { return nil },
			confirmByTokenHash:        func(context.Context, string, time.Time) (bool, error) { return false, nil },
			unsubscribeByEmail:        func(context.Context, string, time.Time) error { return nil },
		}
		sendConfirmationEmailFn = func(appconfig.MailConfig, string, string, string, string) error {
			return errors.New("smtp failure")
		}
		assertNewsletterStatus(t, Resend(context.Background(), ResendInput{Email: "reader@example.com"}, RequestMetadata{ClientIP: "203.0.113.14"}).Status, statusUnknownError)
	})

	t.Run("confirm and unsubscribe return failed for generic repository errors", func(t *testing.T) {
		resolveSiteURLFn = func() (string, error) { return "https://example.com", nil }
		sendConfirmationEmailFn = func(appconfig.MailConfig, string, string, string, string) error { return nil }
		newsletterRepository = newsletterStubRepository{
			getStatusByEmail:          func(context.Context, string) (string, bool, error) { return "", false, nil },
			upsertPendingSubscription: func(context.Context, PendingSubscription) error { return nil },
			updatePendingSubscription: func(context.Context, PendingSubscription) error { return nil },
			confirmByTokenHash:        func(context.Context, string, time.Time) (bool, error) { return false, errors.New("db failure") },
			unsubscribeByEmail:        func(context.Context, string, time.Time) error { return errors.New("db failure") },
		}

		assertNewsletterStatus(t, Confirm(context.Background(), "token").Status, "failed")
		assertNewsletterStatus(t, Unsubscribe(context.Background(), "token").Status, "failed")
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
