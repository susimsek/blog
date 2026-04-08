package service

import (
	"context"
	"errors"
	"regexp"
	"strings"
	"time"

	appconfig "suaybsimsek.com/blog-api/internal/config"
	"suaybsimsek.com/blog-api/internal/domain"
	"suaybsimsek.com/blog-api/internal/repository"
	"suaybsimsek.com/blog-api/pkg/apperrors"
	"suaybsimsek.com/blog-api/pkg/httpauth"

	"golang.org/x/crypto/bcrypt"
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

type AdminPasswordResetValidationResult struct {
	Status string
	Locale string
}

type AdminPasswordResetResult struct {
	Success bool
	Locale  string
}

const (
	minAdminPasswordLength                = 8
	maxActiveAdminSessions                = 20
	minAdminUsernameLength                = 3
	maxAdminUsernameLength                = 32
	minAdminNameLength                    = 2
	maxAdminNameLength                    = 80
	maxAdminAvatarBytes                   = 2 * 1024 * 1024
	minAdminAvatarSize                    = 16
	maxAdminAvatarSize                    = 1024
	adminAvatarDefaultSize                = 256
	adminEmailChangeTTL                   = time.Hour
	adminPasswordResetTTL                 = time.Hour
	adminAuthRequiredMessage              = "admin authentication required"
	adminLoadAdminUserMessage             = "failed to load admin user"
	adminCurrentPasswordIncorrectMessage  = "current password is incorrect"
	adminPasswordResetTokenInvalidMessage = "password reset token is invalid"
	adminAvatarImageRequiredMessage       = "avatar image is required"
	adminAvatarBase64InvalidMessage       = "avatar must be a valid base64 image"
	adminAvatarNotFoundMessage            = "avatar not found"
	adminAvatarContentTypeJPEG            = "image/jpeg"
	adminAvatarContentTypePNG             = "image/png"
	adminAvatarContentTypeWEBP            = "image/webp"
)

var adminUsernamePattern = regexp.MustCompile(`^[A-Za-z0-9._-]+$`)

var (
	adminUsersRepository                    repository.AdminUserRepository         = repository.NewAdminUserRepository()
	adminRefreshTokensRepository            repository.AdminRefreshTokenRepository = repository.NewAdminRefreshTokenMongoRepository()
	adminAvatarRepository                   repository.AdminAvatarRepository       = repository.NewAdminAvatarRepository()
	sendAdminEmailChangeConfirmationEmailFn                                        = sendAdminEmailChangeConfirmationEmail
	sendAdminEmailChangeNoticeEmailFn                                              = sendAdminEmailChangeNoticeEmail
	sendAdminPasswordResetEmailFn                                                  = sendAdminPasswordResetEmail
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
		return nil, apperrors.Internal(adminLoadAdminUserMessage, err)
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
		return nil, apperrors.Internal(adminLoadAdminUserMessage, err)
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
	if err := requireAdminAuthentication(adminUser); err != nil {
		return err
	}

	userRecord, err := loadAdminUserRecord(ctx, adminUser.ID)
	if err != nil {
		return err
	}
	if err := validateAdminCurrentPassword(userRecord, currentPassword); err != nil {
		return err
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
			return apperrors.Unauthorized(adminAuthRequiredMessage)
		}
		return apperrors.Internal("failed to update admin password", err)
	}

	if err := adminRefreshTokensRepository.RevokeAllByUserID(ctx, userRecord.ID, time.Now().UTC()); err != nil {
		return toAdminSessionError(err)
	}

	return nil
}

func requireAdminAuthentication(adminUser *domain.AdminUser) error {
	if adminUser == nil || strings.TrimSpace(adminUser.ID) == "" {
		return apperrors.Unauthorized(adminAuthRequiredMessage)
	}

	return nil
}

func loadAdminUserRecord(ctx context.Context, adminUserID string) (*domain.AdminUserRecord, error) {
	userRecord, err := adminUsersRepository.FindByID(ctx, adminUserID)
	if err != nil {
		return nil, apperrors.Internal(adminLoadAdminUserMessage, err)
	}
	if userRecord == nil {
		return nil, apperrors.Unauthorized(adminAuthRequiredMessage)
	}

	return userRecord, nil
}

func reloadAdminUser(ctx context.Context, adminUserID string) (*domain.AdminUser, error) {
	updatedUserRecord, err := loadAdminUserRecord(ctx, adminUserID)
	if err != nil {
		return nil, err
	}

	return &updatedUserRecord.AdminUser, nil
}

func validateAdminCurrentPassword(userRecord *domain.AdminUserRecord, currentPassword string) error {
	if err := verifyAdminPassword(userRecord, currentPassword); err != nil {
		return apperrors.BadRequest(adminCurrentPasswordIncorrectMessage)
	}

	return nil
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

func verifyAdminPassword(userRecord *domain.AdminUserRecord, rawPassword string) error {
	if userRecord == nil {
		return errors.New("missing admin user")
	}

	if strings.TrimSpace(userRecord.PasswordHash) == "" {
		return errors.New("missing admin password hash")
	}

	return bcrypt.CompareHashAndPassword([]byte(userRecord.PasswordHash), []byte(rawPassword))
}

func toAdminSessionError(err error) error {
	if errors.Is(err, repository.ErrAdminRefreshTokenRepositoryUnavailable) {
		return apperrors.ServiceUnavailable("admin session storage is unavailable", err)
	}

	return apperrors.Internal("failed to manage admin session", err)
}
