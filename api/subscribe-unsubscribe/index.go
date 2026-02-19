package handler

import (
	"context"
	"fmt"
	"html"
	"net/http"
	"os"
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

func resolveAllowedOrigin() (string, error) {
	value := os.Getenv("API_CORS_ORIGIN")
	if value == "" {
		return "", fmt.Errorf("missing required env: API_CORS_ORIGIN")
	}
	return value, nil
}

func resolveDatabaseName() (string, error) {
	value := os.Getenv("MONGODB_DATABASE")
	if value == "" {
		return "", fmt.Errorf("missing required env: MONGODB_DATABASE")
	}
	return value, nil
}

func resolveMongoURI() (string, error) {
	value := strings.TrimSpace(os.Getenv("MONGODB_URI"))
	if value == "" {
		return "", fmt.Errorf("missing required env: MONGODB_URI")
	}
	return value, nil
}

func resolveSiteURL() string {
	value := strings.TrimSpace(os.Getenv("SITE_URL"))
	if value == "" {
		return "/"
	}
	return strings.TrimRight(value, "/")
}

func resolveUnsubscribeSecret() (string, error) {
	value := strings.TrimSpace(os.Getenv("NEWSLETTER_UNSUBSCRIBE_SECRET"))
	if value != "" {
		return value, nil
	}

	return "", fmt.Errorf("missing required env: NEWSLETTER_UNSUBSCRIBE_SECRET")
}

func getUnsubscribeClient() (*mongo.Client, error) {
	unsubscribeOnce.Do(func() {
		uri, err := resolveMongoURI()
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

func renderHTMLPage(w http.ResponseWriter, statusCode int, title, heading, message, buttonHref, buttonLabel string) {
	escapedTitle := html.EscapeString(title)
	escapedHeading := html.EscapeString(heading)
	escapedMessage := html.EscapeString(message)
	escapedButtonHref := html.EscapeString(buttonHref)
	escapedButtonLabel := html.EscapeString(buttonLabel)

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.WriteHeader(statusCode)
	_, _ = fmt.Fprintf(w, `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>%s</title>
  </head>
  <body style="margin:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;color:#111827;">
    <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:28px;">
            <tr><td style="font-size:38px;font-weight:800;padding-bottom:8px;">Suayb's Blog</td></tr>
            <tr><td style="font-size:32px;line-height:1.2;font-weight:700;padding:8px 0 10px;">%s</td></tr>
            <tr><td style="font-size:18px;line-height:1.7;color:#374151;padding-bottom:20px;">%s</td></tr>
            <tr>
              <td>
                <a href="%s" style="display:inline-block;background:#1677ff;color:#fff;text-decoration:none;font-weight:700;border-radius:999px;padding:13px 24px;font-size:17px;">%s</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`, escapedTitle, escapedHeading, escapedMessage, escapedButtonHref, escapedButtonLabel)
}

func Handler(w http.ResponseWriter, r *http.Request) {
	locale := newsletter.ResolveLocale(strings.TrimSpace(r.URL.Query().Get("locale")), r.Header.Get("Accept-Language"))

	allowedOrigin, corsErr := resolveAllowedOrigin()
	if corsErr != nil {
		page := newsletter.ConfirmationPage(locale, newsletter.PageConfigError)
		renderHTMLPage(w, http.StatusInternalServerError, page.Title, page.Heading, page.Message, "/", page.ButtonLabel)
		return
	}

	databaseName, databaseErr := resolveDatabaseName()
	if databaseErr != nil {
		page := newsletter.ConfirmationPage(locale, newsletter.PageConfigError)
		renderHTMLPage(w, http.StatusInternalServerError, page.Title, page.Heading, page.Message, "/", page.ButtonLabel)
		return
	}

	unsubscribeSecret, secretErr := resolveUnsubscribeSecret()
	if secretErr != nil {
		page := newsletter.ConfirmationPage(locale, newsletter.PageConfigError)
		renderHTMLPage(w, http.StatusInternalServerError, page.Title, page.Heading, page.Message, "/", page.ButtonLabel)
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
		page := newsletter.ConfirmationPage(locale, newsletter.PageMethodNotAllowed)
		renderHTMLPage(
			w,
			http.StatusMethodNotAllowed,
			page.Title,
			page.Heading,
			page.Message,
			resolveSiteURL(),
			page.ButtonLabel,
		)
		return
	}

	token := strings.TrimSpace(r.URL.Query().Get("token"))
	if token == "" {
		page := newsletter.ConfirmationPage(locale, newsletter.PageUnsubscribeInvalid)
		renderHTMLPage(
			w,
			http.StatusBadRequest,
			page.Title,
			page.Heading,
			page.Message,
			resolveSiteURL(),
			page.ButtonLabel,
		)
		return
	}

	email, tokenErr := newsletter.ParseUnsubscribeToken(token, unsubscribeSecret, time.Now().UTC())
	if tokenErr != nil {
		page := newsletter.ConfirmationPage(locale, newsletter.PageUnsubscribeInvalid)
		renderHTMLPage(
			w,
			http.StatusBadRequest,
			page.Title,
			page.Heading,
			page.Message,
			resolveSiteURL(),
			page.ButtonLabel,
		)
		return
	}

	client, err := getUnsubscribeClient()
	if err != nil {
		page := newsletter.ConfirmationPage(locale, newsletter.PageUnsubscribeFailed)
		renderHTMLPage(
			w,
			http.StatusServiceUnavailable,
			page.Title,
			page.Heading,
			page.Message,
			resolveSiteURL(),
			page.ButtonLabel,
		)
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
		page := newsletter.ConfirmationPage(locale, newsletter.PageUnsubscribeFailed)
		renderHTMLPage(
			w,
			http.StatusServiceUnavailable,
			page.Title,
			page.Heading,
			page.Message,
			resolveSiteURL(),
			page.ButtonLabel,
		)
		return
	}

	page := newsletter.ConfirmationPage(locale, newsletter.PageUnsubscribeSuccess)
	renderHTMLPage(
		w,
		http.StatusOK,
		page.Title,
		page.Heading,
		page.Message,
		resolveSiteURL(),
		page.ButtonLabel,
	)
}
