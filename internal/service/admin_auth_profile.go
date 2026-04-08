package service

import (
	"bytes"
	"context"
	"crypto/sha1"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"fmt"
	"image"
	"image/color"
	"image/jpeg"
	"image/png"
	"net/url"
	"strconv"
	"strings"
	"time"

	chaiwebp "github.com/chai2010/webp"

	"suaybsimsek.com/blog-api/internal/domain"
	"suaybsimsek.com/blog-api/internal/repository"
	"suaybsimsek.com/blog-api/pkg/apperrors"

	xdraw "golang.org/x/image/draw"
	_ "golang.org/x/image/webp" // Register WebP decoder.
)

func ChangeAdminUsername(ctx context.Context, adminUser *domain.AdminUser, newUsername string) (*domain.AdminUser, error) {
	if err := requireAdminAuthentication(adminUser); err != nil {
		return nil, err
	}

	userRecord, err := loadAdminUserRecord(ctx, adminUser.ID)
	if err != nil {
		return nil, err
	}

	resolvedUsername := strings.TrimSpace(newUsername)
	if len(resolvedUsername) < minAdminUsernameLength || len(resolvedUsername) > maxAdminUsernameLength {
		return nil, apperrors.BadRequest("username must be between 3 and 32 characters")
	}
	if !adminUsernamePattern.MatchString(resolvedUsername) {
		return nil, apperrors.BadRequest("username can include letters, numbers, dot, underscore, and dash only")
	}
	if strings.EqualFold(strings.TrimSpace(userRecord.Username), resolvedUsername) {
		return nil, apperrors.BadRequest("new username must be different from current username")
	}

	if err := adminUsersRepository.UpdateUsernameByID(ctx, userRecord.ID, resolvedUsername); err != nil {
		if errors.Is(err, repository.ErrAdminUsernameAlreadyExists) {
			return nil, apperrors.BadRequest("username is already in use")
		}
		if errors.Is(err, repository.ErrAdminUserNotFound) {
			return nil, apperrors.Unauthorized(adminAuthRequiredMessage)
		}
		return nil, apperrors.Internal("failed to update admin username", err)
	}

	return reloadAdminUser(ctx, userRecord.ID)
}

func ChangeAdminName(ctx context.Context, adminUser *domain.AdminUser, name string) (*domain.AdminUser, error) {
	if err := requireAdminAuthentication(adminUser); err != nil {
		return nil, err
	}

	userRecord, err := loadAdminUserRecord(ctx, adminUser.ID)
	if err != nil {
		return nil, err
	}

	resolvedName := strings.TrimSpace(name)
	if len(resolvedName) < minAdminNameLength || len(resolvedName) > maxAdminNameLength {
		return nil, apperrors.BadRequest("name must be between 2 and 80 characters")
	}

	if err := adminUsersRepository.UpdateNameByID(ctx, userRecord.ID, resolvedName); err != nil {
		if errors.Is(err, repository.ErrAdminUserNotFound) {
			return nil, apperrors.Unauthorized(adminAuthRequiredMessage)
		}
		return nil, apperrors.Internal("failed to update admin name", err)
	}

	return reloadAdminUser(ctx, userRecord.ID)
}

func ChangeAdminAvatar(ctx context.Context, adminUser *domain.AdminUser, avatarURL *string) (*domain.AdminUser, error) { // NOSONAR
	if err := requireAdminAuthentication(adminUser); err != nil {
		return nil, err
	}

	userRecord, err := loadAdminUserRecord(ctx, adminUser.ID)
	if err != nil {
		return nil, err
	}

	resolvedAvatarURL := ""
	if avatarURL != nil {
		resolvedAvatarURL = strings.TrimSpace(*avatarURL)
	}

	if resolvedAvatarURL == "" {
		if err := adminAvatarRepository.DeleteByUserID(ctx, userRecord.ID); err != nil {
			return nil, apperrors.Internal("failed to delete admin avatar", err)
		}

		if err := adminUsersRepository.UpdateAvatarByID(ctx, userRecord.ID, "", "", 0); err != nil {
			if errors.Is(err, repository.ErrAdminUserNotFound) {
				return nil, apperrors.Unauthorized(adminAuthRequiredMessage)
			}
			return nil, apperrors.Internal("failed to update admin avatar", err)
		}

		return reloadAdminUser(ctx, userRecord.ID)
	}

	decodedAvatar, err := decodeAdminAvatarDataURL(resolvedAvatarURL)
	if err != nil {
		return nil, err
	}

	if _, err := decodeAdminAvatarImage(decodedAvatar.Data); err != nil {
		return nil, err
	}

	avatarDigest := hashAdminAvatarPayload(decodedAvatar.Data)
	nextAvatarVersion := userRecord.AvatarVersion + 1
	if nextAvatarVersion <= 0 {
		nextAvatarVersion = 1
	}

	if err := adminAvatarRepository.UpsertByUserID(ctx, domain.AdminAvatarRecord{
		UserID:    userRecord.ID,
		Digest:    avatarDigest,
		Version:   nextAvatarVersion,
		UpdatedAt: time.Now().UTC(),
		Source: domain.AdminAvatarSource{
			ContentType: decodedAvatar.ContentType,
			Data:        append([]byte(nil), decodedAvatar.Data...),
		},
		Variants: []domain.AdminAvatarVariant{},
	}); err != nil {
		return nil, apperrors.Internal("failed to persist admin avatar", err)
	}

	if err := adminUsersRepository.UpdateAvatarByID(
		ctx,
		userRecord.ID,
		buildAdminAvatarURL(userRecord.ID, avatarDigest, nextAvatarVersion, adminAvatarDefaultSize),
		avatarDigest,
		nextAvatarVersion,
	); err != nil {
		if errors.Is(err, repository.ErrAdminUserNotFound) {
			return nil, apperrors.Unauthorized(adminAuthRequiredMessage)
		}
		return nil, apperrors.Internal("failed to update admin avatar", err)
	}

	return reloadAdminUser(ctx, userRecord.ID)
}

func DeleteAdminAccount(ctx context.Context, adminUser *domain.AdminUser, currentPassword string) error {
	if err := requireAdminAuthentication(adminUser); err != nil {
		return err
	}
	if strings.TrimSpace(currentPassword) == "" {
		return apperrors.BadRequest("current password is required")
	}

	userRecord, err := loadAdminUserRecord(ctx, adminUser.ID)
	if err != nil {
		return err
	}

	if err := verifyAdminPassword(userRecord, currentPassword); err != nil {
		return apperrors.BadRequest("current password is incorrect")
	}

	if err := adminUsersRepository.DisableByID(ctx, userRecord.ID); err != nil {
		if errors.Is(err, repository.ErrAdminUserNotFound) {
			return apperrors.Unauthorized(adminAuthRequiredMessage)
		}
		return apperrors.Internal("failed to disable admin account", err)
	}

	if err := adminRefreshTokensRepository.RevokeAllByUserID(ctx, userRecord.ID, time.Now().UTC()); err != nil {
		return toAdminSessionError(err)
	}

	return nil
}

type decodedAdminAvatarPayload struct {
	ContentType string
	Data        []byte
}

func decodeAdminAvatarDataURL(value string) (*decodedAdminAvatarPayload, error) {
	if strings.TrimSpace(value) == "" {
		return nil, apperrors.BadRequest(adminAvatarImageRequiredMessage)
	}

	commaIndex := strings.IndexByte(value, ',')
	if commaIndex <= 0 || commaIndex == len(value)-1 {
		return nil, apperrors.BadRequest(adminAvatarBase64InvalidMessage)
	}

	mediaHeader := strings.ToLower(strings.TrimSpace(value[:commaIndex]))
	contentType := ""
	switch mediaHeader {
	case "data:image/png;base64":
		contentType = adminAvatarContentTypePNG
	case "data:image/jpeg;base64", "data:image/jpg;base64":
		contentType = adminAvatarContentTypeJPEG
	case "data:image/webp;base64":
		contentType = adminAvatarContentTypeWEBP
	default:
		return nil, apperrors.BadRequest("avatar format must be png, jpeg, jpg, or webp")
	}

	encodedPayload := strings.TrimSpace(value[commaIndex+1:])
	decodedPayload, err := base64.StdEncoding.DecodeString(encodedPayload)
	if err != nil {
		return nil, apperrors.BadRequest(adminAvatarBase64InvalidMessage)
	}
	if len(decodedPayload) == 0 {
		return nil, apperrors.BadRequest(adminAvatarImageRequiredMessage)
	}
	if len(decodedPayload) > maxAdminAvatarBytes {
		return nil, apperrors.BadRequest("avatar image must be 2MB or smaller")
	}

	return &decodedAdminAvatarPayload{
		ContentType: contentType,
		Data:        decodedPayload,
	}, nil
}

func decodeAdminAvatarImage(decodedPayload []byte) (image.Image, error) {
	if len(decodedPayload) == 0 {
		return nil, apperrors.BadRequest(adminAvatarImageRequiredMessage)
	}

	sourceImage, _, err := image.Decode(bytes.NewReader(decodedPayload))
	if err != nil {
		return nil, apperrors.BadRequest(adminAvatarBase64InvalidMessage)
	}

	return sourceImage, nil
}

func buildAdminAvatarVariant(
	sourceImage image.Image,
	size int,
	sourceContentType string,
) (domain.AdminAvatarVariant, error) {
	requestedSize := normalizeAdminAvatarSize(size)
	targetContentType := normalizeAdminAvatarContentType(sourceContentType)

	destinationBounds := image.Rect(0, 0, requestedSize, requestedSize)
	destinationImage := image.NewRGBA(destinationBounds)
	if targetContentType == adminAvatarContentTypeJPEG {
		xdraw.Draw(destinationImage, destinationBounds, image.NewUniform(color.White), image.Point{}, xdraw.Src)
	}
	xdraw.CatmullRom.Scale(destinationImage, destinationBounds, sourceImage, sourceImage.Bounds(), xdraw.Over, nil)

	buffer := bytes.NewBuffer(make([]byte, 0, requestedSize*requestedSize))
	if err := encodeAdminAvatarImage(buffer, destinationImage, targetContentType); err != nil {
		return domain.AdminAvatarVariant{}, apperrors.Internal("failed to encode admin avatar", err)
	}

	if buffer.Len() == 0 {
		return domain.AdminAvatarVariant{}, apperrors.Internal("failed to encode admin avatar", nil)
	}

	return domain.AdminAvatarVariant{
		Size:        requestedSize,
		ContentType: targetContentType,
		Data:        append([]byte(nil), buffer.Bytes()...),
	}, nil
}

func encodeAdminAvatarImage(
	buffer *bytes.Buffer,
	destinationImage *image.RGBA,
	contentType string,
) error {
	switch contentType {
	case adminAvatarContentTypePNG:
		encoder := png.Encoder{CompressionLevel: png.DefaultCompression}
		return encoder.Encode(buffer, destinationImage)
	case adminAvatarContentTypeWEBP:
		return chaiwebp.Encode(buffer, destinationImage, &chaiwebp.Options{
			Lossless: false,
			Quality:  90,
		})
	default:
		return jpeg.Encode(buffer, destinationImage, &jpeg.Options{Quality: 90})
	}
}

func upsertAdminAvatarVariant(
	variants []domain.AdminAvatarVariant,
	variant domain.AdminAvatarVariant,
) []domain.AdminAvatarVariant {
	if variant.Size <= 0 || strings.TrimSpace(variant.ContentType) == "" || len(variant.Data) == 0 {
		return variants
	}

	result := make([]domain.AdminAvatarVariant, 0, len(variants)+1)
	replaced := false
	for _, existing := range variants {
		if existing.Size == variant.Size {
			if !replaced {
				result = append(result, variant)
				replaced = true
			}
			continue
		}
		if existing.Size <= 0 || strings.TrimSpace(existing.ContentType) == "" || len(existing.Data) == 0 {
			continue
		}
		result = append(result, existing)
	}
	if !replaced {
		result = append(result, variant)
	}

	return result
}

func hashAdminAvatarPayload(payload []byte) string {
	sum := sha1.Sum(payload)
	return hex.EncodeToString(sum[:])
}

func buildAdminAvatarURL(userID, digest string, version int64, size int) string {
	resolvedUserID := strings.TrimSpace(userID)
	resolvedDigest := strings.TrimSpace(digest)
	if resolvedUserID == "" || resolvedDigest == "" || version <= 0 {
		return ""
	}

	requestedSize := normalizeAdminAvatarSize(size)

	query := url.Values{}
	query.Set("id", resolvedUserID)
	query.Set("s", strconv.Itoa(requestedSize))
	query.Set("u", resolvedDigest)
	query.Set("v", strconv.FormatInt(version, 10))

	return "/api/admin-avatar?" + query.Encode()
}

func normalizeAdminAvatarSize(size int) int {
	if size <= 0 {
		return adminAvatarDefaultSize
	}
	if size < minAdminAvatarSize {
		return minAdminAvatarSize
	}
	if size > maxAdminAvatarSize {
		return maxAdminAvatarSize
	}
	return size
}

func normalizeAdminAvatarContentType(contentType string) string {
	switch strings.TrimSpace(strings.ToLower(contentType)) {
	case adminAvatarContentTypePNG:
		return adminAvatarContentTypePNG
	case adminAvatarContentTypeWEBP:
		return adminAvatarContentTypeWEBP
	default:
		return adminAvatarContentTypeJPEG
	}
}

type AdminAvatarAsset struct {
	ContentType string
	Data        []byte
	ETag        string
}

func ResolveAdminAvatarAsset( // NOSONAR
	ctx context.Context,
	userID string,
	size int,
	digest string,
	version int64,
) (*AdminAvatarAsset, error) {
	resolvedUserID := strings.TrimSpace(userID)
	if resolvedUserID == "" {
		return nil, apperrors.BadRequest("avatar user is required")
	}

	userRecord, err := adminUsersRepository.FindByID(ctx, resolvedUserID)
	if err != nil {
		return nil, apperrors.Internal(adminLoadAdminUserMessage, err)
	}
	if userRecord == nil {
		return nil, apperrors.New("NOT_FOUND", adminAvatarNotFoundMessage, 404, nil)
	}

	currentDigest := strings.TrimSpace(userRecord.AvatarDigest)
	if currentDigest == "" || userRecord.AvatarVersion <= 0 {
		return nil, apperrors.New("NOT_FOUND", adminAvatarNotFoundMessage, 404, nil)
	}

	resolvedDigest := strings.TrimSpace(digest)
	if resolvedDigest == "" || version <= 0 {
		return nil, apperrors.New("NOT_FOUND", adminAvatarNotFoundMessage, 404, nil)
	}
	if !strings.EqualFold(resolvedDigest, currentDigest) {
		return nil, apperrors.New("NOT_FOUND", adminAvatarNotFoundMessage, 404, nil)
	}
	if version != userRecord.AvatarVersion {
		return nil, apperrors.New("NOT_FOUND", adminAvatarNotFoundMessage, 404, nil)
	}

	avatarRecord, err := adminAvatarRepository.FindByUserID(ctx, resolvedUserID)
	if err != nil {
		return nil, apperrors.Internal("failed to load avatar asset", err)
	}
	if avatarRecord == nil {
		return nil, apperrors.New("NOT_FOUND", adminAvatarNotFoundMessage, 404, nil)
	}
	if strings.TrimSpace(avatarRecord.Digest) != currentDigest || avatarRecord.Version != userRecord.AvatarVersion {
		return nil, apperrors.New("NOT_FOUND", adminAvatarNotFoundMessage, 404, nil)
	}

	requestedSize := normalizeAdminAvatarSize(size)
	var chosenVariant *domain.AdminAvatarVariant
	for index := range avatarRecord.Variants {
		if avatarRecord.Variants[index].Size == requestedSize {
			chosenVariant = &avatarRecord.Variants[index]
			break
		}
	}
	if chosenVariant == nil || len(chosenVariant.Data) == 0 || strings.TrimSpace(chosenVariant.ContentType) == "" {
		sourceImage, err := decodeAdminAvatarImage(avatarRecord.Source.Data)
		if err != nil {
			return nil, apperrors.Internal("failed to decode avatar source", err)
		}

		generatedVariant, err := buildAdminAvatarVariant(
			sourceImage,
			requestedSize,
			avatarRecord.Source.ContentType,
		)
		if err != nil {
			return nil, err
		}

		avatarRecord.Variants = upsertAdminAvatarVariant(avatarRecord.Variants, generatedVariant)
		avatarRecord.UpdatedAt = time.Now().UTC()
		if err := adminAvatarRepository.UpsertByUserID(ctx, *avatarRecord); err != nil {
			return nil, apperrors.Internal("failed to cache avatar size", err)
		}

		chosenVariant = &generatedVariant
	}

	resolvedETag := fmt.Sprintf(
		"\"admin-avatar:%s:%d:%s:%d\"",
		resolvedUserID,
		requestedSize,
		currentDigest,
		userRecord.AvatarVersion,
	)

	return &AdminAvatarAsset{
		ContentType: strings.TrimSpace(chosenVariant.ContentType),
		Data:        append([]byte(nil), chosenVariant.Data...),
		ETag:        resolvedETag,
	}, nil
}
