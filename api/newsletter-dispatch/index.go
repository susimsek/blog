package handler

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"encoding/xml"
	"fmt"
	"io"
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
	newsletterSubscribersCollection = "newsletter_subscribers"
	newsletterCampaignsCollection   = "newsletter_campaigns"
	newsletterDeliveriesCollection  = "newsletter_deliveries"
	newsletterPostsCollection       = "newsletter_posts"
	newsletterTopicsCollection      = "newsletter_topics"
	defaultMaxRecipientsPerRun      = 200
	defaultMaxItemAgeHours          = 24 * 7
	defaultDispatchTimeout          = 8 * time.Second
	defaultSyncTimeout              = 12 * time.Second
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

type rssFeed struct {
	Channel rssChannel `xml:"channel"`
}

type rssChannel struct {
	Items []rssItem `xml:"item"`
}

type rssItem struct {
	Title       string   `xml:"title"`
	Link        string   `xml:"link"`
	GUID        string   `xml:"guid"`
	Description string   `xml:"description"`
	PubDate     string   `xml:"pubDate"`
	Categories  []string `xml:"category"`
	Enclosure   struct {
		URL  string `xml:"url,attr"`
		Type string `xml:"type,attr"`
	} `xml:"enclosure"`
	MediaThumbnail struct {
		URL string `xml:"url,attr"`
	} `xml:"http://search.yahoo.com/mrss/ thumbnail"`
}

type subscriber struct {
	Email  string `bson:"email"`
	Locale string `bson:"locale,omitempty"`
}

type siteTopic struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Color string `json:"color"`
}

type sitePost struct {
	ID             string      `json:"id"`
	Title          string      `json:"title"`
	Summary        string      `json:"summary"`
	Thumbnail      string      `json:"thumbnail"`
	Topics         []siteTopic `json:"topics"`
	ReadingTimeMin int         `json:"readingTimeMin"`
	PublishedDate  string      `json:"publishedDate"`
	UpdatedDate    string      `json:"updatedDate"`
}

type syncedPostTopic struct {
	ID    string `bson:"id"`
	Name  string `bson:"name"`
	Color string `bson:"color"`
}

type postEmailMetadata struct {
	Topics         []newsletter.PostTopicBadge
	ReadingTimeMin int
	ThumbnailURL   string
}

type topicBadgeStyle struct {
	BgColor     string
	TextColor   string
	BorderColor string
}

var (
	dispatchClient  *mongo.Client
	dispatchInitErr error
	dispatchOnce    sync.Once

	dispatchSubscriberIndexOnce sync.Once
	dispatchSubscriberIndexErr  error

	dispatchIndexOnce sync.Once
	dispatchIndexErr  error

	dispatchDeliveryIndexOnce sync.Once
	dispatchDeliveryIndexErr  error

	dispatchContentIndexOnce sync.Once
	dispatchContentIndexErr  error
)

var defaultTopicBadgeStyle = topicBadgeStyle{
	BgColor:     "#f8fafc",
	TextColor:   "#334155",
	BorderColor: "#dbe4ef",
}

var topicBadgeStyles = map[string]topicBadgeStyle{
	"red": {
		BgColor:     "#fee2e2",
		TextColor:   "#b91c1c",
		BorderColor: "#fca5a5",
	},
	"green": {
		BgColor:     "#dcfce7",
		TextColor:   "#166534",
		BorderColor: "#86efac",
	},
	"blue": {
		BgColor:     "#dbeafe",
		TextColor:   "#1d4ed8",
		BorderColor: "#93c5fd",
	},
	"orange": {
		BgColor:     "#ffedd5",
		TextColor:   "#c2410c",
		BorderColor: "#fdba74",
	},
	"yellow": {
		BgColor:     "#fef9c3",
		TextColor:   "#a16207",
		BorderColor: "#fde047",
	},
	"purple": {
		BgColor:     "#ede9fe",
		TextColor:   "#6d28d9",
		BorderColor: "#c4b5fd",
	},
	"gray": {
		BgColor:     "#f1f5f9",
		TextColor:   "#475569",
		BorderColor: "#cbd5e1",
	},
	"brown": {
		BgColor:     "#efebe9",
		TextColor:   "#5d4037",
		BorderColor: "#bcaaa4",
	},
	"pink": {
		BgColor:     "#fce7f3",
		TextColor:   "#be185d",
		BorderColor: "#f9a8d4",
	},
	"cyan": {
		BgColor:     "#cffafe",
		TextColor:   "#0e7490",
		BorderColor: "#67e8f9",
	},
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

func parseRSSItemPubDate(value string) (time.Time, error) {
	raw := strings.TrimSpace(value)
	if raw == "" {
		return time.Time{}, fmt.Errorf("missing pubDate")
	}

	layouts := []string{
		time.RFC1123Z,
		time.RFC1123,
		time.RFC822Z,
		time.RFC822,
		time.RFC3339,
	}

	var lastErr error
	for _, layout := range layouts {
		parsed, err := time.Parse(layout, raw)
		if err == nil {
			return parsed.UTC(), nil
		}
		lastErr = err
	}

	if lastErr == nil {
		lastErr = fmt.Errorf("unsupported pubDate layout")
	}
	return time.Time{}, lastErr
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
		uri, err := newsletter.ResolveMongoURI()
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

func ensureDispatchSubscriberIndexes(collection *mongo.Collection) error {
	dispatchSubscriberIndexOnce.Do(func() {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		indexes := []mongo.IndexModel{
			{
				Keys: bson.D{
					{Key: "status", Value: 1},
					{Key: "locale", Value: 1},
				},
				Options: options.Index().
					SetName("idx_newsletter_status_locale"),
			},
		}

		_, err := collection.Indexes().CreateMany(ctx, indexes)
		if err != nil {
			dispatchSubscriberIndexErr = fmt.Errorf("create subscriber index failed: %w", err)
		}
	})

	return dispatchSubscriberIndexErr
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
			{
				Keys: bson.D{
					{Key: "locale", Value: 1},
					{Key: "itemKey", Value: 1},
					{Key: "status", Value: 1},
				},
				Options: options.Index().
					SetName("idx_newsletter_delivery_locale_item_status"),
			},
		}

		_, err := collection.Indexes().CreateMany(ctx, indexes)
		if err != nil {
			dispatchDeliveryIndexErr = fmt.Errorf("create delivery index failed: %w", err)
		}
	})

	return dispatchDeliveryIndexErr
}

func ensureContentIndexes(postsCollection *mongo.Collection, topicsCollection *mongo.Collection) error {
	dispatchContentIndexOnce.Do(func() {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		postIndexes := []mongo.IndexModel{
			{
				Keys: bson.D{
					{Key: "locale", Value: 1},
					{Key: "id", Value: 1},
				},
				Options: options.Index().
					SetUnique(true).
					SetName("uniq_newsletter_post_locale_id"),
			},
		}
		if _, err := postsCollection.Indexes().CreateMany(ctx, postIndexes); err != nil {
			dispatchContentIndexErr = fmt.Errorf("create post index failed: %w", err)
			return
		}

		topicIndexes := []mongo.IndexModel{
			{
				Keys: bson.D{
					{Key: "locale", Value: 1},
					{Key: "id", Value: 1},
				},
				Options: options.Index().
					SetUnique(true).
					SetName("uniq_newsletter_topic_locale_id"),
			},
		}
		if _, err := topicsCollection.Indexes().CreateMany(ctx, topicIndexes); err != nil {
			dispatchContentIndexErr = fmt.Errorf("create topic index failed: %w", err)
			return
		}
	})

	return dispatchContentIndexErr
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

func getCampaignStatus(
	collection *mongo.Collection,
	locale string,
	itemKey string,
) (status string, exists bool, err error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var campaign struct {
		Status string `bson:"status"`
	}
	if err := collection.FindOne(ctx, bson.M{
		"locale":  locale,
		"itemKey": itemKey,
	}).Decode(&campaign); err != nil {
		if err == mongo.ErrNoDocuments {
			return "", false, nil
		}
		return "", false, err
	}

	return strings.TrimSpace(campaign.Status), true, nil
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

func fetchRSSItems(rssURL string) ([]rssItem, error) {
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

	items := make([]rssItem, 0, len(feed.Channel.Items))
	for _, item := range feed.Channel.Items {
		if strings.TrimSpace(item.Link) != "" {
			items = append(items, item)
		}
	}

	return items, nil
}

func fetchJSON(requestURL string, target any) error {
	client := &http.Client{Timeout: defaultSyncTimeout}
	req, err := http.NewRequest(http.MethodGet, requestURL, nil)
	if err != nil {
		return fmt.Errorf("create request failed: %w", err)
	}
	req.Header.Set("User-Agent", "suayb-blog-newsletter-dispatch/1.0")

	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("request failed: status=%d", resp.StatusCode)
	}

	body, err := io.ReadAll(io.LimitReader(resp.Body, 4<<20))
	if err != nil {
		return fmt.Errorf("read response failed: %w", err)
	}

	if err := json.Unmarshal(body, target); err != nil {
		return fmt.Errorf("parse response failed: %w", err)
	}

	return nil
}

func normalizeSiteTopic(raw siteTopic) siteTopic {
	id := strings.TrimSpace(raw.ID)
	name := strings.TrimSpace(raw.Name)
	color := strings.ToLower(strings.TrimSpace(raw.Color))

	if id == "" {
		return siteTopic{}
	}
	if name == "" {
		name = id
	}

	return siteTopic{
		ID:    id,
		Name:  name,
		Color: color,
	}
}

func resolveSiteDataURL(siteURL string, locale string, fileName string) string {
	return fmt.Sprintf("%s/data/%s.%s.json", strings.TrimRight(siteURL, "/"), fileName, locale)
}

func syncSiteContentForLocale(
	siteURL string,
	locale string,
	postsCollection *mongo.Collection,
	topicsCollection *mongo.Collection,
) error {
	postsURL := resolveSiteDataURL(siteURL, locale, "posts")
	topicsURL := resolveSiteDataURL(siteURL, locale, "topics")

	var posts []sitePost
	if err := fetchJSON(postsURL, &posts); err != nil {
		return fmt.Errorf("fetch posts failed: %w", err)
	}

	var topics []siteTopic
	if err := fetchJSON(topicsURL, &topics); err != nil {
		return fmt.Errorf("fetch topics failed: %w", err)
	}

	now := time.Now().UTC()
	topicByID := make(map[string]siteTopic, len(topics))

	for _, raw := range topics {
		topic := normalizeSiteTopic(raw)
		if topic.ID == "" {
			continue
		}
		topicByID[topic.ID] = topic
	}

	for _, post := range posts {
		for _, rawTopic := range post.Topics {
			topic := normalizeSiteTopic(rawTopic)
			if topic.ID == "" {
				continue
			}
			existing, exists := topicByID[topic.ID]
			if !exists {
				topicByID[topic.ID] = topic
				continue
			}
			if existing.Name == "" && topic.Name != "" {
				existing.Name = topic.Name
			}
			if existing.Color == "" && topic.Color != "" {
				existing.Color = topic.Color
			}
			topicByID[topic.ID] = existing
		}
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	for _, topic := range topicByID {
		_, err := topicsCollection.UpdateOne(
			ctx,
			bson.M{
				"locale": locale,
				"id":     topic.ID,
			},
			bson.M{
				"$set": bson.M{
					"locale":    locale,
					"id":        topic.ID,
					"name":      topic.Name,
					"color":     topic.Color,
					"updatedAt": now,
					"syncedAt":  now,
				},
				"$setOnInsert": bson.M{
					"createdAt": now,
				},
			},
			options.Update().SetUpsert(true),
		)
		if err != nil {
			return fmt.Errorf("upsert topic failed: %w", err)
		}
	}

	for _, rawPost := range posts {
		postID := strings.TrimSpace(rawPost.ID)
		if postID == "" {
			continue
		}

		postTopics := make([]bson.M, 0, len(rawPost.Topics))
		for _, rawTopic := range rawPost.Topics {
			topic := normalizeSiteTopic(rawTopic)
			if topic.ID == "" {
				continue
			}
			if topic.Color == "" {
				if definedTopic, exists := topicByID[topic.ID]; exists {
					topic.Color = definedTopic.Color
				}
			}
			postTopics = append(postTopics, bson.M{
				"id":    topic.ID,
				"name":  topic.Name,
				"color": topic.Color,
			})
		}

		_, err := postsCollection.UpdateOne(
			ctx,
			bson.M{
				"locale": locale,
				"id":     postID,
			},
			bson.M{
				"$set": bson.M{
					"locale":         locale,
					"id":             postID,
					"title":          strings.TrimSpace(rawPost.Title),
					"summary":        strings.TrimSpace(rawPost.Summary),
					"thumbnail":      strings.TrimSpace(rawPost.Thumbnail),
					"topics":         postTopics,
					"readingTimeMin": rawPost.ReadingTimeMin,
					"publishedDate":  strings.TrimSpace(rawPost.PublishedDate),
					"updatedDate":    strings.TrimSpace(rawPost.UpdatedDate),
					"updatedAt":      now,
					"syncedAt":       now,
				},
				"$setOnInsert": bson.M{
					"createdAt": now,
				},
			},
			options.Update().SetUpsert(true),
		)
		if err != nil {
			return fmt.Errorf("upsert post failed: %w", err)
		}
	}

	return nil
}

func extractPostIDFromLink(postURL string) string {
	rawURL := strings.TrimSpace(postURL)
	if rawURL == "" {
		return ""
	}

	parsed, err := url.Parse(rawURL)
	pathValue := rawURL
	if err == nil {
		pathValue = parsed.Path
	}

	trimmedPath := strings.Trim(pathValue, "/")
	if trimmedPath == "" {
		return ""
	}

	parts := strings.Split(trimmedPath, "/")
	for index := 0; index < len(parts)-1; index++ {
		if parts[index] != "posts" {
			continue
		}
		decoded, decodeErr := url.PathUnescape(parts[index+1])
		if decodeErr != nil {
			return strings.TrimSpace(parts[index+1])
		}
		return strings.TrimSpace(decoded)
	}

	decoded, decodeErr := url.PathUnescape(parts[len(parts)-1])
	if decodeErr != nil {
		return strings.TrimSpace(parts[len(parts)-1])
	}
	return strings.TrimSpace(decoded)
}

func resolveAbsoluteURL(siteURL string, value string) string {
	trimmedValue := strings.TrimSpace(value)
	if trimmedValue == "" {
		return ""
	}
	if strings.HasPrefix(trimmedValue, "http://") || strings.HasPrefix(trimmedValue, "https://") {
		return trimmedValue
	}

	baseURL, err := url.Parse(strings.TrimSpace(siteURL))
	if err != nil {
		return trimmedValue
	}
	refURL, err := url.Parse(trimmedValue)
	if err != nil {
		return trimmedValue
	}

	return baseURL.ResolveReference(refURL).String()
}

func resolveTopicBadgeStyle(color string) topicBadgeStyle {
	style, exists := topicBadgeStyles[strings.ToLower(strings.TrimSpace(color))]
	if !exists {
		return defaultTopicBadgeStyle
	}
	return style
}

func buildTopicURL(siteURL string, locale string, topicID string) string {
	trimmedTopicID := strings.TrimSpace(topicID)
	if trimmedTopicID == "" {
		return ""
	}
	escapedTopicID := url.PathEscape(trimmedTopicID)
	baseURL := strings.TrimRight(strings.TrimSpace(siteURL), "/")
	if baseURL == "" {
		return ""
	}
	return fmt.Sprintf("%s/%s/topics/%s", baseURL, locale, escapedTopicID)
}

func buildTopicBadgesFromCategories(categories []string) []newsletter.PostTopicBadge {
	if len(categories) == 0 {
		return nil
	}

	style := defaultTopicBadgeStyle
	badges := make([]newsletter.PostTopicBadge, 0, len(categories))
	for _, category := range categories {
		name := strings.TrimSpace(category)
		if name == "" {
			continue
		}
		badges = append(badges, newsletter.PostTopicBadge{
			Name:        name,
			BgColor:     style.BgColor,
			TextColor:   style.TextColor,
			BorderColor: style.BorderColor,
		})
	}

	return badges
}

func buildTopicBadgesFromSyncedTopics(topics []syncedPostTopic, siteURL string, locale string) []newsletter.PostTopicBadge {
	if len(topics) == 0 {
		return nil
	}

	badges := make([]newsletter.PostTopicBadge, 0, len(topics))
	for _, topic := range topics {
		name := strings.TrimSpace(topic.Name)
		if name == "" {
			continue
		}
		style := resolveTopicBadgeStyle(topic.Color)
		badges = append(badges, newsletter.PostTopicBadge{
			Name:        name,
			URL:         buildTopicURL(siteURL, locale, topic.ID),
			BgColor:     style.BgColor,
			TextColor:   style.TextColor,
			BorderColor: style.BorderColor,
		})
	}

	return badges
}

func resolvePostEmailMetadata(
	postsCollection *mongo.Collection,
	locale string,
	siteURL string,
	item rssItem,
) (postEmailMetadata, error) {
	postImageURL := strings.TrimSpace(item.MediaThumbnail.URL)
	if postImageURL == "" && strings.HasPrefix(strings.ToLower(strings.TrimSpace(item.Enclosure.Type)), "image/") {
		postImageURL = strings.TrimSpace(item.Enclosure.URL)
	}

	fallback := postEmailMetadata{
		Topics:         buildTopicBadgesFromCategories(item.Categories),
		ReadingTimeMin: 0,
		ThumbnailURL:   postImageURL,
	}

	postID := extractPostIDFromLink(item.Link)
	if postID == "" {
		return fallback, nil
	}

	var syncedPost struct {
		ReadingTimeMin int               `bson:"readingTimeMin"`
		Thumbnail      string            `bson:"thumbnail"`
		Topics         []syncedPostTopic `bson:"topics"`
	}

	ctx, cancel := context.WithTimeout(context.Background(), 8*time.Second)
	defer cancel()

	err := postsCollection.FindOne(ctx, bson.M{
		"locale": locale,
		"id":     postID,
	}).Decode(&syncedPost)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return fallback, nil
		}
		return fallback, err
	}

	if syncedPost.ReadingTimeMin > 0 {
		fallback.ReadingTimeMin = syncedPost.ReadingTimeMin
	}
	if badges := buildTopicBadgesFromSyncedTopics(syncedPost.Topics, siteURL, locale); len(badges) > 0 {
		fallback.Topics = badges
	}
	if strings.TrimSpace(fallback.ThumbnailURL) == "" {
		fallback.ThumbnailURL = resolveAbsoluteURL(siteURL, syncedPost.Thumbnail)
	}

	return fallback, nil
}

func buildUnsubscribeURL(siteURL, token, locale string) (string, error) {
	parsed, err := url.Parse(siteURL)
	if err != nil || parsed.Scheme == "" || parsed.Host == "" {
		return "", fmt.Errorf("invalid SITE_URL")
	}

	parsed.Path = strings.TrimRight(parsed.Path, "/") + "/" + strings.TrimSpace(locale) + "/newsletter-status"
	query := parsed.Query()
	query.Set("token", token)
	query.Set("operation", "unsubscribe")
	query.Set("locale", locale)
	parsed.RawQuery = query.Encode()

	return parsed.String(), nil
}

func sendPostEmail(
	cfg newsletter.SMTPConfig,
	recipientEmail string,
	locale string,
	siteURL string,
	item rssItem,
	rssURL string,
	unsubscribeURL string,
	postMetadata postEmailMetadata,
) error {
	publishedAt, publishedAtErr := parseRSSItemPubDate(item.PubDate)
	if publishedAtErr != nil {
		publishedAt = time.Time{}
	}

	subject, htmlBody, err := newsletter.PostAnnouncementEmail(
		locale,
		strings.TrimSpace(item.Title),
		strings.TrimSpace(item.Description),
		postMetadata.ThumbnailURL,
		postMetadata.Topics,
		publishedAt,
		postMetadata.ReadingTimeMin,
		strings.TrimSpace(item.Link),
		rssURL,
		unsubscribeURL,
		siteURL,
	)
	if err != nil {
		return fmt.Errorf("build post email failed: %w", err)
	}

	return newsletter.SendHTMLEmail(cfg, recipientEmail, subject, htmlBody, map[string]string{
		"List-Unsubscribe":      fmt.Sprintf("<%s>, <mailto:%s?subject=%s>", unsubscribeURL, cfg.FromMail, url.QueryEscape("unsubscribe")),
		"List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
		"Precedence":            "bulk",
	})
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
	allowedOrigin := newsletter.ResolveAllowedOriginOptional()
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

	cronSecret, err := newsletter.ResolveCronSecret()
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

	siteURL, err := newsletter.ResolveSiteURL()
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, dispatchResponse{
			Status:    "error",
			Message:   "configuration error",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
			Locales:   map[string]dispatchLocaleResult{},
		})
		return
	}

	unsubscribeSecret, err := newsletter.ResolveUnsubscribeSecret()
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, dispatchResponse{
			Status:    "error",
			Message:   "configuration error",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
			Locales:   map[string]dispatchLocaleResult{},
		})
		return
	}

	unsubscribeTokenTTL := time.Duration(
		newsletter.ResolvePositiveIntEnv("NEWSLETTER_UNSUBSCRIBE_TOKEN_TTL_HOURS", defaultUnsubscribeTokenTTLHours),
	) * time.Hour

	databaseName, err := newsletter.ResolveDatabaseName()
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, dispatchResponse{
			Status:    "error",
			Message:   "configuration error",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
			Locales:   map[string]dispatchLocaleResult{},
		})
		return
	}

	smtpCfg, err := newsletter.ResolveSMTPConfig()
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

	maxRecipients := newsletter.ResolvePositiveIntEnv("NEWSLETTER_MAX_RECIPIENTS_PER_RUN", defaultMaxRecipientsPerRun)
	maxItemAge := time.Duration(
		newsletter.ResolvePositiveIntEnv("NEWSLETTER_MAX_ITEM_AGE_HOURS", defaultMaxItemAgeHours),
	) * time.Hour
	subscribersCollection := client.Database(databaseName).Collection(newsletterSubscribersCollection)
	campaignsCollection := client.Database(databaseName).Collection(newsletterCampaignsCollection)
	deliveriesCollection := client.Database(databaseName).Collection(newsletterDeliveriesCollection)
	postsCollection := client.Database(databaseName).Collection(newsletterPostsCollection)
	if err := ensureDispatchSubscriberIndexes(subscribersCollection); err != nil {
		writeJSON(w, http.StatusServiceUnavailable, dispatchResponse{
			Status:    "error",
			Message:   "subscriber index error",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
			Locales:   map[string]dispatchLocaleResult{},
		})
		return
	}
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

		items, fetchErr := fetchRSSItems(rssURL)
		if fetchErr != nil {
			result.Skipped = true
			result.Reason = "rss-fetch-failed"
			results[locale] = result
			continue
		}
		if len(items) == 0 {
			result.Skipped = true
			result.Reason = "rss-empty"
			results[locale] = result
			continue
		}

		scanNow := time.Now().UTC()
		var selectedItem *rssItem
		var itemKey string
		selectionFailed := false

		for _, candidate := range items {
			candidateItemKey := normalizeItemKey(candidate)

			publishedAt, pubDateErr := parseRSSItemPubDate(candidate.PubDate)
			if pubDateErr != nil {
				continue
			}
			if scanNow.Sub(publishedAt) > maxItemAge {
				continue
			}

			existingStatus, exists, statusErr := getCampaignStatus(campaignsCollection, locale, candidateItemKey)
			if statusErr != nil {
				result.Skipped = true
				result.Reason = "campaign-lookup-failed"
				results[locale] = result
				selectionFailed = true
				break
			}
			if exists && existingStatus == campaignStatusSent {
				continue
			}

			item := candidate
			selectedItem = &item
			itemKey = candidateItemKey
			break
		}
		if selectionFailed {
			continue
		}
		if selectedItem == nil {
			result.Skipped = true
			result.Reason = "no-pending-item"
			results[locale] = result
			continue
		}

		result.ItemKey = itemKey
		result.PostTitle = strings.TrimSpace(selectedItem.Title)
		postMetadata, _ := resolvePostEmailMetadata(postsCollection, locale, siteURL, *selectedItem)

		now := time.Now().UTC()
		campaignStatus, created, campaignErr := getOrCreateCampaign(campaignsCollection, locale, itemKey, *selectedItem, rssURL, now)
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
				PostTitle: strings.TrimSpace(selectedItem.Title),
				Skipped:   true,
				Reason:    "subscriber-query-failed",
			}
			continue
		}

		sentCount := 0
		failedCount := 0
		recipientCapReached := false
		for cursor.Next(findCtx) {
			if sentCount+failedCount >= maxRecipients {
				recipientCapReached = true
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

			if err := sendPostEmail(smtpCfg, email, locale, siteURL, *selectedItem, rssURL, unsubscribeURL, postMetadata); err != nil {
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
		if recipientCapReached || totalFailed > 0 {
			status = campaignStatusPartial
		}
		if !created && campaignStatus == campaignStatusProcessing && totalSent == 0 && totalFailed == 0 && !recipientCapReached {
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
		if recipientCapReached {
			result.Reason = "recipient-cap-reached"
		}
		if result.Reason == "" && !created && campaignStatus == campaignStatusPartial {
			result.Reason = "retry-partial"
		}
		if result.Reason == "" && totalSent == 0 && totalFailed == 0 {
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
