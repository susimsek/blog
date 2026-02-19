package handler

import (
	"context"
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
	unsubscribeClient  *mongo.Client
	unsubscribeInitErr error
	unsubscribeOnce    sync.Once
)

func getUnsubscribeClient() (*mongo.Client, error) {
	unsubscribeOnce.Do(func() {
		uri, err := newsletter.ResolveMongoURI()
		if err != nil {
			unsubscribeInitErr = err
			return
		}

		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		client, err := mongo.Connect(ctx, options.Client().ApplyURI(uri).SetAppName("blog-api-newsletter-unsubscribe"))
		if err != nil {
			unsubscribeInitErr = fmt.Errorf("mongodb connect failed: %w", err)
			return
		}

		unsubscribeClient = client
	})

	if unsubscribeInitErr != nil {
		return nil, unsubscribeInitErr
	}

	return unsubscribeClient, nil
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

	unsubscribeSecret, secretErr := newsletter.ResolveUnsubscribeSecret()
	if secretErr != nil {
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
		renderPage(w, http.StatusBadRequest, locale, siteURL, newsletter.PageUnsubscribeInvalid, siteURL)
		return
	}

	email, tokenErr := newsletter.ParseUnsubscribeToken(token, unsubscribeSecret, time.Now().UTC())
	if tokenErr != nil {
		renderPage(w, http.StatusBadRequest, locale, siteURL, newsletter.PageUnsubscribeInvalid, siteURL)
		return
	}

	client, err := getUnsubscribeClient()
	if err != nil {
		renderPage(w, http.StatusServiceUnavailable, locale, siteURL, newsletter.PageUnsubscribeFailed, siteURL)
		return
	}

	collection := client.Database(databaseName).Collection(newsletterCollectionName)
	now := time.Now().UTC()

	update := bson.M{
		"$set": bson.M{
			"status":         "unsubscribed",
			"updatedAt":      now,
			"unsubscribedAt": now,
		},
		"$unset": bson.M{
			"confirmTokenHash":      "",
			"confirmTokenExpiresAt": "",
			"confirmRequestedAt":    "",
		},
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	_, err = collection.UpdateOne(ctx, bson.M{"email": email}, update)
	if err != nil {
		renderPage(w, http.StatusServiceUnavailable, locale, siteURL, newsletter.PageUnsubscribeFailed, siteURL)
		return
	}

	renderPage(w, http.StatusOK, locale, siteURL, newsletter.PageUnsubscribeSuccess, siteURL)
}
