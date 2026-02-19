package handler

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"encoding/xml"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/mail"
	"net/smtp"
	"net/url"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"

	"suaybsimsek.com/blog-api/pkg/newsletter"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

const (
	newsletterSubscribersCollection = "newsletter_subscribers"
	newsletterCampaignsCollection   = "newsletter_campaigns"
	newsletterDeliveriesCollection  = "newsletter_deliveries"
	defaultSMTPHost                 = "smtp.gmail.com"
	defaultSMTPPort                 = "587"
	defaultMaxRecipientsPerRun      = 200
	defaultDispatchTimeout          = 8 * time.Second
	defaultUnsubscribeTokenTTLHours = 24 * 365

	campaignStatusProcessing = "processing"
	campaignStatusPartial    = "partial"
	campaignStatusSent       = "sent"
	deliveryStatusSent       = "sent"
	deliveryStatusFailed     = "failed"
)

type dispatchResponse struct {
	Status    string                          `json:"status"`
	Message   string                          `json:"message"`
	Timestamp string                          `json:"timestamp"`
	Locales   map[string]dispatchLocaleResult `json:"locales"`
}

type dispatchLocaleResult struct {
	RSSURL      string `json:"rssUrl"`
	ItemKey     string `json:"itemKey,omitempty"`
	PostTitle   string `json:"postTitle,omitempty"`
	SentCount   int    `json:"sentCount"`
	FailedCount int    `json:"failedCount"`
	Skipped     bool   `json:"skipped"`
	Reason      string `json:"reason,omitempty"`
}

type smtpConfig struct {
	Host     string
	Port     string
	Username string
	Password string
	FromName string
	FromMail string
}

type rssFeed struct {
	Channel rssChannel `xml:"channel"`
}

type rssChannel struct {
	Items []rssItem `xml:"item"`
}

type rssItem struct {
	Title       string `xml:"title"`
	Link        string `xml:"link"`
	GUID        string `xml:"guid"`
	Description string `xml:"description"`
	PubDate     string `xml:"pubDate"`
}

type subscriber struct {
	Email  string `bson:"email"`
	Locale string `bson:"locale,omitempty"`
}

var (
	dispatchClient  *mongo.Client
	dispatchInitErr error
	dispatchOnce    sync.Once

	dispatchIndexOnce sync.Once
	dispatchIndexErr  error

	dispatchDeliveryIndexOnce sync.Once
	dispatchDeliveryIndexErr  error
)

func resolveAllowedOrigin() string {
	return strings.TrimSpace(os.Getenv("API_CORS_ORIGIN"))
}

func resolveDatabaseName() (string, error) {
	value := strings.TrimSpace(os.Getenv("MONGODB_DATABASE"))
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

func resolveSiteURL() (string, error) {
	value := strings.TrimSpace(os.Getenv("SITE_URL"))
	if value == "" {
		return "", fmt.Errorf("missing required env: SITE_URL")
	}
	return strings.TrimRight(value, "/"), nil
}

func resolveCronSecret() (string, error) {
	value := strings.TrimSpace(os.Getenv("CRON_SECRET"))
	if value == "" {
		return "", fmt.Errorf("missing required env: CRON_SECRET")
	}
	return value, nil
}

func resolveUnsubscribeSecret() (string, error) {
	value := strings.TrimSpace(os.Getenv("NEWSLETTER_UNSUBSCRIBE_SECRET"))
	if value != "" {
		return value, nil
	}

	return "", fmt.Errorf("missing required env: NEWSLETTER_UNSUBSCRIBE_SECRET")
}

func resolveSMTPConfig() (smtpConfig, error) {
	username := strings.TrimSpace(os.Getenv("GMAIL_SMTP_USER"))
	if username == "" {
		return smtpConfig{}, fmt.Errorf("missing required env: GMAIL_SMTP_USER")
	}

	password := strings.TrimSpace(os.Getenv("GMAIL_SMTP_APP_PASSWORD"))
	if password == "" {
		return smtpConfig{}, fmt.Errorf("missing required env: GMAIL_SMTP_APP_PASSWORD")
	}

	host := strings.TrimSpace(os.Getenv("GMAIL_SMTP_HOST"))
	if host == "" {
		host = defaultSMTPHost
	}

	port := strings.TrimSpace(os.Getenv("GMAIL_SMTP_PORT"))
	if port == "" {
		port = defaultSMTPPort
	}

	fromMail := strings.TrimSpace(os.Getenv("GMAIL_FROM_EMAIL"))
	if fromMail == "" {
		fromMail = username
	}

	fromName := strings.TrimSpace(os.Getenv("GMAIL_FROM_NAME"))
	if fromName == "" {
		fromName = "Suayb's Blog"
	}

	return smtpConfig{
		Host:     host,
		Port:     port,
		Username: username,
		Password: password,
		FromName: fromName,
		FromMail: fromMail,
	}, nil
}

func resolveDispatchLocalesFromSubscribers(collection *mongo.Collection) ([]string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	values, err := collection.Distinct(ctx, "locale", bson.M{
		"status": "active",
		"locale": bson.M{
			"$in": []string{newsletter.LocaleEN, newsletter.LocaleTR},
		},
	})
	if err != nil {
		return nil, err
	}

	hasEN := false
	hasTR := false
	for _, value := range values {
		locale, ok := value.(string)
		if !ok {
			continue
		}
		switch strings.TrimSpace(locale) {
		case newsletter.LocaleEN:
			hasEN = true
		case newsletter.LocaleTR:
			hasTR = true
		}
	}

	locales := make([]string, 0, 2)
	if hasEN {
		locales = append(locales, newsletter.LocaleEN)
	}
	if hasTR {
		locales = append(locales, newsletter.LocaleTR)
	}

	return locales, nil
}

func resolveMaxRecipientsPerRun() int {
	value := strings.TrimSpace(os.Getenv("NEWSLETTER_MAX_RECIPIENTS_PER_RUN"))
	if value == "" {
		return defaultMaxRecipientsPerRun
	}

	parsed, err := strconv.Atoi(value)
	if err != nil || parsed <= 0 {
		return defaultMaxRecipientsPerRun
	}

	return parsed
}

func resolveUnsubscribeTokenTTL() time.Duration {
	value := strings.TrimSpace(os.Getenv("NEWSLETTER_UNSUBSCRIBE_TOKEN_TTL_HOURS"))
	if value == "" {
		return time.Duration(defaultUnsubscribeTokenTTLHours) * time.Hour
	}

	parsed, err := strconv.Atoi(value)
	if err != nil || parsed <= 0 {
		return time.Duration(defaultUnsubscribeTokenTTLHours) * time.Hour
	}

	return time.Duration(parsed) * time.Hour
}

func resolveRSSURL(siteURL, locale string) string {
	baseURL := strings.TrimRight(siteURL, "/")
	switch locale {
	case newsletter.LocaleTR:
		return baseURL + "/tr/rss.xml"
	default:
		return baseURL + "/en/rss.xml"
	}
}

func getDispatchClient() (*mongo.Client, error) {
	dispatchOnce.Do(func() {
		uri, err := resolveMongoURI()
		if err != nil {
			dispatchInitErr = err
			return
		}

		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		client, err := mongo.Connect(ctx, options.Client().ApplyURI(uri).SetAppName("blog-api-newsletter-dispatch"))
		if err != nil {
			dispatchInitErr = fmt.Errorf("mongodb connect failed: %w", err)
			return
		}

		dispatchClient = client
	})

	if dispatchInitErr != nil {
		return nil, dispatchInitErr
	}

	return dispatchClient, nil
}

func ensureCampaignIndexes(collection *mongo.Collection) error {
	dispatchIndexOnce.Do(func() {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		indexes := []mongo.IndexModel{
			{
				Keys: bson.D{
					{Key: "locale", Value: 1},
					{Key: "itemKey", Value: 1},
				},
				Options: options.Index().
					SetUnique(true).
					SetName("uniq_newsletter_campaign_locale_item"),
			},
		}

		_, err := collection.Indexes().CreateMany(ctx, indexes)
		if err != nil {
			dispatchIndexErr = fmt.Errorf("create index failed: %w", err)
		}
	})

	return dispatchIndexErr
}

func ensureDeliveryIndexes(collection *mongo.Collection) error {
	dispatchDeliveryIndexOnce.Do(func() {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		indexes := []mongo.IndexModel{
			{
				Keys: bson.D{
					{Key: "locale", Value: 1},
					{Key: "itemKey", Value: 1},
					{Key: "email", Value: 1},
				},
				Options: options.Index().
					SetUnique(true).
					SetName("uniq_newsletter_delivery_locale_item_email"),
			},
		}

		_, err := collection.Indexes().CreateMany(ctx, indexes)
		if err != nil {
			dispatchDeliveryIndexErr = fmt.Errorf("create delivery index failed: %w", err)
		}
	})

	return dispatchDeliveryIndexErr
}

func getOrCreateCampaign(
	collection *mongo.Collection,
	locale string,
	itemKey string,
	item rssItem,
	rssURL string,
	now time.Time,
) (status string, created bool, err error) {
	insertCtx, insertCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer insertCancel()

	_, insertErr := collection.InsertOne(insertCtx, bson.M{
		"locale":      locale,
		"itemKey":     itemKey,
		"title":       strings.TrimSpace(item.Title),
		"link":        strings.TrimSpace(item.Link),
		"pubDate":     strings.TrimSpace(item.PubDate),
		"rssURL":      rssURL,
		"status":      campaignStatusProcessing,
		"createdAt":   now,
		"updatedAt":   now,
		"sentCount":   0,
		"failedCount": 0,
		"lastRunAt":   now,
	})
	if insertErr == nil {
		return campaignStatusProcessing, true, nil
	}

	if !mongo.IsDuplicateKeyError(insertErr) {
		return "", false, insertErr
	}

	findCtx, findCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer findCancel()

	var campaign struct {
		Status string `bson:"status"`
	}
	findErr := collection.FindOne(findCtx, bson.M{
		"locale":  locale,
		"itemKey": itemKey,
	}).Decode(&campaign)
	if findErr != nil {
		return "", false, findErr
	}

	if strings.TrimSpace(campaign.Status) == "" {
		return campaignStatusProcessing, false, nil
	}

	return campaign.Status, false, nil
}

func truncateForStorage(value string, maxRunes int) string {
	if maxRunes <= 0 {
		return ""
	}
	runes := []rune(strings.TrimSpace(value))
	if len(runes) <= maxRunes {
		return strings.TrimSpace(value)
	}
	return string(runes[:maxRunes])
}

func upsertDeliveryAttempt(
	collection *mongo.Collection,
	locale string,
	itemKey string,
	email string,
	status string,
	errorMessage string,
	now time.Time,
) error {
	filter := bson.M{
		"locale":  locale,
		"itemKey": itemKey,
		"email":   email,
	}

	setFields := bson.M{
		"status":        status,
		"updatedAt":     now,
		"lastAttemptAt": now,
	}
	unsetFields := bson.M{}

	if status == deliveryStatusSent {
		setFields["sentAt"] = now
		unsetFields["lastError"] = ""
	} else {
		setFields["lastError"] = truncateForStorage(errorMessage, 400)
	}

	update := bson.M{
		"$set": setFields,
		"$setOnInsert": bson.M{
			"createdAt": now,
			"locale":    locale,
			"itemKey":   itemKey,
			"email":     email,
		},
	}
	if len(unsetFields) > 0 {
		update["$unset"] = unsetFields
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	_, err := collection.UpdateOne(ctx, filter, update, options.Update().SetUpsert(true))
	return err
}

func isAlreadyDelivered(
	collection *mongo.Collection,
	locale string,
	itemKey string,
	email string,
) (bool, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 8*time.Second)
	defer cancel()

	err := collection.FindOne(ctx, bson.M{
		"locale":  locale,
		"itemKey": itemKey,
		"email":   email,
		"status":  deliveryStatusSent,
	}).Err()
	if err == nil {
		return true, nil
	}
	if err == mongo.ErrNoDocuments {
		return false, nil
	}
	return false, err
}

func countDeliveriesByStatus(
	collection *mongo.Collection,
	locale string,
	itemKey string,
	status string,
) (int64, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	return collection.CountDocuments(ctx, bson.M{
		"locale":  locale,
		"itemKey": itemKey,
		"status":  status,
	})
}

func normalizeItemKey(item rssItem) string {
	if value := strings.TrimSpace(item.GUID); value != "" {
		return value
	}
	if value := strings.TrimSpace(item.Link); value != "" {
		return value
	}

	base := fmt.Sprintf("%s|%s|%s", strings.TrimSpace(item.Title), strings.TrimSpace(item.PubDate), strings.TrimSpace(item.Description))
	sum := sha256.Sum256([]byte(base))
	return hex.EncodeToString(sum[:])
}

func fetchLatestRSSItem(rssURL string) (*rssItem, error) {
	client := &http.Client{Timeout: defaultDispatchTimeout}
	req, err := http.NewRequest(http.MethodGet, rssURL, nil)
	if err != nil {
		return nil, fmt.Errorf("create rss request failed: %w", err)
	}
	req.Header.Set("User-Agent", "suayb-blog-newsletter-dispatch/1.0")

	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("rss fetch failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("rss fetch failed: status=%d", resp.StatusCode)
	}

	body, err := io.ReadAll(io.LimitReader(resp.Body, 2<<20))
	if err != nil {
		return nil, fmt.Errorf("read rss body failed: %w", err)
	}

	var feed rssFeed
	if err := xml.Unmarshal(body, &feed); err != nil {
		return nil, fmt.Errorf("parse rss failed: %w", err)
	}

	for _, item := range feed.Channel.Items {
		if strings.TrimSpace(item.Link) != "" {
			copyItem := item
			return &copyItem, nil
		}
	}

	return nil, nil
}

func buildUnsubscribeURL(siteURL, token, locale string) (string, error) {
	parsed, err := url.Parse(siteURL)
	if err != nil || parsed.Scheme == "" || parsed.Host == "" {
		return "", fmt.Errorf("invalid SITE_URL")
	}

	parsed.Path = strings.TrimRight(parsed.Path, "/") + "/api/subscribe-unsubscribe"
	query := parsed.Query()
	query.Set("token", token)
	query.Set("locale", locale)
	parsed.RawQuery = query.Encode()

	return parsed.String(), nil
}

func sendPostEmail(
	cfg smtpConfig,
	recipientEmail string,
	locale string,
	item rssItem,
	rssURL string,
	unsubscribeURL string,
) error {
	subject, plainBody, htmlBody := newsletter.PostAnnouncementEmail(
		locale,
		strings.TrimSpace(item.Title),
		strings.TrimSpace(item.Description),
		strings.TrimSpace(item.Link),
		rssURL,
		unsubscribeURL,
	)

	boundary := fmt.Sprintf("newsletter-boundary-%d", time.Now().UnixNano())
	fromHeader := fmt.Sprintf("%s <%s>", cfg.FromName, cfg.FromMail)

	message := strings.Builder{}
	message.WriteString(fmt.Sprintf("From: %s\r\n", fromHeader))
	message.WriteString(fmt.Sprintf("To: %s\r\n", recipientEmail))
	message.WriteString(fmt.Sprintf("Subject: %s\r\n", subject))
	message.WriteString(fmt.Sprintf("List-Unsubscribe: <%s>, <mailto:%s?subject=%s>\r\n", unsubscribeURL, cfg.FromMail, url.QueryEscape("unsubscribe")))
	message.WriteString("List-Unsubscribe-Post: List-Unsubscribe=One-Click\r\n")
	message.WriteString("Precedence: bulk\r\n")
	message.WriteString("MIME-Version: 1.0\r\n")
	message.WriteString(fmt.Sprintf("Content-Type: multipart/alternative; boundary=%s\r\n", boundary))
	message.WriteString("\r\n")
	message.WriteString(fmt.Sprintf("--%s\r\n", boundary))
	message.WriteString("Content-Type: text/plain; charset=\"UTF-8\"\r\n\r\n")
	message.WriteString(plainBody + "\r\n")
	message.WriteString(fmt.Sprintf("--%s\r\n", boundary))
	message.WriteString("Content-Type: text/html; charset=\"UTF-8\"\r\n\r\n")
	message.WriteString(htmlBody + "\r\n")
	message.WriteString(fmt.Sprintf("--%s--\r\n", boundary))

	auth := smtp.PlainAuth("", cfg.Username, cfg.Password, cfg.Host)
	serverAddr := net.JoinHostPort(cfg.Host, cfg.Port)
	if err := smtp.SendMail(serverAddr, auth, cfg.FromMail, []string{recipientEmail}, []byte(message.String())); err != nil {
		return fmt.Errorf("smtp send failed: %w", err)
	}

	return nil
}

func buildSubscriberFilter(locale string) bson.M {
	if locale == newsletter.LocaleTR {
		return bson.M{
			"status": "active",
			"locale": newsletter.LocaleTR,
		}
	}

	return bson.M{
		"status": "active",
		"locale": newsletter.LocaleEN,
	}
}

func writeJSON(w http.ResponseWriter, statusCode int, payload dispatchResponse) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(statusCode)
	_ = json.NewEncoder(w).Encode(payload)
}

func authorizeCronRequest(r *http.Request, secret string) bool {
	return strings.TrimSpace(r.Header.Get("Authorization")) == fmt.Sprintf("Bearer %s", secret)
}

func Handler(w http.ResponseWriter, r *http.Request) {
	allowedOrigin := resolveAllowedOrigin()
	if allowedOrigin != "" {
		w.Header().Set("Access-Control-Allow-Origin", allowedOrigin)
		w.Header().Set("Vary", "Origin")
	}
	w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
	w.Header().Set("Cache-Control", "no-store")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}

	if r.Method != http.MethodGet {
		w.Header().Set("Allow", "GET, OPTIONS")
		writeJSON(w, http.StatusMethodNotAllowed, dispatchResponse{
			Status:    "error",
			Message:   "method not allowed",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
			Locales:   map[string]dispatchLocaleResult{},
		})
		return
	}

	cronSecret, err := resolveCronSecret()
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, dispatchResponse{
			Status:    "error",
			Message:   "configuration error",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
			Locales:   map[string]dispatchLocaleResult{},
		})
		return
	}

	if !authorizeCronRequest(r, cronSecret) {
		writeJSON(w, http.StatusUnauthorized, dispatchResponse{
			Status:    "error",
			Message:   "unauthorized",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
			Locales:   map[string]dispatchLocaleResult{},
		})
		return
	}

	siteURL, err := resolveSiteURL()
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, dispatchResponse{
			Status:    "error",
			Message:   "configuration error",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
			Locales:   map[string]dispatchLocaleResult{},
		})
		return
	}

	unsubscribeSecret, err := resolveUnsubscribeSecret()
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, dispatchResponse{
			Status:    "error",
			Message:   "configuration error",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
			Locales:   map[string]dispatchLocaleResult{},
		})
		return
	}

	unsubscribeTokenTTL := resolveUnsubscribeTokenTTL()

	databaseName, err := resolveDatabaseName()
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, dispatchResponse{
			Status:    "error",
			Message:   "configuration error",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
			Locales:   map[string]dispatchLocaleResult{},
		})
		return
	}

	smtpCfg, err := resolveSMTPConfig()
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, dispatchResponse{
			Status:    "error",
			Message:   "smtp configuration error",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
			Locales:   map[string]dispatchLocaleResult{},
		})
		return
	}

	client, err := getDispatchClient()
	if err != nil {
		writeJSON(w, http.StatusServiceUnavailable, dispatchResponse{
			Status:    "error",
			Message:   "database unavailable",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
			Locales:   map[string]dispatchLocaleResult{},
		})
		return
	}

	maxRecipients := resolveMaxRecipientsPerRun()
	subscribersCollection := client.Database(databaseName).Collection(newsletterSubscribersCollection)
	campaignsCollection := client.Database(databaseName).Collection(newsletterCampaignsCollection)
	deliveriesCollection := client.Database(databaseName).Collection(newsletterDeliveriesCollection)
	if err := ensureCampaignIndexes(campaignsCollection); err != nil {
		writeJSON(w, http.StatusServiceUnavailable, dispatchResponse{
			Status:    "error",
			Message:   "campaign index error",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
			Locales:   map[string]dispatchLocaleResult{},
		})
		return
	}
	if err := ensureDeliveryIndexes(deliveriesCollection); err != nil {
		writeJSON(w, http.StatusServiceUnavailable, dispatchResponse{
			Status:    "error",
			Message:   "delivery index error",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
			Locales:   map[string]dispatchLocaleResult{},
		})
		return
	}

	results := make(map[string]dispatchLocaleResult)
	locales, localeResolveErr := resolveDispatchLocalesFromSubscribers(subscribersCollection)
	if localeResolveErr != nil {
		writeJSON(w, http.StatusServiceUnavailable, dispatchResponse{
			Status:    "error",
			Message:   "subscriber locale query failed",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
			Locales:   map[string]dispatchLocaleResult{},
		})
		return
	}

	for _, locale := range locales {
		rssURL := resolveRSSURL(siteURL, locale)
		result := dispatchLocaleResult{
			RSSURL: rssURL,
		}

		item, fetchErr := fetchLatestRSSItem(rssURL)
		if fetchErr != nil {
			result.Skipped = true
			result.Reason = "rss-fetch-failed"
			results[locale] = result
			continue
		}
		if item == nil {
			result.Skipped = true
			result.Reason = "rss-empty"
			results[locale] = result
			continue
		}

		itemKey := normalizeItemKey(*item)
		result.ItemKey = itemKey
		result.PostTitle = strings.TrimSpace(item.Title)

		now := time.Now().UTC()
		campaignStatus, created, campaignErr := getOrCreateCampaign(campaignsCollection, locale, itemKey, *item, rssURL, now)
		if campaignErr != nil {
			result.Skipped = true
			result.Reason = "campaign-create-failed"
			results[locale] = result
			continue
		}
		if !created && campaignStatus == campaignStatusSent {
			result.Skipped = true
			result.Reason = "already-sent"
			results[locale] = result
			continue
		}

		findCtx, findCancel := context.WithTimeout(context.Background(), 20*time.Second)
		cursor, findErr := subscribersCollection.Find(findCtx, buildSubscriberFilter(locale))
		if findErr != nil {
			findCancel()
			results[locale] = dispatchLocaleResult{
				RSSURL:    rssURL,
				ItemKey:   itemKey,
				PostTitle: strings.TrimSpace(item.Title),
				Skipped:   true,
				Reason:    "subscriber-query-failed",
			}
			continue
		}

		sentCount := 0
		failedCount := 0
		for cursor.Next(findCtx) {
			if sentCount+failedCount >= maxRecipients {
				break
			}

			var current subscriber
			if err := cursor.Decode(&current); err != nil {
				failedCount++
				continue
			}

			normalizedEmail, emailErr := mail.ParseAddress(strings.TrimSpace(current.Email))
			if emailErr != nil || normalizedEmail.Address == "" {
				failedCount++
				continue
			}
			email := strings.ToLower(strings.TrimSpace(normalizedEmail.Address))

			alreadyDelivered, deliveredErr := isAlreadyDelivered(deliveriesCollection, locale, itemKey, email)
			if deliveredErr != nil {
				failedCount++
				_ = upsertDeliveryAttempt(
					deliveriesCollection,
					locale,
					itemKey,
					email,
					deliveryStatusFailed,
					deliveredErr.Error(),
					time.Now().UTC(),
				)
				continue
			}
			if alreadyDelivered {
				continue
			}

			unsubscribeToken, tokenErr := newsletter.BuildUnsubscribeToken(
				email,
				unsubscribeSecret,
				time.Now().UTC(),
				unsubscribeTokenTTL,
			)
			if tokenErr != nil {
				failedCount++
				_ = upsertDeliveryAttempt(
					deliveriesCollection,
					locale,
					itemKey,
					email,
					deliveryStatusFailed,
					tokenErr.Error(),
					time.Now().UTC(),
				)
				continue
			}

			unsubscribeURL, unsubscribeURLErr := buildUnsubscribeURL(siteURL, unsubscribeToken, locale)
			if unsubscribeURLErr != nil {
				failedCount++
				_ = upsertDeliveryAttempt(
					deliveriesCollection,
					locale,
					itemKey,
					email,
					deliveryStatusFailed,
					unsubscribeURLErr.Error(),
					time.Now().UTC(),
				)
				continue
			}

			if err := sendPostEmail(smtpCfg, email, locale, *item, rssURL, unsubscribeURL); err != nil {
				failedCount++
				_ = upsertDeliveryAttempt(
					deliveriesCollection,
					locale,
					itemKey,
					email,
					deliveryStatusFailed,
					err.Error(),
					time.Now().UTC(),
				)
				continue
			}

			sentCount++
			_ = upsertDeliveryAttempt(
				deliveriesCollection,
				locale,
				itemKey,
				email,
				deliveryStatusSent,
				"",
				time.Now().UTC(),
			)
		}

		if cursorErr := cursor.Err(); cursorErr != nil {
			failedCount++
		}
		_ = cursor.Close(findCtx)
		findCancel()

		totalSent, totalSentErr := countDeliveriesByStatus(deliveriesCollection, locale, itemKey, deliveryStatusSent)
		totalFailed, totalFailedErr := countDeliveriesByStatus(deliveriesCollection, locale, itemKey, deliveryStatusFailed)
		if totalSentErr != nil {
			totalSent = int64(sentCount)
		}
		if totalFailedErr != nil {
			totalFailed = int64(failedCount)
		}

		status := campaignStatusSent
		if totalFailed > 0 {
			status = campaignStatusPartial
		}
		if !created && campaignStatus == campaignStatusProcessing && totalSent == 0 && totalFailed == 0 {
			status = campaignStatusProcessing
		}

		finalNow := time.Now().UTC()

		updateCtx, updateCancel := context.WithTimeout(context.Background(), 10*time.Second)
		_, _ = campaignsCollection.UpdateOne(
			updateCtx,
			bson.M{"locale": locale, "itemKey": itemKey},
			bson.M{
				"$set": bson.M{
					"status":      status,
					"updatedAt":   finalNow,
					"lastRunAt":   finalNow,
					"sentCount":   totalSent,
					"failedCount": totalFailed,
				},
			},
		)
		updateCancel()

		result.SentCount = int(totalSent)
		result.FailedCount = int(totalFailed)
		result.Skipped = false
		if !created && campaignStatus == campaignStatusPartial {
			result.Reason = "retry-partial"
		}
		if totalSent == 0 && totalFailed == 0 {
			result.Reason = "no-active-subscriber"
		}
		results[locale] = result
	}

	writeJSON(w, http.StatusOK, dispatchResponse{
		Status:    "ok",
		Message:   "dispatch completed",
		Timestamp: time.Now().UTC().Format(time.RFC3339),
		Locales:   results,
	})
}
