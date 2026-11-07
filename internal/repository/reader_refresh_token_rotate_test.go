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

func TestReaderRefreshTokenRepositoryRotateTransactions(t *testing.T) {
	mt := mtest.New(t, mtest.NewOptions().CreateClient(false))
	mt.RunOpts("reader refresh token rotation transactions", mtest.NewOptions().
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

		now := time.Date(2026, time.November, 7, 12, 0, 0, 0, time.UTC)
		replacement := domain.ReaderRefreshTokenRecord{
			JTI: " next-jti ", UserID: " reader-1 ", TokenHash: " hash ", Persistent: true,
			UserAgent: " browser ", RemoteIP: " 127.0.0.1 ", CountryCode: " tr ",
			LastSeenAt: now, ExpiresAt: now.Add(time.Hour), CreatedAt: now,
		}
		mt.AddMockResponses(
			mockUpdateResponse(1, 1), mtest.CreateSuccessResponse(), mtest.CreateSuccessResponse(),
			mockUpdateResponse(0, 0), mtest.CreateSuccessResponse(),
			bson.D{{Key: "ok", Value: 0}, {Key: "errmsg", Value: "update failed"}, {Key: "code", Value: int32(101)}},
			mtest.CreateSuccessResponse(),
			mockUpdateResponse(1, 1),
			bson.D{{Key: "ok", Value: 0}, {Key: "errmsg", Value: "insert failed"}, {Key: "code", Value: int32(101)}},
			mtest.CreateSuccessResponse(),
		)

		repository := NewReaderRefreshTokenMongoRepository()
		ctx := context.Background()
		if err := repository.Rotate(ctx, " current-jti ", replacement, now); err != nil {
			t.Fatalf("Rotate(success) error = %v", err)
		}
		if err := repository.Rotate(ctx, "expired-jti", replacement, now); !errors.Is(err, ErrReaderRefreshTokenNotFound) {
			t.Fatalf("Rotate(unmatched) error = %v, want not found", err)
		}
		if err := repository.Rotate(ctx, "update-error-jti", replacement, now); err == nil {
			t.Fatal("Rotate(update error) expected an error")
		}
		if err := repository.Rotate(ctx, "insert-error-jti", replacement, now); err == nil {
			t.Fatal("Rotate(insert error) expected an error")
		}
	})
}
