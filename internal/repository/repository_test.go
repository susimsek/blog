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
	"suaybsimsek.com/blog-api/internal/testassert"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
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
	postTopicIndexesOnce = sync.Once{}
	postTopicIndexesErr = nil
	postCategoryIndexesOnce = sync.Once{}
	postCategoryIndexesErr = nil
	postMediaAssetIndexesOnce = sync.Once{}
	postMediaAssetIndexesErr = nil
	postRevisionIndexesOnce = sync.Once{}
	postRevisionIndexesErr = nil
}

func resetNewsletterRepositoryState() {
	newsletterMongoClient = nil
	newsletterMongoInitErr = nil
	newsletterMongoClientOnce = sync.Once{}
	newsletterIndexesOnce = sync.Once{}
	newsletterIndexesErr = nil
}

func resetAdminRepositoryState() {
	adminMongoClient = nil
	adminMongoInitErr = nil
	adminMongoClientOnce = sync.Once{}
	adminUserIndexesOnce = sync.Once{}
	adminUserIndexesErr = nil
	readerUserIndexesOnce = sync.Once{}
	readerUserIndexesErr = nil
}

func resetAdminRefreshTokenRepositoryState() {
	adminRefreshTokenMongoClient = nil
	adminRefreshTokenMongoInitErr = nil
	adminRefreshTokenMongoClientOnce = sync.Once{}
	adminRefreshTokenIndexesOnce = sync.Once{}
	adminRefreshTokenIndexesErr = nil
}

func resetReaderRefreshTokenRepositoryState() {
	readerRefreshTokenIndexesOnce = sync.Once{}
	readerRefreshTokenIndexesErr = nil
}

func resetErrorMessageRepositoryState() {
	errorMessageMongoClient = nil
	errorMessageMongoInitErr = nil
	errorMessageMongoClientOnce = sync.Once{}
	errorMessageIndexesOnce = sync.Once{}
	errorMessageIndexesErr = nil
}

func resetAdminAvatarRepositoryState() {
	adminAvatarMongoClient = nil
	adminAvatarMongoInitErr = nil
	adminAvatarMongoClientOnce = sync.Once{}
	adminAvatarIndexesOnce = sync.Once{}
	adminAvatarIndexesErr = nil
}

func resetCommentRepositoryState() {
	postCommentsIndexesOnce = sync.Once{}
	postCommentsIndexesErr = nil
}

func markOnceDone(target *sync.Once) {
	*target = sync.Once{}
	target.Do(func() {})
}

type bulkWriteMock struct {
	writeCount int
	lastModels []mongo.WriteModel
	err        error
}

func (mock *bulkWriteMock) BulkWrite(
	_ context.Context,
	models []mongo.WriteModel,
	_ ...options.Lister[options.BulkWriteOptions],
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

func (mock *findMock) Find(_ context.Context, _ any, _ ...options.Lister[options.FindOptions]) (*mongo.Cursor, error) {
	if mock.err != nil {
		return nil, mock.err
	}

	return mongo.NewCursorFromDocuments(mock.docs, nil, nil)
}

type singleFindMock struct {
	doc any
	err error
}

func (mock *singleFindMock) FindOne(_ context.Context, _ any, _ ...options.Lister[options.FindOneOptions]) *mongo.SingleResult {
	return mongo.NewSingleResultFromDocument(mock.doc, mock.err, nil)
}

type metricCollectionMock struct {
	bulkWriteMock
	updatedDoc any
	updateErr  error
}

func (mock *metricCollectionMock) FindOneAndUpdate(
	_ context.Context,
	_ any,
	_ any,
	_ ...options.Lister[options.FindOneAndUpdateOptions],
) *mongo.SingleResult {
	return mongo.NewSingleResultFromDocument(mock.updatedDoc, mock.updateErr, nil)
}

type updateOneMock struct {
	updateCount  int
	lastFilter   any
	lastUpdate   any
	lastOptions  []options.UpdateOneOptions
	updateResult *mongo.UpdateResult
	err          error
}

func (mock *updateOneMock) UpdateOne(
	_ context.Context,
	filter any,
	update any,
	opts ...options.Lister[options.UpdateOneOptions],
) (*mongo.UpdateResult, error) {
	mock.updateCount++
	mock.lastFilter = filter
	mock.lastUpdate = update
	for _, option := range opts {
		resolved := options.UpdateOneOptions{}
		for _, setter := range option.List() {
			if err := setter(&resolved); err != nil {
				return nil, err
			}
		}
		mock.lastOptions = append(mock.lastOptions, resolved)
	}
	if mock.err != nil {
		return nil, mock.err
	}
	if mock.updateResult != nil {
		return mock.updateResult, nil
	}
	return &mongo.UpdateResult{MatchedCount: 1, ModifiedCount: 1}, nil
}

func TestPostRepositoryHelpers(t *testing.T) {
	repository, ok := NewPostMongoRepository().(*postMongoRepository)
	testassert.True(t, ok && repository != nil, "NewPostMongoRepository should return its concrete implementation")

	got, ok := normalizePostID(" Alpha-Post ")
	testassert.True(t, ok, "valid post id should normalize")
	testassert.Equal(t, got, "alpha-post", "normalized valid post id")
	got, ok = normalizePostID("bad id")
	testassert.True(t, !ok, "invalid post id should be rejected")
	testassert.Equal(t, got, "", "normalized invalid post id")

	alphaLikes := computeInitialLikes("alpha-post")
	testassert.Equal(t, alphaLikes, computeInitialLikes("alpha-post"), "deterministic likes")
	testassert.True(t, alphaLikes > 0, "initial likes should be positive")

	alphaHits := computeInitialHits("alpha-post")
	testassert.Equal(t, alphaHits, computeInitialHits("alpha-post"), "deterministic hits")
	testassert.True(t, alphaHits >= 700, "initial hits should meet minimum")

	testassert.Equal(t, normalizeSortOrder(" ASC "), "asc", "normalized sort order")
	testassert.Equal(t, normalizeSortOrder("nope"), "desc", "default sort order")

	testassert.Equal(t, normalizeSource(" medium "), "medium", "normalized source")
	testassert.Equal(t, normalizeSource("unknown"), "all", "default source")

	testassert.True(t, normalizeOptionalString(nil) == nil, "nil optional string should remain nil")
	blank := "   "
	testassert.True(t, normalizeOptionalString(&blank) == nil, "blank optional string should be cleared")
	value := " hello "
	gotValue := normalizeOptionalString(&value)
	testassert.True(t, gotValue != nil, "non-empty optional string should remain")
	testassert.Equal(t, *gotValue, "hello", "normalized optional string")

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
	testassert.Equal(t, normalizedPost.Source, "blog", "normalized post source")
	testassert.True(t, normalizedPost.UpdatedDate != nil, "updated date should remain set")
	testassert.Equal(t, *normalizedPost.UpdatedDate, "2026-03-01", "normalized updated date")
	testassert.Equal(t, len(normalizedPost.Topics), 1, "normalized topic count")
	testassert.Equal(t, normalizedPost.Topics[0].Color, "blue", "normalized topic color")
	testassert.True(t, normalizedPost.Category != nil, "valid category should remain set")
	testassert.Equal(t, normalizedPost.Category.ID, "programming", "normalized category id")

	normalizedWithoutCategory := normalizePostForResponse(PostRecord{
		Category: &PostCategory{ID: " ", Name: "Programming"},
	})
	testassert.True(t, normalizedWithoutCategory.Category == nil, "invalid category should be cleared")

	postIDs := collectPostIDs([]PostRecord{
		{ID: " Alpha-Post "},
		{ID: "bad id"},
		{ID: "beta-post"},
	})
	testassert.Equal(t, len(postIDs), 2, "normalized post id count")
	testassert.Equal(t, postIDs[0], "alpha-post", "first normalized post id")
	testassert.Equal(t, postIDs[1], "beta-post", "second normalized post id")
	testassert.True(t, collectPostIDs(nil) == nil, "nil post ids should remain nil")

	filter := buildContentFilter("tr", []string{"alpha-post"})
	testassert.Equal(t, filter["locale"], "tr", "content filter locale")
	scopedFilter, ok := filter["id"].(bson.M)
	testassert.True(t, ok && len(scopedFilter["$in"].([]string)) == 1, "content filter should include scoped ids")
	testassert.Equal(t, len(buildContentFilter("en", nil)), 1, "unscoped content filter size")
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
		testassert.NoError(t, ensurePostLikeDocuments(context.Background(), likesCollection, []string{"alpha-post", "beta-post"}, now), "ensurePostLikeDocuments")
		testassert.Equal(t, likesCollection.writeCount, 1, "likes write count")
		testassert.Equal(t, len(likesCollection.lastModels), 2, "like model count")

		hitsCollection := &bulkWriteMock{}
		testassert.NoError(t, ensurePostHitDocuments(context.Background(), hitsCollection, []string{"alpha-post"}, now), "ensurePostHitDocuments")
		testassert.Equal(t, hitsCollection.writeCount, 1, "hits write count")
		testassert.Equal(t, len(hitsCollection.lastModels), 1, "hit model count")

		testassert.NoError(t, ensurePostLikeDocuments(context.Background(), likesCollection, nil, now), "ensurePostLikeDocuments(nil)")
	})

	t.Run("fetch metrics from cursor docs", func(t *testing.T) {
		likesByPostID, err := fetchPostLikesByIDs(context.Background(), &findMock{
			docs: []any{
				bson.D{{Key: "postId", Value: "alpha-post"}, {Key: "likes", Value: int64(12)}},
			},
		}, []string{"alpha-post", "beta-post"})
		testassert.NoError(t, err, "fetchPostLikesByIDs")
		testassert.Equal(t, likesByPostID["alpha-post"], int64(12), "alpha likes")
		testassert.Equal(t, likesByPostID["beta-post"], computeInitialLikes("beta-post"), "beta initial likes")

		hitsByPostID, err := fetchPostHitsByIDs(context.Background(), &findMock{
			docs: []any{
				bson.D{{Key: "postId", Value: "alpha-post"}, {Key: "hits", Value: int64(120)}},
			},
		}, []string{"alpha-post", "beta-post"})
		testassert.NoError(t, err, "fetchPostHitsByIDs")
		testassert.Equal(t, hitsByPostID["alpha-post"], int64(120), "alpha hits")
		testassert.Equal(t, hitsByPostID["beta-post"], computeInitialHits("beta-post"), "beta initial hits")

		emptyLikes, err := fetchPostLikesByIDs(context.Background(), &findMock{}, nil)
		testassert.NoError(t, err, "fetchPostLikesByIDs(nil)")
		testassert.Equal(t, len(emptyLikes), 0, "empty likes count")
	})

	t.Run("increment metric values", func(t *testing.T) {
		likesCollection := &metricCollectionMock{
			updatedDoc: bson.D{{Key: "likes", Value: int64(41)}},
		}
		likes, err := incrementPostLikeValue(context.Background(), likesCollection, "alpha-post", now)
		testassert.NoError(t, err, "incrementPostLikeValue")
		testassert.Equal(t, likes, int64(41), "incremented likes")
		testassert.Equal(t, likesCollection.writeCount, 1, "like write count")

		hitsCollection := &metricCollectionMock{
			updatedDoc: bson.D{{Key: "hits", Value: int64(205)}},
		}
		hits, err := incrementPostHitValue(context.Background(), hitsCollection, "alpha-post", now)
		testassert.NoError(t, err, "incrementPostHitValue")
		testassert.Equal(t, hits, int64(205), "incremented hits")
		testassert.Equal(t, hitsCollection.writeCount, 1, "hit write count")
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
		testassert.NoError(t, err, "queryPostRecords")
		testassert.Equal(t, len(posts), 1, "queried post count")
		testassert.Equal(t, posts[0].Source, "blog", "normalized queried post source")

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
		testassert.NoError(t, err, "queryPostRecordByID")
		testassert.NotNil(t, post, "queried post should be returned")
		testassert.Equal(t, post.Source, "medium", "queried post source")

		post, err = queryPostRecordByID(context.Background(), &singleFindMock{
			doc: bson.M{},
			err: mongo.ErrNoDocuments,
		}, "en", "missing")
		testassert.NoError(t, err, "queryPostRecordByID(no documents)")
		testassert.True(t, post == nil, "missing post should be nil")
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
