package service

import (
	"context"
	"errors"
	"os"
	"path/filepath"
	"testing"
	"time"

	"suaybsimsek.com/blog-api/internal/domain"
	"suaybsimsek.com/blog-api/internal/repository"
)

type adminMediaAssetStubRepository struct {
	listMediaLibraryItems  func(context.Context, domain.AdminMediaLibraryFilter) (*domain.AdminMediaLibraryListPayload, error)
	findMediaAssetByID     func(context.Context, string) (*domain.AdminMediaAssetRecord, error)
	findMediaAssetByDigest func(context.Context, string) (*domain.AdminMediaAssetRecord, error)
	countMediaAssetUsage   func(context.Context, string) (int, error)
	createMediaAsset       func(context.Context, domain.AdminMediaAssetRecord) (*domain.AdminMediaAssetRecord, error)
	deleteMediaAssetByID   func(context.Context, string) (bool, error)
}

func (stub adminMediaAssetStubRepository) ListMediaLibraryItems(
	ctx context.Context,
	filter domain.AdminMediaLibraryFilter,
) (*domain.AdminMediaLibraryListPayload, error) {
	if stub.listMediaLibraryItems == nil {
		return nil, nil
	}
	return stub.listMediaLibraryItems(ctx, filter)
}

func (stub adminMediaAssetStubRepository) FindMediaAssetByID(
	ctx context.Context,
	id string,
) (*domain.AdminMediaAssetRecord, error) {
	if stub.findMediaAssetByID == nil {
		return nil, nil
	}
	return stub.findMediaAssetByID(ctx, id)
}

func (stub adminMediaAssetStubRepository) FindMediaAssetByDigest(
	ctx context.Context,
	digest string,
) (*domain.AdminMediaAssetRecord, error) {
	if stub.findMediaAssetByDigest == nil {
		return nil, nil
	}
	return stub.findMediaAssetByDigest(ctx, digest)
}

func (stub adminMediaAssetStubRepository) CountMediaAssetUsage(ctx context.Context, value string) (int, error) {
	if stub.countMediaAssetUsage == nil {
		return 0, nil
	}
	return stub.countMediaAssetUsage(ctx, value)
}

func (stub adminMediaAssetStubRepository) CreateMediaAsset(
	ctx context.Context,
	record domain.AdminMediaAssetRecord,
) (*domain.AdminMediaAssetRecord, error) {
	if stub.createMediaAsset == nil {
		return nil, nil
	}
	return stub.createMediaAsset(ctx, record)
}

func (stub adminMediaAssetStubRepository) DeleteMediaAssetByID(ctx context.Context, id string) (bool, error) {
	if stub.deleteMediaAssetByID == nil {
		return false, nil
	}
	return stub.deleteMediaAssetByID(ctx, id)
}

func TestDeleteAdminMediaAssetRejectsUsedAssets(t *testing.T) {
	originalRepository := adminMediaAssetRepository
	t.Cleanup(func() {
		adminMediaAssetRepository = originalRepository
	})

	adminMediaAssetRepository = adminMediaAssetStubRepository{
		findMediaAssetByID: func(context.Context, string) (*domain.AdminMediaAssetRecord, error) {
			return &domain.AdminMediaAssetRecord{
				ID:          "asset-1",
				Name:        "hero.webp",
				ContentType: "image/webp",
				CreatedAt:   time.Now().UTC(),
				UpdatedAt:   time.Now().UTC(),
			}, nil
		},
		countMediaAssetUsage: func(_ context.Context, value string) (int, error) {
			if value != "/api/media/asset-1" {
				t.Fatalf("unexpected value %q", value)
			}
			return 2, nil
		},
		deleteMediaAssetByID: func(context.Context, string) (bool, error) {
			t.Fatal("delete should not be called when asset is still used")
			return false, nil
		},
	}

	err := DeleteAdminMediaAsset(context.Background(), &domain.AdminUser{ID: "admin-1"}, "asset-1")
	if err == nil || err.Error() != "media asset is still used by posts" {
		t.Fatalf("expected in-use error, got %v", err)
	}
}

func TestDeleteAdminMediaAssetDeletesUnusedAsset(t *testing.T) {
	originalRepository := adminMediaAssetRepository
	t.Cleanup(func() {
		adminMediaAssetRepository = originalRepository
	})

	deletedID := ""
	adminMediaAssetRepository = adminMediaAssetStubRepository{
		findMediaAssetByID: func(context.Context, string) (*domain.AdminMediaAssetRecord, error) {
			return &domain.AdminMediaAssetRecord{
				ID:          "asset-2",
				Name:        "hero.webp",
				ContentType: "image/webp",
				CreatedAt:   time.Now().UTC(),
				UpdatedAt:   time.Now().UTC(),
			}, nil
		},
		countMediaAssetUsage: func(_ context.Context, value string) (int, error) {
			if value != "/api/media/asset-2" {
				t.Fatalf("unexpected value %q", value)
			}
			return 0, nil
		},
		deleteMediaAssetByID: func(_ context.Context, id string) (bool, error) {
			deletedID = id
			return true, nil
		},
	}

	if err := DeleteAdminMediaAsset(context.Background(), &domain.AdminUser{ID: "admin-1"}, "asset-2"); err != nil {
		t.Fatalf("expected delete to succeed, got %v", err)
	}
	if deletedID != "asset-2" {
		t.Fatalf("expected deleted id asset-2, got %q", deletedID)
	}
}

func TestDeleteAdminMediaAssetMapsRepositoryFailure(t *testing.T) {
	originalRepository := adminMediaAssetRepository
	t.Cleanup(func() {
		adminMediaAssetRepository = originalRepository
	})

	adminMediaAssetRepository = adminMediaAssetStubRepository{
		findMediaAssetByID: func(context.Context, string) (*domain.AdminMediaAssetRecord, error) {
			return nil, repository.ErrAdminMediaAssetRepositoryUnavailable
		},
	}

	err := DeleteAdminMediaAsset(context.Background(), &domain.AdminUser{ID: "admin-1"}, "asset-3")
	if err == nil || !errors.Is(err, repository.ErrAdminMediaAssetRepositoryUnavailable) {
		t.Fatalf("expected repository unavailable error, got %v", err)
	}
}

func TestEnrichAdminMediaLibraryItemsLoadsRelativePublicImageMetadata(t *testing.T) {
	workingDirectory, err := os.Getwd()
	if err != nil {
		t.Fatalf("Getwd() error = %v", err)
	}

	tempDirectory := t.TempDir()
	if err := os.MkdirAll(filepath.Join(tempDirectory, "public", "images"), 0o755); err != nil {
		t.Fatalf("MkdirAll() error = %v", err)
	}
	if err := os.WriteFile(
		filepath.Join(tempDirectory, "public", "images", "sample.png"),
		[]byte{
			0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
			0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
			0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
			0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
			0xde, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41,
			0x54, 0x08, 0xd7, 0x63, 0xf8, 0xcf, 0xc0, 0x00,
			0x00, 0x03, 0x01, 0x01, 0x00, 0xc9, 0xfe, 0x92,
			0xef, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e,
			0x44, 0xae, 0x42, 0x60, 0x82,
		},
		0o644,
	); err != nil {
		t.Fatalf("WriteFile() error = %v", err)
	}

	if err := os.Chdir(tempDirectory); err != nil {
		t.Fatalf("Chdir() error = %v", err)
	}
	t.Cleanup(func() {
		_ = os.Chdir(workingDirectory)
	})
	t.Setenv("SITE_URL", "https://suaybsimsek.com")

	items := enrichAdminMediaLibraryItems([]domain.AdminMediaLibraryItem{{
		ID:         "ref-1",
		Kind:       "REFERENCE",
		Name:       "Sample",
		Value:      "/images/sample.png",
		PreviewURL: "/images/sample.png",
	}})
	if len(items) != 1 {
		t.Fatalf("expected one item, got %d", len(items))
	}
	if items[0].Width != 1 || items[0].Height != 1 {
		t.Fatalf("expected dimensions 1x1, got %dx%d", items[0].Width, items[0].Height)
	}
	if items[0].SizeBytes <= 0 {
		t.Fatalf("expected positive file size, got %d", items[0].SizeBytes)
	}
}

func TestResolveAdminMediaPublicFilePathAllowsSameSiteAbsoluteURLs(t *testing.T) {
	t.Setenv("SITE_URL", "https://suaybsimsek.com")
	resolvedPath, ok := resolveAdminMediaPublicFilePath(
		"https://suaybsimsek.com/images/example.webp",
		"/tmp/public",
		"https://suaybsimsek.com",
	)
	if !ok {
		t.Fatal("expected same-site absolute URL to resolve")
	}
	if resolvedPath != filepath.Join("/tmp/public", "images", "example.webp") {
		t.Fatalf("unexpected resolved path %q", resolvedPath)
	}
}
