package repository

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"sync"
	"testing"
	"time"

	"suaybsimsek.com/blog-api/internal/domain"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func resetPostRepositoryState() {
	postMongoClient = nil
	postMongoInitErr = nil
	postMongoOnce = sync.Once{}
	postLikesIndexesOnce = sync.Once{}
	postLikesIndexesErr = nil
	postHitsIndexesOnce = sync.Once{}
	postHitsIndexesErr = nil
	postContentIndexesOnce = sync.Once{}
	postContentIndexesErr = nil
}

func resetNewsletterRepositoryState() {
	newsletterMongoClient = nil
	newsletterMongoInitErr = nil
	newsletterMongoClientOnce = sync.Once{}
	newsletterIndexesOnce = sync.Once{}
	newsletterIndexesErr = nil
}

type bulkWriteMock struct {
	writeCount int
	lastModels []mongo.WriteModel
	err        error
}

func (mock *bulkWriteMock) BulkWrite(
	_ context.Context,
	models []mongo.WriteModel,
	_ ...*options.BulkWriteOptions,
) (*mongo.BulkWriteResult, error) {
	mock.writeCount++
	mock.lastModels = models
	if mock.err != nil {
		return nil, mock.err
	}

	return &mongo.BulkWriteResult{
		MatchedCount:  int64(len(models)),
		ModifiedCount: int64(len(models)),
		UpsertedCount: int64(len(models)),
	}, nil
}

type findMock struct {
	docs []any
	err  error
}

func (mock *findMock) Find(_ context.Context, _ interface{}, _ ...*options.FindOptions) (*mongo.Cursor, error) {
	if mock.err != nil {
		return nil, mock.err
	}

	return mongo.NewCursorFromDocuments(mock.docs, nil, nil)
}

type singleFindMock struct {
	doc any
	err error
}

func (mock *singleFindMock) FindOne(_ context.Context, _ interface{}, _ ...*options.FindOneOptions) *mongo.SingleResult {
	return mongo.NewSingleResultFromDocument(mock.doc, mock.err, nil)
}

type metricCollectionMock struct {
	bulkWriteMock
	updatedDoc any
	updateErr  error
}

func (mock *metricCollectionMock) FindOneAndUpdate(
	_ context.Context,
	_ interface{},
	_ interface{},
	_ ...*options.FindOneAndUpdateOptions,
) *mongo.SingleResult {
	return mongo.NewSingleResultFromDocument(mock.updatedDoc, mock.updateErr, nil)
}

type updateOneMock struct {
	updateCount  int
	lastFilter   any
	lastUpdate   any
	lastOptions  []*options.UpdateOptions
	updateResult *mongo.UpdateResult
	err          error
}

func (mock *updateOneMock) UpdateOne(
	_ context.Context,
	filter interface{},
	update interface{},
	opts ...*options.UpdateOptions,
) (*mongo.UpdateResult, error) {
	mock.updateCount++
	mock.lastFilter = filter
	mock.lastUpdate = update
	mock.lastOptions = opts
	if mock.err != nil {
		return nil, mock.err
	}
	if mock.updateResult != nil {
		return mock.updateResult, nil
	}
	return &mongo.UpdateResult{MatchedCount: 1, ModifiedCount: 1}, nil
}

func TestPostRepositoryHelpers(t *testing.T) {
	if repository, ok := NewPostMongoRepository().(*postMongoRepository); !ok || repository == nil {
		t.Fatalf("NewPostMongoRepository() = %#v", repository)
	}

	if got, ok := normalizePostID(" Alpha-Post "); !ok || got != "alpha-post" {
		t.Fatalf("normalizePostID(valid) = %q, %v", got, ok)
	}
	if got, ok := normalizePostID("bad id"); ok || got != "" {
		t.Fatalf("normalizePostID(invalid) = %q, %v", got, ok)
	}

	alphaLikes := computeInitialLikes("alpha-post")
	if alphaLikes != computeInitialLikes("alpha-post") || alphaLikes <= 0 {
		t.Fatalf("computeInitialLikes(alpha-post) = %d", alphaLikes)
	}

	alphaHits := computeInitialHits("alpha-post")
	if alphaHits != computeInitialHits("alpha-post") || alphaHits < 700 {
		t.Fatalf("computeInitialHits(alpha-post) = %d", alphaHits)
	}

	if got := normalizeSortOrder(" ASC "); got != "asc" {
		t.Fatalf("normalizeSortOrder(asc) = %q", got)
	}
	if got := normalizeSortOrder("nope"); got != "desc" {
		t.Fatalf("normalizeSortOrder(default) = %q", got)
	}

	if got := normalizeSource(" medium "); got != "medium" {
		t.Fatalf("normalizeSource(medium) = %q", got)
	}
	if got := normalizeSource("unknown"); got != "all" {
		t.Fatalf("normalizeSource(default) = %q", got)
	}

	if got := normalizeOptionalString(nil); got != nil {
		t.Fatalf("normalizeOptionalString(nil) = %#v", got)
	}
	blank := "   "
	if got := normalizeOptionalString(&blank); got != nil {
		t.Fatalf("normalizeOptionalString(blank) = %#v", got)
	}
	value := " hello "
	gotValue := normalizeOptionalString(&value)
	if gotValue == nil || *gotValue != "hello" {
		t.Fatalf("normalizeOptionalString(value) = %#v", gotValue)
	}

	topicLink := " https://example.com/topic "
	updatedDate := " 2026-03-01 "
	thumbnail := " /image.webp "
	postLink := " https://example.com/post "
	normalizedPost := normalizePostForResponse(PostRecord{
		UpdatedDate: &updatedDate,
		Thumbnail:   &thumbnail,
		Link:        &postLink,
		Source:      " all ",
		Topics: []PostTopic{
			{ID: "react", Name: "React", Color: " Blue ", Link: &topicLink},
		},
		Category: &PostCategory{
			ID:    " Programming ",
			Name:  " Programming ",
			Color: "green",
		},
	})
	if normalizedPost.Source != "blog" {
		t.Fatalf("normalizePostForResponse().Source = %q", normalizedPost.Source)
	}
	if normalizedPost.UpdatedDate == nil || *normalizedPost.UpdatedDate != "2026-03-01" {
		t.Fatalf("normalizePostForResponse().UpdatedDate = %#v", normalizedPost.UpdatedDate)
	}
	if normalizedPost.Topics[0].Color != "blue" {
		t.Fatalf("normalizePostForResponse().Topics = %#v", normalizedPost.Topics)
	}
	if normalizedPost.Category == nil || normalizedPost.Category.ID != "programming" {
		t.Fatalf("normalizePostForResponse().Category = %#v", normalizedPost.Category)
	}

	normalizedWithoutCategory := normalizePostForResponse(PostRecord{
		Category: &PostCategory{ID: " ", Name: "Programming"},
	})
	if normalizedWithoutCategory.Category != nil {
		t.Fatalf("normalizePostForResponse() should clear invalid category: %#v", normalizedWithoutCategory.Category)
	}

	postIDs := collectPostIDs([]PostRecord{
		{ID: " Alpha-Post "},
		{ID: "bad id"},
		{ID: "beta-post"},
	})
	if len(postIDs) != 2 || postIDs[0] != "alpha-post" || postIDs[1] != "beta-post" {
		t.Fatalf("collectPostIDs() = %#v", postIDs)
	}
	if got := collectPostIDs(nil); got != nil {
		t.Fatalf("collectPostIDs(nil) = %#v", got)
	}

	filter := buildContentFilter("tr", []string{"alpha-post"})
	if filter["locale"] != "tr" {
		t.Fatalf("buildContentFilter(locale) = %#v", filter)
	}
	if scopedFilter, ok := filter["id"].(bson.M); !ok || len(scopedFilter["$in"].([]string)) != 1 {
		t.Fatalf("buildContentFilter(scope) = %#v", filter)
	}
	if filter := buildContentFilter("en", nil); len(filter) != 1 {
		t.Fatalf("buildContentFilter(no scope) = %#v", filter)
	}
}

func TestPostRepositoryUnavailablePaths(t *testing.T) {
	resetPostRepositoryState()
	t.Cleanup(resetPostRepositoryState)
	t.Setenv("MONGODB_URI", "")
	t.Setenv("MONGODB_DATABASE", "")

	repository := NewPostMongoRepository()
	ctx := context.Background()

	if _, err := repository.CountPosts(ctx, bson.M{}); !errors.Is(err, ErrPostRepositoryUnavailable) {
		t.Fatalf("CountPosts() error = %v", err)
	}
	if _, err := repository.FindPosts(ctx, bson.M{}, "desc", 0, 10); !errors.Is(err, ErrPostRepositoryUnavailable) {
		t.Fatalf("FindPosts() error = %v", err)
	}
	if _, err := repository.FindPostByID(ctx, "en", "alpha-post"); !errors.Is(err, ErrPostRepositoryUnavailable) {
		t.Fatalf("FindPostByID() error = %v", err)
	}
	if _, err := repository.IncrementPostLike(ctx, "alpha-post", time.Now().UTC()); !errors.Is(err, ErrPostRepositoryUnavailable) {
		t.Fatalf("IncrementPostLike() error = %v", err)
	}
	if _, err := repository.IncrementPostHit(ctx, "alpha-post", time.Now().UTC()); !errors.Is(err, ErrPostRepositoryUnavailable) {
		t.Fatalf("IncrementPostHit() error = %v", err)
	}

	if got := repository.ResolveLikesByPostID(ctx, []domain.PostRecord{{ID: "alpha-post"}}); got != nil {
		t.Fatalf("ResolveLikesByPostID() = %#v", got)
	}
	if got := repository.ResolveHitsByPostID(ctx, []domain.PostRecord{{ID: "alpha-post"}}); got != nil {
		t.Fatalf("ResolveHitsByPostID() = %#v", got)
	}
	if got := repository.ResolveLikesByPostID(ctx, nil); got != nil {
		t.Fatalf("ResolveLikesByPostID(nil) = %#v", got)
	}
	if got := repository.ResolveHitsByPostID(ctx, []domain.PostRecord{{ID: "bad id"}}); got != nil {
		t.Fatalf("ResolveHitsByPostID(invalid) = %#v", got)
	}
}

func TestPostRepositoryCollectionHelpers(t *testing.T) {
	now := time.Date(2026, time.March, 1, 10, 0, 0, 0, time.UTC)

	t.Run("ensure seeded documents", func(t *testing.T) {
		likesCollection := &bulkWriteMock{}
		if err := ensurePostLikeDocuments(context.Background(), likesCollection, []string{"alpha-post", "beta-post"}, now); err != nil {
			t.Fatalf("ensurePostLikeDocuments() error = %v", err)
		}
		if likesCollection.writeCount != 1 || len(likesCollection.lastModels) != 2 {
			t.Fatalf("likesCollection = %#v", likesCollection)
		}

		hitsCollection := &bulkWriteMock{}
		if err := ensurePostHitDocuments(context.Background(), hitsCollection, []string{"alpha-post"}, now); err != nil {
			t.Fatalf("ensurePostHitDocuments() error = %v", err)
		}
		if hitsCollection.writeCount != 1 || len(hitsCollection.lastModels) != 1 {
			t.Fatalf("hitsCollection = %#v", hitsCollection)
		}

		if err := ensurePostLikeDocuments(context.Background(), likesCollection, nil, now); err != nil {
			t.Fatalf("ensurePostLikeDocuments(nil) error = %v", err)
		}
	})

	t.Run("fetch metrics from cursor docs", func(t *testing.T) {
		likesByPostID, err := fetchPostLikesByIDs(context.Background(), &findMock{
			docs: []any{
				bson.D{{Key: "postId", Value: "alpha-post"}, {Key: "likes", Value: int64(12)}},
			},
		}, []string{"alpha-post", "beta-post"})
		if err != nil {
			t.Fatalf("fetchPostLikesByIDs() error = %v", err)
		}
		if likesByPostID["alpha-post"] != 12 || likesByPostID["beta-post"] != computeInitialLikes("beta-post") {
			t.Fatalf("likesByPostID = %#v", likesByPostID)
		}

		hitsByPostID, err := fetchPostHitsByIDs(context.Background(), &findMock{
			docs: []any{
				bson.D{{Key: "postId", Value: "alpha-post"}, {Key: "hits", Value: int64(120)}},
			},
		}, []string{"alpha-post", "beta-post"})
		if err != nil {
			t.Fatalf("fetchPostHitsByIDs() error = %v", err)
		}
		if hitsByPostID["alpha-post"] != 120 || hitsByPostID["beta-post"] != computeInitialHits("beta-post") {
			t.Fatalf("hitsByPostID = %#v", hitsByPostID)
		}

		emptyLikes, err := fetchPostLikesByIDs(context.Background(), &findMock{}, nil)
		if err != nil || len(emptyLikes) != 0 {
			t.Fatalf("fetchPostLikesByIDs(nil) = %#v, %v", emptyLikes, err)
		}
	})

	t.Run("increment metric values", func(t *testing.T) {
		likesCollection := &metricCollectionMock{
			updatedDoc: bson.D{{Key: "likes", Value: int64(41)}},
		}
		likes, err := incrementPostLikeValue(context.Background(), likesCollection, "alpha-post", now)
		if err != nil {
			t.Fatalf("incrementPostLikeValue() error = %v", err)
		}
		if likes != 41 || likesCollection.writeCount != 1 {
			t.Fatalf("likes = %d, collection = %#v", likes, likesCollection)
		}

		hitsCollection := &metricCollectionMock{
			updatedDoc: bson.D{{Key: "hits", Value: int64(205)}},
		}
		hits, err := incrementPostHitValue(context.Background(), hitsCollection, "alpha-post", now)
		if err != nil {
			t.Fatalf("incrementPostHitValue() error = %v", err)
		}
		if hits != 205 || hitsCollection.writeCount != 1 {
			t.Fatalf("hits = %d, collection = %#v", hits, hitsCollection)
		}
	})

	t.Run("query posts and single post", func(t *testing.T) {
		updatedDate := " 2026-03-01 "
		thumbnail := " /image.webp "
		postLink := " https://example.com/post "

		posts, err := queryPostRecords(context.Background(), &findMock{
			docs: []any{
				bson.D{
					{Key: "id", Value: "alpha-post"},
					{Key: "title", Value: "Alpha"},
					{Key: "publishedDate", Value: "2026-03-01"},
					{Key: "summary", Value: "Summary"},
					{Key: "searchText", Value: "alpha"},
					{Key: "readingTimeMin", Value: int32(3)},
					{Key: "updatedDate", Value: updatedDate},
					{Key: "thumbnail", Value: thumbnail},
					{Key: "source", Value: "all"},
					{Key: "link", Value: postLink},
				},
			},
		}, bson.M{"locale": "en"}, "desc", 0, 10)
		if err != nil {
			t.Fatalf("queryPostRecords() error = %v", err)
		}
		if len(posts) != 1 || posts[0].Source != "blog" {
			t.Fatalf("posts = %#v", posts)
		}

		post, err := queryPostRecordByID(context.Background(), &singleFindMock{
			doc: bson.D{
				{Key: "id", Value: "alpha-post"},
				{Key: "title", Value: "Alpha"},
				{Key: "publishedDate", Value: "2026-03-01"},
				{Key: "summary", Value: "Summary"},
				{Key: "searchText", Value: "alpha"},
				{Key: "readingTimeMin", Value: int32(3)},
				{Key: "source", Value: "medium"},
			},
		}, "en", "alpha-post")
		if err != nil {
			t.Fatalf("queryPostRecordByID() error = %v", err)
		}
		if post == nil || post.Source != "medium" {
			t.Fatalf("post = %#v", post)
		}

		post, err = queryPostRecordByID(context.Background(), &singleFindMock{
			doc: bson.M{},
			err: mongo.ErrNoDocuments,
		}, "en", "missing")
		if err != nil || post != nil {
			t.Fatalf("queryPostRecordByID(no documents) = %#v, %v", post, err)
		}
	})
}

func TestNewsletterRepositoryUnavailablePaths(t *testing.T) {
	resetNewsletterRepositoryState()
	t.Cleanup(resetNewsletterRepositoryState)
	t.Setenv("MONGODB_URI", "")
	t.Setenv("MONGODB_DATABASE", "")

	repository := NewNewsletterMongoRepository()
	ctx := context.Background()
	now := time.Now().UTC()

	if concreteRepository, ok := repository.(*newsletterMongoRepository); !ok || concreteRepository == nil {
		t.Fatalf("NewNewsletterMongoRepository() = %#v", repository)
	}

	_, found, err := repository.GetStatusByEmail(ctx, "reader@example.com")
	if found || !errors.Is(err, ErrNewsletterRepositoryUnavailable) {
		t.Fatalf("GetStatusByEmail() = %v, %v", found, err)
	}

	input := NewsletterPendingSubscription{
		Email:                 "reader@example.com",
		Locale:                "en",
		UpdatedAt:             now,
		ConfirmTokenHash:      "hash",
		ConfirmTokenExpiresAt: now.Add(time.Hour),
		ConfirmRequestedAt:    now,
	}

	if err := repository.UpsertPendingSubscription(ctx, input); !errors.Is(err, ErrNewsletterRepositoryUnavailable) {
		t.Fatalf("UpsertPendingSubscription() error = %v", err)
	}
	if err := repository.UpdatePendingSubscription(ctx, input); !errors.Is(err, ErrNewsletterRepositoryUnavailable) {
		t.Fatalf("UpdatePendingSubscription() error = %v", err)
	}
	if _, err := repository.ConfirmByTokenHash(ctx, "token-hash", now); !errors.Is(err, ErrNewsletterRepositoryUnavailable) {
		t.Fatalf("ConfirmByTokenHash() error = %v", err)
	}
	if err := repository.UnsubscribeByEmail(ctx, "reader@example.com", now); !errors.Is(err, ErrNewsletterRepositoryUnavailable) {
		t.Fatalf("UnsubscribeByEmail() error = %v", err)
	}
}

func TestNewsletterRepositoryCollectionHelpers(t *testing.T) {
	now := time.Date(2026, time.March, 1, 10, 0, 0, 0, time.UTC)

	status, found, err := getStatusByEmailFromCollection(context.Background(), &singleFindMock{
		doc: bson.M{"status": "active"},
	}, "reader@example.com")
	if err != nil || !found || status != "active" {
		t.Fatalf("getStatusByEmailFromCollection() = %q, %v, %v", status, found, err)
	}

	status, found, err = getStatusByEmailFromCollection(context.Background(), &singleFindMock{
		doc: bson.M{},
		err: mongo.ErrNoDocuments,
	}, "reader@example.com")
	if err != nil || found || status != "" {
		t.Fatalf("getStatusByEmailFromCollection(no documents) = %q, %v, %v", status, found, err)
	}

	createdAt := now.Add(-time.Hour)
	upsertMock := &updateOneMock{}
	if err := upsertPendingSubscriptionInCollection(context.Background(), upsertMock, NewsletterPendingSubscription{
		Email:                 "reader@example.com",
		Locale:                "en",
		Tags:                  []string{"news"},
		FormName:              "footer",
		Source:                "blog",
		UpdatedAt:             now,
		IPHash:                "hash",
		UserAgent:             "agent",
		ConfirmTokenHash:      "token",
		ConfirmTokenExpiresAt: now.Add(time.Hour),
		ConfirmRequestedAt:    now,
		CreatedAt:             &createdAt,
	}); err != nil {
		t.Fatalf("upsertPendingSubscriptionInCollection() error = %v", err)
	}
	if upsertMock.updateCount != 1 ||
		len(upsertMock.lastOptions) != 1 ||
		upsertMock.lastOptions[0] == nil ||
		upsertMock.lastOptions[0].Upsert == nil ||
		!*upsertMock.lastOptions[0].Upsert {
		t.Fatalf("upsertMock = %#v", upsertMock)
	}

	updateMock := &updateOneMock{}
	if err := updatePendingSubscriptionInCollection(context.Background(), updateMock, NewsletterPendingSubscription{
		Email:                 "reader@example.com",
		Locale:                "tr",
		UpdatedAt:             now,
		IPHash:                "hash",
		UserAgent:             "agent",
		ConfirmTokenHash:      "token",
		ConfirmTokenExpiresAt: now.Add(time.Hour),
		ConfirmRequestedAt:    now,
	}); err != nil {
		t.Fatalf("updatePendingSubscriptionInCollection() error = %v", err)
	}
	if updateMock.updateCount != 1 {
		t.Fatalf("updateMock = %#v", updateMock)
	}

	confirmMock := &updateOneMock{updateResult: &mongo.UpdateResult{MatchedCount: 1, ModifiedCount: 1}}
	matched, err := confirmByTokenHashInCollection(context.Background(), confirmMock, "token-hash", now)
	if err != nil || !matched {
		t.Fatalf("confirmByTokenHashInCollection() = %v, %v", matched, err)
	}

	unsubscribeMock := &updateOneMock{}
	if err := unsubscribeByEmailInCollection(context.Background(), unsubscribeMock, "reader@example.com", now); err != nil {
		t.Fatalf("unsubscribeByEmailInCollection() error = %v", err)
	}
	if unsubscribeMock.updateCount != 1 {
		t.Fatalf("unsubscribeMock = %#v", unsubscribeMock)
	}
}

func TestRepositoryErrorMessagesKeepUnderlyingReason(t *testing.T) {
	resetPostRepositoryState()
	resetNewsletterRepositoryState()
	t.Cleanup(resetPostRepositoryState)
	t.Cleanup(resetNewsletterRepositoryState)
	t.Setenv("MONGODB_URI", "")
	t.Setenv("MONGODB_DATABASE", "")

	postRepository := NewPostMongoRepository()
	_, postErr := postRepository.CountPosts(context.Background(), bson.M{})
	if postErr == nil || !strings.Contains(postErr.Error(), "missing required env: MONGODB_URI") {
		t.Fatalf("post error = %v", postErr)
	}

	newsletterRepository := NewNewsletterMongoRepository()
	_, _, newsletterErr := newsletterRepository.GetStatusByEmail(context.Background(), "reader@example.com")
	if newsletterErr == nil || !strings.Contains(newsletterErr.Error(), "missing required env: MONGODB_URI") {
		t.Fatalf("newsletter error = %v", newsletterErr)
	}
}

func TestPostRepositoryCollectionHelperErrors(t *testing.T) {
	boom := errors.New("boom")
	now := time.Date(2026, time.March, 1, 10, 0, 0, 0, time.UTC)

	if err := ensurePostLikeDocuments(context.Background(), &bulkWriteMock{err: boom}, []string{"alpha-post"}, now); !errors.Is(err, boom) {
		t.Fatalf("ensurePostLikeDocuments() error = %v", err)
	}
	if err := ensurePostHitDocuments(context.Background(), &bulkWriteMock{err: boom}, []string{"alpha-post"}, now); !errors.Is(err, boom) {
		t.Fatalf("ensurePostHitDocuments() error = %v", err)
	}
	if _, err := fetchPostLikesByIDs(context.Background(), &findMock{err: boom}, []string{"alpha-post"}); !errors.Is(err, boom) {
		t.Fatalf("fetchPostLikesByIDs() error = %v", err)
	}
	if _, err := fetchPostHitsByIDs(context.Background(), &findMock{err: boom}, []string{"alpha-post"}); !errors.Is(err, boom) {
		t.Fatalf("fetchPostHitsByIDs() error = %v", err)
	}

	if _, err := incrementPostLikeValue(context.Background(), &metricCollectionMock{
		updatedDoc: bson.M{"likes": int64(0)},
		updateErr:  boom,
	}, "alpha-post", now); err == nil || !strings.Contains(err.Error(), "boom") {
		t.Fatalf("incrementPostLikeValue() error = %v", err)
	}
	if _, err := incrementPostHitValue(context.Background(), &metricCollectionMock{
		updatedDoc: bson.M{"hits": int64(0)},
		updateErr:  boom,
	}, "alpha-post", now); err == nil || !strings.Contains(err.Error(), "boom") {
		t.Fatalf("incrementPostHitValue() error = %v", err)
	}

	if _, err := queryPostRecords(context.Background(), &findMock{err: boom}, bson.M{}, "desc", 0, 10); !errors.Is(err, boom) {
		t.Fatalf("queryPostRecords() error = %v", err)
	}
	if _, err := queryPostRecordByID(context.Background(), &singleFindMock{
		doc: bson.M{},
		err: fmt.Errorf("decode failed: %w", boom),
	}, "en", "alpha-post"); err == nil || !strings.Contains(err.Error(), "decode failed") {
		t.Fatalf("queryPostRecordByID() error = %v", err)
	}
}

func TestNewsletterRepositoryCollectionHelperErrors(t *testing.T) {
	boom := errors.New("boom")
	now := time.Date(2026, time.March, 1, 10, 0, 0, 0, time.UTC)

	if _, _, err := getStatusByEmailFromCollection(context.Background(), &singleFindMock{
		doc: bson.M{},
		err: boom,
	}, "reader@example.com"); !errors.Is(err, boom) {
		t.Fatalf("getStatusByEmailFromCollection() error = %v", err)
	}

	if err := upsertPendingSubscriptionInCollection(context.Background(), &updateOneMock{err: boom}, NewsletterPendingSubscription{
		Email:                 "reader@example.com",
		UpdatedAt:             now,
		ConfirmTokenExpiresAt: now,
		ConfirmRequestedAt:    now,
	}); !errors.Is(err, boom) {
		t.Fatalf("upsertPendingSubscriptionInCollection() error = %v", err)
	}

	if err := updatePendingSubscriptionInCollection(context.Background(), &updateOneMock{err: boom}, NewsletterPendingSubscription{
		Email:                 "reader@example.com",
		UpdatedAt:             now,
		ConfirmTokenExpiresAt: now,
		ConfirmRequestedAt:    now,
	}); !errors.Is(err, boom) {
		t.Fatalf("updatePendingSubscriptionInCollection() error = %v", err)
	}

	if matched, err := confirmByTokenHashInCollection(context.Background(), &updateOneMock{err: boom}, "token-hash", now); !errors.Is(err, boom) || matched {
		t.Fatalf("confirmByTokenHashInCollection() = %v, %v", matched, err)
	}

	if err := unsubscribeByEmailInCollection(context.Background(), &updateOneMock{err: boom}, "reader@example.com", now); !errors.Is(err, boom) {
		t.Fatalf("unsubscribeByEmailInCollection() error = %v", err)
	}
}
