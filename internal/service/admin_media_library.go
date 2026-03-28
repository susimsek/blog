package service

import (
	"bytes"
	"context"
	"crypto/sha1"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"image"
	_ "image/jpeg" // Register JPEG decoder for image.DecodeConfig.
	_ "image/png"  // Register PNG decoder for image.DecodeConfig.
	"path/filepath"
	"strings"
	"time"

	"suaybsimsek.com/blog-api/internal/domain"
	"suaybsimsek.com/blog-api/internal/repository"
	"suaybsimsek.com/blog-api/pkg/apperrors"

	"go.mongodb.org/mongo-driver/bson/primitive"
	_ "golang.org/x/image/webp" // Register WebP decoder for image.DecodeConfig.
)

const (
	adminMediaLibraryDefaultPage = 1
	adminMediaLibraryDefaultSize = 12
	adminMediaLibraryMaxSize     = 48
	maxAdminMediaAssetBytes      = 5 * 1024 * 1024
	maxAdminMediaAssetNameLength = 180
)

var adminMediaAssetRepository repository.AdminMediaAssetRepository = repository.NewAdminMediaAssetRepository()

type AdminMediaAsset struct {
	ContentType string
	Data        []byte
	ETag        string
}

func ListAdminMediaLibrary(
	ctx context.Context,
	adminUser *domain.AdminUser,
	filter domain.AdminMediaLibraryFilter,
) (*domain.AdminMediaLibraryListPayload, error) {
	if err := requireAdminAuthentication(adminUser); err != nil {
		return nil, err
	}

	resolvedPage := adminMediaLibraryDefaultPage
	if filter.Page > 0 {
		resolvedPage = filter.Page
	}
	resolvedSize := adminMediaLibraryDefaultSize
	if filter.Size > 0 {
		resolvedSize = min(filter.Size, adminMediaLibraryMaxSize)
	}

	items, err := adminMediaAssetRepository.ListMediaLibraryItems(ctx, domain.AdminMediaLibraryFilter{
		Query: strings.TrimSpace(filter.Query),
		Kind:  strings.TrimSpace(strings.ToUpper(filter.Kind)),
	})
	if err != nil {
		return nil, toAdminMediaLibraryError(err, "failed to list admin media library")
	}
	if items == nil {
		items = []domain.AdminMediaLibraryItem{}
	}

	total := len(items)
	start := (resolvedPage - 1) * resolvedSize
	start = min(start, total)
	end := min(start+resolvedSize, total)

	return &domain.AdminMediaLibraryListPayload{
		Items: items[start:end],
		Total: total,
		Page:  resolvedPage,
		Size:  resolvedSize,
	}, nil
}

func UploadAdminMediaAsset(
	ctx context.Context,
	adminUser *domain.AdminUser,
	input domain.AdminMediaUploadInput,
) (*domain.AdminMediaLibraryItem, error) {
	if err := requireAdminAuthentication(adminUser); err != nil {
		return nil, err
	}

	payload, err := decodeAdminMediaDataURL(strings.TrimSpace(input.DataURL))
	if err != nil {
		return nil, err
	}
	name := normalizeAdminMediaAssetName(input.FileName)
	if name == "" {
		name = defaultAdminMediaAssetName(payload.ContentType)
	}
	digest := hashAdminMediaPayload(payload.Data)

	existing, err := adminMediaAssetRepository.FindMediaAssetByDigest(ctx, digest)
	if err != nil {
		return nil, toAdminMediaLibraryError(err, "failed to load admin media asset")
	}
	if existing != nil {
		item := mapAdminMediaLibraryItemFromAsset(*existing)
		return &item, nil
	}

	id := primitive.NewObjectID().Hex()
	now := time.Now().UTC()
	created, err := adminMediaAssetRepository.CreateMediaAsset(ctx, domain.AdminMediaAssetRecord{
		ID:          id,
		Name:        name,
		ContentType: payload.ContentType,
		Digest:      digest,
		SizeBytes:   len(payload.Data),
		Width:       payload.Width,
		Height:      payload.Height,
		Data:        payload.Data,
		CreatedBy:   strings.TrimSpace(adminUser.ID),
		CreatedAt:   now,
		UpdatedAt:   now,
	})
	if err != nil {
		return nil, toAdminMediaLibraryError(err, "failed to store admin media asset")
	}

	item := mapAdminMediaLibraryItemFromAsset(*created)
	return &item, nil
}

func DeleteAdminMediaAsset(ctx context.Context, adminUser *domain.AdminUser, id string) error {
	if err := requireAdminAuthentication(adminUser); err != nil {
		return err
	}

	resolvedID := strings.TrimSpace(id)
	if resolvedID == "" {
		return apperrors.BadRequest("media asset id is required")
	}

	record, err := adminMediaAssetRepository.FindMediaAssetByID(ctx, resolvedID)
	if err != nil {
		return toAdminMediaLibraryError(err, "failed to load admin media asset")
	}
	if record == nil {
		return apperrors.New("NOT_FOUND", "media asset not found", 404, nil)
	}

	usageCount, err := adminMediaAssetRepository.CountMediaAssetUsage(ctx, "/api/media/"+resolvedID)
	if err != nil {
		return toAdminMediaLibraryError(err, "failed to load media asset usage")
	}
	if usageCount > 0 {
		return apperrors.BadRequest("media asset is still used by posts")
	}

	deleted, err := adminMediaAssetRepository.DeleteMediaAssetByID(ctx, resolvedID)
	if err != nil {
		return toAdminMediaLibraryError(err, "failed to delete admin media asset")
	}
	if !deleted {
		return apperrors.New("NOT_FOUND", "media asset not found", 404, nil)
	}

	return nil
}

func ResolveAdminMediaAsset(ctx context.Context, id string) (*AdminMediaAsset, error) {
	resolvedID := strings.TrimSpace(id)
	if resolvedID == "" {
		return nil, apperrors.BadRequest("media asset id is required")
	}

	record, err := adminMediaAssetRepository.FindMediaAssetByID(ctx, resolvedID)
	if err != nil {
		return nil, toAdminMediaLibraryError(err, "failed to load admin media asset")
	}
	if record == nil || len(record.Data) == 0 || strings.TrimSpace(record.ContentType) == "" {
		return nil, apperrors.New("NOT_FOUND", "media asset not found", 404, nil)
	}

	return &AdminMediaAsset{
		ContentType: strings.TrimSpace(record.ContentType),
		Data:        append([]byte(nil), record.Data...),
		ETag:        `"` + strings.TrimSpace(record.Digest) + `"`,
	}, nil
}

type decodedAdminMediaPayload struct {
	ContentType string
	Data        []byte
	Width       int
	Height      int
}

func decodeAdminMediaDataURL(value string) (*decodedAdminMediaPayload, error) {
	resolved := strings.TrimSpace(value)
	if resolved == "" {
		return nil, apperrors.BadRequest("media asset image is required")
	}

	parts := strings.SplitN(resolved, ",", 2)
	if len(parts) != 2 {
		return nil, apperrors.BadRequest("media asset must be a valid base64 image")
	}

	header := strings.TrimSpace(strings.ToLower(parts[0]))
	contentType := ""
	switch header {
	case "data:image/png;base64":
		contentType = "image/png"
	case "data:image/jpeg;base64", "data:image/jpg;base64":
		contentType = "image/jpeg"
	case "data:image/webp;base64":
		contentType = "image/webp"
	default:
		return nil, apperrors.BadRequest("media asset must be a png, jpeg, or webp image")
	}

	decodedPayload, err := base64.StdEncoding.DecodeString(strings.TrimSpace(parts[1]))
	if err != nil {
		return nil, apperrors.BadRequest("media asset must be a valid base64 image")
	}
	if len(decodedPayload) == 0 {
		return nil, apperrors.BadRequest("media asset image is required")
	}
	if len(decodedPayload) > maxAdminMediaAssetBytes {
		return nil, apperrors.BadRequest("media asset image is too large")
	}

	config, _, err := image.DecodeConfig(bytes.NewReader(decodedPayload))
	if err != nil {
		return nil, apperrors.BadRequest("media asset must be a valid image")
	}
	if config.Width <= 0 || config.Height <= 0 {
		return nil, apperrors.BadRequest("media asset must be a valid image")
	}

	return &decodedAdminMediaPayload{
		ContentType: contentType,
		Data:        decodedPayload,
		Width:       config.Width,
		Height:      config.Height,
	}, nil
}

func normalizeAdminMediaAssetName(value string) string {
	resolved := strings.TrimSpace(filepath.Base(value))
	if resolved == "." || resolved == "/" {
		resolved = ""
	}
	if len(resolved) > maxAdminMediaAssetNameLength {
		resolved = resolved[:maxAdminMediaAssetNameLength]
	}
	return strings.TrimSpace(resolved)
}

func defaultAdminMediaAssetName(contentType string) string {
	switch strings.TrimSpace(strings.ToLower(contentType)) {
	case "image/png":
		return "media-image.png"
	case "image/jpeg":
		return "media-image.jpg"
	case "image/webp":
		return "media-image.webp"
	default:
		return "media-image"
	}
}

func hashAdminMediaPayload(payload []byte) string {
	sum := sha1.Sum(payload)
	return hex.EncodeToString(sum[:])
}

func mapAdminMediaLibraryItemFromAsset(record domain.AdminMediaAssetRecord) domain.AdminMediaLibraryItem {
	value := "/api/media/" + strings.TrimSpace(record.ID)
	return domain.AdminMediaLibraryItem{
		ID:          strings.TrimSpace(record.ID),
		Kind:        "UPLOADED",
		Name:        strings.TrimSpace(record.Name),
		Value:       value,
		PreviewURL:  value,
		ContentType: strings.TrimSpace(record.ContentType),
		Width:       record.Width,
		Height:      record.Height,
		SizeBytes:   record.SizeBytes,
		UsageCount:  0,
		CreatedAt:   record.CreatedAt,
		UpdatedAt:   record.UpdatedAt,
	}
}

func toAdminMediaLibraryError(err error, message string) error {
	switch {
	case errors.Is(err, repository.ErrAdminMediaAssetRepositoryUnavailable):
		return apperrors.ServiceUnavailable("admin media library is unavailable", err)
	default:
		return apperrors.Internal(message, err)
	}
}
