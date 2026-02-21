package newsletter

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"net/mail"
	"net/url"
	"strings"
	"sync"
	"time"

	newsletterpkg "suaybsimsek.com/blog-api/pkg/newsletter"
)

const (
	defaultNewsletterFormName   = "preFooterNewsletter"
	defaultNewsletterSourceName = "pre-footer"
	newsletterConfirmTokenTTL   = 24 * time.Hour
)

var defaultNewsletterTags = []string{"preFooterNewsletter"}

type RequestMetadata struct {
	ClientIP       string
	UserAgent      string
	AcceptLanguage string
}

type SubscribeInput struct {
	Locale   string
	Email    string
	Terms    bool
	Tags     []string
	FormName string
}

type ResendInput struct {
	Locale string
	Email  string
	Terms  bool
}

type Result struct {
	Status    string
	ForwardTo string
}

type rateLimiter struct {
	mu              sync.Mutex
	maxAttempts     int
	window          time.Duration
	cleanupInterval time.Duration
	lastCleanup     time.Time
	entries         map[string][]time.Time
}

func newRateLimiter(maxAttempts int, window time.Duration) *rateLimiter {
	return &rateLimiter{
		maxAttempts:     maxAttempts,
		window:          window,
		cleanupInterval: window,
		lastCleanup:     time.Now().UTC(),
		entries:         make(map[string][]time.Time),
	}
}

func (limit *rateLimiter) pruneStaleEntriesLocked(cutoff time.Time) {
	for clientID, timestamps := range limit.entries {
		filtered := timestamps[:0]
		for _, ts := range timestamps {
			if ts.After(cutoff) {
				filtered = append(filtered, ts)
			}
		}

		if len(filtered) == 0 {
			delete(limit.entries, clientID)
			continue
		}

		limit.entries[clientID] = filtered
	}
}

func (limit *rateLimiter) allow(clientID string) bool {
	if clientID == "" {
		return true
	}

	now := time.Now().UTC()
	cutoff := now.Add(-limit.window)

	limit.mu.Lock()
	defer limit.mu.Unlock()

	if now.Sub(limit.lastCleanup) >= limit.cleanupInterval {
		limit.pruneStaleEntriesLocked(cutoff)
		limit.lastCleanup = now
	}

	timestamps := limit.entries[clientID]
	filtered := timestamps[:0]
	for _, ts := range timestamps {
		if ts.After(cutoff) {
			filtered = append(filtered, ts)
		}
	}

	if len(filtered) >= limit.maxAttempts {
		limit.entries[clientID] = filtered
		return false
	}

	filtered = append(filtered, now)
	limit.entries[clientID] = filtered
	return true
}

var (
	subscribeLimiter                = newRateLimiter(5, time.Minute)
	resendLimiter                   = newRateLimiter(5, time.Minute)
	newsletterRepository Repository = NewMongoRepository()
)

func normalizeEmail(value string) (string, error) {
	email := strings.ToLower(strings.TrimSpace(value))
	parsed, err := mail.ParseAddress(email)
	if err != nil || parsed.Address != email {
		return "", fmt.Errorf("invalid email")
	}
	return email, nil
}

func normalizeFormName(value string) string {
	formName := strings.TrimSpace(value)
	if formName == "" {
		return defaultNewsletterFormName
	}
	if len(formName) > 64 {
		return formName[:64]
	}
	return formName
}

func normalizeTags(tags []string) []string {
	if len(tags) == 0 {
		return append([]string(nil), defaultNewsletterTags...)
	}

	seen := make(map[string]struct{}, len(tags))
	normalized := make([]string, 0, len(tags))
	for _, raw := range tags {
		tag := strings.TrimSpace(raw)
		if tag == "" || len(tag) > 48 {
			continue
		}
		if _, exists := seen[tag]; exists {
			continue
		}
		seen[tag] = struct{}{}
		normalized = append(normalized, tag)
	}

	if len(normalized) == 0 {
		return append([]string(nil), defaultNewsletterTags...)
	}

	return normalized
}

func hashValue(value string) string {
	if value == "" {
		return ""
	}
	sum := sha256.Sum256([]byte(value))
	return hex.EncodeToString(sum[:])
}

func generateConfirmToken() (string, error) {
	buffer := make([]byte, 32)
	if _, err := rand.Read(buffer); err != nil {
		return "", fmt.Errorf("token generation failed: %w", err)
	}
	return hex.EncodeToString(buffer), nil
}

func buildConfirmURL(siteURL, token, locale string) (string, error) {
	parsed, err := url.Parse(siteURL)
	if err != nil || parsed.Scheme == "" || parsed.Host == "" {
		return "", fmt.Errorf("invalid SITE_URL")
	}

	parsed.Path = strings.TrimRight(parsed.Path, "/") + "/" + strings.TrimSpace(locale) + "/callback"
	query := parsed.Query()
	query.Set("token", token)
	query.Set("operation", "confirm")
	parsed.RawQuery = query.Encode()

	return parsed.String(), nil
}

func sendConfirmationEmail(cfg newsletterpkg.SMTPConfig, recipientEmail, confirmURL, locale, siteURL string) error {
	subject, htmlBody, err := newsletterpkg.ConfirmationEmail(locale, confirmURL, siteURL)
	if err != nil {
		return fmt.Errorf("build confirmation email failed: %w", err)
	}

	return newsletterpkg.SendHTMLEmail(cfg, recipientEmail, subject, htmlBody, nil)
}

func Subscribe(ctx context.Context, input SubscribeInput, meta RequestMetadata) Result {
	if input.Terms {
		return Result{Status: "success"}
	}

	siteURL, err := newsletterpkg.ResolveSiteURL()
	if err != nil {
		return Result{Status: "unknown-error"}
	}

	smtpCfg, err := newsletterpkg.ResolveSMTPConfig()
	if err != nil {
		return Result{Status: "unknown-error"}
	}

	locale := newsletterpkg.ResolveLocale(input.Locale, meta.AcceptLanguage)

	email, err := normalizeEmail(input.Email)
	if err != nil {
		return Result{Status: "invalid-email"}
	}

	if !subscribeLimiter.allow(strings.TrimSpace(meta.ClientIP)) {
		return Result{Status: "rate-limited"}
	}

	lookupCtx, lookupCancel := context.WithTimeout(ctx, 5*time.Second)
	defer lookupCancel()

	existingStatus, found, err := newsletterRepository.GetStatusByEmail(lookupCtx, email)
	if err != nil {
		return Result{Status: "unknown-error"}
	}

	if found && existingStatus == "active" {
		return Result{Status: "success"}
	}

	confirmToken, err := generateConfirmToken()
	if err != nil {
		return Result{Status: "unknown-error"}
	}

	confirmURL, err := buildConfirmURL(siteURL, confirmToken, locale)
	if err != nil {
		return Result{Status: "unknown-error"}
	}

	now := time.Now().UTC()
	createdAt := now
	updateCtx, updateCancel := context.WithTimeout(ctx, 10*time.Second)
	defer updateCancel()

	err = newsletterRepository.UpsertPendingSubscription(updateCtx, PendingSubscription{
		Email:                 email,
		Locale:                locale,
		Tags:                  normalizeTags(input.Tags),
		FormName:              normalizeFormName(input.FormName),
		Source:                defaultNewsletterSourceName,
		UpdatedAt:             now,
		IPHash:                hashValue(strings.TrimSpace(meta.ClientIP)),
		UserAgent:             strings.TrimSpace(meta.UserAgent),
		ConfirmTokenHash:      hashValue(confirmToken),
		ConfirmTokenExpiresAt: now.Add(newsletterConfirmTokenTTL),
		ConfirmRequestedAt:    now,
		CreatedAt:             &createdAt,
	})
	if err != nil {
		return Result{Status: "unknown-error"}
	}

	if err := sendConfirmationEmail(smtpCfg, email, confirmURL, locale, siteURL); err != nil {
		return Result{Status: "unknown-error"}
	}

	return Result{Status: "success"}
}

func Resend(ctx context.Context, input ResendInput, meta RequestMetadata) Result {
	if input.Terms {
		return Result{Status: "success"}
	}

	siteURL, err := newsletterpkg.ResolveSiteURL()
	if err != nil {
		return Result{Status: "unknown-error"}
	}

	smtpCfg, err := newsletterpkg.ResolveSMTPConfig()
	if err != nil {
		return Result{Status: "unknown-error"}
	}

	locale := newsletterpkg.ResolveLocale(input.Locale, meta.AcceptLanguage)

	email, err := normalizeEmail(input.Email)
	if err != nil {
		return Result{Status: "invalid-email"}
	}

	if !resendLimiter.allow(strings.TrimSpace(meta.ClientIP)) {
		return Result{Status: "rate-limited"}
	}

	lookupCtx, lookupCancel := context.WithTimeout(ctx, 5*time.Second)
	defer lookupCancel()

	existingStatus, found, err := newsletterRepository.GetStatusByEmail(lookupCtx, email)
	if err != nil {
		return Result{Status: "unknown-error"}
	}
	if !found {
		return Result{Status: "success"}
	}

	if existingStatus == "active" {
		return Result{Status: "success"}
	}

	confirmToken, err := generateConfirmToken()
	if err != nil {
		return Result{Status: "unknown-error"}
	}

	confirmURL, err := buildConfirmURL(siteURL, confirmToken, locale)
	if err != nil {
		return Result{Status: "unknown-error"}
	}

	now := time.Now().UTC()
	updateCtx, updateCancel := context.WithTimeout(ctx, 10*time.Second)
	defer updateCancel()

	err = newsletterRepository.UpdatePendingSubscription(updateCtx, PendingSubscription{
		Email:                 email,
		Locale:                locale,
		UpdatedAt:             now,
		IPHash:                hashValue(strings.TrimSpace(meta.ClientIP)),
		UserAgent:             strings.TrimSpace(meta.UserAgent),
		ConfirmTokenHash:      hashValue(confirmToken),
		ConfirmTokenExpiresAt: now.Add(newsletterConfirmTokenTTL),
		ConfirmRequestedAt:    now,
	})
	if err != nil {
		return Result{Status: "unknown-error"}
	}

	if err := sendConfirmationEmail(smtpCfg, email, confirmURL, locale, siteURL); err != nil {
		return Result{Status: "unknown-error"}
	}

	return Result{Status: "success"}
}

func Confirm(ctx context.Context, token string) Result {
	if strings.TrimSpace(token) == "" {
		return Result{Status: "invalid-link"}
	}

	_, dbErr := newsletterpkg.ResolveDatabaseName()
	if dbErr != nil {
		return Result{Status: "config-error"}
	}

	now := time.Now().UTC()
	updateCtx, updateCancel := context.WithTimeout(ctx, 10*time.Second)
	defer updateCancel()

	matched, err := newsletterRepository.ConfirmByTokenHash(updateCtx, hashValue(strings.TrimSpace(token)), now)
	if err != nil {
		if errors.Is(err, errRepositoryUnavailable) {
			return Result{Status: "service-unavailable"}
		}
		return Result{Status: "failed"}
	}
	if !matched {
		return Result{Status: "expired"}
	}

	return Result{Status: "success"}
}

func Unsubscribe(ctx context.Context, token string) Result {
	if strings.TrimSpace(token) == "" {
		return Result{Status: "invalid-link"}
	}

	_, dbErr := newsletterpkg.ResolveDatabaseName()
	if dbErr != nil {
		return Result{Status: "config-error"}
	}

	unsubscribeSecret, err := newsletterpkg.ResolveUnsubscribeSecret()
	if err != nil {
		return Result{Status: "config-error"}
	}

	email, tokenErr := newsletterpkg.ParseUnsubscribeToken(strings.TrimSpace(token), unsubscribeSecret, time.Now().UTC())
	if tokenErr != nil {
		return Result{Status: "invalid-link"}
	}

	now := time.Now().UTC()
	updateCtx, updateCancel := context.WithTimeout(ctx, 10*time.Second)
	defer updateCancel()

	err = newsletterRepository.UnsubscribeByEmail(updateCtx, email, now)
	if err != nil {
		if errors.Is(err, errRepositoryUnavailable) {
			return Result{Status: "service-unavailable"}
		}
		return Result{Status: "failed"}
	}

	return Result{Status: "success"}
}
