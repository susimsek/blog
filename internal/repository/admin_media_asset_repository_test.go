package repository

import (
	"context"
	"errors"
	"reflect"
	"testing"
	"time"

	"suaybsimsek.com/blog-api/internal/domain"
	mtest "suaybsimsek.com/blog-api/internal/repository/testutil/mtest"

	"go.mongodb.org/mongo-driver/v2/bson"
)

func TestBuildAdminMediaLibrarySortDocument(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name     string
		sortKey  string
		expected bson.D
	}{
		{
			name:    "recent by default",
			sortKey: "",
			expected: bson.D{
				{Key: "updatedAt", Value: -1},
				{Key: "usageCount", Value: -1},
				{Key: "sortName", Value: 1},
			},
		},
		{
			name:    "name ascending",
			sortKey: adminMediaLibrarySortName,
			expected: bson.D{
				{Key: "sortName", Value: 1},
				{Key: "updatedAt", Value: -1},
				{Key: "usageCount", Value: -1},
			},
		},
		{
			name:    "size descending",
			sortKey: adminMediaLibrarySortSize,
			expected: bson.D{
				{Key: "sizeBytes", Value: -1},
				{Key: "updatedAt", Value: -1},
				{Key: "sortName", Value: 1},
			},
		},
		{
			name:    "usage descending",
			sortKey: adminMediaLibrarySortUsage,
			expected: bson.D{
				{Key: "usageCount", Value: -1},
				{Key: "updatedAt", Value: -1},
				{Key: "sortName", Value: 1},
			},
		},
		{
			name:    "unknown falls back to recent",
			sortKey: "unknown",
			expected: bson.D{
				{Key: "updatedAt", Value: -1},
				{Key: "usageCount", Value: -1},
				{Key: "sortName", Value: 1},
			},
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()

			actual := buildAdminMediaLibrarySortDocument(test.sortKey)
			if !reflect.DeepEqual(actual, test.expected) {
				t.Fatalf("expected %#v, got %#v", test.expected, actual)
			}
		})
	}
}

func TestAdminMediaAssetRepositoryWithMockData(t *testing.T) {
	mt := mtest.New(t, mtest.NewOptions().CreateClient(false))
	mt.RunOpts("mock admin media assets", mtest.NewOptions().
		ClientType(mtest.Mock).
		DatabaseName("blog_test").
		CreateCollection(false), func(mt *mtest.T) {
		resetPostRepositoryState()
		t.Cleanup(resetPostRepositoryState)
		configureRepositoryMockDatabase(t, "blog_test")
		useMockPostClient(mt)

		now := time.Date(2026, time.November, 6, 12, 0, 0, 0, time.UTC)
		assetDocument := bson.D{
			{Key: "id", Value: " asset-1 "},
			{Key: "name", Value: " Logo "},
			{Key: "contentType", Value: " image/webp "},
			{Key: "digest", Value: " ABCDEF "},
			{Key: "sizeBytes", Value: int32(123)},
			{Key: "width", Value: int32(640)},
			{Key: "height", Value: int32(480)},
			{Key: "data", Value: []byte("image")},
			{Key: "createdBy", Value: " admin-1 "},
			{Key: "createdAt", Value: now},
			{Key: "updatedAt", Value: now},
		}
		aggregateResult := bson.D{
			{Key: "items", Value: bson.A{bson.D{
				{Key: "id", Value: " asset-1 "},
				{Key: "kind", Value: " UPLOADED "},
				{Key: "name", Value: " Logo "},
				{Key: "value", Value: " /api/media/asset-1 "},
				{Key: "previewUrl", Value: " /api/media/asset-1 "},
				{Key: "contentType", Value: " image/webp "},
				{Key: "width", Value: int32(640)},
				{Key: "height", Value: int32(480)},
				{Key: "sizeBytes", Value: int32(123)},
				{Key: "usageCount", Value: int32(2)},
				{Key: "createdAt", Value: now},
				{Key: "updatedAt", Value: now},
			}}},
			{Key: "meta", Value: bson.A{bson.D{{Key: "total", Value: int32(3)}}}},
		}
		mt.AddMockResponses(
			mtest.CreateCursorResponse(0, "blog_test."+mediaAssetsCollectionName, mtest.FirstBatch, aggregateResult),
			mtest.CreateCursorResponse(0, "blog_test."+postsCollectionName, mtest.FirstBatch, aggregateResult),
			mtest.CreateCursorResponse(0, "blog_test."+mediaAssetsCollectionName, mtest.FirstBatch),
			mockFindResponse("blog_test."+mediaAssetsCollectionName, assetDocument),
			mockFindResponse("blog_test."+mediaAssetsCollectionName),
			mockFindResponse("blog_test."+mediaAssetsCollectionName, assetDocument),
			mockFindResponse("blog_test."+mediaAssetsCollectionName),
			mtest.CreateSuccessResponse(bson.E{Key: "n", Value: int32(1)}),
			mockUpdateResponse(1, 1),
			mockUpdateResponse(0, 0),
			mtest.CreateCursorResponse(0, "blog_test."+postsCollectionName, mtest.FirstBatch,
				bson.D{{Key: "usageCount", Value: int32(2)}},
			),
			mtest.CreateCursorResponse(0, "blog_test."+postsCollectionName, mtest.FirstBatch),
			mtest.CreateSuccessResponse(bson.E{Key: "n", Value: int32(1)}),
			mtest.CreateSuccessResponse(bson.E{Key: "n", Value: int32(0)}),
		)

		repository := NewAdminMediaAssetRepository()
		ctx := context.Background()
		assertAdminMediaLibraryListResults(ctx, t, repository)
		assertAdminMediaAssetFindResults(ctx, t, repository)
		assertAdminMediaAssetWriteResults(ctx, t, repository)
		assertAdminMediaAssetUsageAndDeleteResults(ctx, t, repository)
	})
}

func assertAdminMediaLibraryListResults(ctx context.Context, t *testing.T, repository AdminMediaAssetRepository) {
	t.Helper()
	uploaded, err := repository.ListMediaLibraryItems(ctx, domain.AdminMediaLibraryFilter{
		Kind: " uploaded ", Query: "logo", Sort: "name", Page: 2, Size: 5,
	})
	if err != nil {
		t.Fatalf("ListMediaLibraryItems(uploaded) error = %v", err)
	}
	if uploaded.Page != 2 || uploaded.Size != 5 || uploaded.Total != 3 || len(uploaded.Items) != 1 {
		t.Fatalf("ListMediaLibraryItems(uploaded) = %#v", uploaded)
	}
	if item := uploaded.Items[0]; item.ID != "asset-1" || item.Kind != "UPLOADED" || item.Name != "Logo" || item.UsageCount != 2 {
		t.Fatalf("uploaded item was not normalized: %#v", item)
	}

	referenced, err := repository.ListMediaLibraryItems(ctx, domain.AdminMediaLibraryFilter{
		Kind: "REFERENCE", Query: "Captain", Page: 1, Size: 10,
	})
	if err != nil || referenced.Total != 3 || len(referenced.Items) != 1 {
		t.Fatalf("ListMediaLibraryItems(reference) = %#v, %v", referenced, err)
	}
	all, err := repository.ListMediaLibraryItems(ctx, domain.AdminMediaLibraryFilter{})
	if err != nil || all.Page != 1 || all.Size != 10 || all.Total != 0 || all.Items == nil {
		t.Fatalf("ListMediaLibraryItems(all, empty) = %#v, %v", all, err)
	}
}

func assertAdminMediaAssetFindResults(ctx context.Context, t *testing.T, repository AdminMediaAssetRepository) {
	t.Helper()
	asset, err := repository.FindMediaAssetByID(ctx, " asset-1 ")
	if err != nil || asset == nil || asset.ID != "asset-1" || asset.Digest != "abcdef" || string(asset.Data) != "image" {
		t.Fatalf("FindMediaAssetByID() = %#v, %v", asset, err)
	}
	missing, err := repository.FindMediaAssetByID(ctx, "missing")
	if err != nil || missing != nil {
		t.Fatalf("FindMediaAssetByID(missing) = %#v, %v", missing, err)
	}
	asset, err = repository.FindMediaAssetByDigest(ctx, " ABCDEF ")
	if err != nil || asset == nil || asset.Digest != "abcdef" {
		t.Fatalf("FindMediaAssetByDigest() = %#v, %v", asset, err)
	}
	missing, err = repository.FindMediaAssetByDigest(ctx, "missing")
	if err != nil || missing != nil {
		t.Fatalf("FindMediaAssetByDigest(missing) = %#v, %v", missing, err)
	}
}

func assertAdminMediaAssetWriteResults(ctx context.Context, t *testing.T, repository AdminMediaAssetRepository) {
	t.Helper()
	created, err := repository.CreateMediaAsset(ctx, domain.AdminMediaAssetRecord{ID: "asset-2"})
	if err != nil || created == nil || created.CreatedAt.IsZero() || !created.CreatedAt.Equal(created.UpdatedAt) {
		t.Fatalf("CreateMediaAsset() = %#v, %v", created, err)
	}
	if _, err := repository.ReplaceMediaAsset(ctx, domain.AdminMediaAssetRecord{}); !errors.Is(err, ErrAdminMediaAssetNotFound) {
		t.Fatalf("ReplaceMediaAsset(empty ID) error = %v", err)
	}
	replaced, err := repository.ReplaceMediaAsset(ctx, domain.AdminMediaAssetRecord{ID: "asset-1"})
	if err != nil || replaced == nil || replaced.ID != "asset-1" {
		t.Fatalf("ReplaceMediaAsset() = %#v, %v", replaced, err)
	}
	if _, err := repository.ReplaceMediaAsset(ctx, domain.AdminMediaAssetRecord{ID: "missing"}); !errors.Is(err, ErrAdminMediaAssetNotFound) {
		t.Fatalf("ReplaceMediaAsset(unmatched) error = %v", err)
	}
}

func assertAdminMediaAssetUsageAndDeleteResults(ctx context.Context, t *testing.T, repository AdminMediaAssetRepository) {
	t.Helper()
	if count, err := repository.CountMediaAssetUsage(ctx, "  "); err != nil || count != 0 {
		t.Fatalf("CountMediaAssetUsage(blank) = %d, %v", count, err)
	}
	if count, err := repository.CountMediaAssetUsage(ctx, "/logo.webp"); err != nil || count != 2 {
		t.Fatalf("CountMediaAssetUsage() = %d, %v", count, err)
	}
	if count, err := repository.CountMediaAssetUsage(ctx, "/unused.webp"); err != nil || count != 0 {
		t.Fatalf("CountMediaAssetUsage(unused) = %d, %v", count, err)
	}
	deleted, err := repository.DeleteMediaAssetByID(ctx, "asset-1")
	if err != nil || !deleted {
		t.Fatalf("DeleteMediaAssetByID() = %v, %v", deleted, err)
	}
	deleted, err = repository.DeleteMediaAssetByID(ctx, "missing")
	if err != nil || deleted {
		t.Fatalf("DeleteMediaAssetByID(missing) = %v, %v", deleted, err)
	}
}

func TestAdminMediaAssetRepositoryUnavailablePaths(t *testing.T) {
	resetPostRepositoryState()
	t.Cleanup(resetPostRepositoryState)
	t.Setenv("MONGODB_URI", "")
	t.Setenv("MONGODB_DATABASE", "")

	repository := NewAdminMediaAssetRepository()
	ctx := context.Background()

	if _, err := repository.ListMediaLibraryItems(ctx, domain.AdminMediaLibraryFilter{}); !errors.Is(err, ErrAdminMediaAssetRepositoryUnavailable) {
		t.Fatalf("ListMediaLibraryItems() error = %v", err)
	}
	if _, err := repository.FindMediaAssetByID(ctx, "asset-1"); !errors.Is(err, ErrAdminMediaAssetRepositoryUnavailable) {
		t.Fatalf("FindMediaAssetByID() error = %v", err)
	}
	if _, err := repository.FindMediaAssetByDigest(ctx, "digest"); !errors.Is(err, ErrAdminMediaAssetRepositoryUnavailable) {
		t.Fatalf("FindMediaAssetByDigest() error = %v", err)
	}
	if _, err := repository.CreateMediaAsset(ctx, domain.AdminMediaAssetRecord{ID: "asset-1"}); !errors.Is(err, ErrAdminMediaAssetRepositoryUnavailable) {
		t.Fatalf("CreateMediaAsset() error = %v", err)
	}
	if _, err := repository.ReplaceMediaAsset(ctx, domain.AdminMediaAssetRecord{ID: "asset-1"}); !errors.Is(err, ErrAdminMediaAssetRepositoryUnavailable) {
		t.Fatalf("ReplaceMediaAsset() error = %v", err)
	}
	if _, err := repository.CountMediaAssetUsage(ctx, "asset-1"); !errors.Is(err, ErrAdminMediaAssetRepositoryUnavailable) {
		t.Fatalf("CountMediaAssetUsage() error = %v", err)
	}
	if _, err := repository.DeleteMediaAssetByID(ctx, "asset-1"); !errors.Is(err, ErrAdminMediaAssetRepositoryUnavailable) {
		t.Fatalf("DeleteMediaAssetByID() error = %v", err)
	}
}

func TestAdminMediaAssetRepositoryPropagatesMongoErrors(t *testing.T) {
	mt := mtest.New(t, mtest.NewOptions().CreateClient(false))
	mt.RunOpts("propagates mongo errors", mtest.NewOptions().
		ClientType(mtest.Mock).
		DatabaseName("blog_test").
		CreateCollection(false), func(mt *mtest.T) {
		resetPostRepositoryState()
		t.Cleanup(resetPostRepositoryState)
		configureRepositoryMockDatabase(t, "blog_test")
		useMockPostClient(mt)

		mongoError := bson.D{
			{Key: "ok", Value: int32(0)},
			{Key: "errmsg", Value: "mock mongo failure"},
			{Key: "code", Value: int32(123)},
		}
		mt.AddMockResponses(
			mongoError,
			mongoError,
			mongoError,
			mongoError,
			mongoError,
			mongoError,
			mtest.CreateCursorResponse(0, "blog_test."+postsCollectionName, mtest.FirstBatch,
				bson.D{{Key: "usageCount", Value: "invalid"}},
			),
			mongoError,
		)

		repository := NewAdminMediaAssetRepository()
		ctx := context.Background()
		if _, err := repository.ListMediaLibraryItems(ctx, domain.AdminMediaLibraryFilter{}); err == nil {
			t.Fatal("ListMediaLibraryItems() error = nil")
		}
		if _, err := repository.FindMediaAssetByID(ctx, "asset-1"); err == nil {
			t.Fatal("FindMediaAssetByID() error = nil")
		}
		if _, err := repository.FindMediaAssetByDigest(ctx, "digest"); err == nil {
			t.Fatal("FindMediaAssetByDigest() error = nil")
		}
		if _, err := repository.CreateMediaAsset(ctx, domain.AdminMediaAssetRecord{ID: "asset-1"}); err == nil {
			t.Fatal("CreateMediaAsset() error = nil")
		}
		if _, err := repository.ReplaceMediaAsset(ctx, domain.AdminMediaAssetRecord{ID: "asset-1"}); err == nil {
			t.Fatal("ReplaceMediaAsset() error = nil")
		}
		if _, err := repository.CountMediaAssetUsage(ctx, "/logo.webp"); err == nil {
			t.Fatal("CountMediaAssetUsage(aggregate failure) error = nil")
		}
		if _, err := repository.CountMediaAssetUsage(ctx, "/logo.webp"); err == nil {
			t.Fatal("CountMediaAssetUsage(decode failure) error = nil")
		}
		if _, err := repository.DeleteMediaAssetByID(ctx, "asset-1"); err == nil {
			t.Fatal("DeleteMediaAssetByID() error = nil")
		}
	})
}

func TestAdminMediaAssetListFailsWhenPostCollectionIsUnavailable(t *testing.T) {
	mt := mtest.New(t, mtest.NewOptions().CreateClient(false))
	mt.RunOpts("post collection unavailable", mtest.NewOptions().
		ClientType(mtest.Mock).
		DatabaseName("blog_test").
		CreateCollection(false), func(mt *mtest.T) {
		resetPostRepositoryState()
		t.Cleanup(resetPostRepositoryState)
		configureRepositoryMockDatabase(t, "blog_test")
		useMockPostClient(mt)
		postContentIndexesErr = errors.New("content index failure")

		_, err := NewAdminMediaAssetRepository().ListMediaLibraryItems(context.Background(), domain.AdminMediaLibraryFilter{})
		if !errors.Is(err, ErrAdminMediaAssetRepositoryUnavailable) {
			t.Fatalf("ListMediaLibraryItems() error = %v", err)
		}
	})
}
