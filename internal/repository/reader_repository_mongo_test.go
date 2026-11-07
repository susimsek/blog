package repository

import (
	"context"
	"errors"
	"testing"
	"time"

	"suaybsimsek.com/blog-api/internal/domain"
	mtest "suaybsimsek.com/blog-api/internal/repository/testutil/mtest"

	"go.mongodb.org/mongo-driver/v2/bson"
)

func TestReaderUserRepositoryWithMockData(t *testing.T) {
	mt := mtest.New(t, mtest.NewOptions().CreateClient(false))
	mt.RunOpts("mock reader users", mtest.NewOptions().
		ClientType(mtest.Mock).
		DatabaseName("blog_test").
		CreateCollection(false), func(mt *mtest.T) {
		resetAdminRepositoryState()
		t.Cleanup(resetAdminRepositoryState)
		configureRepositoryMockDatabase(t, "blog_test")
		useMockAdminClient(mt)

		now := time.Date(2026, time.November, 6, 12, 0, 0, 0, time.UTC)
		userDocument := bson.D{
			{Key: "id", Value: " reader-1 "},
			{Key: "name", Value: " Reader "},
			{Key: "email", Value: " READER@example.com "},
			{Key: "avatarUrl", Value: " /avatar "},
			{Key: "lastLoginProvider", Value: " google "},
			{Key: "googleSubject", Value: " google-subject "},
			{Key: "googleEmail", Value: " GOOGLE@example.com "},
			{Key: "googleLinkedAt", Value: now},
			{Key: "githubSubject", Value: " github-subject "},
			{Key: "githubEmail", Value: " GITHUB@example.com "},
			{Key: "githubLinkedAt", Value: now},
			{Key: "sessionVersion", Value: int64(3)},
		}
		mt.AddMockResponses(
			mockFindResponse("blog_test."+readerUsersCollectionName, userDocument),
			mockFindResponse("blog_test."+readerUsersCollectionName, userDocument),
			mockFindResponse("blog_test."+readerUsersCollectionName),
			mockFindResponse("blog_test."+readerUsersCollectionName, userDocument),
			mtest.CreateSuccessResponse(bson.E{Key: "n", Value: int32(1)}),
			mockUpdateResponse(1, 1),
			mockUpdateResponse(1, 1),
			mockUpdateResponse(0, 0),
		)

		repository := NewReaderUserRepository()
		ctx := context.Background()

		byID, err := repository.FindByID(ctx, " reader-1 ")
		if err != nil || byID == nil || byID.ID != "reader-1" || byID.Email != "reader@example.com" || byID.SessionVersion != 3 {
			t.Fatalf("FindByID() = %#v, %v", byID, err)
		}
		byEmail, err := repository.FindByEmail(ctx, " READER@example.com ")
		if err != nil || byEmail == nil || byEmail.GoogleEmail != "google@example.com" || byEmail.GithubEmail != "github@example.com" {
			t.Fatalf("FindByEmail() = %#v, %v", byEmail, err)
		}
		byGoogle, err := repository.FindByGoogleSubject(ctx, "missing")
		if err != nil || byGoogle != nil {
			t.Fatalf("FindByGoogleSubject() = %#v, %v", byGoogle, err)
		}
		byGithub, err := repository.FindByGithubSubject(ctx, "github-subject")
		if err != nil || byGithub == nil || byGithub.GithubLinkedAt == nil {
			t.Fatalf("FindByGithubSubject() = %#v, %v", byGithub, err)
		}

		if err := repository.Create(ctx, domain.ReaderUserRecord{ReaderUser: domain.ReaderUser{
			ID: " reader-2 ", Name: " Reader Two ", Email: " READER2@example.com ",
			GoogleSubject: " google-2 ", GoogleEmail: " GOOGLE2@example.com ",
			GithubSubject: " github-2 ", GithubEmail: " GITHUB2@example.com ",
		}, SessionVersion: 2}); err != nil {
			t.Fatalf("Create() error = %v", err)
		}
		if err := repository.UpdateGoogleIdentityByID(ctx, "reader-1", "google-next", "NEXT@example.com", "Next", "/next", now); err != nil {
			t.Fatalf("UpdateGoogleIdentityByID() error = %v", err)
		}
		if err := repository.UpdateGithubIdentityByID(ctx, "reader-1", "github-next", "NEXT@example.com", "Next", "/next", now); err != nil {
			t.Fatalf("UpdateGithubIdentityByID() error = %v", err)
		}
		if err := repository.UpdateLastSeenProviderByID(ctx, "reader-missing", "github"); !errors.Is(err, ErrReaderUserNotFound) {
			t.Fatalf("UpdateLastSeenProviderByID() error = %v, want not found", err)
		}
	})
}

func TestFindReaderUserHandlesMissingAndInvalidDocuments(t *testing.T) {
	mt := mtest.New(t, mtest.NewOptions().CreateClient(false))
	mt.RunOpts("reader user decode edge cases", mtest.NewOptions().
		ClientType(mtest.Mock).
		DatabaseName("blog_test").
		CreateCollection(false), func(mt *mtest.T) {
		collection := mt.Client.Database("blog_test").Collection(readerUsersCollectionName)
		mt.AddMockResponses(
			mockFindResponse("blog_test."+readerUsersCollectionName),
			mockFindResponse("blog_test."+readerUsersCollectionName, bson.D{{Key: "email", Value: "reader@example.com"}}),
			mockFindResponse("blog_test."+readerUsersCollectionName, bson.D{{Key: "id", Value: "reader-1"}}),
		)

		for index, filter := range []bson.M{{"id": "missing"}, {"id": "empty-email"}, {"id": "empty-id"}} {
			record, err := findReaderUser(context.Background(), collection, filter)
			if err != nil || record != nil {
				t.Fatalf("findReaderUser() case %d = %#v, %v; want nil, nil", index, record, err)
			}
		}
	})
}

func TestReaderRefreshTokenRepositoryWithMockData(t *testing.T) {
	mt := mtest.New(t, mtest.NewOptions().CreateClient(false))
	mt.RunOpts("mock reader refresh tokens", mtest.NewOptions().
		ClientType(mtest.Mock).
		DatabaseName("blog_test").
		CreateCollection(false), func(mt *mtest.T) {
		resetAdminRepositoryState()
		resetReaderRefreshTokenRepositoryState()
		t.Cleanup(func() {
			resetAdminRepositoryState()
			resetReaderRefreshTokenRepositoryState()
		})
		configureRepositoryMockDatabase(t, "blog_test")
		useMockAdminClient(mt)
		markOnceDone(&readerRefreshTokenIndexesOnce)

		now := time.Date(2026, time.November, 6, 12, 0, 0, 0, time.UTC)
		rawToken := "reader-refresh-token"
		tokenDocument := bson.D{
			{Key: "jti", Value: "jti-1"},
			{Key: "userId", Value: "reader-1"},
			{Key: "tokenHash", Value: HashReaderRefreshToken(rawToken)},
			{Key: "persistent", Value: true},
			{Key: "userAgent", Value: "test-agent"},
			{Key: "remoteIP", Value: "127.0.0.1"},
			{Key: "countryCode", Value: "us"},
			{Key: "lastSeenAt", Value: now},
			{Key: "expiresAt", Value: now.Add(time.Hour)},
			{Key: "createdAt", Value: now},
			{Key: "replacedBy", Value: ""},
		}
		mt.AddMockResponses(
			mtest.CreateSuccessResponse(bson.E{Key: "n", Value: int32(1)}),
			mockFindResponse("blog_test."+readerRefreshTokensCollectionName, tokenDocument),
			mockFindResponse("blog_test."+readerRefreshTokensCollectionName),
			mtest.CreateSuccessResponse(bson.E{Key: "n", Value: int32(1)}),
		)

		repository := NewReaderRefreshTokenMongoRepository()
		ctx := context.Background()
		record := domain.ReaderRefreshTokenRecord{
			JTI: " jti-2 ", UserID: " reader-1 ", TokenHash: " hash ", Persistent: true,
			UserAgent: " agent ", RemoteIP: " 127.0.0.1 ", CountryCode: " us ",
			LastSeenAt: now, ExpiresAt: now.Add(time.Hour), CreatedAt: now,
		}
		if err := repository.Create(ctx, record); err != nil {
			t.Fatalf("Create() error = %v", err)
		}
		active, err := repository.FindActiveByToken(ctx, " jti-1 ", rawToken, now)
		if err != nil || active == nil || active.CountryCode != "US" || active.UserID != "reader-1" {
			t.Fatalf("FindActiveByToken(active) = %#v, %v", active, err)
		}
		inactive, err := repository.FindActiveByToken(ctx, "missing", rawToken, now)
		if err != nil || inactive != nil {
			t.Fatalf("FindActiveByToken(missing) = %#v, %v", inactive, err)
		}
		if err := repository.RevokeByJTI(ctx, " jti-1 ", now); err != nil {
			t.Fatalf("RevokeByJTI() error = %v", err)
		}
	})
}

func TestHashReaderRefreshTokenTrimsInput(t *testing.T) {
	if got, want := HashReaderRefreshToken(" token "), HashReaderRefreshToken("token"); got != want {
		t.Fatalf("HashReaderRefreshToken() = %q, want %q", got, want)
	}
}

func TestEnsureReaderRepositoryIndexes(t *testing.T) {
	mt := mtest.New(t, mtest.NewOptions().CreateClient(false))
	mt.RunOpts("create reader repository indexes", mtest.NewOptions().
		ClientType(mtest.Mock).
		DatabaseName("blog_test").
		CreateCollection(false), func(mt *mtest.T) {
		resetAdminRepositoryState()
		resetReaderRefreshTokenRepositoryState()
		t.Cleanup(func() {
			resetAdminRepositoryState()
			resetReaderRefreshTokenRepositoryState()
		})
		configureRepositoryMockDatabase(t, "blog_test")
		adminMongoClient = mt.Client
		markOnceDone(&adminMongoClientOnce)

		mt.AddMockResponses(
			mockUpdateResponse(1, 1),
			mockUpdateResponse(1, 1),
			mtest.CreateSuccessResponse(),
			mtest.CreateSuccessResponse(),
		)
		collection := mt.Client.Database("blog_test").Collection(readerUsersCollectionName)
		if err := ensureReaderUserIndexes(collection); err != nil {
			t.Fatalf("ensureReaderUserIndexes() error = %v", err)
		}
		tokenCollection := mt.Client.Database("blog_test").Collection(readerRefreshTokensCollectionName)
		if err := ensureReaderRefreshTokenIndexes(tokenCollection); err != nil {
			t.Fatalf("ensureReaderRefreshTokenIndexes() error = %v", err)
		}
	})
}
