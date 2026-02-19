package handler

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"net/http"
	"strings"
	"sync"
	"time"

	"suaybsimsek.com/blog-api/pkg/newsletter"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

const newsletterCollectionName = "newsletter_subscribers"

var (
	confirmClient  *mongo.Client
	confirmInitErr error
	confirmOnce    sync.Once
)

func getConfirmClient() (*mongo.Client, error) {
	confirmOnce.Do(func() {
		uri, err := newsletter.ResolveMongoURI()
		if err != nil {
			confirmInitErr = err
			return
		}

		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		client, err := mongo.Connect(ctx, options.Client().ApplyURI(uri).SetAppName("blog-api-newsletter-confirm"))
		if err != nil {
			confirmInitErr = fmt.Errorf("mongodb connect failed: %w", err)
			return
		}

		confirmClient = client
	})

	if confirmInitErr != nil {
		return nil, confirmInitErr
	}

	return confirmClient, nil
}

func hashValue(value string) string {
	if value == "" {
		return ""
	}
	sum := sha256.Sum256([]byte(value))
	return hex.EncodeToString(sum[:])
}

func renderPage(w http.ResponseWriter, statusCode int, locale string, siteURL string, page newsletter.PageKey, buttonHref string) {
	content := newsletter.ConfirmationPage(locale, page)
	if err := newsletter.RenderStatusPage(
		w,
		statusCode,
		locale,
		siteURL,
		content.Title,
		content.Heading,
		content.Message,
		buttonHref,
		content.ButtonLabel,
	); err != nil {
		http.Error(w, "failed to render page", http.StatusInternalServerError)
	}
}

func Handler(w http.ResponseWriter, r *http.Request) {
	locale := newsletter.ResolveLocale(strings.TrimSpace(r.URL.Query().Get("locale")), r.Header.Get("Accept-Language"))
	siteURL := newsletter.ResolveSiteURLOrRoot()

	allowedOrigin, corsErr := newsletter.ResolveAllowedOriginRequired()
	if corsErr != nil {
		renderPage(w, http.StatusInternalServerError, locale, siteURL, newsletter.PageConfigError, "/")
		return
	}

	databaseName, databaseErr := newsletter.ResolveDatabaseName()
	if databaseErr != nil {
		renderPage(w, http.StatusInternalServerError, locale, siteURL, newsletter.PageConfigError, "/")
		return
	}

	w.Header().Set("Access-Control-Allow-Origin", allowedOrigin)
	w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
	w.Header().Set("Vary", "Origin")
	w.Header().Set("Cache-Control", "no-store")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}

	if r.Method != http.MethodGet {
		w.Header().Set("Allow", "GET, OPTIONS")
		renderPage(w, http.StatusMethodNotAllowed, locale, siteURL, newsletter.PageMethodNotAllowed, siteURL)
		return
	}

	token := strings.TrimSpace(r.URL.Query().Get("token"))
	if token == "" {
		renderPage(w, http.StatusBadRequest, locale, siteURL, newsletter.PageMissingToken, siteURL)
		return
	}

	client, err := getConfirmClient()
	if err != nil {
		renderPage(w, http.StatusServiceUnavailable, locale, siteURL, newsletter.PageServiceDown, siteURL)
		return
	}

	collection := client.Database(databaseName).Collection(newsletterCollectionName)
	now := time.Now().UTC()

	filter := bson.M{
		"confirmTokenHash":      hashValue(token),
		"status":                "pending",
		"confirmTokenExpiresAt": bson.M{"$gt": now},
	}

	update := bson.M{
		"$set": bson.M{
			"status":      "active",
			"confirmedAt": now,
			"updatedAt":   now,
		},
		"$unset": bson.M{
			"confirmTokenHash":      "",
			"confirmTokenExpiresAt": "",
			"confirmRequestedAt":    "",
		},
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	result, err := collection.UpdateOne(ctx, filter, update)
	if err != nil {
		renderPage(w, http.StatusServiceUnavailable, locale, siteURL, newsletter.PageConfirmFailed, siteURL)
		return
	}

	if result.MatchedCount == 0 {
		renderPage(w, http.StatusBadRequest, locale, siteURL, newsletter.PageTokenExpired, siteURL)
		return
	}

	renderPage(w, http.StatusOK, locale, siteURL, newsletter.PageSuccess, siteURL)
}
