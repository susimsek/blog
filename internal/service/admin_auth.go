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
	"regexp"
	"strconv"
	"strings"
	"time"

	chaiwebp "github.com/chai2010/webp"

	appconfig "suaybsimsek.com/blog-api/internal/config"
	"suaybsimsek.com/blog-api/internal/domain"
	"suaybsimsek.com/blog-api/internal/repository"
	adminmailpkg "suaybsimsek.com/blog-api/pkg/adminmail"
	"suaybsimsek.com/blog-api/pkg/apperrors"
	"suaybsimsek.com/blog-api/pkg/httpauth"
	newsletterpkg "suaybsimsek.com/blog-api/pkg/newsletter"

	"golang.org/x/crypto/bcrypt"
	xdraw "golang.org/x/image/draw"
	_ "golang.org/x/image/webp" // Register WebP decoder.
)

type AdminAuthResponse struct {
	Success      bool
	User         *domain.AdminUser
	AccessToken  string
	RefreshToken string
	RememberMe   bool
	RefreshTTL   time.Duration
}

type AdminSessionMetadata struct {
	UserAgent   string
	RemoteIP    string
	CountryCode string
}

type AdminEmailChangeRequestResult struct {
	Success      bool
	PendingEmail string
	ExpiresAt    time.Time
}

type AdminEmailChangeConfirmResult struct {
	Status string
	Locale string
}

const (
	minAdminPasswordLength = 8
	maxActiveAdminSessions = 20
	minAdminUsernameLength = 3
	maxAdminUsernameLength = 32
	minAdminNameLength     = 2
	maxAdminNameLength     = 80
	maxAdminAvatarBytes    = 2 * 1024 * 1024
	minAdminAvatarSize     = 16
	maxAdminAvatarSize     = 1024
	adminAvatarDefaultSize = 256
	adminEmailChangeTTL    = time.Hour
)

var adminUsernamePattern = regexp.MustCompile(`^[A-Za-z0-9._-]+$`)

var (
	adminUsersRepository                    repository.AdminUserRepository         = repository.NewAdminUserRepository()
	adminRefreshTokensRepository            repository.AdminRefreshTokenRepository = repository.NewAdminRefreshTokenMongoRepository()
	adminAvatarRepository                   repository.AdminAvatarRepository       = repository.NewAdminAvatarRepository()
	sendAdminEmailChangeConfirmationEmailFn                                        = sendAdminEmailChangeConfirmationEmail
	sendAdminEmailChangeNoticeEmailFn                                              = sendAdminEmailChangeNoticeEmail
)

func LoginAdmin(
	ctx context.Context,
	email string,
	password string,
	rememberMe bool,
	metadata AdminSessionMetadata,
) (*AdminAuthResponse, error) {
	config := appconfig.ResolveAdminConfig()
	if strings.TrimSpace(config.JWTSecret) == "" {
		return nil, apperrors.Config("admin jwt is not configured", nil)
	}

	userRecord, err := adminUsersRepository.FindByEmail(ctx, strings.TrimSpace(strings.ToLower(email)))
	if err != nil {
		return nil, apperrors.Internal("failed to load admin user", err)
	}
	if userRecord == nil {
		return nil, apperrors.Unauthorized("invalid credentials")
	}
	if err := verifyAdminPassword(userRecord, password); err != nil {
		return nil, apperrors.Unauthorized("invalid credentials")
	}

	return issueAdminTokens(ctx, config, userRecord, "", rememberMe, metadata)
}

func RefreshAdminSession(ctx context.Context, token string, metadata AdminSessionMetadata) (*AdminAuthResponse, error) {
	config := appconfig.ResolveAdminConfig()
	if strings.TrimSpace(config.JWTSecret) == "" {
		return nil, apperrors.Config("admin jwt is not configured", nil)
	}

	claims, err := httpauth.VerifyHS256JWT(token, config.JWTSecret, "refresh", time.Now().UTC())
	if err != nil {
		return nil, apperrors.Unauthorized("invalid admin session")
	}
	if strings.TrimSpace(claims.ID) == "" {
		return nil, apperrors.Unauthorized("invalid admin session")
	}

	record, err := adminRefreshTokensRepository.FindActiveByToken(ctx, claims.ID, token, time.Now().UTC())
	if err != nil {
		return nil, toAdminSessionError(err)
	}
	if record == nil {
		return nil, apperrors.Unauthorized("invalid admin session")
	}

	resolvedUserID := strings.TrimSpace(record.UserID)
	if resolvedUserID == "" {
		return nil, apperrors.Unauthorized("invalid admin session")
	}

	userRecord, err := adminUsersRepository.FindByID(ctx, resolvedUserID)
	if err != nil {
		return nil, apperrors.Internal("failed to load admin user", err)
	}
	if userRecord == nil {
		return nil, apperrors.Unauthorized("invalid admin session")
	}
	if claims.PasswordVersion != userRecord.PasswordVersion {
		return nil, apperrors.Unauthorized("invalid admin session")
	}
	if strings.TrimSpace(record.UserID) != userRecord.ID {
		return nil, apperrors.Unauthorized("invalid admin session")
	}

	return issueAdminTokens(ctx, config, userRecord, claims.ID, record.Persistent, metadata)
}

func LogoutAdmin(ctx context.Context, token string) error {
	config := appconfig.ResolveAdminConfig()
	if strings.TrimSpace(config.JWTSecret) == "" || strings.TrimSpace(token) == "" {
		return nil
	}

	claims, err := httpauth.VerifyHS256JWT(token, config.JWTSecret, "refresh", time.Now().UTC())
	if err != nil {
		if errors.Is(err, httpauth.ErrInvalidJWT) || errors.Is(err, httpauth.ErrExpiredJWT) || errors.Is(err, httpauth.ErrUnsupportedJWT) {
			return nil
		}
		return toAdminSessionError(err)
	}
	if strings.TrimSpace(claims.ID) == "" {
		return nil
	}

	if err := adminRefreshTokensRepository.RevokeByJTI(ctx, claims.ID, time.Now().UTC()); err != nil {
		return toAdminSessionError(err)
	}

	return nil
}

func ChangeAdminPassword(
	ctx context.Context,
	adminUser *domain.AdminUser,
	currentPassword string,
	newPassword string,
	confirmPassword string,
) error {
	if adminUser == nil || strings.TrimSpace(adminUser.ID) == "" {
		return apperrors.Unauthorized("admin authentication required")
	}

	userRecord, err := adminUsersRepository.FindByID(ctx, adminUser.ID)
	if err != nil {
		return apperrors.Internal("failed to load admin user", err)
	}
	if userRecord == nil {
		return apperrors.Unauthorized("admin authentication required")
	}

	if err := verifyAdminPassword(userRecord, currentPassword); err != nil {
		return apperrors.BadRequest("current password is incorrect")
	}

	if len(newPassword) < minAdminPasswordLength {
		return apperrors.BadRequest("new password must be at least 8 characters")
	}
	if newPassword != confirmPassword {
		return apperrors.BadRequest("new password confirmation does not match")
	}
	if currentPassword == newPassword {
		return apperrors.BadRequest("new password must be different from current password")
	}

	passwordHashBytes, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return apperrors.Internal("failed to hash admin password", err)
	}

	if err := adminUsersRepository.UpdatePasswordHashByID(ctx, userRecord.ID, string(passwordHashBytes)); err != nil {
		if errors.Is(err, repository.ErrAdminUserNotFound) {
			return apperrors.Unauthorized("admin authentication required")
		}
		return apperrors.Internal("failed to update admin password", err)
	}

	if err := adminRefreshTokensRepository.RevokeAllByUserID(ctx, userRecord.ID, time.Now().UTC()); err != nil {
		return toAdminSessionError(err)
	}

	return nil
}

func ChangeAdminUsername(ctx context.Context, adminUser *domain.AdminUser, newUsername string) (*domain.AdminUser, error) {
	if adminUser == nil || strings.TrimSpace(adminUser.ID) == "" {
		return nil, apperrors.Unauthorized("admin authentication required")
	}

	userRecord, err := adminUsersRepository.FindByID(ctx, adminUser.ID)
	if err != nil {
		return nil, apperrors.Internal("failed to load admin user", err)
	}
	if userRecord == nil {
		return nil, apperrors.Unauthorized("admin authentication required")
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
			return nil, apperrors.Unauthorized("admin authentication required")
		}
		return nil, apperrors.Internal("failed to update admin username", err)
	}

	updatedUserRecord, err := adminUsersRepository.FindByID(ctx, userRecord.ID)
	if err != nil {
		return nil, apperrors.Internal("failed to load admin user", err)
	}
	if updatedUserRecord == nil {
		return nil, apperrors.Unauthorized("admin authentication required")
	}

	return &updatedUserRecord.AdminUser, nil
}

func RequestAdminEmailChange(
	ctx context.Context,
	adminUser *domain.AdminUser,
	newEmail string,
	currentPassword string,
	locale string,
) (*AdminEmailChangeRequestResult, error) {
	if adminUser == nil || strings.TrimSpace(adminUser.ID) == "" {
		return nil, apperrors.Unauthorized("admin authentication required")
	}
	if strings.TrimSpace(currentPassword) == "" {
		return nil, apperrors.BadRequest("current password is required")
	}

	userRecord, err := adminUsersRepository.FindByID(ctx, adminUser.ID)
	if err != nil {
		return nil, apperrors.Internal("failed to load admin user", err)
	}
	if userRecord == nil {
		return nil, apperrors.Unauthorized("admin authentication required")
	}
	if err := verifyAdminPassword(userRecord, currentPassword); err != nil {
		return nil, apperrors.BadRequest("current password is incorrect")
	}

	resolvedEmail, err := newsletterpkg.NormalizeSubscriberEmail(newEmail)
	if err != nil {
		return nil, apperrors.BadRequest("new email is invalid")
	}
	if strings.EqualFold(strings.TrimSpace(userRecord.Email), resolvedEmail) {
		return nil, apperrors.BadRequest("new email must be different from current email")
	}

	existingUser, err := adminUsersRepository.FindByEmail(ctx, resolvedEmail)
	if err != nil {
		return nil, apperrors.Internal("failed to validate admin email", err)
	}
	if existingUser != nil && existingUser.ID != userRecord.ID {
		return nil, apperrors.BadRequest("email is already in use")
	}

	siteURL, err := resolveSiteURLFn()
	if err != nil {
		return nil, apperrors.Config("admin email change site url is not configured", err)
	}

	mailCfg, err := resolveMailConfigFn()
	if err != nil {
		return nil, apperrors.Config("admin email change mail transport is not configured", err)
	}

	token, err := generateConfirmTokenFn()
	if err != nil {
		return nil, apperrors.Internal("failed to issue admin email change token", err)
	}

	now := nowUTCFn()
	expiresAt := now.Add(adminEmailChangeTTL)
	resolvedLocale := newsletterpkg.ResolveLocale(locale, "")
	confirmURL, err := buildAdminEmailChangeConfirmURL(siteURL, token, resolvedLocale)
	if err != nil {
		return nil, apperrors.Config("admin email change confirm url is invalid", err)
	}

	pending := domain.AdminPendingEmailChange{
		NewEmail:    resolvedEmail,
		TokenHash:   hashValue(token),
		Locale:      resolvedLocale,
		RequestedAt: now,
		ExpiresAt:   expiresAt,
	}

	if err := adminUsersRepository.SetPendingEmailChangeByID(ctx, userRecord.ID, pending); err != nil {
		if errors.Is(err, repository.ErrAdminUserNotFound) {
			return nil, apperrors.Unauthorized("admin authentication required")
		}
		return nil, apperrors.Internal("failed to store admin email change request", err)
	}

	if err := sendAdminEmailChangeConfirmationEmailFn(mailCfg, resolvedEmail, confirmURL, resolvedLocale, siteURL); err != nil {
		_ = adminUsersRepository.ClearPendingEmailChangeByID(ctx, userRecord.ID)
		return nil, apperrors.ServiceUnavailable("failed to send email change confirmation", err)
	}

	_ = sendAdminEmailChangeNoticeEmailFn(mailCfg, userRecord.Email, resolvedLocale, siteURL)

	return &AdminEmailChangeRequestResult{
		Success:      true,
		PendingEmail: resolvedEmail,
		ExpiresAt:    expiresAt,
	}, nil
}

func ConfirmAdminEmailChange(
	ctx context.Context,
	token string,
	localeHint string,
) (*AdminEmailChangeConfirmResult, error) {
	resolvedToken := strings.TrimSpace(token)
	resolvedLocale := newsletterpkg.ResolveLocale(localeHint, "")
	if resolvedToken == "" {
		return &AdminEmailChangeConfirmResult{
			Status: string(adminmailpkg.StatusInvalidLink),
			Locale: resolvedLocale,
		}, nil
	}

	userRecord, err := adminUsersRepository.FindByPendingEmailChangeTokenHash(ctx, hashValue(resolvedToken))
	if err != nil {
		return nil, apperrors.Internal("failed to load admin email change request", err)
	}
	if userRecord == nil || userRecord.PendingEmailChange == nil {
		return &AdminEmailChangeConfirmResult{
			Status: string(adminmailpkg.StatusInvalidLink),
			Locale: resolvedLocale,
		}, nil
	}

	pending := userRecord.PendingEmailChange
	if pending.Locale != "" {
		resolvedLocale = newsletterpkg.ResolveLocale(pending.Locale, "")
	}

	now := nowUTCFn()
	if now.After(pending.ExpiresAt) {
		if clearErr := adminUsersRepository.ClearPendingEmailChangeByID(ctx, userRecord.ID); clearErr != nil &&
			!errors.Is(clearErr, repository.ErrAdminUserNotFound) {
			return nil, apperrors.Internal("failed to clear expired admin email change request", clearErr)
		}
		return &AdminEmailChangeConfirmResult{
			Status: string(adminmailpkg.StatusExpired),
			Locale: resolvedLocale,
		}, nil
	}

	if err := adminUsersRepository.UpdateEmailByID(ctx, userRecord.ID, pending.NewEmail); err != nil {
		if errors.Is(err, repository.ErrAdminEmailAlreadyExists) {
			_ = adminUsersRepository.ClearPendingEmailChangeByID(ctx, userRecord.ID)
			return &AdminEmailChangeConfirmResult{
				Status: string(adminmailpkg.StatusFailed),
				Locale: resolvedLocale,
			}, nil
		}
		if errors.Is(err, repository.ErrAdminUserNotFound) {
			return &AdminEmailChangeConfirmResult{
				Status: string(adminmailpkg.StatusInvalidLink),
				Locale: resolvedLocale,
			}, nil
		}
		return nil, apperrors.Internal("failed to update admin email", err)
	}

	if err := adminRefreshTokensRepository.RevokeAllByUserID(ctx, userRecord.ID, now); err != nil {
		return nil, toAdminSessionError(err)
	}

	return &AdminEmailChangeConfirmResult{
		Status: string(adminmailpkg.StatusSuccess),
		Locale: resolvedLocale,
	}, nil
}

func ChangeAdminName(ctx context.Context, adminUser *domain.AdminUser, name string) (*domain.AdminUser, error) {
	if adminUser == nil || strings.TrimSpace(adminUser.ID) == "" {
		return nil, apperrors.Unauthorized("admin authentication required")
	}

	userRecord, err := adminUsersRepository.FindByID(ctx, adminUser.ID)
	if err != nil {
		return nil, apperrors.Internal("failed to load admin user", err)
	}
	if userRecord == nil {
		return nil, apperrors.Unauthorized("admin authentication required")
	}

	resolvedName := strings.TrimSpace(name)
	if len(resolvedName) < minAdminNameLength || len(resolvedName) > maxAdminNameLength {
		return nil, apperrors.BadRequest("name must be between 2 and 80 characters")
	}

	if err := adminUsersRepository.UpdateNameByID(ctx, userRecord.ID, resolvedName); err != nil {
		if errors.Is(err, repository.ErrAdminUserNotFound) {
			return nil, apperrors.Unauthorized("admin authentication required")
		}
		return nil, apperrors.Internal("failed to update admin name", err)
	}

	updatedUserRecord, err := adminUsersRepository.FindByID(ctx, userRecord.ID)
	if err != nil {
		return nil, apperrors.Internal("failed to load admin user", err)
	}
	if updatedUserRecord == nil {
		return nil, apperrors.Unauthorized("admin authentication required")
	}

	return &updatedUserRecord.AdminUser, nil
}

func ChangeAdminAvatar(ctx context.Context, adminUser *domain.AdminUser, avatarURL *string) (*domain.AdminUser, error) {
	if adminUser == nil || strings.TrimSpace(adminUser.ID) == "" {
		return nil, apperrors.Unauthorized("admin authentication required")
	}

	userRecord, err := adminUsersRepository.FindByID(ctx, adminUser.ID)
	if err != nil {
		return nil, apperrors.Internal("failed to load admin user", err)
	}
	if userRecord == nil {
		return nil, apperrors.Unauthorized("admin authentication required")
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
				return nil, apperrors.Unauthorized("admin authentication required")
			}
			return nil, apperrors.Internal("failed to update admin avatar", err)
		}

		updatedUserRecord, err := adminUsersRepository.FindByID(ctx, userRecord.ID)
		if err != nil {
			return nil, apperrors.Internal("failed to load admin user", err)
		}
		if updatedUserRecord == nil {
			return nil, apperrors.Unauthorized("admin authentication required")
		}

		return &updatedUserRecord.AdminUser, nil
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
			return nil, apperrors.Unauthorized("admin authentication required")
		}
		return nil, apperrors.Internal("failed to update admin avatar", err)
	}

	updatedUserRecord, err := adminUsersRepository.FindByID(ctx, userRecord.ID)
	if err != nil {
		return nil, apperrors.Internal("failed to load admin user", err)
	}
	if updatedUserRecord == nil {
		return nil, apperrors.Unauthorized("admin authentication required")
	}

	return &updatedUserRecord.AdminUser, nil
}

func DeleteAdminAccount(ctx context.Context, adminUser *domain.AdminUser, currentPassword string) error {
	if adminUser == nil || strings.TrimSpace(adminUser.ID) == "" {
		return apperrors.Unauthorized("admin authentication required")
	}

	if strings.TrimSpace(currentPassword) == "" {
		return apperrors.BadRequest("current password is required")
	}

	userRecord, err := adminUsersRepository.FindByID(ctx, adminUser.ID)
	if err != nil {
		return apperrors.Internal("failed to load admin user", err)
	}
	if userRecord == nil {
		return apperrors.Unauthorized("admin authentication required")
	}

	if err := verifyAdminPassword(userRecord, currentPassword); err != nil {
		return apperrors.BadRequest("current password is incorrect")
	}

	if err := adminUsersRepository.DisableByID(ctx, userRecord.ID); err != nil {
		if errors.Is(err, repository.ErrAdminUserNotFound) {
			return apperrors.Unauthorized("admin authentication required")
		}
		return apperrors.Internal("failed to disable admin account", err)
	}

	if err := adminRefreshTokensRepository.RevokeAllByUserID(ctx, userRecord.ID, time.Now().UTC()); err != nil {
		return toAdminSessionError(err)
	}

	return nil
}

func ListActiveAdminSessions(ctx context.Context, adminUser *domain.AdminUser) ([]domain.AdminSessionRecord, error) {
	if adminUser == nil || strings.TrimSpace(adminUser.ID) == "" {
		return nil, apperrors.Unauthorized("admin authentication required")
	}

	sessions, err := adminRefreshTokensRepository.ListActiveByUserID(ctx, adminUser.ID, time.Now().UTC(), maxActiveAdminSessions)
	if err != nil {
		return nil, toAdminSessionError(err)
	}

	return sessions, nil
}

func RevokeAdminSession(ctx context.Context, adminUser *domain.AdminUser, sessionID string) (bool, error) {
	if adminUser == nil || strings.TrimSpace(adminUser.ID) == "" {
		return false, apperrors.Unauthorized("admin authentication required")
	}

	resolvedSessionID := strings.TrimSpace(sessionID)
	if resolvedSessionID == "" {
		return false, apperrors.BadRequest("session id is required")
	}

	revoked, err := adminRefreshTokensRepository.RevokeByJTIAndUserID(ctx, resolvedSessionID, adminUser.ID, time.Now().UTC())
	if err != nil {
		return false, toAdminSessionError(err)
	}

	return revoked, nil
}

func RevokeAllAdminSessions(ctx context.Context, adminUser *domain.AdminUser) error {
	if adminUser == nil || strings.TrimSpace(adminUser.ID) == "" {
		return apperrors.Unauthorized("admin authentication required")
	}

	if err := adminRefreshTokensRepository.RevokeAllByUserID(ctx, adminUser.ID, time.Now().UTC()); err != nil {
		return toAdminSessionError(err)
	}

	return nil
}

func ResolveAdminFromAccessToken(ctx context.Context, token string) (*domain.AdminUser, error) {
	config := appconfig.ResolveAdminConfig()
	if strings.TrimSpace(config.JWTSecret) == "" {
		return nil, nil
	}

	claims, err := httpauth.VerifyHS256JWT(token, config.JWTSecret, "access", time.Now().UTC())
	if err != nil {
		if errors.Is(err, httpauth.ErrInvalidJWT) || errors.Is(err, httpauth.ErrExpiredJWT) || errors.Is(err, httpauth.ErrUnsupportedJWT) {
			return nil, nil
		}
		return nil, err
	}

	resolvedSubject := strings.TrimSpace(claims.Subject)
	userRecord, err := adminUsersRepository.FindByID(ctx, resolvedSubject)
	if err != nil {
		return nil, err
	}
	// Backward compatibility for access tokens issued before `sub=userId`.
	if userRecord == nil {
		userRecord, err = adminUsersRepository.FindByUsername(ctx, resolvedSubject)
		if err != nil {
			return nil, err
		}
	}
	// Backward compatibility for legacy `sub=username` tokens after username changes.
	if userRecord == nil {
		resolvedEmail := strings.TrimSpace(strings.ToLower(claims.Email))
		if resolvedEmail != "" {
			userRecord, err = adminUsersRepository.FindByEmail(ctx, resolvedEmail)
			if err != nil {
				return nil, err
			}
		}
	}
	if userRecord == nil {
		return nil, nil
	}
	if claims.PasswordVersion != userRecord.PasswordVersion {
		return nil, nil
	}

	return &userRecord.AdminUser, nil
}

func issueAdminTokens(
	ctx context.Context,
	config appconfig.AdminConfig,
	userRecord *domain.AdminUserRecord,
	currentRefreshJTI string,
	rememberMe bool,
	metadata AdminSessionMetadata,
) (*AdminAuthResponse, error) {
	adminID := strings.TrimSpace(userRecord.ID)
	if adminID == "" {
		return nil, apperrors.Config("admin id is not configured", nil)
	}

	now := time.Now().UTC()
	refreshTTL := config.RefreshTTL
	if rememberMe {
		refreshTTL = config.RememberRefreshTTL
	}
	accessToken, err := httpauth.IssueHS256JWT(
		httpauth.JWTClaims{
			Subject:         adminID,
			Email:           userRecord.Email,
			Roles:           append([]string{}, userRecord.Roles...),
			PasswordVersion: userRecord.PasswordVersion,
			Type:            "access",
			Issuer:          config.JWTIssuer,
			Audience:        config.JWTAudience,
			IssuedAt:        now.Unix(),
			ExpiresAt:       now.Add(config.AccessTTL).Unix(),
		},
		config.JWTSecret,
	)
	if err != nil {
		return nil, apperrors.Internal("failed to issue admin access token", err)
	}

	refreshJTI, err := httpauth.GenerateOpaqueToken(32)
	if err != nil {
		return nil, apperrors.Internal("failed to issue admin refresh token", err)
	}

	refreshToken, err := httpauth.IssueHS256JWT(
		httpauth.JWTClaims{
			ID:              refreshJTI,
			Subject:         adminID,
			Email:           userRecord.Email,
			Roles:           append([]string{}, userRecord.Roles...),
			PasswordVersion: userRecord.PasswordVersion,
			Type:            "refresh",
			Issuer:          config.JWTIssuer,
			Audience:        config.JWTAudience,
			IssuedAt:        now.Unix(),
			ExpiresAt:       now.Add(refreshTTL).Unix(),
		},
		config.JWTSecret,
	)
	if err != nil {
		return nil, apperrors.Internal("failed to issue admin refresh token", err)
	}

	refreshRecord := domain.AdminRefreshTokenRecord{
		JTI:         refreshJTI,
		UserID:      userRecord.ID,
		TokenHash:   repository.HashAdminRefreshToken(refreshToken),
		Persistent:  rememberMe,
		UserAgent:   strings.TrimSpace(metadata.UserAgent),
		RemoteIP:    strings.TrimSpace(metadata.RemoteIP),
		CountryCode: strings.TrimSpace(metadata.CountryCode),
		LastSeenAt:  now,
		ExpiresAt:   now.Add(refreshTTL),
		CreatedAt:   now,
	}

	if strings.TrimSpace(currentRefreshJTI) == "" {
		if err := adminRefreshTokensRepository.Create(ctx, refreshRecord); err != nil {
			return nil, toAdminSessionError(err)
		}
	} else {
		if err := adminRefreshTokensRepository.Rotate(ctx, currentRefreshJTI, refreshRecord, now); err != nil {
			if errors.Is(err, repository.ErrAdminRefreshTokenNotFound) {
				return nil, apperrors.Unauthorized("invalid admin session")
			}
			return nil, toAdminSessionError(err)
		}
	}

	return &AdminAuthResponse{
		Success:      true,
		User:         &userRecord.AdminUser,
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		RememberMe:   rememberMe,
		RefreshTTL:   refreshTTL,
	}, nil
}

func buildAdminEmailChangeConfirmURL(siteURL, token, locale string) (string, error) {
	parsed, err := url.Parse(siteURL)
	if err != nil || parsed.Scheme == "" || parsed.Host == "" {
		return "", errors.New("invalid SITE_URL")
	}

	parsed.Path = strings.TrimRight(parsed.Path, "/") + "/api/admin-email-change/confirm"
	query := parsed.Query()
	query.Set("token", strings.TrimSpace(token))
	query.Set("locale", newsletterpkg.ResolveLocale(locale, ""))
	parsed.RawQuery = query.Encode()

	return parsed.String(), nil
}

func sendAdminEmailChangeConfirmationEmail(
	cfg appconfig.MailConfig,
	recipientEmail,
	confirmURL,
	locale,
	siteURL string,
) error {
	subject, htmlBody, err := adminmailpkg.ConfirmationEmail(locale, confirmURL, siteURL)
	if err != nil {
		return fmt.Errorf("build admin email change confirmation email failed: %w", err)
	}

	return newsletterpkg.SendHTMLEmail(cfg, recipientEmail, subject, htmlBody, nil)
}

func sendAdminEmailChangeNoticeEmail(
	cfg appconfig.MailConfig,
	recipientEmail,
	locale,
	siteURL string,
) error {
	subject, htmlBody, err := adminmailpkg.ChangeRequestedNoticeEmail(locale, siteURL)
	if err != nil {
		return fmt.Errorf("build admin email change notice email failed: %w", err)
	}

	return newsletterpkg.SendHTMLEmail(cfg, recipientEmail, subject, htmlBody, nil)
}

func verifyAdminPassword(userRecord *domain.AdminUserRecord, rawPassword string) error {
	if userRecord == nil {
		return errors.New("missing admin user")
	}

	if strings.TrimSpace(userRecord.PasswordHash) == "" {
		return errors.New("missing admin password hash")
	}

	return bcrypt.CompareHashAndPassword([]byte(userRecord.PasswordHash), []byte(rawPassword))
}

type decodedAdminAvatarPayload struct {
	ContentType string
	Data        []byte
}

func decodeAdminAvatarDataURL(value string) (*decodedAdminAvatarPayload, error) {
	if strings.TrimSpace(value) == "" {
		return nil, apperrors.BadRequest("avatar image is required")
	}

	commaIndex := strings.IndexByte(value, ',')
	if commaIndex <= 0 || commaIndex == len(value)-1 {
		return nil, apperrors.BadRequest("avatar must be a valid base64 image")
	}

	mediaHeader := strings.ToLower(strings.TrimSpace(value[:commaIndex]))
	contentType := ""
	switch mediaHeader {
	case "data:image/png;base64":
		contentType = "image/png"
	case "data:image/jpeg;base64", "data:image/jpg;base64":
		contentType = "image/jpeg"
	case "data:image/webp;base64":
		contentType = "image/webp"
	default:
		return nil, apperrors.BadRequest("avatar format must be png, jpeg, jpg, or webp")
	}

	encodedPayload := strings.TrimSpace(value[commaIndex+1:])
	decodedPayload, err := base64.StdEncoding.DecodeString(encodedPayload)
	if err != nil {
		return nil, apperrors.BadRequest("avatar must be a valid base64 image")
	}
	if len(decodedPayload) == 0 {
		return nil, apperrors.BadRequest("avatar image is required")
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
		return nil, apperrors.BadRequest("avatar image is required")
	}

	sourceImage, _, err := image.Decode(bytes.NewReader(decodedPayload))
	if err != nil {
		return nil, apperrors.BadRequest("avatar must be a valid base64 image")
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
	if targetContentType == "image/jpeg" {
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
	case "image/png":
		encoder := png.Encoder{CompressionLevel: png.DefaultCompression}
		return encoder.Encode(buffer, destinationImage)
	case "image/webp":
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
	case "image/png":
		return "image/png"
	case "image/webp":
		return "image/webp"
	default:
		return "image/jpeg"
	}
}

type AdminAvatarAsset struct {
	ContentType string
	Data        []byte
	ETag        string
}

func ResolveAdminAvatarAsset(
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
		return nil, apperrors.Internal("failed to load admin user", err)
	}
	if userRecord == nil {
		return nil, apperrors.New("NOT_FOUND", "avatar not found", 404, nil)
	}

	currentDigest := strings.TrimSpace(userRecord.AvatarDigest)
	if currentDigest == "" || userRecord.AvatarVersion <= 0 {
		return nil, apperrors.New("NOT_FOUND", "avatar not found", 404, nil)
	}

	resolvedDigest := strings.TrimSpace(digest)
	if resolvedDigest == "" || version <= 0 {
		return nil, apperrors.New("NOT_FOUND", "avatar not found", 404, nil)
	}
	if !strings.EqualFold(resolvedDigest, currentDigest) {
		return nil, apperrors.New("NOT_FOUND", "avatar not found", 404, nil)
	}
	if version != userRecord.AvatarVersion {
		return nil, apperrors.New("NOT_FOUND", "avatar not found", 404, nil)
	}

	avatarRecord, err := adminAvatarRepository.FindByUserID(ctx, resolvedUserID)
	if err != nil {
		return nil, apperrors.Internal("failed to load avatar asset", err)
	}
	if avatarRecord == nil {
		return nil, apperrors.New("NOT_FOUND", "avatar not found", 404, nil)
	}
	if strings.TrimSpace(avatarRecord.Digest) != currentDigest || avatarRecord.Version != userRecord.AvatarVersion {
		return nil, apperrors.New("NOT_FOUND", "avatar not found", 404, nil)
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

func toAdminSessionError(err error) error {
	if errors.Is(err, repository.ErrAdminRefreshTokenRepositoryUnavailable) {
		return apperrors.ServiceUnavailable("admin session storage is unavailable", err)
	}

	return apperrors.Internal("failed to manage admin session", err)
}
