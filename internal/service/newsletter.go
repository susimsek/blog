package service

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"net/url"
	"strings"
	"sync"
	"time"

	appconfig "suaybsimsek.com/blog-api/internal/config"
	"suaybsimsek.com/blog-api/internal/domain"
	"suaybsimsek.com/blog-api/internal/repository"
	newsletterpkg "suaybsimsek.com/blog-api/pkg/newsletter"
)

const (
	defaultNewsletterFormName   = "preFooterNewsletter"
	defaultNewsletterSourceName = "pre-footer"
	newsletterConfirmTokenTTL   = 24 * time.Hour
	statusUnknownError          = "unknown-error"
	statusInvalidLink           = "invalid-link"
	statusConfigError           = "config-error"
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

type PendingSubscription = domain.NewsletterPendingSubscription

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
	subscribeLimiter                                           = newRateLimiter(5, time.Minute)
	resendLimiter                                              = newRateLimiter(5, time.Minute)
	newsletterRepository       repository.NewsletterRepository = repository.NewNewsletterMongoRepository()
	resolveSiteURLFn                                           = appconfig.ResolveSiteURL
	resolveMailConfigFn                                        = appconfig.ResolveMailConfig
	resolveDatabaseConfigFn                                    = appconfig.ResolveDatabaseConfig
	resolveUnsubscribeSecretFn                                 = appconfig.ResolveUnsubscribeSecret
	parseUnsubscribeTokenFn                                    = newsletterpkg.ParseUnsubscribeToken
	sendConfirmationEmailFn                                    = sendConfirmationEmail
	generateConfirmTokenFn                                     = generateConfirmToken
	nowUTCFn                                                   = func() time.Time { return time.Now().UTC() }
	errRepositoryUnavailable                                   = repository.ErrNewsletterRepositoryUnavailable
)

func normalizeEmail(value string) (string, error) {
	return newsletterpkg.NormalizeSubscriberEmail(value)
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
		return "", errors.New("invalid SITE_URL")
	}

	parsed.Path = strings.TrimRight(parsed.Path, "/") + "/" + strings.TrimSpace(locale) + "/callback"
	query := parsed.Query()
	query.Set("token", token)
	query.Set("operation", "confirm")
	parsed.RawQuery = query.Encode()

	return parsed.String(), nil
}

func sendConfirmationEmail(cfg appconfig.MailConfig, recipientEmail, confirmURL, locale, siteURL string) error {
	subject, htmlBody, err := newsletterpkg.ConfirmationEmail(locale, confirmURL, siteURL)
	if err != nil {
		return fmt.Errorf("build confirmation email failed: %w", err)
	}

	return newsletterpkg.SendHTMLEmail(cfg, recipientEmail, subject, htmlBody, nil)
}

type confirmationContext struct {
	siteURL string
	mailCfg appconfig.MailConfig
	locale  string
	email   string
}

type confirmationDispatch struct {
	confirmToken string
	confirmURL   string
	requestedAt  time.Time
	ipHash       string
	userAgent    string
	tokenHash    string
}

func resolveConfirmationContext(inputLocale, inputEmail string, meta RequestMetadata, limiter *rateLimiter) (confirmationContext, Result, bool) {
	siteURL, err := resolveSiteURLFn()
	if err != nil {
		return confirmationContext{}, Result{Status: statusUnknownError}, false
	}

	mailCfg, err := resolveMailConfigFn()
	if err != nil {
		return confirmationContext{}, Result{Status: statusUnknownError}, false
	}

	email, err := newsletterpkg.NormalizeSubscriberEmail(inputEmail)
	if err != nil {
		return confirmationContext{}, Result{Status: "invalid-email"}, false
	}

	if !limiter.allow(strings.TrimSpace(meta.ClientIP)) {
		return confirmationContext{}, Result{Status: "rate-limited"}, false
	}

	return confirmationContext{
		siteURL: siteURL,
		mailCfg: mailCfg,
		locale:  newsletterpkg.ResolveLocale(inputLocale, meta.AcceptLanguage),
		email:   email,
	}, Result{}, true
}

func newConfirmationDispatch(siteURL, locale string, meta RequestMetadata) (confirmationDispatch, error) {
	confirmToken, err := generateConfirmTokenFn()
	if err != nil {
		return confirmationDispatch{}, err
	}

	confirmURL, err := buildConfirmURL(siteURL, confirmToken, locale)
	if err != nil {
		return confirmationDispatch{}, err
	}

	requestedAt := nowUTCFn()
	return confirmationDispatch{
		confirmToken: confirmToken,
		confirmURL:   confirmURL,
		requestedAt:  requestedAt,
		ipHash:       hashValue(strings.TrimSpace(meta.ClientIP)),
		userAgent:    strings.TrimSpace(meta.UserAgent),
		tokenHash:    hashValue(confirmToken),
	}, nil
}

func Subscribe(ctx context.Context, input SubscribeInput, meta RequestMetadata) Result {
	if input.Terms {
		return Result{Status: "success"}
	}

	confirmationCtx, result, ok := resolveConfirmationContext(input.Locale, input.Email, meta, subscribeLimiter)
	if !ok {
		return result
	}

	lookupCtx, lookupCancel := context.WithTimeout(ctx, 5*time.Second)
	defer lookupCancel()

	existingStatus, found, err := newsletterRepository.GetStatusByEmail(lookupCtx, confirmationCtx.email)
	if err != nil {
		return Result{Status: statusUnknownError}
	}

	if found && existingStatus == "active" {
		return Result{Status: "success"}
	}

	dispatch, err := newConfirmationDispatch(confirmationCtx.siteURL, confirmationCtx.locale, meta)
	if err != nil {
		return Result{Status: statusUnknownError}
	}

	updateCtx, updateCancel := context.WithTimeout(ctx, 10*time.Second)
	defer updateCancel()
	createdAt := dispatch.requestedAt

	err = newsletterRepository.UpsertPendingSubscription(updateCtx, domain.NewsletterPendingSubscription{
		Email:                 confirmationCtx.email,
		Locale:                confirmationCtx.locale,
		Tags:                  normalizeTags(input.Tags),
		FormName:              normalizeFormName(input.FormName),
		Source:                defaultNewsletterSourceName,
		UpdatedAt:             dispatch.requestedAt,
		IPHash:                dispatch.ipHash,
		UserAgent:             dispatch.userAgent,
		ConfirmTokenHash:      dispatch.tokenHash,
		ConfirmTokenExpiresAt: dispatch.requestedAt.Add(newsletterConfirmTokenTTL),
		ConfirmRequestedAt:    dispatch.requestedAt,
		CreatedAt:             &createdAt,
	})
	if err != nil {
		return Result{Status: statusUnknownError}
	}

	if sendConfirmationEmailFn(confirmationCtx.mailCfg, confirmationCtx.email, dispatch.confirmURL, confirmationCtx.locale, confirmationCtx.siteURL) != nil {
		return Result{Status: statusUnknownError}
	}

	return Result{Status: "success"}
}

func Resend(ctx context.Context, input ResendInput, meta RequestMetadata) Result {
	if input.Terms {
		return Result{Status: "success"}
	}

	confirmationCtx, result, ok := resolveConfirmationContext(input.Locale, input.Email, meta, resendLimiter)
	if !ok {
		return result
	}

	lookupCtx, lookupCancel := context.WithTimeout(ctx, 5*time.Second)
	defer lookupCancel()

	existingStatus, found, err := newsletterRepository.GetStatusByEmail(lookupCtx, confirmationCtx.email)
	if err != nil {
		return Result{Status: statusUnknownError}
	}
	if !found {
		return Result{Status: "success"}
	}

	if existingStatus == "active" {
		return Result{Status: "success"}
	}

	dispatch, err := newConfirmationDispatch(confirmationCtx.siteURL, confirmationCtx.locale, meta)
	if err != nil {
		return Result{Status: statusUnknownError}
	}

	updateCtx, updateCancel := context.WithTimeout(ctx, 10*time.Second)
	defer updateCancel()

	err = newsletterRepository.UpdatePendingSubscription(updateCtx, domain.NewsletterPendingSubscription{
		Email:                 confirmationCtx.email,
		Locale:                confirmationCtx.locale,
		UpdatedAt:             dispatch.requestedAt,
		IPHash:                dispatch.ipHash,
		UserAgent:             dispatch.userAgent,
		ConfirmTokenHash:      dispatch.tokenHash,
		ConfirmTokenExpiresAt: dispatch.requestedAt.Add(newsletterConfirmTokenTTL),
		ConfirmRequestedAt:    dispatch.requestedAt,
	})
	if err != nil {
		return Result{Status: statusUnknownError}
	}

	if sendConfirmationEmailFn(confirmationCtx.mailCfg, confirmationCtx.email, dispatch.confirmURL, confirmationCtx.locale, confirmationCtx.siteURL) != nil {
		return Result{Status: statusUnknownError}
	}

	return Result{Status: "success"}
}

func Confirm(ctx context.Context, token string) Result {
	if strings.TrimSpace(token) == "" {
		return Result{Status: statusInvalidLink}
	}

	_, dbErr := resolveDatabaseConfigFn()
	if dbErr != nil {
		return Result{Status: statusConfigError}
	}

	now := nowUTCFn()
	updateCtx, updateCancel := context.WithTimeout(ctx, 10*time.Second)
	defer updateCancel()

	matched, err := newsletterRepository.ConfirmByTokenHash(updateCtx, hashValue(strings.TrimSpace(token)), now)
	if err != nil {
		if errors.Is(err, repository.ErrNewsletterRepositoryUnavailable) {
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
		return Result{Status: statusInvalidLink}
	}

	_, dbErr := resolveDatabaseConfigFn()
	if dbErr != nil {
		return Result{Status: statusConfigError}
	}

	unsubscribeSecret, err := resolveUnsubscribeSecretFn()
	if err != nil {
		return Result{Status: statusConfigError}
	}

	email, tokenErr := parseUnsubscribeTokenFn(strings.TrimSpace(token), unsubscribeSecret, nowUTCFn())
	if tokenErr != nil {
		return Result{Status: statusInvalidLink}
	}

	now := nowUTCFn()
	updateCtx, updateCancel := context.WithTimeout(ctx, 10*time.Second)
	defer updateCancel()

	err = newsletterRepository.UnsubscribeByEmail(updateCtx, email, now)
	if err != nil {
		if errors.Is(err, repository.ErrNewsletterRepositoryUnavailable) {
			return Result{Status: "service-unavailable"}
		}
		return Result{Status: "failed"}
	}

	return Result{Status: "success"}
}
