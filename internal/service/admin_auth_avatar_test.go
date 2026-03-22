package service

import (
	"bytes"
	"context"
	"encoding/base64"
	"image"
	"image/color"
	"image/png"
	"strings"
	"testing"
	"time"

	"suaybsimsek.com/blog-api/internal/domain"
	"suaybsimsek.com/blog-api/internal/repository"
)

type adminAuthAvatarStubRepository struct {
	record       *domain.AdminAvatarRecord
	upserted     *domain.AdminAvatarRecord
	deleteUserID string
}

func (stub *adminAuthAvatarStubRepository) UpsertByUserID(_ context.Context, record domain.AdminAvatarRecord) error {
	cloned := record
	cloned.Source.Data = append([]byte(nil), record.Source.Data...)
	cloned.Variants = append([]domain.AdminAvatarVariant(nil), record.Variants...)
	stub.record = &cloned
	stub.upserted = &cloned
	return nil
}

func (stub *adminAuthAvatarStubRepository) FindByUserID(_ context.Context, userID string) (*domain.AdminAvatarRecord, error) {
	if stub.record == nil || stub.record.UserID != userID {
		return nil, nil
	}

	cloned := *stub.record
	cloned.Source.Data = append([]byte(nil), stub.record.Source.Data...)
	cloned.Variants = append([]domain.AdminAvatarVariant(nil), stub.record.Variants...)
	return &cloned, nil
}

func (stub *adminAuthAvatarStubRepository) DeleteByUserID(_ context.Context, userID string) error {
	stub.deleteUserID = userID
	stub.record = nil
	return nil
}

func makePNGDataURL(t *testing.T) string {
	t.Helper()

	buffer := bytes.NewBuffer(nil)
	source := image.NewRGBA(image.Rect(0, 0, 2, 2))
	source.Set(0, 0, color.RGBA{R: 255, A: 255})
	source.Set(1, 0, color.RGBA{G: 255, A: 255})
	source.Set(0, 1, color.RGBA{B: 255, A: 255})
	source.Set(1, 1, color.RGBA{R: 255, G: 255, A: 255})
	if err := png.Encode(buffer, source); err != nil {
		t.Fatalf("png.Encode returned error: %v", err)
	}

	return "data:image/png;base64," + base64.StdEncoding.EncodeToString(buffer.Bytes())
}

func TestChangeAdminAvatarStoresAvatarAndUpdatesUser(t *testing.T) {
	previousUsersRepo := adminUsersRepository
	previousAvatarRepo := adminAvatarRepository
	t.Cleanup(func() {
		adminUsersRepository = previousUsersRepo
		adminAvatarRepository = previousAvatarRepo
	})

	user := &domain.AdminUserRecord{
		AdminUser: domain.AdminUser{
			ID:            "admin-1",
			Email:         "admin@example.com",
			AvatarVersion: 2,
		},
	}

	avatarURL := ""
	avatarDigest := ""
	avatarVersion := int64(0)
	adminUsersRepository = &adminAuthSessionStubUserRepository{
		adminAuthEmailChangeStubUserRepository: newAdminAuthEmailChangeStubUserRepository(user),
		updateAvatar: func(_ context.Context, id, nextURL, nextDigest string, nextVersion int64) error {
			if id != "admin-1" {
				t.Fatalf("UpdateAvatarByID id = %q", id)
			}
			user.AvatarURL = nextURL
			user.AvatarDigest = nextDigest
			user.AvatarVersion = nextVersion
			avatarURL = nextURL
			avatarDigest = nextDigest
			avatarVersion = nextVersion
			return nil
		},
	}

	avatarRepo := &adminAuthAvatarStubRepository{}
	adminAvatarRepository = avatarRepo

	input := makePNGDataURL(t)
	updated, err := ChangeAdminAvatar(context.Background(), &domain.AdminUser{ID: "admin-1"}, &input)
	if err != nil {
		t.Fatalf("ChangeAdminAvatar returned error: %v", err)
	}
	if updated == nil || updated.AvatarVersion != 3 {
		t.Fatalf("unexpected updated user: %#v", updated)
	}
	if avatarRepo.upserted == nil || avatarRepo.upserted.UserID != "admin-1" {
		t.Fatalf("expected avatar record upsert, got %#v", avatarRepo.upserted)
	}
	if avatarDigest == "" || avatarVersion != 3 || !strings.Contains(avatarURL, "/api/admin-avatar?") {
		t.Fatalf("unexpected avatar metadata: %q %q %d", avatarURL, avatarDigest, avatarVersion)
	}
}

func TestResolveAdminAvatarAssetGeneratesMissingVariantAndCachesIt(t *testing.T) {
	previousUsersRepo := adminUsersRepository
	previousAvatarRepo := adminAvatarRepository
	t.Cleanup(func() {
		adminUsersRepository = previousUsersRepo
		adminAvatarRepository = previousAvatarRepo
	})

	payload, err := decodeAdminAvatarDataURL(makePNGDataURL(t))
	if err != nil {
		t.Fatalf("decodeAdminAvatarDataURL returned error: %v", err)
	}

	digest := hashAdminAvatarPayload(payload.Data)
	adminUsersRepository = &adminAuthSessionStubUserRepository{
		adminAuthEmailChangeStubUserRepository: newAdminAuthEmailChangeStubUserRepository(&domain.AdminUserRecord{
			AdminUser: domain.AdminUser{
				ID:            "admin-1",
				Email:         "admin@example.com",
				AvatarDigest:  digest,
				AvatarVersion: 4,
			},
		}),
	}

	avatarRepo := &adminAuthAvatarStubRepository{
		record: &domain.AdminAvatarRecord{
			UserID:  "admin-1",
			Digest:  digest,
			Version: 4,
			Source: domain.AdminAvatarSource{
				ContentType: payload.ContentType,
				Data:        payload.Data,
			},
			UpdatedAt: time.Now().UTC(),
		},
	}
	adminAvatarRepository = avatarRepo

	asset, err := ResolveAdminAvatarAsset(context.Background(), "admin-1", 64, digest, 4)
	if err != nil {
		t.Fatalf("ResolveAdminAvatarAsset returned error: %v", err)
	}
	if asset == nil || asset.ContentType == "" || len(asset.Data) == 0 || asset.ETag == "" {
		t.Fatalf("unexpected asset: %#v", asset)
	}
	if avatarRepo.upserted == nil || len(avatarRepo.upserted.Variants) != 1 || avatarRepo.upserted.Variants[0].Size != 64 {
		t.Fatalf("expected generated variant cache, got %#v", avatarRepo.upserted)
	}
}

func TestChangeAdminAvatarClearsExistingAvatar(t *testing.T) {
	previousUsersRepo := adminUsersRepository
	previousAvatarRepo := adminAvatarRepository
	t.Cleanup(func() {
		adminUsersRepository = previousUsersRepo
		adminAvatarRepository = previousAvatarRepo
	})

	user := &domain.AdminUserRecord{
		AdminUser: domain.AdminUser{
			ID:            "admin-1",
			Email:         "admin@example.com",
			AvatarDigest:  "digest",
			AvatarVersion: 2,
		},
	}
	adminUsersRepository = &adminAuthSessionStubUserRepository{
		adminAuthEmailChangeStubUserRepository: newAdminAuthEmailChangeStubUserRepository(user),
		updateAvatar: func(_ context.Context, id, nextURL, nextDigest string, nextVersion int64) error {
			user.AvatarURL = nextURL
			user.AvatarDigest = nextDigest
			user.AvatarVersion = nextVersion
			return nil
		},
	}

	avatarRepo := &adminAuthAvatarStubRepository{}
	adminAvatarRepository = avatarRepo

	empty := "   "
	updated, err := ChangeAdminAvatar(context.Background(), &domain.AdminUser{ID: "admin-1"}, &empty)
	if err != nil {
		t.Fatalf("ChangeAdminAvatar returned error: %v", err)
	}
	if updated == nil || updated.AvatarDigest != "" || updated.AvatarVersion != 0 {
		t.Fatalf("unexpected updated user: %#v", updated)
	}
	if avatarRepo.deleteUserID != "admin-1" {
		t.Fatalf("expected avatar delete for admin-1, got %q", avatarRepo.deleteUserID)
	}
}

func TestAdminAvatarHelpersHandleValidationAndReplacement(t *testing.T) {
	if _, err := decodeAdminAvatarDataURL(""); err == nil {
		t.Fatal("expected empty avatar data error")
	}
	if _, err := decodeAdminAvatarDataURL("data:text/plain;base64,Zm9v"); err == nil {
		t.Fatal("expected unsupported avatar format error")
	}
	if _, err := decodeAdminAvatarImage(nil); err == nil {
		t.Fatal("expected empty decoded payload error")
	}

	if got := normalizeAdminAvatarSize(0); got != adminAvatarDefaultSize {
		t.Fatalf("normalizeAdminAvatarSize(0) = %d", got)
	}
	if got := normalizeAdminAvatarSize(1); got != minAdminAvatarSize {
		t.Fatalf("normalizeAdminAvatarSize(1) = %d", got)
	}
	if got := normalizeAdminAvatarSize(maxAdminAvatarSize + 1); got != maxAdminAvatarSize {
		t.Fatalf("normalizeAdminAvatarSize(max+1) = %d", got)
	}
	if got := normalizeAdminAvatarContentType("image/webp"); got != "image/webp" {
		t.Fatalf("normalizeAdminAvatarContentType(webp) = %q", got)
	}
	if got := normalizeAdminAvatarContentType("unknown"); got != "image/jpeg" {
		t.Fatalf("normalizeAdminAvatarContentType(default) = %q", got)
	}

	variants := upsertAdminAvatarVariant(nil, domain.AdminAvatarVariant{Size: 64, ContentType: "image/png", Data: []byte("a")})
	if len(variants) != 1 || variants[0].Size != 64 {
		t.Fatalf("unexpected inserted variants: %#v", variants)
	}
	variants = upsertAdminAvatarVariant(variants, domain.AdminAvatarVariant{Size: 64, ContentType: "image/webp", Data: []byte("b")})
	if len(variants) != 1 || variants[0].ContentType != "image/webp" {
		t.Fatalf("expected replacement variant, got %#v", variants)
	}
	variants = upsertAdminAvatarVariant(variants, domain.AdminAvatarVariant{})
	if len(variants) != 1 {
		t.Fatalf("expected invalid variant to be ignored, got %#v", variants)
	}
}

func TestAdminAvatarAndPasswordHelpersHandleErrors(t *testing.T) {
	if err := verifyAdminPassword(nil, "password"); err == nil {
		t.Fatal("expected missing admin user error")
	}
	if err := verifyAdminPassword(&domain.AdminUserRecord{}, "password"); err == nil {
		t.Fatal("expected missing hash error")
	}

	previousUsersRepo := adminUsersRepository
	previousAvatarRepo := adminAvatarRepository
	t.Cleanup(func() {
		adminUsersRepository = previousUsersRepo
		adminAvatarRepository = previousAvatarRepo
	})

	user := &domain.AdminUserRecord{
		AdminUser: domain.AdminUser{
			ID:            "admin-1",
			Email:         "admin@example.com",
			AvatarDigest:  "digest",
			AvatarVersion: 2,
		},
	}
	adminUsersRepository = &adminAuthSessionStubUserRepository{
		adminAuthEmailChangeStubUserRepository: newAdminAuthEmailChangeStubUserRepository(user),
		updateAvatar: func(_ context.Context, _, _, _ string, _ int64) error {
			return repository.ErrAdminUserNotFound
		},
	}
	adminAvatarRepository = &adminAuthAvatarStubRepository{}

	empty := " "
	if _, err := ChangeAdminAvatar(context.Background(), &domain.AdminUser{ID: "admin-1"}, &empty); err == nil {
		t.Fatal("expected avatar update auth/not found error")
	}

	if _, err := ChangeAdminAvatar(context.Background(), &domain.AdminUser{ID: "admin-1"}, strPtr("data:image/png;base64,invalid")); err == nil {
		t.Fatal("expected invalid avatar payload error")
	}
}

func TestResolveAdminAvatarAssetRejectsMissingOrMismatchedAvatar(t *testing.T) {
	previousUsersRepo := adminUsersRepository
	previousAvatarRepo := adminAvatarRepository
	t.Cleanup(func() {
		adminUsersRepository = previousUsersRepo
		adminAvatarRepository = previousAvatarRepo
	})

	adminUsersRepository = &adminAuthSessionStubUserRepository{
		adminAuthEmailChangeStubUserRepository: newAdminAuthEmailChangeStubUserRepository(&domain.AdminUserRecord{
			AdminUser: domain.AdminUser{
				ID:            "admin-1",
				Email:         "admin@example.com",
				AvatarDigest:  "digest",
				AvatarVersion: 2,
			},
		}),
	}
	adminAvatarRepository = &adminAuthAvatarStubRepository{
		record: &domain.AdminAvatarRecord{
			UserID:  "admin-1",
			Digest:  "other-digest",
			Version: 2,
			Source: domain.AdminAvatarSource{
				ContentType: "image/png",
				Data:        []byte("not-an-image"),
			},
		},
	}

	if _, err := ResolveAdminAvatarAsset(context.Background(), "", 64, "digest", 2); err == nil {
		t.Fatal("expected user id required error")
	}
	if _, err := ResolveAdminAvatarAsset(context.Background(), "admin-1", 64, "", 2); err == nil {
		t.Fatal("expected missing digest not found error")
	}
	if _, err := ResolveAdminAvatarAsset(context.Background(), "admin-1", 64, "digest", 3); err == nil {
		t.Fatal("expected version mismatch not found error")
	}
}

func TestAdminAvatarEncodingVariantsCoverFormats(t *testing.T) {
	source := image.NewRGBA(image.Rect(0, 0, 4, 4))
	source.Set(0, 0, color.RGBA{R: 255, A: 255})
	source.Set(1, 0, color.RGBA{G: 255, A: 255})
	source.Set(0, 1, color.RGBA{B: 255, A: 255})

	pngVariant, err := buildAdminAvatarVariant(source, 32, "image/png")
	if err != nil {
		t.Fatalf("buildAdminAvatarVariant png error: %v", err)
	}
	if pngVariant.Size != 32 || pngVariant.ContentType != "image/png" || len(pngVariant.Data) == 0 {
		t.Fatalf("unexpected png variant: %#v", pngVariant)
	}

	jpegVariant, err := buildAdminAvatarVariant(source, 48, "image/jpeg")
	if err != nil {
		t.Fatalf("buildAdminAvatarVariant jpeg error: %v", err)
	}
	if jpegVariant.Size != 48 || jpegVariant.ContentType != "image/jpeg" || len(jpegVariant.Data) == 0 {
		t.Fatalf("unexpected jpeg variant: %#v", jpegVariant)
	}

	webpVariant, err := buildAdminAvatarVariant(source, 64, "image/webp")
	if err != nil {
		t.Fatalf("buildAdminAvatarVariant webp error: %v", err)
	}
	if webpVariant.Size != 64 || webpVariant.ContentType != "image/webp" || len(webpVariant.Data) == 0 {
		t.Fatalf("unexpected webp variant: %#v", webpVariant)
	}

	for _, contentType := range []string{"image/png", "image/jpeg", "image/webp"} {
		buffer := bytes.NewBuffer(nil)
		if err := encodeAdminAvatarImage(buffer, source, contentType); err != nil {
			t.Fatalf("encodeAdminAvatarImage(%q) error: %v", contentType, err)
		}
		if buffer.Len() == 0 {
			t.Fatalf("expected encoded bytes for %q", contentType)
		}
	}
}

func strPtr(value string) *string {
	return &value
}
