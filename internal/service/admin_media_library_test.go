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
	replaceMediaAsset      func(context.Context, domain.AdminMediaAssetRecord) (*domain.AdminMediaAssetRecord, error)
	deleteMediaAssetByID   func(context.Context, string) (bool, error)
}

func TestHashAdminMediaPayloadUsesSHA256(t *testing.T) {
	if got := hashAdminMediaPayload([]byte("hello")); got != "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824" {
		t.Fatalf("hashAdminMediaPayload() = %q", got)
	}
}

func TestListAdminMediaLibraryNormalizesFilterAndEmptyPayload(t *testing.T) {
	originalRepository := adminMediaAssetRepository
	t.Cleanup(func() { adminMediaAssetRepository = originalRepository })

	adminMediaAssetRepository = adminMediaAssetStubRepository{
		listMediaLibraryItems: func(_ context.Context, filter domain.AdminMediaLibraryFilter) (*domain.AdminMediaLibraryListPayload, error) {
			if filter.Query != "logo" || filter.Kind != "UPLOADED" || filter.Sort != "NAME" || filter.Page != 1 || filter.Size != adminMediaLibraryMaxSize {
				t.Fatalf("ListMediaLibraryItems() filter = %#v", filter)
			}
			return &domain.AdminMediaLibraryListPayload{Items: nil, Total: 0}, nil
		},
	}

	result, err := ListAdminMediaLibrary(context.Background(), &domain.AdminUser{ID: "admin-1"}, domain.AdminMediaLibraryFilter{
		Query: " logo ", Kind: " uploaded ", Sort: " name ", Page: 0, Size: adminMediaLibraryMaxSize + 1,
	})
	if err != nil {
		t.Fatalf("ListAdminMediaLibrary() error = %v", err)
	}
	if result == nil || result.Page != 1 || result.Size != adminMediaLibraryMaxSize || result.Items == nil || len(result.Items) != 0 {
		t.Fatalf("ListAdminMediaLibrary() = %#v", result)
	}
}

func TestListAdminMediaLibraryReturnsDefaultForNilPayload(t *testing.T) {
	originalRepository := adminMediaAssetRepository
	t.Cleanup(func() { adminMediaAssetRepository = originalRepository })
	adminMediaAssetRepository = adminMediaAssetStubRepository{
		listMediaLibraryItems: func(context.Context, domain.AdminMediaLibraryFilter) (*domain.AdminMediaLibraryListPayload, error) {
			return nil, nil
		},
	}

	result, err := ListAdminMediaLibrary(context.Background(), &domain.AdminUser{ID: "admin-1"}, domain.AdminMediaLibraryFilter{})
	if err != nil || result == nil || result.Page != adminMediaLibraryDefaultPage || result.Size != adminMediaLibraryDefaultSize || result.Items == nil {
		t.Fatalf("ListAdminMediaLibrary() = %#v, %v", result, err)
	}
}

func TestUploadAdminMediaAssetReusesAndCreatesImage(t *testing.T) {
	originalRepository := adminMediaAssetRepository
	t.Cleanup(func() { adminMediaAssetRepository = originalRepository })
	createdRecord := domain.AdminMediaAssetRecord{}
	adminMediaAssetRepository = adminMediaAssetStubRepository{
		findMediaAssetByDigest: func(context.Context, string) (*domain.AdminMediaAssetRecord, error) {
			return &domain.AdminMediaAssetRecord{
				ID: "existing-asset", Name: "existing.png", ContentType: "image/png", Digest: "digest", SizeBytes: 5,
				Width: 1, Height: 1,
			}, nil
		},
	}

	input := domain.AdminMediaUploadInput{
		FileName: "  ",
		DataURL:  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR42mP4z8AAAAMBAQDJ/pLvAAAAAElFTkSuQmCC",
	}
	user := &domain.AdminUser{ID: "admin-1"}
	reused, err := UploadAdminMediaAsset(context.Background(), user, input)
	if err != nil || reused == nil || reused.ID != "existing-asset" {
		t.Fatalf("UploadAdminMediaAsset(existing) = %#v, %v", reused, err)
	}

	adminMediaAssetRepository = adminMediaAssetStubRepository{
		findMediaAssetByDigest: func(context.Context, string) (*domain.AdminMediaAssetRecord, error) { return nil, nil },
		createMediaAsset: func(_ context.Context, record domain.AdminMediaAssetRecord) (*domain.AdminMediaAssetRecord, error) {
			createdRecord = record
			return &record, nil
		},
	}
	created, err := UploadAdminMediaAsset(context.Background(), user, input)
	if err != nil || created == nil || created.Kind != "UPLOADED" || created.Name != "media-image.png" {
		t.Fatalf("UploadAdminMediaAsset(new) = %#v, %v", created, err)
	}
	if createdRecord.ID == "" || createdRecord.ContentType != "image/png" || createdRecord.Width != 1 || createdRecord.Height != 1 || createdRecord.CreatedBy != user.ID {
		t.Fatalf("created media record was not populated: %#v", createdRecord)
	}
}

func TestResolveAdminMediaAssetReturnsCopiedPayload(t *testing.T) {
	originalRepository := adminMediaAssetRepository
	t.Cleanup(func() { adminMediaAssetRepository = originalRepository })
	originalData := []byte("image")
	adminMediaAssetRepository = adminMediaAssetStubRepository{
		findMediaAssetByID: func(_ context.Context, id string) (*domain.AdminMediaAssetRecord, error) {
			if id != "asset-1" {
				t.Fatalf("FindMediaAssetByID() id = %q", id)
			}
			return &domain.AdminMediaAssetRecord{ContentType: " image/webp ", Digest: " digest ", Data: originalData}, nil
		},
	}

	asset, err := ResolveAdminMediaAsset(context.Background(), " asset-1 ")
	if err != nil || asset == nil || asset.ContentType != "image/webp" || asset.ETag != `"digest"` {
		t.Fatalf("ResolveAdminMediaAsset() = %#v, %v", asset, err)
	}
	asset.Data[0] = 'X'
	if originalData[0] != 'i' {
		t.Fatal("resolved payload must not alias repository data")
	}
}

func TestAdminMediaLibraryOperationsHandleInvalidRequestsAndRepositoryErrors(t *testing.T) {
	ctx := context.Background()
	user := &domain.AdminUser{ID: "admin-1"}
	validUpload := domain.AdminMediaUploadInput{
		FileName: "image.png",
		DataURL:  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR42mP4z8AAAAMBAQDJ/pLvAAAAAElFTkSuQmCC",
	}
	asset := &domain.AdminMediaAssetRecord{ID: "asset-1", Name: "image.png", ContentType: "image/png", Data: []byte("image")}
	cases := []struct {
		name       string
		repository adminMediaAssetStubRepository
		run        func() error
	}{
		{name: "list requires authentication", run: func() error { _, err := ListAdminMediaLibrary(ctx, nil, domain.AdminMediaLibraryFilter{}); return err }},
		{
			name: "list maps repository error",
			repository: adminMediaAssetStubRepository{listMediaLibraryItems: func(context.Context, domain.AdminMediaLibraryFilter) (*domain.AdminMediaLibraryListPayload, error) {
				return nil, errors.New("list failed")
			}},
			run: func() error { _, err := ListAdminMediaLibrary(ctx, user, domain.AdminMediaLibraryFilter{}); return err },
		},
		{name: "upload requires authentication", run: func() error { _, err := UploadAdminMediaAsset(ctx, nil, validUpload); return err }},
		{name: "upload rejects invalid data URL", run: func() error { _, err := UploadAdminMediaAsset(ctx, user, domain.AdminMediaUploadInput{}); return err }},
		{
			name: "upload maps digest lookup error",
			repository: adminMediaAssetStubRepository{findMediaAssetByDigest: func(context.Context, string) (*domain.AdminMediaAssetRecord, error) {
				return nil, errors.New("digest lookup failed")
			}},
			run: func() error { _, err := UploadAdminMediaAsset(ctx, user, validUpload); return err },
		},
		{
			name: "upload maps create error",
			repository: adminMediaAssetStubRepository{
				findMediaAssetByDigest: func(context.Context, string) (*domain.AdminMediaAssetRecord, error) { return nil, nil },
				createMediaAsset: func(context.Context, domain.AdminMediaAssetRecord) (*domain.AdminMediaAssetRecord, error) {
					return nil, errors.New("create failed")
				},
			},
			run: func() error { _, err := UploadAdminMediaAsset(ctx, user, validUpload); return err },
		},
		{name: "replace requires authentication", run: func() error { _, err := ReplaceAdminMediaAsset(ctx, nil, "asset-1", validUpload); return err }},
		{name: "replace requires id", run: func() error { _, err := ReplaceAdminMediaAsset(ctx, user, " ", validUpload); return err }},
		{
			name: "replace maps lookup error",
			repository: adminMediaAssetStubRepository{findMediaAssetByID: func(context.Context, string) (*domain.AdminMediaAssetRecord, error) {
				return nil, errors.New("lookup failed")
			}},
			run: func() error { _, err := ReplaceAdminMediaAsset(ctx, user, "asset-1", validUpload); return err },
		},
		{
			name:       "replace rejects missing asset",
			repository: adminMediaAssetStubRepository{findMediaAssetByID: func(context.Context, string) (*domain.AdminMediaAssetRecord, error) { return nil, nil }},
			run:        func() error { _, err := ReplaceAdminMediaAsset(ctx, user, "asset-1", validUpload); return err },
		},
		{
			name: "replace maps update error",
			repository: adminMediaAssetStubRepository{
				findMediaAssetByID: func(context.Context, string) (*domain.AdminMediaAssetRecord, error) { return asset, nil },
				replaceMediaAsset: func(context.Context, domain.AdminMediaAssetRecord) (*domain.AdminMediaAssetRecord, error) {
					return nil, errors.New("replace failed")
				},
			},
			run: func() error { _, err := ReplaceAdminMediaAsset(ctx, user, "asset-1", validUpload); return err },
		},
		{
			name: "replace maps usage lookup error",
			repository: adminMediaAssetStubRepository{
				findMediaAssetByID: func(context.Context, string) (*domain.AdminMediaAssetRecord, error) { return asset, nil },
				replaceMediaAsset: func(_ context.Context, record domain.AdminMediaAssetRecord) (*domain.AdminMediaAssetRecord, error) {
					return &record, nil
				},
				countMediaAssetUsage: func(context.Context, string) (int, error) {
					return 0, errors.New("usage lookup failed")
				},
			},
			run: func() error { _, err := ReplaceAdminMediaAsset(ctx, user, "asset-1", validUpload); return err },
		},
		{name: "delete requires authentication", run: func() error { return DeleteAdminMediaAsset(ctx, nil, "asset-1") }},
		{name: "delete requires id", run: func() error { return DeleteAdminMediaAsset(ctx, user, " ") }},
		{
			name:       "delete rejects missing asset",
			repository: adminMediaAssetStubRepository{findMediaAssetByID: func(context.Context, string) (*domain.AdminMediaAssetRecord, error) { return nil, nil }},
			run:        func() error { return DeleteAdminMediaAsset(ctx, user, "asset-1") },
		},
		{
			name: "delete maps usage lookup error",
			repository: adminMediaAssetStubRepository{
				findMediaAssetByID:   func(context.Context, string) (*domain.AdminMediaAssetRecord, error) { return asset, nil },
				countMediaAssetUsage: func(context.Context, string) (int, error) { return 0, errors.New("usage lookup failed") },
			},
			run: func() error { return DeleteAdminMediaAsset(ctx, user, "asset-1") },
		},
		{
			name: "delete maps repository error",
			repository: adminMediaAssetStubRepository{
				findMediaAssetByID:   func(context.Context, string) (*domain.AdminMediaAssetRecord, error) { return asset, nil },
				countMediaAssetUsage: func(context.Context, string) (int, error) { return 0, nil },
				deleteMediaAssetByID: func(context.Context, string) (bool, error) { return false, errors.New("delete failed") },
			},
			run: func() error { return DeleteAdminMediaAsset(ctx, user, "asset-1") },
		},
		{
			name: "delete detects stale asset",
			repository: adminMediaAssetStubRepository{
				findMediaAssetByID:   func(context.Context, string) (*domain.AdminMediaAssetRecord, error) { return asset, nil },
				countMediaAssetUsage: func(context.Context, string) (int, error) { return 0, nil },
				deleteMediaAssetByID: func(context.Context, string) (bool, error) { return false, nil },
			},
			run: func() error { return DeleteAdminMediaAsset(ctx, user, "asset-1") },
		},
		{name: "resolve requires id", run: func() error { _, err := ResolveAdminMediaAsset(ctx, " "); return err }},
		{
			name: "resolve rejects missing payload",
			repository: adminMediaAssetStubRepository{findMediaAssetByID: func(context.Context, string) (*domain.AdminMediaAssetRecord, error) {
				return &domain.AdminMediaAssetRecord{ID: "asset-1", ContentType: "image/png"}, nil
			}},
			run: func() error { _, err := ResolveAdminMediaAsset(ctx, "asset-1"); return err },
		},
	}

	previousRepository := adminMediaAssetRepository
	t.Cleanup(func() { adminMediaAssetRepository = previousRepository })
	for _, testCase := range cases {
		t.Run(testCase.name, func(t *testing.T) {
			adminMediaAssetRepository = testCase.repository
			if err := testCase.run(); err == nil {
				t.Fatal("expected operation to return an error")
			}
		})
	}
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

func (stub adminMediaAssetStubRepository) ReplaceMediaAsset(
	ctx context.Context,
	record domain.AdminMediaAssetRecord,
) (*domain.AdminMediaAssetRecord, error) {
	if stub.replaceMediaAsset == nil {
		return nil, nil
	}
	return stub.replaceMediaAsset(ctx, record)
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

func TestReplaceAdminMediaAssetReplacesUploadedAsset(t *testing.T) {
	originalRepository := adminMediaAssetRepository
	t.Cleanup(func() {
		adminMediaAssetRepository = originalRepository
	})

	replacedRecord := domain.AdminMediaAssetRecord{}
	adminMediaAssetRepository = adminMediaAssetStubRepository{
		findMediaAssetByID: func(_ context.Context, id string) (*domain.AdminMediaAssetRecord, error) {
			if id != "asset-9" {
				t.Fatalf("unexpected id %q", id)
			}
			return &domain.AdminMediaAssetRecord{
				ID:          "asset-9",
				Name:        "old.webp",
				ContentType: "image/webp",
				Digest:      "old-digest",
				SizeBytes:   10,
				Width:       10,
				Height:      10,
				Data:        []byte("old"),
				CreatedBy:   "admin-1",
				CreatedAt:   time.Date(2026, 1, 10, 12, 0, 0, 0, time.UTC),
				UpdatedAt:   time.Date(2026, 1, 10, 12, 0, 0, 0, time.UTC),
			}, nil
		},
		replaceMediaAsset: func(_ context.Context, record domain.AdminMediaAssetRecord) (*domain.AdminMediaAssetRecord, error) {
			replacedRecord = record
			return &record, nil
		},
		countMediaAssetUsage: func(_ context.Context, value string) (int, error) {
			if value != "/api/media/asset-9" {
				t.Fatalf("unexpected usage value %q", value)
			}
			return 3, nil
		},
	}

	item, err := ReplaceAdminMediaAsset(context.Background(), &domain.AdminUser{ID: "admin-1"}, "asset-9", domain.AdminMediaUploadInput{
		FileName: "new-image.png",
		DataURL:  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR42mP4z8AAAAMBAQDJ/pLvAAAAAElFTkSuQmCC",
	})
	if err != nil {
		t.Fatalf("expected replace to succeed, got %v", err)
	}
	if item == nil {
		t.Fatal("expected item to be returned")
	}
	if item.ID != "asset-9" {
		t.Fatalf("expected same asset id, got %q", item.ID)
	}
	if item.Name != "new-image.png" {
		t.Fatalf("expected normalized name, got %q", item.Name)
	}
	if item.UsageCount != 3 {
		t.Fatalf("expected usage count 3, got %d", item.UsageCount)
	}
	if replacedRecord.ID != "asset-9" {
		t.Fatalf("expected replaced record id asset-9, got %q", replacedRecord.ID)
	}
	if replacedRecord.Name != "new-image.png" {
		t.Fatalf("expected replaced record name new-image.png, got %q", replacedRecord.Name)
	}
	if replacedRecord.Digest == "" || replacedRecord.Digest == "old-digest" {
		t.Fatalf("expected digest to be refreshed, got %q", replacedRecord.Digest)
	}
	if replacedRecord.Width != 1 || replacedRecord.Height != 1 {
		t.Fatalf("expected dimensions 1x1, got %dx%d", replacedRecord.Width, replacedRecord.Height)
	}
	if replacedRecord.SizeBytes <= 0 {
		t.Fatalf("expected positive size, got %d", replacedRecord.SizeBytes)
	}
	if replacedRecord.CreatedAt.IsZero() || replacedRecord.CreatedBy != "admin-1" {
		t.Fatalf("expected original creation metadata to be preserved, got %+v", replacedRecord)
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
