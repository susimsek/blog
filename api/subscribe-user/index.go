package handler

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/mail"
	"net/url"
	"strings"
	"sync"
	"time"

	"suaybsimsek.com/blog-api/pkg/newsletter"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

const (
	newsletterCollectionName    = "newsletter_subscribers"
	defaultNewsletterFormName   = "preFooterNewsletter"
	defaultNewsletterSourceName = "pre-footer"

	newsletterConfirmTokenTTL = 24 * time.Hour
)

var defaultNewsletterTags = []string{"preFooterNewsletter"}

type subscribeRequest struct {
	Email    string   `json:"email"`
	Terms    bool     `json:"terms"`
	Tags     []string `json:"tags"`
	FormName string   `json:"formName"`
}

type subscribeResponse struct {
	Status    string `json:"status"`
	ForwardTo string `json:"forwardTo,omitempty"`
}

type subscribeRateLimiter struct {
	mu              sync.Mutex
	maxAttempts     int
	window          time.Duration
	cleanupInterval time.Duration
	lastCleanup     time.Time
	entries         map[string][]time.Time
}

func newSubscribeRateLimiter(maxAttempts int, window time.Duration) *subscribeRateLimiter {
	return &subscribeRateLimiter{
		maxAttempts:     maxAttempts,
		window:          window,
		cleanupInterval: window,
		lastCleanup:     time.Now().UTC(),
		entries:         make(map[string][]time.Time),
	}
}

func (limit *subscribeRateLimiter) pruneStaleEntriesLocked(cutoff time.Time) {
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

func (limit *subscribeRateLimiter) allow(clientID string) bool {
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
	subscribeLimiter = newSubscribeRateLimiter(5, time.Minute)

	subscriberClient  *mongo.Client
	subscriberInitErr error
	subscriberOnce    sync.Once

	subscriberIndexesOnce sync.Once
	subscriberIndexesErr  error
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

func resolveClientIP(r *http.Request) string {
	forwarded := strings.TrimSpace(r.Header.Get("X-Forwarded-For"))
	if forwarded != "" {
		parts := strings.Split(forwarded, ",")
		if len(parts) > 0 {
			return strings.TrimSpace(parts[0])
		}
	}

	if realIP := strings.TrimSpace(r.Header.Get("X-Real-IP")); realIP != "" {
		return realIP
	}

	host, _, err := net.SplitHostPort(strings.TrimSpace(r.RemoteAddr))
	if err == nil {
		return host
	}

	return strings.TrimSpace(r.RemoteAddr)
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

	parsed.Path = strings.TrimRight(parsed.Path, "/") + "/" + strings.TrimSpace(locale) + "/newsletter-status"
	query := parsed.Query()
	query.Set("token", token)
	query.Set("operation", "confirm")
	query.Set("locale", locale)
	parsed.RawQuery = query.Encode()

	return parsed.String(), nil
}

func sendConfirmationEmail(cfg newsletter.SMTPConfig, recipientEmail, confirmURL, locale, siteURL string) error {
	subject, htmlBody, err := newsletter.ConfirmationEmail(locale, confirmURL, siteURL)
	if err != nil {
		return fmt.Errorf("build confirmation email failed: %w", err)
	}

	return newsletter.SendHTMLEmail(cfg, recipientEmail, subject, htmlBody, nil)
}

func getSubscriberClient() (*mongo.Client, error) {
	subscriberOnce.Do(func() {
		uri, err := newsletter.ResolveMongoURI()
		if err != nil {
			subscriberInitErr = err
			return
		}

		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		client, err := mongo.Connect(ctx, options.Client().ApplyURI(uri).SetAppName("blog-api-newsletter"))
		if err != nil {
			subscriberInitErr = fmt.Errorf("mongodb connect failed: %w", err)
			return
		}

		subscriberClient = client
	})

	if subscriberInitErr != nil {
		return nil, subscriberInitErr
	}

	return subscriberClient, nil
}

func ensureSubscriberIndexes(collection *mongo.Collection) error {
	subscriberIndexesOnce.Do(func() {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		indexes := []mongo.IndexModel{
			{
				Keys:    bson.D{{Key: "email", Value: 1}},
				Options: options.Index().SetUnique(true).SetName("uniq_newsletter_email"),
			},
			{
				Keys: bson.D{
					{Key: "status", Value: 1},
					{Key: "locale", Value: 1},
				},
				Options: options.Index().SetName("idx_newsletter_status_locale"),
			},
			{
				Keys:    bson.D{{Key: "confirmTokenHash", Value: 1}},
				Options: options.Index().SetName("idx_confirm_token_hash"),
			},
			{
				Keys: bson.D{{Key: "confirmTokenExpiresAt", Value: 1}},
				Options: options.Index().
					SetName("ttl_confirm_token_expiry").
					SetExpireAfterSeconds(0),
			},
		}

		_, err := collection.Indexes().CreateMany(ctx, indexes)
		if err != nil {
			subscriberIndexesErr = fmt.Errorf("create index failed: %w", err)
		}
	})

	return subscriberIndexesErr
}

func writeJSON(w http.ResponseWriter, statusCode int, payload subscribeResponse) {
	w.WriteHeader(statusCode)
	_ = json.NewEncoder(w).Encode(payload)
}

func Handler(w http.ResponseWriter, r *http.Request) {
	allowedOrigin, corsErr := newsletter.ResolveAllowedOriginRequired()
	if corsErr != nil {
		writeJSON(w, http.StatusInternalServerError, subscribeResponse{Status: "unknown-error"})
		return
	}

	databaseName, databaseErr := newsletter.ResolveDatabaseName()
	if databaseErr != nil {
		writeJSON(w, http.StatusInternalServerError, subscribeResponse{Status: "unknown-error"})
		return
	}

	siteURL, siteErr := newsletter.ResolveSiteURL()
	if siteErr != nil {
		writeJSON(w, http.StatusInternalServerError, subscribeResponse{Status: "unknown-error"})
		return
	}

	smtpCfg, smtpErr := newsletter.ResolveSMTPConfig()
	if smtpErr != nil {
		writeJSON(w, http.StatusInternalServerError, subscribeResponse{Status: "unknown-error"})
		return
	}

	w.Header().Set("Access-Control-Allow-Origin", allowedOrigin)
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept-Language")
	w.Header().Set("Vary", "Origin")
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.Header().Set("Cache-Control", "no-store")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}

	if r.Method != http.MethodPost {
		w.Header().Set("Allow", "POST, OPTIONS")
		writeJSON(w, http.StatusMethodNotAllowed, subscribeResponse{Status: "unknown-error"})
		return
	}

	var request subscribeRequest
	decoder := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<20))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&request); err != nil {
		writeJSON(w, http.StatusBadRequest, subscribeResponse{Status: "unknown-error"})
		return
	}

	if err := decoder.Decode(&struct{}{}); err != io.EOF {
		writeJSON(w, http.StatusBadRequest, subscribeResponse{Status: "unknown-error"})
		return
	}

	if request.Terms {
		writeJSON(w, http.StatusOK, subscribeResponse{Status: "success"})
		return
	}

	locale := newsletter.ResolveLocale("", r.Header.Get("Accept-Language"))

	email, err := normalizeEmail(request.Email)
	if err != nil {
		writeJSON(w, http.StatusOK, subscribeResponse{Status: "invalid-email"})
		return
	}

	clientIP := resolveClientIP(r)
	if !subscribeLimiter.allow(clientIP) {
		writeJSON(w, http.StatusTooManyRequests, subscribeResponse{Status: "rate-limited"})
		return
	}

	client, err := getSubscriberClient()
	if err != nil {
		writeJSON(w, http.StatusServiceUnavailable, subscribeResponse{Status: "unknown-error"})
		return
	}

	collection := client.Database(databaseName).Collection(newsletterCollectionName)
	if err := ensureSubscriberIndexes(collection); err != nil {
		writeJSON(w, http.StatusServiceUnavailable, subscribeResponse{Status: "unknown-error"})
		return
	}

	lookupCtx, lookupCancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer lookupCancel()

	var existing struct {
		Status string `bson:"status"`
	}
	err = collection.FindOne(lookupCtx, bson.M{"email": email}).Decode(&existing)
	if err != nil && err != mongo.ErrNoDocuments {
		writeJSON(w, http.StatusServiceUnavailable, subscribeResponse{Status: "unknown-error"})
		return
	}

	if err == nil && existing.Status == "active" {
		writeJSON(w, http.StatusOK, subscribeResponse{Status: "success"})
		return
	}

	confirmToken, err := generateConfirmToken()
	if err != nil {
		writeJSON(w, http.StatusServiceUnavailable, subscribeResponse{Status: "unknown-error"})
		return
	}

	confirmURL, err := buildConfirmURL(siteURL, confirmToken, locale)
	if err != nil {
		writeJSON(w, http.StatusServiceUnavailable, subscribeResponse{Status: "unknown-error"})
		return
	}

	now := time.Now().UTC()
	update := bson.M{
		"$set": bson.M{
			"email":                 email,
			"locale":                locale,
			"status":                "pending",
			"tags":                  normalizeTags(request.Tags),
			"formName":              normalizeFormName(request.FormName),
			"source":                defaultNewsletterSourceName,
			"updatedAt":             now,
			"ipHash":                hashValue(clientIP),
			"userAgent":             strings.TrimSpace(r.UserAgent()),
			"confirmTokenHash":      hashValue(confirmToken),
			"confirmTokenExpiresAt": now.Add(newsletterConfirmTokenTTL),
			"confirmRequestedAt":    now,
		},
		"$setOnInsert": bson.M{
			"createdAt": now,
		},
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	_, err = collection.UpdateOne(ctx, bson.M{"email": email}, update, options.Update().SetUpsert(true))
	if err != nil {
		writeJSON(w, http.StatusServiceUnavailable, subscribeResponse{Status: "unknown-error"})
		return
	}

	if err := sendConfirmationEmail(smtpCfg, email, confirmURL, locale, siteURL); err != nil {
		writeJSON(w, http.StatusServiceUnavailable, subscribeResponse{Status: "unknown-error"})
		return
	}

	writeJSON(w, http.StatusOK, subscribeResponse{Status: "success"})
}
